/**
 * 多租户模块
 *
 * 多租户基础设施层的核心模块，提供租户上下文管理、数据隔离、中间件、装饰器等功能。
 *
 * @description 此模块是多租户架构的核心实现，提供完整的租户管理功能。
 * 支持租户上下文管理、数据隔离、中间件、装饰器、守卫系统等核心功能。
 * 专为SAAS平台设计，支持多租户架构的完整生命周期管理。
 *
 * ## 业务规则
 *
 * ### 模块初始化规则
 * - 模块配置必须完整且有效
 * - 所有依赖服务必须正确初始化
 * - 支持同步和异步配置方式
 * - 配置验证失败时抛出明确异常
 *
 * ### 租户隔离规则
 * - 租户数据必须完全隔离
 * - 支持多种隔离策略（键前缀、命名空间、数据库等）
 * - 隔离策略切换必须无缝
 * - 支持批量操作以提高性能
 *
 * ### 上下文管理规则
 * - 租户上下文在整个请求生命周期内保持一致性
 * - 上下文传递必须是透明的
 * - 支持异步操作的上下文传播
 * - 上下文超时必须自动清理
 *
 * ### 安全控制规则
 * - 支持基于角色的访问控制
 * - 提供细粒度的权限检查
 * - 支持实时安全验证
 * - 完整的审计日志记录
 *
 * @example
 * ```typescript
 * // 基础配置
 * @Module({
 *   imports: [
 *     MultiTenancyModule.forRoot({
 *       context: {
 *         enableAutoInjection: true,
 *         contextTimeout: 30000,
 *         enableAuditLog: true
 *       },
 *       isolation: {
 *         strategy: 'key-prefix',
 *         keyPrefix: 'tenant:',
 *         enableIsolation: true
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */

import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { ExceptionModule } from '@hl8/common';
import { TypedConfigModule, fileLoader, dotenvLoader } from '@hl8/config';
import { PinoLogger } from '@hl8/logger';
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
import { IMultiTenancyModuleOptions } from './types/tenant-core.types';
import { DI_TOKENS } from './constants';

/**
 * 多租户模块
 *
 * 提供多租户基础设施功能的核心模块，支持租户上下文管理、数据隔离等功能。
 *
 * @description 此模块是多租户架构的基础设施层，提供租户上下文管理、数据隔离、
 * 中间件、装饰器等核心功能。支持多种配置选项和策略实现，专为SAAS平台设计。
 *
 * ## 业务规则
 *
 * ### 租户上下文管理规则
 * - 基于nestjs-cls的透明上下文传递
 * - 支持异步操作的上下文传播
 * - 自动的上下文生命周期管理
 * - 完整的上下文验证和审计
 *
 * ### 数据隔离规则
 * - 支持多种隔离策略（键前缀、命名空间、数据库等）
 * - 自动的租户键生成和数据隔离
 * - 透明的数据提取和验证
 * - 高性能的批量操作支持
 *
 * ### 中间件系统规则
 * - 自动的租户识别和验证
 * - 灵活的租户ID提取方式
 * - 完整的错误处理和日志记录
 * - 可配置的验证超时和重试
 *
 * ### 装饰器系统规则
 * - 声明式的租户功能注入
 * - 自动的租户上下文绑定
 * - 透明的数据隔离处理
 * - 灵活的权限控制集成
 *
 * ### 守卫系统规则
 * - 基于角色的访问控制
 * - 细粒度的权限检查
 * - 实时的安全验证
 * - 完整的审计日志记录
 *
 * @example
 * ```typescript
 * // 基础配置
 * @Module({
 *   imports: [
 *     MultiTenancyModule.forRoot({
 *       context: {
 *         enableAutoInjection: true,
 *         contextTimeout: 30000,
 *         enableAuditLog: true
 *       },
 *       isolation: {
 *         strategy: 'key-prefix',
 *         keyPrefix: 'tenant:',
 *         enableIsolation: true
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
   * 使用指定的配置选项创建多租户模块实例，支持完整的配置选项和自定义策略。
   *
   * @description 此方法创建配置化的多租户模块，支持租户上下文管理、数据隔离、
   * 中间件、装饰器等核心功能。提供完整的配置选项和自定义策略支持。
   *
   * ## 业务规则
   *
   * ### 配置验证规则
   * - 所有必填配置项必须提供
   * - 配置值必须符合预定义的格式
   * - 配置冲突时使用优先级规则
   * - 配置验证失败时抛出明确异常
   *
   * ### 模块初始化规则
   * - 所有依赖服务必须正确初始化
   * - 服务提供者必须正确注册
   * - 模块导入必须完整
   * - 全局模块必须正确配置
   *
   * ### 服务注册规则
   * - 租户上下文服务必须注册
   * - 租户隔离服务必须注册
   * - 多层级隔离服务必须注册
   * - 日志服务必须注册
   *
   * @param options 多租户模块配置选项
   * @returns 动态模块配置
   *
   * @throws {TenantConfigInvalidException} 当配置无效时抛出
   *
   * @example
   * ```typescript
   * // 基础配置
   * MultiTenancyModule.forRoot({
   *   context: {
   *     enableAutoInjection: true,
   *     contextTimeout: 30000,
   *     enableAuditLog: true
   *   },
   *   isolation: {
   *     strategy: 'key-prefix',
   *     keyPrefix: 'tenant:',
   *     enableIsolation: true
   *   }
   * })
   * ```
   */
  static forRoot(options: IMultiTenancyModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DI_TOKENS.MODULE_OPTIONS,
        useValue: options,
      },
      PinoLogger,
      {
        provide: 'LOGGER_PROVIDER',
        useExisting: PinoLogger,
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
        // ExceptionModule.forRoot({
        //   documentationUrl: 'https://docs.hl8.com/errors/multi-tenancy',
        //   logLevel: 'error',
        //   enableStackTrace: true,
        // }),
      ],
      providers,
      exports: [
        TenantContextService,
        TenantIsolationService,
        MultiLevelIsolationService,
        DI_TOKENS.MODULE_OPTIONS,
      ],
      global: true,
    };
  }

  /**
   * 使用 @hl8/config 模块配置多租户模块
   *
   * 集成 @hl8/config 模块，提供类型安全的配置管理和配置验证。
   *
   * @description 此方法集成 @hl8/config 模块，提供类型安全的配置管理。
   * 支持配置文件加载、环境变量覆盖和配置验证，确保配置的正确性和一致性。
   *
   * ## 业务规则
   *
   * ### 配置加载规则
   * - 支持YAML、JSON等配置文件格式
   * - 环境变量可以覆盖配置文件设置
   * - 配置加载失败时使用默认配置
   * - 配置验证失败时抛出明确异常
   *
   * ### 配置验证规则
   * - 所有配置项必须通过类型验证
   * - 必填配置项不能为空
   * - 配置值必须符合预定义的格式
   * - 配置冲突时使用优先级规则
   *
   * ### 模块集成规则
   * - 自动集成 @hl8/config 模块
   * - 支持配置服务提供者
   * - 支持配置验证器
   * - 支持默认配置提供者
   *
   * @param options 配置选项
   * @returns 动态模块配置
   *
   * @throws {TenantConfigInvalidException} 当配置无效时抛出
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
        provide: DI_TOKENS.MODULE_OPTIONS,
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
      PinoLogger,
      {
        provide: 'LOGGER_PROVIDER',
        useExisting: PinoLogger,
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
        // ExceptionModule.forRoot({
        //   documentationUrl: 'https://docs.hl8.com/errors/multi-tenancy',
        //   logLevel: 'error',
        //   enableStackTrace: true,
        // }),
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
        DI_TOKENS.MODULE_OPTIONS,
      ],
      global: true,
    };
  }

  /**
   * 创建多租户模块（异步）
   *
   * 使用异步配置创建多租户模块实例，支持从外部源加载配置。
   *
   * @description 此方法支持异步配置加载，适用于需要从外部源加载配置的场景。
   * 如从数据库、配置文件、环境变量等加载配置，提供灵活的配置管理方式。
   *
   * ## 业务规则
   *
   * ### 异步配置规则
   * - 配置工厂函数必须返回有效的配置对象
   * - 异步配置加载失败时使用默认配置
   * - 配置加载超时时间可配置
   * - 配置验证失败时抛出明确异常
   *
   * ### 依赖注入规则
   * - 支持注入其他服务（如ConfigService）
   * - 依赖服务必须正确注册
   * - 依赖注入失败时抛出明确异常
   * - 支持循环依赖检测
   *
   * ### 配置工厂规则
   * - 配置工厂函数必须返回Promise或同步值
   * - 配置工厂函数可以访问注入的依赖
   * - 配置工厂函数异常时使用默认配置
   * - 配置工厂函数支持缓存机制
   *
   * @param optionsFactory 配置工厂函数
   * @returns 动态模块配置
   *
   * @throws {TenantConfigInvalidException} 当配置无效时抛出
   *
   * @example
   * ```typescript
   * // 异步配置示例
   * MultiTenancyModule.forRootAsync({
   *   useFactory: async (configService: ConfigService) => {
   *     return {
   *       context: {
   *         enableAutoInjection: true,
   *         contextTimeout: configService.get('TENANT_CONTEXT_TIMEOUT', 30000)
   *       },
   *       isolation: {
   *         strategy: configService.get('TENANT_ISOLATION_STRATEGY', 'key-prefix'),
   *         keyPrefix: configService.get('TENANT_KEY_PREFIX', 'tenant:')
   *       }
   *     };
   *   },
   *   inject: [ConfigService]
   * })
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
        provide: DI_TOKENS.MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: (options.inject as Array<string | symbol>) || [],
      },
      PinoLogger,
      {
        provide: 'LOGGER_PROVIDER',
        useExisting: PinoLogger,
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
        // ExceptionModule.forRoot({
        //   documentationUrl: 'https://docs.hl8.com/errors/multi-tenancy',
        //   logLevel: 'error',
        //   enableStackTrace: true,
        // }),
      ],
      providers,
      exports: [
        TenantContextService,
        TenantIsolationService,
        MultiLevelIsolationService,
        DI_TOKENS.MODULE_OPTIONS,
      ],
      global: true,
    };
  }
}
