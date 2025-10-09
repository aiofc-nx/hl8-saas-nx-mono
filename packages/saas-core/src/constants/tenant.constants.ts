/**
 * 租户管理常量
 *
 * @description 租户相关的业务常量定义，包括配额限制、规则约束等
 *
 * ## 业务规则
 *
 * ### 租户类型配额
 * - FREE（免费版）: 5用户/100MB/1组织
 * - BASIC（基础版）: 50用户/1GB/2组织
 * - PROFESSIONAL（专业版）: 500用户/10GB/10组织
 * - ENTERPRISE（企业版）: 5000用户/100GB/100组织
 * - CUSTOM（定制版）: 无限制，按需配置
 *
 * ### 租户代码规则
 * - 长度：3-20字符
 * - 格式：小写字母+数字
 * - 唯一性：全局唯一
 *
 * ### 租户状态转换
 * - TRIAL → ACTIVE（激活）
 * - ACTIVE ⇄ SUSPENDED（暂停/恢复）
 * - ANY → EXPIRED（过期）
 * - ANY → DELETED（删除）
 *
 * @module constants/tenant
 * @since 1.0.0
 */

/**
 * 租户代码验证规则
 *
 * @constant
 */
export const TENANT_CODE_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 3,
  /** 最大长度 */
  MAX_LENGTH: 20,
  /** 格式：小写字母和数字 */
  PATTERN: /^[a-z0-9]+$/,
  /** 错误消息 */
  ERROR_MESSAGE: '租户代码必须是3-20位的小写字母和数字组合',
} as const;

/**
 * 租户名称验证规则
 *
 * @constant
 */
export const TENANT_NAME_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 1,
  /** 最大长度 */
  MAX_LENGTH: 100,
  /** 错误消息 */
  ERROR_MESSAGE: '租户名称长度必须在1-100字符之间',
} as const;

/**
 * 租户域名验证规则
 *
 * @constant
 */
export const TENANT_DOMAIN_VALIDATION = {
  /** 域名格式：字母数字、连字符、点 */
  PATTERN: /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/,
  /** 错误消息 */
  ERROR_MESSAGE: '租户域名格式不正确',
} as const;

/**
 * 租户类型配额配置
 *
 * @description 不同租户类型的资源配额限制
 *
 * @constant
 */
export const TENANT_TYPE_QUOTAS = {
  /** 免费版配额 */
  FREE: {
    maxUsers: 5,
    maxStorageMB: 100,
    maxOrganizations: 1,
    maxDepartmentLevels: 3,
    maxApiCallsPerDay: 1000,
  },
  /** 基础版配额 */
  BASIC: {
    maxUsers: 50,
    maxStorageMB: 1024, // 1GB
    maxOrganizations: 2,
    maxDepartmentLevels: 5,
    maxApiCallsPerDay: 10000,
  },
  /** 专业版配额 */
  PROFESSIONAL: {
    maxUsers: 500,
    maxStorageMB: 10240, // 10GB
    maxOrganizations: 10,
    maxDepartmentLevels: 8,
    maxApiCallsPerDay: 100000,
  },
  /** 企业版配额 */
  ENTERPRISE: {
    maxUsers: 5000,
    maxStorageMB: 102400, // 100GB
    maxOrganizations: 100,
    maxDepartmentLevels: 10,
    maxApiCallsPerDay: 1000000,
  },
  /** 定制版配额（无限制） */
  CUSTOM: {
    maxUsers: Number.MAX_SAFE_INTEGER,
    maxStorageMB: Number.MAX_SAFE_INTEGER,
    maxOrganizations: Number.MAX_SAFE_INTEGER,
    maxDepartmentLevels: Number.MAX_SAFE_INTEGER,
    maxApiCallsPerDay: Number.MAX_SAFE_INTEGER,
  },
} as const;

/**
 * 租户试用期限制
 *
 * @constant
 */
export const TENANT_TRIAL_LIMITS = {
  /** 试用期天数 */
  TRIAL_DAYS: 30,
  /** 试用期警告阈值（剩余天数） */
  WARNING_DAYS: 7,
} as const;

/**
 * 租户配额警告阈值
 *
 * @description 资源使用达到配额的百分比时发送警告
 *
 * @constant
 */
export const QUOTA_WARNING_THRESHOLDS = {
  /** 警告阈值（80%） */
  WARNING: 0.8,
  /** 严重警告阈值（90%） */
  CRITICAL: 0.9,
  /** 阻塞阈值（100%） */
  BLOCKED: 1.0,
} as const;

/**
 * 租户状态转换规则
 *
 * @description 定义允许的租户状态转换路径
 *
 * @constant
 */
export const TENANT_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  CREATING: ['PENDING', 'DISABLED'],
  PENDING: ['ACTIVE', 'DISABLED'],
  ACTIVE: ['SUSPENDED', 'DISABLED'],
  SUSPENDED: ['ACTIVE', 'DISABLED'],
  DISABLED: ['ACTIVE'],
  DELETED: [], // 已删除状态不可转换
} as const;

/**
 * 租户升级路径规则
 *
 * @description 定义允许的租户类型升级路径
 *
 * @constant
 */
export const TENANT_UPGRADE_PATHS: Record<string, readonly string[]> = {
  FREE: ['BASIC', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'],
  BASIC: ['PROFESSIONAL', 'ENTERPRISE', 'CUSTOM'],
  PROFESSIONAL: ['ENTERPRISE', 'CUSTOM'],
  ENTERPRISE: ['CUSTOM'],
  CUSTOM: [], // 定制版不可再升级
} as const;

/**
 * 租户降级路径规则
 *
 * @description 定义允许的租户类型降级路径
 *
 * @constant
 */
export const TENANT_DOWNGRADE_PATHS: Record<string, readonly string[]> = {
  CUSTOM: ['ENTERPRISE', 'PROFESSIONAL', 'BASIC', 'FREE'],
  ENTERPRISE: ['PROFESSIONAL', 'BASIC', 'FREE'],
  PROFESSIONAL: ['BASIC', 'FREE'],
  BASIC: ['FREE'],
  FREE: [], // 免费版不可降级
} as const;

/**
 * 租户数据保留期限
 *
 * @description 租户删除后的数据保留天数
 *
 * @constant
 */
export const TENANT_DATA_RETENTION = {
  /** 数据保留天数 */
  RETENTION_DAYS: 30,
  /** 硬删除警告阈值（剩余天数） */
  HARD_DELETE_WARNING_DAYS: 7,
} as const;

/**
 * 租户缓存配置
 *
 * @constant
 */
export const TENANT_CACHE_CONFIG = {
  /** 租户配置缓存TTL（秒） */
  CONFIG_TTL: 3600, // 1小时
  /** 租户信息缓存TTL（秒） */
  INFO_TTL: 1800, // 30分钟
  /** 缓存键前缀 */
  KEY_PREFIX: 'tenant',
} as const;

