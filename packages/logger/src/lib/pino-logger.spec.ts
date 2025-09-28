/**
 * PinoLogger 单元测试
 *
 * @description 测试 PinoLogger 类的核心功能
 * 包括日志记录、上下文绑定、性能监控等功能
 */

import { PinoLogger } from './pino-logger';
import { LoggerConfig } from './types';

describe('PinoLogger', () => {
  let logger: PinoLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // 创建测试用的日志配置
    const config: LoggerConfig = {
      level: 'trace', // 设置为 trace 级别以允许所有日志输出
      destination: { type: 'console' }
    };
    
    logger = new PinoLogger(config);
    
    // 模拟 process.stdout.write 输出（Pino 使用 stdout）
    consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('构造函数', () => {
    it('应该使用默认配置创建实例', () => {
      const defaultLogger = new PinoLogger();
      expect(defaultLogger).toBeDefined();
    });

    it('应该使用自定义配置创建实例', () => {
      const config: LoggerConfig = {
        level: 'debug',
        destination: { type: 'file', path: './test.log' }
      };
      const customLogger = new PinoLogger(config);
      expect(customLogger).toBeDefined();
    });
  });

  describe('日志级别方法', () => {
    it('应该记录 trace 级别日志', () => {
      logger.trace('trace message', { data: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录 debug 级别日志', () => {
      logger.debug('debug message', { data: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录 info 级别日志', () => {
      logger.info('info message', { data: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录 warn 级别日志', () => {
      logger.warn('warn message', { data: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录 error 级别日志', () => {
      logger.error('error message', { data: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录 fatal 级别日志', () => {
      logger.fatal('fatal message', { data: 'test' });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('上下文绑定', () => {
    it('应该设置请求上下文', () => {
      const context = {
        requestId: 'req-123',
        userId: 'user-456',
        metadata: { service: 'test' }
      };
      
      logger.setContext(context);
      logger.info('test message');
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该更新请求上下文', () => {
      const initialContext = {
        requestId: 'req-123',
        userId: 'user-456'
      };
      
      const updatedContext = {
        requestId: 'req-123',
        userId: 'user-789',
        metadata: { operation: 'update' }
      };
      
      logger.setContext(initialContext);
      logger.setContext(updatedContext);
      logger.info('test message');
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('性能监控', () => {
    it('应该记录方法执行时间', async () => {
      await logger.measureTime('test-operation', async () => {
        // 模拟异步操作
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'result';
      });
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录方法执行错误', async () => {
      await expect(
        logger.measureTime('test-operation', async () => {
          throw new Error('test error');
        })
      ).rejects.toThrow('test error');
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该记录错误信息', () => {
      const error = new Error('test error');
      logger.logError('operation failed', error);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录错误堆栈', () => {
      const error = new Error('test error');
      error.stack = 'Error: test error\n    at test';
      
      logger.logError('operation failed', error);
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('日志级别控制', () => {
    it('应该设置日志级别', () => {
      logger.setLevel('debug');
      expect(logger.getLevel()).toBe('debug');
    });

    it('应该根据级别过滤日志', () => {
      logger.setLevel('warn');
      
      // 这些日志应该被过滤掉
      logger.trace('trace message');
      logger.debug('debug message');
      logger.info('info message');
      
      // 这个日志应该被记录
      logger.warn('warn message');
      
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('NestJS 兼容性', () => {
    it('应该支持 NestJS log 方法', () => {
      logger.log('NestJS log message', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该支持 NestJS verbose 方法', () => {
      logger.verbose('NestJS verbose message', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
