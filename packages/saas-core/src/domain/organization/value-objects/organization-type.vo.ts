/**
 * 组织类型枚举
 *
 * @description 定义组织的不同类型
 * 每种类型对应不同的管理职责和业务范围
 *
 * ## 业务规则
 *
 * ### 组织类型定义
 * - COMMITTEE: 专业委员会，负责特定领域的决策和管理
 * - PROJECT_TEAM: 项目管理团队，负责项目执行和管理
 * - QUALITY_GROUP: 质量控制小组，负责质量保证和监控
 * - PERFORMANCE_GROUP: 绩效管理小组，负责绩效评估和管理
 * - FINANCE_GROUP: 财务小组，负责财务管理和控制
 * - LEGAL_GROUP: 法务小组，负责法律事务和合规
 * - MARKETING_GROUP: 市场小组，负责市场推广和品牌
 * - HR_GROUP: 人力资源小组，负责人员管理和培训
 * - CUSTOM: 定制组织，根据业务需求定制
 *
 * ### 组织特点
 * - 横向设置，组织之间没有从属关系
 * - 专注于特定职能或业务领域
 * - 可以管理多个部门
 * - 具有相对独立的管理权限
 *
 * @example
 * ```typescript
 * const type = OrganizationType.COMMITTEE;
 * const description = OrganizationTypeUtils.getDescription(type); // "专业委员会"
 * const canManageDepartments = OrganizationTypeUtils.canManageDepartments(type); // true
 * ```
 *
 * @since 1.0.0
 */
export enum OrganizationType {
  /**
   * 专业委员会
   * 
   * @description 负责特定领域的决策和管理
   * 如技术委员会、安全委员会、质量委员会等
   */
  COMMITTEE = 'COMMITTEE',

  /**
   * 项目管理团队
   * 
   * @description 负责项目执行和管理
   * 如产品管理团队、项目管理办公室等
   */
  PROJECT_TEAM = 'PROJECT_TEAM',

  /**
   * 质量控制小组
   * 
   * @description 负责质量保证和监控
   * 如质量保证小组、测试小组等
   */
  QUALITY_GROUP = 'QUALITY_GROUP',

  /**
   * 绩效管理小组
   * 
   * @description 负责绩效评估和管理
   * 如人力资源小组、绩效考核小组等
   */
  PERFORMANCE_GROUP = 'PERFORMANCE_GROUP',

  /**
   * 财务小组
   * 
   * @description 负责财务管理和控制
   * 如财务小组、审计小组等
   */
  FINANCE_GROUP = 'FINANCE_GROUP',

  /**
   * 法务小组
   * 
   * @description 负责法律事务和合规
   * 如法务小组、合规小组等
   */
  LEGAL_GROUP = 'LEGAL_GROUP',

  /**
   * 市场小组
   * 
   * @description 负责市场推广和品牌
   * 如市场小组、品牌小组等
   */
  MARKETING_GROUP = 'MARKETING_GROUP',

  /**
   * 人力资源小组
   * 
   * @description 负责人员管理和培训
   * 如HR小组、培训小组等
   */
  HR_GROUP = 'HR_GROUP',

  /**
   * 定制组织
   * 
   * @description 根据业务需求定制
   * 适合特殊业务场景的组织类型
   */
  CUSTOM = 'CUSTOM'
}

/**
 * 组织类型工具类
 *
 * @description 提供组织类型相关的工具方法
 * 包括类型描述、权限检查等功能
 *
 * @since 1.0.0
 */
export class OrganizationTypeUtils {
  /**
   * 组织类型描述
   * 
   * @description 定义每种类型的中文描述
   */
  private static readonly TYPE_DESCRIPTIONS: Record<OrganizationType, string> = {
    [OrganizationType.COMMITTEE]: '专业委员会',
    [OrganizationType.PROJECT_TEAM]: '项目管理团队',
    [OrganizationType.QUALITY_GROUP]: '质量控制小组',
    [OrganizationType.PERFORMANCE_GROUP]: '绩效管理小组',
    [OrganizationType.FINANCE_GROUP]: '财务小组',
    [OrganizationType.LEGAL_GROUP]: '法务小组',
    [OrganizationType.MARKETING_GROUP]: '市场小组',
    [OrganizationType.HR_GROUP]: '人力资源小组',
    [OrganizationType.CUSTOM]: '定制组织'
  };

  /**
   * 组织类型权限
   * 
   * @description 定义每种类型的权限范围
   */
  private static readonly TYPE_PERMISSIONS: Record<OrganizationType, string[]> = {
    [OrganizationType.COMMITTEE]: [
      'manage_committee_members',
      'make_decisions',
      'approve_proposals',
      'manage_committee_budget'
    ],
    [OrganizationType.PROJECT_TEAM]: [
      'manage_projects',
      'assign_tasks',
      'track_progress',
      'manage_project_resources'
    ],
    [OrganizationType.QUALITY_GROUP]: [
      'manage_quality_standards',
      'conduct_audits',
      'approve_quality_controls',
      'manage_quality_metrics'
    ],
    [OrganizationType.PERFORMANCE_GROUP]: [
      'manage_performance_metrics',
      'conduct_evaluations',
      'manage_rewards',
      'track_performance_data'
    ],
    [OrganizationType.FINANCE_GROUP]: [
      'manage_budget',
      'approve_expenses',
      'manage_financial_reports',
      'control_financial_risks'
    ],
    [OrganizationType.LEGAL_GROUP]: [
      'manage_legal_documents',
      'review_contracts',
      'handle_compliance',
      'manage_legal_risks'
    ],
    [OrganizationType.MARKETING_GROUP]: [
      'manage_marketing_campaigns',
      'manage_brand_assets',
      'track_marketing_metrics',
      'manage_customer_relations'
    ],
    [OrganizationType.HR_GROUP]: [
      'manage_employees',
      'conduct_training',
      'manage_recruitment',
      'handle_hr_policies'
    ],
    [OrganizationType.CUSTOM]: [
      'custom_permissions' // 定制权限由业务需求定义
    ]
  };

  /**
   * 获取组织类型的中文描述
   *
   * @description 返回类型的中文描述，用于界面显示
   *
   * @param type - 组织类型
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = OrganizationTypeUtils.getDescription(OrganizationType.COMMITTEE);
   * // "专业委员会"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(type: OrganizationType): string {
    return this.TYPE_DESCRIPTIONS[type];
  }

  /**
   * 获取组织类型的权限列表
   *
   * @description 返回指定类型的权限列表
   *
   * @param type - 组织类型
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * const permissions = OrganizationTypeUtils.getPermissions(OrganizationType.COMMITTEE);
   * // ['manage_committee_members', 'make_decisions', ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getPermissions(type: OrganizationType): string[] {
    return [...this.TYPE_PERMISSIONS[type]];
  }

  /**
   * 检查组织类型是否拥有指定权限
   *
   * @description 验证类型是否包含指定的权限
   *
   * @param type - 组织类型
   * @param permission - 权限名称
   * @returns 是否拥有该权限
   *
   * @example
   * ```typescript
   * const hasPermission = OrganizationTypeUtils.hasPermission(
   *   OrganizationType.COMMITTEE, 
   *   'make_decisions'
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static hasPermission(type: OrganizationType, permission: string): boolean {
    const permissions = this.getPermissions(type);
    return permissions.includes(permission) || permissions.includes('custom_permissions');
  }

  /**
   * 检查组织类型是否可以管理部门
   *
   * @description 判断组织类型是否具有部门管理权限
   *
   * @param type - 组织类型
   * @returns 是否可以管理部门
   *
   * @example
   * ```typescript
   * const canManage = OrganizationTypeUtils.canManageDepartments(OrganizationType.COMMITTEE);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static canManageDepartments(_type: OrganizationType): boolean {
    // 所有组织类型都可以管理部门
    return true;
  }

  /**
   * 检查组织类型是否可以管理用户
   *
   * @description 判断组织类型是否具有用户管理权限
   *
   * @param type - 组织类型
   * @returns 是否可以管理用户
   *
   * @example
   * ```typescript
   * const canManage = OrganizationTypeUtils.canManageUsers(OrganizationType.HR_GROUP);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static canManageUsers(type: OrganizationType): boolean {
    const userManagementTypes = [
      OrganizationType.HR_GROUP,
      OrganizationType.PERFORMANCE_GROUP,
      OrganizationType.COMMITTEE
    ];
    return userManagementTypes.includes(type);
  }

  /**
   * 检查组织类型是否可以管理预算
   *
   * @description 判断组织类型是否具有预算管理权限
   *
   * @param type - 组织类型
   * @returns 是否可以管理预算
   *
   * @example
   * ```typescript
   * const canManage = OrganizationTypeUtils.canManageBudget(OrganizationType.FINANCE_GROUP);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static canManageBudget(type: OrganizationType): boolean {
    const budgetManagementTypes = [
      OrganizationType.FINANCE_GROUP,
      OrganizationType.COMMITTEE,
      OrganizationType.PROJECT_TEAM
    ];
    return budgetManagementTypes.includes(type);
  }

  /**
   * 获取所有组织类型
   *
   * @description 返回所有可用的组织类型
   *
   * @returns 组织类型列表
   *
   * @example
   * ```typescript
   * const types = OrganizationTypeUtils.getAllTypes();
   * // [OrganizationType.COMMITTEE, OrganizationType.PROJECT_TEAM, ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getAllTypes(): OrganizationType[] {
    return Object.values(OrganizationType);
  }

  /**
   * 检查组织类型是否为管理类型
   *
   * @description 判断组织类型是否具有管理职能
   *
   * @param type - 组织类型
   * @returns 是否为管理类型
   *
   * @example
   * ```typescript
   * const isManagement = OrganizationTypeUtils.isManagementType(OrganizationType.COMMITTEE);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isManagementType(type: OrganizationType): boolean {
    const managementTypes = [
      OrganizationType.COMMITTEE,
      OrganizationType.PERFORMANCE_GROUP,
      OrganizationType.HR_GROUP
    ];
    return managementTypes.includes(type);
  }

  /**
   * 检查组织类型是否为执行类型
   *
   * @description 判断组织类型是否具有执行职能
   *
   * @param type - 组织类型
   * @returns 是否为执行类型
   *
   * @example
   * ```typescript
   * const isExecution = OrganizationTypeUtils.isExecutionType(OrganizationType.PROJECT_TEAM);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isExecutionType(type: OrganizationType): boolean {
    const executionTypes = [
      OrganizationType.PROJECT_TEAM,
      OrganizationType.QUALITY_GROUP,
      OrganizationType.MARKETING_GROUP
    ];
    return executionTypes.includes(type);
  }
}
