/**
 * 用例接口
 *
 * @description 定义所有用例的基础契约
 *
 * ## 设计原则
 *
 * ### 用例为中心
 * - 每个用例对应一个具体的业务场景
 * - 用例协调领域对象完成业务操作
 * - 用例不包含业务逻辑（委托给领域对象）
 *
 * ### 单一职责
 * - 每个用例只完成一个业务目标
 * - 用例之间相互独立
 * - 用例可组合但不嵌套
 *
 * ### 依赖倒置
 * - 用例依赖仓储接口（而非实现）
 * - 用例依赖端口接口（而非适配器）
 *
 * @example
 * ```typescript
 * class CreateTenantUseCase implements IUseCase<CreateTenantCommand, TenantId> {
 *   async execute(command: CreateTenantCommand): Promise<TenantId> {
 *     // 用例实现
 *   }
 * }
 * ```
 *
 * @interface IUseCase
 * @since 1.0.0
 */

/**
 * 用例接口
 *
 * @template TCommand - 用例输入（命令或查询）
 * @template TResult - 用例输出
 */
export interface IUseCase<TCommand, TResult> {
  /**
   * 执行用例
   *
   * @description 执行用例的核心业务逻辑
   *
   * ## 执行流程
   * 1. 验证命令参数
   * 2. 加载必要的聚合根
   * 3. 执行业务操作
   * 4. 保存聚合根
   * 5. 返回结果
   *
   * @async
   * @param {TCommand} command - 用例输入
   * @returns {Promise<TResult>} 用例输出
   * @throws {Error} 当业务规则违反或操作失败时抛出错误
   */
  execute(command: TCommand): Promise<TResult>;
}

/**
 * 查询用例接口
 *
 * @description 专门用于查询操作的用例接口
 *
 * @template TQuery - 查询参数
 * @template TResult - 查询结果
 */
export interface IQueryUseCase<TQuery, TResult> extends IUseCase<TQuery, TResult> {
  /**
   * 执行查询
   *
   * @async
   * @param {TQuery} query - 查询参数
   * @returns {Promise<TResult>} 查询结果
   */
  execute(query: TQuery): Promise<TResult>;
}

/**
 * 命令用例接口
 *
 * @description 专门用于命令操作的用例接口
 *
 * @template TCommand - 命令参数
 * @template TResult - 命令结果
 */
export interface ICommandUseCase<TCommand, TResult> extends IUseCase<TCommand, TResult> {
  /**
   * 执行命令
   *
   * @async
   * @param {TCommand} command - 命令参数
   * @returns {Promise<TResult>} 命令结果
   */
  execute(command: TCommand): Promise<TResult>;
}

