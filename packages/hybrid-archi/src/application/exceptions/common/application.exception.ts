/**
 * 通用应用层异常基类
 *
 * @description 应用层异常的基础类，提供统一的异常处理
 * @since 1.0.0
 */

/**
 * 应用层异常基类
 *
 * @description 应用层异常的基础类，提供统一的异常处理
 *
 * ## 业务规则
 *
 * ### 异常分类规则
 * - 业务异常：业务规则违反、资源不存在等
 * - 技术异常：并发冲突、验证失败等
 * - 基础设施异常：数据库连接、外部服务等
 *
 * ### 异常信息规则
 * - 异常消息必须清晰明确
 * - 异常代码必须唯一且有意义
 * - 异常详情必须包含上下文信息
 * - 异常堆栈必须完整
 */
export abstract class ApplicationException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  /**
   * 获取异常信息
   *
   * @description 获取完整的异常信息
   * @returns 异常信息对象
   */
  public getExceptionInfo(): {
    name: string;
    message: string;
    code: string;
    details?: any;
    stack?: string;
  } {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}
