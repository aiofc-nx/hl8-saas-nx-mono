/**
 * 组织聚合根仓储接口
 *
 * @description 组织聚合根的数据访问接口
 * 遵循 hybrid-archi 的 IAggregateRepository 设计模式
 *
 * ## 业务规则
 *
 * ### 组织仓储职责
 * - 管理组织聚合根的完整生命周期
 * - 处理组织相关的领域事件存储和发布
 * - 确保组织聚合边界内的一致性
 * - 支持多租户数据隔离
 *
 * ### 组织查询规则
 * - 查询应该基于业务概念而非技术实现
 * - 查询应该返回完整的组织聚合根
 * - 查询应该支持业务级别的过滤和排序
 * - 查询应该处理数据不存在的情况
 *
 * ### 组织持久化规则
 * - 保存操作应该是原子性的
 * - 应该处理并发冲突
 * - 应该验证数据完整性
 * - 应该支持事务操作
 *
 * @example
 * ```typescript
 * // 在应用层使用
 * @Injectable()
 * export class OrganizationApplicationService {
 *   constructor(
 *     @Inject(ORGANIZATION_REPOSITORY_TOKEN)
 *     private readonly organizationRepository: IOrganizationRepository
 *   ) {}
 * 
 *   async createOrganization(command: CreateOrganizationCommand): Promise<OrganizationId> {
 *     const organization = OrganizationAggregate.create(...);
 *     await this.organizationRepository.saveWithEvents(organization);
 *     return organization.getOrganizationId();
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
import { OrganizationAggregate } from '../organization/aggregates/organization.aggregate';
import { OrganizationType } from '../organization/value-objects/organization-type.vo';
import { OrganizationStatus } from '@hl8/hybrid-archi';
import { ISpecification } from '../specifications/organization-specifications';

/**
 * 组织聚合根仓储接口
 *
 * @description 定义组织聚合根数据访问的所有操作
 * 继承自 hybrid-archi 的 IAggregateRepository，提供完整的聚合根管理能力
 *
 * @since 1.0.0
 */
export interface IOrganizationRepository extends IAggregateRepository<OrganizationAggregate, EntityId> {
  /**
   * 根据租户查找组织
   *
   * @description 查找指定租户下的所有组织
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项
   * @returns 组织聚合根列表
   *
   * @example
   * ```typescript
   * const organizations = await organizationRepository.findByTenant(tenantId, {
   *   page: 1,
   *   limit: 10,
   *   sortBy: 'createdAt',
   *   sortOrder: 'desc'
   * });
   * ```
   */
  findByTenant(tenantId: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 根据租户分页查找组织
   *
   * @description 分页查找指定租户下的组织
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项
   * @returns 分页结果
   */
  findPaginatedByTenant(tenantId: EntityId, options: IRepositoryQueryOptions): Promise<IPaginatedResult<OrganizationAggregate>>;

  /**
   * 根据组织类型查找组织
   *
   * @description 查找指定类型的组织
   *
   * @param type - 组织类型
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 组织聚合根列表
   */
  findByType(type: OrganizationType, tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 根据组织状态查找组织
   *
   * @description 查找指定状态的组织
   *
   * @param status - 组织状态
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 组织聚合根列表
   */
  findByStatus(status: OrganizationStatus, tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 根据管理员查找组织
   *
   * @description 查找指定管理员管理的组织
   *
   * @param adminId - 管理员用户ID
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 组织聚合根列表
   */
  findByAdmin(adminId: string, tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 查找活跃组织
   *
   * @description 查找所有活跃状态的组织
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 组织聚合根列表
   */
  findActiveOrganizations(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 查找管理部门
   *
   * @description 查找具有管理部门能力的组织
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 组织聚合根列表
   */
  findDepartmentManagementCapable(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 查找管理用户
   *
   * @description 查找具有管理用户能力的组织
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 组织聚合根列表
   */
  findUserManagementCapable(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 查找管理预算
   *
   * @description 查找具有管理预算能力的组织
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 组织聚合根列表
   */
  findBudgetManagementCapable(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 根据规约查找组织
   *
   * @description 使用规约模式查找满足条件的组织
   *
   * @param specification - 组织规约
   * @param options - 查询选项
   * @returns 组织聚合根列表
   *
   * @example
   * ```typescript
   * const activeCommitteeSpec = new ActiveOrganizationSpecification()
   *   .and(new CommitteeOrganizationSpecification());
   * 
   * const organizations = await organizationRepository.findBySpecification(
   *   activeCommitteeSpec,
   *   { page: 1, limit: 10 }
   * );
   * ```
   */
  findBySpecification(specification: ISpecification<OrganizationAggregate>, options?: IRepositoryQueryOptions): Promise<OrganizationAggregate[]>;

  /**
   * 根据规约分页查找组织
   *
   * @description 使用规约模式分页查找满足条件的组织
   *
   * @param specification - 组织规约
   * @param options - 查询选项
   * @returns 分页结果
   */
  findPaginatedBySpecification(specification: ISpecification<OrganizationAggregate>, options: IRepositoryQueryOptions): Promise<IPaginatedResult<OrganizationAggregate>>;

  /**
   * 统计租户组织数量
   *
   * @description 统计指定租户下的组织数量
   *
   * @param tenantId - 租户ID
   * @returns 组织数量
   */
  countByTenant(tenantId: EntityId): Promise<number>;

  /**
   * 统计组织类型数量
   *
   * @description 统计指定类型的组织数量
   *
   * @param type - 组织类型
   * @param tenantId - 租户ID（可选）
   * @returns 组织数量
   */
  countByType(type: OrganizationType, tenantId?: EntityId): Promise<number>;

  /**
   * 统计组织状态数量
   *
   * @description 统计指定状态的组织数量
   *
   * @param status - 组织状态
   * @param tenantId - 租户ID（可选）
   * @returns 组织数量
   */
  countByStatus(status: OrganizationStatus, tenantId?: EntityId): Promise<number>;

  /**
   * 检查组织名称是否唯一
   *
   * @description 检查指定租户下组织名称是否唯一
   *
   * @param name - 组织名称
   * @param tenantId - 租户ID
   * @param excludeId - 排除的组织ID（用于更新时检查）
   * @returns 是否唯一
   */
  isNameUnique(name: string, tenantId: EntityId, excludeId?: EntityId): Promise<boolean>;

  /**
   * 检查管理员是否已管理其他组织
   *
   * @description 检查指定管理员是否已经管理其他组织
   *
   * @param adminId - 管理员用户ID
   * @param tenantId - 租户ID
   * @param excludeId - 排除的组织ID（用于更新时检查）
   * @returns 是否已管理其他组织
   */
  isAdminManagingOtherOrganizations(adminId: string, tenantId: EntityId, excludeId?: EntityId): Promise<boolean>;

  /**
   * 查找组织管理的部门
   *
   * @description 查找指定组织管理的所有部门
   *
   * @param organizationId - 组织ID
   * @returns 部门ID列表
   */
  findManagedDepartments(organizationId: EntityId): Promise<EntityId[]>;

  /**
   * 检查组织是否管理指定部门
   *
   * @description 检查组织是否管理指定部门
   *
   * @param organizationId - 组织ID
   * @param departmentId - 部门ID
   * @returns 是否管理该部门
   */
  isManagingDepartment(organizationId: EntityId, departmentId: EntityId): Promise<boolean>;

  /**
   * 查找租户下的活跃委员会
   *
   * @description 查找指定租户下的所有活跃委员会
   *
   * @param tenantId - 租户ID
   * @returns 组织聚合根列表
   */
  findActiveCommitteesByTenant(tenantId: EntityId): Promise<OrganizationAggregate[]>;

  /**
   * 查找租户下的项目管理团队
   *
   * @description 查找指定租户下的所有项目管理团队
   *
   * @param tenantId - 租户ID
   * @returns 组织聚合根列表
   */
  findProjectTeamsByTenant(tenantId: EntityId): Promise<OrganizationAggregate[]>;

  /**
   * 查找租户下的质量控制小组
   *
   * @description 查找指定租户下的所有质量控制小组
   *
   * @param tenantId - 租户ID
   * @returns 组织聚合根列表
   */
  findQualityGroupsByTenant(tenantId: EntityId): Promise<OrganizationAggregate[]>;

  /**
   * 查找租户下的绩效管理小组
   *
   * @description 查找指定租户下的所有绩效管理小组
   *
   * @param tenantId - 租户ID
   * @returns 组织聚合根列表
   */
  findPerformanceGroupsByTenant(tenantId: EntityId): Promise<OrganizationAggregate[]>;
}

/**
 * 组织仓储Token
 *
 * @description 用于依赖注入的Token
 *
 * @since 1.0.0
 */
export const ORGANIZATION_REPOSITORY_TOKEN = Symbol('IOrganizationRepository');
