/**
 * 通用WebSocket网关基类
 *
 * @description 提供通用的WebSocket连接和消息处理
 * @since 1.0.0
 */

// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   MessageBody,
//   ConnectedSocket,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';

/**
 * 连接信息接口
 *
 * @description WebSocket连接的信息
 */
export interface IConnectionInfo {
  userId: string;
  tenantId?: string;
  userAgent?: string;
  ipAddress?: string;
  connectedAt: Date;
}

/**
 * 消息响应接口
 *
 * @description WebSocket消息的响应格式
 */
export interface IMessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

/**
 * 通用WebSocket网关基类
 *
 * @description 提供通用的WebSocket连接和消息处理
 *
 * ## 功能特性
 *
 * ### 连接管理
 * - 用户身份验证
 * - 租户隔离
 * - 连接状态管理
 * - 自动重连支持
 *
 * ### 消息处理
 * - 实时消息推送
 * - 消息广播
 * - 房间管理
 * - 事件处理
 *
 * ### 状态管理
 * - 在线状态
 * - 活动状态
 * - 连接统计
 * - 性能监控
 */
export abstract class BaseGateway {
  // implements OnGatewayConnection, OnGatewayDisconnect
  // @WebSocketServer()
  protected server: unknown;

  protected connections = new Map<string, IConnectionInfo>();

  /**
   * 处理客户端连接
   *
   * @description 处理WebSocket客户端连接
   * @param client - Socket客户端
   * @param args - 连接参数
   */
  async handleConnection(client: { 
    id: string; 
    join: (room: string) => void;
    emit: (event: string, data: unknown) => void;
    disconnect: () => void;
    handshake: { 
      query: { token?: string }; 
      headers: { authorization?: string; 'user-agent'?: string }; 
      address?: string;
    };
  }, ...args: unknown[]): Promise<void> {
    try {
      const connectionInfo = await this.authenticateConnection(client);
      this.connections.set(client.id, connectionInfo);

      console.log(`客户端连接: ${client.id}`, connectionInfo);

      // 加入用户房间
      if (connectionInfo.userId) {
        client.join(`user:${connectionInfo.userId}`);
      }

      // 加入租户房间
      if (connectionInfo.tenantId) {
        client.join(`tenant:${connectionInfo.tenantId}`);
      }

      // 发送连接成功消息
      client.emit(
        'connected',
        this.createSuccessResponse(
          {
            clientId: client.id,
            userId: connectionInfo.userId,
            tenantId: connectionInfo.tenantId,
          },
          '连接成功'
        )
      );
    } catch (error) {
      console.error('连接认证失败:', error);
      client.emit('error', this.createErrorResponse('连接认证失败'));
      client.disconnect();
    }
  }

  /**
   * 处理客户端断开连接
   *
   * @description 处理WebSocket客户端断开连接
   * @param client - Socket客户端
   */
  async handleDisconnect(client: { id: string }): Promise<void> {
    const connectionInfo = this.connections.get(client.id);
    if (connectionInfo) {
      console.log(`客户端断开连接: ${client.id}`, connectionInfo);
      this.connections.delete(client.id);
    }
  }

  /**
   * 认证连接
   *
   * @description 认证WebSocket连接
   * @param client - Socket客户端
   * @returns 连接信息
   * @protected
   */
  protected async authenticateConnection(
    client: { 
      id: string; 
      handshake: { 
        query: { token?: string }; 
        headers: { authorization?: string; 'user-agent'?: string }; 
        address?: string;
      } 
    }
  ): Promise<IConnectionInfo> {
    // 从查询参数或头信息获取认证信息
    const token =
      (client.handshake.query.token as string) ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new Error('未提供认证令牌');
    }

    // TODO: 实现JWT令牌验证
    // const payload = await this.jwtService.verifyAsync(token);

    // 模拟认证逻辑
    const userId = 'user-123'; // 从JWT payload获取
    const tenantId = 'tenant-123'; // 从JWT payload获取

    return {
      userId,
      tenantId,
      userAgent: client.handshake.headers['user-agent'],
      ipAddress: client.handshake.address,
      connectedAt: new Date(),
    };
  }

  /**
   * 创建成功响应
   *
   * @description 创建WebSocket操作成功的响应
   * @param data - 响应数据
   * @param message - 响应消息
   * @returns 消息响应
   * @protected
   */
  protected createSuccessResponse<T>(
    data: T,
    message = '操作成功'
  ): IMessageResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date(),
    };
  }

  /**
   * 创建错误响应
   *
   * @description 创建WebSocket操作失败的响应
   * @param error - 错误信息
   * @returns 消息响应
   * @protected
   */
  protected createErrorResponse(error: string): IMessageResponse {
    return {
      success: false,
      error,
      timestamp: new Date(),
    };
  }

  /**
   * 向用户发送消息
   *
   * @description 向指定用户发送消息
   * @param userId - 用户ID
   * @param event - 事件名称
   * @param data - 消息数据
   * @protected
   */
  protected sendToUser(userId: string, event: string, data: unknown): void {
    (this.server as { to: (room: string) => { emit: (event: string, data: unknown) => void } }).to(`user:${userId}`).emit(event, data);
  }

  /**
   * 向租户发送消息
   *
   * @description 向指定租户的所有用户发送消息
   * @param tenantId - 租户ID
   * @param event - 事件名称
   * @param data - 消息数据
   * @protected
   */
  protected sendToTenant(tenantId: string, event: string, data: unknown): void {
    (this.server as { to: (room: string) => { emit: (event: string, data: unknown) => void } }).to(`tenant:${tenantId}`).emit(event, data);
  }

  /**
   * 广播消息
   *
   * @description 向所有连接的客户端广播消息
   * @param event - 事件名称
   * @param data - 消息数据
   * @protected
   */
  protected broadcast(event: string, data: unknown): void {
    (this.server as { emit: (event: string, data: unknown) => void }).emit(event, data);
  }

  /**
   * 获取连接统计
   *
   * @description 获取当前连接统计信息
   * @returns 连接统计
   * @protected
   */
  protected getConnectionStats(): {
    totalConnections: number;
    connectionsByTenant: Record<string, number>;
    connectionsByUser: Record<string, number>;
  } {
    const stats = {
      totalConnections: this.connections.size,
      connectionsByTenant: {} as Record<string, number>,
      connectionsByUser: {} as Record<string, number>,
    };

    for (const connection of this.connections.values()) {
      if (connection.tenantId) {
        stats.connectionsByTenant[connection.tenantId] =
          (stats.connectionsByTenant[connection.tenantId] || 0) + 1;
      }
      if (connection.userId) {
        stats.connectionsByUser[connection.userId] =
          (stats.connectionsByUser[connection.userId] || 0) + 1;
      }
    }

    return stats;
  }
}
