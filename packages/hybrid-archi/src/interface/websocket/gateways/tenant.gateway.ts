/**
 * 租户WebSocket网关
 *
 * @description 提供租户相关的WebSocket功能
 * 包括租户状态管理、租户配置更新、租户通知等
 *
 * ## 业务规则
 *
 * ### 租户管理规则
 * - 支持租户状态监控
 * - 支持租户配置管理
 * - 支持租户资源监控
 * - 支持租户性能统计
 *
 * ### 租户通知规则
 * - 支持租户级别通知
 * - 支持租户管理员通知
 * - 支持租户用户通知
 * - 支持租户系统通知
 *
 * ### 租户安全规则
 * - 支持租户数据隔离
 * - 支持租户权限控制
 * - 支持租户访问审计
 * - 支持租户安全监控
 *
 * @example
 * ```typescript
 * @WebSocketGateway({
 *   namespace: 'tenants',
 *   cors: { origin: '*' }
 * })
 * export class TenantGateway extends BaseGateway {
 *   @SubscribeMessage('getTenantInfo')
 *   @RequireRoles(['tenant_admin', 'admin'])
 *   async handleGetTenantInfo(@MessageBody() data: GetTenantInfoMessage): Promise<WsResponse<TenantInfoData>> {
 *     return this.handleMessage(
 *       () => this.getTenantInfoUseCase.execute(new GetTenantInfoRequest(data.tenantId)),
 *       'getTenantInfo'
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
 * 获取租户信息消息
 *
 * @description 定义获取租户信息的消息格式
 */
export interface GetTenantInfoMessage extends IWebSocketMessage {
  type: 'getTenantInfo';
  data: {
    tenantId: string;
  };
}

/**
 * 租户信息响应数据
 *
 * @description 定义租户信息的响应数据格式
 */
export interface TenantInfoData {
  id: string;
  name: string;
  type: 'enterprise' | 'community' | 'team' | 'personal';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  createdAt: Date;
  updatedAt: Date;
  settings: {
    maxUsers: number;
    maxStorage: number;
    features: string[];
  };
  statistics: {
    totalUsers: number;
    activeUsers: number;
    totalStorage: number;
    usedStorage: number;
  };
}

/**
 * 更新租户配置消息
 *
 * @description 定义更新租户配置的消息格式
 */
export interface UpdateTenantConfigMessage extends IWebSocketMessage {
  type: 'updateTenantConfig';
  data: {
    tenantId: string;
    config: {
      maxUsers?: number;
      maxStorage?: number;
      features?: string[];
    };
  };
}

/**
 * 租户WebSocket网关
 *
 * @description 提供租户相关的WebSocket功能
 */
export class TenantGateway extends BaseGateway {
  constructor(
    logger: ILoggerService,
    metricsService?: IMetricsService
  ) {
    super(logger, metricsService);
  }

  /**
   * 处理获取租户信息请求
   *
   * @description 获取指定租户的详细信息
   *
   * @param data - 获取租户信息消息
   * @param context - WebSocket上下文
   * @returns 租户信息响应
   */
  @SubscribeMessage('getTenantInfo')
  @RequireRoles({ roles: ['tenant_admin', 'admin'] })
  @RequireWebSocketPermissions({ permissions: ['tenant:read'] })
  @ValidateMessage({ messageType: Object as unknown as new () => GetTenantInfoMessage })
  @MonitorPerformance({ threshold: 2000 })
  async handleGetTenantInfo(
    @MessageBody() data: GetTenantInfoMessage,
    @WebSocketContext() context: IWebSocketContext
  ): Promise<IWebSocketResponse<TenantInfoData>> {
    return this.handleMessage(
      async () => {
        // 这里应该调用租户服务获取租户信息
        // 实际实现中会调用GetTenantInfoUseCase
        const tenantInfo: TenantInfoData = {
          id: data.data.tenantId,
          name: '示例租户',
          type: 'enterprise',
          status: 'active',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          settings: {
            maxUsers: 1000,
            maxStorage: 100 * 1024 * 1024 * 1024, // 100GB
            features: ['user_management', 'analytics', 'api_access'],
          },
          statistics: {
            totalUsers: 150,
            activeUsers: 120,
            totalStorage: 100 * 1024 * 1024 * 1024,
            usedStorage: 25 * 1024 * 1024 * 1024, // 25GB
          },
        };

        return WebSocketUtils.createSuccessResponse(tenantInfo, context.requestId, context.correlationId);
      },
      'getTenantInfo'
    );
  }

  /**
   * 处理更新租户配置请求
   *
   * @description 更新指定租户的配置信息
   *
   * @param data - 更新租户配置消息
   * @param context - WebSocket上下文
   * @returns 更新结果响应
   */
  @SubscribeMessage('updateTenantConfig')
  @RequireRoles({ roles: ['tenant_admin', 'admin'] })
  @RequireWebSocketPermissions({ permissions: ['tenant:write'] })
  @ValidateMessage({ messageType: Object as unknown as new () => UpdateTenantConfigMessage })
  @MonitorPerformance({ threshold: 1500 })
  async handleUpdateTenantConfig(
    @MessageBody() data: UpdateTenantConfigMessage,
    @WebSocketContext() context: IWebSocketContext
  ): Promise<IWebSocketResponse<{ success: boolean }>> {
    return this.handleMessage(
      async () => {
        // 这里应该调用租户服务更新租户配置
        // 实际实现中会调用UpdateTenantConfigUseCase
        
        this.logger.info('租户配置更新', {
          tenantId: data.data.tenantId,
          config: data.data.config,
          updatedBy: context.userId,
        });

        return WebSocketUtils.createSuccessResponse(
          { success: true },
          context.requestId,
          context.correlationId
        );
      },
      'updateTenantConfig'
    );
  }

  /**
   * 处理租户连接
   *
   * @description 处理租户WebSocket连接建立
   *
   * @param client - WebSocket客户端
   */
  async handleConnection(client: IWebSocketClient): Promise<void> {
    const isAuthenticated = await this.authenticateConnection(client);
    
    if (!isAuthenticated) {
      client.disconnect(true);
      return;
    }

    this.logger.info('租户WebSocket连接建立', {
      clientId: client.id,
      tenantId: client.id, // 这里应该从认证信息中获取
    });
  }

  /**
   * 处理租户断开连接
   *
   * @description 处理租户WebSocket连接断开
   *
   * @param client - WebSocket客户端
   */
  override handleDisconnection(client: IWebSocketClient): void {
    this.handleDisconnection(client);
    
    this.logger.info('租户WebSocket连接断开', {
      clientId: client.id,
    });
  }
}
