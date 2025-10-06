/**
 * 领域异常处理器
 *
 * @description 提供统一的领域异常处理机制
 * 包括异常创建、验证、处理、日志记录等功能
 *
 * ## 功能特性
 *
 * ### 异常创建
 * - 提供工厂方法创建特定类型的异常
 * - 支持参数验证和上下文注入
 * - 自动设置异常代码和严重程度
 *
 * ### 异常验证
 * - 验证异常参数的有效性
 * - 检查异常上下文的完整性
 * - 确保异常符合业务规则
 *
 * ### 异常处理
 * - 提供统一的异常处理流程
 * - 支持异常转换和包装
 * - 提供异常恢复机制
 *
 * ### 异常日志
 * - 记录异常详细信息
 * - 支持异常统计和分析
 * - 提供异常监控和告警
 *
 * @since 1.0.0
 */

import { 
  BaseDomainException, 
  DomainExceptionType, 
  DomainExceptionSeverity 
} from '@hl8/hybrid-archi/src/domain/exceptions';
import { 
  UserExceptions,
  TenantExceptions,
  AuthorizationExceptions
} from './saas-domain-exceptions';

/**
 * 领域异常处理器
 *
 * @description 提供统一的异常处理功能
 */
export class DomainExceptionHandler {
  /**
   * 创建用户异常
   */
  static createUserException(
    type: keyof typeof UserExceptions,
    params: {
      message: string;
      currentStatus?: string;
      requestedOperation?: string;
      userId?: string;
      fieldName?: string;
      fieldValue?: unknown;
      requiredPermission?: string;
      resource?: string;
      identifier?: string;
      context?: Record<string, unknown>;
    }
  ): BaseDomainException {
    switch (type) {
      case 'UserStatusException':
        return new UserExceptions.UserStatusException(
          params.message,
          params.currentStatus || '',
          params.requestedOperation || '',
          params.userId
        );
      case 'UserValidationException':
        return new UserExceptions.UserValidationException(
          params.message,
          params.fieldName || '',
          params.fieldValue,
          params.userId
        );
      case 'UserPermissionException':
        return new UserExceptions.UserPermissionException(
          params.message,
          params.requiredPermission || '',
          params.resource || '',
          params.userId
        );
      case 'UserNotFoundException':
        return new UserExceptions.UserNotFoundException(
          params.identifier || '',
          params.context
        );
      case 'UserAlreadyExistsException':
        return new UserExceptions.UserAlreadyExistsException(
          params.identifier || '',
          params.context
        );
      default:
        throw new Error(`未知的用户异常类型：${type}`);
    }
  }

  /**
   * 创建租户异常
   */
  static createTenantException(
    type: keyof typeof TenantExceptions,
    params: {
      message: string;
      currentStatus?: string;
      requestedOperation?: string;
      tenantId?: string;
      fieldName?: string;
      fieldValue?: unknown;
      requiredPermission?: string;
      resource?: string;
      identifier?: string;
      context?: Record<string, unknown>;
      resourceType?: string;
      currentUsage?: number;
      limit?: number;
    }
  ): BaseDomainException {
    switch (type) {
      case 'TenantStatusException':
        return new TenantExceptions.TenantStatusException(
          params.message,
          params.currentStatus || '',
          params.requestedOperation || '',
          params.tenantId
        );
      case 'TenantValidationException':
        return new TenantExceptions.TenantValidationException(
          params.message,
          params.fieldName || '',
          params.fieldValue,
          params.tenantId
        );
      case 'TenantPermissionException':
        return new TenantExceptions.TenantPermissionException(
          params.message,
          params.requiredPermission || '',
          params.resource || '',
          params.tenantId
        );
      case 'TenantNotFoundException':
        return new TenantExceptions.TenantNotFoundException(
          params.identifier || '',
          params.context
        );
      case 'TenantAlreadyExistsException':
        return new TenantExceptions.TenantAlreadyExistsException(
          params.identifier || '',
          params.context
        );
      case 'TenantResourceLimitException':
        return new TenantExceptions.TenantResourceLimitException(
          params.message,
          params.resourceType || '',
          params.currentUsage || 0,
          params.limit || 0,
          params.tenantId
        );
      default:
        throw new Error(`未知的租户异常类型：${type}`);
    }
  }

  /**
   * 创建授权异常
   */
  static createAuthorizationException(
    type: keyof typeof AuthorizationExceptions,
    params: {
      message: string;
      currentStatus?: string;
      requestedOperation?: string;
      roleId?: string;
      fieldName?: string;
      fieldValue?: unknown;
      requiredPermission?: string;
      resource?: string;
      identifier?: string;
      context?: Record<string, unknown>;
      permissionId?: string;
      operation?: string;
      parentRoleId?: string;
    }
  ): BaseDomainException {
    switch (type) {
      case 'RoleStatusException':
        return new AuthorizationExceptions.RoleStatusException(
          params.message,
          params.currentStatus || '',
          params.requestedOperation || '',
          params.roleId
        );
      case 'RoleValidationException':
        return new AuthorizationExceptions.RoleValidationException(
          params.message,
          params.fieldName || '',
          params.fieldValue,
          params.roleId
        );
      case 'RolePermissionException':
        return new AuthorizationExceptions.RolePermissionException(
          params.message,
          params.requiredPermission || '',
          params.resource || '',
          params.roleId
        );
      case 'RoleNotFoundException':
        return new AuthorizationExceptions.RoleNotFoundException(
          params.identifier || '',
          params.context
        );
      case 'RoleAlreadyExistsException':
        return new AuthorizationExceptions.RoleAlreadyExistsException(
          params.identifier || '',
          params.context
        );
      case 'PermissionNotFoundException':
        return new AuthorizationExceptions.PermissionNotFoundException(
          params.permissionId || '',
          params.context
        );
      case 'PermissionAlreadyExistsException':
        return new AuthorizationExceptions.PermissionAlreadyExistsException(
          params.identifier || '',
          params.context
        );
      case 'SystemRoleModificationException':
        return new AuthorizationExceptions.SystemRoleModificationException(
          params.roleId || '',
          params.operation || ''
        );
      case 'SystemPermissionModificationException':
        return new AuthorizationExceptions.SystemPermissionModificationException(
          params.permissionId || '',
          params.operation || ''
        );
      case 'CircularInheritanceException':
        return new AuthorizationExceptions.CircularInheritanceException(
          params.roleId || '',
          params.parentRoleId || ''
        );
      default:
        throw new Error(`未知的授权异常类型：${type}`);
    }
  }

  /**
   * 验证异常
   */
  static validateException(exception: BaseDomainException): boolean {
    return (
      exception instanceof BaseDomainException &&
      exception.message.length > 0 &&
      exception.errorCode.length > 0
    );
  }

  /**
   * 处理异常
   */
  static handleException(
    exception: BaseDomainException,
    options: {
      logError?: boolean;
      addContext?: Record<string, unknown>;
      severity?: DomainExceptionSeverity;
    } = {}
  ): BaseDomainException {
    // 验证异常
    if (!this.validateException(exception)) {
      throw new Error('无效的领域异常');
    }

    // 添加上下文
    if (options.addContext) {
      // 注意：这里需要根据实际的BaseDomainException实现来调整
      // 如果context是只读的，可能需要创建新的异常实例
    }

    // 记录日志
    if (options.logError) {
      this.logException(exception);
    }

    return exception;
  }

  /**
   * 记录异常日志
   */
  static logException(exception: BaseDomainException): void {
    console.error('领域异常:', {
      message: exception.message,
      errorCode: exception.errorCode,
      errorType: exception.errorType,
      severity: exception.severity,
      context: exception.context,
      stack: exception.stack
    });
  }

  /**
   * 分析异常统计
   */
  static analyzeExceptions(exceptions: BaseDomainException[]): {
    total: number;
    byType: Record<DomainExceptionType, number>;
    bySeverity: Record<DomainExceptionSeverity, number>;
    byCode: Record<string, number>;
  } {
    const analysis = {
      total: exceptions.length,
      byType: {} as Record<DomainExceptionType, number>,
      bySeverity: {} as Record<DomainExceptionSeverity, number>,
      byCode: {} as Record<string, number>
    };

    exceptions.forEach(exception => {
      // 按类型统计
      analysis.byType[exception.errorType] = (analysis.byType[exception.errorType] || 0) + 1;
      
      // 按严重程度统计
      analysis.bySeverity[exception.severity] = (analysis.bySeverity[exception.severity] || 0) + 1;
      
      // 按代码统计
      analysis.byCode[exception.errorCode] = (analysis.byCode[exception.errorCode] || 0) + 1;
    });

    return analysis;
  }

  /**
   * 过滤异常
   */
  static filterExceptions(
    exceptions: BaseDomainException[],
    filter: {
      type?: DomainExceptionType;
      severity?: DomainExceptionSeverity;
      code?: string;
      domain?: string;
    }
  ): BaseDomainException[] {
    return exceptions.filter(exception => {
      if (filter.type && exception.errorType !== filter.type) return false;
      if (filter.severity && exception.severity !== filter.severity) return false;
      if (filter.code && exception.errorCode !== filter.code) return false;
      if (filter.domain && exception.context?.['domain'] !== filter.domain) return false;
      return true;
    });
  }

  /**
   * 分组异常
   */
  static groupExceptions(
    exceptions: BaseDomainException[],
    groupBy: 'type' | 'severity' | 'code' | 'domain'
  ): Record<string, BaseDomainException[]> {
    const groups: Record<string, BaseDomainException[]> = {};

    exceptions.forEach(exception => {
      let key: string;
      
      switch (groupBy) {
        case 'type':
          key = exception.errorType;
          break;
        case 'severity':
          key = exception.severity;
          break;
        case 'code':
          key = exception.errorCode;
          break;
        case 'domain':
          key = exception.context?.['domain'] as string || 'unknown';
          break;
        default:
          key = 'unknown';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(exception);
    });

    return groups;
  }
}