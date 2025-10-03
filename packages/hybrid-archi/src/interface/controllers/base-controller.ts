import {
  ILoggerService,
  IMetricsService,
  IRequestContext,
} from '../shared/interfaces';

/**
 * 基础REST控制器
 *
 * @description 为所有REST控制器提供通用功能和基础结构
 * 遵循"协议适配服务业务用例"的核心原则，专注于HTTP协议适配
 *
 * ## 业务规则
 *
 * ### 协议适配规则
 * - 控制器只负责HTTP协议适配，不处理业务逻辑
 * - 通过DTO转换实现协议与业务用例的解耦
 * - 统一的请求/响应格式和错误处理
 *
 * ### 安全规则
 * - 所有控制器默认启用认证和授权
 * - 支持租户隔离和数据权限控制
 * - 统一的输入验证和安全过滤
 *
 * ### 性能规则
 * - 支持缓存控制和性能监控
 * - 统一的日志记录和指标统计
 * - 请求追踪和性能分析
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard, TenantIsolationGuard)
 * @UseInterceptors(LoggingInterceptor, PerformanceInterceptor)
 * export class UserController extends BaseController {
 *   constructor(
 *     private readonly registerUserUseCase: RegisterUserUseCase,
 *     private readonly logger: ILoggerService
 *   ) {
 *     super(logger);
 *   }
 *
 *   @Post()
 *   async createUser(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
 *     return this.handleRequest(
 *       createUserDto,
 *       (dto) => this.registerUserUseCase.execute(dto.toUseCaseRequest(this.getRequestContext()))
 *     );
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */
export abstract class BaseController {
  protected readonly requestId: string;
  protected readonly correlationId: string;
  protected readonly startTime: number;

  constructor(
    protected readonly logger: ILoggerService,
    protected readonly metricsService?: IMetricsService
  ) {
    this.requestId = this.generateRequestId();
    this.correlationId = this.generateCorrelationId();
    this.startTime = Date.now();
  }

  /**
   * 统一请求处理
   *
   * @description 为所有控制器方法提供统一的请求处理流程
   * 包括日志记录、性能监控、错误处理等横切关注点
   *
   * @param input - 输入数据
   * @param useCaseExecutor - 用例执行器
   * @param operationName - 操作名称（用于日志和监控）
   * @returns 处理结果
   * @throws {BusinessError} 业务异常
   * @throws {ValidationError} 验证异常
   * @throws {SystemError} 系统异常
   */
  protected async handleRequest<TInput, TOutput>(
    input: TInput,
    useCaseExecutor: (input: TInput) => Promise<TOutput>,
    operationName = 'unknown'
  ): Promise<TOutput> {
    this.getRequestContext();

    this.logger.info(`开始处理${operationName}请求`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      input: this.sanitizeInput(input),
    });

    try {
      // 执行用例
      const result = await useCaseExecutor(input);

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
   * 获取请求上下文
   *
   * @description 获取当前请求的上下文信息
   * 包括用户信息、租户信息、追踪信息等
   *
   * @returns 请求上下文
   */
  protected getRequestContext(): RequestContext {
    // 这里应该从请求中提取上下文信息
    // 实际实现中会从装饰器或中间件中获取
    return {
      requestId: this.requestId,
      correlationId: this.correlationId,
      userId: 'current-user-id',
      tenantId: 'current-tenant-id',
      timestamp: new Date(),
    };
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

    this.logger.info(`${operationName}操作成功`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      resultType: typeof result,
    });

    // 记录性能指标
    this.metricsService?.incrementCounter(`${operationName}_success_total`);
    this.metricsService?.recordHistogram(
      `${operationName}_duration_ms`,
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

    this.logger.error(`${operationName}操作失败`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 记录错误指标
    this.metricsService?.incrementCounter(`${operationName}_error_total`, {
      error_type:
        error instanceof Error ? error.constructor.name : 'UnknownError',
    });
  }

  /**
   * 清理输入数据
   *
   * @description 清理敏感信息，用于日志记录
   *
   * @param input - 输入数据
   * @returns 清理后的数据
   */
  protected sanitizeInput(input: unknown): unknown {
    if (typeof input === 'object' && input !== null) {
      const sanitized = { ...(input as Record<string, unknown>) };

      // 清理敏感字段
      const sensitiveFields = ['password', 'token', 'secret', 'key'];
      sensitiveFields.forEach((field) => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });

      return sanitized;
    }

    return input;
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
 * 请求上下文类型别名
 */
export type RequestContext = IRequestContext;
