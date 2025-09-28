/**
 * HL8 SAAS平台日志请求上下文管理
 *
 * @description 使用 AsyncLocalStorage 管理请求上下文
 * 为每个请求提供独立的日志上下文，支持请求追踪和日志关联
 *
 * @fileoverview 请求上下文管理文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import { AsyncLocalStorage } from 'async_hooks';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RequestContext, RequestMetadata, LogLevel } from './types';

/**
 * 请求上下文存储类
 *
 * @description 存储请求相关的上下文信息
 * 包含请求对象、响应对象、日志级别、用户信息等
 *
 * @example
 * ```typescript
 * const store = new RequestStore(request, reply);
 * store.setContext({ requestId: 'req-123', userId: 'user-456' });
 * ```
 */
export class RequestStore {
  /** 请求对象 */
  public readonly request: FastifyRequest;
  /** 响应对象 */
  public readonly reply: FastifyReply;
  /** 请求上下文 */
  private _context: RequestContext;
  /** 日志级别 */
  private _logLevel: LogLevel;

  /**
   * 创建请求存储实例
   *
   * @description 初始化请求存储，设置默认上下文和日志级别
   *
   * @param request - Fastify 请求对象
   * @param reply - Fastify 响应对象
   * @param context - 请求上下文信息
   * @param logLevel - 日志级别
   *
   * @example
   * ```typescript
   * const store = new RequestStore(request, reply, {
   *   requestId: 'req-123',
   *   userId: 'user-456'
   * }, 'info');
   * ```
   */
  constructor(
    request: FastifyRequest,
    reply: FastifyReply,
    context: RequestContext,
    logLevel: LogLevel = 'info'
  ) {
    this.request = request;
    this.reply = reply;
    this._context = context;
    this._logLevel = logLevel;
  }

  /**
   * 获取请求上下文
   *
   * @description 返回当前请求的上下文信息
   * @returns {RequestContext} 请求上下文信息
   *
   * @example
   * ```typescript
   * const context = store.getContext();
   * console.log(context.requestId); // 'req-123'
   * ```
   */
  getContext(): RequestContext {
    return this._context;
  }

  /**
   * 设置请求上下文
   *
   * @description 更新当前请求的上下文信息
   * @param context - 新的上下文信息
   *
   * @example
   * ```typescript
   * store.setContext({
   *   requestId: 'req-456',
   *   userId: 'user-789',
   *   traceId: 'trace-abc'
   * });
   * ```
   */
  setContext(context: RequestContext): void {
    this._context = { ...this._context, ...context };
  }

  /**
   * 获取日志级别
   *
   * @description 返回当前请求的日志级别
   * @returns {LogLevel} 日志级别
   *
   * @example
   * ```typescript
   * const level = store.getLogLevel();
   * console.log(level); // 'info'
   * ```
   */
  getLogLevel(): LogLevel {
    return this._logLevel;
  }

  /**
   * 设置日志级别
   *
   * @description 更新当前请求的日志级别
   * @param level - 新的日志级别
   *
   * @example
   * ```typescript
   * store.setLogLevel('debug');
   * ```
   */
  setLogLevel(level: LogLevel): void {
    this._logLevel = level;
  }

  /**
   * 更新上下文元数据
   *
   * @description 更新上下文中的元数据信息
   * @param metadata - 元数据对象
   *
   * @example
   * ```typescript
   * store.updateMetadata({ 
   *   operation: 'user-login',
   *   ip: '192.168.1.1'
   * });
   * ```
   */
  updateMetadata(metadata: Record<string, unknown>): void {
    this._context.metadata = { ...this._context.metadata, ...metadata };
  }

  /**
   * 清除请求上下文
   *
   * @description 清除当前请求的上下文信息
   */
  clearContext(): void {
    this._context = {
      requestId: '',
      userId: '',
      traceId: '',
      metadata: {}
    };
  }

  /**
   * 获取请求元数据
   *
   * @description 获取当前请求的元数据信息
   * @returns {RequestMetadata | undefined} 请求元数据
   */
  getMetadata(): RequestMetadata | undefined {
    return this._context.metadata;
  }

  /**
   * 设置请求元数据
   *
   * @description 设置当前请求的元数据信息
   * @param metadata - 元数据对象
   */
  setMetadata(metadata: RequestMetadata): void {
    this._context.metadata = metadata;
  }

  /**
   * 清除请求元数据
   *
   * @description 清除当前请求的元数据信息
   */
  clearMetadata(): void {
    this._context.metadata = {};
  }

  /**
   * 获取请求ID
   *
   * @description 返回当前请求的唯一标识
   * @returns {string} 请求ID
   *
   * @example
   * ```typescript
   * const requestId = store.getRequestId();
   * console.log(requestId); // 'req-123'
   * ```
   */
  getRequestId(): string {
    return this._context.requestId;
  }

  /**
   * 获取用户ID
   *
   * @description 返回当前请求的用户ID
   * @returns {string | undefined} 用户ID，如果未设置则返回 undefined
   *
   * @example
   * ```typescript
   * const userId = store.getUserId();
   * if (userId) {
   *   console.log(`User: ${userId}`);
   * }
   * ```
   */
  getUserId(): string | undefined {
    return this._context.userId;
  }

  /**
   * 设置用户ID
   *
   * @description 设置当前请求的用户ID
   * @param userId - 用户ID
   *
   * @example
   * ```typescript
   * store.setUserId('user-456');
   * ```
   */
  setUserId(userId: string): void {
    this._context.userId = userId;
  }

  /**
   * 获取追踪ID
   *
   * @description 返回当前请求的追踪ID
   * @returns {string | undefined} 追踪ID，如果未设置则返回 undefined
   *
   * @example
   * ```typescript
   * const traceId = store.getTraceId();
   * if (traceId) {
   *   console.log(`Trace: ${traceId}`);
   * }
   * ```
   */
  getTraceId(): string | undefined {
    return this._context.traceId;
  }

  /**
   * 设置追踪ID
   *
   * @description 设置当前请求的追踪ID
   * @param traceId - 追踪ID
   *
   * @example
   * ```typescript
   * store.setTraceId('trace-abc');
   * ```
   */
  setTraceId(traceId: string): void {
    this._context.traceId = traceId;
  }
}

/**
 * 请求上下文存储
 *
 * @description 使用 AsyncLocalStorage 管理请求上下文
 * 为每个请求提供独立的上下文存储，支持异步操作中的上下文传递
 *
 * @example
 * ```typescript
 * // 在请求处理中设置上下文
 * storage.run(store, () => {
 *   // 在这个作用域内的所有操作都能访问到请求上下文
 *   const context = storage.getStore();
   *   console.log(context.getRequestId());
   * });
   * ```
   */
export const storage = new AsyncLocalStorage<RequestStore>();

/**
 * 获取当前请求上下文
 *
 * @description 从 AsyncLocalStorage 中获取当前请求的上下文
 * @returns {RequestStore | undefined} 当前请求的上下文存储，如果不在请求作用域内则返回 undefined
 *
 * @example
   * ```typescript
   * const store = getCurrentRequestStore();
   * if (store) {
   *   const requestId = store.getRequestId();
   *   console.log(`Current request: ${requestId}`);
   * }
   * ```
   */
export function getCurrentRequestStore(): RequestStore | undefined {
  return storage.getStore();
}

/**
 * 获取当前请求上下文信息
 *
 * @description 从当前请求上下文中获取上下文信息
 * @returns {RequestContext | undefined} 当前请求的上下文信息，如果不在请求作用域内则返回 undefined
 *
 * @example
   * ```typescript
   * const context = getCurrentRequestContext();
   * if (context) {
   *   console.log(`Request ID: ${context.requestId}`);
   *   console.log(`User ID: ${context.userId}`);
   * }
   * ```
   */
export function getCurrentRequestContext(): RequestContext | null {
  const store = getCurrentRequestStore();
  return store?.getContext() || null;
}

/**
 * 获取当前请求ID
 *
 * @description 从当前请求上下文中获取请求ID
 * @returns {string | undefined} 当前请求的ID，如果不在请求作用域内则返回 undefined
 *
 * @example
   * ```typescript
   * const requestId = getCurrentRequestId();
   * if (requestId) {
   *   console.log(`Processing request: ${requestId}`);
   * }
   * ```
   */
export function getCurrentRequestId(): string | undefined {
  const store = getCurrentRequestStore();
  return store?.getRequestId();
}

/**
 * 获取当前用户ID
 *
 * @description 从当前请求上下文中获取用户ID
 * @returns {string | undefined} 当前请求的用户ID，如果不在请求作用域内或未设置则返回 undefined
 *
 * @example
   * ```typescript
   * const userId = getCurrentUserId();
   * if (userId) {
   *   console.log(`Current user: ${userId}`);
   * }
   * ```
   */
export function getCurrentUserId(): string | undefined {
  const store = getCurrentRequestStore();
  return store?.getUserId();
}

/**
 * 设置当前请求上下文
 *
 * @description 更新当前请求的上下文信息
 * @param context - 新的上下文信息
 *
 * @example
   * ```typescript
   * setCurrentRequestContext({
   *   requestId: 'req-123',
   *   userId: 'user-456',
   *   traceId: 'trace-789'
   * });
   * ```
   */
export function setCurrentRequestContext(context: RequestContext): void {
  const store = getCurrentRequestStore();
  if (store) {
    store.setContext(context);
  }
}

/**
 * 更新当前请求元数据
 *
 * @description 更新当前请求上下文中的元数据信息
 * @param metadata - 元数据对象
 *
 * @example
   * ```typescript
   * updateCurrentRequestMetadata({
   *   operation: 'user-login',
   *   ip: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...'
   * });
   * ```
   */
export function updateCurrentRequestMetadata(metadata: Record<string, unknown>): void {
  const store = getCurrentRequestStore();
  if (store) {
    store.updateMetadata(metadata);
  }
}


/**
 * 清除当前请求上下文
 *
 * @description 清除当前请求的上下文信息
 */
export function clearCurrentRequestContext(): void {
  const store = getCurrentRequestStore();
  if (store) {
    store.clearContext();
  }
}

/**
 * 获取当前请求元数据
 *
 * @description 获取当前请求上下文中的元数据信息
 * @returns {RequestMetadata | undefined} 当前请求的元数据，如果不在请求作用域内则返回 undefined
 */
export function getCurrentRequestMetadata(): RequestMetadata | null {
  const store = getCurrentRequestStore();
  return store?.getMetadata() || null;
}

/**
 * 设置当前请求元数据
 *
 * @description 设置当前请求上下文中的元数据信息
 * @param metadata - 元数据对象
 */
export function setCurrentRequestMetadata(metadata: RequestMetadata): void {
  const store = getCurrentRequestStore();
  if (store) {
    store.setMetadata(metadata);
  }
}

/**
 * 清除当前请求元数据
 *
 * @description 清除当前请求上下文中的元数据信息
 */
export function clearCurrentRequestMetadata(): void {
  const store = getCurrentRequestStore();
  if (store) {
    store.clearMetadata();
  }
}

/**
 * 使用请求上下文包装函数
 *
 * @description 在指定的请求上下文中执行函数
 * @param context - 请求上下文
 * @param fn - 要执行的函数
 * @returns {Promise<T>} 函数执行结果
 */
export async function withRequestContext<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run(new RequestStore(null as unknown as FastifyRequest, null as unknown as FastifyReply, context), fn);
}
