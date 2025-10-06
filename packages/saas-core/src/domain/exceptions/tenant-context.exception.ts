/**
 * 租户上下文异常
 *
 * @description 租户上下文相关的异常类
 * 当缺少租户上下文或租户上下文无效时抛出此异常
 *
 * ## 业务规则
 *
 * ### 异常触发条件
 * - 用户未分配到任何租户
 * - 缺少租户上下文信息
 * - 租户上下文验证失败
 * - 跨租户访问权限不足
 *
 * ### 异常处理规则
 * - 异常包含详细的错误信息
 * - 异常包含相关的上下文信息
 * - 异常支持国际化错误消息
 * - 异常包含错误代码用于分类处理
 *
 * @example
 * ```typescript
 * // 检查用户租户上下文
 * if (!user.getTenantId()) {
 *   throw new TenantContextException('用户未分配到任何租户');
 * }
 *
 * // 检查租户上下文有效性
 * if (!isValidTenantContext(tenantContext)) {
 *   throw new TenantContextException('租户上下文无效', { tenantId });
 * }
 * ```
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { SaasDomainException } from './saas-domain-exceptions';

/**
 * 租户上下文异常
 *
 * @description 表示租户上下文相关的错误
 */
export class TenantContextException extends SaasDomainException {
  /**
   * 构造函数
   *
   * @param message - 错误消息
   * @param context - 错误上下文信息
   */
  constructor(
    message: string,
    context?: {
      tenantId?: string;
      userId?: string;
      operation?: string;
      reason?: string;
    }
  ) {
    super(
      'TENANT_CONTEXT_ERROR',
      message,
      '租户上下文错误',
      context
    );
  }

  /**
   * 创建用户未分配租户异常
   *
   * @param userId - 用户ID
   * @returns 异常实例
   */
  static userNotAssignedToTenant(userId: string): TenantContextException {
    return new TenantContextException(
      `用户 ${userId} 未分配到任何租户`,
      {
        userId,
        operation: 'getTenantContext',
        reason: 'user_not_assigned_to_tenant'
      }
    );
  }

  /**
   * 创建缺少租户上下文异常
   *
   * @param operation - 操作名称
   * @returns 异常实例
   */
  static missingTenantContext(operation: string): TenantContextException {
    return new TenantContextException(
      `操作 ${operation} 缺少租户上下文`,
      {
        operation,
        reason: 'missing_tenant_context'
      }
    );
  }

  /**
   * 创建租户上下文无效异常
   *
   * @param tenantId - 租户ID
   * @param reason - 无效原因
   * @returns 异常实例
   */
  static invalidTenantContext(tenantId: string, reason: string): TenantContextException {
    return new TenantContextException(
      `租户 ${tenantId} 上下文无效: ${reason}`,
      {
        tenantId,
        reason: 'invalid_tenant_context'
      }
    );
  }

  /**
   * 创建跨租户访问权限不足异常
   *
   * @param userId - 用户ID
   * @param targetTenantId - 目标租户ID
   * @param userTenantIds - 用户所属租户ID列表
   * @returns 异常实例
   */
  static insufficientCrossTenantAccess(
    userId: string,
    targetTenantId: string,
    userTenantIds: string[]
  ): TenantContextException {
    return new TenantContextException(
      `用户 ${userId} 无权限访问租户 ${targetTenantId}`,
      {
        userId,
        tenantId: targetTenantId,
        operation: 'cross_tenant_access',
        reason: 'insufficient_permission'
      }
    );
  }

  /**
   * 创建租户ID格式无效异常
   *
   * @param tenantId - 租户ID
   * @returns 异常实例
   */
  static invalidTenantIdFormat(tenantId: string): TenantContextException {
    return new TenantContextException(
      `租户ID格式无效: ${tenantId}`,
      {
        tenantId,
        reason: 'invalid_tenant_id_format'
      }
    );
  }

  /**
   * 创建租户不存在异常
   *
   * @param tenantId - 租户ID
   * @returns 异常实例
   */
  static tenantNotFound(tenantId: string): TenantContextException {
    return new TenantContextException(
      `租户不存在: ${tenantId}`,
      {
        tenantId,
        reason: 'tenant_not_found'
      }
    );
  }

  /**
   * 创建租户状态无效异常
   *
   * @param tenantId - 租户ID
   * @param currentStatus - 当前状态
   * @param requiredStatus - 要求的状态
   * @returns 异常实例
   */
  static invalidTenantStatus(
    tenantId: string,
    currentStatus: string,
    requiredStatus: string
  ): TenantContextException {
    return new TenantContextException(
      `租户 ${tenantId} 状态无效，当前状态: ${currentStatus}，要求状态: ${requiredStatus}`,
      {
        tenantId,
        reason: 'invalid_tenant_status'
      }
    );
  }
}
