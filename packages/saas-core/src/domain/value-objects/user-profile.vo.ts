/**
 * 用户配置值对象
 * 
 * @description 封装用户的基本配置信息，包括姓名、头像、联系方式等
 * 
 * @since 1.0.0
 */

export interface UserProfileData {
  firstName: string;
  lastName: string;
  displayName?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
  timezone?: string;
  language?: string;
}

/**
 * 用户配置值对象
 * 
 * @description 不可变的用户配置信息
 */
export class UserProfile {
  constructor(private readonly _data: UserProfileData) {}

  /**
   * 获取完整姓名
   */
  public get fullName(): string {
    return `${this._data.firstName} ${this._data.lastName}`.trim();
  }

  /**
   * 获取显示名称
   */
  public get displayName(): string {
    return this._data.displayName || this.fullName;
  }

  /**
   * 获取姓
   */
  public get firstName(): string {
    return this._data.firstName;
  }

  /**
   * 获取名
   */
  public get lastName(): string {
    return this._data.lastName;
  }

  /**
   * 获取头像URL
   */
  public get avatar(): string | undefined {
    return this._data.avatar;
  }

  /**
   * 获取电话号码
   */
  public get phone(): string | undefined {
    return this._data.phone;
  }

  /**
   * 获取地址
   */
  public get address(): string | undefined {
    return this._data.address;
  }

  /**
   * 获取个人简介
   */
  public get bio(): string | undefined {
    return this._data.bio;
  }

  /**
   * 获取时区
   */
  public get timezone(): string | undefined {
    return this._data.timezone;
  }

  /**
   * 获取语言偏好
   */
  public get language(): string | undefined {
    return this._data.language;
  }

  /**
   * 更新配置信息
   */
  public update(updates: Partial<UserProfileData>): UserProfile {
    return new UserProfile({ ...this._data, ...updates });
  }

  /**
   * 获取原始数据
   */
  public toJSON(): UserProfileData {
    return { ...this._data };
  }

  /**
   * 从JSON数据创建
   */
  public static fromJSON(data: UserProfileData): UserProfile {
    return new UserProfile(data);
  }
}
