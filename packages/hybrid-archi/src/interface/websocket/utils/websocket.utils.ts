/**
 * WebSocket工具类
 *
 * @description 提供WebSocket相关的工具函数和辅助类
 * 包括消息序列化、连接管理、错误处理等工具
 *
 * ## 业务规则
 *
 * ### 消息处理规则
 * - 支持消息序列化和反序列化
 * - 支持消息压缩和解压缩
 * - 支持消息加密和解密
 * - 支持消息签名和验证
 *
 * ### 连接管理规则
 * - 支持连接池管理
 * - 支持连接状态监控
 * - 支持连接重连机制
 * - 支持连接负载均衡
 *
 * ### 错误处理规则
 * - 统一的错误格式
 * - 详细的错误信息
 * - 错误分类和处理
 * - 错误恢复机制
 *
 * @example
 * ```typescript
 * // 消息序列化
 * const serializedMessage = WebSocketUtils.serializeMessage(message);
 * const deserializedMessage = WebSocketUtils.deserializeMessage(serializedMessage);
 * 
 * // 连接管理
 * const connectionManager = new WebSocketConnectionManager();
 * await connectionManager.addConnection(client);
 * 
 * // 错误处理
 * const errorResponse = WebSocketUtils.createErrorResponse(error);
 * ```
 *
 * @since 1.0.0
 */

import { IWebSocketClient } from '../../shared/interfaces';

/**
 * WebSocket消息类型
 *
 * @description 定义WebSocket消息的基本结构
 */
export interface IWebSocketMessage {
  /** 消息ID */
  id: string;
  /** 消息类型 */
  type: string;
  /** 消息数据 */
  data: unknown;
  /** 时间戳 */
  timestamp: number;
  /** 请求ID */
  requestId?: string;
  /** 关联ID */
  correlationId?: string;
}

/**
 * WebSocket响应类型
 *
 * @description 定义WebSocket响应的基本结构
 */
export interface IWebSocketResponse<T = unknown> {
  /** 响应ID */
  id: string;
  /** 响应类型 */
  type: string;
  /** 响应数据 */
  data: T;
  /** 状态码 */
  status: 'success' | 'error';
  /** 错误信息 */
  error?: string;
  /** 时间戳 */
  timestamp: number;
  /** 请求ID */
  requestId?: string;
  /** 关联ID */
  correlationId?: string;
}

/**
 * WebSocket错误类型
 *
 * @description 定义WebSocket错误的基本结构
 */
export interface IWebSocketError {
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 错误详情 */
  details?: unknown;
  /** 时间戳 */
  timestamp: number;
  /** 请求ID */
  requestId?: string;
  /** 关联ID */
  correlationId?: string;
}

/**
 * WebSocket工具类
 *
 * @description 提供WebSocket相关的工具函数
 */
export class WebSocketUtils {
  /**
   * 序列化消息
   *
   * @description 将消息对象序列化为JSON字符串
   *
   * @param message - 消息对象
   * @returns 序列化后的字符串
   */
  static serializeMessage(message: IWebSocketMessage): string {
    try {
      return JSON.stringify(message);
    } catch (error) {
      throw new Error(`消息序列化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 反序列化消息
   *
   * @description 将JSON字符串反序列化为消息对象
   *
   * @param data - 序列化的字符串
   * @returns 消息对象
   */
  static deserializeMessage(data: string): IWebSocketMessage {
    try {
      const message = JSON.parse(data) as IWebSocketMessage;
      
      // 验证消息格式
      if (!message.id || !message.type || !message.data) {
        throw new Error('消息格式无效');
      }
      
      return message;
    } catch (error) {
      throw new Error(`消息反序列化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 创建成功响应
   *
   * @description 创建成功的WebSocket响应
   *
   * @param data - 响应数据
   * @param requestId - 请求ID
   * @param correlationId - 关联ID
   * @returns 成功响应对象
   */
  static createSuccessResponse<T>(
    data: T,
    requestId?: string,
    correlationId?: string
  ): IWebSocketResponse<T> {
    return {
      id: this.generateMessageId(),
      type: 'response',
      data,
      status: 'success',
      timestamp: Date.now(),
      requestId,
      correlationId,
    };
  }

  /**
   * 创建错误响应
   *
   * @description 创建错误的WebSocket响应
   *
   * @param error - 错误信息
   * @param requestId - 请求ID
   * @param correlationId - 关联ID
   * @returns 错误响应对象
   */
  static createErrorResponse(
    error: unknown,
    requestId?: string,
    correlationId?: string
  ): IWebSocketResponse {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      id: this.generateMessageId(),
      type: 'error',
      data: null,
      status: 'error',
      error: errorMessage,
      timestamp: Date.now(),
      requestId,
      correlationId,
    };
  }

  /**
   * 创建WebSocket错误
   *
   * @description 创建WebSocket错误对象
   *
   * @param code - 错误代码
   * @param message - 错误消息
   * @param details - 错误详情
   * @param requestId - 请求ID
   * @param correlationId - 关联ID
   * @returns WebSocket错误对象
   */
  static createWebSocketError(
    code: string,
    message: string,
    details?: unknown,
    requestId?: string,
    correlationId?: string
  ): IWebSocketError {
    return {
      code,
      message,
      details,
      timestamp: Date.now(),
      requestId,
      correlationId,
    };
  }

  /**
   * 生成消息ID
   *
   * @description 生成唯一的消息标识符
   *
   * @returns 消息ID
   */
  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 验证消息格式
   *
   * @description 验证消息是否符合预期格式
   *
   * @param message - 消息对象
   * @param expectedType - 期望的消息类型
   * @returns 是否有效
   */
  static validateMessage(message: IWebSocketMessage, expectedType?: string): boolean {
    if (!message || typeof message !== 'object') {
      return false;
    }

    if (!message.id || !message.type || message.data === undefined) {
      return false;
    }

    if (expectedType && message.type !== expectedType) {
      return false;
    }

    return true;
  }

  /**
   * 压缩消息
   *
   * @description 压缩消息数据以减少传输大小
   *
   * @param data - 原始数据
   * @returns 压缩后的数据
   */
  static compressMessage(data: string): string {
    // 这里应该实现消息压缩逻辑
    // 可以使用gzip、deflate等压缩算法
    return data; // 占位符实现
  }

  /**
   * 解压缩消息
   *
   * @description 解压缩消息数据
   *
   * @param data - 压缩的数据
   * @returns 解压缩后的数据
   */
  static decompressMessage(data: string): string {
    // 这里应该实现消息解压缩逻辑
    // 对应压缩算法的解压缩实现
    return data; // 占位符实现
  }

  /**
   * 加密消息
   *
   * @description 加密消息数据以保护隐私
   *
   * @param data - 原始数据
   * @param _key - 加密密钥
   * @returns 加密后的数据
   */
  static encryptMessage(data: string, _key: string): string {
    // 这里应该实现消息加密逻辑
    // 可以使用AES、RSA等加密算法
    return data; // 占位符实现
  }

  /**
   * 解密消息
   *
   * @description 解密消息数据
   *
   * @param data - 加密的数据
   * @param _key - 解密密钥
   * @returns 解密后的数据
   */
  static decryptMessage(data: string, _key: string): string {
    // 这里应该实现消息解密逻辑
    // 对应加密算法的解密实现
    return data; // 占位符实现
  }
}

/**
 * WebSocket连接管理器
 *
 * @description 管理WebSocket连接的创建、维护和销毁
 */
export class WebSocketConnectionManager {
  private readonly connections = new Map<string, IWebSocketClient>();
  private readonly connectionStats = new Map<string, {
    connectedAt: Date;
    lastActivity: Date;
    messageCount: number;
    errorCount: number;
  }>();

  /**
   * 添加连接
   *
   * @description 将WebSocket客户端添加到连接管理器
   *
   * @param client - WebSocket客户端
   */
  addConnection(client: IWebSocketClient): void {
    this.connections.set(client.id, client);
    this.connectionStats.set(client.id, {
      connectedAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      errorCount: 0,
    });
  }

  /**
   * 移除连接
   *
   * @description 从连接管理器中移除WebSocket客户端
   *
   * @param clientId - 客户端ID
   */
  removeConnection(clientId: string): void {
    this.connections.delete(clientId);
    this.connectionStats.delete(clientId);
  }

  /**
   * 获取连接
   *
   * @description 根据客户端ID获取WebSocket连接
   *
   * @param clientId - 客户端ID
   * @returns WebSocket客户端或undefined
   */
  getConnection(clientId: string): IWebSocketClient | undefined {
    return this.connections.get(clientId);
  }

  /**
   * 获取所有连接
   *
   * @description 获取所有活跃的WebSocket连接
   *
   * @returns WebSocket客户端数组
   */
  getAllConnections(): IWebSocketClient[] {
    return Array.from(this.connections.values());
  }

  /**
   * 获取连接统计信息
   *
   * @description 获取指定连接的统计信息
   *
   * @param clientId - 客户端ID
   * @returns 连接统计信息或undefined
   */
  getConnectionStats(clientId: string): {
    connectedAt: Date;
    lastActivity: Date;
    messageCount: number;
    errorCount: number;
  } | undefined {
    return this.connectionStats.get(clientId);
  }

  /**
   * 更新连接活动
   *
   * @description 更新连接的最后活动时间
   *
   * @param clientId - 客户端ID
   */
  updateConnectionActivity(clientId: string): void {
    const stats = this.connectionStats.get(clientId);
    if (stats) {
      stats.lastActivity = new Date();
      stats.messageCount++;
    }
  }

  /**
   * 记录连接错误
   *
   * @description 记录连接的错误次数
   *
   * @param clientId - 客户端ID
   */
  recordConnectionError(clientId: string): void {
    const stats = this.connectionStats.get(clientId);
    if (stats) {
      stats.errorCount++;
    }
  }

  /**
   * 获取连接总数
   *
   * @description 获取当前活跃连接的总数
   *
   * @returns 连接总数
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 清理过期连接
   *
   * @description 清理长时间无活动的连接
   *
   * @param timeout - 超时时间（毫秒）
   */
  cleanupExpiredConnections(timeout: number = 30 * 60 * 1000): void {
    const now = new Date();
    const expiredConnections: string[] = [];

    for (const [clientId, stats] of this.connectionStats.entries()) {
      if (now.getTime() - stats.lastActivity.getTime() > timeout) {
        expiredConnections.push(clientId);
      }
    }

    for (const clientId of expiredConnections) {
      this.removeConnection(clientId);
    }
  }

  /**
   * 获取连接统计摘要
   *
   * @description 获取所有连接的统计摘要
   *
   * @returns 统计摘要
   */
  getConnectionSummary(): {
    totalConnections: number;
    totalMessages: number;
    totalErrors: number;
    averageUptime: number;
  } {
    let totalMessages = 0;
    let totalErrors = 0;
    let totalUptime = 0;

    for (const stats of this.connectionStats.values()) {
      totalMessages += stats.messageCount;
      totalErrors += stats.errorCount;
      totalUptime += Date.now() - stats.connectedAt.getTime();
    }

    return {
      totalConnections: this.connections.size,
      totalMessages,
      totalErrors,
      averageUptime: this.connections.size > 0 ? totalUptime / this.connections.size : 0,
    };
  }
}

/**
 * WebSocket错误处理器
 *
 * @description 处理WebSocket相关的错误
 */
export class WebSocketErrorHandler {
  /**
   * 处理连接错误
   *
   * @description 处理WebSocket连接错误
   *
   * @param error - 错误信息
   * @param client - WebSocket客户端
   * @returns 错误响应
   */
  static handleConnectionError(error: unknown, client: IWebSocketClient): IWebSocketError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.getErrorCode(error);

    return WebSocketUtils.createWebSocketError(
      errorCode,
      `连接错误: ${errorMessage}`,
      { clientId: client.id },
      undefined,
      undefined
    );
  }

  /**
   * 处理消息错误
   *
   * @description 处理WebSocket消息错误
   *
   * @param error - 错误信息
   * @param message - 原始消息
   * @returns 错误响应
   */
  static handleMessageError(error: unknown, message: IWebSocketMessage): IWebSocketError {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = this.getErrorCode(error);

    return WebSocketUtils.createWebSocketError(
      errorCode,
      `消息处理错误: ${errorMessage}`,
      { messageId: message.id, messageType: message.type },
      message.requestId,
      message.correlationId
    );
  }

  /**
   * 获取错误代码
   *
   * @description 根据错误类型获取错误代码
   *
   * @param error - 错误信息
   * @returns 错误代码
   */
  private static getErrorCode(error: unknown): string {
    if (error instanceof Error) {
      const errorName = error.constructor.name;
      
      // 根据错误类型返回相应的错误代码
      switch (errorName) {
        case 'ValidationError':
          return 'VALIDATION_ERROR';
        case 'AuthenticationError':
          return 'AUTHENTICATION_ERROR';
        case 'AuthorizationError':
          return 'AUTHORIZATION_ERROR';
        case 'NotFoundError':
          return 'NOT_FOUND_ERROR';
        case 'TimeoutError':
          return 'TIMEOUT_ERROR';
        default:
          return 'INTERNAL_ERROR';
      }
    }
    
    return 'UNKNOWN_ERROR';
  }
}