/**
 * 部门业务规则
 * 
 * @description 定义部门相关的业务规则和约束
 * 
 * @since 1.0.0
 */

import { DepartmentLevel, DepartmentLevelUtils } from '../department/enums/department-level.enum';
import { EntityId } from '@hl8/hybrid-archi';

/**
 * 部门业务规则常量
 * 
 * @description 定义部门相关的业务规则常量
 */
export class DepartmentBusinessRules {
  // 约束规则
  static readonly DEPARTMENT_CODE_MUST_BE_UNIQUE = "部门代码在组织内必须唯一";
  static readonly DEPARTMENT_NAME_MUST_NOT_BE_EMPTY = "部门名称不能为空";
  static readonly DEPARTMENT_CODE_FORMAT = "部门代码必须是3-20个字符，字母开头，只能包含字母、数字、连字符、下划线";
  
  // 状态转换规则
  static readonly STATUS_TRANSITION_ACTIVE_TO_INACTIVE = "部门只能从ACTIVE状态转换到INACTIVE状态";
  static readonly STATUS_TRANSITION_INACTIVE_TO_ACTIVE = "部门可以从INACTIVE状态转换到ACTIVE状态";
  
  // 层级规则
  static readonly DEPARTMENT_LEVEL_HIERARCHY = "部门层级必须符合层级关系：LEVEL_1 > LEVEL_2 > LEVEL_3";
  static readonly PARENT_DEPARTMENT_MUST_BE_HIGHER_LEVEL = "父部门层级必须高于子部门";
  static readonly MAX_DEPARTMENT_LEVEL = "部门层级不能超过3级";
  
  // 权限规则
  static readonly DEPARTMENT_ADMIN_CAN_MANAGE_DEPARTMENT = "部门管理员可以管理部门";
  static readonly DEPARTMENT_ADMIN_CAN_MANAGE_SUB_DEPARTMENTS = "部门管理员可以管理下属部门";
  static readonly DEPARTMENT_ADMIN_CAN_ASSIGN_USERS = "部门管理员可以分配用户到部门";
  
  // 租户和组织关联规则
  static readonly DEPARTMENT_MUST_BELONG_TO_TENANT = "部门必须属于一个租户";
  static readonly DEPARTMENT_MUST_BELONG_TO_ORGANIZATION = "部门必须属于一个组织";
  static readonly DEPARTMENT_CANNOT_BELONG_TO_MULTIPLE_TENANTS = "部门不能属于多个租户";
  static readonly DEPARTMENT_CANNOT_BELONG_TO_MULTIPLE_ORGANIZATIONS = "部门不能属于多个组织";
  
  // 层级关系规则
  static readonly DEPARTMENT_CANNOT_BE_PARENT_OF_ITSELF = "部门不能是自己的父部门";
  static readonly DEPARTMENT_CANNOT_HAVE_CIRCULAR_HIERARCHY = "部门层级不能形成循环";
  static readonly DEPARTMENT_MUST_HAVE_VALID_PARENT = "子部门必须有有效的父部门";
}

/**
 * 部门规则验证器
 * 
 * @description 验证部门相关的业务规则
 */
export class DepartmentRuleValidator {
  /**
   * 验证部门代码格式
   * 
   * @param code - 部门代码
   * @returns 是否有效
   */
  public static validateDepartmentCode(code: string): boolean {
    // 部门代码格式验证
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
    return codeRegex.test(code);
  }

  /**
   * 验证部门名称
   * 
   * @param name - 部门名称
   * @returns 是否有效
   */
  public static validateDepartmentName(name: string): boolean {
    return !!(name && name.trim().length > 0 && name.length <= 100);
  }

  /**
   * 验证部门描述
   * 
   * @param description - 部门描述
   * @returns 是否有效
   */
  public static validateDepartmentDescription(description: string): boolean {
    return !description || description.length <= 500;
  }

  /**
   * 验证部门层级
   * 
   * @param level - 部门层级
   * @returns 是否有效
   */
  public static validateDepartmentLevel(level: DepartmentLevel): boolean {
    return Object.values(DepartmentLevel).includes(level);
  }

  /**
   * 验证租户ID
   * 
   * @param tenantId - 租户ID
   * @returns 是否有效
   */
  public static validateTenantId(tenantId: EntityId): boolean {
    return tenantId && tenantId.toString().length > 0;
  }

  /**
   * 验证组织ID
   * 
   * @param organizationId - 组织ID
   * @returns 是否有效
   */
  public static validateOrganizationId(organizationId: EntityId): boolean {
    return organizationId && organizationId.toString().length > 0;
  }

  /**
   * 验证父部门层级关系
   * 
   * @param parentLevel - 父部门层级
   * @param childLevel - 子部门层级
   * @returns 是否有效
   */
  public static validateParentChildLevel(parentLevel: DepartmentLevel, childLevel: DepartmentLevel): boolean {
    return DepartmentLevelUtils.validateParentChildLevel(parentLevel, childLevel);
  }

  /**
   * 验证部门是否可以创建
   * 
   * @param code - 部门代码
   * @param name - 部门名称
   * @param level - 部门层级
   * @param tenantId - 租户ID
   * @param organizationId - 组织ID
   * @param parentDepartmentId - 父部门ID（可选）
   * @returns 验证结果
   */
  public static validateDepartmentCreation(
    code: string,
    name: string,
    level: DepartmentLevel,
    tenantId: EntityId,
    organizationId: EntityId,
    parentDepartmentId?: EntityId
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateDepartmentCode(code)) {
      errors.push(DepartmentBusinessRules.DEPARTMENT_CODE_FORMAT);
    }

    if (!this.validateDepartmentName(name)) {
      errors.push(DepartmentBusinessRules.DEPARTMENT_NAME_MUST_NOT_BE_EMPTY);
    }

    if (!this.validateDepartmentLevel(level)) {
      errors.push('无效的部门层级');
    }

    if (!this.validateTenantId(tenantId)) {
      errors.push(DepartmentBusinessRules.DEPARTMENT_MUST_BELONG_TO_TENANT);
    }

    if (!this.validateOrganizationId(organizationId)) {
      errors.push(DepartmentBusinessRules.DEPARTMENT_MUST_BELONG_TO_ORGANIZATION);
    }

    // 验证层级关系
    if (level === DepartmentLevel.LEVEL_1 && parentDepartmentId) {
      errors.push('一级部门不能有父部门');
    }

    if (level !== DepartmentLevel.LEVEL_1 && !parentDepartmentId) {
      errors.push('非总部部门必须有父部门');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
