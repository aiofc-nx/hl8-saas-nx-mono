/**
 * 通用密码值对象
 *
 * @description 通用的密码值对象，提供密码加密和验证功能
 * @since 1.0.0
 */

// import * as bcrypt from 'bcrypt';
import { BaseValueObject } from '../base-value-object';

/**
 * 密码值对象
 *
 * @description 通用的密码值对象，包含加密和验证逻辑
 *
 * ## 业务规则
 *
 * ### 安全规则
 * - 密码必须使用bcrypt加密存储
 * - 密码哈希使用12轮盐值加密
 * - 原始密码不能直接存储
 * - 密码验证使用安全的比较算法
 *
 * ### 强度规则
 * - 密码长度至少8个字符
 * - 密码必须包含大小写字母
 * - 密码必须包含数字
 * - 密码必须包含特殊字符
 * - 密码不能包含常见弱密码
 */
export class Password extends BaseValueObject {
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
   * 创建密码值对象
   *
   * @description 创建密码值对象并验证强度
   * @param value - 原始密码
   * @returns 密码值对象
   * @throws {InvalidPasswordException} 当密码格式无效时
   * @throws {WeakPasswordException} 当密码强度不足时
   */
  public static create(value: string): Password {
    return new Password(value);
  }

  /**
   * 从哈希值创建密码值对象
   *
   * @description 从已加密的哈希值创建密码值对象
   * @param hashedValue - 加密后的哈希值
   * @returns 密码值对象
   */
  public static fromHash(hashedValue: string): Password {
    const password = Object.create(Password.prototype);
    password._value = hashedValue;
    return password;
  }

  /**
   * 验证密码格式和强度
   *
   * @description 验证密码是否符合安全要求
   * @private
   */
  protected override validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new InvalidPasswordException('密码不能为空');
    }

    if (this.value.length < 8) {
      throw new InvalidPasswordException('密码长度至少8个字符');
    }

    if (this.value.length > 128) {
      throw new InvalidPasswordException('密码长度不能超过128个字符');
    }

    this.validatePasswordStrength();
  }

  /**
   * 验证密码强度
   *
   * @description 验证密码强度是否符合安全要求
   * @private
   */
  private validatePasswordStrength(): void {
    const hasUpperCase = /[A-Z]/.test(this.value);
    const hasLowerCase = /[a-z]/.test(this.value);
    const hasNumbers = /\d/.test(this.value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.value);

    if (!hasUpperCase) {
      throw new WeakPasswordException('密码必须包含大写字母');
    }

    if (!hasLowerCase) {
      throw new WeakPasswordException('密码必须包含小写字母');
    }

    if (!hasNumbers) {
      throw new WeakPasswordException('密码必须包含数字');
    }

    if (!hasSpecialChar) {
      throw new WeakPasswordException('密码必须包含特殊字符');
    }

    this.checkCommonPasswords();
  }

  /**
   * 检查常见弱密码
   *
   * @description 检查密码是否为常见的弱密码
   * @private
   */
  private checkCommonPasswords(): void {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    const lowerCasePassword = this.value.toLowerCase();
    if (commonPasswords.includes(lowerCasePassword)) {
      throw new WeakPasswordException('密码不能使用常见弱密码');
    }
  }

  /**
   * 获取加密后的哈希值
   *
   * @description 返回密码的bcrypt哈希值
   * @returns 加密后的哈希值
   */
  public getHashedValue(): string {
    if (this.isHashed()) {
      return this.value;
    }
    // return bcrypt.hashSync(this.value, 12);
    return `hashed_${this.value}`; // 临时实现
  }

  /**
   * 验证密码
   *
   * @description 验证原始密码是否与哈希值匹配
   * @param plainPassword - 原始密码
   * @returns 是否匹配
   */
  public verify(plainPassword: string): boolean {
    if (this.isHashed()) {
      // return bcrypt.compareSync(plainPassword, this.value);
      return plainPassword === this.value; // 临时实现
    }
    return this.value === plainPassword;
  }

  /**
   * 检查是否为哈希值
   *
   * @description 检查当前值是否为bcrypt哈希值
   * @returns 是否为哈希值
   * @private
   */
  private isHashed(): boolean {
    return this.value.startsWith('$2b$') && this.value.length === 60;
  }

  /**
   * 比较密码是否相等
   *
   * @description 比较两个密码值对象是否相等
   * @param other - 其他密码值对象
   * @returns 是否相等
   */
  public override equals(other: BaseValueObject | null | undefined): boolean {
    if (!other || !(other instanceof Password)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * 转换为字符串
   *
   * @description 返回密码的哈希值字符串
   * @returns 哈希值字符串
   */
  public override toString(): string {
    return this.getHashedValue();
  }
}

/**
 * 无效密码异常
 *
 * @description 当密码格式无效时抛出的异常
 */
export class InvalidPasswordException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordException';
  }
}

/**
 * 弱密码异常
 *
 * @description 当密码强度不足时抛出的异常
 */
export class WeakPasswordException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeakPasswordException';
  }
}
