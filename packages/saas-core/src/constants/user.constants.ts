/**
 * 用户管理常量
 *
 * @description 用户相关的业务常量定义，包括验证规则、会话配置、密码策略等
 *
 * ## 业务规则
 *
 * ### 用户名规则
 * - 长度：3-50字符
 * - 格式：字母、数字、下划线、连字符
 * - 唯一性：全局唯一
 *
 * ### 密码策略
 * - 最小长度：8字符
 * - 包含：大小写字母、数字、特殊字符
 * - 过期时间：90天
 * - 历史记录：最近3次密码不可重复
 *
 * ### 登录安全
 * - 失败次数限制：5次
 * - 锁定时间：30分钟
 * - 会话超时：2小时
 *
 * ### 邮箱验证
 * - 验证码有效期：24小时
 * - 重发间隔：60秒
 *
 * @module constants/user
 * @since 1.0.0
 */

/**
 * 用户名验证规则
 *
 * @constant
 */
export const USERNAME_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 3,
  /** 最大长度 */
  MAX_LENGTH: 50,
  /** 格式：字母数字下划线连字符 */
  PATTERN: /^[a-zA-Z0-9_-]+$/,
  /** 错误消息 */
  ERROR_MESSAGE: '用户名必须是3-50位的字母、数字、下划线或连字符组合',
} as const;

/**
 * 邮箱验证规则
 *
 * @constant
 */
export const EMAIL_VALIDATION = {
  /** 邮箱格式 */
  PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** 最大长度 */
  MAX_LENGTH: 255,
  /** 错误消息 */
  ERROR_MESSAGE: '邮箱格式不正确',
} as const;

/**
 * 密码验证规则
 *
 * @description 强密码策略
 *
 * @constant
 */
export const PASSWORD_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 8,
  /** 最大长度 */
  MAX_LENGTH: 128,
  /** 必须包含大写字母 */
  REQUIRE_UPPERCASE: true,
  /** 必须包含小写字母 */
  REQUIRE_LOWERCASE: true,
  /** 必须包含数字 */
  REQUIRE_NUMBER: true,
  /** 必须包含特殊字符 */
  REQUIRE_SPECIAL: true,
  /** 特殊字符集合 */
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  /** 错误消息 */
  ERROR_MESSAGE: '密码必须至少8位，包含大小写字母、数字和特殊字符',
} as const;

/**
 * 密码策略配置
 *
 * @constant
 */
export const PASSWORD_POLICY = {
  /** 密码过期天数 */
  EXPIRY_DAYS: 90,
  /** 过期前警告天数 */
  WARNING_DAYS: 7,
  /** 历史密码记录数量（不可重复） */
  HISTORY_COUNT: 3,
  /** 密码最小更改间隔（小时） */
  MIN_CHANGE_INTERVAL_HOURS: 1,
} as const;

/**
 * 登录安全配置
 *
 * @constant
 */
export const LOGIN_SECURITY = {
  /** 最大失败登录次数 */
  MAX_FAILED_ATTEMPTS: 5,
  /** 账户锁定时长（分钟） */
  LOCKOUT_DURATION_MINUTES: 30,
  /** 失败计数重置时长（分钟） */
  FAILED_ATTEMPTS_RESET_MINUTES: 60,
  /** 记录最近登录次数 */
  RECENT_LOGIN_HISTORY_COUNT: 10,
} as const;

/**
 * 会话配置
 *
 * @constant
 */
export const SESSION_CONFIG = {
  /** JWT访问令牌有效期（秒） */
  ACCESS_TOKEN_EXPIRY: 7200, // 2小时
  /** JWT刷新令牌有效期（秒） */
  REFRESH_TOKEN_EXPIRY: 604800, // 7天
  /** 会话空闲超时（秒） */
  IDLE_TIMEOUT: 1800, // 30分钟
  /** 最大并发会话数 */
  MAX_CONCURRENT_SESSIONS: 5,
} as const;

/**
 * 邮箱验证配置
 *
 * @constant
 */
export const EMAIL_VERIFICATION = {
  /** 验证码有效期（秒） */
  CODE_EXPIRY: 86400, // 24小时
  /** 验证码长度 */
  CODE_LENGTH: 6,
  /** 重发验证码最小间隔（秒） */
  RESEND_INTERVAL: 60, // 1分钟
  /** 24小时内最大重发次数 */
  MAX_RESEND_COUNT: 5,
} as const;

/**
 * 手机号验证配置
 *
 * @constant
 */
export const PHONE_VERIFICATION = {
  /** 验证码有效期（秒） */
  CODE_EXPIRY: 300, // 5分钟
  /** 验证码长度 */
  CODE_LENGTH: 6,
  /** 重发验证码最小间隔（秒） */
  RESEND_INTERVAL: 60, // 1分钟
  /** 24小时内最大重发次数 */
  MAX_RESEND_COUNT: 10,
} as const;

/**
 * 用户状态转换规则
 *
 * @description 定义允许的用户状态转换路径
 *
 * @constant
 */
export const USER_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  PENDING: ['ACTIVE', 'DELETED', 'REJECTED'],
  ACTIVE: ['DISABLED', 'LOCKED', 'EXPIRED', 'SUSPENDED', 'DELETED'],
  DISABLED: ['ACTIVE', 'DELETED'],
  LOCKED: ['ACTIVE', 'DISABLED', 'DELETED'],
  EXPIRED: ['ACTIVE', 'DELETED'],
  SUSPENDED: ['ACTIVE', 'DISABLED', 'DELETED'],
  REJECTED: ['DELETED'], // 被拒绝的用户只能删除
  DELETED: [], // 已删除状态不可转换
} as const;

/**
 * 用户档案字段限制
 *
 * @constant
 */
export const USER_PROFILE_LIMITS = {
  /** 真实姓名最大长度 */
  FULL_NAME_MAX_LENGTH: 100,
  /** 昵称最小长度 */
  NICKNAME_MIN_LENGTH: 2,
  /** 昵称最大长度 */
  NICKNAME_MAX_LENGTH: 50,
  /** 个人简介最大长度 */
  BIO_MAX_LENGTH: 500,
  /** 头像URL最大长度 */
  AVATAR_URL_MAX_LENGTH: 500,
} as const;

/**
 * 用户缓存配置
 *
 * @constant
 */
export const USER_CACHE_CONFIG = {
  /** 用户信息缓存TTL（秒） */
  INFO_TTL: 1800, // 30分钟
  /** 用户权限缓存TTL（秒） */
  PERMISSIONS_TTL: 1800, // 30分钟
  /** 用户会话缓存TTL（秒） */
  SESSION_TTL: 7200, // 2小时
  /** 缓存键前缀 */
  KEY_PREFIX: 'user',
} as const;

/**
 * 用户操作限流配置
 *
 * @description API调用频率限制
 *
 * @constant
 */
export const USER_RATE_LIMITS = {
  /** 登录尝试：每小时 */
  LOGIN_ATTEMPTS_PER_HOUR: 10,
  /** 密码重置：每天 */
  PASSWORD_RESET_PER_DAY: 3,
  /** 邮箱验证重发：每天 */
  EMAIL_VERIFICATION_PER_DAY: 5,
  /** 个人资料更新：每小时 */
  PROFILE_UPDATES_PER_HOUR: 20,
} as const;

