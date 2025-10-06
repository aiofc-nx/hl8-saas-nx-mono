/**
 * 通用处理器接口定义
 *
 * @description 定义命令处理器和查询处理器的通用接口
 * @since 1.0.0
 */


/**
 * 命令处理器接口
 *
 * @description 命令处理器的通用接口
 *
 * ## 业务规则
 *
 * ### 命令处理规则
 * - 每个命令处理器只处理一种类型的命令
 * - 命令处理器应该保持简单和专注
 * - 复杂的业务逻辑应该委托给领域服务
 *
 * ### 事务性规则
 * - 命令处理器在事务中执行
 * - 失败时应该回滚所有变更
 * - 成功时应该提交事务并发布事件
 *
 * ### 幂等性规则
 * - 命令处理器应该支持幂等性
 * - 重复执行相同的命令应该产生相同的结果
 * - 应该能够处理重复的命令请求
 */
export interface ICommandHandler<TCommand, TResult> {
  /**
   * 执行命令
   *
   * @description 执行命令并返回结果
   * @param command - 命令对象
   * @returns 命令执行结果
   */
  execute(command: TCommand): Promise<TResult>;
}

/**
 * 查询处理器接口
 *
 * @description 查询处理器的通用接口
 *
 * ## 业务规则
 *
 * ### 查询处理规则
 * - 每个查询处理器只处理一种类型的查询
 * - 查询处理器应该保持简单和专注
 * - 复杂的数据聚合应该委托给专门的查询服务
 *
 * ### 性能规则
 * - 查询处理器应该优化查询性能
 * - 应该支持分页、排序、过滤等功能
 * - 应该使用适当的索引和查询优化技术
 *
 * ### 缓存规则
 * - 查询处理器应该支持结果缓存
 * - 应该根据数据变更情况更新缓存
 * - 应该提供缓存失效机制
 */
export interface IQueryHandler<TQuery, TResult> {
  /**
   * 执行查询
   *
   * @description 执行查询并返回结果
   * @param query - 查询对象
   * @returns 查询执行结果
   */
  execute(query: TQuery): Promise<TResult>;
}

/**
 * 事件处理器接口
 *
 * @description 事件处理器的通用接口
 *
 * ## 业务规则
 *
 * ### 事件处理规则
 * - 每个事件处理器只处理一种类型的事件
 * - 事件处理器应该是幂等的
 * - 事件处理器应该能够处理重复事件
 *
 * ### 异步处理规则
 * - 事件处理器应该异步处理事件
 * - 事件处理器应该支持重试机制
 * - 事件处理器应该支持死信队列
 */
export interface IEventHandler<TEvent> {
  /**
   * 处理事件
   *
   * @description 处理领域事件
   * @param event - 领域事件
   */
  handle(event: TEvent): Promise<void>;
}

/**
 * 处理器基类
 *
 * @description 提供处理器的基础功能
 */
export abstract class BaseHandler {
  /**
   * 获取处理器名称
   *
   * @description 获取处理器的名称，用于日志和监控
   * @returns 处理器名称
   */
  public abstract getHandlerName(): string;

  /**
   * 检查处理器是否可用
   *
   * @description 检查处理器是否可用，用于健康检查
   * @returns 是否可用
   */
  public isAvailable(): boolean {
    return true;
  }
}
