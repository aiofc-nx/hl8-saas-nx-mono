/**
 * 组织业务规则
 * 
 * @description 定义组织相关的业务规则和约束
 * 
 * @since 1.0.0
 */

import { OrganizationType } from '../organization/value-objects/organization-type.vo';
import { EntityId } from '@hl8/hybrid-archi';

/**
 * 组织业务规则常量
 * 
 * @description 定义组织相关的业务规则常量
 */
export class OrganizationBusinessRules {
  // 约束规则
  static readonly ORGANIZATION_CODE_MUST_BE_UNIQUE = "组织代码在租户内必须唯一";
  static readonly ORGANIZATION_NAME_MUST_NOT_BE_EMPTY = "组织名称不能为空";
  static readonly ORGANIZATION_CODE_FORMAT = "组织代码必须是3-20个字符，字母开头，只能包含字母、数字、连字符、下划线";
  
  // 状态转换规则
  static readonly STATUS_TRANSITION_ACTIVE_TO_INACTIVE = "组织只能从ACTIVE状态转换到INACTIVE状态";
  static readonly STATUS_TRANSITION_INACTIVE_TO_ACTIVE = "组织可以从INACTIVE状态转换到ACTIVE状态";
  
  // 组织类型规则
  static readonly COMMITTEE_ORGANIZATION_TYPE = "委员会类型组织负责特定职能管理";
  static readonly PROJECT_TEAM_ORGANIZATION_TYPE = "项目团队类型组织负责项目管理";
  static readonly QUALITY_GROUP_ORGANIZATION_TYPE = "质量控制小组类型组织负责质量保证";
  static readonly PERFORMANCE_GROUP_ORGANIZATION_TYPE = "绩效管理小组类型组织负责绩效管理";
  
  // 权限规则
  static readonly ORGANIZATION_ADMIN_CAN_MANAGE_ORGANIZATION = "组织管理员可以管理组织";
  static readonly ORGANIZATION_ADMIN_CAN_MANAGE_DEPARTMENTS = "组织管理员可以管理下属部门";
  static readonly ORGANIZATION_ADMIN_CAN_ASSIGN_USERS = "组织管理员可以分配用户到组织";
  
  // 租户关联规则
  static readonly ORGANIZATION_MUST_BELONG_TO_TENANT = "组织必须属于一个租户";
  static readonly ORGANIZATION_CANNOT_BELONG_TO_MULTIPLE_TENANTS = "组织不能属于多个租户";
}

/**
 * 组织规则验证器
 * 
 * @description 验证组织相关的业务规则
 */
export class OrganizationRuleValidator {
  /**
   * 验证组织代码格式
   * 
   * @param code - 组织代码
   * @returns 是否有效
   */
  public static validateOrganizationCode(code: string): boolean {
    // 组织代码格式验证
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
    return codeRegex.test(code);
  }

  /**
   * 验证组织名称
   * 
   * @param name - 组织名称
   * @returns 是否有效
   */
  public static validateOrganizationName(name: string): boolean {
    return !!(name && name.trim().length > 0 && name.length <= 100);
  }

  /**
   * 验证组织描述
   * 
   * @param description - 组织描述
   * @returns 是否有效
   */
  public static validateOrganizationDescription(description: string): boolean {
    return !description || description.length <= 500;
  }

  /**
   * 验证组织类型
   * 
   * @param type - 组织类型
   * @returns 是否有效
   */
  public static validateOrganizationType(type: OrganizationType): boolean {
    return Object.values(OrganizationType).includes(type);
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
   * 验证组织是否可以创建
   * 
   * @param code - 组织代码
   * @param name - 组织名称
   * @param type - 组织类型
   * @param tenantId - 租户ID
   * @returns 验证结果
   */
  public static validateOrganizationCreation(
    code: string,
    name: string,
    type: OrganizationType,
    tenantId: EntityId
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.validateOrganizationCode(code)) {
      errors.push(OrganizationBusinessRules.ORGANIZATION_CODE_FORMAT);
    }

    if (!this.validateOrganizationName(name)) {
      errors.push(OrganizationBusinessRules.ORGANIZATION_NAME_MUST_NOT_BE_EMPTY);
    }

    if (!this.validateOrganizationType(type)) {
      errors.push('无效的组织类型');
    }

    if (!this.validateTenantId(tenantId)) {
      errors.push(OrganizationBusinessRules.ORGANIZATION_MUST_BELONG_TO_TENANT);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
