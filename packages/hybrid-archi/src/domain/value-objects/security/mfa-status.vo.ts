/**
 * 多因素认证状态枚举
 *
 * @description 定义多因素认证的状态
 * 管理MFA的生命周期和状态转换
 *
 * ## 业务规则
 *
 * ### 状态定义
 * - DISABLED: 未启用MFA
 * - PENDING_SETUP: 等待设置MFA
 * - ACTIVE: MFA已激活并正常使用
 * - SUSPENDED: MFA被暂停
 * - EXPIRED: MFA已过期
 * - FAILED: MFA设置失败
 *
 * ### 状态转换规则
 * - DISABLED → PENDING_SETUP → ACTIVE
 * - ACTIVE → SUSPENDED → ACTIVE
 * - PENDING_SETUP → FAILED → PENDING_SETUP
 * - ACTIVE → EXPIRED → PENDING_SETUP
 * - 任何状态 → DISABLED（管理员操作）
 *
 * ### 状态验证规则
 * - 只有ACTIVE状态的MFA可以用于认证
 * - PENDING_SETUP状态需要完成设置流程
 * - SUSPENDED状态需要管理员重新激活
 * - EXPIRED状态需要重新设置
 *
 * @example
 * ```typescript
 * const status = MfaStatus.ACTIVE;
 * const canAuthenticate = MfaStatusUtils.canAuthenticate(status); // true
 * const needsSetup = MfaStatusUtils.needsSetup(status); // false
 * ```
 *
 * @since 1.0.0
 */
export enum MfaStatus {
  /**
   * 未启用状态
   * 
   * @description 用户尚未启用MFA
   * 此时用户只能使用密码进行认证
   */
  DISABLED = 'DISABLED',

  /**
   * 等待设置状态
   * 
   * @description MFA已开始设置但尚未完成
   * 用户需要完成MFA设置流程才能激活
   */
  PENDING_SETUP = 'PENDING_SETUP',

  /**
   * 活跃状态
   * 
   * @description MFA已激活并正常使用
   * 用户登录时需要提供MFA验证码
   */
  ACTIVE = 'ACTIVE',

  /**
   * 暂停状态
   * 
   * @description MFA被暂停使用
   * 通常由管理员操作，需要重新激活
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * 过期状态
   * 
   * @description MFA已过期
   * 需要重新设置MFA才能继续使用
   */
  EXPIRED = 'EXPIRED',

  /**
   * 失败状态
   * 
   * @description MFA设置失败
   * 需要重新开始设置流程
   */
  FAILED = 'FAILED'
}

/**
 * MFA状态工具类
 *
 * @description 提供MFA状态相关的工具方法
 * 包括状态转换、状态验证、状态查询等功能
 *
 * @since 1.0.0
 */
export class MfaStatusUtils {
  /**
   * 状态转换矩阵
   * 
   * @description 定义允许的状态转换
   * 键为当前状态，值为可转换到的状态数组
   */
  private static readonly TRANSITION_MATRIX: Record<MfaStatus, MfaStatus[]> = {
    [MfaStatus.DISABLED]: [MfaStatus.PENDING_SETUP],
    [MfaStatus.PENDING_SETUP]: [MfaStatus.ACTIVE, MfaStatus.FAILED, MfaStatus.DISABLED],
    [MfaStatus.ACTIVE]: [MfaStatus.SUSPENDED, MfaStatus.EXPIRED, MfaStatus.DISABLED],
    [MfaStatus.SUSPENDED]: [MfaStatus.ACTIVE, MfaStatus.DISABLED],
    [MfaStatus.EXPIRED]: [MfaStatus.PENDING_SETUP, MfaStatus.DISABLED],
    [MfaStatus.FAILED]: [MfaStatus.PENDING_SETUP, MfaStatus.DISABLED]
  };

  /**
   * 状态优先级定义
   * 
   * @description 定义状态的优先级，用于状态比较
   * 数值越大，优先级越高
   */
  private static readonly STATUS_PRIORITIES: Record<MfaStatus, number> = {
    [MfaStatus.DISABLED]: 0,
    [MfaStatus.PENDING_SETUP]: 1,
    [MfaStatus.FAILED]: 2,
    [MfaStatus.EXPIRED]: 3,
    [MfaStatus.SUSPENDED]: 4,
    [MfaStatus.ACTIVE]: 5
  };

  /**
   * 检查状态转换是否允许
   *
   * @description 验证从当前状态转换到目标状态是否被允许
   *
   * @param fromStatus - 当前状态
   * @param toStatus - 目标状态
   * @returns 是否允许转换
   *
   * @example
   * ```typescript
   * const canTransition = MfaStatusUtils.canTransition(MfaStatus.DISABLED, MfaStatus.PENDING_SETUP);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static canTransition(fromStatus: MfaStatus, toStatus: MfaStatus): boolean {
    const allowedTransitions = this.TRANSITION_MATRIX[fromStatus];
    return allowedTransitions.includes(toStatus);
  }

  /**
   * 获取可转换的状态列表
   *
   * @description 获取从当前状态可以转换到的状态列表
   *
   * @param currentStatus - 当前状态
   * @returns 可转换的状态列表
   *
   * @example
   * ```typescript
   * const transitions = MfaStatusUtils.getAvailableTransitions(MfaStatus.DISABLED);
   * // [MfaStatus.PENDING_SETUP]
   * ```
   *
   * @since 1.0.0
   */
  public static getAvailableTransitions(currentStatus: MfaStatus): MfaStatus[] {
    return [...this.TRANSITION_MATRIX[currentStatus]];
  }

  /**
   * 检查是否可以用于认证
   *
   * @description 验证指定状态是否可以用于MFA认证
   *
   * @param status - MFA状态
   * @returns 是否可以用于认证
   *
   * @example
   * ```typescript
   * const canAuthenticate = MfaStatusUtils.canAuthenticate(MfaStatus.ACTIVE);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static canAuthenticate(status: MfaStatus): boolean {
    return status === MfaStatus.ACTIVE;
  }

  /**
   * 检查是否需要设置
   *
   * @description 验证指定状态是否需要完成MFA设置
   *
   * @param status - MFA状态
   * @returns 是否需要设置
   *
   * @example
   * ```typescript
   * const needsSetup = MfaStatusUtils.needsSetup(MfaStatus.PENDING_SETUP);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static needsSetup(status: MfaStatus): boolean {
    return [MfaStatus.PENDING_SETUP, MfaStatus.FAILED].includes(status);
  }

  /**
   * 检查是否需要管理员操作
   *
   * @description 验证指定状态是否需要管理员进行特殊操作
   *
   * @param status - MFA状态
   * @returns 是否需要管理员操作
   *
   * @example
   * ```typescript
   * const needsAdmin = MfaStatusUtils.needsAdminAction(MfaStatus.SUSPENDED);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static needsAdminAction(status: MfaStatus): boolean {
    return [MfaStatus.SUSPENDED, MfaStatus.EXPIRED].includes(status);
  }

  /**
   * 检查是否为有效状态
   *
   * @description 验证指定状态是否为有效的MFA状态
   *
   * @param status - MFA状态
   * @returns 是否为有效状态
   *
   * @example
   * ```typescript
   * const isValid = MfaStatusUtils.isValidStatus(MfaStatus.ACTIVE);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isValidStatus(status: MfaStatus): boolean {
    return Object.values(MfaStatus).includes(status);
  }

  /**
   * 检查是否为终态
   *
   * @description 验证指定状态是否为终态（不可再转换）
   *
   * @param status - MFA状态
   * @returns 是否为终态
   *
   * @example
   * ```typescript
   * const isTerminal = MfaStatusUtils.isTerminalStatus(MfaStatus.DISABLED);
   * // false
   * ```
   *
   * @since 1.0.0
   */
  public static isTerminalStatus(status: MfaStatus): boolean {
    return this.getAvailableTransitions(status).length === 0;
  }

  /**
   * 比较状态优先级
   *
   * @description 比较两个状态的优先级高低
   *
   * @param status1 - 第一个状态
   * @param status2 - 第二个状态
   * @returns 比较结果：-1(更低), 0(相等), 1(更高)
   *
   * @example
   * ```typescript
   * const result = MfaStatusUtils.comparePriority(MfaStatus.DISABLED, MfaStatus.ACTIVE);
   * // -1 (更低)
   * ```
   *
   * @since 1.0.0
   */
  public static comparePriority(status1: MfaStatus, status2: MfaStatus): number {
    const priority1 = this.STATUS_PRIORITIES[status1];
    const priority2 = this.STATUS_PRIORITIES[status2];
    
    if (priority1 < priority2) return -1;
    if (priority1 > priority2) return 1;
    return 0;
  }

  /**
   * 获取状态的中文描述
   *
   * @description 返回状态的中文描述，用于界面显示
   *
   * @param status - MFA状态
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = MfaStatusUtils.getDescription(MfaStatus.ACTIVE);
   * // "已激活"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(status: MfaStatus): string {
    const descriptions: Record<MfaStatus, string> = {
      [MfaStatus.DISABLED]: '未启用',
      [MfaStatus.PENDING_SETUP]: '等待设置',
      [MfaStatus.ACTIVE]: '已激活',
      [MfaStatus.SUSPENDED]: '已暂停',
      [MfaStatus.EXPIRED]: '已过期',
      [MfaStatus.FAILED]: '设置失败'
    };

    return descriptions[status];
  }

  /**
   * 获取状态的详细说明
   *
   * @description 返回状态的详细说明，包括特点和操作建议
   *
   * @param status - MFA状态
   * @returns 详细说明
   *
   * @example
   * ```typescript
   * const details = MfaStatusUtils.getDetailedDescription(MfaStatus.ACTIVE);
   * // "MFA已激活并正常使用，用户登录时需要提供MFA验证码"
   * ```
   *
   * @since 1.0.0
   */
  public static getDetailedDescription(status: MfaStatus): string {
    const descriptions: Record<MfaStatus, string> = {
      [MfaStatus.DISABLED]: '用户尚未启用MFA，此时用户只能使用密码进行认证。建议用户启用MFA以提高账户安全性。',
      [MfaStatus.PENDING_SETUP]: 'MFA已开始设置但尚未完成，用户需要完成MFA设置流程才能激活。请按照提示完成设置。',
      [MfaStatus.ACTIVE]: 'MFA已激活并正常使用，用户登录时需要提供MFA验证码。这是MFA的最佳使用状态。',
      [MfaStatus.SUSPENDED]: 'MFA被暂停使用，通常由管理员操作。需要管理员重新激活才能继续使用MFA。',
      [MfaStatus.EXPIRED]: 'MFA已过期，需要重新设置MFA才能继续使用。请重新开始MFA设置流程。',
      [MfaStatus.FAILED]: 'MFA设置失败，需要重新开始设置流程。请检查设置过程中的错误信息。'
    };

    return descriptions[status];
  }

  /**
   * 获取状态的操作建议
   *
   * @description 根据状态返回相应的操作建议
   *
   * @param status - MFA状态
   * @returns 操作建议
   *
   * @example
   * ```typescript
   * const suggestion = MfaStatusUtils.getActionSuggestion(MfaStatus.PENDING_SETUP);
   * // "请完成MFA设置流程"
   * ```
   *
   * @since 1.0.0
   */
  public static getActionSuggestion(status: MfaStatus): string {
    const suggestions: Record<MfaStatus, string> = {
      [MfaStatus.DISABLED]: '建议启用MFA以提高账户安全性',
      [MfaStatus.PENDING_SETUP]: '请完成MFA设置流程',
      [MfaStatus.ACTIVE]: 'MFA运行正常，无需操作',
      [MfaStatus.SUSPENDED]: '请联系管理员重新激活MFA',
      [MfaStatus.EXPIRED]: '请重新设置MFA',
      [MfaStatus.FAILED]: '请重新开始MFA设置流程'
    };

    return suggestions[status];
  }

  /**
   * 获取状态的图标名称
   *
   * @description 返回状态对应的图标名称，用于界面显示
   *
   * @param status - MFA状态
   * @returns 图标名称
   *
   * @example
   * ```typescript
   * const icon = MfaStatusUtils.getIconName(MfaStatus.ACTIVE);
   * // "check-circle"
   * ```
   *
   * @since 1.0.0
   */
  public static getIconName(status: MfaStatus): string {
    const icons: Record<MfaStatus, string> = {
      [MfaStatus.DISABLED]: 'x-circle',
      [MfaStatus.PENDING_SETUP]: 'clock',
      [MfaStatus.ACTIVE]: 'check-circle',
      [MfaStatus.SUSPENDED]: 'pause-circle',
      [MfaStatus.EXPIRED]: 'exclamation-triangle',
      [MfaStatus.FAILED]: 'x-circle'
    };

    return icons[status];
  }

  /**
   * 获取状态的颜色主题
   *
   * @description 返回状态对应的颜色主题，用于界面显示
   *
   * @param status - MFA状态
   * @returns 颜色主题
   *
   * @example
   * ```typescript
   * const color = MfaStatusUtils.getColorTheme(MfaStatus.ACTIVE);
   * // "success"
   * ```
   *
   * @since 1.0.0
   */
  public static getColorTheme(status: MfaStatus): 'success' | 'warning' | 'danger' | 'info' | 'secondary' {
    const colors: Record<MfaStatus, 'success' | 'warning' | 'danger' | 'info' | 'secondary'> = {
      [MfaStatus.DISABLED]: 'secondary',
      [MfaStatus.PENDING_SETUP]: 'warning',
      [MfaStatus.ACTIVE]: 'success',
      [MfaStatus.SUSPENDED]: 'warning',
      [MfaStatus.EXPIRED]: 'danger',
      [MfaStatus.FAILED]: 'danger'
    };

    return colors[status];
  }

  /**
   * 获取默认状态
   *
   * @description 返回MFA的默认状态
   *
   * @returns 默认状态
   *
   * @example
   * ```typescript
   * const defaultStatus = MfaStatusUtils.getDefaultStatus();
   * // MfaStatus.DISABLED
   * ```
   *
   * @since 1.0.0
   */
  public static getDefaultStatus(): MfaStatus {
    return MfaStatus.DISABLED;
  }

  /**
   * 获取所有状态
   *
   * @description 返回系统中定义的所有MFA状态
   *
   * @returns 所有状态列表
   *
   * @example
   * ```typescript
   * const allStatuses = MfaStatusUtils.getAllStatuses();
   * ```
   *
   * @since 1.0.0
   */
  public static getAllStatuses(): MfaStatus[] {
    return Object.values(MfaStatus);
  }

  /**
   * 获取有效状态列表
   *
   * @description 返回可以用于认证的状态列表
   *
   * @returns 有效状态列表
   *
   * @example
   * ```typescript
   * const validStatuses = MfaStatusUtils.getValidStatuses();
   * ```
   *
   * @since 1.0.0
   */
  public static getValidStatuses(): MfaStatus[] {
    return this.getAllStatuses().filter(status => this.canAuthenticate(status));
  }

  /**
   * 获取需要操作的状态列表
   *
   * @description 返回需要用户或管理员操作的状态列表
   *
   * @returns 需要操作的状态列表
   *
   * @example
   * ```typescript
   * const actionRequiredStatuses = MfaStatusUtils.getActionRequiredStatuses();
   * ```
   *
   * @since 1.0.0
   */
  public static getActionRequiredStatuses(): MfaStatus[] {
    return this.getAllStatuses().filter(status => 
      this.needsSetup(status) || this.needsAdminAction(status)
    );
  }
}
