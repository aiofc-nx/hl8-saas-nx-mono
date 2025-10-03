/**
 * 用户管理模块用户偏好设置值对象
 *
 * @description 用户管理模块的用户偏好设置值对象，基于通用组件
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import {
  ThemeType,
  NotificationSettings,
  PrivacySettings,
} from '@hl8/hybrid-archi';

/**
 * 用户偏好设置值对象
 *
 * @description 用户偏好设置，包含用户的个性化配置
 */
export class UserPreferences extends BaseValueObject {
  /**
   * 构造函数
   *
   * @description 创建用户偏好设置实例
   * @param theme - 主题设置
   * @param notifications - 通知设置
   * @param privacy - 隐私设置
   * @param language - 语言设置
   * @param timezone - 时区设置
   */
  constructor(
    public readonly theme: ThemeType = ThemeType.Auto,
    public readonly notifications: NotificationSettings = {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    public readonly privacy: PrivacySettings = {
      profileVisibility: 'private',
      activityStatus: false,
      dataCollection: true,
      analytics: false,
    },
    public readonly language: string = 'zh-CN',
    public readonly timezone: string = 'UTC'
  ) {
    super();
    this.validate();
  }

  /**
   * 创建用户偏好设置
   *
   * @description 创建新的用户偏好设置实例
   * @param data - 偏好设置数据
   * @returns 用户偏好设置实例
   */
  public static create(data: {
    theme?: ThemeType;
    notifications?: Partial<NotificationSettings>;
    privacy?: Partial<PrivacySettings>;
    language?: string;
    timezone?: string;
  }): UserPreferences {
    return new UserPreferences(
      data.theme || ThemeType.Auto,
      {
        email: true,
        push: true,
        sms: false,
        marketing: false,
        ...data.notifications,
      },
      {
        profileVisibility: 'private',
        activityStatus: false,
        dataCollection: true,
        analytics: false,
        ...data.privacy,
      },
      data.language || 'zh-CN',
      data.timezone || 'UTC'
    );
  }

  /**
   * 更新主题设置
   *
   * @description 更新用户主题设置
   * @param theme - 新主题
   * @returns 新的用户偏好设置实例
   */
  public updateTheme(theme: ThemeType): UserPreferences {
    return new UserPreferences(
      theme,
      this.notifications,
      this.privacy,
      this.language,
      this.timezone
    );
  }

  /**
   * 更新通知设置
   *
   * @description 更新用户通知设置
   * @param notifications - 新通知设置
   * @returns 新的用户偏好设置实例
   */
  public updateNotifications(
    notifications: Partial<NotificationSettings>
  ): UserPreferences {
    return new UserPreferences(
      this.theme,
      { ...this.notifications, ...notifications },
      this.privacy,
      this.language,
      this.timezone
    );
  }

  /**
   * 更新隐私设置
   *
   * @description 更新用户隐私设置
   * @param privacy - 新隐私设置
   * @returns 新的用户偏好设置实例
   */
  public updatePrivacy(privacy: Partial<PrivacySettings>): UserPreferences {
    return new UserPreferences(
      this.theme,
      this.notifications,
      { ...this.privacy, ...privacy },
      this.language,
      this.timezone
    );
  }

  /**
   * 更新语言设置
   *
   * @description 更新用户语言设置
   * @param language - 新语言
   * @returns 新的用户偏好设置实例
   */
  public updateLanguage(language: string): UserPreferences {
    return new UserPreferences(
      this.theme,
      this.notifications,
      this.privacy,
      language,
      this.timezone
    );
  }

  /**
   * 更新时区设置
   *
   * @description 更新用户时区设置
   * @param timezone - 新时区
   * @returns 新的用户偏好设置实例
   */
  public updateTimezone(timezone: string): UserPreferences {
    return new UserPreferences(
      this.theme,
      this.notifications,
      this.privacy,
      this.language,
      timezone
    );
  }

  /**
   * 验证偏好设置
   *
   * @description 验证偏好设置的有效性
   * @protected
   */
  protected override validate(): void {
    this.validateTheme();
    this.validateNotifications();
    this.validatePrivacy();
    this.validateLanguage();
    this.validateTimezone();
  }

  /**
   * 验证主题设置
   *
   * @description 验证主题设置的有效性
   * @private
   */
  private validateTheme(): void {
    if (!Object.values(ThemeType).includes(this.theme)) {
      throw new Error('无效的主题类型');
    }
  }

  /**
   * 验证通知设置
   *
   * @description 验证通知设置的有效性
   * @private
   */
  private validateNotifications(): void {
    if (typeof this.notifications.email !== 'boolean') {
      throw new Error('邮件通知设置必须是布尔值');
    }
    if (typeof this.notifications.push !== 'boolean') {
      throw new Error('推送通知设置必须是布尔值');
    }
    if (typeof this.notifications.sms !== 'boolean') {
      throw new Error('短信通知设置必须是布尔值');
    }
    if (typeof this.notifications.marketing !== 'boolean') {
      throw new Error('营销通知设置必须是布尔值');
    }
  }

  /**
   * 验证隐私设置
   *
   * @description 验证隐私设置的有效性
   * @private
   */
  private validatePrivacy(): void {
    const validVisibility = ['public', 'private', 'friends'];
    if (!validVisibility.includes(this.privacy.profileVisibility)) {
      throw new Error('无效的个人资料可见性设置');
    }
    if (typeof this.privacy.activityStatus !== 'boolean') {
      throw new Error('活动状态设置必须是布尔值');
    }
    if (typeof this.privacy.dataCollection !== 'boolean') {
      throw new Error('数据收集设置必须是布尔值');
    }
    if (typeof this.privacy.analytics !== 'boolean') {
      throw new Error('分析统计设置必须是布尔值');
    }
  }

  /**
   * 验证语言设置
   *
   * @description 验证语言设置的有效性
   * @private
   */
  private validateLanguage(): void {
    if (!this.language || this.language.trim().length === 0) {
      throw new Error('语言设置不能为空');
    }
    if (this.language.length > 10) {
      throw new Error('语言设置长度不能超过10个字符');
    }
  }

  /**
   * 验证时区设置
   *
   * @description 验证时区设置的有效性
   * @private
   */
  private validateTimezone(): void {
    if (!this.timezone || this.timezone.trim().length === 0) {
      throw new Error('时区设置不能为空');
    }
    if (this.timezone.length > 50) {
      throw new Error('时区设置长度不能超过50个字符');
    }
  }

  /**
   * 转换为JSON
   *
   * @description 将用户偏好设置转换为JSON格式
   * @returns JSON对象
   */
  public override toJSON(): Record<string, unknown> {
    return {
      theme: this.theme,
      notifications: this.notifications,
      privacy: this.privacy,
      language: this.language,
      timezone: this.timezone,
    };
  }
}
