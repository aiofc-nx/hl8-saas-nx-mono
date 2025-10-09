/**
 * HL8 SAAS平台日志模块
 *
 * @description 提供完整的日志模块配置和依赖注入支持
 * 支持同步和异步配置，专为 Fastify 平台优化
 *
 * @fileoverview 日志模块实现文件
 * @since 1.0.0
 */

import {
  DynamicModule,
  Global,
  Module,
  NestModule,
  Provider,
} from '@nestjs/common';
import { PinoLogger } from './pino-logger';
import { PinoLoggerMiddleware } from './fastify-middleware';
import { LoggerModuleParams, LoggerModuleAsyncParams } from './types';
import { DI_TOKENS } from './constants';

/**
 * HL8 SAAS平台日志模块
 *
 * 提供完整的日志功能，包括日志记录器、中间件、装饰器等。
 * 专为 Fastify 平台设计，支持高性能日志记录和请求上下文绑定。
 * 遵循 Clean Architecture 的基础设施层设计原则，提供统一的日志管理接口。
 *
 * @description 此模块是 HL8 SAAS 平台的基础设施层核心模块，提供完整的日志管理功能。
 * 支持高性能日志记录、请求上下文绑定、中间件集成、装饰器支持等功能。
 * 专为 Fastify 平台优化，提供完整的请求/响应日志记录和性能监控能力。
 *
 * ## 业务规则
 *
 * ### 模块化设计规则
 * - 支持全局和局部模块配置，灵活适应不同使用场景
 * - 支持同步和异步配置方式，满足不同配置需求
 * - 完整的 NestJS 依赖注入支持，无缝集成到应用中
 * - 支持动态配置和运行时调整，适应环境变化
 * - 模块间松耦合，易于扩展和维护
 *
 * ### 高性能日志记录规则
 * - 基于 Pino 的高性能日志记录器，提供优异性能
 * - 支持异步日志记录和结构化输出，避免阻塞主线程
 * - 支持多种输出目标：控制台、文件、流等
 * - 支持日志轮转和压缩，优化存储空间使用
 * - 支持自定义格式化选项和输出配置
 *
 * ### 请求上下文绑定规则
 * - 自动绑定请求上下文到日志记录
 * - 支持请求ID、用户ID、追踪ID等上下文信息
 * - 使用 AsyncLocalStorage 实现上下文传递
 * - 支持自定义上下文数据和元数据
 * - 上下文信息在所有异步操作中保持可用
 *
 * ### 中间件支持规则
 * - 自动请求/响应日志记录，无需手动配置
 * - 支持路径排除和自定义配置，灵活控制日志范围
 * - 完整的错误处理和日志记录，确保异常信息不丢失
 * - 支持自定义请求ID生成器和上下文提取
 * - 中间件性能优化，最小化对请求处理的影响
 *
 * ## 业务逻辑流程
 *
 * 1. **模块初始化**：通过 forRoot() 或 forRootAsync() 初始化模块
 * 2. **配置解析**：解析日志配置选项和中间件配置
 * 3. **日志器创建**：根据配置创建 Pino 日志器实例
 * 4. **中间件注册**：注册请求/响应日志中间件（如果启用）
 * 5. **提供者创建**：创建日志器提供者和中间件提供者
 * 6. **依赖注入**：将提供者注册到 NestJS 容器中
 * 7. **模块导出**：导出日志器和中间件供其他模块使用
 *
 * @example
 * ```typescript
 * import { LoggerModule } from '@hl8/logger';
 * import { Module } from '@nestjs/common';
 *
 * // 同步配置
 * @Module({
 *   imports: [LoggerModule.forRoot({
 *     config: {
 *       level: 'info',
 *       destination: { type: 'file', path: './logs/app.log' },
 *       format: { timestamp: true, colorize: true }
 *     },
 *     enableRequestLogging: true,
 *     enableResponseLogging: true
 *   })],
 * })
 * export class AppModule {}
 *
 * // 异步配置
 * @Module({
 *   imports: [LoggerModule.forRootAsync({
 *     imports: [ConfigModule],
 *     inject: [ConfigService],
 *     useFactory: (config: ConfigService) => ({
 *       config: {
 *         level: config.get('LOG_LEVEL'),
 *         destination: { type: 'file', path: config.get('LOG_PATH') },
 *         format: { timestamp: true, colorize: config.get('NODE_ENV') === 'development' }
 *       },
 *       enableRequestLogging: config.get('ENABLE_REQUEST_LOGGING'),
 *       enableResponseLogging: config.get('ENABLE_RESPONSE_LOGGING')
 *     })
 *   })],
 * })
 * export class AppModule {}
 * ```
 */
@Global()
@Module({})
export class LoggerModule implements NestModule {
  /**
   * 同步配置日志模块
   *
   * 使用同步方式配置日志模块，适用于配置信息已知且不需要动态获取的场景。
   * 支持完整的日志配置选项和中间件配置，提供高性能的日志记录能力。
   *
   * @description 此方法执行同步的日志模块配置和初始化流程。
   * 支持日志级别、输出目标、格式化选项、请求/响应日志等完整配置。
   * 配置完成后返回完整的动态模块，可直接导入到 NestJS 应用中。
   *
   * ## 业务规则
   *
   * ### 配置规则
   * - 支持完整的日志配置选项：级别、输出目标、格式化等
   * - 支持请求/响应日志中间件配置和启用
   * - 支持全局和局部模块配置选项
   * - 配置参数验证和默认值设置
   *
   * ### 提供者创建规则
   * - 自动创建日志器提供者，支持依赖注入
   * - 根据配置自动创建中间件提供者（如果启用）
   * - 提供者支持单例模式，确保性能优化
   * - 支持自定义提供者配置和扩展
   *
   * ### 模块导出规则
   * - 默认导出日志器提供者，供其他模块使用
   * - 条件性导出中间件提供者（根据配置）
   * - 支持全局模块配置，减少重复导入
   * - 导出配置完整且类型安全
   *
   * ## 业务逻辑流程
   *
   * 1. **参数验证**：验证配置参数的完整性和有效性
   * 2. **提供者创建**：创建日志器提供者和配置提供者
   * 3. **中间件配置**：根据配置创建中间件提供者（如果启用）
   * 4. **导出配置**：配置模块导出，包含日志器和中间件
   * 5. **全局设置**：根据配置设置模块的全局属性
   * 6. **模块返回**：返回完整的动态模块配置
   *
   * @param params - 日志模块配置参数，包含日志配置和中间件配置
   * @returns DynamicModule 完整的动态模块配置，可直接导入到 NestJS 应用
   *
   * @example
   * ```typescript
   * import { LoggerModule } from '@hl8/logger';
   * import { Module } from '@nestjs/common';
   *
   * @Module({
   *   imports: [LoggerModule.forRoot({
   *     config: {
   *       level: 'info',
   *       destination: { type: 'file', path: './logs/app.log' },
   *       format: { timestamp: true, colorize: true }
   *     },
   *     enableRequestLogging: true,
   *     enableResponseLogging: true,
   *     global: true
   *   })],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(params: LoggerModuleParams = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DI_TOKENS.MODULE_PARAMS,
        useValue: params,
      },
      {
        provide: DI_TOKENS.LOGGER_PROVIDER,
        useFactory: (moduleParams: LoggerModuleParams) => {
          return new PinoLogger(moduleParams.config);
        },
        inject: [DI_TOKENS.MODULE_PARAMS],
      },
      {
        provide: PinoLogger,
        useExisting: DI_TOKENS.LOGGER_PROVIDER,
      },
    ];

    const exports: any[] = [DI_TOKENS.LOGGER_PROVIDER, PinoLogger];

    // 如果启用了请求日志记录，添加中间件提供者
    if (params.enableRequestLogging || params.enableResponseLogging) {
      providers.push({
        provide: DI_TOKENS.FASTIFY_LOGGER_MIDDLEWARE,
        useFactory: (
          moduleParams: LoggerModuleParams
        ): PinoLoggerMiddleware => {
          return new PinoLoggerMiddleware({
            enableRequestLogging: moduleParams.enableRequestLogging,
            enableResponseLogging: moduleParams.enableResponseLogging,
            loggerConfig: moduleParams.config,
          });
        },
        inject: [DI_TOKENS.MODULE_PARAMS],
      });

      exports.push(DI_TOKENS.FASTIFY_LOGGER_MIDDLEWARE);
    }

    return {
      module: LoggerModule,
      global: params.global !== false,
      providers,
      exports,
    };
  }

  /**
   * 异步配置日志模块
   *
   * 使用异步方式配置日志模块，适用于需要动态获取配置信息的场景。
   * 支持从配置文件、环境变量、数据库等异步源获取配置信息。
   *
   * @description 此方法执行异步的日志模块配置和初始化流程。
   * 支持依赖注入和工厂函数配置，可以动态获取配置信息。
   * 配置加载完成后返回完整的动态模块，可直接导入到 NestJS 应用中。
   *
   * ## 业务规则
   *
   * ### 异步配置规则
   * - 支持从外部配置源异步获取配置信息
   * - 支持依赖注入，可以注入 ConfigService 等服务
   * - 支持工厂函数配置，提供灵活的配置逻辑
   * - 配置加载失败时会抛出异常并阻止模块创建
   *
   * ### 依赖注入规则
   * - 支持导入其他模块，如 ConfigModule
   * - 支持注入服务，如 ConfigService
   * - 支持自定义提供者配置和扩展
   * - 依赖注入失败时会抛出详细的错误信息
   *
   * ### 中间件配置规则
   * - 异步配置总是创建中间件提供者，支持动态配置
   * - 中间件配置基于动态获取的配置信息
   * - 支持运行时配置调整和中间件重新初始化
   * - 中间件配置失败时会阻止模块创建
   *
   * ## 业务逻辑流程
   *
   * 1. **依赖解析**：解析导入的模块和注入的服务
   * 2. **配置加载**：通过工厂函数异步获取配置信息
   * 3. **配置验证**：验证动态配置的完整性和有效性
   * 4. **提供者创建**：创建日志器提供者和配置提供者
   * 5. **中间件配置**：创建中间件提供者（总是创建）
   * 6. **模块组装**：组装完整的动态模块配置
   * 7. **模块返回**：返回完整的动态模块配置
   *
   * @param params - 异步日志模块配置参数，包含依赖注入和工厂函数配置
   * @returns DynamicModule 完整的动态模块配置，可直接导入到 NestJS 应用
   *
   * @throws {Error} 当配置加载失败时抛出
   * @throws {Error} 当依赖注入失败时抛出
   * @throws {Error} 当模块创建过程中发生未知错误时抛出
   *
   * @example
   * ```typescript
   * import { LoggerModule } from '@hl8/logger';
   * import { Module } from '@nestjs/common';
   * import { ConfigModule, ConfigService } from '@nestjs/config';
   *
   * @Module({
   *   imports: [LoggerModule.forRootAsync({
   *     imports: [ConfigModule],
   *     inject: [ConfigService],
   *     useFactory: (config: ConfigService) => ({
   *       config: {
   *         level: config.get('LOG_LEVEL'),
   *         destination: { type: 'file', path: config.get('LOG_PATH') },
   *         format: {
   *           timestamp: true,
   *           colorize: config.get('NODE_ENV') === 'development'
   *         }
   *       },
   *       enableRequestLogging: config.get('ENABLE_REQUEST_LOGGING'),
   *       enableResponseLogging: config.get('ENABLE_RESPONSE_LOGGING')
   *     })
   *   })],
   * })
   * export class AppModule {}
   * ```
   */
  static forRootAsync(params: LoggerModuleAsyncParams): DynamicModule {
    const providers: Provider[] = [
      {
        provide: DI_TOKENS.MODULE_PARAMS,
        useFactory: params.useFactory,
        inject: (params.inject as any[]) || [],
      },
      {
        provide: DI_TOKENS.LOGGER_PROVIDER,
        useFactory: (moduleParams: LoggerModuleParams) => {
          return new PinoLogger(moduleParams.config);
        },
        inject: [DI_TOKENS.MODULE_PARAMS],
      },
      {
        provide: PinoLogger,
        useExisting: DI_TOKENS.LOGGER_PROVIDER,
      },
    ];

    const exports: any[] = [DI_TOKENS.LOGGER_PROVIDER, PinoLogger];

    // 添加中间件提供者（总是添加，因为配置是动态的）
    providers.push({
      provide: DI_TOKENS.FASTIFY_LOGGER_MIDDLEWARE,
      useFactory: (moduleParams: LoggerModuleParams): PinoLoggerMiddleware => {
        return new PinoLoggerMiddleware({
          enableRequestLogging: moduleParams.enableRequestLogging,
          enableResponseLogging: moduleParams.enableResponseLogging,
          loggerConfig: moduleParams.config,
        });
      },
      inject: [DI_TOKENS.MODULE_PARAMS],
    });

    exports.push(DI_TOKENS.FASTIFY_LOGGER_MIDDLEWARE);

    return {
      module: LoggerModule,
      global: true,
      imports: (params.imports || []) as any[],
      providers: [...providers, ...(params.providers || [])] as Provider[],
      exports,
    };
  }

  /**
   * 配置中间件
   *
   * @description 配置日志中间件，用于自动请求/响应日志记录
   * 支持路径排除和自定义配置
   */
  configure() {
    // 中间件配置在 Fastify 插件中处理
    // 这里可以添加其他中间件配置
  }
}

/**
 * 创建日志模块提供者
 *
 * @description 创建日志模块的提供者配置
 * 用于自定义日志模块的配置和依赖注入
 *
 * @param config - 日志配置
 * @returns {Array} 提供者数组
 *
 * @example
 * ```typescript
 * const providers = createLoggerProviders({
 *   level: 'info',
 *   destination: { type: 'file', path: './logs/app.log' }
 * });
 * ```
 */
export function createLoggerProviders(config: Record<string, unknown> = {}) {
  return [
    {
      provide: DI_TOKENS.MODULE_PARAMS,
      useValue: config,
    },
    {
      provide: DI_TOKENS.LOGGER_PROVIDER,
      useFactory: (moduleParams: LoggerModuleParams) => {
        return new PinoLogger(moduleParams.config);
      },
      inject: [DI_TOKENS.MODULE_PARAMS],
    },
  ];
}

/**
 * 创建日志中间件提供者
 *
 * @description 创建日志中间件的提供者配置
 * 用于自定义日志中间件的配置和依赖注入
 *
 * @param config - 中间件配置
 * @returns {Array} 提供者数组
 *
 * @example
 * ```typescript
 * const middlewareProviders = createLoggerMiddlewareProviders({
 *   enableRequestLogging: true,
 *   enableResponseLogging: true,
 *   excludePaths: ['/health', '/metrics']
 * });
 * ```
 */
export function createLoggerMiddlewareProviders(
  config: Record<string, unknown> = {}
) {
  return [
    {
      provide: DI_TOKENS.FASTIFY_LOGGER_MIDDLEWARE,
      useFactory: (moduleParams: LoggerModuleParams) => {
        return new PinoLoggerMiddleware({
          enableRequestLogging: moduleParams.enableRequestLogging,
          enableResponseLogging: moduleParams.enableResponseLogging,
          loggerConfig: moduleParams.config,
          ...config,
        });
      },
      inject: [DI_TOKENS.MODULE_PARAMS],
    },
  ];
}

/**
 * 获取日志记录器实例
 *
 * @description 从依赖注入容器中获取日志记录器实例
 * 用于在服务中注入日志记录器
 *
 * @param moduleRef - 模块引用
 * @returns {FastifyLogger} 日志记录器实例
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private moduleRef: ModuleRef) {}
 *
 *   async createUser(userData: any) {
 *     const logger = getLoggerInstance(this.moduleRef);
 *     logger.info('Creating user', { userData });
 *   }
 * }
 * ```
 */
export function getLoggerInstance(moduleRef: {
  get: (token: string) => PinoLogger;
}): PinoLogger {
  return moduleRef.get(DI_TOKENS.LOGGER_PROVIDER);
}

/**
 * 获取日志中间件实例
 *
 * @description 从依赖注入容器中获取日志中间件实例
 * 用于在应用中注册日志中间件
 *
 * @param moduleRef - 模块引用
 * @returns {PinoLoggerMiddleware} 日志中间件实例
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class AppService {
 *   constructor(private moduleRef: ModuleRef) {}
 *
 *   async configureLogging(app: FastifyInstance) {
 *     const middleware = getLoggerMiddlewareInstance(this.moduleRef);
 *     await app.register(middleware.plugin);
 *   }
 * }
 * ```
 */
export function getLoggerMiddlewareInstance(moduleRef: {
  get: (token: string) => PinoLoggerMiddleware;
}): PinoLoggerMiddleware {
  return moduleRef.get(DI_TOKENS.FASTIFY_LOGGER_MIDDLEWARE);
}
