/**
 * 用户配置文件值对象
 *
 * 用户配置文件，包含用户的个人信息和偏好设置。
 *
 * @description 用户配置文件包含用户的个人信息、偏好设置等。
 * 提供用户信息的验证、格式化等功能。
 * 支持用户信息的更新和版本控制。
 *
 * ## 业务规则
 *
 * ### 个人信息规则
 * - 姓名必须包含名和姓
 * - 姓名长度不超过50个字符
 * - 电话号码格式验证
 * - 头像URL格式验证
 *
 * ### 偏好设置规则
 * - 时区必须是有效的IANA时区
 * - 语言必须是支持的语言代码
 * - 偏好设置支持默认值
 * - 偏好设置支持个性化定制
 *
 * ### 验证规则
 * - 所有必填字段必须提供
 * - 字段格式必须符合规范
 * - 字段长度必须在限制范围内
 * - 特殊字符需要进行转义处理
 *
 * @example
 * ```typescript
 * // 创建用户配置文件
 * const profile = UserProfile.create({
 *   firstName: "John",
 *   lastName: "Doe",
 *   phone: "+86-138-0013-8000",
 *   timezone: "Asia/Shanghai",
 *   language: "zh-CN"
 * });
 *
 * // 获取全名
 * console.log(profile.getFullName()); // "John Doe"
 *
 * // 更新配置文件
 * const updatedProfile = profile.update({
 *   firstName: "Jane",
 *   lastName: "Smith"
 * });
 * ```
 *
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { UserPreferences } from './user-preferences.vo';

/**
 * 用户配置文件值对象
 *
 * @description 用户配置文件，包含用户的个人信息和偏好设置
 */
export class UserProfile extends BaseValueObject {
  /**
   * 构造函数
   *
   * @description 创建用户配置文件实例
   * @param firstName - 名
   * @param lastName - 姓
   * @param avatar - 头像URL
   * @param phone - 电话号码
   * @param timezone - 时区
   * @param language - 语言
   * @param preferences - 偏好设置
   */
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly avatar?: string,
    public readonly phone?: string,
    public readonly timezone: string = 'UTC',
    public readonly language: string = 'zh-CN',
    public readonly preferences: UserPreferences = new UserPreferences()
  ) {
    super();
    this.validate();
  }

  /**
   * 创建用户配置文件
   *
   * @description 创建新的用户配置文件实例
   * @param data - 配置文件数据
   * @returns 用户配置文件实例
   */
  public static create(data: {
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    timezone?: string;
    language?: string;
    preferences?: UserPreferences;
  }): UserProfile {
    return new UserProfile(
      data.firstName,
      data.lastName,
      data.avatar,
      data.phone,
      data.timezone || 'UTC',
      data.language || 'zh-CN',
      data.preferences || new UserPreferences()
    );
  }

  /**
   * 获取全名
   *
   * @description 获取用户的完整姓名
   * @returns 全名字符串
   */
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * 获取显示名称
   *
   * @description 获取用户的显示名称（优先使用全名，其次使用用户名）
   * @returns 显示名称
   */
  public getDisplayName(): string {
    return this.getFullName();
  }

  /**
   * 更新配置文件
   *
   * @description 更新用户配置文件，返回新的实例
   * @param updates - 更新数据
   * @returns 新的用户配置文件实例
   */
  public update(
    updates: Partial<{
      firstName: string;
      lastName: string;
      avatar: string;
      phone: string;
      timezone: string;
      language: string;
      preferences: UserPreferences;
    }>
  ): UserProfile {
    return new UserProfile(
      updates.firstName ?? this.firstName,
      updates.lastName ?? this.lastName,
      updates.avatar ?? this.avatar,
      updates.phone ?? this.phone,
      updates.timezone ?? this.timezone,
      updates.language ?? this.language,
      updates.preferences ?? this.preferences
    );
  }

  /**
   * 验证配置文件
   *
   * @description 验证用户配置文件的完整性和格式
   * @private
   */
  protected override validate(): void {
    this.validateName();
    this.validatePhone();
    this.validateAvatar();
    this.validateTimezone();
    this.validateLanguage();
  }

  /**
   * 验证姓名
   *
   * @description 验证用户姓名的格式和长度
   * @private
   */
  private validateName(): void {
    if (!this.firstName || this.firstName.trim().length === 0) {
      throw new InvalidUserProfileException('First name is required');
    }

    if (this.firstName.length > 50) {
      throw new InvalidUserProfileException('First name is too long');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      throw new InvalidUserProfileException('Last name is required');
    }

    if (this.lastName.length > 50) {
      throw new InvalidUserProfileException('Last name is too long');
    }
  }

  /**
   * 验证电话号码
   *
   * @description 验证电话号码的格式
   * @private
   */
  private validatePhone(): void {
    if (this.phone && this.phone.trim().length > 0) {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(this.phone.replace(/[\s\-\(\)]/g, ''))) {
        throw new InvalidUserProfileException('Invalid phone number format');
      }
    }
  }

  /**
   * 验证头像URL
   *
   * @description 验证头像URL的格式
   * @private
   */
  private validateAvatar(): void {
    if (this.avatar && this.avatar.trim().length > 0) {
      try {
        new URL(this.avatar);
      } catch {
        throw new InvalidUserProfileException('Invalid avatar URL format');
      }
    }
  }

  /**
   * 验证时区
   *
   * @description 验证时区是否为有效的IANA时区
   * @private
   */
  private validateTimezone(): void {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: this.timezone });
    } catch {
      throw new InvalidUserProfileException(
        `Invalid timezone: ${this.timezone}`
      );
    }
  }

  /**
   * 验证语言
   *
   * @description 验证语言代码格式
   * @private
   */
  private validateLanguage(): void {
    const languageRegex = /^[a-z]{2}(-[A-Z]{2})?$/;
    if (!languageRegex.test(this.language)) {
      throw new InvalidUserProfileException(
        `Invalid language code: ${this.language}`
      );
    }
  }

  /**
   * 转换为JSON对象
   *
   * @description 将用户配置文件转换为JSON对象
   * @returns JSON对象
   */
  public override toJSON(): Record<string, unknown> {
    return {
      firstName: this.firstName,
      lastName: this.lastName,
      avatar: this.avatar,
      phone: this.phone,
      timezone: this.timezone,
      language: this.language,
      preferences: this.preferences.toJSON(),
    };
  }
}

/**
 * 无效用户配置文件异常
 *
 * @description 当用户配置文件无效时抛出
 */
export class InvalidUserProfileException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserProfileException';
  }
}
