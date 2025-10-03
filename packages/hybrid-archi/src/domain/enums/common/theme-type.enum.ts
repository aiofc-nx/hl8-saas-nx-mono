/**
 * 通用主题类型枚举
 *
 * @description 定义系统支持的主题类型
 * @since 1.0.0
 */

/**
 * 主题类型枚举
 *
 * @description 系统主题类型定义
 */
export enum ThemeType {
  /**
   * 浅色主题
   *
   * @description 浅色背景，深色文字
   */
  Light = 'light',

  /**
   * 深色主题
   *
   * @description 深色背景，浅色文字
   */
  Dark = 'dark',

  /**
   * 自动主题
   *
   * @description 根据系统设置自动切换
   */
  Auto = 'auto',
}

/**
 * 主题工具类
 *
 * @description 提供主题相关的工具方法
 */
export class ThemeUtils {
  /**
   * 检查主题类型是否有效
   *
   * @description 检查主题类型是否为有效值
   * @param theme - 主题类型
   * @returns 是否有效
   */
  public static isValid(theme: string): boolean {
    return Object.values(ThemeType).includes(theme as ThemeType);
  }

  /**
   * 获取主题显示名称
   *
   * @description 获取主题类型的中文显示名称
   * @param theme - 主题类型
   * @returns 显示名称
   */
  public static getDisplayName(theme: ThemeType): string {
    const displayNames: Record<ThemeType, string> = {
      [ThemeType.Light]: '浅色主题',
      [ThemeType.Dark]: '深色主题',
      [ThemeType.Auto]: '自动主题',
    };

    return displayNames[theme] || '未知主题';
  }

  /**
   * 获取主题描述
   *
   * @description 获取主题类型的详细描述
   * @param theme - 主题类型
   * @returns 主题描述
   */
  public static getDescription(theme: ThemeType): string {
    const descriptions: Record<ThemeType, string> = {
      [ThemeType.Light]: '浅色背景，深色文字，适合白天使用',
      [ThemeType.Dark]: '深色背景，浅色文字，适合夜间使用',
      [ThemeType.Auto]: '根据系统设置自动切换主题',
    };

    return descriptions[theme] || '未知主题';
  }
}
