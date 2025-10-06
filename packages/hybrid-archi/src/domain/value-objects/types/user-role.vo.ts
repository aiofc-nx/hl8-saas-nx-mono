/**
 * 用户角色枚举
 *
 * @description 定义用户在系统中的角色
 * 角色决定了用户的权限范围和可执行的操作
 *
 * ## 业务规则
 *
 * ### 角色层级
 * - PLATFORM_ADMIN: 平台管理员，拥有最高权限
 * - TENANT_ADMIN: 租户管理员，管理租户内所有资源
 * - ORGANIZATION_ADMIN: 组织管理员，管理组织内资源
 * - DEPARTMENT_ADMIN: 部门管理员，管理部门内资源
 * - REGULAR_USER: 普通用户，基础权限
 * - GUEST_USER: 访客用户，只读权限
 *
 * ### 权限继承
 * - 上级角色包含下级角色的所有权限
 * - 跨层级权限需要特殊授权
 * - 兼职用户权限需要合并处理
 *
 * @example
 * ```typescript
 * const role = UserRole.TENANT_ADMIN;
 * const hasPermission = UserRoleUtils.hasPermission(role, 'manage_users'); // true
 * const canManage = UserRoleUtils.canManage(role, UserRole.REGULAR_USER); // true
 * ```
 *
 * @since 1.0.0
 */
export enum UserRole {
  /**
   * 平台管理员
   * 
   * @description 系统最高权限角色
   * 可以管理所有租户、用户和系统配置
   */
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',

  /**
   * 租户管理员
   * 
   * @description 租户内最高权限角色
   * 可以管理租户内的所有用户、组织和部门
   */
  TENANT_ADMIN = 'TENANT_ADMIN',

  /**
   * 组织管理员
   * 
   * @description 组织内管理权限角色
   * 可以管理组织内的用户和部门
   */
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',

  /**
   * 部门管理员
   * 
   * @description 部门内管理权限角色
   * 可以管理部门内的用户
   */
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',

  /**
   * 普通用户
   * 
   * @description 基础权限角色
   * 可以执行基本的业务操作
   */
  REGULAR_USER = 'REGULAR_USER',

  /**
   * 访客用户
   * 
   * @description 只读权限角色
   * 只能查看信息，不能执行修改操作
   */
  GUEST_USER = 'GUEST_USER'
}

/**
 * 用户角色工具类
 *
 * @description 提供用户角色相关的工具方法
 * 包括权限检查、角色管理等功能
 *
 * @since 1.0.0
 */
export class UserRoleUtils {
  /**
   * 角色层级定义
   * 
   * @description 定义角色的层级关系
   * 数值越大，权限越高
   */
  private static readonly ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.PLATFORM_ADMIN]: 100,
    [UserRole.TENANT_ADMIN]: 80,
    [UserRole.ORGANIZATION_ADMIN]: 60,
    [UserRole.DEPARTMENT_ADMIN]: 40,
    [UserRole.REGULAR_USER]: 20,
    [UserRole.GUEST_USER]: 10
  };

  /**
   * 角色权限定义
   * 
   * @description 定义每个角色的权限列表
   */
  private static readonly ROLE_PERMISSIONS: Record<UserRole, string[]> = {
    [UserRole.PLATFORM_ADMIN]: [
      'manage_platform',
      'manage_all_tenants',
      'manage_all_users',
      'manage_system_config',
      'view_system_logs',
      'manage_platform_users'
    ],
    [UserRole.TENANT_ADMIN]: [
      'manage_tenant',
      'manage_tenant_users',
      'manage_tenant_organizations',
      'manage_tenant_departments',
      'view_tenant_logs',
      'manage_tenant_config'
    ],
    [UserRole.ORGANIZATION_ADMIN]: [
      'manage_organization',
      'manage_organization_users',
      'manage_organization_departments',
      'view_organization_logs'
    ],
    [UserRole.DEPARTMENT_ADMIN]: [
      'manage_department',
      'manage_department_users',
      'view_department_logs'
    ],
    [UserRole.REGULAR_USER]: [
      'view_own_profile',
      'update_own_profile',
      'view_assigned_resources',
      'use_basic_features'
    ],
    [UserRole.GUEST_USER]: [
      'view_public_info',
      'view_limited_resources'
    ]
  };

  /**
   * 检查角色是否拥有指定权限
   *
   * @description 验证角色是否包含指定的权限
   *
   * @param role - 用户角色
   * @param permission - 权限名称
   * @returns 是否拥有该权限
   *
   * @example
   * ```typescript
   * const hasPermission = UserRoleUtils.hasPermission(
   *   UserRole.TENANT_ADMIN, 
   *   'manage_tenant_users'
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static hasPermission(role: UserRole, permission: string): boolean {
    const permissions = this.ROLE_PERMISSIONS[role];
    return permissions.includes(permission);
  }

  /**
   * 检查角色是否可以管理另一个角色
   *
   * @description 验证角色是否有权限管理另一个角色
   * 基于角色层级进行判断
   *
   * @param managerRole - 管理者角色
   * @param targetRole - 被管理角色
   * @returns 是否可以管理
   *
   * @example
   * ```typescript
   * const canManage = UserRoleUtils.canManage(
   *   UserRole.TENANT_ADMIN, 
   *   UserRole.REGULAR_USER
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static canManage(managerRole: UserRole, targetRole: UserRole): boolean {
    const managerLevel = this.ROLE_HIERARCHY[managerRole];
    const targetLevel = this.ROLE_HIERARCHY[targetRole];
    return managerLevel > targetLevel;
  }

  /**
   * 获取角色的权限列表
   *
   * @description 返回指定角色的所有权限
   *
   * @param role - 用户角色
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * const permissions = UserRoleUtils.getPermissions(UserRole.TENANT_ADMIN);
   * // ['manage_tenant', 'manage_tenant_users', ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getPermissions(role: UserRole): string[] {
    return [...this.ROLE_PERMISSIONS[role]];
  }

  /**
   * 获取角色的中文描述
   *
   * @description 返回角色的中文描述，用于界面显示
   *
   * @param role - 用户角色
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = UserRoleUtils.getDescription(UserRole.TENANT_ADMIN);
   * // "租户管理员"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(role: UserRole): string {
    const descriptions: Record<UserRole, string> = {
      [UserRole.PLATFORM_ADMIN]: '平台管理员',
      [UserRole.TENANT_ADMIN]: '租户管理员',
      [UserRole.ORGANIZATION_ADMIN]: '组织管理员',
      [UserRole.DEPARTMENT_ADMIN]: '部门管理员',
      [UserRole.REGULAR_USER]: '普通用户',
      [UserRole.GUEST_USER]: '访客用户'
    };

    return descriptions[role];
  }

  /**
   * 获取角色的层级值
   *
   * @description 返回角色的层级数值
   * 数值越大，权限越高
   *
   * @param role - 用户角色
   * @returns 层级值
   *
   * @example
   * ```typescript
   * const level = UserRoleUtils.getLevel(UserRole.TENANT_ADMIN); // 80
   * ```
   *
   * @since 1.0.0
   */
  public static getLevel(role: UserRole): number {
    return this.ROLE_HIERARCHY[role];
  }

  /**
   * 检查角色是否为管理员角色
   *
   * @description 判断角色是否具有管理权限
   *
   * @param role - 用户角色
   * @returns 是否为管理员角色
   *
   * @example
   * ```typescript
   * const isAdmin = UserRoleUtils.isAdmin(UserRole.TENANT_ADMIN); // true
   * const notAdmin = UserRoleUtils.isAdmin(UserRole.REGULAR_USER); // false
   * ```
   *
   * @since 1.0.0
   */
  public static isAdmin(role: UserRole): boolean {
    return this.ROLE_HIERARCHY[role] >= this.ROLE_HIERARCHY[UserRole.DEPARTMENT_ADMIN];
  }

  /**
   * 检查角色是否为平台级角色
   *
   * @description 判断角色是否为平台级别的角色
   *
   * @param role - 用户角色
   * @returns 是否为平台级角色
   *
   * @example
   * ```typescript
   * const isPlatform = UserRoleUtils.isPlatformRole(UserRole.PLATFORM_ADMIN); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isPlatformRole(role: UserRole): boolean {
    return role === UserRole.PLATFORM_ADMIN;
  }

  /**
   * 检查角色是否为租户级角色
   *
   * @description 判断角色是否为租户级别的角色
   *
   * @param role - 用户角色
   * @returns 是否为租户级角色
   *
   * @example
   * ```typescript
   * const isTenant = UserRoleUtils.isTenantRole(UserRole.TENANT_ADMIN); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isTenantRole(role: UserRole): boolean {
    return [UserRole.TENANT_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.DEPARTMENT_ADMIN, UserRole.REGULAR_USER].includes(role);
  }

  /**
   * 获取所有管理员角色
   *
   * @description 返回所有具有管理权限的角色
   *
   * @returns 管理员角色列表
   *
   * @example
   * ```typescript
   * const adminRoles = UserRoleUtils.getAdminRoles();
   * // [UserRole.PLATFORM_ADMIN, UserRole.TENANT_ADMIN, ...]
   * ```
   *
   * @since 1.0.0
   */
  public static getAdminRoles(): UserRole[] {
    return Object.keys(this.ROLE_HIERARCHY)
      .filter(role => this.ROLE_HIERARCHY[role as UserRole] >= this.ROLE_HIERARCHY[UserRole.DEPARTMENT_ADMIN])
      .map(role => role as UserRole);
  }
}
