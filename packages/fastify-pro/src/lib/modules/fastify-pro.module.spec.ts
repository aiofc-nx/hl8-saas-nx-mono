/**
 * FastifyProModule 单元测试
 *
 * @description 测试Fastify-Pro模块的功能
 *
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyProModule,
  IFastifyProModuleConfig,
} from './fastify-pro.module';
import { HealthCheckService } from '../monitoring/health-check.service';

// 模拟NestJS装饰器
jest.mock('@nestjs/common', () => ({
  ...jest.requireActual('@nestjs/common'),
  Module: () => (target: unknown) => target,
}));

describe('FastifyProModule', () => {
  let module: TestingModule;

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('forRoot', () => {
    it('应该创建模块', () => {
      const config: IFastifyProModuleConfig = {
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
          enableMultiTenant: true,
        },
      };

      const dynamicModule = FastifyProModule.forRoot(config);

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(FastifyProModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.exports).toBeDefined();
    });

    it('应该处理空配置', () => {
      const dynamicModule = FastifyProModule.forRoot();

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(FastifyProModule);
    });

    it('应该处理部分配置', () => {
      const partialConfig: Partial<IFastifyProModuleConfig> = {
        enterprise: {
          enableHealthCheck: true,
        },
      };

      const dynamicModule = FastifyProModule.forRoot(partialConfig);

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(FastifyProModule);
    });
  });

  describe('forRootAsync', () => {
    it('应该创建异步模块', () => {
      const dynamicModule = FastifyProModule.forRootAsync({
        useFactory: () => ({
          enterprise: {
            enableHealthCheck: true,
            enablePerformanceMonitoring: true,
          },
        }),
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(FastifyProModule);
      expect(dynamicModule.providers).toBeDefined();
      expect(dynamicModule.imports).toBeDefined();
    });

    it('应该处理异步配置工厂', () => {
      const dynamicModule = FastifyProModule.forRootAsync({
        useFactory: async () => {
          return {
            enterprise: {
              enableHealthCheck: true,
              enableMultiTenant: true,
            },
          };
        },
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(FastifyProModule);
    });

    it('应该处理依赖注入', () => {
      const dynamicModule = FastifyProModule.forRootAsync({
        useFactory: (config: IFastifyProModuleConfig) => config,
        inject: ['FASTIFY_PRO_CONFIG'],
      });

      expect(dynamicModule).toBeDefined();
      expect(dynamicModule.module).toBe(FastifyProModule);
    });
  });

  describe('模块集成', () => {
    it('应该能够创建测试模块', async () => {
      const config: IFastifyProModuleConfig = {
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
        },
      };

      // 创建模拟Fastify实例
      const mockFastify = {
        addHook: jest.fn(),
        decorate: jest.fn(),
        hasDecorator: jest.fn().mockReturnValue(false),
        log: console,
        register: jest.fn(),
        route: jest.fn(),
        listen: jest.fn(),
        close: jest.fn(),
      };

      // 使用类型断言解决版本兼容性问题，并添加模拟提供者
      module = await Test.createTestingModule({
        imports: [FastifyProModule.forRoot(config) as any],
        providers: [
          {
            provide: 'FASTIFY_INSTANCE',
            useValue: mockFastify,
          },
          {
            provide: HealthCheckService,
            useFactory: () =>
              new HealthCheckService(mockFastify as any, {
                checkSystemResources: config.enterprise?.enableHealthCheck,
              }),
          },
        ],
      }).compile();

      expect(module).toBeDefined();
      expect(module.get(FastifyProModule)).toBeDefined();
    });

    it('应该能够创建异步测试模块', async () => {
      // 使用类型断言解决版本兼容性问题
      module = await Test.createTestingModule({
        imports: [
          FastifyProModule.forRootAsync({
            useFactory: () => ({
              enterprise: {
                enableHealthCheck: true,
              },
            }),
          }) as any,
        ],
      }).compile();

      expect(module).toBeDefined();
      expect(module.get(FastifyProModule)).toBeDefined();
    });
  });

  describe('配置验证', () => {
    it('应该处理开发环境配置', () => {
      const devConfig: IFastifyProModuleConfig = {
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: false,
          enableMultiTenant: false,
        },
      };

      const dynamicModule = FastifyProModule.forRoot(devConfig);
      expect(dynamicModule).toBeDefined();
    });

    it('应该处理生产环境配置', () => {
      const prodConfig: IFastifyProModuleConfig = {
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
          enableMultiTenant: true,
          tenantHeader: 'X-Tenant-ID',
          corsOptions: {
            origin: ['https://yourdomain.com'],
            credentials: true,
          },
        },
      };

      const dynamicModule = FastifyProModule.forRoot(prodConfig);
      expect(dynamicModule).toBeDefined();
    });

    it('应该处理API服务配置', () => {
      const apiConfig: IFastifyProModuleConfig = {
        enterprise: {
          enableHealthCheck: true,
          enablePerformanceMonitoring: true,
          enableMultiTenant: true,
          tenantHeader: 'X-Tenant-ID',
          corsOptions: {
            origin: [
              'https://app.yourdomain.com',
              'https://admin.yourdomain.com',
            ],
            credentials: true,
          },
        },
      };

      const dynamicModule = FastifyProModule.forRoot(apiConfig);
      expect(dynamicModule).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效配置', () => {
      const invalidConfig = {
        enterprise: {
          enableHealthCheck: 'invalid' as any,
        },
      };

      const dynamicModule = FastifyProModule.forRoot(invalidConfig);
      expect(dynamicModule).toBeDefined();
    });

    it('应该处理缺失配置', () => {
      const dynamicModule = FastifyProModule.forRoot({} as any);
      expect(dynamicModule).toBeDefined();
    });
  });
});
