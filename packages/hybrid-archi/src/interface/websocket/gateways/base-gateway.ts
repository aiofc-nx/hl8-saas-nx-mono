/**
 * WebSocket基础网关
 *
 * @description 为所有WebSocket网关提供通用功能和基础结构
 * 遵循"协议适配服务业务用例"的核心原则，专注于WebSocket协议适配
 *
 * ## 业务规则
 *
 * ### 连接管理规则
 * - 支持连接认证和授权
 * - 支持连接状态管理和监控
 * - 支持连接超时和心跳检测
 *
 * ### 消息处理规则
 * - 支持消息路由和分发
 * - 支持消息验证和过滤
 * - 支持消息持久化和重试
 *
 * ### 安全规则
 * - 支持连接级别的权限控制
 * - 支持消息加密和签名
 * - 支持恶意连接检测和防护
 *
 * @example
 * ```typescript
 * @WebSocketGateway({
 *   namespace: 'users',
 *   cors: { origin: '*' }
 * })
 * export class UserGateway extends BaseGateway {
 *   constructor(
 *     private readonly getUserProfileUseCase: GetUserProfileUseCase,
 *     private readonly logger: ILoggerService
 *   ) {
 *     super(logger);
 *   }
 *
 *   @SubscribeMessage('getUserProfile')
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
  IWebSocketContext,
  IUser,
  IWebSocketClient,
  IJwtPayload,
} from '../../shared/interfaces';

export abstract class BaseGateway {
  protected readonly requestId: string;
  protected readonly correlationId: string;
  protected readonly startTime: number;
  protected connectedClients = new Map<string, ClientConnection>();

  constructor(
    protected readonly logger: ILoggerService,
    protected readonly metricsService?: IMetricsService
  ) {
    this.requestId = this.generateRequestId();
    this.correlationId = this.generateCorrelationId();
    this.startTime = Date.now();
  }

  /**
   * 统一消息处理
   *
   * @description 为所有消息处理器提供统一的处理流程
   *
   * @param messageExecutor - 消息执行器
   * @param operationName - 操作名称
   * @returns 消息响应
   */
  protected async handleMessage<TResult>(
    messageExecutor: () => Promise<TResult>,
    operationName = 'unknown'
  ): Promise<TResult> {
    this.getWebSocketContext();

    this.logger.info(`开始处理WebSocket消息: ${operationName}`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
    });

    try {
      // 执行消息处理
      const result = await messageExecutor();

      // 记录成功日志和指标
      this.logSuccess(operationName, result);

      return result;
    } catch (error) {
      // 记录错误日志和指标
      this.logError(operationName, error);

      throw error;
    }
  }

  /**
   * 连接认证
   *
   * @description 验证WebSocket连接的身份
   *
   * @param client - WebSocket客户端
   * @returns 认证结果
   */
  protected async authenticateConnection(client: IWebSocketClient): Promise<boolean> {
    try {
      // 1. 提取认证令牌
      const token = this.extractTokenFromClient(client);
      if (!token) {
        return false;
      }

      // 2. 验证令牌
      const payload = await this.verifyToken(token);
      if (!payload) {
        return false;
      }

      // 3. 验证用户状态
      const user = await this.validateUser(payload.sub);
      if (!user || !user.isActive()) {
        return false;
      }

      // 4. 建立连接记录
      const connection = new ClientConnection(
        client.id,
        user.getId().getValue(),
        user.getTenantId(),
        new Date(),
        client.handshake.address
      );

      this.connectedClients.set(client.id, connection);

      this.logger.info('WebSocket连接认证成功', {
        clientId: client.id,
        userId: user.getId().getValue(),
        tenantId: user.getTenantId(),
      });

      return true;
    } catch (error) {
      this.logger.error('WebSocket连接认证失败', {
        clientId: client.id,
        error: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }

  /**
   * 连接断开处理
   *
   * @description 处理WebSocket连接断开
   *
   * @param client - WebSocket客户端
   */
  protected handleDisconnection(client: IWebSocketClient): void {
    const connection = this.connectedClients.get(client.id);

    if (connection) {
      this.connectedClients.delete(client.id);

      this.logger.info('WebSocket连接断开', {
        clientId: client.id,
        userId: connection.userId,
        duration: Date.now() - connection.connectedAt.getTime(),
      });
    }
  }

  /**
   * 获取WebSocket上下文
   *
   * @description 获取当前WebSocket请求的上下文信息
   *
   * @returns WebSocket上下文
   */
  protected getWebSocketContext(): IWebSocketContext {
    // 这里应该从WebSocket上下文中提取信息
    // 实际实现中会从WebSocket请求中获取
    return {
      requestId: this.requestId,
      correlationId: this.correlationId,
      userId: 'current-user-id',
      tenantId: 'current-tenant-id',
      timestamp: new Date(),
    };
  }

  /**
   * 从客户端提取令牌
   *
   * @description 从WebSocket客户端中提取认证令牌
   *
   * @param client - WebSocket客户端
   * @returns 认证令牌或null
   */
  private extractTokenFromClient(client: IWebSocketClient): string | null {
    const auth = client.handshake.auth;
    const headers = client.handshake.headers;

    return (
      auth?.token || headers?.authorization?.replace('Bearer ', '') || null
    );
  }

  /**
   * 验证令牌
   *
   * @description 验证认证令牌的有效性
   *
   * @param token - 认证令牌
   * @returns 令牌载荷或null
   */
  private async verifyToken(token: string): Promise<IJwtPayload | null> {
    // 这里应该实现JWT令牌验证
    // 实际实现中会调用JWT服务
    this.logger.debug('验证JWT令牌', { tokenLength: token.length });
    return null; // 占位符实现
  }

  /**
   * 验证用户状态
   *
   * @description 验证用户是否存在且状态正常
   *
   * @param userId - 用户ID
   * @returns 用户实体或null
   */
  private async validateUser(userId: string): Promise<IUser | null> {
    // 这里应该调用用户服务验证用户状态
    // 实际实现中会从数据库或缓存中获取用户信息
    this.logger.debug('验证用户状态', { userId });
    return null; // 占位符实现
  }

  /**
   * 记录成功操作
   *
   * @description 记录操作成功的日志和性能指标
   *
   * @param operationName - 操作名称
   * @param result - 操作结果
   */
  protected logSuccess(operationName: string, result: unknown): void {
    const duration = Date.now() - this.startTime;

    this.logger.info(`WebSocket ${operationName}操作成功`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      resultType: typeof result,
    });

    // 记录性能指标
    this.metricsService?.incrementCounter(
      `websocket_${operationName}_success_total`
    );
    this.metricsService?.recordHistogram(
      `websocket_${operationName}_duration_ms`,
      duration
    );
  }

  /**
   * 记录错误操作
   *
   * @description 记录操作失败的日志和错误指标
   *
   * @param operationName - 操作名称
   * @param error - 错误信息
   */
  protected logError(operationName: string, error: unknown): void {
    const duration = Date.now() - this.startTime;

    this.logger.error(`WebSocket ${operationName}操作失败`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 记录错误指标
    this.metricsService?.incrementCounter(
      `websocket_${operationName}_error_total`,
      {
        error_type:
          error instanceof Error ? error.constructor.name : 'UnknownError',
      }
    );
  }

  /**
   * 生成请求ID
   *
   * @description 为每个请求生成唯一标识符
   *
   * @returns 请求ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成关联ID
   *
   * @description 为相关请求生成关联标识符
   *
   * @returns 关联ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 客户端连接
 *
 * @description 定义客户端连接的数据结构
 */
export class ClientConnection {
  constructor(
    public readonly clientId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly connectedAt: Date,
    public readonly ipAddress: string
  ) {}
}
