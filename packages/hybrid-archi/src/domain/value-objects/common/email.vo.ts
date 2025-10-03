/**
 * 通用邮箱值对象
 *
 * @description 通用的邮箱值对象，提供邮箱验证和业务规则
 * @since 1.0.0
 */

import { BaseValueObject } from '../base-value-object';

/**
 * 邮箱值对象
 *
 * @description 通用的邮箱值对象，包含验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 格式规则
 * - 邮箱必须符合RFC 5322标准
 * - 邮箱地址不区分大小写
 * - 邮箱地址长度不超过254个字符
 * - 本地部分长度不超过64个字符
 *
 * ### 验证规则
 * - 邮箱必须包含@符号
 * - 邮箱必须包含有效的域名
 * - 邮箱不能包含非法字符
 * - 邮箱不能为空或仅包含空白字符
 */
export class Email extends BaseValueObject {
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
   * 创建邮箱值对象
   *
   * @description 创建邮箱值对象并验证格式
   * @param value - 邮箱地址
   * @returns 邮箱值对象
   * @throws {InvalidEmailException} 当邮箱格式无效时
   */
  public static create(value: string): Email {
    return new Email(value);
  }

  /**
   * 验证邮箱格式
   *
   * @description 验证邮箱格式是否符合RFC 5322标准
   * @private
   */
  protected override validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new InvalidEmailException('邮箱不能为空');
    }

    if (this.value.length > 254) {
      throw new InvalidEmailException('邮箱长度不能超过254个字符');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new InvalidEmailException(`邮箱格式无效: ${this.value}`);
    }

    const [localPart, domain] = this.value.split('@');
    if (localPart.length > 64) {
      throw new InvalidEmailException('邮箱本地部分长度不能超过64个字符');
    }
  }

  /**
   * 获取邮箱域名
   *
   * @description 提取邮箱的域名部分
   * @returns 域名
   */
  public getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * 获取邮箱本地部分
   *
   * @description 提取邮箱的本地部分
   * @returns 本地部分
   */
  public getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * 比较邮箱是否相等
   *
   * @description 比较两个邮箱是否相等（不区分大小写）
   * @param other - 其他邮箱值对象
   * @returns 是否相等
   */
  public override equals(other: BaseValueObject | null | undefined): boolean {
    if (!other || !(other instanceof Email)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * 转换为字符串
   *
   * @description 返回邮箱地址字符串
   * @returns 邮箱地址
   */
  public override toString(): string {
    return this.value;
  }
}

/**
 * 无效邮箱异常
 *
 * @description 当邮箱格式无效时抛出的异常
 */
export class InvalidEmailException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailException';
  }
}
