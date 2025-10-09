/**
 * 部门管理常量
 *
 * @description 部门相关的业务常量定义，包括层级限制、规则约束等
 *
 * ## 业务规则
 *
 * ### 部门代码规则
 * - 长度：2-20字符
 * - 格式：字母、数字、下划线、连字符
 * - 唯一性：组织内唯一
 *
 * ### 部门层级
 * - LEVEL_1：总部（根部门）
 * - LEVEL_2：事业部
 * - LEVEL_3：区域
 * - LEVEL_4：分公司
 * - LEVEL_5：部门
 * - LEVEL_6：组
 * - LEVEL_7：小组
 * - LEVEL_8：专项团队（叶子部门）
 *
 * ### 部门层级限制
 * - 最大层级深度：8层（可扩展到10层）
 * - 每层最大子部门数：建议不超过20个
 *
 * @module constants/department
 * @since 1.0.0
 */

/**
 * 部门代码验证规则
 *
 * @constant
 */
export const DEPARTMENT_CODE_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 2,
  /** 最大长度 */
  MAX_LENGTH: 20,
  /** 格式：字母数字下划线连字符 */
  PATTERN: /^[a-zA-Z0-9_-]+$/,
  /** 错误消息 */
  ERROR_MESSAGE: '部门代码必须是2-20位的字母、数字、下划线或连字符组合',
} as const;

/**
 * 部门名称验证规则
 *
 * @constant
 */
export const DEPARTMENT_NAME_VALIDATION = {
  /** 最小长度 */
  MIN_LENGTH: 1,
  /** 最大长度 */
  MAX_LENGTH: 100,
  /** 错误消息 */
  ERROR_MESSAGE: '部门名称长度必须在1-100字符之间',
} as const;

/**
 * 部门描述验证规则
 *
 * @constant
 */
export const DEPARTMENT_DESCRIPTION_VALIDATION = {
  /** 最大长度 */
  MAX_LENGTH: 500,
  /** 错误消息 */
  ERROR_MESSAGE: '部门描述不能超过500字符',
} as const;

/**
 * 部门层级配置
 *
 * @description 预定义的部门层级及其特性
 *
 * @constant
 */
export const DEPARTMENT_LEVEL_CONFIG = {
  /** 一级：总部（根部门） */
  LEVEL_1: {
    level: 1,
    name: '总部',
    description: '企业总部，顶级部门',
    maxChildren: 10,
  },
  /** 二级：事业部 */
  LEVEL_2: {
    level: 2,
    name: '事业部',
    description: '按业务线划分的事业部',
    maxChildren: 20,
  },
  /** 三级：区域 */
  LEVEL_3: {
    level: 3,
    name: '区域',
    description: '按地理区域划分的部门',
    maxChildren: 30,
  },
  /** 四级：分公司 */
  LEVEL_4: {
    level: 4,
    name: '分公司',
    description: '各地分公司或子公司',
    maxChildren: 20,
  },
  /** 五级：部门 */
  LEVEL_5: {
    level: 5,
    name: '部门',
    description: '职能部门',
    maxChildren: 15,
  },
  /** 六级：组 */
  LEVEL_6: {
    level: 6,
    name: '组',
    description: '部门下的工作组',
    maxChildren: 10,
  },
  /** 七级：小组 */
  LEVEL_7: {
    level: 7,
    name: '小组',
    description: '组下的工作小组',
    maxChildren: 5,
  },
  /** 八级：专项团队（叶子部门） */
  LEVEL_8: {
    level: 8,
    name: '专项团队',
    description: '最小工作单元',
    maxChildren: 0, // 叶子部门，不允许有子部门
  },
} as const;

/**
 * 部门层级限制
 *
 * @description 部门层级的约束条件
 *
 * @constant
 */
export const DEPARTMENT_HIERARCHY_LIMITS = {
  /** 最小层级（根部门） */
  MIN_LEVEL: 1,
  /** 最大层级深度（默认） */
  MAX_LEVEL_DEFAULT: 8,
  /** 绝对最大层级深度 */
  MAX_LEVEL_ABSOLUTE: 10,
  /** 每层最大子部门数（建议） */
  MAX_CHILDREN_PER_LEVEL: 20,
  /** 每个部门最大成员数 */
  MAX_MEMBERS_PER_DEPARTMENT: 200,
} as const;

/**
 * 部门成员限制
 *
 * @constant
 */
export const DEPARTMENT_MEMBER_LIMITS = {
  /** 每个部门最小成员数 */
  MIN_MEMBERS: 1,
  /** 每个用户最大可加入部门数（兼职） */
  MAX_DEPARTMENTS_PER_USER: 5,
  /** 部门负责人最大数量 */
  MAX_MANAGERS: 2,
} as const;

/**
 * 部门状态转换规则
 *
 * @description 定义允许的部门状态转换路径
 *
 * @constant
 */
export const DEPARTMENT_STATUS_TRANSITIONS = {
  ACTIVE: ['INACTIVE', 'DELETED'],
  INACTIVE: ['ACTIVE', 'DELETED'],
  DELETED: [], // 已删除状态不可转换
} as const;

/**
 * 部门路径配置
 *
 * @description 物化路径的格式和限制
 *
 * @constant
 */
export const DEPARTMENT_PATH_CONFIG = {
  /** 路径分隔符 */
  SEPARATOR: '/',
  /** 路径最大长度 */
  MAX_LENGTH: 500,
  /** 路径格式示例 */
  FORMAT_EXAMPLE: '/1/5/12',
  /** 错误消息 */
  ERROR_MESSAGE: '部门路径格式不正确',
} as const;

/**
 * 部门全名配置
 *
 * @description 部门全名生成规则
 *
 * @constant
 */
export const DEPARTMENT_FULL_NAME_CONFIG = {
  /** 全名分隔符 */
  SEPARATOR: ' > ',
  /** 全名最大长度 */
  MAX_LENGTH: 500,
  /** 是否包含根部门 */
  INCLUDE_ROOT: true,
  /** 格式示例 */
  FORMAT_EXAMPLE: '总部 > 技术事业部 > 研发中心 > 后端组',
} as const;

/**
 * 部门闭包表配置
 *
 * @description 闭包表查询优化配置
 *
 * @constant
 */
export const DEPARTMENT_CLOSURE_CONFIG = {
  /** 最大查询深度 */
  MAX_QUERY_DEPTH: 10,
  /** 批量插入闭包记录的最大数量 */
  MAX_BATCH_INSERT: 1000,
} as const;

/**
 * 部门默认配置
 *
 * @constant
 */
export const DEPARTMENT_DEFAULTS = {
  /** 默认根部门名称 */
  ROOT_DEPARTMENT_NAME: '总部',
  /** 默认根部门代码 */
  ROOT_DEPARTMENT_CODE: 'HQ',
  /** 默认状态 */
  DEFAULT_STATUS: 'ACTIVE',
  /** 默认显示顺序 */
  DEFAULT_DISPLAY_ORDER: 0,
} as const;

/**
 * 部门缓存配置
 *
 * @constant
 */
export const DEPARTMENT_CACHE_CONFIG = {
  /** 部门信息缓存TTL（秒） */
  INFO_TTL: 1800, // 30分钟
  /** 部门树缓存TTL（秒） */
  TREE_TTL: 3600, // 1小时
  /** 部门成员列表缓存TTL（秒） */
  MEMBERS_TTL: 900, // 15分钟
  /** 缓存键前缀 */
  KEY_PREFIX: 'department',
} as const;

/**
 * 部门操作权限
 *
 * @description 部门级别的操作权限定义
 *
 * @constant
 */
export const DEPARTMENT_PERMISSIONS = {
  /** 创建部门 */
  CREATE: 'department:create',
  /** 读取部门 */
  READ: 'department:read',
  /** 更新部门 */
  UPDATE: 'department:update',
  /** 删除部门 */
  DELETE: 'department:delete',
  /** 移动部门 */
  MOVE: 'department:move',
  /** 管理成员 */
  MANAGE_MEMBERS: 'department:manage-members',
  /** 查看层级结构 */
  VIEW_HIERARCHY: 'department:view-hierarchy',
} as const;

/**
 * 部门移动规则
 *
 * @description 部门移动的约束条件
 *
 * @constant
 */
export const DEPARTMENT_MOVE_RULES = {
  /** 是否允许移动根部门 */
  ALLOW_MOVE_ROOT: false,
  /** 是否允许移动到子部门 */
  ALLOW_MOVE_TO_DESCENDANT: false,
  /** 移动后是否保持成员关系 */
  PRESERVE_MEMBERS: true,
  /** 移动后是否重新计算闭包表 */
  REBUILD_CLOSURE: true,
} as const;

