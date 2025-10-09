/**
 * 权限管理常量
 *
 * @description 权限相关的业务常量定义，包括权限定义、操作类型等
 *
 * ## 业务规则
 *
 * ### 权限代码格式
 * - 格式：`resource:action`
 * - 示例：`tenant:create`, `user:read`, `department:delete`
 * - 资源名称：小写字母
 * - 操作类型：CREATE/READ/UPDATE/DELETE/EXECUTE
 *
 * ### 权限分类
 * - 租户管理：tenant_management
 * - 用户管理：user_management
 * - 组织管理：organization_management
 * - 部门管理：department_management
 * - 角色管理：role_management
 * - 权限管理：permission_management
 *
 * @module constants/permission
 * @since 1.0.0
 */

/**
 * 权限代码验证规则
 *
 * @constant
 */
export const PERMISSION_CODE_VALIDATION = {
  /** 权限代码格式：resource:action */
  PATTERN: /^[a-z_]+:[a-z_]+$/,
  /** 最小长度 */
  MIN_LENGTH: 3,
  /** 最大长度 */
  MAX_LENGTH: 100,
  /** 错误消息 */
  ERROR_MESSAGE: '权限代码格式必须为 resource:action',
} as const;

/**
 * 权限名称验证规则
 *
 * @constant
 */
export const PERMISSION_NAME_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 1,
  /** 最大长度 */
  MAX_LENGTH: 100,
  /** 错误消息 */
  ERROR_MESSAGE: '权限名称长度必须在1-100字符之间',
} as const;

/**
 * 权限操作类型
 *
 * @description 定义标准的CRUD操作类型
 *
 * @constant
 */
export const PERMISSION_ACTIONS = {
  /** 创建 */
  CREATE: 'CREATE',
  /** 读取 */
  READ: 'READ',
  /** 更新 */
  UPDATE: 'UPDATE',
  /** 删除 */
  DELETE: 'DELETE',
  /** 执行（特殊操作） */
  EXECUTE: 'EXECUTE',
} as const;

/**
 * 权限分类
 *
 * @description 按业务领域分类的权限类别
 *
 * @constant
 */
export const PERMISSION_CATEGORIES = {
  /** 租户管理 */
  TENANT_MANAGEMENT: {
    code: 'tenant_management',
    name: '租户管理',
    description: '租户创建、配置、升级等操作',
  },
  /** 用户管理 */
  USER_MANAGEMENT: {
    code: 'user_management',
    name: '用户管理',
    description: '用户注册、认证、权限管理等操作',
  },
  /** 组织管理 */
  ORGANIZATION_MANAGEMENT: {
    code: 'organization_management',
    name: '组织管理',
    description: '组织创建、成员管理等操作',
  },
  /** 部门管理 */
  DEPARTMENT_MANAGEMENT: {
    code: 'department_management',
    name: '部门管理',
    description: '部门创建、层级管理、成员管理等操作',
  },
  /** 角色管理 */
  ROLE_MANAGEMENT: {
    code: 'role_management',
    name: '角色管理',
    description: '角色创建、权限分配等操作',
  },
  /** 权限管理 */
  PERMISSION_MANAGEMENT: {
    code: 'permission_management',
    name: '权限管理',
    description: '权限定义、分配等操作',
  },
  /** 系统管理 */
  SYSTEM_MANAGEMENT: {
    code: 'system_management',
    name: '系统管理',
    description: '系统配置、监控等操作',
  },
} as const;

/**
 * 租户管理权限
 *
 * @constant
 */
export const TENANT_PERMISSIONS = {
  CREATE: 'tenant:create',
  READ: 'tenant:read',
  UPDATE: 'tenant:update',
  DELETE: 'tenant:delete',
  UPGRADE: 'tenant:upgrade',
  DOWNGRADE: 'tenant:downgrade',
  SUSPEND: 'tenant:suspend',
  ACTIVATE: 'tenant:activate',
  CONFIGURE: 'tenant:configure',
} as const;

/**
 * 用户管理权限
 *
 * @constant
 */
export const USER_PERMISSIONS = {
  CREATE: 'user:create',
  READ: 'user:read',
  UPDATE: 'user:update',
  DELETE: 'user:delete',
  DISABLE: 'user:disable',
  ENABLE: 'user:enable',
  RESET_PASSWORD: 'user:reset-password',
  ASSIGN_ROLE: 'user:assign-role',
  REVOKE_ROLE: 'user:revoke-role',
} as const;

/**
 * 组织管理权限
 *
 * @constant
 */
export const ORGANIZATION_PERMISSIONS = {
  CREATE: 'organization:create',
  READ: 'organization:read',
  UPDATE: 'organization:update',
  DELETE: 'organization:delete',
  MANAGE_MEMBERS: 'organization:manage-members',
  ASSIGN_ROLES: 'organization:assign-roles',
} as const;

/**
 * 部门管理权限
 *
 * @constant
 */
export const DEPARTMENT_PERMISSIONS = {
  CREATE: 'department:create',
  READ: 'department:read',
  UPDATE: 'department:update',
  DELETE: 'department:delete',
  MOVE: 'department:move',
  MANAGE_MEMBERS: 'department:manage-members',
  VIEW_HIERARCHY: 'department:view-hierarchy',
} as const;

/**
 * 角色管理权限
 *
 * @constant
 */
export const ROLE_PERMISSIONS = {
  CREATE: 'role:create',
  READ: 'role:read',
  UPDATE: 'role:update',
  DELETE: 'role:delete',
  ASSIGN_PERMISSIONS: 'role:assign-permissions',
  REVOKE_PERMISSIONS: 'role:revoke-permissions',
  ASSIGN: 'role:assign',
  REVOKE: 'role:revoke',
} as const;

/**
 * 权限管理权限
 *
 * @constant
 */
export const PERMISSION_MANAGEMENT_PERMISSIONS = {
  READ: 'permission:read',
  GRANT: 'permission:grant',
  REVOKE: 'permission:revoke',
} as const;

/**
 * 系统管理权限
 *
 * @constant
 */
export const SYSTEM_PERMISSIONS = {
  VIEW_DASHBOARD: 'system:view-dashboard',
  VIEW_LOGS: 'system:view-logs',
  MANAGE_CONFIG: 'system:manage-config',
  VIEW_METRICS: 'system:view-metrics',
  MANAGE_ALERTS: 'system:manage-alerts',
} as const;

/**
 * 权限状态转换规则
 *
 * @constant
 */
export const PERMISSION_STATUS_TRANSITIONS = {
  ACTIVE: ['INACTIVE', 'DELETED'],
  INACTIVE: ['ACTIVE', 'DELETED'],
  DELETED: [], // 已删除状态不可转换
} as const;

/**
 * 权限缓存配置
 *
 * @constant
 */
export const PERMISSION_CACHE_CONFIG = {
  /** 权限定义缓存TTL（秒） */
  DEFINITION_TTL: 3600, // 1小时
  /** 用户权限缓存TTL（秒） */
  USER_PERMISSIONS_TTL: 1800, // 30分钟
  /** 角色权限缓存TTL（秒） */
  ROLE_PERMISSIONS_TTL: 1800, // 30分钟
  /** 缓存键前缀 */
  KEY_PREFIX: 'permission',
} as const;

/**
 * 权限验证配置
 *
 * @description 权限验证的性能优化配置
 *
 * @constant
 */
export const PERMISSION_CHECK_CONFIG = {
  /** 是否启用权限缓存 */
  ENABLE_CACHE: true,
  /** 批量验证权限的最大数量 */
  MAX_BATCH_CHECK: 50,
  /** 权限验证超时时间（毫秒） */
  CHECK_TIMEOUT_MS: 100,
} as const;

/**
 * 权限继承规则
 *
 * @description 权限的继承和组合规则
 *
 * @constant
 */
export const PERMISSION_INHERITANCE_RULES = {
  /** 是否启用权限继承 */
  ENABLE_INHERITANCE: true,
  /** 通配符权限支持 */
  SUPPORT_WILDCARD: true,
  /** 通配符符号 */
  WILDCARD_SYMBOL: '*',
  /** 通配符权限示例 */
  WILDCARD_EXAMPLES: ['tenant:*', '*:read', '*:*'],
} as const;

/**
 * 权限审计配置
 *
 * @constant
 */
export const PERMISSION_AUDIT_CONFIG = {
  /** 是否记录权限验证 */
  LOG_CHECKS: false, // 性能考虑，默认不记录
  /** 是否记录权限授予 */
  LOG_GRANTS: true,
  /** 是否记录权限撤销 */
  LOG_REVOCATIONS: true,
  /** 是否记录权限拒绝 */
  LOG_DENIALS: true,
  /** 审计日志保留天数 */
  RETENTION_DAYS: 180,
} as const;

/**
 * 系统预定义权限集
 *
 * @description 常用的权限组合
 *
 * @constant
 */
export const PERMISSION_SETS = {
  /** 租户管理员权限集 */
  TENANT_ADMIN: [
    ...Object.values(TENANT_PERMISSIONS),
    ...Object.values(USER_PERMISSIONS),
    ...Object.values(ORGANIZATION_PERMISSIONS),
    ...Object.values(DEPARTMENT_PERMISSIONS),
    ...Object.values(ROLE_PERMISSIONS),
  ],
  /** 组织管理员权限集 */
  ORGANIZATION_ADMIN: [
    ORGANIZATION_PERMISSIONS.READ,
    ORGANIZATION_PERMISSIONS.UPDATE,
    ORGANIZATION_PERMISSIONS.MANAGE_MEMBERS,
    DEPARTMENT_PERMISSIONS.CREATE,
    DEPARTMENT_PERMISSIONS.READ,
    DEPARTMENT_PERMISSIONS.UPDATE,
    DEPARTMENT_PERMISSIONS.MANAGE_MEMBERS,
  ],
  /** 部门经理权限集 */
  DEPARTMENT_MANAGER: [
    DEPARTMENT_PERMISSIONS.READ,
    DEPARTMENT_PERMISSIONS.UPDATE,
    DEPARTMENT_PERMISSIONS.MANAGE_MEMBERS,
    USER_PERMISSIONS.READ,
  ],
  /** 普通成员权限集 */
  MEMBER: [
    USER_PERMISSIONS.READ,
    ORGANIZATION_PERMISSIONS.READ,
    DEPARTMENT_PERMISSIONS.READ,
  ],
} as const;

