import { HttpStatus } from '@nestjs/common';
import {
  AbstractHttpException,
  GeneralBadRequestException,
  GeneralInternalServerException,
  GeneralNotFoundException,
} from '@hl8/common';

/**
 * 消息队列连接异常
 *
 * 表示消息队列连接失败的异常，通常用于适配器连接、网络问题等场景。
 *
 * @description 此异常表示消息队列连接失败。
 * 通常用于适配器连接、网络问题等场景。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 触发条件规则
 * - 消息队列服务器不可用
 * - 网络连接超时
 * - 认证失败
 * - 配置错误
 *
 * ### 响应规则
 * - HTTP状态码：500 Internal Server Error
 * - 错误码：MESSAGING_CONNECTION_ERROR
 * - 包含连接信息和错误详情
 * - 支持错误追踪和调试
 *
 * ### 异常处理规则
 * - 支持异常信息记录
 * - 支持异常上下文保存
 * - 支持异常重试机制
 * - 支持异常监控和告警
 *
 * @example
 * ```typescript
 * throw new MessagingConnectionException(
 *   'RabbitMQ connection failed',
 *   'Unable to connect to RabbitMQ server',
 *   { adapter: 'rabbitmq', host: 'localhost', port: 5672 }
 * );
 * ```
 */
export class MessagingConnectionException extends GeneralInternalServerException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(title, detail, data, rootCause);
    // this.errorCode = 'MESSAGING_CONNECTION_ERROR';
  }
}

/**
 * 消息发布异常
 *
 * @description 表示消息发布失败的异常
 * 通常用于消息格式错误、主题不存在等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 消息格式错误
 * - 主题不存在
 * - 发布权限不足
 * - 消息队列满
 *
 * ### 响应规则
 * - HTTP状态码：400 Bad Request
 * - 错误码：MESSAGING_PUBLISH_ERROR
 * - 包含消息信息和错误详情
 *
 * @example
 * ```typescript
 * throw new MessagingPublishException(
 *   'Failed to publish message',
 *   'Message format is invalid',
 *   { topic: 'user.created', messageId: 'msg-123' }
 * );
 * ```
 */
export class MessagingPublishException extends GeneralBadRequestException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(title, detail, data, rootCause);
    // this.errorCode = 'MESSAGING_PUBLISH_ERROR';
  }
}

/**
 * 消息消费异常
 *
 * @description 表示消息消费失败的异常
 * 通常用于处理器错误、消息格式错误等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 消息处理器执行失败
 * - 消息格式错误
 * - 业务逻辑错误
 * - 重试次数超限
 *
 * ### 响应规则
 * - HTTP状态码：500 Internal Server Error
 * - 错误码：MESSAGING_CONSUME_ERROR
 * - 包含消息和处理器信息
 *
 * @example
 * ```typescript
 * throw new MessagingConsumeException(
 *   'Message processing failed',
 *   'Handler execution error',
 *   { topic: 'user.created', handler: 'UserEventHandler', messageId: 'msg-123' }
 * );
 * ```
 */
export class MessagingConsumeException extends GeneralInternalServerException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(title, detail, data, rootCause);
    // this.errorCode = 'MESSAGING_CONSUME_ERROR';
  }
}

/**
 * 适配器未找到异常
 *
 * @description 表示请求的适配器类型不存在的异常
 * 通常用于配置错误、适配器类型错误等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 适配器类型不存在
 * - 适配器未配置
 * - 适配器实例化失败
 *
 * ### 响应规则
 * - HTTP状态码：404 Not Found
 * - 错误码：MESSAGING_ADAPTER_NOT_FOUND
 * - 包含适配器类型信息
 *
 * @example
 * ```typescript
 * throw new MessagingAdapterNotFoundException(
 *   'Adapter not found',
 *   'The requested messaging adapter does not exist',
 *   { adapterType: 'invalid-adapter' }
 * );
 * ```
 */
export class MessagingAdapterNotFoundException extends GeneralNotFoundException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(title, detail, data, rootCause);
    // this.errorCode = 'MESSAGING_ADAPTER_NOT_FOUND';
  }
}

/**
 * 租户隔离异常
 *
 * @description 表示租户隔离操作失败的异常
 * 通常用于多租户上下文错误、权限不足等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 租户上下文缺失
 * - 跨租户访问
 * - 租户权限不足
 * - 租户隔离策略失败
 *
 * ### 响应规则
 * - HTTP状态码：403 Forbidden
 * - 错误码：MESSAGING_TENANT_ISOLATION_ERROR
 * - 包含租户和权限信息
 *
 * @example
 * ```typescript
 * throw new MessagingTenantIsolationException(
 *   'Tenant isolation violation',
 *   'Cross-tenant access is not allowed',
 *   { tenantId: 'tenant-123', resource: 'topic:user.events' }
 * );
 * ```
 */
export class MessagingTenantIsolationException extends AbstractHttpException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(
      'MESSAGING_TENANT_ISOLATION_ERROR',
      title,
      detail,
      HttpStatus.FORBIDDEN,
      data,
      'MESSAGING_TENANT_ISOLATION_ERROR',
      rootCause
    );
  }
}

/**
 * 任务处理异常
 *
 * @description 表示异步任务处理失败的异常
 * 通常用于任务执行错误、调度失败等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 任务执行失败
 * - 任务调度错误
 * - 任务超时
 * - 任务重试失败
 *
 * ### 响应规则
 * - HTTP状态码：500 Internal Server Error
 * - 错误码：MESSAGING_TASK_ERROR
 * - 包含任务信息和错误详情
 *
 * @example
 * ```typescript
 * throw new MessagingTaskException(
 *   'Task execution failed',
 *   'Task handler threw an error',
 *   { taskId: 'task-123', taskName: 'ProcessUserData' }
 * );
 * ```
 */
export class MessagingTaskException extends GeneralInternalServerException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(title, detail, data, rootCause);
    // this.errorCode = 'MESSAGING_TASK_ERROR';
  }
}

/**
 * 消息队列配置异常
 *
 * @description 表示消息队列配置错误的异常
 * 通常用于配置验证失败、参数错误等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 配置参数无效
 * - 必填配置缺失
 * - 配置格式错误
 * - 配置冲突
 *
 * ### 响应规则
 * - HTTP状态码：400 Bad Request
 * - 错误码：MESSAGING_CONFIG_ERROR
 * - 包含配置信息
 *
 * @example
 * ```typescript
 * throw new MessagingConfigException(
 *   'Invalid messaging configuration',
 *   'RabbitMQ URL is required',
 *   { missingField: 'rabbitmq.url' }
 * );
 * ```
 */
export class MessagingConfigException extends GeneralBadRequestException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(title, detail, data, rootCause);
    // this.errorCode = 'MESSAGING_CONFIG_ERROR';
  }
}

/**
 * 消息序列化异常
 *
 * @description 表示消息序列化/反序列化失败的异常
 * 通常用于消息格式转换、编码错误等场景
 *
 * ## 业务规则
 *
 * ### 触发条件
 * - 消息序列化失败
 * - 消息反序列化失败
 * - 消息格式不兼容
 * - 编码错误
 *
 * ### 响应规则
 * - HTTP状态码：400 Bad Request
 * - 错误码：MESSAGING_SERIALIZATION_ERROR
 * - 包含消息和格式信息
 *
 * @example
 * ```typescript
 * throw new MessagingSerializationException(
 *   'Message serialization failed',
 *   'Unable to serialize message to JSON',
 *   { messageType: 'UserEvent', originalError: 'Invalid JSON' }
 * );
 * ```
 */
export class MessagingSerializationException extends GeneralBadRequestException {
  constructor(
    title: string,
    detail: string,
    data?: Record<string, unknown>,
    rootCause?: unknown
  ) {
    super(title, detail, data, rootCause);
    // this.errorCode = 'MESSAGING_SERIALIZATION_ERROR';
  }
}
