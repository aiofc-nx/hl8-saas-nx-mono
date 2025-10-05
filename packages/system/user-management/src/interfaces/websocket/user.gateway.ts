/**
 * 用户WebSocket网关
 *
 * @description 用户管理的WebSocket API网关
 * @since 1.0.0
 */

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UserApplicationService } from '../../application/services/user-application.service';
import { GetUserQuery } from '../../application/queries/get-user.query';
import { UserId } from '../../domain/value-objects/user-id.vo';

/**
 * 用户WebSocket网关
 *
 * @description 提供用户管理的WebSocket API
 *
 * ## 业务规则
 *
 * ### 连接管理规则
 * - 支持用户身份验证
 * - 支持租户隔离
 * - 支持连接状态管理
 * - 支持自动重连
 *
 * ### 消息处理规则
 * - 支持实时用户状态更新
 * - 支持用户在线状态管理
 * - 支持用户活动通知
 * - 支持用户权限验证
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/users',
})
export class UserGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, Socket>();
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly userApplicationService: UserApplicationService
  ) {}

  /**
   * 处理客户端连接
   *
   * @description 当客户端连接时调用
   * @param client - WebSocket客户端
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const userId = this.extractUserId(client);
      const tenantId = this.extractTenantId(client);

      if (!userId || !tenantId) {
        client.disconnect();
        return;
      }

      // 验证用户身份
      const isValidUser = await this.validateUser(userId, tenantId);
      if (!isValidUser) {
        client.disconnect();
        return;
      }

      // 记录连接
      this.connectedUsers.set(client.id, client);
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      // 设置客户端信息
      client.data.userId = userId;
      client.data.tenantId = tenantId;

      // 加入租户房间
      client.join(`tenant:${tenantId}`);

      // 通知用户上线
      this.server.to(`tenant:${tenantId}`).emit('user:online', {
        userId,
        timestamp: new Date(),
      });

      console.log(`用户 ${userId} 已连接 (租户: ${tenantId})`);
    } catch (error) {
      console.error('处理连接失败:', error);
      client.disconnect();
    }
  }

  /**
   * 处理客户端断开连接
   *
   * @description 当客户端断开连接时调用
   * @param client - WebSocket客户端
   */
  async handleDisconnect(client: Socket): Promise<void> {
    try {
      const userId = client.data.userId;
      const tenantId = client.data.tenantId;

      if (userId) {
        // 移除连接记录
        this.connectedUsers.delete(client.id);
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.delete(client.id);
          if (userSockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }

        // 通知用户下线
        if (tenantId) {
          this.server.to(`tenant:${tenantId}`).emit('user:offline', {
            userId,
            timestamp: new Date(),
          });
        }

        console.log(`用户 ${userId} 已断开连接`);
      }
    } catch (error) {
      console.error('处理断开连接失败:', error);
    }
  }

  /**
   * 订阅用户状态更新
   *
   * @description 客户端订阅用户状态更新
   * @param client - WebSocket客户端
   * @param data - 消息数据
   */
  @SubscribeMessage('user:subscribe')
  async handleUserSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ): Promise<void> {
    try {
      const userId = data.userId;
      const tenantId = client.data.tenantId;

      // 验证权限
      const hasPermission = await this.checkUserPermission(
        client.data.userId,
        userId,
        tenantId
      );
      if (!hasPermission) {
        client.emit('error', { message: '权限不足' });
        return;
      }

      // 加入用户房间
      client.join(`user:${userId}`);

      // 发送当前用户状态
      const userStatus = await this.getUserStatus(userId);
      client.emit('user:status', userStatus);
    } catch (error) {
      client.emit('error', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 取消订阅用户状态更新
   *
   * @description 客户端取消订阅用户状态更新
   * @param client - WebSocket客户端
   * @param data - 消息数据
   */
  @SubscribeMessage('user:unsubscribe')
  async handleUserUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ): Promise<void> {
    try {
      const userId = data.userId;
      client.leave(`user:${userId}`);
    } catch (error) {
      client.emit('error', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 获取用户在线状态
   *
   * @description 获取用户在线状态
   * @param client - WebSocket客户端
   * @param data - 消息数据
   */
  @SubscribeMessage('user:status')
  async handleUserStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string }
  ): Promise<void> {
    try {
      const userId = data.userId;
      const tenantId = client.data.tenantId;

      // 验证权限
      const hasPermission = await this.checkUserPermission(
        client.data.userId,
        userId,
        tenantId
      );
      if (!hasPermission) {
        client.emit('error', { message: '权限不足' });
        return;
      }

      const userStatus = await this.getUserStatus(userId);
      client.emit('user:status', userStatus);
    } catch (error) {
      client.emit('error', {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========== 私有辅助方法 ==========

  /**
   * 从客户端提取用户ID
   *
   * @description 从WebSocket连接中提取用户ID
   * @param client - WebSocket客户端
   * @returns 用户ID
   * @private
   */
  private extractUserId(client: Socket): string | undefined {
    return (
      client.handshake.auth?.['userId'] || client.handshake.query?.['userId']
    );
  }

  /**
   * 从客户端提取租户ID
   *
   * @description 从WebSocket连接中提取租户ID
   * @param client - WebSocket客户端
   * @returns 租户ID
   * @private
   */
  private extractTenantId(client: Socket): string | undefined {
    return (
      client.handshake.auth?.['tenantId'] ||
      client.handshake.query?.['tenantId']
    );
  }

  /**
   * 验证用户身份
   *
   * @description 验证用户是否存在且有效
   * @param userId - 用户ID
   * @param tenantId - 租户ID
   * @returns 是否有效
   * @private
   */
  private async validateUser(
    userId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      const query = new GetUserQuery(UserId.create(userId));
      const result = await this.userApplicationService.getUser(query);
      return result.success && result.user?.tenantId === tenantId;
    } catch (error) {
      return false;
    }
  }

  /**
   * 检查用户权限
   *
   * @description 检查用户是否有权限访问指定用户的信息
   * @param currentUserId - 当前用户ID
   * @param targetUserId - 目标用户ID
   * @param tenantId - 租户ID
   * @returns 是否有权限
   * @private
   */
  private async checkUserPermission(
    currentUserId: string,
    targetUserId: string,
    tenantId: string
  ): Promise<boolean> {
    // TODO: 实现权限检查逻辑
    // 这里应该检查用户是否有权限访问目标用户的信息
    return currentUserId === targetUserId;
  }

  /**
   * 获取用户状态
   *
   * @description 获取用户在线状态和基本信息
   * @param userId - 用户ID
   * @returns 用户状态
   * @private
   */
  private async getUserStatus(userId: string): Promise<any> {
    const isOnline = this.userSockets.has(userId);
    const socketCount = this.userSockets.get(userId)?.size || 0;

    return {
      userId,
      isOnline,
      socketCount,
      lastSeen: isOnline ? new Date() : undefined,
    };
  }
}
