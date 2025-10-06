import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 用户偏好设置类型
 *
 * @description 定义用户偏好设置的具体类型
 * 支持常见的用户偏好配置项
 *
 * @since 1.0.0
 */
export interface UserPreferences {
  /** 语言设置 */
  language?: string;
  /** 时区设置 */
  timezone?: string;
  /** 主题设置 */
  theme?: 'light' | 'dark' | 'auto';
  /** 通知设置 */
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  /** 隐私设置 */
  privacy?: {
    profileVisibility?: 'public' | 'private' | 'friends';
    showEmail?: boolean;
    showPhone?: boolean;
  };
  /** 其他自定义设置 */
  [key: string]: string | number | boolean | Record<string, unknown> | undefined;
}

/**
 * 用户档案属性接口
 *
 * @description 定义用户的基本档案信息
 * 包括姓名、头像、联系方式等个人信息
 *
 * @since 1.0.0
 */
export interface UserProfileProps {
  /**
   * 名字
   * 
   * @description 用户的名字
   * 必填字段，不能为空
   */
  firstName: string;

  /**
   * 姓氏
   * 
   * @description 用户的姓氏
   * 必填字段，不能为空
   */
  lastName: string;

  /**
   * 头像URL
   * 
   * @description 用户头像的URL地址
   * 可选字段，为空时使用默认头像
   */
  avatar?: string;

  /**
   * 手机号码
   * 
   * @description 用户的手机号码
   * 可选字段，用于联系和验证
   */
  phone?: string;

  /**
   * 时区
   * 
   * @description 用户所在的时区
   * 必填字段，用于时间显示和计算
   */
  timezone: string;

  /**
   * 语言设置
   * 
   * @description 用户的默认语言
   * 必填字段，用于界面显示
   */
  locale: string;

  /**
   * 个人偏好设置
   * 
   * @description 用户的各种偏好配置
   * 键值对形式，支持任意配置
   */
  preferences: UserPreferences;

  /**
   * 个人简介
   * 
   * @description 用户的个人简介
   * 可选字段，用于展示用户信息
   */
  bio?: string;

  /**
   * 职位
   * 
   * @description 用户的职位信息
   * 可选字段，用于组织架构显示
   */
  position?: string;

  /**
   * 部门
   * 
   * @description 用户所属部门
   * 可选字段，用于组织架构显示
   */
  department?: string;
}

/**
 * 用户档案值对象
 *
 * @description 封装用户的档案信息
 * 提供档案验证、更新、格式化等功能
 *
 * ## 业务规则
 *
 * ### 必填字段规则
 * - firstName 和 lastName 不能为空
 * - timezone 和 locale 不能为空
 * - 全名长度不能超过100个字符
 *
 * ### 可选字段规则
 * - avatar 必须是有效的URL格式
 * - phone 必须是有效的手机号码格式
 * - bio 长度不能超过500个字符
 * - position 和 department 长度不能超过50个字符
 *
 * ### 偏好设置规则
 * - preferences 支持任意键值对配置
 * - 键名不能包含特殊字符
 * - 值可以是任意类型
 *
 * @example
 * ```typescript
 * const profile = UserProfile.create({
 *   firstName: '张',
 *   lastName: '三',
 *   avatar: 'https://example.com/avatar.jpg',
 *   phone: '13800138000',
 *   timezone: 'Asia/Shanghai',
 *   locale: 'zh-CN',
 *   preferences: { theme: 'dark', notifications: true },
 *   bio: '软件工程师',
 *   position: '高级开发工程师',
 *   department: '技术部'
 * });
 * 
 * const fullName = profile.getFullName(); // "张三"
 * const newProfile = profile.updateProfile({ bio: '新的简介' });
 * ```
 *
 * @since 1.0.0
 */
export class UserProfile extends BaseValueObject {
  /**
   * 私有属性存储
   */
  private readonly _props: UserProfileProps;
  /**
   * 私有构造函数
   * 
   * @description 使用工厂方法创建实例
   * 确保数据验证和不变性
   *
   * @param props - 用户档案属性
   */
  private constructor(props: UserProfileProps) {
    super();
    this._props = props;
    this.validate();
  }

  /**
   * 创建用户档案实例
   *
   * @description 工厂方法，创建并验证用户档案实例
   *
   * @param props - 用户档案属性
   * @returns 用户档案实例
   * @throws {InvalidUserProfileException} 当档案数据无效时抛出异常
   *
   * @example
   * ```typescript
   * const profile = UserProfile.create({
   *   firstName: '张',
   *   lastName: '三',
   *   timezone: 'Asia/Shanghai',
   *   locale: 'zh-CN',
   *   preferences: {}
   * });
   * ```
   *
   * @since 1.0.0
   */
  public static create(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  /**
   * 验证用户档案数据
   *
   * @description 验证档案数据是否符合业务规则
   *
   * @throws {InvalidUserProfileException} 当档案数据无效时抛出异常
   *
   * @since 1.0.0
   */
  protected override validate(): void {
    // 验证必填字段
    if (!this._props.firstName || this._props.firstName.trim().length === 0) {
      throw new InvalidUserProfileException('用户名字不能为空');
    }

    if (!this._props.lastName || this._props.lastName.trim().length === 0) {
      throw new InvalidUserProfileException('用户姓氏不能为空');
    }

    if (!this._props.timezone || this._props.timezone.trim().length === 0) {
      throw new InvalidUserProfileException('用户时区不能为空');
    }

    if (!this._props.locale || this._props.locale.trim().length === 0) {
      throw new InvalidUserProfileException('用户语言设置不能为空');
    }

    // 验证字段长度
    if (this._props.firstName.trim().length > 50) {
      throw new InvalidUserProfileException('用户名字长度不能超过50个字符');
    }

    if (this._props.lastName.trim().length > 50) {
      throw new InvalidUserProfileException('用户姓氏长度不能超过50个字符');
    }

    // 验证全名长度
    const fullName = `${this._props.firstName} ${this._props.lastName}`.trim();
    if (fullName.length > 100) {
      throw new InvalidUserProfileException('用户全名长度不能超过100个字符');
    }

    // 验证可选字段
    if (this._props.avatar) {
      this.validateUrl(this._props.avatar, '头像URL');
    }

    if (this._props.phone) {
      this.validatePhone(this._props.phone);
    }

    if (this._props.bio && this._props.bio.length > 500) {
      throw new InvalidUserProfileException('个人简介长度不能超过500个字符');
    }

    if (this._props.position && this._props.position.length > 50) {
      throw new InvalidUserProfileException('职位长度不能超过50个字符');
    }

    if (this._props.department && this._props.department.length > 50) {
      throw new InvalidUserProfileException('部门长度不能超过50个字符');
    }

    // 验证偏好设置
    if (this._props.preferences) {
      this.validatePreferences(this._props.preferences);
    }
  }

  /**
   * 验证URL格式
   *
   * @description 验证URL是否符合标准格式
   *
   * @param url - URL字符串
   * @param fieldName - 字段名称
   * @throws {InvalidUserProfileException} 当URL格式无效时抛出异常
   *
   * @since 1.0.0
   */
  private validateUrl(url: string, fieldName: string): void {
    try {
      new URL(url);
    } catch {
      throw new InvalidUserProfileException(`${fieldName} 必须是有效的URL格式`);
    }
  }

  /**
   * 验证手机号码格式
   *
   * @description 验证手机号码是否符合标准格式
   *
   * @param phone - 手机号码
   * @throws {InvalidUserProfileException} 当手机号码格式无效时抛出异常
   *
   * @since 1.0.0
   */
  private validatePhone(phone: string): void {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      throw new InvalidUserProfileException('手机号码格式不正确');
    }
  }

  /**
   * 验证偏好设置
   *
   * @description 验证偏好设置的键名格式
   *
   * @param preferences - 偏好设置
   * @throws {InvalidUserProfileException} 当偏好设置无效时抛出异常
   *
   * @since 1.0.0
   */
  private validatePreferences(preferences: UserPreferences): void {
    const keyRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    
    for (const key of Object.keys(preferences)) {
      if (!keyRegex.test(key)) {
        throw new InvalidUserProfileException(`偏好设置键名 ${key} 格式不正确`);
      }
    }
  }

  /**
   * 获取全名
   *
   * @description 返回用户的全名（名字 + 姓氏）
   *
   * @returns 用户全名
   *
   * @example
   * ```typescript
   * const fullName = profile.getFullName(); // "张三"
   * ```
   *
   * @since 1.0.0
   */
  public getFullName(): string {
    return `${this._props.firstName} ${this._props.lastName}`.trim();
  }

  /**
   * 获取显示名称
   *
   * @description 返回用户的显示名称
   * 优先使用全名，如果没有则使用名字
   *
   * @returns 显示名称
   *
   * @example
   * ```typescript
   * const displayName = profile.getDisplayName(); // "张三"
   * ```
   *
   * @since 1.0.0
   */
  public getDisplayName(): string {
    const fullName = this.getFullName();
    return fullName || this._props.firstName;
  }

  /**
   * 更新档案
   *
   * @description 创建新的用户档案实例，更新指定字段
   * 遵循值对象不变性原则
   *
   * @param updates - 要更新的字段
   * @returns 新的用户档案实例
   *
   * @example
   * ```typescript
   * const newProfile = profile.updateProfile({
   *   bio: '新的简介',
   *   position: '高级开发工程师'
   * });
   * ```
   *
   * @since 1.0.0
   */
  public updateProfile(updates: Partial<UserProfileProps>): UserProfile {
    return UserProfile.create({ ...this._props, ...updates });
  }

  /**
   * 更新偏好设置
   *
   * @description 创建新的档案实例，更新偏好设置
   *
   * @param preferences - 新的偏好设置
   * @returns 新的用户档案实例
   *
   * @example
   * ```typescript
   * const newProfile = profile.updatePreferences({
   *   theme: 'dark',
   *   notifications: false
   * });
   * ```
   *
   * @since 1.0.0
   */
  public updatePreferences(preferences: UserPreferences): UserProfile {
    return this.updateProfile({ 
      preferences: { ...this._props.preferences, ...preferences } 
    });
  }

  /**
   * 获取偏好设置值
   *
   * @description 获取指定偏好设置的当前值
   *
   * @param key - 偏好设置键
   * @param defaultValue - 默认值
   * @returns 偏好设置值或默认值
   *
   * @example
   * ```typescript
   * const theme = profile.getPreference('theme', 'light'); // 'dark'
   * const notifications = profile.getPreference('notifications', true); // true
   * ```
   *
   * @since 1.0.0
   */
  public getPreference<T>(key: string, defaultValue: T): T {
    return (this._props.preferences[key] as T) ?? defaultValue;
  }

  /**
   * 检查是否有头像
   *
   * @description 检查用户是否设置了头像
   *
   * @returns 是否有头像
   *
   * @example
   * ```typescript
   * const hasAvatar = profile.hasAvatar(); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasAvatar(): boolean {
    return !!this._props.avatar;
  }

  /**
   * 检查是否有手机号码
   *
   * @description 检查用户是否设置了手机号码
   *
   * @returns 是否有手机号码
   *
   * @example
   * ```typescript
   * const hasPhone = profile.hasPhone(); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasPhone(): boolean {
    return !!this._props.phone;
  }

  /**
   * 获取所有档案信息
   *
   * @description 返回所有档案信息的副本
   *
   * @returns 档案属性副本
   *
   * @since 1.0.0
   */
  public getAllProfile(): UserProfileProps {
    return { ...this._props };
  }

  // Getter 方法
  public get firstName(): string { return this._props.firstName; }
  public get lastName(): string { return this._props.lastName; }
  public get avatar(): string | undefined { return this._props.avatar; }
  public get phone(): string | undefined { return this._props.phone; }
  public get timezone(): string { return this._props.timezone; }
  public get locale(): string { return this._props.locale; }
  public get preferences(): UserPreferences { return this._props.preferences; }
  public get bio(): string | undefined { return this._props.bio; }
  public get position(): string | undefined { return this._props.position; }
  public get department(): string | undefined { return this._props.department; }
}

/**
 * 无效用户档案异常
 *
 * @description 当用户档案数据无效时抛出的异常
 *
 * @since 1.0.0
 */
export class InvalidUserProfileException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserProfileException';
  }
}
