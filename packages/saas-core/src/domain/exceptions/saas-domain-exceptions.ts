/**
 * SAAS领域异常类
 *
 * @description 定义SAAS平台特定的领域异常
 * 基于hybrid-archi的BaseDomainException，提供统一的异常处理机制
 *
 * ## 异常分类
 *
 * ### 用户相关异常
 * - 用户状态异常：用户状态转换错误
 * - 用户验证异常：用户数据验证失败
 * - 用户权限异常：用户权限不足
 *
 * ### 租户相关异常
 * - 租户状态异常：租户状态转换错误
 * - 租户配置异常：租户配置验证失败
 * - 租户资源异常：租户资源限制相关
 *
 * ### 授权相关异常
 * - 角色异常：角色操作相关错误
 * - 权限异常：权限验证和操作错误
 * - 用户角色异常：用户角色分配相关错误
 *
 * ### 组织架构异常
 * - 组织异常：组织操作相关错误
 * - 部门异常：部门操作相关错误
 * - 层级异常：组织层级操作错误
 *
 * @since 1.0.0
 */

import { 
  BaseDomainException, 
  DomainExceptionType, 
  DomainExceptionSeverity,
  BusinessRuleViolationException,
  DomainValidationException,
  DomainStateException,
  DomainPermissionException
} from '@hl8/hybrid-archi/src/domain/exceptions';

/**
 * 用户相关异常
 */
export namespace UserExceptions {
  /**
   * 用户状态异常
   */
  export class UserStatusException extends DomainStateException {
    constructor(
      message: string,
      currentStatus: string,
      requestedOperation: string,
      userId?: string
    ) {
      super(
        message,
        currentStatus,
        requestedOperation,
        { userId, domain: 'user' }
      );
    }
  }

  /**
   * 用户验证异常
   */
  export class UserValidationException extends DomainValidationException {
    constructor(
      message: string,
      fieldName: string,
      fieldValue: unknown,
      userId?: string
    ) {
      super(
        message,
        fieldName,
        fieldValue,
        { userId, domain: 'user' }
      );
    }
  }

  /**
   * 用户权限异常
   */
  export class UserPermissionException extends DomainPermissionException {
    constructor(
      message: string,
      requiredPermission: string,
      resource: string,
      userId?: string
    ) {
      super(
        message,
        requiredPermission,
        resource,
        { userId, domain: 'user' }
      );
    }
  }

  /**
   * 用户不存在异常
   */
  export class UserNotFoundException extends BaseDomainException {
    constructor(userId: string, context: Record<string, unknown> = {}) {
      super(
        `用户不存在：${userId}`,
        'USER_NOT_FOUND',
        DomainExceptionType.NOT_FOUND,
        { userId, domain: 'user', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 用户已存在异常
   */
  export class UserAlreadyExistsException extends BaseDomainException {
    constructor(identifier: string, context: Record<string, unknown> = {}) {
      super(
        `用户已存在：${identifier}`,
        'USER_ALREADY_EXISTS',
        DomainExceptionType.BUSINESS_RULE,
        { identifier, domain: 'user', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }
}

/**
 * 租户相关异常
 */
export namespace TenantExceptions {
  /**
   * 租户状态异常
   */
  export class TenantStatusException extends DomainStateException {
    constructor(
      message: string,
      currentStatus: string,
      requestedOperation: string,
      tenantId?: string
    ) {
      super(
        message,
        currentStatus,
        requestedOperation,
        { tenantId, domain: 'tenant' }
      );
    }
  }

  /**
   * 租户验证异常
   */
  export class TenantValidationException extends DomainValidationException {
    constructor(
      message: string,
      fieldName: string,
      fieldValue: unknown,
      tenantId?: string
    ) {
      super(
        message,
        fieldName,
        fieldValue,
        { tenantId, domain: 'tenant' }
      );
    }
  }

  /**
   * 租户权限异常
   */
  export class TenantPermissionException extends DomainPermissionException {
    constructor(
      message: string,
      requiredPermission: string,
      resource: string,
      tenantId?: string
    ) {
      super(
        message,
        requiredPermission,
        resource,
        { tenantId, domain: 'tenant' }
      );
    }
  }

  /**
   * 租户不存在异常
   */
  export class TenantNotFoundException extends BaseDomainException {
    constructor(tenantId: string, context: Record<string, unknown> = {}) {
      super(
        `租户不存在：${tenantId}`,
        'TENANT_NOT_FOUND',
        DomainExceptionType.NOT_FOUND,
        { tenantId, domain: 'tenant', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 租户已存在异常
   */
  export class TenantAlreadyExistsException extends BaseDomainException {
    constructor(identifier: string, context: Record<string, unknown> = {}) {
      super(
        `租户已存在：${identifier}`,
        'TENANT_ALREADY_EXISTS',
        DomainExceptionType.BUSINESS_RULE,
        { identifier, domain: 'tenant', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 租户资源限制异常
   */
  export class TenantResourceLimitException extends BusinessRuleViolationException {
    constructor(
      message: string,
      resourceType: string,
      currentUsage: number,
      limit: number,
      tenantId?: string
    ) {
      super(
        message,
        'TENANT_RESOURCE_LIMIT',
        { 
          resourceType, 
          currentUsage, 
          limit, 
          tenantId, 
          domain: 'tenant' 
        }
      );
    }
  }
}

/**
 * 授权相关异常
 */
export namespace AuthorizationExceptions {
  /**
   * 角色状态异常
   */
  export class RoleStatusException extends DomainStateException {
    constructor(
      message: string,
      currentStatus: string,
      requestedOperation: string,
      roleId?: string
    ) {
      super(
        message,
        currentStatus,
        requestedOperation,
        { roleId, domain: 'authorization' }
      );
    }
  }

  /**
   * 角色验证异常
   */
  export class RoleValidationException extends DomainValidationException {
    constructor(
      message: string,
      fieldName: string,
      fieldValue: unknown,
      roleId?: string
    ) {
      super(
        message,
        fieldName,
        fieldValue,
        { roleId, domain: 'authorization' }
      );
    }
  }

  /**
   * 角色权限异常
   */
  export class RolePermissionException extends DomainPermissionException {
    constructor(
      message: string,
      requiredPermission: string,
      resource: string,
      roleId?: string
    ) {
      super(
        message,
        requiredPermission,
        resource,
        { roleId, domain: 'authorization' }
      );
    }
  }

  /**
   * 角色不存在异常
   */
  export class RoleNotFoundException extends BaseDomainException {
    constructor(roleId: string, context: Record<string, unknown> = {}) {
      super(
        `角色不存在：${roleId}`,
        'ROLE_NOT_FOUND',
        DomainExceptionType.NOT_FOUND,
        { roleId, domain: 'authorization', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 角色已存在异常
   */
  export class RoleAlreadyExistsException extends BaseDomainException {
    constructor(identifier: string, context: Record<string, unknown> = {}) {
      super(
        `角色已存在：${identifier}`,
        'ROLE_ALREADY_EXISTS',
        DomainExceptionType.BUSINESS_RULE,
        { identifier, domain: 'authorization', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 权限不存在异常
   */
  export class PermissionNotFoundException extends BaseDomainException {
    constructor(permissionId: string, context: Record<string, unknown> = {}) {
      super(
        `权限不存在：${permissionId}`,
        'PERMISSION_NOT_FOUND',
        DomainExceptionType.NOT_FOUND,
        { permissionId, domain: 'authorization', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 权限已存在异常
   */
  export class PermissionAlreadyExistsException extends BaseDomainException {
    constructor(identifier: string, context: Record<string, unknown> = {}) {
      super(
        `权限已存在：${identifier}`,
        'PERMISSION_ALREADY_EXISTS',
        DomainExceptionType.BUSINESS_RULE,
        { identifier, domain: 'authorization', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 系统角色修改异常
   */
  export class SystemRoleModificationException extends BusinessRuleViolationException {
    constructor(roleId: string, operation: string) {
      super(
        `不能修改系统角色：${roleId}`,
        'SYSTEM_ROLE_MODIFICATION',
        { roleId, operation, domain: 'authorization' }
      );
    }
  }

  /**
   * 系统权限修改异常
   */
  export class SystemPermissionModificationException extends BusinessRuleViolationException {
    constructor(permissionId: string, operation: string) {
      super(
        `不能修改系统权限：${permissionId}`,
        'SYSTEM_PERMISSION_MODIFICATION',
        { permissionId, operation, domain: 'authorization' }
      );
    }
  }

  /**
   * 循环继承异常
   */
  export class CircularInheritanceException extends BusinessRuleViolationException {
    constructor(roleId: string, parentRoleId: string) {
      super(
        `角色继承关系出现循环：${roleId} -> ${parentRoleId}`,
        'CIRCULAR_INHERITANCE',
        { roleId, parentRoleId, domain: 'authorization' }
      );
    }
  }
}

/**
 * 组织架构相关异常
 */
export namespace OrganizationExceptions {
  /**
   * 组织状态异常
   */
  export class OrganizationStatusException extends DomainStateException {
    constructor(
      message: string,
      currentStatus: string,
      requestedOperation: string,
      organizationId?: string
    ) {
      super(
        message,
        currentStatus,
        requestedOperation,
        { organizationId, domain: 'organization' }
      );
    }
  }

  /**
   * 组织验证异常
   */
  export class OrganizationValidationException extends DomainValidationException {
    constructor(
      message: string,
      fieldName: string,
      fieldValue: unknown,
      organizationId?: string
    ) {
      super(
        message,
        fieldName,
        fieldValue,
        { organizationId, domain: 'organization' }
      );
    }
  }

  /**
   * 组织不存在异常
   */
  export class OrganizationNotFoundException extends BaseDomainException {
    constructor(organizationId: string, context: Record<string, unknown> = {}) {
      super(
        `组织不存在：${organizationId}`,
        'ORGANIZATION_NOT_FOUND',
        DomainExceptionType.NOT_FOUND,
        { organizationId, domain: 'organization', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 组织已存在异常
   */
  export class OrganizationAlreadyExistsException extends BaseDomainException {
    constructor(identifier: string, context: Record<string, unknown> = {}) {
      super(
        `组织已存在：${identifier}`,
        'ORGANIZATION_ALREADY_EXISTS',
        DomainExceptionType.BUSINESS_RULE,
        { identifier, domain: 'organization', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }
}

/**
 * 部门相关异常
 */
export namespace DepartmentExceptions {
  /**
   * 部门状态异常
   */
  export class DepartmentStatusException extends DomainStateException {
    constructor(
      message: string,
      currentStatus: string,
      requestedOperation: string,
      departmentId?: string
    ) {
      super(
        message,
        currentStatus,
        requestedOperation,
        { departmentId, domain: 'department' }
      );
    }
  }

  /**
   * 部门验证异常
   */
  export class DepartmentValidationException extends DomainValidationException {
    constructor(
      message: string,
      fieldName: string,
      fieldValue: unknown,
      departmentId?: string
    ) {
      super(
        message,
        fieldName,
        fieldValue,
        { departmentId, domain: 'department' }
      );
    }
  }

  /**
   * 部门不存在异常
   */
  export class DepartmentNotFoundException extends BaseDomainException {
    constructor(departmentId: string, context: Record<string, unknown> = {}) {
      super(
        `部门不存在：${departmentId}`,
        'DEPARTMENT_NOT_FOUND',
        DomainExceptionType.NOT_FOUND,
        { departmentId, domain: 'department', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 部门已存在异常
   */
  export class DepartmentAlreadyExistsException extends BaseDomainException {
    constructor(identifier: string, context: Record<string, unknown> = {}) {
      super(
        `部门已存在：${identifier}`,
        'DEPARTMENT_ALREADY_EXISTS',
        DomainExceptionType.BUSINESS_RULE,
        { identifier, domain: 'department', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }

  /**
   * 部门层级异常
   */
  export class DepartmentHierarchyException extends BusinessRuleViolationException {
    constructor(
      message: string,
      departmentId: string,
      parentId?: string,
      operation?: string
    ) {
      super(
        message,
        'DEPARTMENT_HIERARCHY',
        { departmentId, parentId, operation, domain: 'department' }
      );
    }
  }
}

/**
 * 值对象相关异常
 */
export namespace ValueObjectExceptions {
  /**
   * 值对象验证异常
   */
  export class ValueObjectValidationException extends DomainValidationException {
    constructor(
      message: string,
      valueObjectName: string,
      fieldName: string,
      fieldValue: unknown,
      context: Record<string, unknown> = {}
    ) {
      super(
        message,
        fieldName,
        fieldValue,
        { valueObjectName, domain: 'value_object', ...context }
      );
    }
  }

  /**
   * 无效值对象异常
   */
  export class InvalidValueObjectException extends BaseDomainException {
    constructor(
      valueObjectName: string,
      reason: string,
      context: Record<string, unknown> = {}
    ) {
      super(
        `无效的${valueObjectName}：${reason}`,
        `INVALID_${valueObjectName.toUpperCase()}`,
        DomainExceptionType.VALIDATION,
        { valueObjectName, reason, domain: 'value_object', ...context },
        DomainExceptionSeverity.MEDIUM
      );
    }
  }
}

/**
 * 多租户相关异常
 */
export namespace MultiTenancyExceptions {
  /**
   * 跨租户操作异常
   */
  export class CrossTenantOperationException extends BusinessRuleViolationException {
    constructor(
      operation: string,
      sourceTenantId: string,
      targetTenantId: string
    ) {
      super(
        `跨租户操作不被允许：${operation}`,
        'CROSS_TENANT_OPERATION',
        { 
          operation, 
          sourceTenantId, 
          targetTenantId, 
          domain: 'multi_tenancy' 
        }
      );
    }
  }

  /**
   * 租户上下文异常
   */
  export class TenantContextException extends BaseDomainException {
    constructor(
      message: string,
      context: Record<string, unknown> = {}
    ) {
      super(
        message,
        'TENANT_CONTEXT_ERROR',
        DomainExceptionType.BUSINESS_RULE,
        { domain: 'multi_tenancy', ...context },
        DomainExceptionSeverity.HIGH
      );
    }
  }
}

/**
 * 事件相关异常
 */
export namespace EventExceptions {
  /**
   * 事件流异常
   */
  export class EventStreamException extends BaseDomainException {
    constructor(
      message: string,
      aggregateId: string,
      context: Record<string, unknown> = {}
    ) {
      super(
        message,
        'EVENT_STREAM_ERROR',
        DomainExceptionType.BUSINESS_RULE,
        { aggregateId, domain: 'events', ...context },
        DomainExceptionSeverity.HIGH
      );
    }
  }

  /**
   * 空事件流异常
   */
  export class EmptyEventStreamException extends EventStreamException {
    constructor(aggregateId: string) {
      super(
        `聚合根事件流为空：${aggregateId}`,
        aggregateId,
        { errorType: 'EMPTY_STREAM' }
      );
    }
  }

  /**
   * 无效事件流异常
   */
  export class InvalidEventStreamException extends EventStreamException {
    constructor(aggregateId: string, reason: string) {
      super(
        `无效的事件流：${aggregateId} - ${reason}`,
        aggregateId,
        { errorType: 'INVALID_STREAM', reason }
      );
    }
  }
}
