/**
 * 基础验证器接口
 *
 * 定义业务模块所需的通用验证功能接口。
 * 提供统一的验证契约，不包含具体的验证逻辑实现。
 *
 * @description 通用验证功能组件接口
 * @since 1.0.0
 */

/**
 * 验证结果接口
 */
export interface IValidationResult {
  /**
   * 验证是否成功
   */
  isValid: boolean;

  /**
   * 错误信息列表
   */
  errors: string[];

  /**
   * 验证上下文
   */
  context?: Record<string, unknown>;
}

/**
 * 基础验证器接口
 *
 * 定义业务模块所需的通用验证功能
 */
export interface IBaseValidator<TValue = unknown> {
  /**
   * 验证值
   *
   * @param value - 要验证的值
   * @returns 验证结果
   */
  validate(value: TValue): IValidationResult;

  /**
   * 异步验证值
   *
   * @param value - 要验证的值
   * @returns 验证结果的Promise
   */
  validateAsync(value: TValue): Promise<IValidationResult>;

  /**
   * 获取验证器名称
   *
   * @returns 验证器名称
   */
  getValidatorName(): string;

  /**
   * 获取验证器版本
   *
   * @returns 验证器版本
   */
  getValidatorVersion(): string;
}

/**
 * 复合验证器接口
 *
 * 支持多个验证器的组合
 */
export interface ICompositeValidator<TValue = unknown>
  extends IBaseValidator<TValue> {
  /**
   * 添加子验证器
   *
   * @param validator - 子验证器
   * @returns 复合验证器实例
   */
  addValidator(validator: IBaseValidator<TValue>): ICompositeValidator<TValue>;

  /**
   * 移除子验证器
   *
   * @param validatorName - 验证器名称
   * @returns 复合验证器实例
   */
  removeValidator(validatorName: string): ICompositeValidator<TValue>;

  /**
   * 获取所有子验证器
   *
   * @returns 子验证器列表
   */
  getValidators(): IBaseValidator<TValue>[];
}
