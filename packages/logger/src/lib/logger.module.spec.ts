/**
 * LoggerModule 单元测试
 *
 * @description 测试 LoggerModule 的配置和依赖注入功能
 * 包括同步配置、异步配置、提供者创建等功能
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LoggerModule } from './logger.module';
import { PinoLogger } from './pino-logger';
import { PinoLoggerMiddleware } from './fastify-middleware';
import { DI_TOKENS } from './constants';

describe('LoggerModule', () => {
  let module: TestingModule;

  describe('forRoot', () => {
    it('应该创建同步配置的模块', async () => {
      const config = {
        level: 'info' as const,
        destination: { type: 'console' as const }
      };

      module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot({ config })],
      }).compile();

      expect(module).toBeDefined();
    });

    it('应该提供 DI_TOKENS.LOGGER_PROVIDER 实例', async () => {
      const config = {
        level: 'debug' as const,
        destination: { type: 'console' as const }
      };

      module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot({ config })],
      }).compile();

      const logger = module.get<PinoLogger>(DI_TOKENS.LOGGER_PROVIDER);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('应该提供模块参数', async () => {
      const params = {
        config: {
          level: 'info' as const,
          destination: { type: 'console' as const }
        },
        enableRequestLogging: true,
        enableResponseLogging: true
      };

      module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot(params)],
      }).compile();

      const moduleParams = module.get(DI_TOKENS.MODULE_PARAMS);
      expect(moduleParams).toEqual(params);
    });

    it('应该提供中间件当启用请求日志时', async () => {
      const params = {
        config: {
          level: 'info' as const,
          destination: { type: 'console' as const }
        },
        enableRequestLogging: true,
        enableResponseLogging: true
      };

      module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot(params)],
      }).compile();

      const middleware = module.get<PinoLoggerMiddleware>('FASTIFY_LOGGER_MIDDLEWARE');
      expect(middleware).toBeDefined();
      expect(middleware).toBeInstanceOf(PinoLoggerMiddleware);
    });

    it('应该不提供中间件当未启用请求日志时', async () => {
      const params = {
        config: {
          level: 'info' as const,
          destination: { type: 'console' as const }
        },
        enableRequestLogging: false,
        enableResponseLogging: false
      };

      module = await Test.createTestingModule({
        imports: [LoggerModule.forRoot(params)],
      }).compile();

      expect(() => {
        module.get<PinoLoggerMiddleware>('FASTIFY_LOGGER_MIDDLEWARE');
      }).toThrow();
    });
  });

  describe('forRootAsync', () => {
    it('应该创建异步配置的模块', async () => {
      const useFactory = jest.fn().mockReturnValue({
        config: {
          level: 'info' as const,
          destination: { type: 'console' as const }
        }
      });

      module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRootAsync({
            useFactory,
            inject: []
          })
        ],
      }).compile();

      expect(module).toBeDefined();
      expect(useFactory).toHaveBeenCalled();
    });

    it('应该使用依赖注入', async () => {
      const mockService = { get: jest.fn().mockReturnValue('info') };
      const useFactory = jest.fn().mockReturnValue({
        config: {
          level: 'info' as const,
          destination: { type: 'console' as const }
        }
      });

      module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRootAsync({
            useFactory,
            inject: ['MOCK_SERVICE']
          })
        ],
        providers: [
          { provide: 'MOCK_SERVICE', useValue: mockService }
        ]
      }).compile();

      expect(useFactory).toHaveBeenCalledWith(mockService);
    });

    it('应该提供 DI_TOKENS.LOGGER_PROVIDER 实例', async () => {
      const useFactory = jest.fn().mockReturnValue({
        config: {
          level: 'debug' as const,
          destination: { type: 'console' as const }
        }
      });

      module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRootAsync({
            useFactory,
            inject: []
          })
        ],
      }).compile();

      const logger = module.get<PinoLogger>(DI_TOKENS.LOGGER_PROVIDER);
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(PinoLogger);
    });

    it('应该总是提供中间件', async () => {
      const useFactory = jest.fn().mockReturnValue({
        config: {
          level: 'info' as const,
          destination: { type: 'console' as const }
        }
      });

      module = await Test.createTestingModule({
        imports: [
          LoggerModule.forRootAsync({
            useFactory,
            inject: []
          })
        ],
      }).compile();

      const middleware = module.get<PinoLoggerMiddleware>('FASTIFY_LOGGER_MIDDLEWARE');
      expect(middleware).toBeDefined();
      expect(middleware).toBeInstanceOf(PinoLoggerMiddleware);
    });
  });

  describe('辅助函数', () => {
    it('应该创建日志提供者', () => {
      const config = {
        level: 'info' as const,
        destination: { type: 'console' as const }
      };

      // 测试通过 forRoot 方法创建提供者
      const module = LoggerModule.forRoot({ config });
      expect(module.providers).toBeDefined();
      expect(module.providers?.length).toBeGreaterThan(0);
    });

    it('应该创建中间件提供者', () => {
      const params = {
        config: {
          level: 'info' as const,
          destination: { type: 'console' as const }
        },
        enableRequestLogging: true,
        enableResponseLogging: true
      };

      // 测试通过 forRoot 方法创建中间件提供者
      const module = LoggerModule.forRoot(params);
      expect(module.providers).toBeDefined();
      expect(module.providers?.length).toBeGreaterThan(0);
    });
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });
});
