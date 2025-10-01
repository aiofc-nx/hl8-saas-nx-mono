/**
 * 缓存模块
 *
 * 提供高性能、多租户的缓存解决方案，基于Redis和nestjs-cls实现。
 * 支持租户隔离、上下文管理、监控统计等功能，专为SAAS平台设计。
 *
 * @description 此模块是HL8 SAAS平台的基础设施层核心模块，提供统一的缓存管理接口。
 * 支持高性能缓存、租户隔离、上下文绑定、装饰器支持等功能。
 * 专为多租户SAAS平台优化，提供完整的缓存管理和监控能力。
 *
 * ## 业务规则
 *
 * ### 模块初始化规则
 * - 支持同步和异步配置初始化
 * - 自动集成多租户模块和CLS模块
 * - 提供完整的依赖注入配置
 * - 支持模块级别的健康检查
 *
 * ### 租户隔离规则
 * - 自动绑定租户上下文到缓存操作
 * - 支持租户级别的缓存命名空间
 * - 使用multi-tenancy模块实现租户隔离
 * - 支持租户级别的缓存统计和监控
 * - 租户缓存完全隔离，确保数据安全
 *
 * ### 依赖管理规则
 * - 自动注册所有必要的服务提供者
 * - 支持服务间的依赖注入
 * - 提供统一的配置管理
 * - 支持模块级别的生命周期管理
 *
 * ### 监控集成规则
 * - 集成缓存监控服务
 * - 集成统计服务
 * - 集成健康检查服务
 * - 支持实时监控和告警
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [CacheModule.forRoot({
 *     redis: {
 *       host: 'localhost',
 *       port: 6379,
 *       password: 'password',
 *       db: 0
 *     },
 *     defaultTTL: 3600,
 *     keyPrefix: 'hl8:cache:',
 *     enableTenantIsolation: true
 *   })],
 * })
 * export class AppModule {}
 *
 * // 异步配置
 * @Module({
 *   imports: [CacheModule.forRootAsync({
 *     useFactory: (configService: ConfigService) => ({
 *       redis: configService.get('REDIS_CONFIG'),
 *       defaultTTL: configService.get('CACHE_TTL'),
 *       keyPrefix: configService.get('CACHE_PREFIX')
 *     }),
 *     inject: [ConfigService]
 *   })],
 * })
 * export class AppModule {}
 * ```
 */

import { DynamicModule, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { CacheModuleOptions } from './types/cache.types';
import { DI_TOKENS } from './constants';
import { CacheService } from './cache.service';
import { RedisService } from './redis.service';
import { CacheMonitorService } from './monitoring/cache-monitor.service';
import { CacheStatsService } from './monitoring/cache-stats.service';
import { HealthCheckService } from './monitoring/health-check.service';
import {
  MultiTenancyModule,
  TenantContextService,
  TenantIsolationService,
} from '@hl8/multi-tenancy';

/**
 * 缓存模块异步配置选项
 *
 * 定义缓存模块的异步配置选项，支持动态配置和依赖注入。
 *
 * @description 此接口用于配置缓存模块的异步初始化选项，支持工厂函数、
 * 依赖注入和模块导入等高级配置功能。
 *
 * ## 业务规则
 *
 * ### 配置工厂规则
 * - useFactory函数必须返回有效的CacheModuleOptions
 * - 支持异步配置加载
 * - 支持依赖注入参数
 * - 支持配置验证和错误处理
 *
 * ### 依赖注入规则
 * - inject数组定义需要注入的依赖
 * - 支持NestJS的依赖注入系统
 * - 支持配置服务的自动注入
 * - 支持环境变量的动态配置
 *
 * ### 模块导入规则
 * - imports数组定义需要导入的模块
 * - 支持模块间的依赖关系
 * - 支持条件模块导入
 * - 支持模块的延迟加载
 *
 * @example
 * ```typescript
 * const asyncOptions: CacheModuleAsyncOptions = {
 *   useFactory: (configService: ConfigService) => ({
 *     redis: configService.get('REDIS_CONFIG'),
 *     defaultTTL: configService.get('CACHE_TTL')
 *   }),
 *   inject: [ConfigService],
 *   imports: [ConfigModule]
 * };
 * ```
 */
export interface CacheModuleAsyncOptions {
  /** 配置工厂函数，用于生成模块配置 */
  useFactory?: (
    ...args: any[]
  ) => Promise<CacheModuleOptions> | CacheModuleOptions;
  /** 需要注入的依赖列表 */
  inject?: any[];
  /** 需要导入的模块列表 */
  imports?: any[];
}

/**
 * 缓存模块
 *
 * 提供高性能、多租户的缓存服务，支持Redis和nestjs-cls集成。
 * 自动处理租户隔离、上下文管理和监控统计等功能。
 *
 * @description 此模块是缓存系统的核心，提供统一的缓存管理接口。
 * 支持同步和异步配置，自动集成多租户和CLS模块。
 * 遵循Clean Architecture的基础设施层设计原则。
 *
 * ## 业务规则
 *
 * ### 模块配置规则
 * - 支持同步和异步配置初始化
 * - 自动集成多租户模块和CLS模块
 * - 提供完整的依赖注入配置
 * - 支持模块级别的健康检查
 *
 * ### 服务注册规则
 * - 自动注册所有必要的服务提供者
 * - 支持服务间的依赖注入
 * - 提供统一的配置管理
 * - 支持模块级别的生命周期管理
 *
 * ### 租户隔离规则
 * - 自动绑定租户上下文到缓存操作
 * - 支持租户级别的缓存命名空间
 * - 使用multi-tenancy模块实现租户隔离
 * - 支持租户级别的缓存统计和监控
 *
 * @example
 * ```typescript
 * // 基础使用
 * @Module({
 *   imports: [CacheModule.forRoot({
 *     redis: { host: 'localhost', port: 6379 },
 *     defaultTTL: 3600
 *   })],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class CacheModule {
  /**
   * 同步配置模块
   *
   * 使用同步配置初始化缓存模块，适用于静态配置场景。
   *
   * @description 此方法使用同步配置初始化缓存模块，提供完整的缓存服务。
   * 自动集成多租户模块和CLS模块，支持租户隔离和上下文管理。
   *
   * ## 业务规则
   *
   * ### 配置验证规则
   * - Redis配置必须包含host和port
   * - 默认TTL必须大于0
   * - 键前缀不能为空
   * - 租户隔离配置必须有效
   *
   * ### 模块集成规则
   * - 自动集成MultiTenancyModule
   * - 自动集成ClsModule
   * - 自动注册所有缓存服务
   * - 支持模块级别的健康检查
   *
   * ### 服务提供者规则
   * - 注册CacheService作为主要服务
   * - 注册RedisService作为底层服务
   * - 注册监控和统计服务
   * - 支持服务间的依赖注入
   *
   * @param options - 缓存模块配置选项
   * @returns 动态模块配置
   * @throws {Error} 当配置无效时抛出
   *
   * @example
   * ```typescript
   * const cacheModule = CacheModule.forRoot({
   *   redis: {
   *     host: 'localhost',
   *     port: 6379,
   *     password: 'password',
   *     db: 0
   *   },
   *   defaultTTL: 3600,
   *   keyPrefix: 'hl8:cache:',
   *   enableTenantIsolation: true
   * });
   * ```
   */
  static forRoot(options: CacheModuleOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        // 集成 multi-tenancy 模块
        MultiTenancyModule.forRoot(
          options.multiTenancy || {
            context: {
              enableAutoInjection: true,
              contextTimeout: 30000,
              enableAuditLog: true,
              contextStorage: 'memory',
              allowCrossTenantAccess: false,
            },
            isolation: {
              strategy: 'key-prefix',
              keyPrefix: options.keyPrefix || 'hl8:cache:',
              namespace: 'cache-namespace',
              enableIsolation: options.enableTenantIsolation !== false,
              level: 'strict',
            },
            middleware: {
              enableTenantMiddleware: true,
              tenantHeader: 'X-Tenant-ID',
              tenantQueryParam: 'tenant',
              tenantSubdomain: true,
              validationTimeout: 5000,
              strictValidation: true,
            },
            security: {
              enableSecurityCheck: true,
              maxFailedAttempts: 5,
              lockoutDuration: 300000,
              enableAuditLog: true,
              enableIpWhitelist: false,
            },
          }
        ),
        // 保留 CLS 模块用于向后兼容
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
            generateId: options.cls?.middleware?.generateId ?? true,
          },
          interceptor: {
            mount: options.cls?.interceptor?.mount ?? true,
          },
        }),
      ],
      providers: [
        {
          provide: DI_TOKENS.MODULE_OPTIONS,
          useValue: options,
        },
        RedisService,
        CacheService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
      exports: [
        CacheService,
        TenantContextService,
        TenantIsolationService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
    };
  }

  /**
   * 异步配置模块
   *
   * 使用异步配置初始化缓存模块，适用于动态配置场景。
   *
   * @description 此方法使用异步配置初始化缓存模块，支持动态配置加载。
   * 通过工厂函数和依赖注入实现配置的灵活管理。
   * 自动集成多租户模块和CLS模块，支持租户隔离和上下文管理。
   *
   * ## 业务规则
   *
   * ### 异步配置规则
   * - useFactory函数必须返回有效的CacheModuleOptions
   * - 支持异步配置加载和验证
   * - 支持依赖注入参数
   * - 支持配置的动态更新
   *
   * ### 依赖注入规则
   * - inject数组定义需要注入的依赖
   * - 支持NestJS的依赖注入系统
   * - 支持配置服务的自动注入
   * - 支持环境变量的动态配置
   *
   * ### 模块导入规则
   * - imports数组定义需要导入的模块
   * - 支持模块间的依赖关系
   * - 支持条件模块导入
   * - 支持模块的延迟加载
   *
   * @param options - 异步配置选项
   * @returns 动态模块配置
   * @throws {Error} 当配置无效或依赖注入失败时抛出
   *
   * @example
   * ```typescript
   * const asyncModule = CacheModule.forRootAsync({
   *   useFactory: (configService: ConfigService) => ({
   *     redis: configService.get('REDIS_CONFIG'),
   *     defaultTTL: configService.get('CACHE_TTL'),
   *     keyPrefix: configService.get('CACHE_PREFIX')
   *   }),
   *   inject: [ConfigService],
   *   imports: [ConfigModule]
   * });
   * ```
   */
  static forRootAsync(options: CacheModuleAsyncOptions): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        // 集成 multi-tenancy 模块（异步配置）
        MultiTenancyModule.forRootAsync({
          useFactory: async (...args: any[]) => {
            const cacheOptions = await options.useFactory!(...args);
            return (
              cacheOptions.multiTenancy || {
                context: {
                  enableAutoInjection: true,
                  contextTimeout: 30000,
                  enableAuditLog: true,
                  contextStorage: 'memory',
                  allowCrossTenantAccess: false,
                },
                isolation: {
                  strategy: 'key-prefix',
                  keyPrefix: cacheOptions.keyPrefix || 'hl8:cache:',
                  namespace: 'cache-namespace',
                  enableIsolation: cacheOptions.enableTenantIsolation !== false,
                  level: 'strict',
                },
                middleware: {
                  enableTenantMiddleware: true,
                  tenantHeader: 'X-Tenant-ID',
                  tenantQueryParam: 'tenant',
                  tenantSubdomain: true,
                  validationTimeout: 5000,
                  strictValidation: true,
                },
                security: {
                  enableSecurityCheck: true,
                  maxFailedAttempts: 5,
                  lockoutDuration: 300000,
                  enableAuditLog: true,
                  enableIpWhitelist: false,
                },
              }
            );
          },
          inject: options.inject || [],
        }),
        // 保留 CLS 模块用于向后兼容
        ClsModule.forRootAsync({
          global: true,
          useFactory: async (...args: any[]) => {
            const cacheOptions = await options.useFactory!(...args);
            return {
              middleware: {
                mount: true,
                generateId: cacheOptions.cls?.middleware?.generateId ?? true,
              },
              interceptor: {
                mount: cacheOptions.cls?.interceptor?.mount ?? true,
              },
            };
          },
          inject: options.inject || [],
          imports: options.imports || [],
        }),
      ],
      providers: [
        {
          provide: DI_TOKENS.MODULE_OPTIONS,
          useFactory: options.useFactory!,
          inject: options.inject || [],
        },
        RedisService,
        CacheService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
      exports: [
        CacheService,
        TenantContextService,
        TenantIsolationService,
        CacheMonitorService,
        CacheStatsService,
        HealthCheckService,
      ],
    };
  }
}
