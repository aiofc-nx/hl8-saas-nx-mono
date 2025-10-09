/**
 * 组织管理常量
 *
 * @description 组织相关的业务常量定义，包括组织类型、规则约束等
 *
 * ## 业务规则
 *
 * ### 组织代码规则
 * - 长度：2-20字符
 * - 格式：字母、数字、下划线、连字符
 * - 唯一性：租户内唯一
 *
 * ### 组织类型
 * - PROFESSIONAL_COMMITTEE：专业委员会
 * - PROJECT_TEAM：项目管理团队
 * - QUALITY_CONTROL：质量控制小组
 * - PERFORMANCE_TEAM：绩效管理小组
 * - CUSTOM：自定义类型
 *
 * ### 组织数量限制
 * - 根据租户类型限制：FREE(1)、BASIC(2)、PROFESSIONAL(10)、ENTERPRISE(100)、CUSTOM(无限)
 *
 * @module constants/organization
 * @since 1.0.0
 */

/**
 * 组织代码验证规则
 *
 * @constant
 */
export const ORGANIZATION_CODE_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 2,
  /** 最大长度 */
  MAX_LENGTH: 20,
  /** 格式：字母数字下划线连字符 */
  PATTERN: /^[a-zA-Z0-9_-]+$/,
  /** 错误消息 */
  ERROR_MESSAGE: '组织代码必须是2-20位的字母、数字、下划线或连字符组合',
} as const;

/**
 * 组织名称验证规则
 *
 * @constant
 */
export const ORGANIZATION_NAME_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 1,
  /** 最大长度 */
  MAX_LENGTH: 100,
  /** 错误消息 */
  ERROR_MESSAGE: '组织名称长度必须在1-100字符之间',
} as const;

/**
 * 组织描述验证规则
 *
 * @constant
 */
export const ORGANIZATION_DESCRIPTION_VALIDATION = {
  /** 最大长度 */
  MAX_LENGTH: 500,
  /** 错误消息 */
  ERROR_MESSAGE: '组织描述不能超过500字符',
} as const;

/**
 * 组织类型配置
 *
 * @description 预定义的组织类型及其特性
 *
 * @constant
 */
export const ORGANIZATION_TYPE_CONFIG = {
  /** 专业委员会 */
  PROFESSIONAL_COMMITTEE: {
    code: 'PROFESSIONAL_COMMITTEE',
    name: '专业委员会',
    description: '负责特定专业领域的管理和决策',
    defaultMemberLimit: 20,
  },
  /** 项目管理团队 */
  PROJECT_TEAM: {
    code: 'PROJECT_TEAM',
    name: '项目管理团队',
    description: '负责项目的策划、执行和监控',
    defaultMemberLimit: 50,
  },
  /** 质量控制小组 */
  QUALITY_CONTROL: {
    code: 'QUALITY_CONTROL',
    name: '质量控制小组',
    description: '负责质量管理和流程改进',
    defaultMemberLimit: 10,
  },
  /** 绩效管理小组 */
  PERFORMANCE_TEAM: {
    code: 'PERFORMANCE_TEAM',
    name: '绩效管理小组',
    description: '负责绩效评估和考核管理',
    defaultMemberLimit: 15,
  },
  /** 自定义类型 */
  CUSTOM: {
    code: 'CUSTOM',
    name: '自定义组织',
    description: '用户自定义的组织类型',
    defaultMemberLimit: 100,
  },
} as const;

/**
 * 组织成员角色
 *
 * @constant
 */
export const ORGANIZATION_MEMBER_ROLES = {
  /** 组织负责人 */
  LEADER: 'LEADER',
  /** 副负责人 */
  DEPUTY_LEADER: 'DEPUTY_LEADER',
  /** 成员 */
  MEMBER: 'MEMBER',
  /** 观察员 */
  OBSERVER: 'OBSERVER',
} as const;

/**
 * 组织成员限制
 *
 * @constant
 */
export const ORGANIZATION_MEMBER_LIMITS = {
  /** 每个组织最小成员数 */
  MIN_MEMBERS: 1,
  /** 每个组织最大成员数（默认） */
  MAX_MEMBERS_DEFAULT: 100,
  /** 每个用户最大可加入组织数 */
  MAX_ORGANIZATIONS_PER_USER: 10,
  /** 组织负责人最大数量 */
  MAX_LEADERS: 3,
} as const;

/**
 * 组织状态转换规则
 *
 * @description 定义允许的组织状态转换路径
 *
 * @constant
 */
export const ORGANIZATION_STATUS_TRANSITIONS = {
  ACTIVE: ['INACTIVE', 'DELETED'],
  INACTIVE: ['ACTIVE', 'DELETED'],
  DELETED: [], // 已删除状态不可转换
} as const;

/**
 * 组织默认配置
 *
 * @constant
 */
export const ORGANIZATION_DEFAULTS = {
  /** 默认组织名称前缀 */
  DEFAULT_NAME_PREFIX: '默认组织',
  /** 默认组织代码前缀 */
  DEFAULT_CODE_PREFIX: 'default-org',
  /** 是否默认激活 */
  DEFAULT_STATUS: 'ACTIVE',
  /** 默认显示顺序 */
  DEFAULT_DISPLAY_ORDER: 0,
} as const;

/**
 * 组织缓存配置
 *
 * @constant
 */
export const ORGANIZATION_CACHE_CONFIG = {
  /** 组织信息缓存TTL（秒） */
  INFO_TTL: 1800, // 30分钟
  /** 组织成员列表缓存TTL（秒） */
  MEMBERS_TTL: 900, // 15分钟
  /** 缓存键前缀 */
  KEY_PREFIX: 'organization',
} as const;

/**
 * 组织操作权限
 *
 * @description 组织级别的操作权限定义
 *
 * @constant
 */
export const ORGANIZATION_PERMISSIONS = {
  /** 创建组织 */
  CREATE: 'organization:create',
  /** 读取组织 */
  READ: 'organization:read',
  /** 更新组织 */
  UPDATE: 'organization:update',
  /** 删除组织 */
  DELETE: 'organization:delete',
  /** 管理成员 */
  MANAGE_MEMBERS: 'organization:manage-members',
  /** 分配角色 */
  ASSIGN_ROLES: 'organization:assign-roles',
} as const;

/**
 * 组织层级限制
 *
 * @description 组织结构的层级约束
 *
 * @constant
 */
export const ORGANIZATION_HIERARCHY_LIMITS = {
  /** 是否允许嵌套组织（当前版本不支持） */
  ALLOW_NESTED: false,
  /** 组织层级深度（横向组织，深度为1） */
  MAX_DEPTH: 1,
} as const;

