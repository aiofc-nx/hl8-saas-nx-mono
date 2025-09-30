/**
 * 多租户模块
 *
 * 多租户基础设施层的核心模块
 * 提供租户上下文管理、数据隔离、中间件、装饰器等功能
 *
 * @fileoverview 多租户模块实现
 * @author HL8 Team
 * @since 1.0.0
 */

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ExceptionModule } from '@hl8/common';
import { TypedConfigModule, fileLoader, dotenvLoader } from '@hl8/config';
import { TenantContextService } from './services/tenant-context.service';
import { TenantIsolationService } from './services/tenant-isolation.service';
import { MultiLevelIsolationService } from './services/multi-level-isolation.service';
import {
  MultiTenancyConfig,
  MultiTenancyConfigService,
  DefaultConfigProvider,
  ConfigValidator,
  createConfigServiceProvider,
  createConfigOptionsProvider,
} from './config';
import {
  IMultiTenancyModuleOptions,
  MULTI_TENANCY_MODULE_OPTIONS,
} from './types/tenant-core.types';

/**
 * 多租户模块
 *
 * 提供多租户基础设施功能的核心模块
 *
 * @description 多租户模块是多租户架构的基础设施层
 * 提供租户上下文管理、数据隔离、中间件、装饰器等核心功能
 * 支持多种配置选项和策略实现
 *
 * ## 功能特性
 *
 * ### 租户上下文管理
 * - 基于nestjs-cls的透明上下文传递
 * - 支持异步操作的上下文传播
 * - 自动的上下文生命周期管理
 * - 完整的上下文验证和审计
 *
 * ### 数据隔离
 * - 支持多种隔离策略（键前缀、命名空间、数据库等）
 * - 自动的租户键生成和数据隔离
 * - 透明的数据提取和验证
 * - 高性能的批量操作支持
 *
 * ### 中间件系统
 * - 自动的租户识别和验证
 * - 灵活的租户ID提取方式
 * - 完整的错误处理和日志记录
 * - 可配置的验证超时和重试
 *
 * ### 装饰器系统
 * - 声明式的租户功能注入
 * - 自动的租户上下文绑定
 * - 透明的数据隔离处理
 * - 灵活的权限控制集成
 *
 * ### 守卫系统
 * - 基于角色的访问控制
 * - 细粒度的权限检查
 * - 实时的安全验证
 * - 完整的审计日志记录
 *
 * ## 配置选项
 *
 * ### 上下文配置
 * - enableAutoInjection: 是否启用自动注入
 * - contextTimeout: 上下文超时时间
 * - enableAuditLog: 是否启用审计日志
 * - contextStorage: 上下文存储方式
 * - allowCrossTenantAccess: 是否允许跨租户访问
 *
 * ### 隔离配置
 * - strategy: 隔离策略类型
 * - keyPrefix: 键前缀
 * - namespace: 命名空间
 * - enableIsolation: 是否启用隔离
 * - level: 隔离级别
 *
 * ### 中间件配置
 * - enableTenantMiddleware: 是否启用租户中间件
 * - tenantHeader: 租户ID请求头名称
 * - tenantQueryParam: 租户ID查询参数名称
 * - tenantSubdomain: 是否支持子域名提取
 * - validationTimeout: 验证超时时间
 * - strictValidation: 是否启用严格验证
 *
 * ### 安全配置
 * - enableSecurityCheck: 是否启用安全检查
 * - maxFailedAttempts: 最大失败尝试次数
 * - lockoutDuration: 锁定持续时间
 * - enableAuditLog: 是否启用审计日志
 * - enableIpWhitelist: 是否启用IP白名单
 * - ipWhitelist: IP白名单
 *
 * @example
 * ```typescript
 * // 基础使用
 * @Module({
 *   imports: [
 *     MultiTenancyModule.forRoot({
 *       context: {
 *         enableAutoInjection: true,
 *         contextTimeout: 30000,
 *         enableAuditLog: true,
 *         contextStorage: 'memory',
 *         allowCrossTenantAccess: false
 *       },
 *       isolation: {
 *         strategy: 'key-prefix',
 *         keyPrefix: 'tenant:',
 *         namespace: 'tenant-namespace',
 *         enableIsolation: true,
 *         level: 'strict'
 *       },
 *       middleware: {
 *         enableTenantMiddleware: true,
 *         tenantHeader: 'X-Tenant-ID',
 *         tenantQueryParam: 'tenant',
 *         tenantSubdomain: true,
 *         validationTimeout: 5000,
 *         strictValidation: true
 *       },
 *       security: {
 *         enableSecurityCheck: true,
 *         maxFailedAttempts: 5,
 *         lockoutDuration: 300000,
 *         enableAuditLog: true,
 *         enableIpWhitelist: false
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * @example
 * ```typescript
 * // 高级使用（自定义策略）
 * @Module({
 *   imports: [
 *     MultiTenancyModule.forRoot({
 *       context: {
 *         enableAutoInjection: true,
 *         contextTimeout: 30000,
 *         enableAuditLog: true,
 *         contextStorage: 'redis',
 *         allowCrossTenantAccess: true
 *       },
 *       isolation: {
 *         strategy: 'namespace',
 *         namespace: 'tenant-namespace',
 *         enableIsolation: true,
 *         level: 'strict'
 *       },
 *       middleware: {
 *         enableTenantMiddleware: true,
 *         tenantHeader: 'X-Tenant-ID',
 *         tenantQueryParam: 'tenant',
 *         tenantSubdomain: false,
 *         validationTimeout: 10000,
 *         strictValidation: false
 *       },
 *       security: {
 *         enableSecurityCheck: true,
 *         maxFailedAttempts: 3,
 *         lockoutDuration: 600000,
 *         enableAuditLog: true,
 *         enableIpWhitelist: true,
 *         ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8']
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class MultiTenancyModule {
  /**
   * 创建多租户模块
   *
   * 使用指定的配置选项创建多租户模块实例
   *
   * @description 创建配置化的多租户模块
   * 支持完整的配置选项和自定义策略
   *
   * @param options 多租户模块配置选项
   * @returns 动态模块
   */
  static forRoot(options: IMultiTenancyModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: MULTI_TENANCY_MODULE_OPTIONS,
        useValue: options,
      },
      TenantContextService,
      TenantIsolationService,
      MultiLevelIsolationService,
    ];

    return {
      module: MultiTenancyModule,
      imports: [
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
            generateId: true,
            idGenerator: () => {
              // 生成请求ID
              return `req_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            },
          },
        }),
        ExceptionModule.forRoot({
          documentationUrl: 'https://docs.hl8.com/errors/multi-tenancy',
          logLevel: 'error',
          enableStackTrace: true,
        }),
      ],
      providers,
      exports: [
        TenantContextService,
        TenantIsolationService,
        MultiLevelIsolationService,
        MULTI_TENANCY_MODULE_OPTIONS,
      ],
      global: true,
    };
  }

  /**
   * 使用 @hl8/config 模块配置多租户模块
   *
   * @description 集成 @hl8/config 模块，提供类型安全的配置管理
   * 支持配置文件加载、环境变量覆盖和配置验证
   *
   * @param options 配置选项
   * @returns 动态模块配置
   *
   * @example
   * ```typescript
   * // 使用配置文件和环境变量
   * MultiTenancyModule.forRootWithConfig({
   *   configPath: './config/multi-tenancy.yml',
   *   envPrefix: 'TENANT_',
   *   enableValidation: true,
   *   useDefaultConfig: true
   * })
   * ```
   */
  static forRootWithConfig(
    options: {
      configPath?: string;
      envPrefix?: string;
      enableValidation?: boolean;
      useDefaultConfig?: boolean;
    } = {}
  ): DynamicModule {
    const providers: Provider[] = [
      // 配置相关提供者
      DefaultConfigProvider,
      ConfigValidator,
      createConfigOptionsProvider(options),
      createConfigServiceProvider(options),

      // 多租户服务提供者
      {
        provide: MULTI_TENANCY_MODULE_OPTIONS,
        useFactory: (configService: MultiTenancyConfigService) => {
          const config = configService.getConfig();
          return {
            context: config.context,
            isolation: config.isolation,
            middleware: config.middleware,
            security: config.security,
            multiLevel: config.multiLevel,
          };
        },
        inject: [MultiTenancyConfigService],
      },
      TenantContextService,
      TenantIsolationService,
      MultiLevelIsolationService,
    ];

    return {
      module: MultiTenancyModule,
      imports: [
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
            generateId: true,
            idGenerator: () => {
              // 生成请求ID
              return `req_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            },
          },
        }),
        ExceptionModule.forRoot({
          documentationUrl: 'https://docs.hl8.com/errors/multi-tenancy',
          logLevel: 'error',
          enableStackTrace: true,
        }),
        // 集成 @hl8/config 模块
        ...(options.configPath
          ? [
              TypedConfigModule.forRoot({
                schema: MultiTenancyConfig,
                load: [
                  fileLoader({ path: options.configPath }),
                  dotenvLoader({ separator: '__' }),
                ],
              }),
            ]
          : []),
      ],
      providers,
      exports: [
        TenantContextService,
        TenantIsolationService,
        MultiLevelIsolationService,
        MultiTenancyConfigService,
        MULTI_TENANCY_MODULE_OPTIONS,
      ],
      global: true,
    };
  }

  /**
   * 创建多租户模块（异步）
   *
   * 使用异步配置创建多租户模块实例
   *
   * @description 支持异步配置加载，适用于需要从外部源加载配置的场景
   * 如从数据库、配置文件、环境变量等加载配置
   *
   * @param optionsFactory 配置工厂函数
   * @returns 动态模块
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [
   *     MultiTenancyModule.forRootAsync({
   *       useFactory: async (configService: ConfigService) => {
   *         return {
   *           context: {
   *             enableAutoInjection: true,
   *             contextTimeout: configService.get('TENANT_CONTEXT_TIMEOUT', 30000),
   *             enableAuditLog: configService.get('TENANT_AUDIT_LOG', true),
   *             contextStorage: configService.get('TENANT_CONTEXT_STORAGE', 'memory'),
   *             allowCrossTenantAccess: configService.get('TENANT_CROSS_ACCESS', false)
   *           },
   *           isolation: {
   *             strategy: configService.get('TENANT_ISOLATION_STRATEGY', 'key-prefix'),
   *             keyPrefix: configService.get('TENANT_KEY_PREFIX', 'tenant:'),
   *             namespace: configService.get('TENANT_NAMESPACE', 'tenant-namespace'),
   *             enableIsolation: configService.get('TENANT_ISOLATION_ENABLED', true),
   *             level: configService.get('TENANT_ISOLATION_LEVEL', 'strict')
   *           },
   *           middleware: {
   *             enableTenantMiddleware: configService.get('TENANT_MIDDLEWARE_ENABLED', true),
   *             tenantHeader: configService.get('TENANT_HEADER', 'X-Tenant-ID'),
   *             tenantQueryParam: configService.get('TENANT_QUERY_PARAM', 'tenant'),
   *             tenantSubdomain: configService.get('TENANT_SUBDOMAIN', true),
   *             validationTimeout: configService.get('TENANT_VALIDATION_TIMEOUT', 5000),
   *             strictValidation: configService.get('TENANT_STRICT_VALIDATION', true)
   *           },
   *           security: {
   *             enableSecurityCheck: configService.get('TENANT_SECURITY_ENABLED', true),
   *             maxFailedAttempts: configService.get('TENANT_MAX_FAILED_ATTEMPTS', 5),
   *             lockoutDuration: configService.get('TENANT_LOCKOUT_DURATION', 300000),
   *             enableAuditLog: configService.get('TENANT_SECURITY_AUDIT', true),
   *             enableIpWhitelist: configService.get('TENANT_IP_WHITELIST_ENABLED', false),
   *             ipWhitelist: configService.get('TENANT_IP_WHITELIST', [])
   *           }
   *         };
   *       },
   *       inject: [ConfigService]
   *     })
   *   ]
   * })
   * export class AppModule {}
   * ```
   */
  static forRootAsync(options: {
    useFactory: (
      ...args: unknown[]
    ) => Promise<IMultiTenancyModuleOptions> | IMultiTenancyModuleOptions;
    inject?: unknown[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: MULTI_TENANCY_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: (options.inject as Array<string | symbol>) || [],
      },
      TenantContextService,
      TenantIsolationService,
      MultiLevelIsolationService,
    ];

    return {
      module: MultiTenancyModule,
      imports: [
        ClsModule.forRoot({
          global: true,
          middleware: {
            mount: true,
            generateId: true,
            idGenerator: () => {
              // 生成请求ID
              return `req_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            },
          },
        }),
        ExceptionModule.forRoot({
          documentationUrl: 'https://docs.hl8.com/errors/multi-tenancy',
          logLevel: 'error',
          enableStackTrace: true,
        }),
      ],
      providers,
      exports: [
        TenantContextService,
        TenantIsolationService,
        MultiLevelIsolationService,
        MULTI_TENANCY_MODULE_OPTIONS,
      ],
      global: true,
    };
  }
}
