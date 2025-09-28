/**
 * NestJSLogger 单元测试
 *
 * @description 测试 NestJSLogger 类的功能
 * 包括 NestJS LoggerService 接口兼容性和日志级别映射
 */

import { NestJSLogger } from './nestjs-logger';
import { PinoLogger } from './pino-logger';

describe('NestJSLogger', () => {
  let nestjsLogger: NestJSLogger;
  let fastifyLogger: PinoLogger;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // 创建 NestJSLogger 实例
    nestjsLogger = new NestJSLogger({ level: 'trace' });
    fastifyLogger = nestjsLogger.getPinoLogger();
    
    // 模拟 process.stdout.write 输出（Pino 使用 stdout）
    consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('构造函数', () => {
    it('应该使用 PinoLogger 创建实例', () => {
      expect(nestjsLogger).toBeDefined();
      expect((nestjsLogger as any)['fastifyLogger']).toBeDefined();
    });
  });

  describe('NestJS LoggerService 接口', () => {
    it('应该实现 log 方法', () => {
      nestjsLogger.log('test message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 log 方法并支持上下文', () => {
      nestjsLogger.log('test message', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 error 方法', () => {
      nestjsLogger.error('error message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 error 方法并支持追踪信息', () => {
      nestjsLogger.error('error message', 'error trace', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 warn 方法', () => {
      nestjsLogger.warn('warn message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 warn 方法并支持上下文', () => {
      nestjsLogger.warn('warn message', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 debug 方法', () => {
      nestjsLogger.debug('debug message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 debug 方法并支持上下文', () => {
      nestjsLogger.debug('debug message', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 verbose 方法', () => {
      nestjsLogger.verbose('verbose message');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该实现 verbose 方法并支持上下文', () => {
      nestjsLogger.verbose('verbose message', 'TestContext');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('日志级别映射', () => {
    it('log 方法应该映射到 info 级别', () => {
      const infoSpy = jest.spyOn(fastifyLogger, 'info');
      nestjsLogger.log('test message');
      expect(infoSpy).toHaveBeenCalledWith('test message');
    });

    it('verbose 方法应该映射到 trace 级别', () => {
      const traceSpy = jest.spyOn(fastifyLogger, 'trace');
      nestjsLogger.verbose('test message');
      expect(traceSpy).toHaveBeenCalledWith('test message');
    });

    it('debug 方法应该映射到 debug 级别', () => {
      const debugSpy = jest.spyOn(fastifyLogger, 'debug');
      nestjsLogger.debug('test message');
      expect(debugSpy).toHaveBeenCalledWith('test message');
    });

    it('warn 方法应该映射到 warn 级别', () => {
      const warnSpy = jest.spyOn(fastifyLogger, 'warn');
      nestjsLogger.warn('test message');
      expect(warnSpy).toHaveBeenCalledWith('test message');
    });

    it('error 方法应该映射到 error 级别', () => {
      const errorSpy = jest.spyOn(fastifyLogger, 'error');
      nestjsLogger.error('test message');
      expect(errorSpy).toHaveBeenCalledWith({ message: 'test message' });
    });
  });

  describe('上下文处理', () => {
    it('应该正确处理带上下文的日志', () => {
      const infoSpy = jest.spyOn(fastifyLogger, 'info');
      nestjsLogger.log('test message', 'TestContext');
      expect(infoSpy).toHaveBeenCalledWith('test message', { context: 'TestContext' });
    });

    it('应该正确处理带追踪信息的错误日志', () => {
      const errorSpy = jest.spyOn(fastifyLogger, 'error');
      nestjsLogger.error('error message', 'TestContext', 'error trace');
      expect(errorSpy).toHaveBeenCalledWith({ message: 'error message', context: 'TestContext', trace: 'error trace' });
    });
  });

  describe('内部 PinoLogger 访问', () => {
    it('应该提供获取内部 PinoLogger 的方法', () => {
      const internalLogger = nestjsLogger.getPinoLogger();
      expect(internalLogger).toBeDefined();
      expect(internalLogger).toBeInstanceOf(PinoLogger);
    });
  });
});
