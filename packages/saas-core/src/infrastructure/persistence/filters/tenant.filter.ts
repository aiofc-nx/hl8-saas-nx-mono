/**
 * 租户数据隔离过滤器
 *
 * @description MikroORM 全局过滤器，自动为所有查询注入租户上下文
 *
 * ## 业务规则
 *
 * ### 自动过滤
 * - 所有包含 tenantId 字段的实体自动应用过滤
 * - 查询时自动添加 WHERE tenantId = :currentTenantId
 * - 确保租户间数据完全隔离
 *
 * ### 过滤器控制
 * - 默认启用过滤器
 * - 特殊场景可临时禁用（需要显式声明）
 * - 平台管理员操作可跨租户查询
 *
 * ### 异常处理
 * - 租户上下文缺失时抛出异常
 * - 防止无租户上下文的数据泄露
 *
 * @example
 * ```typescript
 * // 过滤器自动应用
 * const users = await em.find(User, {}); // 自动添加 WHERE tenantId = :currentTenantId
 *
 * // 临时禁用过滤器（需要明确权限）
 * const allUsers = await em.find(User, {}, {
 *   filters: { tenantFilter: false }
 * });
 * ```
 *
 * @module infrastructure/persistence/filters
 * @since 1.0.0
 */

import { Filter, FilterQuery } from '@mikro-orm/core';
import { TenantContextService } from '@hl8/multi-tenancy';

/**
 * 租户过滤器名称
 *
 * @constant
 */
export const TENANT_FILTER_NAME = 'tenantFilter';

/**
 * 租户过滤器定义
 *
 * @description 定义租户过滤器的行为和条件
 *
 * ## 过滤逻辑
 * 1. 检查实体是否包含 tenantId 字段
 * 2. 从租户上下文服务获取当前租户ID
 * 3. 构造过滤条件：{ tenantId: currentTenantId }
 * 4. 如果租户上下文缺失，抛出异常
 *
 * @function createTenantFilter
 * @param {TenantContextService} tenantContextService - 租户上下文服务
 * @returns {Filter} MikroORM 过滤器配置
 */
export function createTenantFilter(
  tenantContextService: TenantContextService,
): Filter {
  return {
    name: TENANT_FILTER_NAME,
    cond: <T extends { tenantId?: unknown }>(args: FilterQuery<T>): FilterQuery<T> => {
      // 获取当前租户ID
      const currentTenantId = tenantContextService.getCurrentTenantId();

      // 验证租户上下文
      if (!currentTenantId) {
        throw new Error(
          '租户上下文缺失：无法执行数据查询。' +
          '请确保请求包含有效的租户信息，或在特殊场景下显式禁用租户过滤器。',
        );
      }

      // 构造过滤条件
      return {
        tenantId: currentTenantId.toString(),
      } as FilterQuery<T>;
    },
    default: true, // 默认启用
    entity: [], // 应用于所有包含 tenantId 字段的实体
  };
}

/**
 * 租户过滤器辅助工具
 *
 * @class TenantFilterUtils
 */
export class TenantFilterUtils {
  /**
   * 检查实体是否应用租户过滤
   *
   * @static
   * @param {any} entity - 实体类或实例
   * @returns {boolean} 是否应用过滤
   */
  public static shouldApplyFilter(entity: any): boolean {
    // 检查实体是否包含 tenantId 字段
    return 'tenantId' in entity;
  }

  /**
   * 构造禁用租户过滤器的查询选项
   *
   * @description 用于特殊场景（如平台管理员操作）
   *
   * @static
   * @returns {object} 查询选项
   *
   * @example
   * ```typescript
   * // 平台管理员查询所有租户的数据
   * const allTenants = await em.find(
   *   Tenant,
   *   {},
   *   TenantFilterUtils.disableFilterOptions()
   * );
   * ```
   */
  public static disableFilterOptions() {
    return {
      filters: {
        [TENANT_FILTER_NAME]: false,
      },
    };
  }

  /**
   * 构造指定租户的查询选项
   *
   * @description 用于跨租户查询（需要适当权限）
   *
   * @static
   * @param {string} tenantId - 目标租户ID
   * @returns {object} 查询条件
   *
   * @example
   * ```typescript
   * // 管理员查询指定租户的数据
   * const users = await em.find(
   *   User,
   *   TenantFilterUtils.forTenant('tenant-123')
   * );
   * ```
   */
  public static forTenant(tenantId: string) {
    return {
      tenantId,
    };
  }

  /**
   * 验证租户上下文是否存在
   *
   * @static
   * @param {TenantContextService} tenantContextService - 租户上下文服务
   * @throws {Error} 当租户上下文缺失时抛出错误
   */
  public static validateTenantContext(
    tenantContextService: TenantContextService,
  ): void {
    const currentTenantId = tenantContextService.getCurrentTenantId();
    if (!currentTenantId) {
      throw new Error(
        '租户上下文缺失：当前操作需要有效的租户上下文。' +
        '请检查认证令牌或请求头中的租户信息。',
      );
    }
  }
}

/**
 * 软删除过滤器定义
 *
 * @description 默认过滤已删除的数据
 *
 * @constant
 */
export const SOFT_DELETE_FILTER_NAME = 'softDeleteFilter';

/**
 * 软删除过滤器
 *
 * @function createSoftDeleteFilter
 * @returns {Filter} MikroORM 过滤器配置
 */
export function createSoftDeleteFilter(): Filter {
  return {
    name: SOFT_DELETE_FILTER_NAME,
    cond: <T extends { deletedAt?: unknown }>(
      args: FilterQuery<T>,
    ): FilterQuery<T> => {
      // 只显示未删除的数据
      return {
        deletedAt: null,
      } as FilterQuery<T>;
    },
    default: true, // 默认启用
    entity: [], // 应用于所有包含 deletedAt 字段的实体
  };
}

