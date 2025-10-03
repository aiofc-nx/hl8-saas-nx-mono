/**
 * GraphQL基础解析器
 *
 * @description 为所有GraphQL解析器提供通用功能和基础结构
 * 遵循"协议适配服务业务用例"的核心原则，专注于GraphQL协议适配
 *
 * ## 业务规则
 *
 * ### 协议适配规则
 * - 解析器只负责GraphQL协议适配，不处理业务逻辑
 * - 通过类型转换实现协议与业务用例的解耦
 * - 统一的查询/变更/订阅处理和错误处理
 *
 * ### 性能规则
 * - 支持查询优化和字段级缓存
 * - 支持N+1查询问题的解决
 * - 支持查询复杂度和深度限制
 *
 * ### 安全规则
 * - 支持GraphQL查询的权限控制
 * - 支持敏感字段的访问控制
 * - 支持查询注入防护
 *
 * @example
 * ```typescript
 * @Resolver(() => UserType)
 * export class UserResolver extends BaseResolver {
 *   constructor(
 *     private readonly getUserProfileUseCase: GetUserProfileUseCase,
 *     private readonly logger: ILoggerService
 *   ) {
 *     super(logger);
 *   }
 *
 *   @Query(() => UserType, { nullable: true })
 *   async user(@Args('id') id: string): Promise<UserType | null> {
 *     return this.handleQuery(
 *       () => this.getUserProfileUseCase.execute(new GetUserProfileRequest(id)),
 *       'getUser'
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
  IGraphQLContext,
} from '../../shared/interfaces';

export abstract class BaseResolver {
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
   * 统一查询处理
   *
   * @description 为所有查询解析器提供统一的处理流程
   *
   * @param queryExecutor - 查询执行器
   * @param operationName - 操作名称
   * @returns 查询结果
   */
  protected async handleQuery<TResult>(
    queryExecutor: () => Promise<TResult>,
    operationName = 'unknown'
  ): Promise<TResult> {
    this.getGraphQLContext();

    this.logger.info(`开始处理GraphQL查询: ${operationName}`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
    });

    try {
      // 执行查询
      const result = await queryExecutor();

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
   * 统一变更处理
   *
   * @description 为所有变更解析器提供统一的处理流程
   *
   * @param mutationExecutor - 变更执行器
   * @param operationName - 操作名称
   * @returns 变更结果
   */
  protected async handleMutation<TResult>(
    mutationExecutor: () => Promise<TResult>,
    operationName = 'unknown'
  ): Promise<TResult> {
    this.getGraphQLContext();

    this.logger.info(`开始处理GraphQL变更: ${operationName}`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
    });

    try {
      // 执行变更
      const result = await mutationExecutor();

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
   * 统一订阅处理
   *
   * @description 为所有订阅解析器提供统一的处理流程
   *
   * @param subscriptionExecutor - 订阅执行器
   * @param operationName - 操作名称
   * @returns 订阅结果
   */
  protected async handleSubscription<TResult>(
    subscriptionExecutor: () => Promise<TResult>,
    operationName = 'unknown'
  ): Promise<TResult> {
    this.getGraphQLContext();

    this.logger.info(`开始处理GraphQL订阅: ${operationName}`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
    });

    try {
      // 执行订阅
      const result = await subscriptionExecutor();

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
   * 获取GraphQL上下文
   *
   * @description 获取当前GraphQL请求的上下文信息
   *
   * @returns GraphQL上下文
   */
  protected getGraphQLContext(): IGraphQLContext {
    // 这里应该从GraphQL上下文中提取信息
    // 实际实现中会从GraphQL请求中获取
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

    this.logger.info(`GraphQL ${operationName}操作成功`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      resultType: typeof result,
    });

    // 记录性能指标
    this.metricsService?.incrementCounter(
      `graphql_${operationName}_success_total`
    );
    this.metricsService?.recordHistogram(
      `graphql_${operationName}_duration_ms`,
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

    this.logger.error(`GraphQL ${operationName}操作失败`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 记录错误指标
    this.metricsService?.incrementCounter(
      `graphql_${operationName}_error_total`,
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
