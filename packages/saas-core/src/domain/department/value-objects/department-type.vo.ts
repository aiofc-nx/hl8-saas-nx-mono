/**
 * 部门类型枚举
 *
 * @description 定义部门的不同类型
 * 每种类型对应不同的业务职能和管理范围
 *
 * ## 业务规则
 *
 * ### 部门类型定义
 * - TECHNICAL: 技术部门，负责技术开发和维护
 * - MARKETING: 市场部门，负责市场推广和销售
 * - FINANCE: 财务部门，负责财务管理和控制
 * - HR: 人力资源部门，负责人员管理和培训
 * - OPERATIONS: 运营部门，负责日常运营管理
 * - SALES: 销售部门，负责产品销售和客户关系
 * - SUPPORT: 支持部门，负责客户支持和售后服务
 * - ADMINISTRATION: 行政部门，负责行政事务和后勤
 * - CUSTOM: 定制部门，根据业务需求定制
 *
 * ### 部门特点
 * - 纵向设置，具有明确的层级关系
 * - 上级部门管理下级部门
 * - 具有明确的汇报关系
 * - 负责具体的业务执行
 *
 * @example
 * ```typescript
 * const type = DepartmentType.TECHNICAL;
 * const description = DepartmentTypeUtils.getDescription(type); // "技术部门"
 * const canHaveSubDepartments = DepartmentTypeUtils.canHaveSubDepartments(type); // true
 * ```
 *
 * @since 1.0.0
 */
export enum DepartmentType {
  /**
   * 技术部门
   * 
   * @description 负责技术开发和维护
   * 如研发部、技术部、IT部等
   */
  TECHNICAL = 'TECHNICAL',

  /**
   * 市场部门
   * 
   * @description 负责市场推广和销售
   * 如市场部、销售部、品牌部等
   */
  MARKETING = 'MARKETING',

  /**
   * 财务部门
   * 
   * @description 负责财务管理和控制
   * 如财务部、会计部、审计部等
   */
  FINANCE = 'FINANCE',

  /**
   * 人力资源部门
   * 
   * @description 负责人员管理和培训
   * 如HR部、人事部、培训部等
   */
  HR = 'HR',

  /**
   * 运营部门
   * 
   * @description 负责日常运营管理
   * 如运营部、生产部、供应链部等
   */
  OPERATIONS = 'OPERATIONS',

  /**
   * 销售部门
   * 
   * @description 负责产品销售和客户关系
   * 如销售部、客户部、渠道部等
   */
  SALES = 'SALES',

  /**
   * 支持部门
   * 
   * @description 负责客户支持和售后服务
   * 如客服部、支持部、售后部等
   */
  SUPPORT = 'SUPPORT',

  /**
   * 行政部门
   * 
   * @description 负责行政事务和后勤
   * 如行政部、后勤部、法务部等
   */
  ADMINISTRATION = 'ADMINISTRATION',

  /**
   * 定制部门
   * 
   * @description 根据业务需求定制
   * 适合特殊业务场景的部门类型
   */
  CUSTOM = 'CUSTOM'
}

/**
 * 部门类型工具类
 *
 * @description 提供部门类型相关的工具方法
 * 包括类型描述、权限检查等功能
 *
 * @since 1.0.0
 */
export class DepartmentTypeUtils {
  /**
   * 部门类型描述
   * 
   * @description 定义每种类型的中文描述
   */
  private static readonly TYPE_DESCRIPTIONS: Record<DepartmentType, string> = {
    [DepartmentType.TECHNICAL]: '技术部门',
    [DepartmentType.MARKETING]: '市场部门',
    [DepartmentType.FINANCE]: '财务部门',
    [DepartmentType.HR]: '人力资源部门',
    [DepartmentType.OPERATIONS]: '运营部门',
    [DepartmentType.SALES]: '销售部门',
    [DepartmentType.SUPPORT]: '支持部门',
    [DepartmentType.ADMINISTRATION]: '行政部门',
    [DepartmentType.CUSTOM]: '定制部门'
  };

  /**
   * 部门类型权限
   * 
   * @description 定义每种类型的权限范围
   */
  private static readonly TYPE_PERMISSIONS: Record<DepartmentType, string[]> = {
    [DepartmentType.TECHNICAL]: [
      'manage_technical_projects',
      'manage_technical_resources',
      'approve_technical_decisions',
      'manage_technical_standards'
    ],
    [DepartmentType.MARKETING]: [
      'manage_marketing_campaigns',
      'manage_brand_assets',
      'track_marketing_metrics',
      'manage_customer_relations'
    ],
    [DepartmentType.FINANCE]: [
      'manage_budget',
      'approve_expenses',
      'manage_financial_reports',
      'control_financial_risks'
    ],
    [DepartmentType.HR]: [
      'manage_employees',
      'conduct_training',
      'manage_recruitment',
      'handle_hr_policies'
    ],
    [DepartmentType.OPERATIONS]: [
      'manage_operations',
      'manage_production',
      'manage_supply_chain',
      'track_operational_metrics'
    ],
    [DepartmentType.SALES]: [
      'manage_sales_targets',
      'manage_customer_accounts',
      'track_sales_metrics',
      'manage_sales_team'
    ],
    [DepartmentType.SUPPORT]: [
      'manage_customer_support',
      'handle_customer_issues',
      'manage_support_tickets',
      'track_support_metrics'
    ],
    [DepartmentType.ADMINISTRATION]: [
      'manage_administrative_tasks',
      'manage_facilities',
      'handle_legal_matters',
      'manage_administrative_policies'
    ],
    [DepartmentType.CUSTOM]: [
      'custom_permissions' // 定制权限由业务需求定义
    ]
  };

  /**
   * 获取部门类型的中文描述
   *
   * @description 返回类型的中文描述，用于界面显示
   *
   * @param type - 部门类型
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = DepartmentTypeUtils.getDescription(DepartmentType.TECHNICAL);
   * // "技术部门"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(type: DepartmentType): string {
    return this.TYPE_DESCRIPTIONS[type];
  }

  /**
   * 获取部门类型的权限列表
   *
   * @description 返回指定类型的权限列表
   *
   * @param type - 部门类型
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * const permissions = DepartmentTypeUtils.getPermissions(DepartmentType.TECHNICAL);
   * // ['manage_technical_projects', 'manage_technical_resources', ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getPermissions(type: DepartmentType): string[] {
    return [...this.TYPE_PERMISSIONS[type]];
  }

  /**
   * 检查部门类型是否拥有指定权限
   *
   * @description 验证类型是否包含指定的权限
   *
   * @param type - 部门类型
   * @param permission - 权限名称
   * @returns 是否拥有该权限
   *
   * @example
   * ```typescript
   * const hasPermission = DepartmentTypeUtils.hasPermission(
   *   DepartmentType.TECHNICAL, 
   *   'manage_technical_projects'
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static hasPermission(type: DepartmentType, permission: string): boolean {
    const permissions = this.getPermissions(type);
    return permissions.includes(permission) || permissions.includes('custom_permissions');
  }

  /**
   * 检查部门类型是否可以拥有子部门
   *
   * @description 判断部门类型是否支持子部门结构
   *
   * @param type - 部门类型
   * @returns 是否可以拥有子部门
   *
   * @example
   * ```typescript
   * const canHaveSub = DepartmentTypeUtils.canHaveSubDepartments(DepartmentType.TECHNICAL);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static canHaveSubDepartments(_type: DepartmentType): boolean {
    // 所有部门类型都可以拥有子部门
    return true;
  }

  /**
   * 检查部门类型是否可以管理用户
   *
   * @description 判断部门类型是否具有用户管理权限
   *
   * @param type - 部门类型
   * @returns 是否可以管理用户
   *
   * @example
   * ```typescript
   * const canManage = DepartmentTypeUtils.canManageUsers(DepartmentType.HR);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static canManageUsers(type: DepartmentType): boolean {
    const userManagementTypes = [
      DepartmentType.HR,
      DepartmentType.ADMINISTRATION
    ];
    return userManagementTypes.includes(type);
  }

  /**
   * 检查部门类型是否可以管理预算
   *
   * @description 判断部门类型是否具有预算管理权限
   *
   * @param type - 部门类型
   * @returns 是否可以管理预算
   *
   * @example
   * ```typescript
   * const canManage = DepartmentTypeUtils.canManageBudget(DepartmentType.FINANCE);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static canManageBudget(type: DepartmentType): boolean {
    const budgetManagementTypes = [
      DepartmentType.FINANCE,
      DepartmentType.ADMINISTRATION
    ];
    return budgetManagementTypes.includes(type);
  }

  /**
   * 获取所有部门类型
   *
   * @description 返回所有可用的部门类型
   *
   * @returns 部门类型列表
   *
   * @example
   * ```typescript
   * const types = DepartmentTypeUtils.getAllTypes();
   * // [DepartmentType.TECHNICAL, DepartmentType.MARKETING, ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getAllTypes(): DepartmentType[] {
    return Object.values(DepartmentType);
  }

  /**
   * 检查部门类型是否为业务类型
   *
   * @description 判断部门类型是否具有业务职能
   *
   * @param type - 部门类型
   * @returns 是否为业务类型
   *
   * @example
   * ```typescript
   * const isBusiness = DepartmentTypeUtils.isBusinessType(DepartmentType.SALES);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isBusinessType(type: DepartmentType): boolean {
    const businessTypes = [
      DepartmentType.SALES,
      DepartmentType.MARKETING,
      DepartmentType.SUPPORT
    ];
    return businessTypes.includes(type);
  }

  /**
   * 检查部门类型是否为支持类型
   *
   * @description 判断部门类型是否具有支持职能
   *
   * @param type - 部门类型
   * @returns 是否为支持类型
   *
   * @example
   * ```typescript
   * const isSupport = DepartmentTypeUtils.isSupportType(DepartmentType.HR);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isSupportType(type: DepartmentType): boolean {
    const supportTypes = [
      DepartmentType.HR,
      DepartmentType.FINANCE,
      DepartmentType.ADMINISTRATION
    ];
    return supportTypes.includes(type);
  }
}
