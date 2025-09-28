/**
 * HL8 SAAS平台日志模块
 *
 * @description 提供完整的日志模块配置和依赖注入支持
 * 支持同步和异步配置，专为 Fastify 平台优化
 *
 * @fileoverview 日志模块实现文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import { DynamicModule, Global, Module, NestModule } from '@nestjs/common';
import { PinoLogger } from './pino-logger';
import { PinoLoggerMiddleware } from './fastify-middleware';
import { LoggerModuleParams, LoggerModuleAsyncParams } from './types';
import { LOGGER_MODULE_PARAMS, LOGGER_PROVIDER } from './constants';

/**
 * HL8 SAAS平台日志模块
 *
 * @description 提供完整的日志功能，包括日志记录器、中间件、装饰器等
 * 专为 Fastify 平台设计，支持高性能日志记录和请求上下文绑定
 *
 * ## 主要功能
 *
 * ### 模块化设计
 * - 支持全局和局部模块配置
 * - 支持同步和异步配置方式
 * - 完整的依赖注入支持
 *
 * ### 高性能日志记录
 * - 基于 Pino 的高性能日志记录器
 * - 支持异步日志记录和结构化输出
 * - 支持多种输出目标和日志轮转
 *
 * ### 请求上下文绑定
 * - 自动绑定请求上下文到日志
 * - 支持请求ID、用户ID、追踪ID等上下文信息
 * - 使用 AsyncLocalStorage 实现上下文传递
 *
 * ### 中间件支持
 * - 自动请求/响应日志记录
 * - 支持路径排除和自定义配置
 * - 完整的错误处理和日志记录
 *
 * @example
 * ```typescript
 * // 同步配置
 * @Module({
 *   imports: [LoggerModule.forRoot({
 *     config: {
 *       level: 'info',
 *       destination: { type: 'file', path: './logs/app.log' }
 *     }
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
 *         destination: { type: 'file', path: config.get('LOG_PATH') }
 *       }
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
   * @description 使用同步方式配置日志模块
   * 适用于配置信息已知且不需要动态获取的场景
   *
   * @param params - 日志模块参数
   * @returns {DynamicModule} 动态模块配置
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [LoggerModule.forRoot({
   *     config: {
   *       level: 'info',
   *       destination: { type: 'file', path: './logs/app.log' }
     *     },
   *     enableRequestLogging: true,
   *     enableResponseLogging: true
   *   })],
   * })
   * export class AppModule {}
   * ```
   */
  static forRoot(params: LoggerModuleParams = {}): DynamicModule {
    const providers: any[] = [
      {
        provide: LOGGER_MODULE_PARAMS,
        useValue: params,
      },
      {
        provide: LOGGER_PROVIDER,
        useFactory: (moduleParams: LoggerModuleParams) => {
          return new PinoLogger(moduleParams.config);
        },
        inject: [LOGGER_MODULE_PARAMS],
      },
    ];

    const exports = [LOGGER_PROVIDER];

    // 如果启用了请求日志记录，添加中间件提供者
    if (params.enableRequestLogging || params.enableResponseLogging) {
      providers.push({
        provide: 'FASTIFY_LOGGER_MIDDLEWARE',
        useFactory: (moduleParams: LoggerModuleParams): PinoLoggerMiddleware => {
          return new PinoLoggerMiddleware({
            enableRequestLogging: moduleParams.enableRequestLogging,
            enableResponseLogging: moduleParams.enableResponseLogging,
            loggerConfig: moduleParams.config,
          });
        },
        inject: [LOGGER_MODULE_PARAMS],
      });

      exports.push('FASTIFY_LOGGER_MIDDLEWARE');
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
   * @description 使用异步方式配置日志模块
   * 适用于需要动态获取配置信息的场景，如从配置文件或环境变量读取
   *
   * @param params - 异步日志模块参数
   * @returns {DynamicModule} 动态模块配置
   *
   * @example
   * ```typescript
   * @Module({
   *   imports: [LoggerModule.forRootAsync({
   *     imports: [ConfigModule],
   *     inject: [ConfigService],
   *     useFactory: (config: ConfigService) => ({
   *       config: {
   *         level: config.get('LOG_LEVEL'),
   *         destination: { type: 'file', path: config.get('LOG_PATH') }
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
    const providers: any[] = [
      {
        provide: LOGGER_MODULE_PARAMS,
        useFactory: params.useFactory,
        inject: params.inject || [],
      },
      {
        provide: LOGGER_PROVIDER,
        useFactory: (moduleParams: LoggerModuleParams) => {
          return new PinoLogger(moduleParams.config);
        },
        inject: [LOGGER_MODULE_PARAMS],
      },
    ];

    const exports = [LOGGER_PROVIDER];

    // 添加中间件提供者（总是添加，因为配置是动态的）
    providers.push({
      provide: 'FASTIFY_LOGGER_MIDDLEWARE',
      useFactory: (moduleParams: LoggerModuleParams): PinoLoggerMiddleware => {
        return new PinoLoggerMiddleware({
          enableRequestLogging: moduleParams.enableRequestLogging,
          enableResponseLogging: moduleParams.enableResponseLogging,
          loggerConfig: moduleParams.config,
        });
      },
      inject: [LOGGER_MODULE_PARAMS],
    });

    exports.push('FASTIFY_LOGGER_MIDDLEWARE');

    return {
      module: LoggerModule,
      global: true,
      imports: (params.imports as any[]) || [],
      providers: [...providers, ...(params.providers || [])],
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
      provide: LOGGER_MODULE_PARAMS,
      useValue: config,
    },
    {
      provide: LOGGER_PROVIDER,
      useFactory: (moduleParams: LoggerModuleParams) => {
        return new PinoLogger(moduleParams.config);
      },
      inject: [LOGGER_MODULE_PARAMS],
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
export function createLoggerMiddlewareProviders(config: Record<string, unknown> = {}) {
  return [
    {
      provide: 'FASTIFY_LOGGER_MIDDLEWARE',
      useFactory: (moduleParams: LoggerModuleParams) => {
        return new PinoLoggerMiddleware({
          enableRequestLogging: moduleParams.enableRequestLogging,
          enableResponseLogging: moduleParams.enableResponseLogging,
          loggerConfig: moduleParams.config,
          ...config,
        });
      },
      inject: [LOGGER_MODULE_PARAMS],
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
export function getLoggerInstance(moduleRef: { get: (token: string) => PinoLogger }): PinoLogger {
  return moduleRef.get(LOGGER_PROVIDER);
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
export function getLoggerMiddlewareInstance(moduleRef: { get: (token: string) => PinoLoggerMiddleware }): PinoLoggerMiddleware {
  return moduleRef.get('FASTIFY_LOGGER_MIDDLEWARE');
}