/**
 * SAAS Core 模块统一导出
 *
 * @description 集中导出所有公共 API、类型、常量和工具
 *
 * ## 导出结构
 *
 * ### 模块导出
 * - SaasCoreModule: 主模块
 *
 * ### 领域层导出
 * - 值对象：TenantCode, TenantDomain, TenantQuota 等
 * - 枚举：TenantType, Gender, DepartmentStatus 等
 *
 * ### 常量导出
 * - 所有领域常量
 * - 通用常量
 *
 * ### 基础设施导出
 * - EventStoreAdapter: 事件存储
 * - SnapshotStoreAdapter: 快照存储
 *
 * @module @hl8/saas-core
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * // 导入模块
 * import { SaasCoreModule } from '@hl8/saas-core';
 *
 * // 导入值对象
 * import { TenantCode, TenantQuota } from '@hl8/saas-core';
 *
 * // 导入常量
 * import { TENANT_CODE_VALIDATION } from '@hl8/saas-core';
 * ```
 */

// ============================================================================
// 主模块导出
// ============================================================================
export * from './saas-core.module';

// ============================================================================
// 常量导出
// ============================================================================
export * from './constants';

// ============================================================================
// 领域层导出 - Tenant 子领域
// ============================================================================
export * from './domain/tenant/value-objects/tenant-code.vo';
export * from './domain/tenant/value-objects/tenant-domain.vo';
export * from './domain/tenant/value-objects/tenant-quota.vo';
export * from './domain/tenant/value-objects/tenant-type.enum';

// ============================================================================
// 领域层导出 - User 子领域
// ============================================================================
export * from './domain/user/value-objects/gender.enum';

// ============================================================================
// 领域层导出 - Organization 子领域
// ============================================================================
export * from './domain/organization/value-objects/organization-type.vo';

// ============================================================================
// 领域层导出 - Department 子领域
// ============================================================================
export * from './domain/department/value-objects/department-level.vo';
export * from './domain/department/value-objects/department-path.vo';
export * from './domain/department/value-objects/department-status.enum';

// ============================================================================
// 领域层导出 - Role 子领域
// ============================================================================
export * from './domain/role/value-objects/role-level.vo';
export * from './domain/role/value-objects/role-name.vo';
export * from './domain/role/value-objects/role-status.enum';

// ============================================================================
// 领域层导出 - Permission 子领域
// ============================================================================
export * from './domain/permission/value-objects/permission-action.vo';
export * from './domain/permission/value-objects/permission-status.enum';

// ============================================================================
// 基础设施层导出
// ============================================================================
export * from './infrastructure/persistence/mikro-orm.config';
export * from './infrastructure/persistence/filters/tenant.filter';
export * from './infrastructure/event-sourcing/event-store.adapter';
export * from './infrastructure/event-sourcing/snapshot-store.adapter';

// ============================================================================
// 注意事项
// ============================================================================
// 1. 当实现更多领域对象（实体、聚合根、事件）时，在此添加导出
// 2. 应用层的用例、命令、查询将在实现后添加导出
// 3. 接口层的 DTOs 和控制器不在此导出（由 NestJS 模块管理）
// 4. 保持导出的有序性和分类清晰
