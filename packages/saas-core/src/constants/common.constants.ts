/**
 * 通用常量
 *
 * @description 跨领域的通用业务常量定义，包括缓存配置、分页、API限制等
 *
 * ## 通用规则
 *
 * ### 缓存策略
 * - 热数据：短TTL（5-15分钟）
 * - 温数据：中TTL（30-60分钟）
 * - 冷数据：长TTL（1-24小时）
 *
 * ### 分页规则
 * - 默认页码：1
 * - 默认每页数量：20
 * - 最大每页数量：100
 *
 * ### API限制
 * - 默认超时：30秒
 * - 批量操作最大数量：1000
 *
 * @module constants/common
 * @since 1.0.0
 */

/**
 * 缓存TTL配置（单位：秒）
 *
 * @description 不同类型数据的缓存过期时间
 *
 * @constant
 */
export const CACHE_TTL = {
  /** 极短TTL（5分钟） - 频繁变化的数据 */
  VERY_SHORT: 300,
  /** 短TTL（15分钟） - 热数据 */
  SHORT: 900,
  /** 中TTL（30分钟） - 温数据 */
  MEDIUM: 1800,
  /** 长TTL（1小时） - 冷数据 */
  LONG: 3600,
  /** 极长TTL（6小时） - 极少变化的数据 */
  VERY_LONG: 21600,
  /** 超长TTL（24小时） - 静态数据 */
  EXTRA_LONG: 86400,
} as const;

/**
 * 缓存键前缀
 *
 * @description 用于命名空间隔离
 *
 * @constant
 */
export const CACHE_KEY_PREFIXES = {
  /** 应用前缀 */
  APP: 'saas-core',
  /** 租户前缀 */
  TENANT: 'tenant',
  /** 用户前缀 */
  USER: 'user',
  /** 组织前缀 */
  ORGANIZATION: 'organization',
  /** 部门前缀 */
  DEPARTMENT: 'department',
  /** 角色前缀 */
  ROLE: 'role',
  /** 权限前缀 */
  PERMISSION: 'permission',
  /** 会话前缀 */
  SESSION: 'session',
  /** 令牌前缀 */
  TOKEN: 'token',
} as const;

/**
 * 分页配置
 *
 * @description 分页查询的默认值和限制
 *
 * @constant
 */
export const PAGINATION_CONFIG = {
  /** 默认页码 */
  DEFAULT_PAGE: 1,
  /** 默认每页数量 */
  DEFAULT_PAGE_SIZE: 20,
  /** 最小每页数量 */
  MIN_PAGE_SIZE: 1,
  /** 最大每页数量 */
  MAX_PAGE_SIZE: 100,
  /** 是否显示总数 */
  SHOW_TOTAL: true,
} as const;

/**
 * 排序配置
 *
 * @description 列表查询的排序规则
 *
 * @constant
 */
export const SORTING_CONFIG = {
  /** 默认排序字段 */
  DEFAULT_SORT_BY: 'createdAt',
  /** 默认排序方向 */
  DEFAULT_SORT_ORDER: 'DESC',
  /** 允许的排序方向 */
  ALLOWED_SORT_ORDERS: ['ASC', 'DESC'] as const,
} as const;

/**
 * API请求配置
 *
 * @description API调用的通用配置
 *
 * @constant
 */
export const API_CONFIG = {
  /** API版本 */
  API_VERSION: 'v1',
  /** API前缀 */
  API_PREFIX: '/api',
  /** 默认超时时间（毫秒） */
  DEFAULT_TIMEOUT: 30000,
  /** 长时间操作超时（毫秒） */
  LONG_TIMEOUT: 60000,
  /** 批量操作超时（毫秒） */
  BATCH_TIMEOUT: 120000,
} as const;

/**
 * 批量操作限制
 *
 * @description 批量操作的数量限制
 *
 * @constant
 */
export const BATCH_OPERATION_LIMITS = {
  /** 默认批量操作最大数量 */
  DEFAULT_MAX_BATCH_SIZE: 100,
  /** 批量创建最大数量 */
  MAX_BATCH_CREATE: 100,
  /** 批量更新最大数量 */
  MAX_BATCH_UPDATE: 100,
  /** 批量删除最大数量 */
  MAX_BATCH_DELETE: 100,
  /** 批量导入最大数量 */
  MAX_BATCH_IMPORT: 1000,
} as const;

/**
 * 文件上传限制
 *
 * @description 文件上传的大小和类型限制
 *
 * @constant
 */
export const FILE_UPLOAD_LIMITS = {
  /** 单个文件最大大小（字节） */
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  /** 头像文件最大大小（字节） */
  MAX_AVATAR_SIZE: 2 * 1024 * 1024, // 2MB
  /** 允许的图片格式 */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  /** 允许的文档格式 */
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
} as const;

/**
 * 日期时间格式
 *
 * @description 标准的日期时间格式定义
 *
 * @constant
 */
export const DATETIME_FORMATS = {
  /** ISO 8601标准格式 */
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  /** 日期格式 */
  DATE: 'YYYY-MM-DD',
  /** 时间格式 */
  TIME: 'HH:mm:ss',
  /** 日期时间格式 */
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  /** 友好格式 */
  FRIENDLY: 'YYYY年MM月DD日 HH:mm',
} as const;

/**
 * 时区配置
 *
 * @description 时区相关配置
 *
 * @constant
 */
export const TIMEZONE_CONFIG = {
  /** 默认时区 */
  DEFAULT_TIMEZONE: 'Asia/Shanghai',
  /** UTC时区 */
  UTC_TIMEZONE: 'UTC',
  /** 支持的时区列表 */
  SUPPORTED_TIMEZONES: [
    'Asia/Shanghai',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Hong_Kong',
    'Asia/Singapore',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'UTC',
  ],
} as const;

/**
 * 语言配置
 *
 * @description 多语言支持配置
 *
 * @constant
 */
export const LANGUAGE_CONFIG = {
  /** 默认语言 */
  DEFAULT_LANGUAGE: 'zh-CN',
  /** 回退语言 */
  FALLBACK_LANGUAGE: 'en-US',
  /** 支持的语言列表 */
  SUPPORTED_LANGUAGES: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'],
} as const;

/**
 * 错误码范围
 *
 * @description 错误码的分类范围
 *
 * @constant
 */
export const ERROR_CODE_RANGES = {
  /** 通用错误 */
  GENERAL: { start: 1000, end: 1999 },
  /** 租户错误 */
  TENANT: { start: 2000, end: 2999 },
  /** 用户错误 */
  USER: { start: 3000, end: 3999 },
  /** 组织错误 */
  ORGANIZATION: { start: 4000, end: 4999 },
  /** 部门错误 */
  DEPARTMENT: { start: 5000, end: 5999 },
  /** 角色错误 */
  ROLE: { start: 6000, end: 6999 },
  /** 权限错误 */
  PERMISSION: { start: 7000, end: 7999 },
  /** 系统错误 */
  SYSTEM: { start: 9000, end: 9999 },
} as const;

/**
 * HTTP状态码映射
 *
 * @description 常用HTTP状态码的语义化命名
 *
 * @constant
 */
export const HTTP_STATUS = {
  /** 成功 */
  OK: 200,
  /** 创建成功 */
  CREATED: 201,
  /** 接受（异步处理） */
  ACCEPTED: 202,
  /** 无内容 */
  NO_CONTENT: 204,
  /** 错误请求 */
  BAD_REQUEST: 400,
  /** 未授权 */
  UNAUTHORIZED: 401,
  /** 禁止访问 */
  FORBIDDEN: 403,
  /** 未找到 */
  NOT_FOUND: 404,
  /** 冲突 */
  CONFLICT: 409,
  /** 请求实体过大 */
  PAYLOAD_TOO_LARGE: 413,
  /** 请求过于频繁 */
  TOO_MANY_REQUESTS: 429,
  /** 服务器错误 */
  INTERNAL_SERVER_ERROR: 500,
  /** 服务不可用 */
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * 正则表达式模式
 *
 * @description 常用的验证正则表达式
 *
 * @constant
 */
export const REGEX_PATTERNS = {
  /** 邮箱 */
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** URL */
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
  /** UUID */
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /** 中国手机号 */
  CN_PHONE: /^1[3-9]\d{9}$/,
  /** IPv4地址 */
  IPV4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
} as const;

/**
 * 默认值配置
 *
 * @description 各种场景的默认值
 *
 * @constant
 */
export const DEFAULT_VALUES = {
  /** 字符串默认值 */
  STRING: '',
  /** 数字默认值 */
  NUMBER: 0,
  /** 布尔默认值 */
  BOOLEAN: false,
  /** 数组默认值 */
  ARRAY: [],
  /** 对象默认值 */
  OBJECT: {},
  /** 空值 */
  NULL: null,
} as const;

/**
 * 环境变量键名
 *
 * @description 标准化的环境变量命名
 *
 * @constant
 */
export const ENV_KEYS = {
  /** Node环境 */
  NODE_ENV: 'NODE_ENV',
  /** 应用端口 */
  PORT: 'PORT',
  /** 数据库URL */
  DATABASE_URL: 'DATABASE_URL',
  /** Redis URL */
  REDIS_URL: 'REDIS_URL',
  /** JWT密钥 */
  JWT_SECRET: 'JWT_SECRET',
  /** API密钥 */
  API_KEY: 'API_KEY',
} as const;

/**
 * 应用环境
 *
 * @description 应用运行环境类型
 *
 * @constant
 */
export const APP_ENVIRONMENTS = {
  /** 开发环境 */
  DEVELOPMENT: 'development',
  /** 测试环境 */
  TEST: 'test',
  /** 预发布环境 */
  STAGING: 'staging',
  /** 生产环境 */
  PRODUCTION: 'production',
} as const;

