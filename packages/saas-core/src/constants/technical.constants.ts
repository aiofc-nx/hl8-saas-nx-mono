/**
 * 技术常量定义
 * 
 * @description 定义SAAS-CORE模块中的技术相关常量
 * 包括DI令牌、事件名称、配置键等技术枚举值
 * 
 * @since 1.0.0
 */

/**
 * 依赖注入令牌常量
 * 
 * @description 定义用于依赖注入的令牌常量
 * 避免硬编码字符串，提高代码可维护性
 */
export const DI_TOKENS = {
  // 模块选项令牌
  MODULE_OPTIONS: 'MODULE_OPTIONS',
  SAAS_CORE_OPTIONS: 'SAAS_CORE_OPTIONS',
  
  // 仓储令牌
  TENANT_REPOSITORY: 'TENANT_REPOSITORY',
  USER_REPOSITORY: 'USER_REPOSITORY',
  ORGANIZATION_REPOSITORY: 'ORGANIZATION_REPOSITORY',
  DEPARTMENT_REPOSITORY: 'DEPARTMENT_REPOSITORY',
  
  // 服务令牌
  TENANT_SERVICE: 'TENANT_SERVICE',
  USER_SERVICE: 'USER_SERVICE',
  ORGANIZATION_SERVICE: 'ORGANIZATION_SERVICE',
  DEPARTMENT_SERVICE: 'DEPARTMENT_SERVICE',
  AUTH_SERVICE: 'AUTH_SERVICE',
  
  // 缓存令牌
  CACHE_MANAGER: 'CACHE_MANAGER',
  TENANT_CACHE_SERVICE: 'TENANT_CACHE_SERVICE',
  USER_CACHE_SERVICE: 'USER_CACHE_SERVICE'
} as const;

/**
 * 事件名称常量
 * 
 * @description 定义系统中使用的领域事件名称
 * 用于事件驱动架构和异步处理
 */
export const EVENT_NAMES = {
  // 租户相关事件
  TENANT_CREATED: 'tenant.created',
  TENANT_ACTIVATED: 'tenant.activated',
  TENANT_SUSPENDED: 'tenant.suspended',
  TENANT_UPDATED: 'tenant.updated',
  TENANT_DELETED: 'tenant.deleted',
  
  // 用户相关事件
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_ACTIVATED: 'user.activated',
  USER_SUSPENDED: 'user.suspended',
  USER_DELETED: 'user.deleted',
  
  // 组织相关事件
  ORGANIZATION_CREATED: 'organization.created',
  ORGANIZATION_UPDATED: 'organization.updated',
  ORGANIZATION_DELETED: 'organization.deleted',
  
  // 部门相关事件
  DEPARTMENT_CREATED: 'department.created',
  DEPARTMENT_UPDATED: 'department.updated',
  DEPARTMENT_DELETED: 'department.deleted'
} as const;

/**
 * 配置键常量
 * 
 * @description 定义配置参数的键名
 * 用于配置管理和环境变量映射
 */
export const CONFIG_KEYS = {
  // 数据库配置
  DB_HOST: 'DB_HOST',
  DB_PORT: 'DB_PORT',
  DB_USERNAME: 'DB_USERNAME',
  DB_PASSWORD: 'DB_PASSWORD',
  DB_DATABASE: 'DB_DATABASE',
  
  // Redis配置
  REDIS_HOST: 'REDIS_HOST',
  REDIS_PORT: 'REDIS_PORT',
  REDIS_PASSWORD: 'REDIS_PASSWORD',
  REDIS_DB: 'REDIS_DB',
  
  // 应用配置
  NODE_ENV: 'NODE_ENV',
  PORT: 'PORT',
  LOG_LEVEL: 'LOG_LEVEL',
  LOG_FORMAT: 'LOG_FORMAT',
  
  // 安全配置
  JWT_SECRET: 'JWT_SECRET',
  ENCRYPTION_KEY: 'ENCRYPTION_KEY',
  SESSION_SECRET: 'SESSION_SECRET'
} as const;

/**
 * 缓存键前缀常量
 * 
 * @description 定义缓存键的前缀
 * 用于缓存管理和键名空间隔离
 */
export const CACHE_PREFIXES = {
  TENANT: 'tenant:',
  USER: 'user:',
  ORGANIZATION: 'org:',
  DEPARTMENT: 'dept:',
  SESSION: 'session:',
  TOKEN: 'token:'
} as const;

/**
 * 错误代码常量
 * 
 * @description 定义系统错误代码
 * 用于错误处理和日志记录
 */
export const ERROR_CODES = {
  // 通用错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  
  // 租户错误
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_ALREADY_EXISTS: 'TENANT_ALREADY_EXISTS',
  TENANT_INVALID_STATUS: 'TENANT_INVALID_STATUS',
  
  // 用户错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_INVALID_CREDENTIALS: 'USER_INVALID_CREDENTIALS',
  
  // 组织错误
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  ORGANIZATION_ALREADY_EXISTS: 'ORGANIZATION_ALREADY_EXISTS',
  
  // 部门错误
  DEPARTMENT_NOT_FOUND: 'DEPARTMENT_NOT_FOUND',
  DEPARTMENT_ALREADY_EXISTS: 'DEPARTMENT_ALREADY_EXISTS',
  DEPARTMENT_INVALID_LEVEL: 'DEPARTMENT_INVALID_LEVEL'
} as const;
