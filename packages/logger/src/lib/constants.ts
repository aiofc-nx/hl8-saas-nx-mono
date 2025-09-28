/**
 * Logger 模块常量定义
 *
 * @description 定义日志模块中使用的常量
 * 用于依赖注入和模块配置
 *
 * @fileoverview 日志模块常量定义文件
 * @author HL8 Team
 * @since 1.0.0
 */

/**
 * 日志模块参数提供者令牌
 *
 * @description 用于依赖注入的令牌，用于获取日志模块配置参数
 * 在 NestJS 模块中用于注入日志模块的配置参数
 *
 * @example
 * ```typescript
 * @Inject(LOGGER_MODULE_PARAMS)
 * private readonly loggerParams: LoggerModuleParams
 * ```
 */
export const LOGGER_MODULE_PARAMS = 'LOGGER_MODULE_PARAMS';

/**
 * 日志记录器提供者令牌
 *
 * @description 用于依赖注入的令牌，用于获取日志记录器实例
 * 在 NestJS 模块中用于注入 FastifyLogger 实例
 *
 * @example
 * ```typescript
 * @Inject(LOGGER_PROVIDER)
 * private readonly logger: FastifyLogger
 * ```
 */
export const LOGGER_PROVIDER = 'LOGGER_PROVIDER';
