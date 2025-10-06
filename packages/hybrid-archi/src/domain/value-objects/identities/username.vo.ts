/**
 * 通用用户名值对象
 *
 * @description 通用的用户名值对象，提供用户名验证和业务规则
 * @since 1.0.0
 */

import { BaseValueObject } from '../base-value-object';

/**
 * 用户名值对象
 *
 * @description 通用的用户名值对象，包含验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 格式规则
 * - 用户名只能包含字母、数字、下划线和连字符
 * - 用户名长度在3-20个字符之间
 * - 用户名不能以数字开头
 * - 用户名不能包含连续的特殊字符
 *
 * ### 验证规则
 * - 用户名不能为空
 * - 用户名不能包含非法字符
 * - 用户名不能与系统保留字冲突
 * - 用户名在租户内必须唯一
 */
export class Username extends BaseValueObject {
  private readonly _value: string;

  private constructor(value: string) {
    super();
    this._value = value;
    this.validate();
  }

  get value(): string {
    return this._value;
  }

  /**
   * 创建用户名值对象
   *
   * @description 创建用户名值对象并验证格式
   * @param value - 用户名字符串
   * @returns 用户名值对象
   * @throws {InvalidUsernameException} 当用户名格式无效时
   */
  public static create(value: string): Username {
    return new Username(value);
  }

  /**
   * 验证用户名格式
   *
   * @description 验证用户名格式是否符合业务规则
   * @private
   */
  protected override validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new InvalidUsernameException('用户名不能为空');
    }

    if (this.value.length < 3) {
      throw new InvalidUsernameException('用户名至少3个字符');
    }

    if (this.value.length > 20) {
      throw new InvalidUsernameException('用户名最多20个字符');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(this.value)) {
      throw new InvalidUsernameException(
        '用户名只能包含字母、数字、下划线和连字符'
      );
    }

    if (/^[0-9]/.test(this.value)) {
      throw new InvalidUsernameException('用户名不能以数字开头');
    }

    if (/[_-]{2,}/.test(this.value)) {
      throw new InvalidUsernameException('用户名不能包含连续的特殊字符');
    }

    this.validateReservedWords();
  }

  /**
   * 验证保留字
   *
   * @description 检查用户名是否为系统保留字
   * @private
   */
  private validateReservedWords(): void {
    const reservedWords = [
      'admin',
      'administrator',
      'root',
      'system',
      'user',
      'guest',
      'api',
      'www',
      'mail',
      'ftp',
      'support',
      'help',
      'info',
      'test',
      'demo',
      'sample',
      'example',
      'null',
      'undefined',
      'true',
      'false',
      'yes',
      'no',
      'on',
      'off',
    ];

    if (reservedWords.includes(this.value.toLowerCase())) {
      throw new InvalidUsernameException(`用户名 "${this.value}" 是系统保留字`);
    }
  }

  /**
   * 比较用户名是否相等
   *
   * @description 比较两个用户名是否相等（不区分大小写）
   * @param other - 其他用户名值对象
   * @returns 是否相等
   */
  public override equals(other: BaseValueObject | null | undefined): boolean {
    if (!other || !(other instanceof Username)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * 转换为字符串
   *
   * @description 返回用户名字符串
   * @returns 用户名字符串
   */
  public override toString(): string {
    return this.value;
  }
}

/**
 * 无效用户名异常
 *
 * @description 当用户名格式无效时抛出的异常
 */
export class InvalidUsernameException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUsernameException';
  }
}
