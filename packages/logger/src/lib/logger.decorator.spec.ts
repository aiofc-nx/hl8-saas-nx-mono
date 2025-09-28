/**
 * Logger Decorator 单元测试
 *
 * @description 测试日志装饰器的功能
 * 包括注入装饰器、方法装饰器、参数装饰器等
 */

import 'reflect-metadata';
import { PinoLogger } from './pino-logger';
import {
  InjectLogger,
  LogMethod,
  LogPerformance,
  LogError,
  RequestContext,
  LogLevel,
  LogContext,
  getLogger,
  updateRequestMetadata
} from './logger.decorator';

describe('Logger Decorators', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(process.stdout, 'write').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('InjectLogger', () => {
    it('应该注入日志记录器到类属性', () => {
      class TestService {
        @InjectLogger('TestService')
        private readonly logger!: PinoLogger;
      }

      const service = new TestService();
      expect(service['logger']).toBeDefined();
      expect(service['logger']).toBeInstanceOf(PinoLogger);
    });

    it('应该设置上下文', () => {
      class TestService {
        @InjectLogger('TestService')
        private readonly logger!: PinoLogger;
      }

      const service = new TestService();
      service['logger'].info('test message');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('LogMethod', () => {
    it('应该记录方法调用', async () => {
      class TestService {
        @LogMethod({ level: 'info', message: 'Method called' })
        async testMethod() {
          return 'result';
        }
      }

      const service = new TestService();
      const result = await service.testMethod();
      
      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录方法参数', async () => {
      class TestService {
        @LogMethod({ level: 'info', includeArgs: true })
        async testMethod(arg1: string, arg2: number) {
          return `${arg1}-${arg2}`;
        }
      }

      const service = new TestService();
      await service.testMethod('test', 123);
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录方法结果', async () => {
      class TestService {
        @LogMethod({ level: 'info', includeResult: true })
        async testMethod() {
          return { success: true };
        }
      }

      const service = new TestService();
      await service.testMethod();
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录方法错误', async () => {
      class TestService {
        @LogMethod({ level: 'error' })
        async testMethod() {
          throw new Error('test error');
        }
      }

      const service = new TestService();
      await expect(service.testMethod()).rejects.toThrow('test error');
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('LogPerformance', () => {
    it('应该记录方法执行时间', async () => {
      class TestService {
        @LogPerformance({ threshold: 10 })
        async testMethod() {
          await new Promise(resolve => setTimeout(resolve, 20));
          return 'result';
        }
      }

      const service = new TestService();
      const result = await service.testMethod();
      
      expect(result).toBe('result');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录内存使用情况', async () => {
      class TestService {
        @LogPerformance({ threshold: 10, includeMemory: true })
        async testMethod() {
          return 'result';
        }
      }

      const service = new TestService();
      await service.testMethod();
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该根据阈值调整日志级别', async () => {
      class TestService {
        @LogPerformance({ threshold: 5, level: 'info' })
        async slowMethod() {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'result';
        }
      }

      const service = new TestService();
      await service.slowMethod();
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('LogError', () => {
    it('应该记录错误并重新抛出', async () => {
      class TestService {
        @LogError({ level: 'error', includeStack: true })
        async testMethod() {
          throw new Error('test error');
        }
      }

      const service = new TestService();
      await expect(service.testMethod()).rejects.toThrow('test error');
      
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录错误但不重新抛出', async () => {
      class TestService {
        @LogError({ level: 'error', rethrow: false })
        async testMethod() {
          throw new Error('test error');
        }
      }

      const service = new TestService();
      const result = await service.testMethod();
      
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('应该记录错误参数', async () => {
      class TestService {
        @LogError({ level: 'error', includeArgs: true })
        async testMethod(arg: string) {
          throw new Error('test error');
        }
      }

      const service = new TestService();
      await expect(service.testMethod('test')).rejects.toThrow('test error');
      
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('RequestContext', () => {
    it('应该设置请求上下文元数据', () => {
      class TestService {
        async testMethod(@RequestContext('userId') userId: string) {
          return userId;
        }
      }

      const metadata = Reflect.getMetadata('requestContext', TestService.prototype, 'testMethod');
      expect(metadata).toBeDefined();
      expect(metadata[0]).toBe('userId');
    });
  });

  describe('LogLevel', () => {
    it('应该设置类级别的日志级别', () => {
      @LogLevel('debug')
      class TestService {
        async testMethod() {
          return 'result';
        }
      }

      const level = Reflect.getMetadata('logLevel', TestService);
      expect(level).toBe('debug');
    });

    it('应该设置方法级别的日志级别', () => {
      class TestService {
        @LogLevel('warn')
        async testMethod() {
          return 'result';
        }
      }

      const service = new TestService();
      const result = service.testMethod();
      
      expect(result).toBe('result');
    });
  });

  describe('LogContext', () => {
    it('应该设置类级别的日志上下文', () => {
      @LogContext({ service: 'TestService', version: '1.0.0' })
      class TestService {
        async testMethod() {
          return 'result';
        }
      }

      const context = Reflect.getMetadata('logContext', TestService);
      expect(context).toEqual({ service: 'TestService', version: '1.0.0' });
    });

    it('应该设置方法级别的日志上下文', () => {
      class TestService {
        @LogContext({ operation: 'testMethod' })
        async testMethod() {
          return 'result';
        }
      }

      const service = new TestService();
      const result = service.testMethod();
      
      expect(result).toBe('result');
    });
  });

  describe('getLogger', () => {
    it('应该创建带上下文的日志记录器', () => {
      const logger = getLogger('TestService');
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('应该创建不带上下文的日志记录器', () => {
      const logger = getLogger();
      expect(logger).toBeInstanceOf(PinoLogger);
    });
  });

  describe('updateRequestMetadata', () => {
    it('应该更新请求元数据', () => {
      const metadata = {
        operation: 'user-login',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      };

      expect(() => {
        updateRequestMetadata(metadata);
      }).not.toThrow();
    });
  });
});
