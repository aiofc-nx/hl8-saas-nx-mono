/**
 * 值对象导出
 *
 * @description 导出所有共享的值对象
 * @since 1.0.0
 */

// 从hybrid-archi导入全局通用的值对象
export { TenantType, TenantTypeUtils } from '@hl8/hybrid-archi/src/domain/value-objects/types/tenant-type.vo';
export { TenantStatus, TenantStatusUtils } from '@hl8/hybrid-archi/src/domain/value-objects/statuses/tenant-status.vo';
export { UserRole, UserRoleUtils } from '@hl8/hybrid-archi/src/domain/value-objects/types/user-role.vo';
export { UserStatus, UserStatusUtils } from '@hl8/hybrid-archi/src/domain/value-objects/statuses/user-status.vo';
export { OrganizationStatus, OrganizationStatusUtils } from '@hl8/hybrid-archi/src/domain/value-objects/statuses/organization-status.vo';

// 租户相关值对象（业务特定）
export * from '../tenant/value-objects/tenant-config.vo';
export * from '../tenant/value-objects/resource-limits.vo';

// 用户相关值对象（业务特定）
export * from '../user/value-objects/user-profile.vo';

// 部门相关值对象
export * from '../department/value-objects/department-level.vo';

// 组织相关值对象（业务特定）
export * from '../organization/value-objects/organization-type.vo';
