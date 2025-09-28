/**
 * 异常处理模块
 *
 * @description 提供统一的异常处理机制，支持标准化错误响应、国际化消息、自定义日志等功能
 * 遵循RFC7807标准，集成自定义logger，支持多租户架构
 *
 * ## 主要功能
 *
 * ### 标准化异常处理
 * - 遵循RFC7807标准的错误响应格式
 * - 支持Swagger文档自动生成
 * - 统一的异常处理机制
 *
 * ### 国际化支持
 * - 支持多语言错误消息
 * - 可配置的消息提供者
 * - 支持消息参数替换
 *
 * ### 自定义日志集成
 * - 集成@hl8/logger日志模块
 * - 结构化日志记录
 * - 支持错误追踪和监控
 *
 * ### 多租户支持
 * - 支持租户级别的错误消息定制
 * - 统一的异常处理适用于所有租户类型
 * - 支持租户特定的错误码和消息
 *
 * @fileoverview 异常处理模块入口文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { 
 *   ExceptionModule,
 *   GeneralNotFoundException,
 *   AnyExceptionFilter,
 *   ExceptionConfig 
 * } from '@hl8/common/exceptions';
 *
 * // 配置异常模块
 * @Module({
 *   imports: [
 *     ExceptionModule.forRoot({
 *       documentationUrl: 'https://docs.example.com/errors',
 *       logLevel: 'error',
 *       enableStackTrace: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 使用异常
 * throw new GeneralNotFoundException(
 *   'User not found',
 *   'The user with ID "user-123" does not exist',
 *   { userId: 'user-123' }
 * );
 * ```
 */

// 核心异常类导出
export * from './core/abstract-http.exception';
export * from './core/general-bad-request.exception';
export * from './core/general-not-found.exception';
export * from './core/general-internal-server.exception';

// 过滤器导出
export * from './filters/any-exception.filter';
export * from './filters/http-exception.filter';

// 值对象导出
export * from './vo/error-response.dto';

// 配置导出
export * from './config/exception.config';
export * from './config/exception-message.provider';

// 工具类导出
export * from './utils/exception.utils';

// 模块导出
export * from './exception.module';
