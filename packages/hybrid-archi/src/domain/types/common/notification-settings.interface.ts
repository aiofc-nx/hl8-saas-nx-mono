/**
 * 通用通知设置接口
 *
 * @description 用户通知设置的数据结构
 * @since 1.0.0
 */

/**
 * 通知设置接口
 *
 * @description 用户通知偏好的数据结构
 */
export interface NotificationSettings {
  /**
   * 邮件通知
   *
   * @description 是否接收邮件通知
   */
  email: boolean;

  /**
   * 推送通知
   *
   * @description 是否接收推送通知
   */
  push: boolean;

  /**
   * 短信通知
   *
   * @description 是否接收短信通知
   */
  sms: boolean;

  /**
   * 营销通知
   *
   * @description 是否接收营销通知
   */
  marketing: boolean;
}

/**
 * 通知设置工具类
 *
 * @description 提供通知设置相关的工具方法
 */
export class NotificationSettingsUtils {
  /**
   * 创建默认通知设置
   *
   * @description 创建默认的通知设置
   * @returns 默认通知设置
   */
  public static createDefault(): NotificationSettings {
    return {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    };
  }

  /**
   * 验证通知设置
   *
   * @description 验证通知设置的有效性
   * @param settings - 通知设置
   * @returns 是否有效
   */
  public static validate(settings: NotificationSettings): boolean {
    return (
      typeof settings.email === 'boolean' &&
      typeof settings.push === 'boolean' &&
      typeof settings.sms === 'boolean' &&
      typeof settings.marketing === 'boolean'
    );
  }

  /**
   * 合并通知设置
   *
   * @description 合并两个通知设置
   * @param base - 基础设置
   * @param override - 覆盖设置
   * @returns 合并后的设置
   */
  public static merge(
    base: NotificationSettings,
    override: Partial<NotificationSettings>
  ): NotificationSettings {
    return {
      email: override.email ?? base.email,
      push: override.push ?? base.push,
      sms: override.sms ?? base.sms,
      marketing: override.marketing ?? base.marketing,
    };
  }
}
