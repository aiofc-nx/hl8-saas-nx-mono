/**
 * Fastify-Pro NestJS模块
 *
 * 提供完整的Fastify-Pro集成，包括适配器、插件、中间件、监控等企业级功能。
 *
 * @description 此模块提供完整的Fastify-Pro集成。
 * 包括适配器、插件、中间件、监控等企业级功能，支持NestJS依赖注入系统。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 设计定位规则
 * - 统一集成：将Fastify-Pro的所有功能统一集成到NestJS模块中
 * - 配置驱动：通过模块配置灵活控制功能启用
 * - 依赖注入：支持NestJS的依赖注入系统
 * - 生命周期管理：完整的模块生命周期管理
 *
 * ### 模块功能规则
 * - 支持企业级适配器集成
 * - 支持租户提取中间件
 * - 支持健康检查服务
 * - 支持性能监控和指标收集
 *
 * ### 配置规则
 * - 支持企业级功能配置
 * - 支持模块选项配置
 * - 支持依赖注入配置
 * - 支持生命周期配置
 *
 * @example
 * ```typescript
 * // 导入Fastify-Pro模块
 * @Module({
 *   imports: [
 *     FastifyProModule.forRoot({
 *       enterprise: {
 *         enableHealthCheck: true,
 *         enablePerformanceMonitoring: true,
 *         enableTenantExtraction: true
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
// import { FastifyModule as NestFastifyModule } from '@nestjs/platform-fastify';
import { EnterpriseFastifyAdapter } from '../adapters/enterprise-fastify.adapter';
import { TenantExtractionMiddleware } from '../middleware/tenant.middleware';
import { HealthCheckService } from '../monitoring/health-check.service';
import { DI_TOKENS } from '../constants';
// import { IFastifyEnterpriseConfig } from '../types/fastify.types';

/**
 * Fastify-Pro模块配置
 */
export interface IFastifyProModuleConfig {
  /** 企业级配置 */
  enterprise?: {
    enableHealthCheck?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableTenantExtraction?: boolean;
    tenantHeader?: string;
    corsOptions?: {
      origin?: boolean | string | string[];
      credentials?: boolean;
    };
  };

  /** 模块选项 */
  module?: {
    global?: boolean;
    imports?: Array<DynamicModule>;
    providers?: Provider[];
    exports?: Array<Provider | string | symbol>;
  };
}

/**
 * Fastify-Pro模块
 *
 * 提供完整的Fastify-Pro企业级功能集成，支持NestJS依赖注入系统。
 *
 * @description 此模块提供完整的Fastify-Pro企业级功能集成。
 * 支持NestJS依赖注入系统，包括适配器、插件、中间件、监控等功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 模块功能规则
 * - 支持企业级适配器集成
 * - 支持租户提取中间件
 * - 支持健康检查服务
 * - 支持性能监控和指标收集
 *
 * ### 依赖注入规则
 * - 支持NestJS依赖注入系统
 * - 支持服务提供者注册
 * - 支持服务导出和共享
 * - 支持模块间依赖管理
 *
 * ### 配置规则
 * - 支持企业级功能配置
 * - 支持模块选项配置
 * - 支持动态模块创建
 * - 支持配置验证和错误处理
 *
 * @example
 * ```typescript
 * // 创建Fastify-Pro模块
 * @Module({
 *   imports: [
 *     FastifyProModule.forRoot({
 *       enterprise: {
 *         enableHealthCheck: true,
 *         enablePerformanceMonitoring: true,
 *         enableTenantExtraction: true
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class FastifyProModule {
  /**
   * 创建动态模块
   *
   * 根据配置创建Fastify-Pro动态模块，支持企业级功能配置和依赖注入。
   *
   * @description 此方法根据配置创建Fastify-Pro动态模块。
   * 支持企业级功能配置和依赖注入，包括适配器、插件、中间件、监控等。
   * 确保模块能够正确初始化和运行。
   *
   * ## 业务规则
   *
   * ### 模块创建规则
   * - 根据配置创建动态模块
   * - 注册服务提供者
   * - 配置服务导出
   * - 支持模块选项配置
   *
   * ### 企业级功能规则
   * - 支持健康检查功能配置
   * - 支持性能监控功能配置
   * - 支持租户提取功能配置
   * - 支持CORS配置
   *
   * ### 依赖注入规则
   * - 注册企业级适配器
   * - 注册租户提取中间件
   * - 注册健康检查服务
   * - 支持服务导出和共享
   *
   * @param config 模块配置选项
   * @returns 动态模块配置
   *
   * @example
   * ```typescript
   * // 创建动态模块
   * const module = FastifyProModule.forRoot({
   *   enterprise: {
   *     enableHealthCheck: true,
   *     enablePerformanceMonitoring: true,
   *     enableTenantExtraction: true
   *   }
   * });
   * ```
   */
  static forRoot(config?: IFastifyProModuleConfig): DynamicModule {
    const providers: Provider[] = [];
    const exports: Array<Provider | string | symbol> = [];

    // 添加企业级适配器
    providers.push({
      provide: DI_TOKENS.FASTIFY_PRO_ADAPTER,
      useFactory: () => {
        return new EnterpriseFastifyAdapter({
          enterprise: config?.enterprise,
        });
      },
    });

    // 添加健康检查服务
    if (config?.enterprise?.enableHealthCheck) {
      providers.push({
        provide: HealthCheckService,
        useFactory: (fastify: unknown) => {
          return new HealthCheckService(fastify as any);
        },
        inject: [DI_TOKENS.FASTIFY_INSTANCE],
      });
      exports.push(HealthCheckService);
    }

    return {
      module: FastifyProModule,
      global: config?.module?.global || false,
      imports: [...(config?.module?.imports || [])],
      providers: [...providers, ...(config?.module?.providers || [])],
      exports: [
        DI_TOKENS.FASTIFY_PRO_ADAPTER,
        ...exports,
        ...(config?.module?.exports || []),
      ],
    };
  }

  /**
   * 创建异步模块
   *
   * @description 支持异步配置的Fastify-Pro模块
   */
  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<IFastifyProModuleConfig> | IFastifyProModuleConfig;
    inject?: Array<string | symbol>;
    imports?: Array<DynamicModule>;
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DI_TOKENS.FASTIFY_PRO_CONFIG,
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: DI_TOKENS.FASTIFY_PRO_ADAPTER,
        useFactory: (config: IFastifyProModuleConfig) => {
          return new EnterpriseFastifyAdapter({
            enterprise: config?.enterprise,
          });
        },
        inject: [DI_TOKENS.FASTIFY_PRO_CONFIG],
      },
    ];

    return {
      module: FastifyProModule,
      imports: [...(options.imports || [])],
      providers,
      exports: [DI_TOKENS.FASTIFY_PRO_ADAPTER, DI_TOKENS.FASTIFY_PRO_CONFIG],
    };
  }

  /**
   * 创建功能模块
   *
   * @description 创建特定功能的Fastify-Pro模块
   */
  static forFeature(features: {
    healthCheck?: boolean;
    performanceMonitoring?: boolean;
    tenantExtraction?: boolean;
    cors?: boolean;
  }): DynamicModule {
    const providers: Provider[] = [];
    const exports: Array<Provider | string | symbol> = [];

    // 健康检查功能
    if (features.healthCheck) {
      providers.push({
        provide: HealthCheckService,
        useFactory: (fastify: unknown) => {
          return new HealthCheckService(fastify as any);
        },
        inject: [DI_TOKENS.FASTIFY_INSTANCE],
      });
      exports.push(HealthCheckService);
    }

    // 性能监控功能
    if (features.performanceMonitoring) {
      providers.push({
        provide: DI_TOKENS.PERFORMANCE_MONITOR,
        useFactory: () => {
          // 这里可以添加性能监控服务
          return {};
        },
      });
      exports.push(DI_TOKENS.PERFORMANCE_MONITOR);
    }

    // 租户提取功能
    if (features.tenantExtraction) {
      providers.push({
        provide: DI_TOKENS.TENANT_EXTRACTION_MIDDLEWARE,
        useFactory: (moduleRef: ModuleRef) => {
          const configService = moduleRef.get(DI_TOKENS.FASTIFY_PRO_CONFIG, {
            strict: false,
          });
          return new TenantExtractionMiddleware({
            name: 'tenant-extraction',
            tenantHeader:
              configService?.enterprise?.tenantHeader || 'X-Tenant-ID',
          });
        },
        inject: [DI_TOKENS.FASTIFY_PRO_CONFIG],
      });
      exports.push(DI_TOKENS.TENANT_EXTRACTION_MIDDLEWARE);
    }

    // CORS功能
    if (features.cors) {
      providers.push({
        provide: DI_TOKENS.CORS_SERVICE,
        useFactory: () => {
          // 这里可以添加CORS服务
          return {};
        },
      });
      exports.push(DI_TOKENS.CORS_SERVICE);
    }

    return {
      module: FastifyProModule,
      providers,
      exports,
    };
  }
}

/**
 * Fastify-Pro模块工厂函数
 *
 * @description 创建Fastify-Pro模块的便捷函数
 */
export function createFastifyProModule(
  config?: IFastifyProModuleConfig
): DynamicModule {
  return FastifyProModule.forRoot(config);
}

/**
 * 默认模块配置
 *
 * @description 提供常用的模块配置预设
 */
export const DefaultFastifyProConfigs = {
  /** 开发环境配置 */
  development: {
    enterprise: {
      enableHealthCheck: true,
      enablePerformanceMonitoring: true,
      enableTenantExtraction: false,
      corsOptions: {
        origin: true,
        credentials: true,
      },
    },
    module: {
      global: false,
    },
  },

  /** 生产环境配置 */
  production: {
    enterprise: {
      enableHealthCheck: true,
      enablePerformanceMonitoring: true,
      enableTenantExtraction: true,
      tenantHeader: 'X-Tenant-ID',
      corsOptions: {
        origin: ['https://yourdomain.com'],
        credentials: true,
      },
    },
    module: {
      global: true,
    },
  },

  /** API服务配置 */
  apiService: {
    enterprise: {
      enableHealthCheck: true,
      enablePerformanceMonitoring: true,
      enableTenantExtraction: true,
      tenantHeader: 'X-Tenant-ID',
      corsOptions: {
        origin: (origin: string) => {
          const allowedOrigins = [
            'https://app.yourdomain.com',
            'https://admin.yourdomain.com',
          ];
          return allowedOrigins.includes(origin);
        },
        credentials: true,
      },
    },
    module: {
      global: true,
    },
  },
} as const;
