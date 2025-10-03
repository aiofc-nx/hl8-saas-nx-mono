/**
 * 通用用户状态枚举
 *
 * 定义用户账户的各种状态，用于用户生命周期管理。
 *
 * @description 用户状态枚举定义了用户账户在系统中的各种状态。
 * 包括待激活、活跃、禁用等状态，用于用户生命周期管理。
 * 支持状态转换和状态验证。
 *
 * ## 业务规则
 *
 * ### 状态转换规则
 * - Pending -> Active: 用户注册后激活
 * - Active -> Disabled: 管理员禁用用户
 * - Disabled -> Active: 管理员启用用户
 * - 任何状态 -> Deleted: 删除用户
 *
 * ### 权限规则
 * - Pending: 无法登录，需要激活
 * - Active: 正常登录和操作权限
 * - Disabled: 无法登录，需要管理员启用
 * - Deleted: 完全无权限，数据标记删除
 *
 * @example
 * ```typescript
 * // 检查用户状态
 * if (user.status === UserStatus.Active) {
 *   console.log("用户已激活");
 * }
 *
 * // 状态转换
 * user.activate(); // Pending -> Active
 * user.disable();  // Active -> Disabled
 * ```
 *
 * @since 1.0.0
 */

/**
 * 用户状态枚举
 *
 * @description 用户账户状态定义
 */
export enum UserStatus {
  /**
   * 待激活状态
   *
   * @description 用户已创建但未激活，无法登录
   */
  Pending = 'pending',

  /**
   * 活跃状态
   *
   * @description 用户已激活，可以正常登录和操作
   */
  Active = 'active',

  /**
   * 禁用状态
   *
   * @description 用户被管理员禁用，无法登录
   */
  Disabled = 'disabled',

  /**
   * 已删除状态
   *
   * @description 用户已删除，数据标记删除
   */
  Deleted = 'deleted',
}

/**
 * 用户状态工具类
 *
 * @description 提供用户状态相关的工具方法
 */
export class UserStatusUtils {
  /**
   * 检查状态是否有效
   *
   * @description 检查用户状态是否为有效状态
   * @param status - 用户状态
   * @returns 是否有效
   */
  public static isValid(status: string): boolean {
    return Object.values(UserStatus).includes(status as UserStatus);
  }

  /**
   * 检查是否可以登录
   *
   * @description 检查用户状态是否允许登录
   * @param status - 用户状态
   * @returns 是否可以登录
   */
  public static canLogin(status: UserStatus): boolean {
    return status === UserStatus.Active;
  }

  /**
   * 检查是否可以激活
   *
   * @description 检查用户状态是否允许激活
   * @param status - 用户状态
   * @returns 是否可以激活
   */
  public static canActivate(status: UserStatus): boolean {
    return status === UserStatus.Pending;
  }

  /**
   * 检查是否可以禁用
   *
   * @description 检查用户状态是否允许禁用
   * @param status - 用户状态
   * @returns 是否可以禁用
   */
  public static canDisable(status: UserStatus): boolean {
    return status === UserStatus.Active;
  }

  /**
   * 检查是否可以启用
   *
   * @description 检查用户状态是否允许启用
   * @param status - 用户状态
   * @returns 是否可以启用
   */
  public static canEnable(status: UserStatus): boolean {
    return status === UserStatus.Disabled;
  }

  /**
   * 获取状态显示名称
   *
   * @description 获取用户状态的中文显示名称
   * @param status - 用户状态
   * @returns 显示名称
   */
  public static getDisplayName(status: UserStatus): string {
    const displayNames: Record<UserStatus, string> = {
      [UserStatus.Pending]: '待激活',
      [UserStatus.Active]: '活跃',
      [UserStatus.Disabled]: '已禁用',
      [UserStatus.Deleted]: '已删除',
    };

    return displayNames[status] || '未知状态';
  }

  /**
   * 获取状态描述
   *
   * @description 获取用户状态的详细描述
   * @param status - 用户状态
   * @returns 状态描述
   */
  public static getDescription(status: UserStatus): string {
    const descriptions: Record<UserStatus, string> = {
      [UserStatus.Pending]: '用户已创建但未激活，需要激活后才能登录',
      [UserStatus.Active]: '用户已激活，可以正常登录和操作系统',
      [UserStatus.Disabled]: '用户被管理员禁用，无法登录系统',
      [UserStatus.Deleted]: '用户已删除，数据标记删除但未物理删除',
    };

    return descriptions[status] || '未知状态';
  }
}
