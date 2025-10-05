/**
 * 业务常量定义
 * 
 * @description 定义SAAS-CORE模块中的业务相关常量
 * 包括租户类型、用户状态、组织类型等业务枚举值
 * 
 * @since 1.0.0
 */

/**
 * 租户类型枚举
 * 
 * @description 定义SAAS平台支持的租户类型
 * 每种类型对应不同的功能权限和资源限制
 */
export const TENANT_TYPES = {
  FREE: 'FREE',
  BASIC: 'BASIC', 
  PROFESSIONAL: 'PROFESSIONAL',
  ENTERPRISE: 'ENTERPRISE',
  CUSTOM: 'CUSTOM'
} as const;

/**
 * 租户状态枚举
 * 
 * @description 定义租户的生命周期状态
 * 用于租户管理和状态控制
 */
export const TENANT_STATUS = {
  CREATING: 'CREATING',
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DISABLED: 'DISABLED',
  DELETED: 'DELETED'
} as const;

/**
 * 用户状态枚举
 * 
 * @description 定义用户账户的状态
 * 用于用户管理和访问控制
 */
export const USER_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED'
} as const;

/**
 * 用户角色枚举
 * 
 * @description 定义系统中的用户角色
 * 用于权限管理和访问控制
 */
export const USER_ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  ORGANIZATION_ADMIN: 'ORGANIZATION_ADMIN',
  DEPARTMENT_ADMIN: 'DEPARTMENT_ADMIN',
  REGULAR_USER: 'REGULAR_USER'
} as const;

/**
 * 组织类型枚举
 * 
 * @description 定义组织架构中的组织类型
 * 用于组织管理和分类
 */
export const ORGANIZATION_TYPES = {
  COMMITTEE: 'COMMITTEE',           // 专业委员会
  PROJECT_TEAM: 'PROJECT_TEAM',     // 项目管理团队
  QUALITY_GROUP: 'QUALITY_GROUP',   // 质量控制小组
  PERFORMANCE_GROUP: 'PERFORMANCE_GROUP', // 绩效管理小组
  OTHER: 'OTHER'                    // 其他职能组织
} as const;

/**
 * 部门层级枚举
 * 
 * @description 定义部门在组织架构中的层级
 * 用于部门管理和层级控制
 */
export const DEPARTMENT_LEVELS = {
  LEVEL_1: 1,  // 一级部门
  LEVEL_2: 2,  // 二级部门
  LEVEL_3: 3,  // 三级部门
  LEVEL_4: 4,  // 四级部门
  LEVEL_5: 5   // 五级部门
} as const;

/**
 * 数据隔离策略枚举
 * 
 * @description 定义多租户数据隔离策略
 * 用于数据安全和隔离控制
 */
export const DATA_ISOLATION_STRATEGIES = {
  ROW_LEVEL_SECURITY: 'ROW_LEVEL_SECURITY',     // 行级安全
  DATABASE_PER_TENANT: 'DATABASE_PER_TENANT',   // 每租户独立数据库
  SCHEMA_PER_TENANT: 'SCHEMA_PER_TENANT',       // 每租户独立模式
  APPLICATION_LEVEL: 'APPLICATION_LEVEL'        // 应用级隔离
} as const;

/**
 * 认证类型枚举
 * 
 * @description 定义用户认证的方式类型
 * 用于认证策略和安全管理
 */
export const AUTH_TYPES = {
  EMAIL_PASSWORD: 'EMAIL_PASSWORD',     // 邮箱密码认证
  USERNAME_PASSWORD: 'USERNAME_PASSWORD', // 用户名密码认证
  SSO: 'SSO',                          // 单点登录
  OAUTH2: 'OAUTH2',                    // OAuth2认证
  LDAP: 'LDAP',                        // LDAP认证
  SAML: 'SAML'                         // SAML认证
} as const;

/**
 * 权限类型枚举
 * 
 * @description 定义系统中的权限类型
 * 用于权限管理和访问控制
 */
export const PERMISSION_TYPES = {
  READ: 'READ',           // 读取权限
  WRITE: 'WRITE',         // 写入权限
  DELETE: 'DELETE',       // 删除权限
  EXECUTE: 'EXECUTE',     // 执行权限
  ADMIN: 'ADMIN'          // 管理权限
} as const;
