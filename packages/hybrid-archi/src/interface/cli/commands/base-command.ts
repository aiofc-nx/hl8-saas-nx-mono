/**
 * CLI基础命令处理器
 *
 * @description 为所有CLI命令提供通用功能和基础结构
 * 遵循"协议适配服务业务用例"的核心原则，专注于CLI协议适配
 *
 * @since 1.0.0
 */
import { ILoggerService, IMetricsService } from '../../shared/interfaces';

export abstract class BaseCommand {
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
   * 统一命令处理
   *
   * @description 为所有CLI命令提供统一的处理流程
   *
   * @param commandExecutor - 命令执行器
   * @param operationName - 操作名称
   * @returns 命令结果
   */
  protected async handleCommand<TResult>(
    commandExecutor: () => Promise<TResult>,
    operationName = 'unknown'
  ): Promise<TResult> {
    this.logger.info(`开始执行CLI命令: ${operationName}`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
    });

    try {
      // 执行命令
      const result = await commandExecutor();

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
   * 记录成功操作
   *
   * @description 记录操作成功的日志和性能指标
   *
   * @param operationName - 操作名称
   * @param result - 操作结果
   */
  protected logSuccess(operationName: string, result: unknown): void {
    const duration = Date.now() - this.startTime;

    this.logger.info(`CLI ${operationName}命令执行成功`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      resultType: typeof result,
    });

    // 记录性能指标
    this.metricsService?.incrementCounter(`cli_${operationName}_success_total`);
    this.metricsService?.recordHistogram(
      `cli_${operationName}_duration_ms`,
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

    this.logger.error(`CLI ${operationName}命令执行失败`, {
      requestId: this.requestId,
      correlationId: this.correlationId,
      operation: operationName,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // 记录错误指标
    this.metricsService?.incrementCounter(`cli_${operationName}_error_total`, {
      error_type:
        error instanceof Error ? error.constructor.name : 'UnknownError',
    });
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
