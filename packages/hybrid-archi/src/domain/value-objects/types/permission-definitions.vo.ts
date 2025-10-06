/**
 * 细粒度权限定义
 *
 * @description 定义系统中所有细粒度的权限
 * 基于资源类型和操作类型的权限矩阵设计
 *
 * ## 业务规则
 *
 * ### 权限命名规范
 * - 格式：{action_type}_{resource_type}
 * - 示例：manage_users, read_tenant_data, create_organization
 * - 操作类型：create, read, update, delete, manage, execute, configure
 * - 资源类型：user, tenant, organization, department, role, permission, config
 *
 * ### 权限层级
 * - 平台级权限：适用于整个平台
 * - 租户级权限：适用于特定租户
 * - 组织级权限：适用于特定组织
 * - 部门级权限：适用于特定部门
 * - 个人级权限：适用于个人数据
 *
 * ### 权限继承
 * - 上级权限包含下级权限
 * - 管理权限包含所有操作权限
 * - 跨层级权限需要特殊授权
 *
 * @example
 * ```typescript
 * const permission = PermissionDefinitions.MANAGE_USERS;
 * const hasPermission = user.hasPermission(permission);
 * const canManage = PermissionDefinitionsUtils.canManage(permission);
 * ```
 *
 * @since 1.0.0
 */
export enum PermissionDefinitions {
  // ==================== 平台级权限 ====================
  
  /** 管理平台配置 */
  MANAGE_PLATFORM_CONFIG = 'manage_platform_config',
  
  /** 管理所有租户 */
  MANAGE_ALL_TENANTS = 'manage_all_tenants',
  
  /** 查看平台统计 */
  VIEW_PLATFORM_STATISTICS = 'view_platform_statistics',
  
  /** 管理平台用户 */
  MANAGE_PLATFORM_USERS = 'manage_platform_users',
  
  /** 查看平台日志 */
  VIEW_PLATFORM_LOGS = 'view_platform_logs',
  
  /** 管理平台角色 */
  MANAGE_PLATFORM_ROLES = 'manage_platform_roles',
  
  /** 管理平台权限 */
  MANAGE_PLATFORM_PERMISSIONS = 'manage_platform_permissions',
  
  // ==================== 租户级权限 ====================
  
  /** 管理租户 */
  MANAGE_TENANT = 'manage_tenant',
  
  /** 查看租户信息 */
  VIEW_TENANT_INFO = 'view_tenant_info',
  
  /** 更新租户配置 */
  UPDATE_TENANT_CONFIG = 'update_tenant_config',
  
  /** 管理租户用户 */
  MANAGE_TENANT_USERS = 'manage_tenant_users',
  
  /** 查看租户用户 */
  VIEW_TENANT_USERS = 'view_tenant_users',
  
  /** 邀请租户用户 */
  INVITE_TENANT_USERS = 'invite_tenant_users',
  
  /** 移除租户用户 */
  REMOVE_TENANT_USERS = 'remove_tenant_users',
  
  /** 管理租户组织 */
  MANAGE_TENANT_ORGANIZATIONS = 'manage_tenant_organizations',
  
  /** 查看租户组织 */
  VIEW_TENANT_ORGANIZATIONS = 'view_tenant_organizations',
  
  /** 创建租户组织 */
  CREATE_TENANT_ORGANIZATIONS = 'create_tenant_organizations',
  
  /** 删除租户组织 */
  DELETE_TENANT_ORGANIZATIONS = 'delete_tenant_organizations',
  
  /** 管理租户部门 */
  MANAGE_TENANT_DEPARTMENTS = 'manage_tenant_departments',
  
  /** 查看租户部门 */
  VIEW_TENANT_DEPARTMENTS = 'view_tenant_departments',
  
  /** 创建租户部门 */
  CREATE_TENANT_DEPARTMENTS = 'create_tenant_departments',
  
  /** 删除租户部门 */
  DELETE_TENANT_DEPARTMENTS = 'delete_tenant_departments',
  
  /** 查看租户统计 */
  VIEW_TENANT_STATISTICS = 'view_tenant_statistics',
  
  /** 查看租户日志 */
  VIEW_TENANT_LOGS = 'view_tenant_logs',
  
  /** 管理租户角色 */
  MANAGE_TENANT_ROLES = 'manage_tenant_roles',
  
  /** 分配租户角色 */
  ASSIGN_TENANT_ROLES = 'assign_tenant_roles',
  
  /** 管理租户权限 */
  MANAGE_TENANT_PERMISSIONS = 'manage_tenant_permissions',
  
  // ==================== 组织级权限 ====================
  
  /** 管理组织 */
  MANAGE_ORGANIZATION = 'manage_organization',
  
  /** 查看组织信息 */
  VIEW_ORGANIZATION_INFO = 'view_organization_info',
  
  /** 更新组织信息 */
  UPDATE_ORGANIZATION_INFO = 'update_organization_info',
  
  /** 管理组织用户 */
  MANAGE_ORGANIZATION_USERS = 'manage_organization_users',
  
  /** 查看组织用户 */
  VIEW_ORGANIZATION_USERS = 'view_organization_users',
  
  /** 分配组织用户 */
  ASSIGN_ORGANIZATION_USERS = 'assign_organization_users',
  
  /** 移除组织用户 */
  REMOVE_ORGANIZATION_USERS = 'remove_organization_users',
  
  /** 管理组织部门 */
  MANAGE_ORGANIZATION_DEPARTMENTS = 'manage_organization_departments',
  
  /** 查看组织部门 */
  VIEW_ORGANIZATION_DEPARTMENTS = 'view_organization_departments',
  
  /** 创建组织部门 */
  CREATE_ORGANIZATION_DEPARTMENTS = 'create_organization_departments',
  
  /** 删除组织部门 */
  DELETE_ORGANIZATION_DEPARTMENTS = 'delete_organization_departments',
  
  /** 查看组织统计 */
  VIEW_ORGANIZATION_STATISTICS = 'view_organization_statistics',
  
  /** 查看组织日志 */
  VIEW_ORGANIZATION_LOGS = 'view_organization_logs',
  
  /** 管理组织角色 */
  MANAGE_ORGANIZATION_ROLES = 'manage_organization_roles',
  
  /** 分配组织角色 */
  ASSIGN_ORGANIZATION_ROLES = 'assign_organization_roles',
  
  // ==================== 部门级权限 ====================
  
  /** 管理部门 */
  MANAGE_DEPARTMENT = 'manage_department',
  
  /** 查看部门信息 */
  VIEW_DEPARTMENT_INFO = 'view_department_info',
  
  /** 更新部门信息 */
  UPDATE_DEPARTMENT_INFO = 'update_department_info',
  
  /** 管理部门用户 */
  MANAGE_DEPARTMENT_USERS = 'manage_department_users',
  
  /** 查看部门用户 */
  VIEW_DEPARTMENT_USERS = 'view_department_users',
  
  /** 分配部门用户 */
  ASSIGN_DEPARTMENT_USERS = 'assign_department_users',
  
  /** 移除部门用户 */
  REMOVE_DEPARTMENT_USERS = 'remove_department_users',
  
  /** 查看部门统计 */
  VIEW_DEPARTMENT_STATISTICS = 'view_department_statistics',
  
  /** 查看部门日志 */
  VIEW_DEPARTMENT_LOGS = 'view_department_logs',
  
  /** 管理部门角色 */
  MANAGE_DEPARTMENT_ROLES = 'manage_department_roles',
  
  /** 分配部门角色 */
  ASSIGN_DEPARTMENT_ROLES = 'assign_department_roles',
  
  // ==================== 用户级权限 ====================
  
  /** 管理自己的资料 */
  MANAGE_OWN_PROFILE = 'manage_own_profile',
  
  /** 查看自己的资料 */
  VIEW_OWN_PROFILE = 'view_own_profile',
  
  /** 更新自己的资料 */
  UPDATE_OWN_PROFILE = 'update_own_profile',
  
  /** 修改自己的密码 */
  CHANGE_OWN_PASSWORD = 'change_own_password',
  
  /** 查看自己的权限 */
  VIEW_OWN_PERMISSIONS = 'view_own_permissions',
  
  /** 查看自己的角色 */
  VIEW_OWN_ROLES = 'view_own_roles',
  
  /** 查看自己的租户 */
  VIEW_OWN_TENANTS = 'view_own_tenants',
  
  /** 查看自己的组织 */
  VIEW_OWN_ORGANIZATIONS = 'view_own_organizations',
  
  /** 查看自己的部门 */
  VIEW_OWN_DEPARTMENTS = 'view_own_departments',
  
  // ==================== 系统功能权限 ====================
  
  /** 使用基础功能 */
  USE_BASIC_FEATURES = 'use_basic_features',
  
  /** 使用高级功能 */
  USE_ADVANCED_FEATURES = 'use_advanced_features',
  
  /** 使用API接口 */
  USE_API_INTERFACES = 'use_api_interfaces',
  
  /** 导出数据 */
  EXPORT_DATA = 'export_data',
  
  /** 导入数据 */
  IMPORT_DATA = 'import_data',
  
  /** 备份数据 */
  BACKUP_DATA = 'backup_data',
  
  /** 恢复数据 */
  RESTORE_DATA = 'restore_data',
  
  /** 发送通知 */
  SEND_NOTIFICATIONS = 'send_notifications',
  
  /** 接收通知 */
  RECEIVE_NOTIFICATIONS = 'receive_notifications',
  
  /** 管理集成 */
  MANAGE_INTEGRATIONS = 'manage_integrations',
  
  /** 查看集成 */
  VIEW_INTEGRATIONS = 'view_integrations',
  
  /** 配置集成 */
  CONFIGURE_INTEGRATIONS = 'configure_integrations'
}

/**
 * 权限定义工具类
 *
 * @description 提供权限定义相关的工具方法
 * 包括权限分类、权限验证、权限继承等功能
 *
 * @since 1.0.0
 */
export class PermissionDefinitionsUtils {
  /**
   * 权限分类定义
   * 
   * @description 定义权限的分类和层级
   */
  private static readonly PERMISSION_CATEGORIES: Record<string, PermissionDefinitions[]> = {
    // 平台级权限
    PLATFORM: [
      PermissionDefinitions.MANAGE_PLATFORM_CONFIG,
      PermissionDefinitions.MANAGE_ALL_TENANTS,
      PermissionDefinitions.VIEW_PLATFORM_STATISTICS,
      PermissionDefinitions.MANAGE_PLATFORM_USERS,
      PermissionDefinitions.VIEW_PLATFORM_LOGS,
      PermissionDefinitions.MANAGE_PLATFORM_ROLES,
      PermissionDefinitions.MANAGE_PLATFORM_PERMISSIONS
    ],
    
    // 租户级权限
    TENANT: [
      PermissionDefinitions.MANAGE_TENANT,
      PermissionDefinitions.VIEW_TENANT_INFO,
      PermissionDefinitions.UPDATE_TENANT_CONFIG,
      PermissionDefinitions.MANAGE_TENANT_USERS,
      PermissionDefinitions.VIEW_TENANT_USERS,
      PermissionDefinitions.INVITE_TENANT_USERS,
      PermissionDefinitions.REMOVE_TENANT_USERS,
      PermissionDefinitions.MANAGE_TENANT_ORGANIZATIONS,
      PermissionDefinitions.VIEW_TENANT_ORGANIZATIONS,
      PermissionDefinitions.CREATE_TENANT_ORGANIZATIONS,
      PermissionDefinitions.DELETE_TENANT_ORGANIZATIONS,
      PermissionDefinitions.MANAGE_TENANT_DEPARTMENTS,
      PermissionDefinitions.VIEW_TENANT_DEPARTMENTS,
      PermissionDefinitions.CREATE_TENANT_DEPARTMENTS,
      PermissionDefinitions.DELETE_TENANT_DEPARTMENTS,
      PermissionDefinitions.VIEW_TENANT_STATISTICS,
      PermissionDefinitions.VIEW_TENANT_LOGS,
      PermissionDefinitions.MANAGE_TENANT_ROLES,
      PermissionDefinitions.ASSIGN_TENANT_ROLES,
      PermissionDefinitions.MANAGE_TENANT_PERMISSIONS
    ],
    
    // 组织级权限
    ORGANIZATION: [
      PermissionDefinitions.MANAGE_ORGANIZATION,
      PermissionDefinitions.VIEW_ORGANIZATION_INFO,
      PermissionDefinitions.UPDATE_ORGANIZATION_INFO,
      PermissionDefinitions.MANAGE_ORGANIZATION_USERS,
      PermissionDefinitions.VIEW_ORGANIZATION_USERS,
      PermissionDefinitions.ASSIGN_ORGANIZATION_USERS,
      PermissionDefinitions.REMOVE_ORGANIZATION_USERS,
      PermissionDefinitions.MANAGE_ORGANIZATION_DEPARTMENTS,
      PermissionDefinitions.VIEW_ORGANIZATION_DEPARTMENTS,
      PermissionDefinitions.CREATE_ORGANIZATION_DEPARTMENTS,
      PermissionDefinitions.DELETE_ORGANIZATION_DEPARTMENTS,
      PermissionDefinitions.VIEW_ORGANIZATION_STATISTICS,
      PermissionDefinitions.VIEW_ORGANIZATION_LOGS,
      PermissionDefinitions.MANAGE_ORGANIZATION_ROLES,
      PermissionDefinitions.ASSIGN_ORGANIZATION_ROLES
    ],
    
    // 部门级权限
    DEPARTMENT: [
      PermissionDefinitions.MANAGE_DEPARTMENT,
      PermissionDefinitions.VIEW_DEPARTMENT_INFO,
      PermissionDefinitions.UPDATE_DEPARTMENT_INFO,
      PermissionDefinitions.MANAGE_DEPARTMENT_USERS,
      PermissionDefinitions.VIEW_DEPARTMENT_USERS,
      PermissionDefinitions.ASSIGN_DEPARTMENT_USERS,
      PermissionDefinitions.REMOVE_DEPARTMENT_USERS,
      PermissionDefinitions.VIEW_DEPARTMENT_STATISTICS,
      PermissionDefinitions.VIEW_DEPARTMENT_LOGS,
      PermissionDefinitions.MANAGE_DEPARTMENT_ROLES,
      PermissionDefinitions.ASSIGN_DEPARTMENT_ROLES
    ],
    
    // 个人级权限
    PERSONAL: [
      PermissionDefinitions.MANAGE_OWN_PROFILE,
      PermissionDefinitions.VIEW_OWN_PROFILE,
      PermissionDefinitions.UPDATE_OWN_PROFILE,
      PermissionDefinitions.CHANGE_OWN_PASSWORD,
      PermissionDefinitions.VIEW_OWN_PERMISSIONS,
      PermissionDefinitions.VIEW_OWN_ROLES,
      PermissionDefinitions.VIEW_OWN_TENANTS,
      PermissionDefinitions.VIEW_OWN_ORGANIZATIONS,
      PermissionDefinitions.VIEW_OWN_DEPARTMENTS
    ],
    
    // 系统功能权限
    SYSTEM: [
      PermissionDefinitions.USE_BASIC_FEATURES,
      PermissionDefinitions.USE_ADVANCED_FEATURES,
      PermissionDefinitions.USE_API_INTERFACES,
      PermissionDefinitions.EXPORT_DATA,
      PermissionDefinitions.IMPORT_DATA,
      PermissionDefinitions.BACKUP_DATA,
      PermissionDefinitions.RESTORE_DATA,
      PermissionDefinitions.SEND_NOTIFICATIONS,
      PermissionDefinitions.RECEIVE_NOTIFICATIONS,
      PermissionDefinitions.MANAGE_INTEGRATIONS,
      PermissionDefinitions.VIEW_INTEGRATIONS,
      PermissionDefinitions.CONFIGURE_INTEGRATIONS
    ]
  };

  /**
   * 权限层级定义
   * 
   * @description 定义权限的层级关系
   */
  private static readonly PERMISSION_HIERARCHY: Record<PermissionDefinitions, PermissionDefinitions[]> = {
    // 管理权限包含所有操作权限
    [PermissionDefinitions.MANAGE_TENANT_USERS]: [
      PermissionDefinitions.VIEW_TENANT_USERS,
      PermissionDefinitions.INVITE_TENANT_USERS,
      PermissionDefinitions.REMOVE_TENANT_USERS
    ],
    
    [PermissionDefinitions.MANAGE_TENANT_ORGANIZATIONS]: [
      PermissionDefinitions.VIEW_TENANT_ORGANIZATIONS,
      PermissionDefinitions.CREATE_TENANT_ORGANIZATIONS,
      PermissionDefinitions.DELETE_TENANT_ORGANIZATIONS
    ],
    
    [PermissionDefinitions.MANAGE_TENANT_DEPARTMENTS]: [
      PermissionDefinitions.VIEW_TENANT_DEPARTMENTS,
      PermissionDefinitions.CREATE_TENANT_DEPARTMENTS,
      PermissionDefinitions.DELETE_TENANT_DEPARTMENTS
    ],
    
    [PermissionDefinitions.MANAGE_ORGANIZATION_USERS]: [
      PermissionDefinitions.VIEW_ORGANIZATION_USERS,
      PermissionDefinitions.ASSIGN_ORGANIZATION_USERS,
      PermissionDefinitions.REMOVE_ORGANIZATION_USERS
    ],
    
    [PermissionDefinitions.MANAGE_ORGANIZATION_DEPARTMENTS]: [
      PermissionDefinitions.VIEW_ORGANIZATION_DEPARTMENTS,
      PermissionDefinitions.CREATE_ORGANIZATION_DEPARTMENTS,
      PermissionDefinitions.DELETE_ORGANIZATION_DEPARTMENTS
    ],
    
    [PermissionDefinitions.MANAGE_DEPARTMENT_USERS]: [
      PermissionDefinitions.VIEW_DEPARTMENT_USERS,
      PermissionDefinitions.ASSIGN_DEPARTMENT_USERS,
      PermissionDefinitions.REMOVE_DEPARTMENT_USERS
    ],
    
    [PermissionDefinitions.MANAGE_OWN_PROFILE]: [
      PermissionDefinitions.VIEW_OWN_PROFILE,
      PermissionDefinitions.UPDATE_OWN_PROFILE,
      PermissionDefinitions.CHANGE_OWN_PASSWORD
    ],
    
    // 其他权限没有子权限
    [PermissionDefinitions.MANAGE_PLATFORM_CONFIG]: [],
    [PermissionDefinitions.MANAGE_ALL_TENANTS]: [],
    [PermissionDefinitions.VIEW_PLATFORM_STATISTICS]: [],
    [PermissionDefinitions.MANAGE_PLATFORM_USERS]: [],
    [PermissionDefinitions.VIEW_PLATFORM_LOGS]: [],
    [PermissionDefinitions.MANAGE_PLATFORM_ROLES]: [],
    [PermissionDefinitions.MANAGE_PLATFORM_PERMISSIONS]: [],
    [PermissionDefinitions.MANAGE_TENANT]: [],
    [PermissionDefinitions.VIEW_TENANT_INFO]: [],
    [PermissionDefinitions.UPDATE_TENANT_CONFIG]: [],
    [PermissionDefinitions.VIEW_TENANT_USERS]: [],
    [PermissionDefinitions.INVITE_TENANT_USERS]: [],
    [PermissionDefinitions.REMOVE_TENANT_USERS]: [],
    [PermissionDefinitions.VIEW_TENANT_ORGANIZATIONS]: [],
    [PermissionDefinitions.CREATE_TENANT_ORGANIZATIONS]: [],
    [PermissionDefinitions.DELETE_TENANT_ORGANIZATIONS]: [],
    [PermissionDefinitions.VIEW_TENANT_DEPARTMENTS]: [],
    [PermissionDefinitions.CREATE_TENANT_DEPARTMENTS]: [],
    [PermissionDefinitions.DELETE_TENANT_DEPARTMENTS]: [],
    [PermissionDefinitions.VIEW_TENANT_STATISTICS]: [],
    [PermissionDefinitions.VIEW_TENANT_LOGS]: [],
    [PermissionDefinitions.MANAGE_TENANT_ROLES]: [],
    [PermissionDefinitions.ASSIGN_TENANT_ROLES]: [],
    [PermissionDefinitions.MANAGE_TENANT_PERMISSIONS]: [],
    [PermissionDefinitions.MANAGE_ORGANIZATION]: [],
    [PermissionDefinitions.VIEW_ORGANIZATION_INFO]: [],
    [PermissionDefinitions.UPDATE_ORGANIZATION_INFO]: [],
    [PermissionDefinitions.VIEW_ORGANIZATION_USERS]: [],
    [PermissionDefinitions.ASSIGN_ORGANIZATION_USERS]: [],
    [PermissionDefinitions.REMOVE_ORGANIZATION_USERS]: [],
    [PermissionDefinitions.VIEW_ORGANIZATION_DEPARTMENTS]: [],
    [PermissionDefinitions.CREATE_ORGANIZATION_DEPARTMENTS]: [],
    [PermissionDefinitions.DELETE_ORGANIZATION_DEPARTMENTS]: [],
    [PermissionDefinitions.VIEW_ORGANIZATION_STATISTICS]: [],
    [PermissionDefinitions.VIEW_ORGANIZATION_LOGS]: [],
    [PermissionDefinitions.MANAGE_ORGANIZATION_ROLES]: [],
    [PermissionDefinitions.ASSIGN_ORGANIZATION_ROLES]: [],
    [PermissionDefinitions.MANAGE_DEPARTMENT]: [],
    [PermissionDefinitions.VIEW_DEPARTMENT_INFO]: [],
    [PermissionDefinitions.UPDATE_DEPARTMENT_INFO]: [],
    [PermissionDefinitions.VIEW_DEPARTMENT_USERS]: [],
    [PermissionDefinitions.ASSIGN_DEPARTMENT_USERS]: [],
    [PermissionDefinitions.REMOVE_DEPARTMENT_USERS]: [],
    [PermissionDefinitions.VIEW_DEPARTMENT_STATISTICS]: [],
    [PermissionDefinitions.VIEW_DEPARTMENT_LOGS]: [],
    [PermissionDefinitions.MANAGE_DEPARTMENT_ROLES]: [],
    [PermissionDefinitions.ASSIGN_DEPARTMENT_ROLES]: [],
    [PermissionDefinitions.VIEW_OWN_PROFILE]: [],
    [PermissionDefinitions.UPDATE_OWN_PROFILE]: [],
    [PermissionDefinitions.CHANGE_OWN_PASSWORD]: [],
    [PermissionDefinitions.VIEW_OWN_PERMISSIONS]: [],
    [PermissionDefinitions.VIEW_OWN_ROLES]: [],
    [PermissionDefinitions.VIEW_OWN_TENANTS]: [],
    [PermissionDefinitions.VIEW_OWN_ORGANIZATIONS]: [],
    [PermissionDefinitions.VIEW_OWN_DEPARTMENTS]: [],
    [PermissionDefinitions.USE_BASIC_FEATURES]: [],
    [PermissionDefinitions.USE_ADVANCED_FEATURES]: [],
    [PermissionDefinitions.USE_API_INTERFACES]: [],
    [PermissionDefinitions.EXPORT_DATA]: [],
    [PermissionDefinitions.IMPORT_DATA]: [],
    [PermissionDefinitions.BACKUP_DATA]: [],
    [PermissionDefinitions.RESTORE_DATA]: [],
    [PermissionDefinitions.SEND_NOTIFICATIONS]: [],
    [PermissionDefinitions.RECEIVE_NOTIFICATIONS]: [],
    [PermissionDefinitions.MANAGE_INTEGRATIONS]: [],
    [PermissionDefinitions.VIEW_INTEGRATIONS]: [],
    [PermissionDefinitions.CONFIGURE_INTEGRATIONS]: []
  };

  /**
   * 获取权限分类
   *
   * @description 获取指定权限所属的分类
   *
   * @param permission - 权限定义
   * @returns 权限分类
   *
   * @example
   * ```typescript
   * const category = PermissionDefinitionsUtils.getPermissionCategory(
   *   PermissionDefinitions.MANAGE_TENANT_USERS
   * ); // 'TENANT'
   * ```
   *
   * @since 1.0.0
   */
  public static getPermissionCategory(permission: PermissionDefinitions): string {
    for (const [category, permissions] of Object.entries(this.PERMISSION_CATEGORIES)) {
      if (permissions.includes(permission)) {
        return category;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * 获取分类下的所有权限
   *
   * @description 获取指定分类下的所有权限
   *
   * @param category - 权限分类
   * @returns 权限列表
   *
   * @example
   * ```typescript
   * const permissions = PermissionDefinitionsUtils.getPermissionsByCategory('TENANT');
   * ```
   *
   * @since 1.0.0
   */
  public static getPermissionsByCategory(category: string): PermissionDefinitions[] {
    return [...(this.PERMISSION_CATEGORIES[category] || [])];
  }

  /**
   * 获取权限的子权限
   *
   * @description 获取指定权限的所有子权限
   *
   * @param permission - 权限定义
   * @returns 子权限列表
   *
   * @example
   * ```typescript
   * const subPermissions = PermissionDefinitionsUtils.getSubPermissions(
   *   PermissionDefinitions.MANAGE_TENANT_USERS
   * );
   * ```
   *
   * @since 1.0.0
   */
  public static getSubPermissions(permission: PermissionDefinitions): PermissionDefinitions[] {
    return [...(this.PERMISSION_HIERARCHY[permission] || [])];
  }

  /**
   * 检查权限是否包含子权限
   *
   * @description 检查指定权限是否包含某个子权限
   *
   * @param parentPermission - 父权限
   * @param childPermission - 子权限
   * @returns 是否包含
   *
   * @example
   * ```typescript
   * const contains = PermissionDefinitionsUtils.containsPermission(
   *   PermissionDefinitions.MANAGE_TENANT_USERS,
   *   PermissionDefinitions.VIEW_TENANT_USERS
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static containsPermission(parentPermission: PermissionDefinitions, childPermission: PermissionDefinitions): boolean {
    const subPermissions = this.getSubPermissions(parentPermission);
    return subPermissions.includes(childPermission);
  }

  /**
   * 获取权限的中文描述
   *
   * @description 返回权限的中文描述，用于界面显示
   *
   * @param permission - 权限定义
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = PermissionDefinitionsUtils.getDescription(
   *   PermissionDefinitions.MANAGE_TENANT_USERS
   * ); // "管理租户用户"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(permission: PermissionDefinitions): string {
    const descriptions: Record<PermissionDefinitions, string> = {
      // 平台级权限
      [PermissionDefinitions.MANAGE_PLATFORM_CONFIG]: '管理平台配置',
      [PermissionDefinitions.MANAGE_ALL_TENANTS]: '管理所有租户',
      [PermissionDefinitions.VIEW_PLATFORM_STATISTICS]: '查看平台统计',
      [PermissionDefinitions.MANAGE_PLATFORM_USERS]: '管理平台用户',
      [PermissionDefinitions.VIEW_PLATFORM_LOGS]: '查看平台日志',
      [PermissionDefinitions.MANAGE_PLATFORM_ROLES]: '管理平台角色',
      [PermissionDefinitions.MANAGE_PLATFORM_PERMISSIONS]: '管理平台权限',
      
      // 租户级权限
      [PermissionDefinitions.MANAGE_TENANT]: '管理租户',
      [PermissionDefinitions.VIEW_TENANT_INFO]: '查看租户信息',
      [PermissionDefinitions.UPDATE_TENANT_CONFIG]: '更新租户配置',
      [PermissionDefinitions.MANAGE_TENANT_USERS]: '管理租户用户',
      [PermissionDefinitions.VIEW_TENANT_USERS]: '查看租户用户',
      [PermissionDefinitions.INVITE_TENANT_USERS]: '邀请租户用户',
      [PermissionDefinitions.REMOVE_TENANT_USERS]: '移除租户用户',
      [PermissionDefinitions.MANAGE_TENANT_ORGANIZATIONS]: '管理租户组织',
      [PermissionDefinitions.VIEW_TENANT_ORGANIZATIONS]: '查看租户组织',
      [PermissionDefinitions.CREATE_TENANT_ORGANIZATIONS]: '创建租户组织',
      [PermissionDefinitions.DELETE_TENANT_ORGANIZATIONS]: '删除租户组织',
      [PermissionDefinitions.MANAGE_TENANT_DEPARTMENTS]: '管理租户部门',
      [PermissionDefinitions.VIEW_TENANT_DEPARTMENTS]: '查看租户部门',
      [PermissionDefinitions.CREATE_TENANT_DEPARTMENTS]: '创建租户部门',
      [PermissionDefinitions.DELETE_TENANT_DEPARTMENTS]: '删除租户部门',
      [PermissionDefinitions.VIEW_TENANT_STATISTICS]: '查看租户统计',
      [PermissionDefinitions.VIEW_TENANT_LOGS]: '查看租户日志',
      [PermissionDefinitions.MANAGE_TENANT_ROLES]: '管理租户角色',
      [PermissionDefinitions.ASSIGN_TENANT_ROLES]: '分配租户角色',
      [PermissionDefinitions.MANAGE_TENANT_PERMISSIONS]: '管理租户权限',
      
      // 组织级权限
      [PermissionDefinitions.MANAGE_ORGANIZATION]: '管理组织',
      [PermissionDefinitions.VIEW_ORGANIZATION_INFO]: '查看组织信息',
      [PermissionDefinitions.UPDATE_ORGANIZATION_INFO]: '更新组织信息',
      [PermissionDefinitions.MANAGE_ORGANIZATION_USERS]: '管理组织用户',
      [PermissionDefinitions.VIEW_ORGANIZATION_USERS]: '查看组织用户',
      [PermissionDefinitions.ASSIGN_ORGANIZATION_USERS]: '分配组织用户',
      [PermissionDefinitions.REMOVE_ORGANIZATION_USERS]: '移除组织用户',
      [PermissionDefinitions.MANAGE_ORGANIZATION_DEPARTMENTS]: '管理组织部门',
      [PermissionDefinitions.VIEW_ORGANIZATION_DEPARTMENTS]: '查看组织部门',
      [PermissionDefinitions.CREATE_ORGANIZATION_DEPARTMENTS]: '创建组织部门',
      [PermissionDefinitions.DELETE_ORGANIZATION_DEPARTMENTS]: '删除组织部门',
      [PermissionDefinitions.VIEW_ORGANIZATION_STATISTICS]: '查看组织统计',
      [PermissionDefinitions.VIEW_ORGANIZATION_LOGS]: '查看组织日志',
      [PermissionDefinitions.MANAGE_ORGANIZATION_ROLES]: '管理组织角色',
      [PermissionDefinitions.ASSIGN_ORGANIZATION_ROLES]: '分配组织角色',
      
      // 部门级权限
      [PermissionDefinitions.MANAGE_DEPARTMENT]: '管理部门',
      [PermissionDefinitions.VIEW_DEPARTMENT_INFO]: '查看部门信息',
      [PermissionDefinitions.UPDATE_DEPARTMENT_INFO]: '更新部门信息',
      [PermissionDefinitions.MANAGE_DEPARTMENT_USERS]: '管理部门用户',
      [PermissionDefinitions.VIEW_DEPARTMENT_USERS]: '查看部门用户',
      [PermissionDefinitions.ASSIGN_DEPARTMENT_USERS]: '分配部门用户',
      [PermissionDefinitions.REMOVE_DEPARTMENT_USERS]: '移除部门用户',
      [PermissionDefinitions.VIEW_DEPARTMENT_STATISTICS]: '查看部门统计',
      [PermissionDefinitions.VIEW_DEPARTMENT_LOGS]: '查看部门日志',
      [PermissionDefinitions.MANAGE_DEPARTMENT_ROLES]: '管理部门角色',
      [PermissionDefinitions.ASSIGN_DEPARTMENT_ROLES]: '分配部门角色',
      
      // 个人级权限
      [PermissionDefinitions.MANAGE_OWN_PROFILE]: '管理自己的资料',
      [PermissionDefinitions.VIEW_OWN_PROFILE]: '查看自己的资料',
      [PermissionDefinitions.UPDATE_OWN_PROFILE]: '更新自己的资料',
      [PermissionDefinitions.CHANGE_OWN_PASSWORD]: '修改自己的密码',
      [PermissionDefinitions.VIEW_OWN_PERMISSIONS]: '查看自己的权限',
      [PermissionDefinitions.VIEW_OWN_ROLES]: '查看自己的角色',
      [PermissionDefinitions.VIEW_OWN_TENANTS]: '查看自己的租户',
      [PermissionDefinitions.VIEW_OWN_ORGANIZATIONS]: '查看自己的组织',
      [PermissionDefinitions.VIEW_OWN_DEPARTMENTS]: '查看自己的部门',
      
      // 系统功能权限
      [PermissionDefinitions.USE_BASIC_FEATURES]: '使用基础功能',
      [PermissionDefinitions.USE_ADVANCED_FEATURES]: '使用高级功能',
      [PermissionDefinitions.USE_API_INTERFACES]: '使用API接口',
      [PermissionDefinitions.EXPORT_DATA]: '导出数据',
      [PermissionDefinitions.IMPORT_DATA]: '导入数据',
      [PermissionDefinitions.BACKUP_DATA]: '备份数据',
      [PermissionDefinitions.RESTORE_DATA]: '恢复数据',
      [PermissionDefinitions.SEND_NOTIFICATIONS]: '发送通知',
      [PermissionDefinitions.RECEIVE_NOTIFICATIONS]: '接收通知',
      [PermissionDefinitions.MANAGE_INTEGRATIONS]: '管理集成',
      [PermissionDefinitions.VIEW_INTEGRATIONS]: '查看集成',
      [PermissionDefinitions.CONFIGURE_INTEGRATIONS]: '配置集成'
    };

    return descriptions[permission] || permission;
  }

  /**
   * 检查是否为管理权限
   *
   * @description 判断权限是否为管理类权限（包含其他权限）
   *
   * @param permission - 权限定义
   * @returns 是否为管理权限
   *
   * @example
   * ```typescript
   * const isManage = PermissionDefinitionsUtils.isManagePermission(
   *   PermissionDefinitions.MANAGE_TENANT_USERS
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isManagePermission(permission: PermissionDefinitions): boolean {
    const subPermissions = this.getSubPermissions(permission);
    return subPermissions.length > 0;
  }

  /**
   * 获取所有权限定义
   *
   * @description 返回系统中定义的所有权限
   *
   * @returns 所有权限列表
   *
   * @example
   * ```typescript
   * const allPermissions = PermissionDefinitionsUtils.getAllPermissions();
   * ```
   *
   * @since 1.0.0
   */
  public static getAllPermissions(): PermissionDefinitions[] {
    return Object.values(PermissionDefinitions);
  }

  /**
   * 获取所有分类
   *
   * @description 返回系统中定义的所有权限分类
   *
   * @returns 所有分类列表
   *
   * @example
   * ```typescript
   * const categories = PermissionDefinitionsUtils.getAllCategories();
   * ```
   *
   * @since 1.0.0
   */
  public static getAllCategories(): string[] {
    return Object.keys(this.PERMISSION_CATEGORIES);
  }
}
