/**
 * 用户业务规则
 * 
 * @description 定义用户相关的业务规则和约束
 * 
 * @since 1.0.0
 */

import { UserStatus } from '@hl8/hybrid-archi';
import { UserRole } from '@hl8/hybrid-archi';
import { TenantId } from '@hl8/hybrid-archi';

/**
 * 用户业务规则常量
 * 
 * @description 定义用户相关的业务规则常量
 */
export class UserBusinessRules {
  // 约束规则
  static readonly EMAIL_MUST_BE_UNIQUE = "用户邮箱在租户内必须唯一";
  static readonly USERNAME_MUST_BE_UNIQUE = "用户名在租户内必须唯一";
  static readonly PASSWORD_MUST_BE_SECURE = "用户密码必须包含大小写字母、数字和特殊字符";
  static readonly PROFILE_MUST_HAVE_NAME = "用户资料必须包含姓名";
  
  // 状态转换规则
  static readonly STATUS_TRANSITION_PENDING_TO_ACTIVE = "用户只能从PENDING状态转换到ACTIVE状态";
  static readonly STATUS_TRANSITION_ACTIVE_TO_INACTIVE = "用户只能从ACTIVE状态转换到INACTIVE状态";
  static readonly STATUS_TRANSITION_ACTIVE_TO_SUSPENDED = "用户只能从ACTIVE状态转换到SUSPENDED状态";
  static readonly STATUS_TRANSITION_SUSPENDED_TO_ACTIVE = "暂停的用户可以重新激活";
  
  // 认证规则
  static readonly ONLY_ACTIVE_USER_CAN_AUTHENTICATE = "只有ACTIVE状态的用户可以认证";
  static readonly ONLY_ACTIVE_USER_CAN_UPDATE_PASSWORD = "只有ACTIVE状态的用户可以更新密码";
  static readonly ONLY_ACTIVE_USER_CAN_UPDATE_PROFILE = "只有ACTIVE状态的用户可以更新资料";
  
  // 权限规则
  static readonly PLATFORM_ADMIN_HAS_ALL_PERMISSIONS = "平台管理员拥有所有权限";
  static readonly TENANT_ADMIN_HAS_TENANT_PERMISSIONS = "租户管理员拥有租户内所有权限";
  static readonly ORGANIZATION_ADMIN_HAS_ORG_PERMISSIONS = "组织管理员拥有组织内所有权限";
  static readonly DEPARTMENT_ADMIN_HAS_DEPT_PERMISSIONS = "部门管理员拥有部门内所有权限";
  static readonly REGULAR_USER_HAS_BASIC_PERMISSIONS = "普通用户只有基础权限";
  
  // 租户关联规则
  static readonly USER_CAN_BELONG_TO_MULTIPLE_TENANTS = "用户可以属于多个租户";
  static readonly USER_REMAINS_PLATFORM_USER_AFTER_LEAVING_TENANT = "用户离开租户后仍然是平台用户";
  static readonly TENANT_USER_HAS_TENANT_SPECIFIC_PERMISSIONS = "租户用户具有租户特定的权限";
}

/**
 * 用户规则验证器
 * 
 * @description 验证用户相关的业务规则
 */
export class UserRuleValidator {
  /**
   * 验证用户状态转换
   * 
   * @param currentStatus 当前状态
   * @param newStatus 新状态
   * @returns true如果转换有效，否则false
   */
  public static validateStatusTransition(currentStatus: UserStatus, newStatus: UserStatus): boolean {
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.DISABLED, UserStatus.REJECTED],
      [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.DISABLED, UserStatus.LOCKED, UserStatus.EXPIRED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
      [UserStatus.DISABLED]: [UserStatus.ACTIVE],
      [UserStatus.LOCKED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
      [UserStatus.EXPIRED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
      [UserStatus.REJECTED]: [UserStatus.PENDING],
      [UserStatus.DELETED]: []
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
  
  /**
   * 验证用户是否可以执行操作
   * 
   * @param userStatus 用户状态
   * @param operation 操作类型
   * @returns true如果允许执行操作，否则false
   */
  public static validateOperationPermission(userStatus: UserStatus, operation: string): boolean {
    const activeOnlyOperations = [
      'authenticate',
      'updatePassword',
      'updateProfile',
      'assignToTenant',
      'updateRole'
    ];
    
    if (activeOnlyOperations.includes(operation)) {
      return userStatus === UserStatus.ACTIVE;
    }
    
    return true;
  }
  
  /**
   * 验证角色权限
   * 
   * @param userRole 用户角色
   * @param requiredRole 所需角色
   * @returns true如果用户具有所需权限，否则false
   */
  public static validateRolePermission(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, UserRole[]> = {
      [UserRole.PLATFORM_ADMIN]: [UserRole.PLATFORM_ADMIN, UserRole.TENANT_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER, UserRole.GUEST_USER],
      [UserRole.TENANT_ADMIN]: [UserRole.TENANT_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER, UserRole.GUEST_USER],
      [UserRole.ORGANIZATION_ADMIN]: [UserRole.ORGANIZATION_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER, UserRole.GUEST_USER],
      [UserRole.DEPARTMENT_ADMIN]: [UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER, UserRole.GUEST_USER],
      [UserRole.REGULAR_USER]: [UserRole.REGULAR_USER, UserRole.GUEST_USER],
      [UserRole.GUEST_USER]: [UserRole.GUEST_USER]
    };
    
    const allowedRoles = roleHierarchy[userRole] || [];
    return allowedRoles.includes(requiredRole);
  }
  
  /**
   * 验证用户是否可以分配到租户
   * 
   * @param userStatus 用户状态
   * @param currentTenantId 当前租户ID
   * @param targetTenantId 目标租户ID
   * @returns true如果允许分配，否则false
   */
  public static validateTenantAssignment(userStatus: UserStatus, currentTenantId: TenantId | undefined, targetTenantId: TenantId): boolean {
    // 只有活跃用户可以分配到租户
    if (userStatus !== UserStatus.ACTIVE) {
      return false;
    }
    
    // 如果用户已经在目标租户中，不允许重复分配
    if (currentTenantId && currentTenantId.equals(targetTenantId)) {
      return false;
    }
    
    return true;
  }
}
