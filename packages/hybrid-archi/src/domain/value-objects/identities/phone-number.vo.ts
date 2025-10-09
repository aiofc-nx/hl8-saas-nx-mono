/**
 * 手机号值对象
 *
 * @class PhoneNumber
 * @since 1.0.0
 */

import { BaseValueObject } from '../../entities/base/base-value-object';

export class PhoneNumber extends BaseValueObject {
  get value(): string {
    return this._value;
  }

  private constructor(private readonly _value: string) {
    super();
  }

  public static create(phoneNumber: string): PhoneNumber {
    this.validate(phoneNumber);
    return new PhoneNumber(phoneNumber);
  }

  protected static validate(phoneNumber: string): void {
    if (!phoneNumber || phoneNumber.trim().length === 0) {
      throw new Error('手机号不能为空');
    }

    // 移除所有空格和连字符
    const cleaned = phoneNumber.replace(/[\s-]/g, '');

    // 基础验证：只允许数字和+号开头
    if (!/^\+?\d{10,15}$/.test(cleaned)) {
      throw new Error('手机号格式无效');
    }
  }

  public override toString(): string {
    return this.value;
  }

  public override toJSON(): Record<string, unknown> {
    return { value: this.value };
  }

  protected override arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof PhoneNumber)) {
      return false;
    }
    return this._value === other._value;
  }
}

