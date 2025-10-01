/**
 * 基础权限接口
 *
 * 定义业务模块所需的通用权限功能接口。
 * 提供统一的权限契约，不包含具体的权限逻辑实现。
 *
 * @description 通用权限功能组件接口
 * @since 1.0.0
 */

import { EntityId } from '../value-objects/entity-id';

/**
 * 权限作用域枚举
 */
export enum PermissionScope {
  /** 系统级权限 */
  SYSTEM = 'system',
  /** 租户级权限 */
  TENANT = 'tenant',
  /** 组织级权限 */
  ORGANIZATION = 'organization',
  /** 部门级权限 */
  DEPARTMENT = 'department',
  /** 资源级权限 */
  RESOURCE = 'resource',
}

/**
 * 权限类型枚举
 */
export enum PermissionType {
  /** 操作权限 */
  OPERATION = 'operation',
  /** 数据权限 */
  DATA = 'data',
  /** 功能权限 */
  FEATURE = 'feature',
  /** 配置权限 */
  CONFIGURATION = 'configuration',
  /** 管理权限 */
  MANAGEMENT = 'management',
}

/**
 * 基础权限接口
 *
 * 定义业务模块所需的通用权限功能
 */
export interface IBasePermission {
  /**
   * 权限标识符
   */
  readonly id: EntityId;

  /**
   * 权限代码
   */
  readonly code: string;

  /**
   * 权限名称
   */
  readonly name: string;

  /**
   * 权限描述
   */
  readonly description: string;

  /**
   * 权限作用域
   */
  readonly scope: PermissionScope;

  /**
   * 权限类型
   */
  readonly type: PermissionType;

  /**
   * 检查权限是否有效
   *
   * @returns 权限是否有效
   */
  isValid(): boolean;

  /**
   * 检查权限是否匹配
   *
   * @param permissionCode - 权限代码
   * @returns 是否匹配
   */
  matches(permissionCode: string): boolean;

  /**
   * 获取权限元数据
   *
   * @returns 权限元数据
   */
  getMetadata(): Record<string, unknown>;
}

/**
 * 权限管理器接口
 *
 * 定义业务模块所需的通用权限管理功能
 */
export interface IPermissionManager {
  /**
   * 检查用户权限
   *
   * @param userId - 用户ID
   * @param permissionCode - 权限代码
   * @param context - 权限上下文
   * @returns 是否有权限
   */
  hasPermission(
    userId: EntityId,
    permissionCode: string,
    context?: Record<string, unknown>
  ): Promise<boolean>;

  /**
   * 获取用户权限列表
   *
   * @param userId - 用户ID
   * @param context - 权限上下文
   * @returns 权限列表
   */
  getUserPermissions(
    userId: EntityId,
    context?: Record<string, unknown>
  ): Promise<IBasePermission[]>;

  /**
   * 检查权限组合
   *
   * @param userId - 用户ID
   * @param permissionCodes - 权限代码列表
   * @param context - 权限上下文
   * @returns 权限检查结果
   */
  checkPermissions(
    userId: EntityId,
    permissionCodes: string[],
    context?: Record<string, unknown>
  ): Promise<Record<string, boolean>>;
}
