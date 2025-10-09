/**
 * 角色管理常量
 *
 * @description 角色相关的业务常量定义，包括角色层级、权限分配规则等
 *
 * ## 业务规则
 *
 * ### 角色代码规则
 * - 长度：2-50字符
 * - 格式：字母、数字、下划线、冒号
 * - 唯一性：租户内唯一
 *
 * ### 角色层级
 * - PLATFORM：平台级（超级管理员）
 * - TENANT：租户级（租户管理员）
 * - ORGANIZATION：组织级（组织管理员）
 * - DEPARTMENT：部门级（部门经理）
 *
 * ### 角色权限继承
 * - 上级角色包含下级角色的所有权限
 * - PLATFORM > TENANT > ORGANIZATION > DEPARTMENT
 *
 * @module constants/role
 * @since 1.0.0
 */

/**
 * 角色代码验证规则
 *
 * @constant
 */
export const ROLE_CODE_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 2,
  /** 最大长度 */
  MAX_LENGTH: 50,
  /** 格式：字母数字下划线冒号 */
  PATTERN: /^[a-zA-Z0-9_:]+$/,
  /** 错误消息 */
  ERROR_MESSAGE: '角色代码必须是2-50位的字母、数字、下划线或冒号组合',
} as const;

/**
 * 角色名称验证规则
 *
 * @constant
 */
export const ROLE_NAME_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 1,
  /** 最大长度 */
  MAX_LENGTH: 100,
  /** 错误消息 */
  ERROR_MESSAGE: '角色名称长度必须在1-100字符之间',
} as const;

/**
 * 角色描述验证规则
 *
 * @constant
 */
export const ROLE_DESCRIPTION_VALIDATION = {
  /** 最大长度 */
  MAX_LENGTH: 500,
  /** 错误消息 */
  ERROR_MESSAGE: '角色描述不能超过500字符',
} as const;

/**
 * 角色层级配置
 *
 * @description 预定义的角色层级及其特性
 *
 * @constant
 */
export const ROLE_LEVEL_CONFIG = {
  /** 平台级（最高权限） */
  PLATFORM: {
    level: 'PLATFORM',
    priority: 1,
    name: '平台级角色',
    description: '平台超级管理员，拥有所有权限',
    canManageLevels: ['PLATFORM', 'TENANT', 'ORGANIZATION', 'DEPARTMENT'],
  },
  /** 租户级 */
  TENANT: {
    level: 'TENANT',
    priority: 2,
    name: '租户级角色',
    description: '租户管理员，管理租户内所有资源',
    canManageLevels: ['TENANT', 'ORGANIZATION', 'DEPARTMENT'],
  },
  /** 组织级 */
  ORGANIZATION: {
    level: 'ORGANIZATION',
    priority: 3,
    name: '组织级角色',
    description: '组织管理员，管理组织内资源',
    canManageLevels: ['ORGANIZATION', 'DEPARTMENT'],
  },
  /** 部门级 */
  DEPARTMENT: {
    level: 'DEPARTMENT',
    priority: 4,
    name: '部门级角色',
    description: '部门经理，管理部门内资源',
    canManageLevels: ['DEPARTMENT'],
  },
} as const;

/**
 * 系统预定义角色
 *
 * @description 系统内置的角色，不可删除
 *
 * @constant
 */
export const SYSTEM_ROLES = {
  /** 超级管理员 */
  SUPER_ADMIN: {
    code: 'platform:super-admin',
    name: '超级管理员',
    level: 'PLATFORM',
    isSystem: true,
    isDefault: false,
  },
  /** 平台管理员 */
  PLATFORM_ADMIN: {
    code: 'platform:admin',
    name: '平台管理员',
    level: 'PLATFORM',
    isSystem: true,
    isDefault: false,
  },
  /** 租户管理员 */
  TENANT_ADMIN: {
    code: 'tenant:admin',
    name: '租户管理员',
    level: 'TENANT',
    isSystem: true,
    isDefault: true, // 新租户创建者默认角色
  },
  /** 组织管理员 */
  ORGANIZATION_ADMIN: {
    code: 'organization:admin',
    name: '组织管理员',
    level: 'ORGANIZATION',
    isSystem: true,
    isDefault: false,
  },
  /** 部门经理 */
  DEPARTMENT_MANAGER: {
    code: 'department:manager',
    name: '部门经理',
    level: 'DEPARTMENT',
    isSystem: true,
    isDefault: false,
  },
  /** 普通用户 */
  MEMBER: {
    code: 'tenant:member',
    name: '普通成员',
    level: 'TENANT',
    isSystem: true,
    isDefault: true, // 新用户默认角色
  },
} as const;

/**
 * 角色权限限制
 *
 * @constant
 */
export const ROLE_PERMISSION_LIMITS = {
  /** 每个角色最大权限数 */
  MAX_PERMISSIONS_PER_ROLE: 100,
  /** 每个用户最大角色数 */
  MAX_ROLES_PER_USER: 10,
  /** 角色权限缓存TTL（秒） */
  PERMISSIONS_CACHE_TTL: 1800, // 30分钟
} as const;

/**
 * 角色状态转换规则
 *
 * @description 定义允许的角色状态转换路径
 *
 * @constant
 */
export const ROLE_STATUS_TRANSITIONS = {
  ACTIVE: ['INACTIVE', 'DELETED'],
  INACTIVE: ['ACTIVE', 'DELETED'],
  DELETED: [], // 已删除状态不可转换
} as const;

/**
 * 角色分配规则
 *
 * @description 角色分配的约束条件
 *
 * @constant
 */
export const ROLE_ASSIGNMENT_RULES = {
  /** 是否允许跨级分配 */
  ALLOW_CROSS_LEVEL: false,
  /** 是否允许重复分配 */
  ALLOW_DUPLICATE: false,
  /** 系统角色是否可被删除 */
  SYSTEM_ROLE_DELETABLE: false,
  /** 系统角色是否可被修改 */
  SYSTEM_ROLE_EDITABLE: false,
} as const;

/**
 * 角色权限继承规则
 *
 * @description 角色层级之间的权限继承关系
 *
 * @constant
 */
export const ROLE_INHERITANCE_RULES = {
  /** 是否启用权限继承 */
  ENABLE_INHERITANCE: true,
  /** 继承层级关系 */
  INHERITANCE_HIERARCHY: {
    PLATFORM: ['TENANT', 'ORGANIZATION', 'DEPARTMENT'],
    TENANT: ['ORGANIZATION', 'DEPARTMENT'],
    ORGANIZATION: ['DEPARTMENT'],
    DEPARTMENT: [],
  },
} as const;

/**
 * 角色缓存配置
 *
 * @constant
 */
export const ROLE_CACHE_CONFIG = {
  /** 角色信息缓存TTL（秒） */
  INFO_TTL: 1800, // 30分钟
  /** 角色权限缓存TTL（秒） */
  PERMISSIONS_TTL: 1800, // 30分钟
  /** 用户角色列表缓存TTL（秒） */
  USER_ROLES_TTL: 900, // 15分钟
  /** 缓存键前缀 */
  KEY_PREFIX: 'role',
} as const;

/**
 * 角色操作权限
 *
 * @description 角色管理的操作权限定义
 *
 * @constant
 */
export const ROLE_MANAGEMENT_PERMISSIONS = {
  /** 创建角色 */
  CREATE: 'role:create',
  /** 读取角色 */
  READ: 'role:read',
  /** 更新角色 */
  UPDATE: 'role:update',
  /** 删除角色 */
  DELETE: 'role:delete',
  /** 分配权限 */
  ASSIGN_PERMISSIONS: 'role:assign-permissions',
  /** 分配角色给用户 */
  ASSIGN_TO_USER: 'role:assign',
  /** 撤销用户角色 */
  REVOKE_FROM_USER: 'role:revoke',
} as const;

/**
 * 角色审计配置
 *
 * @description 角色变更的审计记录配置
 *
 * @constant
 */
export const ROLE_AUDIT_CONFIG = {
  /** 是否记录角色创建 */
  LOG_CREATE: true,
  /** 是否记录角色更新 */
  LOG_UPDATE: true,
  /** 是否记录角色删除 */
  LOG_DELETE: true,
  /** 是否记录权限分配 */
  LOG_PERMISSION_ASSIGNMENT: true,
  /** 是否记录角色分配给用户 */
  LOG_ROLE_ASSIGNMENT: true,
  /** 审计日志保留天数 */
  RETENTION_DAYS: 365,
} as const;

