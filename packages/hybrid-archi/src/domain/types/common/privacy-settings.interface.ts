/**
 * 通用隐私设置接口
 *
 * @description 用户隐私设置的数据结构
 * @since 1.0.0
 */

/**
 * 隐私设置接口
 *
 * @description 用户隐私偏好的数据结构
 */
export interface PrivacySettings {
  /**
   * 个人资料可见性
   *
   * @description 个人资料的可见性设置
   */
  profileVisibility: 'public' | 'private' | 'friends';

  /**
   * 活动状态
   *
   * @description 是否显示在线状态
   */
  activityStatus: boolean;

  /**
   * 数据收集
   *
   * @description 是否允许数据收集
   */
  dataCollection: boolean;

  /**
   * 分析统计
   *
   * @description 是否允许分析统计
   */
  analytics: boolean;
}

/**
 * 隐私设置工具类
 *
 * @description 提供隐私设置相关的工具方法
 */
export class PrivacySettingsUtils {
  /**
   * 创建默认隐私设置
   *
   * @description 创建默认的隐私设置
   * @returns 默认隐私设置
   */
  public static createDefault(): PrivacySettings {
    return {
      profileVisibility: 'private',
      activityStatus: false,
      dataCollection: true,
      analytics: false,
    };
  }

  /**
   * 验证隐私设置
   *
   * @description 验证隐私设置的有效性
   * @param settings - 隐私设置
   * @returns 是否有效
   */
  public static validate(settings: PrivacySettings): boolean {
    const validVisibility = ['public', 'private', 'friends'].includes(
      settings.profileVisibility
    );
    const validBooleans =
      typeof settings.activityStatus === 'boolean' &&
      typeof settings.dataCollection === 'boolean' &&
      typeof settings.analytics === 'boolean';

    return validVisibility && validBooleans;
  }

  /**
   * 合并隐私设置
   *
   * @description 合并两个隐私设置
   * @param base - 基础设置
   * @param override - 覆盖设置
   * @returns 合并后的设置
   */
  public static merge(
    base: PrivacySettings,
    override: Partial<PrivacySettings>
  ): PrivacySettings {
    return {
      profileVisibility: override.profileVisibility ?? base.profileVisibility,
      activityStatus: override.activityStatus ?? base.activityStatus,
      dataCollection: override.dataCollection ?? base.dataCollection,
      analytics: override.analytics ?? base.analytics,
    };
  }
}
