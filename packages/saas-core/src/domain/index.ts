/**
 * 领域层导出
 *
 * @description 导出领域层相关的所有公共API
 * 遵循 hybrid-archi 的领域层设计模式
 *
 * @since 1.0.0
 */

// 实体系统 - 使用显式导出避免重复导出冲突
export { Organization } from './organization/entities/organization.entity';
export { User } from './user/entities/user.entity';
export { Tenant } from './tenant/entities/tenant.entity';
export { Department } from './department/entities/department.entity';
export { Role } from './authorization/entities/role.entity';
export { UserRole as UserRoleEntity } from './authorization/entities/user-role.entity';

// 聚合根系统 - 使用显式导出避免重复导出冲突
export { OrganizationAggregate } from './organization/aggregates/organization.aggregate';
export { UserAggregate } from './user/aggregates/user.aggregate';
export { TenantAggregate } from './tenant/aggregates/tenant.aggregate';
export { DepartmentAggregate } from './department/aggregates/department.aggregate';
export { PermissionAggregate } from './authorization/aggregates/permission.aggregate';
export { RoleAggregate } from './authorization/aggregates/role.aggregate';

// 值对象系统 - 使用显式导出避免重复导出冲突
export { OrganizationType, OrganizationTypeUtils } from './organization/value-objects/organization-type.vo';
export { OrganizationStatus, OrganizationStatusUtils } from '@hl8/hybrid-archi/src/domain/value-objects/statuses/organization-status.vo';
export { UserRole as UserRoleVO, UserRoleUtils } from '@hl8/hybrid-archi/src/domain/value-objects/types/user-role.vo';
export { UserStatus, UserStatusUtils } from '@hl8/hybrid-archi/src/domain/value-objects/statuses/user-status.vo';
export { UserProfile } from './user/value-objects/user-profile.vo';
export { TenantType, TenantTypeUtils } from '@hl8/hybrid-archi/src/domain/value-objects/types/tenant-type.vo';
export { TenantStatus, TenantStatusUtils } from '@hl8/hybrid-archi/src/domain/value-objects/statuses/tenant-status.vo';
export { TenantConfig } from './tenant/value-objects/tenant-config.vo';
export { ResourceLimits } from './tenant/value-objects/resource-limits.vo';
export { DepartmentStatus, DepartmentStatusUtils } from './department/value-objects/department-status.vo';
export { DepartmentType, DepartmentTypeUtils } from './department/value-objects/department-type.vo';
export { DepartmentLevel } from './department/value-objects/department-level.vo';
export { DataIsolationStrategy, IsolationStrategyUtils } from './data-isolation/value-objects/isolation-strategy.vo';
export { Permission as PermissionVO } from './authorization/value-objects/permission.vo';
export { PermissionDefinitions, PermissionDefinitionsUtils } from '@hl8/hybrid-archi';
export { MfaType, MfaTypeUtils } from '@hl8/hybrid-archi';
export { MfaStatus, MfaStatusUtils } from '@hl8/hybrid-archi';
export { PasswordPolicy, PasswordValidationResult } from '@hl8/hybrid-archi';
export { AuditEventType, AuditEventTypeUtils } from '@hl8/hybrid-archi';

// 领域事件系统 - 使用显式导出避免重复导出冲突
export {
  OrganizationCreatedEvent,
  OrganizationNameUpdatedEvent,
  OrganizationDescriptionUpdatedEvent,
  OrganizationActivatedEvent,
  OrganizationDeactivatedEvent,
  OrganizationDeletedEvent
} from './events/organization-events';
export {
  UserRegisteredEvent,
  UserActivatedEvent,
  UserSuspendedEvent,
  UserDisabledEvent,
  UserLockedEvent,
  UserUnlockedEvent,
  UserAuthenticatedEvent,
  UserPasswordUpdatedEvent,
  UserAssignedToTenantEvent,
  UserRemovedFromTenantEvent,
  UserRoleAddedEvent,
  UserProfileUpdatedEvent
} from './events/user-events';
export {
  TenantCreatedEvent,
  TenantActivatedEvent,
  TenantSuspendedEvent,
  TenantDisabledEvent,
  TenantUpgradedEvent,
  TenantNameUpdatedEvent,
  TenantAdminUpdatedEvent,
  TenantConfigUpdatedEvent,
  TenantResourceLimitsUpdatedEvent
} from './events/tenant-events';
export {
  UserRoleRemovedEvent
} from './events/authorization-events';
export {
  DepartmentCreatedEvent,
  DepartmentNameUpdatedEvent,
  DepartmentDescriptionUpdatedEvent,
  DepartmentActivatedEvent,
  DepartmentDeactivatedEvent,
  DepartmentDeletedEvent
} from './events/department-events';

// 领域服务系统 - 使用显式导出避免重复导出冲突
export { TenantBusinessRulesService } from './services/tenant-business-rules.service';
export { UserBusinessRulesService } from './services/user-business-rules.service';
export { IsolationService } from './data-isolation/services/isolation.service';

// 仓储接口系统
export * from './repositories';

// 业务规则系统 - 使用显式导出避免重复导出冲突
export { OrganizationBusinessRulesValidator } from './rules/organization-business-rules.validator';
export { UserBusinessRules } from './rules/user-rules';
export { OrganizationBusinessRules } from './rules/organization-rules';
export { DepartmentBusinessRules } from './rules/department-rules';
export { DataIsolationBusinessRules, DataIsolationRuleValidator } from './data-isolation/rules/isolation-rules';

// 领域规约系统
export * from './specifications/organization-specifications';

// 类型定义系统
export * from './types';
