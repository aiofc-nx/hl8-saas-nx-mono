/**
 * 租户代码值对象
 *
 * @description 封装租户代码的验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 格式要求
 * - 长度：3-20字符
 * - 格式：小写字母+数字
 * - 唯一性：全局唯一（由应用层验证）
 *
 * ### 验证规则
 * - 不能为空
 * - 必须符合长度要求
 * - 必须匹配正则表达式
 *
 * ## 使用场景
 *
 * 租户代码用于：
 * - 租户的唯一标识（业务层面）
 * - 租户子域名生成
 * - 租户URL路径标识
 *
 * @example
 * ```typescript
 * // 创建租户代码
 * const code = TenantCode.create('acme2024');
 *
 * // 验证租户代码
 * if (TenantCode.isValid('invalid CODE')) {
 *   // 不会执行，因为包含大写和空格
 * }
 *
 * // 获取原始值
 * const codeString = code.value; // 'acme2024'
 * ```
 *
 * @class TenantCode
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { TENANT_CODE_VALIDATION } from '../../../constants/tenant.constants';

/**
 * 租户代码值对象
 *
 * @class TenantCode
 * @extends {BaseValueObject}
 */
export class TenantCode extends BaseValueObject {
  /**
   * 获取租户代码原始值
   *
   * @readonly
   * @type {string}
   */
  get value(): string {
    return this._value;
  }

  /**
   * 私有构造函数
   *
   * @private
   * @param {string} value - 租户代码
   */
  private constructor(private readonly _value: string) {
    super();
  }

  /**
   * 创建租户代码值对象
   *
   * @description 验证并创建租户代码值对象
   *
   * ## 验证流程
   * 1. 检查代码是否为空
   * 2. 检查长度是否符合要求（3-20字符）
   * 3. 检查格式是否符合正则表达式（小写字母+数字）
   *
   * @static
   * @param {string} code - 租户代码
   * @returns {TenantCode} 租户代码值对象
   * @throws {Error} 当代码不符合验证规则时抛出错误
   *
   * @example
   * ```typescript
   * const code = TenantCode.create('acme2024');
   * ```
   */
  public static create(code: string): TenantCode {
    this.validate(code);
    return new TenantCode({ value: code });
  }

  /**
   * 验证租户代码
   *
   * @private
   * @static
   * @param {string} code - 待验证的租户代码
   * @throws {Error} 当代码不符合验证规则时抛出错误
   */
  private static validate(code: string): void {
    // 检查空值
    if (!code || code.trim().length === 0) {
      throw new Error('租户代码不能为空');
    }

    // 检查长度
    if (
      code.length < TENANT_CODE_VALIDATION.MIN_LENGTH ||
      code.length > TENANT_CODE_VALIDATION.MAX_LENGTH
    ) {
      throw new Error(TENANT_CODE_VALIDATION.ERROR_MESSAGE);
    }

    // 检查格式
    if (!TENANT_CODE_VALIDATION.PATTERN.test(code)) {
      throw new Error(TENANT_CODE_VALIDATION.ERROR_MESSAGE);
    }
  }

  /**
   * 检查租户代码是否有效
   *
   * @description 静态方法，用于验证租户代码而不抛出异常
   *
   * @static
   * @param {string} code - 待验证的租户代码
   * @returns {boolean} 代码是否有效
   *
   * @example
   * ```typescript
   * if (TenantCode.isValid('acme2024')) {
   *   // 代码有效
   * }
   * ```
   */
  public static isValid(code: string): boolean {
    try {
      this.validate(code);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 转换为字符串
   *
   * @returns {string} 租户代码字符串
   */
  public override toString(): string {
    return this.value;
  }

  /**
   * 转换为JSON
   *
   * @returns {Record<string, unknown>} 租户代码JSON对象
   */
  public override toJSON(): Record<string, unknown> {
    return { value: this.value };
  }

  /**
   * 比较两个租户代码是否相等
   *
   * @param {BaseValueObject} other - 另一个值对象
   * @returns {boolean}
   */
  protected override arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof TenantCode)) {
      return false;
    }
    return this._value === other._value;
  }
}

