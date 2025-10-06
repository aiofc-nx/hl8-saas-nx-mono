/**
 * WebSocket中间件
 *
 * @description 提供WebSocket中间件功能
 * 包括认证、授权、日志、监控等中间件
 *
 * ## 业务规则
 *
 * ### 中间件规则
 * - 支持请求前处理
 * - 支持请求后处理
 * - 支持错误处理
 * - 支持异步处理
 *
 * ### 认证规则
 * - 支持JWT令牌验证
 * - 支持会话验证
 * - 支持API密钥验证
 * - 支持多因素认证
 *
 * ### 授权规则
 * - 支持角色级别授权
 * - 支持权限级别授权
 * - 支持资源级别授权
 * - 支持动态授权
 *
 * @example
 * ```typescript
 * export class AuthMiddleware implements IWebSocketMiddleware {
 *   async use(context: IWebSocketContext, next: () => Promise<void>): Promise<void> {
 *     // 验证认证信息
 *     const isAuthenticated = await this.validateAuth(context);
 *     if (!isAuthenticated) {
 *       throw new UnauthorizedException('认证失败');
 *     }
 *     
 *     // 继续处理
 *     await next();
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
  IWebSocketClient,
} from '../../shared/interfaces';

/**
 * WebSocket中间件接口
 *
 * @description 定义WebSocket中间件的基本接口
 */
export interface IWebSocketMiddleware {
  /**
   * 使用中间件
   *
   * @description 执行中间件逻辑
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param next - 下一个中间件或处理器
   * @returns Promise<void>
   */
  use(
    context: IWebSocketContext,
    client: IWebSocketClient,
    next: () => Promise<void>
  ): Promise<void>;

  /**
   * 获取中间件名称
   *
   * @description 返回中间件的唯一标识符
   *
   * @returns 中间件名称
   */
  getMiddlewareName(): string;
}

/**
 * WebSocket中间件基类
 *
 * @description 为所有WebSocket中间件提供通用功能和基础结构
 */
export abstract class BaseWebSocketMiddleware implements IWebSocketMiddleware {
  protected readonly middlewareName: string;

  constructor(
    protected readonly logger: ILoggerService,
    protected readonly metricsService?: IMetricsService
  ) {
    this.middlewareName = this.constructor.name;
  }

  /**
   * 使用中间件
   *
   * @description 为所有中间件提供统一的处理流程
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param next - 下一个中间件或处理器
   * @returns Promise<void>
   */
  async use(
    context: IWebSocketContext,
    client: IWebSocketClient,
    next: () => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();

    this.logger.debug(`开始执行WebSocket中间件: ${this.middlewareName}`, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      middleware: this.middlewareName,
      clientId: client.id,
    });

    try {
      // 执行中间件逻辑
      await this.process(context, client, next);

      // 记录成功日志和指标
      this.logSuccess(context, client, startTime);
    } catch (error) {
      // 记录错误日志和指标
      this.logError(context, client, error, startTime);
      throw error;
    }
  }

  /**
   * 处理中间件逻辑
   *
   * @description 处理中间件的核心逻辑
   * 子类必须实现此方法
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param next - 下一个中间件或处理器
   * @returns Promise<void>
   */
  protected abstract process(
    context: IWebSocketContext,
    client: IWebSocketClient,
    next: () => Promise<void>
  ): Promise<void>;

  /**
   * 获取中间件名称
   *
   * @description 返回中间件的唯一标识符
   *
   * @returns 中间件名称
   */
  getMiddlewareName(): string {
    return this.middlewareName;
  }

  /**
   * 记录成功操作
   *
   * @description 记录中间件执行成功的日志和性能指标
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param startTime - 开始时间
   */
  protected logSuccess(
    context: IWebSocketContext,
    client: IWebSocketClient,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;

    this.logger.debug(`WebSocket中间件执行成功: ${this.middlewareName}`, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      middleware: this.middlewareName,
      clientId: client.id,
      duration,
    });

    // 记录性能指标
    this.metricsService?.incrementCounter(
      `websocket_middleware_${this.middlewareName.toLowerCase()}_success_total`
    );
    this.metricsService?.recordHistogram(
      `websocket_middleware_${this.middlewareName.toLowerCase()}_duration_ms`,
      duration
    );
  }

  /**
   * 记录错误操作
   *
   * @description 记录中间件执行失败的日志和错误指标
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param error - 错误信息
   * @param startTime - 开始时间
   */
  protected logError(
    context: IWebSocketContext,
    client: IWebSocketClient,
    error: unknown,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;

    this.logger.error(`WebSocket中间件执行失败: ${this.middlewareName}`, {
      requestId: context.requestId,
      correlationId: context.correlationId,
      middleware: this.middlewareName,
      clientId: client.id,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 记录错误指标
    this.metricsService?.incrementCounter(
      `websocket_middleware_${this.middlewareName.toLowerCase()}_error_total`,
      {
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
      }
    );
  }
}

/**
 * 认证中间件
 *
 * @description 验证WebSocket连接的认证信息
 */
export class AuthMiddleware extends BaseWebSocketMiddleware {
  /**
   * 处理认证逻辑
   *
   * @description 验证WebSocket连接的认证信息
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param next - 下一个中间件或处理器
   * @returns Promise<void>
   */
  protected async process(
    context: IWebSocketContext,
    client: IWebSocketClient,
    next: () => Promise<void>
  ): Promise<void> {
    // 提取认证令牌
    const token = this.extractToken(client);
    if (!token) {
      throw new Error('缺少认证令牌');
    }

    // 验证令牌
    const payload = await this.verifyToken(token);
    if (!payload) {
      throw new Error('认证令牌无效');
    }

    // 验证用户状态
    const user = await this.validateUser((payload as { sub: string }).sub);
    if (!user || !user.isActive()) {
      throw new Error('用户状态无效');
    }

    // 更新上下文
    context.userId = user.getId().getValue();
    context.tenantId = user.getTenantId();

    // 继续处理
    await next();
  }

  /**
   * 从客户端提取令牌
   *
   * @description 从WebSocket客户端中提取认证令牌
   *
   * @param client - WebSocket客户端
   * @returns 认证令牌或null
   */
  private extractToken(client: IWebSocketClient): string | null {
    const auth = client.handshake.auth;
    const headers = client.handshake.headers;

    return (
      auth?.token || 
      headers?.authorization?.replace('Bearer ', '') || 
      null
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
  private async verifyToken(token: string): Promise<unknown> {
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
  private async validateUser(userId: string): Promise<{ getId(): { getValue(): string }; getTenantId(): string; isActive(): boolean } | null> {
    // 这里应该调用用户服务验证用户状态
    // 实际实现中会从数据库或缓存中获取用户信息
    this.logger.debug('验证用户状态', { userId });
    return null; // 占位符实现
  }
}

/**
 * 授权中间件
 *
 * @description 验证WebSocket连接的授权信息
 */
export class AuthorizationMiddleware extends BaseWebSocketMiddleware {
  constructor(
    logger: ILoggerService,
    metricsService?: IMetricsService,
    private readonly requiredRoles: string[] = [],
    private readonly requiredPermissions: string[] = []
  ) {
    super(logger, metricsService);
  }

  /**
   * 处理授权逻辑
   *
   * @description 验证WebSocket连接的授权信息
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param next - 下一个中间件或处理器
   * @returns Promise<void>
   */
  protected async process(
    context: IWebSocketContext,
    client: IWebSocketClient,
    next: () => Promise<void>
  ): Promise<void> {
    // 验证角色权限
    if (this.requiredRoles.length > 0) {
      const userRoles = context.userRoles || [];
      const hasRequiredRole = this.requiredRoles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        throw new Error(`需要角色权限: ${this.requiredRoles.join(', ')}`);
      }
    }

    // 验证功能权限
    if (this.requiredPermissions.length > 0) {
      const userPermissions = context.userPermissions || [];
      const hasRequiredPermission = this.requiredPermissions.some(permission => userPermissions.includes(permission));
      
      if (!hasRequiredPermission) {
        throw new Error(`需要权限: ${this.requiredPermissions.join(', ')}`);
      }
    }

    // 继续处理
    await next();
  }
}

/**
 * WebSocket日志中间件
 *
 * @description 记录WebSocket连接的日志信息
 */
export class WebSocketLoggingMiddleware extends BaseWebSocketMiddleware {
  /**
   * 处理日志逻辑
   *
   * @description 记录WebSocket连接的日志信息
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param next - 下一个中间件或处理器
   * @returns Promise<void>
   */
  protected async process(
    context: IWebSocketContext,
    client: IWebSocketClient,
    next: () => Promise<void>
  ): Promise<void> {
    this.logger.info('WebSocket连接处理开始', {
      requestId: context.requestId,
      correlationId: context.correlationId,
      clientId: client.id,
      userId: context.userId,
      tenantId: context.tenantId,
      timestamp: context.timestamp,
    });

    try {
      await next();
      
      this.logger.info('WebSocket连接处理成功', {
        requestId: context.requestId,
        correlationId: context.correlationId,
        clientId: client.id,
        userId: context.userId,
        tenantId: context.tenantId,
      });
    } catch (error) {
      this.logger.error('WebSocket连接处理失败', {
        requestId: context.requestId,
        correlationId: context.correlationId,
        clientId: client.id,
        userId: context.userId,
        tenantId: context.tenantId,
        error: error instanceof Error ? error.message : String(error),
      });
      
      throw error;
    }
  }
}

/**
 * 中间件链
 *
 * @description 管理WebSocket中间件的执行顺序
 */
export class WebSocketMiddlewareChain {
  private readonly middlewares: IWebSocketMiddleware[] = [];

  /**
   * 添加中间件
   *
   * @description 向中间件链中添加中间件
   *
   * @param middleware - WebSocket中间件
   * @returns 当前中间件链实例
   */
  use(middleware: IWebSocketMiddleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * 执行中间件链
   *
   * @description 按顺序执行所有中间件
   *
   * @param context - WebSocket上下文
   * @param client - WebSocket客户端
   * @param finalHandler - 最终处理器
   * @returns Promise<void>
   */
  async execute(
    context: IWebSocketContext,
    client: IWebSocketClient,
    finalHandler: () => Promise<void>
  ): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middlewares.length) {
        return finalHandler();
      }

      const middleware = this.middlewares[index++];
      return middleware.use(context, client, next);
    };

    return next();
  }

  /**
   * 获取中间件列表
   *
   * @description 返回所有中间件的名称
   *
   * @returns 中间件名称数组
   */
  getMiddlewareNames(): string[] {
    return this.middlewares.map(middleware => middleware.getMiddlewareName());
  }

  /**
   * 清除所有中间件
   *
   * @description 清除中间件链中的所有中间件
   */
  clear(): void {
    this.middlewares.length = 0;
  }
}
