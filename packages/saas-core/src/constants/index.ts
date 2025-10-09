/**
 * 常量统一导出
 *
 * @description 集中导出所有领域的业务常量
 *
 * ## 常量分类
 *
 * ### 领域常量
 * - tenant.constants: 租户管理常量
 * - user.constants: 用户管理常量
 * - organization.constants: 组织管理常量
 * - department.constants: 部门管理常量
 * - role.constants: 角色管理常量
 * - permission.constants: 权限管理常量
 *
 * ### 通用常量
 * - common.constants: 跨领域通用常量
 *
 * @module constants
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // 导入特定领域常量
 * import { TENANT_CODE_VALIDATION } from '@hl8/saas-core/constants';
 *
 * // 导入整个领域的常量
 * import * as TenantConstants from '@hl8/saas-core/constants/tenant.constants';
 * ```
 */

// 租户常量
export * from './tenant.constants';

// 用户常量
export * from './user.constants';

// 组织常量（排除重复的权限定义）
export {
  ORGANIZATION_CODE_VALIDATION,
  ORGANIZATION_NAME_VALIDATION,
  ORGANIZATION_DESCRIPTION_VALIDATION,
  ORGANIZATION_MEMBER_LIMITS,
  ORGANIZATION_TYPE_CONFIG,
} from './organization.constants';

// 部门常量（排除重复的权限定义）
export {
  DEPARTMENT_CODE_VALIDATION,
  DEPARTMENT_NAME_VALIDATION,
  DEPARTMENT_MEMBER_LIMITS,
  DEPARTMENT_STATUS_TRANSITIONS,
} from './department.constants';

// 角色常量
export * from './role.constants';

// 权限常量（包含所有权限定义）
export * from './permission.constants';

// 通用常量
export * from './common.constants';

