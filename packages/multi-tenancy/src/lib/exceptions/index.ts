/**
 * 多租户异常处理模块
 *
 * @description 提供多租户相关的专用异常类
 * 集成 @hl8/common/exceptions 模块，提供统一的异常处理机制
 *
 * ## 业务规则
 *
 * ### 异常分类规则
 * - 租户相关异常：租户未找到、租户上下文无效、租户配置无效
 * - 隔离相关异常：租户数据隔离失败、多层级数据隔离失败
 * - 上下文相关异常：多层级上下文无效
 * - 统一错误码：每个异常都有唯一的错误码标识
 *
 * ### 异常处理规则
 * - 遵循 RFC7807 标准的错误响应格式
 * - 支持 Swagger 文档自动生成和错误码映射
 * - 统一的异常处理机制，确保错误响应一致性
 * - 支持自定义错误码和错误消息
 * - 自动生成错误文档和调试信息
 *
 * ### 集成规则
 * - 继承 @hl8/common/exceptions 的 AbstractHttpException
 * - 使用统一的错误响应格式和HTTP状态码
 * - 支持消息提供者和国际化
 * - 集成日志记录和错误追踪
 *
 * @example
 * ```typescript
 * import {
 *   TenantNotFoundException,
 *   TenantContextInvalidException,
 *   TenantIsolationFailedException,
 *   MultiLevelContextInvalidException,
 *   MultiLevelIsolationFailedException,
 *   TenantConfigInvalidException
 * } from '@hl8/multi-tenancy/exceptions';
 *
 * // 使用租户异常
 * if (!tenant) {
 *   throw new TenantNotFoundException(
 *     'Tenant not found',
 *     'The tenant with the specified ID does not exist',
 *     { tenantId: 'tenant-123' }
 *   );
 * }
 *
 * // 使用上下文异常
 * if (!context) {
 *   throw new TenantContextInvalidException(
 *     'Tenant context missing',
 *     'The tenant context is required but not provided',
 *     { contextType: 'tenant-id' }
 *   );
 * }
 * ```
 *
 * @since 1.0.0
 */

// 租户相关异常
export * from './tenant-not-found.exception';
export * from './tenant-context-invalid.exception';
export * from './tenant-config-invalid.exception';

// 隔离相关异常
export * from './tenant-isolation-failed.exception';

// 多层级相关异常
export * from './multi-level-context-invalid.exception';
export * from './multi-level-isolation-failed.exception';
