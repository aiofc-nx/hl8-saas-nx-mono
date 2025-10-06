/**
 * 用户WebSocket网关
 *
 * @description 提供用户相关的WebSocket功能
 * 包括用户状态更新、用户信息查询、用户活动通知等
 *
 * ## 业务规则
 *
 * ### 用户状态规则
 * - 支持用户在线状态管理
 * - 支持用户活动状态更新
 * - 支持用户状态广播
 * - 支持用户状态持久化
 *
 * ### 用户信息规则
 * - 支持用户基本信息查询
 * - 支持用户权限信息查询
 * - 支持用户配置信息查询
 * - 支持用户统计信息查询
 *
 * ### 用户活动规则
 * - 支持用户登录/登出通知
 * - 支持用户操作日志记录
 * - 支持用户行为分析
 * - 支持用户活动统计
 *
 * @example
 * ```typescript
 * @WebSocketGateway({
 *   namespace: 'users',
 *   cors: { origin: '*' }
 * })
 * export class UserGateway extends BaseGateway {
 *   @SubscribeMessage('getUserProfile')
 *   @RequireRoles(['user', 'admin'])
 *   async handleGetUserProfile(@MessageBody() data: GetUserProfileMessage): Promise<WsResponse<UserProfileData>> {
 *     return this.handleMessage(
 *       () => this.getUserProfileUseCase.execute(new GetUserProfileRequest(data.userId)),
 *       'getUserProfile'
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import {
  ILoggerService,
  IMetricsService,
  IWebSocketClient,
  IWebSocketContext,
} from '../../shared/interfaces';
import { BaseGateway } from './base-gateway';
import {
  SubscribeMessage,
  RequireRoles,
  RequireWebSocketPermissions,
  ValidateMessage,
  MonitorPerformance,
  MessageBody,
  WebSocketContext,
} from '../decorators';
import {
  IWebSocketMessage,
  IWebSocketResponse,
  WebSocketUtils,
} from '../utils';

/**
 * 获取用户资料消息
 *
 * @description 定义获取用户资料的消息格式
 */
export interface GetUserProfileMessage extends IWebSocketMessage {
  type: 'getUserProfile';
  data: {
    userId: string;
  };
}

/**
 * 用户资料响应数据
 *
 * @description 定义用户资料的响应数据格式
 */
export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  roles: string[];
  permissions: string[];
}

/**
 * 更新用户状态消息
 *
 * @description 定义更新用户状态的消息格式
 */
export interface UpdateUserStatusMessage extends IWebSocketMessage {
  type: 'updateUserStatus';
  data: {
    status: 'online' | 'offline' | 'away' | 'busy';
    message?: string;
  };
}

/**
 * 用户WebSocket网关
 *
 * @description 提供用户相关的WebSocket功能
 */
export class UserGateway extends BaseGateway {
  constructor(
    logger: ILoggerService,
    metricsService?: IMetricsService
  ) {
    super(logger, metricsService);
  }

  /**
   * 处理获取用户资料请求
   *
   * @description 获取指定用户的详细资料信息
   *
   * @param data - 获取用户资料消息
   * @param context - WebSocket上下文
   * @returns 用户资料响应
   */
  @SubscribeMessage('getUserProfile')
  @RequireRoles({ roles: ['user', 'admin'] })
  @RequireWebSocketPermissions({ permissions: ['user:read'] })
  @ValidateMessage({ messageType: Object as unknown as new () => GetUserProfileMessage })
  @MonitorPerformance({ threshold: 1000 })
  async handleGetUserProfile(
    @MessageBody() data: GetUserProfileMessage,
    @WebSocketContext() context: IWebSocketContext
  ): Promise<IWebSocketResponse<UserProfileData>> {
    return this.handleMessage(
      async () => {
        // 这里应该调用用户服务获取用户资料
        // 实际实现中会调用GetUserProfileUseCase
        const userProfile: UserProfileData = {
          id: data.data.userId,
          name: '示例用户',
          email: 'user@example.com',
          status: 'online',
          lastSeen: new Date(),
          roles: ['user'],
          permissions: ['user:read'],
        };

        return WebSocketUtils.createSuccessResponse(userProfile, context.requestId, context.correlationId);
      },
      'getUserProfile'
    );
  }

  /**
   * 处理更新用户状态请求
   *
   * @description 更新当前用户的状态信息
   *
   * @param data - 更新用户状态消息
   * @param context - WebSocket上下文
   * @returns 更新结果响应
   */
  @SubscribeMessage('updateUserStatus')
  @RequireRoles({ roles: ['user', 'admin'] })
  @ValidateMessage({ messageType: Object as unknown as new () => UpdateUserStatusMessage })
  @MonitorPerformance({ threshold: 500 })
  async handleUpdateUserStatus(
    @MessageBody() data: UpdateUserStatusMessage,
    @WebSocketContext() context: IWebSocketContext
  ): Promise<IWebSocketResponse<{ success: boolean }>> {
    return this.handleMessage(
      async () => {
        // 这里应该调用用户服务更新用户状态
        // 实际实现中会调用UpdateUserStatusUseCase
        
        this.logger.info('用户状态更新', {
          userId: context.userId,
          newStatus: data.data.status,
          message: data.data.message,
        });

        return WebSocketUtils.createSuccessResponse(
          { success: true },
          context.requestId,
          context.correlationId
        );
      },
      'updateUserStatus'
    );
  }

  /**
   * 处理用户连接
   *
   * @description 处理用户WebSocket连接建立
   *
   * @param client - WebSocket客户端
   */
  async handleConnection(client: IWebSocketClient): Promise<void> {
    const isAuthenticated = await this.authenticateConnection(client);
    
    if (!isAuthenticated) {
      client.disconnect(true);
      return;
    }

    this.logger.info('用户WebSocket连接建立', {
      clientId: client.id,
      userId: client.id, // 这里应该从认证信息中获取
    });
  }

  /**
   * 处理用户断开连接
   *
   * @description 处理用户WebSocket连接断开
   *
   * @param client - WebSocket客户端
   */
  override handleDisconnection(client: IWebSocketClient): void {
    this.handleDisconnection(client);
    
    this.logger.info('用户WebSocket连接断开', {
      clientId: client.id,
    });
  }
}
