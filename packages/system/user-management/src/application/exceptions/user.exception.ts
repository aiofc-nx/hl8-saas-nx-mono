/**
 * 用户相关异常
 *
 * @description 用户管理相关的具体异常类
 * @since 1.0.0
 */

import { ApplicationException } from '@hl8/hybrid-archi';

/**
 * 用户未找到异常
 *
 * @description 当用户不存在时抛出
 */
export class UserNotFoundException extends ApplicationException {
  constructor(userId: string) {
    super(`用户 ${userId} 不存在`, 'USER_NOT_FOUND', { userId });
  }
}

/**
 * 用户已存在异常
 *
 * @description 当用户已存在时抛出
 */
export class UserAlreadyExistsException extends ApplicationException {
  constructor(identifier: string, type: 'email' | 'username') {
    super(`用户已存在: ${type} ${identifier}`, 'USER_ALREADY_EXISTS', {
      identifier,
      type,
    });
  }
}

/**
 * 用户状态异常
 *
 * @description 当用户状态不允许执行操作时抛出
 */
export class UserStatusException extends ApplicationException {
  constructor(userId: string, currentStatus: string, requiredStatus: string) {
    super(
      `用户 ${userId} 状态异常: 当前状态 ${currentStatus}，需要状态 ${requiredStatus}`,
      'USER_STATUS_ERROR',
      { userId, currentStatus, requiredStatus }
    );
  }
}

/**
 * 用户认证失败异常
 *
 * @description 当用户认证失败时抛出
 */
export class UserAuthenticationException extends ApplicationException {
  constructor(userId: string, reason: string) {
    super(`用户 ${userId} 认证失败: ${reason}`, 'USER_AUTHENTICATION_ERROR', {
      userId,
      reason,
    });
  }
}

/**
 * 用户权限不足异常
 *
 * @description 当用户权限不足时抛出
 */
export class UserPermissionException extends ApplicationException {
  constructor(userId: string, requiredPermission: string) {
    super(
      `用户 ${userId} 权限不足: 需要权限 ${requiredPermission}`,
      'USER_PERMISSION_ERROR',
      { userId, requiredPermission }
    );
  }
}

/**
 * 用户配置文件异常
 *
 * @description 当用户配置文件操作失败时抛出
 */
export class UserProfileException extends ApplicationException {
  constructor(userId: string, operation: string, reason: string) {
    super(
      `用户 ${userId} 配置文件 ${operation} 失败: ${reason}`,
      'USER_PROFILE_ERROR',
      { userId, operation, reason }
    );
  }
}
