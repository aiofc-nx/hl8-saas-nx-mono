/**
 * Fastify-Pro NestJS模块
 *
 * @description 提供完整的Fastify-Pro集成，包括适配器、插件、中间件、监控等企业级功能
 *
 * ## 模块特点
 *
 * ### 🎯 **设计定位**
 * - **统一集成**：将Fastify-Pro的所有功能统一集成到NestJS模块中
 * - **配置驱动**：通过模块配置灵活控制功能启用
 * - **依赖注入**：支持NestJS的依赖注入系统
 * - **生命周期管理**：完整的模块生命周期管理
 *
 * @since 1.0.0
 */

import { Module, DynamicModule, Provider } from '@nestjs/common';
// import { FastifyModule as NestFastifyModule } from '@nestjs/platform-fastify';
import { EnterpriseFastifyAdapter } from '../adapters/enterprise-fastify.adapter';
import { HealthCheckService } from '../monitoring/health-check.service';
// import { IFastifyEnterpriseConfig } from '../types/fastify.types';

/**
 * Fastify-Pro模块配置
 */
export interface IFastifyProModuleConfig {
  /** 企业级配置 */
  enterprise?: {
    enableHealthCheck?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableMultiTenant?: boolean;
    tenantHeader?: string;
    corsOptions?: {
      origin?: boolean | string | string[];
      credentials?: boolean;
    };
  };

  /** 模块选项 */
  module?: {
    global?: boolean;
    imports?: any[];
    providers?: Provider[];
    exports?: any[];
  };
}

/**
 * Fastify-Pro模块
 *
 * @description 提供完整的Fastify-Pro企业级功能集成
 */
@Module({})
export class FastifyProModule {
  /**
   * 创建动态模块
   *
   * @description 根据配置创建Fastify-Pro动态模块
   */
  static forRoot(config?: IFastifyProModuleConfig): DynamicModule {
    const providers: Provider[] = [];
    const exports: any[] = [];

    // 添加企业级适配器
    providers.push({
      provide: 'FASTIFY_PRO_ADAPTER',
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
        useFactory: (fastify: any) => {
          return new HealthCheckService(fastify);
        },
        inject: ['FASTIFY_INSTANCE'],
      });
      exports.push(HealthCheckService);
    }

    return {
      module: FastifyProModule,
      global: config?.module?.global || false,
      imports: [...(config?.module?.imports || [])],
      providers: [...providers, ...(config?.module?.providers || [])],
      exports: [
        'FASTIFY_PRO_ADAPTER',
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
      ...args: any[]
    ) => Promise<IFastifyProModuleConfig> | IFastifyProModuleConfig;
    inject?: any[];
    imports?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'FASTIFY_PRO_CONFIG',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: 'FASTIFY_PRO_ADAPTER',
        useFactory: (config: IFastifyProModuleConfig) => {
          return new EnterpriseFastifyAdapter({
            enterprise: config?.enterprise,
          });
        },
        inject: ['FASTIFY_PRO_CONFIG'],
      },
    ];

    return {
      module: FastifyProModule,
      imports: [...(options.imports || [])],
      providers,
      exports: ['FASTIFY_PRO_ADAPTER', 'FASTIFY_PRO_CONFIG'],
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
    multiTenant?: boolean;
    cors?: boolean;
  }): DynamicModule {
    const providers: Provider[] = [];
    const exports: any[] = [];

    // 健康检查功能
    if (features.healthCheck) {
      providers.push({
        provide: HealthCheckService,
        useFactory: (fastify: any) => {
          return new HealthCheckService(fastify);
        },
        inject: ['FASTIFY_INSTANCE'],
      });
      exports.push(HealthCheckService);
    }

    // 性能监控功能
    if (features.performanceMonitoring) {
      providers.push({
        provide: 'PERFORMANCE_MONITOR',
        useFactory: () => {
          // 这里可以添加性能监控服务
          return {};
        },
      });
      exports.push('PERFORMANCE_MONITOR');
    }

    // 多租户功能
    if (features.multiTenant) {
      providers.push({
        provide: 'TENANT_SERVICE',
        useFactory: () => {
          // 这里可以添加租户服务
          return {};
        },
      });
      exports.push('TENANT_SERVICE');
    }

    // CORS功能
    if (features.cors) {
      providers.push({
        provide: 'CORS_SERVICE',
        useFactory: () => {
          // 这里可以添加CORS服务
          return {};
        },
      });
      exports.push('CORS_SERVICE');
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
      enableMultiTenant: false,
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
      enableMultiTenant: true,
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
      enableMultiTenant: true,
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
