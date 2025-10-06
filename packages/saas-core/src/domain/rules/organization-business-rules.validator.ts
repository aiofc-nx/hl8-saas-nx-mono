/**
 * 组织业务规则验证器
 *
 * @description 统一的组织业务规则验证器
 * 集中管理所有组织相关的业务规则验证逻辑
 *
 * ## 业务规则
 *
 * ### 组织创建规则
 * - 组织名称不能为空
 * - 组织名称长度限制
 * - 组织类型必须有效
 * - 租户ID必须有效
 *
 * ### 组织状态转换规则
 * - 状态转换矩阵验证
 * - 状态转换前置条件检查
 * - 状态转换后置条件检查
 *
 * ### 组织管理规则
 * - 管理员权限验证
 * - 部门管理权限验证
 * - 跨租户操作禁止
 *
 * @example
 * ```typescript
 * const validator = new OrganizationBusinessRulesValidator();
 * 
 * // 验证组织创建
 * const isValid = validator.validateOrganizationCreation(organizationData);
 * 
 * // 验证状态转换
 * const canTransition = validator.validateStatusTransition(
 *   OrganizationStatus.PENDING,
 *   OrganizationStatus.ACTIVE
 * );
 * ```
 *
 * @since 1.0.0
 */

import { IDomainService } from '@hl8/hybrid-archi';
import { EntityId } from '@hl8/hybrid-archi';
import { OrganizationType } from '../organization/value-objects/organization-type.vo';
import { OrganizationStatus } from '@hl8/hybrid-archi';

/**
 * 组织创建数据
 *
 * @description 组织创建时需要的所有数据
 *
 * @since 1.0.0
 */
export interface OrganizationCreationData {
  /** 组织名称 */
  name: string;
  /** 组织类型 */
  type: OrganizationType;
  /** 租户ID */
  tenantId: EntityId;
  /** 管理员用户ID */
  adminId: string;
  /** 组织描述 */
  description?: string;
}

/**
 * 组织更新数据
 *
 * @description 组织更新时需要的所有数据
 *
 * @since 1.0.0
 */
export interface OrganizationUpdateData {
  /** 组织名称 */
  name?: string;
  /** 组织描述 */
  description?: string;
  /** 组织类型 */
  type?: OrganizationType;
  /** 管理员用户ID */
  adminId?: string;
}

/**
 * 组织业务规则验证器
 *
 * @description 统一的组织业务规则验证器
 * 继承自 BaseDomainService，遵循 hybrid-archi 架构模式
 *
 * @since 1.0.0
 */
export class OrganizationBusinessRulesValidator implements IDomainService {
  /**
   * 构造函数
   *
   * @description 创建组织业务规则验证器实例
   *
   * @since 1.0.0
   */
  constructor() {
    // IDomainService 是接口，不需要调用 super()
  }

  /**
   * 验证组织创建
   *
   * @description 验证组织创建的所有业务规则
   *
   * @param data - 组织创建数据
   * @returns 验证结果
   *
   * @example
   * ```typescript
   * const result = validator.validateOrganizationCreation({
   *   name: '技术委员会',
   *   type: OrganizationType.COMMITTEE,
   *   tenantId: tenantId,
   *   adminId: 'admin-123'
   * });
   * ```
   *
   * @since 1.0.0
   */
  public validateOrganizationCreation(data: OrganizationCreationData): ValidationResult {
    const errors: string[] = [];

    // 验证组织名称
    if (!this.validateOrganizationName(data.name)) {
      errors.push('组织名称不能为空且长度必须在1-100个字符之间');
    }

    // 验证组织类型
    if (!this.validateOrganizationType(data.type)) {
      errors.push('组织类型必须有效');
    }

    // 验证租户ID
    if (!this.validateTenantId(data.tenantId)) {
      errors.push('租户ID必须有效');
    }

    // 验证管理员ID
    if (!this.validateAdminId(data.adminId)) {
      errors.push('管理员用户ID不能为空');
    }

    // 验证描述（可选）
    if (data.description && !this.validateDescription(data.description)) {
      errors.push('组织描述长度不能超过500个字符');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证组织更新
   *
   * @description 验证组织更新的所有业务规则
   *
   * @param data - 组织更新数据
   * @returns 验证结果
   *
   * @since 1.0.0
   */
  public validateOrganizationUpdate(data: OrganizationUpdateData): ValidationResult {
    const errors: string[] = [];

    // 验证组织名称（如果提供）
    if (data.name !== undefined && !this.validateOrganizationName(data.name)) {
      errors.push('组织名称不能为空且长度必须在1-100个字符之间');
    }

    // 验证描述（如果提供）
    if (data.description !== undefined && !this.validateDescription(data.description)) {
      errors.push('组织描述长度不能超过500个字符');
    }

    // 验证组织类型（如果提供）
    if (data.type !== undefined && !this.validateOrganizationType(data.type)) {
      errors.push('组织类型必须有效');
    }

    // 验证管理员ID（如果提供）
    if (data.adminId !== undefined && !this.validateAdminId(data.adminId)) {
      errors.push('管理员用户ID不能为空');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 验证状态转换
   *
   * @description 验证组织状态转换是否符合业务规则
   *
   * @param fromStatus - 原状态
   * @param toStatus - 目标状态
   * @returns 是否可以转换
   *
   * @example
   * ```typescript
   * const canTransition = validator.validateStatusTransition(
   *   OrganizationStatus.PENDING,
   *   OrganizationStatus.ACTIVE
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public validateStatusTransition(fromStatus: OrganizationStatus, toStatus: OrganizationStatus): boolean {
    // 相同状态不需要转换
    if (fromStatus === toStatus) {
      return true;
    }

    // 定义状态转换矩阵
    const allowedTransitions: Record<OrganizationStatus, OrganizationStatus[]> = {
      [OrganizationStatus.PENDING]: [
        OrganizationStatus.ACTIVE,
        OrganizationStatus.REJECTED
      ],
      [OrganizationStatus.ACTIVE]: [
        OrganizationStatus.SUSPENDED,
        OrganizationStatus.DISABLED
      ],
      [OrganizationStatus.SUSPENDED]: [
        OrganizationStatus.ACTIVE,
        OrganizationStatus.DISABLED
      ],
      [OrganizationStatus.DISABLED]: [
        OrganizationStatus.ACTIVE
      ],
      [OrganizationStatus.REJECTED]: [
        OrganizationStatus.PENDING
      ],
      [OrganizationStatus.ARCHIVED]: [], // 归档状态不能转换
      [OrganizationStatus.DELETED]: [] // 删除状态不能转换
    };

    const allowedStatuses = allowedTransitions[fromStatus] || [];
    return allowedStatuses.includes(toStatus);
  }

  /**
   * 验证组织名称
   *
   * @description 验证组织名称是否符合业务规则
   *
   * @param name - 组织名称
   * @returns 是否有效
   *
   * @since 1.0.0
   */
  private validateOrganizationName(name: string): boolean {
    if (!name || typeof name !== 'string') {
      return false;
    }

    const trimmedName = name.trim();
    return trimmedName.length >= 1 && trimmedName.length <= 100;
  }

  /**
   * 验证组织类型
   *
   * @description 验证组织类型是否有效
   *
   * @param type - 组织类型
   * @returns 是否有效
   *
   * @since 1.0.0
   */
  private validateOrganizationType(type: OrganizationType): boolean {
    return Object.values(OrganizationType).includes(type);
  }

  /**
   * 验证租户ID
   *
   * @description 验证租户ID是否有效
   *
   * @param tenantId - 租户ID
   * @returns 是否有效
   *
   * @since 1.0.0
   */
  private validateTenantId(tenantId: EntityId): boolean {
    return tenantId !== null && tenantId !== undefined;
  }

  /**
   * 验证管理员ID
   *
   * @description 验证管理员用户ID是否有效
   *
   * @param adminId - 管理员用户ID
   * @returns 是否有效
   *
   * @since 1.0.0
   */
  private validateAdminId(adminId: string): boolean {
    return !!(adminId && typeof adminId === 'string' && adminId.trim().length > 0);
  }

  /**
   * 验证描述
   *
   * @description 验证组织描述是否符合业务规则
   *
   * @param description - 组织描述
   * @returns 是否有效
   *
   * @since 1.0.0
   */
  private validateDescription(description: string): boolean {
    if (!description) {
      return true; // 描述是可选的
    }

    return typeof description === 'string' && description.length <= 500;
  }

  /**
   * 验证组织是否可以管理部门
   *
   * @description 验证组织是否具有管理部门的能力
   *
   * @param organizationType - 组织类型
   * @returns 是否可以管理部门
   *
   * @since 1.0.0
   */
  public canManageDepartments(organizationType: OrganizationType): boolean {
    const managementCapableTypes = [
      OrganizationType.COMMITTEE,
      OrganizationType.PROJECT_TEAM,
      OrganizationType.QUALITY_GROUP,
      OrganizationType.PERFORMANCE_GROUP
    ];

    return managementCapableTypes.includes(organizationType);
  }

  /**
   * 验证组织是否可以管理用户
   *
   * @description 验证组织是否具有管理用户的能力
   *
   * @param organizationType - 组织类型
   * @returns 是否可以管理用户
   *
   * @since 1.0.0
   */
  public canManageUsers(organizationType: OrganizationType): boolean {
    const userManagementCapableTypes = [
      OrganizationType.COMMITTEE,
      OrganizationType.PROJECT_TEAM,
      OrganizationType.QUALITY_GROUP
    ];

    return userManagementCapableTypes.includes(organizationType);
  }

  /**
   * 验证组织是否可以管理预算
   *
   * @description 验证组织是否具有管理预算的能力
   *
   * @param organizationType - 组织类型
   * @returns 是否可以管理预算
   *
   * @since 1.0.0
   */
  public canManageBudget(organizationType: OrganizationType): boolean {
    const budgetManagementCapableTypes = [
      OrganizationType.COMMITTEE,
      OrganizationType.PROJECT_TEAM
    ];

    return budgetManagementCapableTypes.includes(organizationType);
  }

  /**
   * 验证组织权限
   *
   * @description 验证组织是否具有指定权限
   *
   * @param organizationType - 组织类型
   * @param permission - 权限名称
   * @returns 是否具有权限
   *
   * @since 1.0.0
   */
  public hasPermission(organizationType: OrganizationType, permission: string): boolean {
    const typePermissions: Record<OrganizationType, string[]> = {
      [OrganizationType.COMMITTEE]: [
        'manage_committee_members',
        'manage_departments',
        'manage_users',
        'manage_budget',
        'approve_decisions'
      ],
      [OrganizationType.PROJECT_TEAM]: [
        'manage_project_members',
        'manage_departments',
        'manage_users',
        'manage_budget',
        'track_progress'
      ],
      [OrganizationType.QUALITY_GROUP]: [
        'manage_quality_members',
        'manage_departments',
        'manage_users',
        'quality_control',
        'audit_processes'
      ],
      [OrganizationType.PERFORMANCE_GROUP]: [
        'manage_performance_members',
        'manage_departments',
        'performance_evaluation',
        'kpi_tracking'
      ],
      [OrganizationType.FINANCE_GROUP]: [
        'manage_finance_members',
        'manage_departments',
        'manage_users',
        'budget_management',
        'financial_audit'
      ],
      [OrganizationType.LEGAL_GROUP]: [
        'manage_legal_members',
        'manage_departments',
        'manage_users',
        'legal_compliance',
        'contract_review'
      ],
      [OrganizationType.MARKETING_GROUP]: [
        'manage_marketing_members',
        'manage_departments',
        'manage_users',
        'brand_management',
        'campaign_management'
      ],
      [OrganizationType.HR_GROUP]: [
        'manage_hr_members',
        'manage_departments',
        'manage_users',
        'recruitment',
        'training_management'
      ],
      [OrganizationType.CUSTOM]: [
        'manage_custom_members',
        'manage_departments',
        'manage_users',
        'custom_permissions'
      ]
    };

    const permissions = typePermissions[organizationType] || [];
    return permissions.includes(permission);
  }

  /**
   * 获取服务名称
   */
  getServiceName(): string {
    return 'OrganizationBusinessRulesValidator';
  }
}

/**
 * 验证结果
 *
 * @description 业务规则验证的结果
 *
 * @since 1.0.0
 */
export interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: string[];
}
