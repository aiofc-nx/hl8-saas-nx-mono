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

// 组织常量
export * from './organization.constants';

// 部门常量
export * from './department.constants';

// 角色常量
export * from './role.constants';

// 权限常量
export * from './permission.constants';

// 通用常量
export * from './common.constants';

