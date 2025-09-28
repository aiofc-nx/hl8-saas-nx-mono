/**
 * HL8 SAAS平台异常处理模块
 *
 * 提供统一的异常处理机制，支持标准化错误响应、国际化消息、自定义日志等功能。
 * 遵循 RFC7807 标准，集成自定义 logger，支持多租户架构。
 * 遵循 Clean Architecture 的基础设施层设计原则，为整个平台提供统一的异常处理服务。
 *
 * @description 此模块是 HL8 SAAS 平台的基础设施层核心模块，提供完整的异常处理功能。
 * 包含标准化异常类、异常过滤器、错误响应格式、国际化支持等功能。
 * 专为多租户 SAAS 平台设计，提供统一的错误处理和响应机制。
 *
 * ## 业务规则
 *
 * ### 标准化异常处理规则
 * - 遵循 RFC7807 标准的错误响应格式
 * - 支持 Swagger 文档自动生成和错误码映射
 * - 统一的异常处理机制，确保错误响应一致性
 * - 支持自定义错误码和错误消息
 * - 自动生成错误文档和调试信息
 *
 * ### 国际化支持规则
 * - 支持多语言错误消息和本地化
 * - 可配置的消息提供者和翻译服务
 * - 支持消息参数替换和动态内容生成
 * - 支持租户级别的语言偏好设置
 * - 提供默认语言回退机制
 *
 * ### 日志集成规则
 * - 集成 @hl8/logger 日志模块，提供结构化日志记录
 * - 支持错误追踪和监控，便于问题诊断
 * - 自动记录异常堆栈信息和上下文数据
 * - 支持日志级别配置和过滤
 * - 提供错误统计和报告功能
 *
 * ### 多租户支持规则
 * - 支持租户级别的错误消息定制和个性化
 * - 统一的异常处理适用于所有租户类型
 * - 支持租户特定的错误码和消息映射
 * - 提供租户隔离的错误处理和响应
 * - 支持租户级别的错误监控和告警
 *
 * ## 业务逻辑流程
 *
 * 1. **异常抛出**：业务代码抛出标准化异常
 * 2. **异常捕获**：异常过滤器捕获和处理异常
 * 3. **消息处理**：获取本地化错误消息和参数替换
 * 4. **日志记录**：记录结构化日志和错误信息
 * 5. **响应构建**：构建标准化的错误响应
 * 6. **响应返回**：返回符合 RFC7807 标准的错误响应
 *
 * @example
 * ```typescript
 * import {
 *   ExceptionModule,
 *   GeneralNotFoundException,
 *   AnyExceptionFilter,
 *   ExceptionConfig
 * } from '@hl8/common/exceptions';
 * import { Module } from '@nestjs/common';
 *
 * // 配置异常模块
 * @Module({
 *   imports: [
 *     ExceptionModule.forRoot({
 *       documentationUrl: 'https://docs.example.com/errors',
 *       logLevel: 'error',
 *       enableStackTrace: true,
 *       defaultLanguage: 'zh-CN',
 *       supportedLanguages: ['zh-CN', 'en-US']
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 使用异常
 * @Injectable()
 * export class UserService {
 *   async getUser(id: string) {
 *     const user = await this.userRepository.findById(id);
 *     if (!user) {
 *       throw new GeneralNotFoundException(
 *         'User not found',
 *         'The user with ID "user-123" does not exist',
 *         { userId: 'user-123', timestamp: new Date().toISOString() }
 *       );
 *     }
 *     return user;
 *   }
 * }
 *
 * // 自定义异常过滤器
 * @Catch()
 * export class CustomExceptionFilter extends AnyExceptionFilter {
 *   catch(exception: unknown, host: ArgumentsHost) {
 *     // 自定义异常处理逻辑
 *     super.catch(exception, host);
 *   }
 * }
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
