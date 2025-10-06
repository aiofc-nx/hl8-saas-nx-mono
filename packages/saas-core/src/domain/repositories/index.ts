/**
 * 领域层仓储接口导出
 *
 * @description 导出领域层仓储相关的所有接口
 * 遵循 hybrid-archi 的仓储设计模式
 *
 * @since 1.0.0
 */

// 组织聚合根仓储接口
export {
  IOrganizationRepository,
  ORGANIZATION_REPOSITORY_TOKEN
} from './organization-repository.interface';

// 用户聚合根仓储接口
export {
  IUserRepository,
  USER_REPOSITORY_TOKEN
} from './user-repository.interface';

// 租户聚合根仓储接口
export {
  ITenantRepository,
  TENANT_REPOSITORY_TOKEN,
  TenantResourceUsage,
  TenantResourceLimits
} from './tenant-repository.interface';

// 部门聚合根仓储接口
export {
  IDepartmentRepository,
  DEPARTMENT_REPOSITORY_TOKEN,
  DepartmentQueryConditions,
  DepartmentPaginationParams,
  DepartmentPaginationResult,
  DepartmentTreeNode
} from './department-repository.interface';

// 权限聚合根仓储接口
export {
  IPermissionRepository,
  PERMISSION_REPOSITORY_TOKEN,
  PermissionUsage
} from './permission-repository.interface';

// 角色聚合根仓储接口
export {
  IRoleRepository,
  ROLE_REPOSITORY_TOKEN,
  RoleUsage,
  RoleHierarchy
} from './role-repository.interface';
