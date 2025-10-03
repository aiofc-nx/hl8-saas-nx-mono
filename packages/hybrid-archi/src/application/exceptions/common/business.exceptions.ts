/**
 * 通用业务异常类
 *
 * @description 业务相关的通用异常类
 * @since 1.0.0
 */

import { ApplicationException } from './application.exception';

/**
 * 未授权操作异常
 *
 * @description 当用户无权限执行操作时抛出
 */
export class UnauthorizedOperationException extends ApplicationException {
  constructor(operation: string, userId?: string) {
    super(`用户无权限执行操作: ${operation}`, 'UNAUTHORIZED_OPERATION', {
      operation,
      userId,
    });
  }
}

/**
 * 业务规则违反异常
 *
 * @description 当违反业务规则时抛出
 */
export class BusinessRuleViolationException extends ApplicationException {
  constructor(rule: string, context?: any) {
    super(`业务规则违反: ${rule}`, 'BUSINESS_RULE_VIOLATION', {
      rule,
      context,
    });
  }
}

/**
 * 资源未找到异常
 *
 * @description 当请求的资源不存在时抛出
 */
export class ResourceNotFoundException extends ApplicationException {
  constructor(resourceType: string, resourceId: string) {
    super(`资源未找到: ${resourceType} (${resourceId})`, 'RESOURCE_NOT_FOUND', {
      resourceType,
      resourceId,
    });
  }
}

/**
 * 资源已存在异常
 *
 * @description 当尝试创建已存在的资源时抛出
 */
export class ResourceAlreadyExistsException extends ApplicationException {
  constructor(resourceType: string, resourceId: string) {
    super(
      `资源已存在: ${resourceType} (${resourceId})`,
      'RESOURCE_ALREADY_EXISTS',
      {
        resourceType,
        resourceId,
      }
    );
  }
}

/**
 * 资源状态异常
 *
 * @description 当资源状态不允许执行操作时抛出
 */
export class ResourceStateException extends ApplicationException {
  constructor(
    resourceType: string,
    resourceId: string,
    currentState: string,
    requiredState: string
  ) {
    super(
      `资源状态异常: ${resourceType} (${resourceId}) 当前状态 ${currentState}，需要状态 ${requiredState}`,
      'RESOURCE_STATE_EXCEPTION',
      {
        resourceType,
        resourceId,
        currentState,
        requiredState,
      }
    );
  }
}
