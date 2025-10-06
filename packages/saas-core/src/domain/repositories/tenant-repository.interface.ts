/**
 * 租户聚合根仓储接口
 *
 * @description 租户聚合根的数据访问接口
 * 遵循 hybrid-archi 的 IAggregateRepository 设计模式
 *
 * ## 业务规则
 *
 * ### 租户仓储职责
 * - 管理租户聚合根的完整生命周期
 * - 处理租户相关的领域事件存储和发布
 * - 确保租户聚合边界内的一致性
 * - 支持租户数据隔离
 *
 * ### 租户查询规则
 * - 查询应该基于业务概念而非技术实现
 * - 查询应该返回完整的租户聚合根
 * - 查询应该支持业务级别的过滤和排序
 * - 查询应该处理数据不存在的情况
 *
 * ### 租户持久化规则
 * - 保存操作应该是原子性的
 * - 应该处理并发冲突
 * - 应该验证数据完整性
 * - 应该支持事务操作
 *
 * @example
 * ```typescript
 * // 在应用层使用
 * @Injectable()
 * export class TenantApplicationService {
 *   constructor(
 *     @Inject(TENANT_REPOSITORY_TOKEN)
 *     private readonly tenantRepository: ITenantRepository
 *   ) {}
 * 
 *   async createTenant(command: CreateTenantCommand): Promise<TenantId> {
 *     const tenant = TenantAggregate.create(...);
 *     await this.tenantRepository.saveWithEvents(tenant);
 *     return tenant.getTenantId();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { 
  IAggregateRepository, 
  IRepositoryQueryOptions, 
  IPaginatedResult 
} from '@hl8/hybrid-archi';
import { EntityId } from '@hl8/hybrid-archi';
import { TenantAggregate } from '../tenant/aggregates/tenant.aggregate';
import { TenantType } from '@hl8/hybrid-archi';
import { TenantStatus } from '@hl8/hybrid-archi';

/**
 * 租户聚合根仓储接口
 *
 * @description 定义租户聚合根数据访问的所有操作
 * 继承自 hybrid-archi 的 IAggregateRepository，提供完整的聚合根管理能力
 *
 * @since 1.0.0
 */
export interface ITenantRepository extends IAggregateRepository<TenantAggregate, EntityId> {
  /**
   * 根据租户代码查找租户
   *
   * @description 根据租户代码查找租户
   *
   * @param code - 租户代码
   * @returns 租户聚合根或null
   *
   * @example
   * ```typescript
   * const tenant = await tenantRepository.findByCode('TENANT_001');
   * ```
   */
  findByCode(code: string): Promise<TenantAggregate | null>;

  /**
   * 根据租户名称查找租户
   *
   * @description 根据租户名称查找租户
   *
   * @param name - 租户名称
   * @returns 租户聚合根或null
   */
  findByName(name: string): Promise<TenantAggregate | null>;

  /**
   * 根据租户类型查找租户
   *
   * @description 查找指定类型的租户
   *
   * @param type - 租户类型
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findByType(type: TenantType, options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 根据租户状态查找租户
   *
   * @description 查找指定状态的租户
   *
   * @param status - 租户状态
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findByStatus(status: TenantStatus, options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 查找活跃租户
   *
   * @description 查找所有活跃状态的租户
   *
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findActiveTenants(options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 查找待激活租户
   *
   * @description 查找所有待激活状态的租户
   *
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findPendingTenants(options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 查找被暂停租户
   *
   * @description 查找所有被暂停状态的租户
   *
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findSuspendedTenants(options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 查找企业租户
   *
   * @description 查找所有企业类型的租户
   *
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findEnterpriseTenants(options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 查找个人租户
   *
   * @description 查找所有个人类型的租户
   *
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findPersonalTenants(options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 查找团队租户
   *
   * @description 查找所有团队类型的租户
   *
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findTeamTenants(options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 查找社群租户
   *
   * @description 查找所有社群类型的租户
   *
   * @param options - 查询选项
   * @returns 租户聚合根列表
   */
  findCommunityTenants(options?: IRepositoryQueryOptions): Promise<TenantAggregate[]>;

  /**
   * 分页查找租户
   *
   * @description 分页查找租户
   *
   * @param options - 查询选项
   * @returns 分页结果
   */
  findPaginated(options: IRepositoryQueryOptions): Promise<IPaginatedResult<TenantAggregate>>;

  /**
   * 统计租户类型数量
   *
   * @description 统计指定类型的租户数量
   *
   * @param type - 租户类型
   * @returns 租户数量
   */
  countByType(type: TenantType): Promise<number>;

  /**
   * 统计租户状态数量
   *
   * @description 统计指定状态的租户数量
   *
   * @param status - 租户状态
   * @returns 租户数量
   */
  countByStatus(status: TenantStatus): Promise<number>;

  /**
   * 检查租户代码是否唯一
   *
   * @description 检查租户代码是否已被使用
   *
   * @param code - 租户代码
   * @param excludeId - 排除的租户ID（用于更新时检查）
   * @returns 是否唯一
   */
  isCodeUnique(code: string, excludeId?: EntityId): Promise<boolean>;

  /**
   * 检查租户名称是否唯一
   *
   * @description 检查租户名称是否已被使用
   *
   * @param name - 租户名称
   * @param excludeId - 排除的租户ID（用于更新时检查）
   * @returns 是否唯一
   */
  isNameUnique(name: string, excludeId?: EntityId): Promise<boolean>;

  /**
   * 获取租户资源使用情况
   *
   * @description 获取租户当前的资源使用情况
   *
   * @param tenantId - 租户ID
   * @returns 资源使用情况
   */
  getResourceUsage(tenantId: EntityId): Promise<TenantResourceUsage>;

  /**
   * 获取租户资源限制
   *
   * @description 获取租户的资源限制配置
   *
   * @param tenantId - 租户ID
   * @returns 资源限制
   */
  getResourceLimits(tenantId: EntityId): Promise<TenantResourceLimits>;

  /**
   * 更新租户资源使用情况
   *
   * @description 更新租户的资源使用情况
   *
   * @param tenantId - 租户ID
   * @param usage - 资源使用情况
   * @returns 更新操作的Promise
   */
  updateResourceUsage(tenantId: EntityId, usage: TenantResourceUsage): Promise<void>;

  /**
   * 检查租户是否可以创建新用户
   *
   * @description 检查租户是否还有用户配额
   *
   * @param tenantId - 租户ID
   * @returns 是否可以创建新用户
   */
  canCreateUser(tenantId: EntityId): Promise<boolean>;

  /**
   * 检查租户是否可以创建新组织
   *
   * @description 检查租户是否还有组织配额
   *
   * @param tenantId - 租户ID
   * @returns 是否可以创建新组织
   */
  canCreateOrganization(tenantId: EntityId): Promise<boolean>;

  /**
   * 检查租户是否可以执行API调用
   *
   * @description 检查租户是否还有API调用配额
   *
   * @param tenantId - 租户ID
   * @returns 是否可以执行API调用
   */
  canMakeApiCall(tenantId: EntityId): Promise<boolean>;

  /**
   * 查找租户的所有用户
   *
   * @description 查找租户下的所有用户
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项
   * @returns 用户ID列表
   */
  findTenantUsers(tenantId: EntityId, options?: IRepositoryQueryOptions): Promise<EntityId[]>;

  /**
   * 查找租户的所有组织
   *
   * @description 查找租户下的所有组织
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项
   * @returns 组织ID列表
   */
  findTenantOrganizations(tenantId: EntityId, options?: IRepositoryQueryOptions): Promise<EntityId[]>;

  /**
   * 查找租户的所有部门
   *
   * @description 查找租户下的所有部门
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项
   * @returns 部门ID列表
   */
  findTenantDepartments(tenantId: EntityId, options?: IRepositoryQueryOptions): Promise<EntityId[]>;

  /**
   * 统计租户用户数量
   *
   * @description 统计租户下的用户数量
   *
   * @param tenantId - 租户ID
   * @returns 用户数量
   */
  countTenantUsers(tenantId: EntityId): Promise<number>;

  /**
   * 统计租户组织数量
   *
   * @description 统计租户下的组织数量
   *
   * @param tenantId - 租户ID
   * @returns 组织数量
   */
  countTenantOrganizations(tenantId: EntityId): Promise<number>;

  /**
   * 统计租户部门数量
   *
   * @description 统计租户下的部门数量
   *
   * @param tenantId - 租户ID
   * @returns 部门数量
   */
  countTenantDepartments(tenantId: EntityId): Promise<number>;

  /**
   * 查找租户管理员
   *
   * @description 查找租户的管理员用户
   *
   * @param tenantId - 租户ID
   * @returns 用户ID列表
   */
  findTenantAdmins(tenantId: EntityId): Promise<EntityId[]>;

  /**
   * 检查租户是否达到用户限制
   *
   * @description 检查租户是否达到最大用户数限制
   *
   * @param tenantId - 租户ID
   * @returns 是否达到限制
   */
  isUserLimitReached(tenantId: EntityId): Promise<boolean>;

  /**
   * 检查租户是否达到组织限制
   *
   * @description 检查租户是否达到最大组织数限制
   *
   * @param tenantId - 租户ID
   * @returns 是否达到限制
   */
  isOrganizationLimitReached(tenantId: EntityId): Promise<boolean>;

  /**
   * 检查租户是否达到存储限制
   *
   * @description 检查租户是否达到最大存储空间限制
   *
   * @param tenantId - 租户ID
   * @returns 是否达到限制
   */
  isStorageLimitReached(tenantId: EntityId): Promise<boolean>;

  /**
   * 检查租户是否达到API调用限制
   *
   * @description 检查租户是否达到最大API调用次数限制
   *
   * @param tenantId - 租户ID
   * @returns 是否达到限制
   */
  isApiCallLimitReached(tenantId: EntityId): Promise<boolean>;
}

/**
 * 租户资源使用情况
 *
 * @description 定义租户当前的资源使用情况
 *
 * @since 1.0.0
 */
export interface TenantResourceUsage {
  /** 用户数量 */
  userCount: number;
  /** 组织数量 */
  organizationCount: number;
  /** 部门数量 */
  departmentCount: number;
  /** 存储使用量（MB） */
  storageUsed: number;
  /** 今日API调用次数 */
  apiCallsToday: number;
  /** 本月API调用次数 */
  apiCallsThisMonth: number;
  /** 最后更新时间 */
  lastUpdated: Date;
}

/**
 * 租户资源限制
 *
 * @description 定义租户的资源限制配置
 *
 * @since 1.0.0
 */
export interface TenantResourceLimits {
  /** 最大用户数 */
  maxUsers: number;
  /** 最大组织数 */
  maxOrganizations: number;
  /** 最大部门数 */
  maxDepartments: number;
  /** 最大存储空间（MB） */
  maxStorage: number;
  /** 最大API调用次数（每日） */
  maxApiCallsPerDay: number;
  /** 最大API调用次数（每月） */
  maxApiCallsPerMonth: number;
  /** 是否启用限制 */
  limitsEnabled: boolean;
}

/**
 * 租户仓储Token
 *
 * @description 用于依赖注入的Token
 *
 * @since 1.0.0
 */
export const TENANT_REPOSITORY_TOKEN = Symbol('ITenantRepository');
