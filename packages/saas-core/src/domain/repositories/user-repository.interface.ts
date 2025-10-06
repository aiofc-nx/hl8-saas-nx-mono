/**
 * 用户聚合根仓储接口
 *
 * @description 用户聚合根的数据访问接口
 * 遵循 hybrid-archi 的 IAggregateRepository 设计模式
 *
 * ## 业务规则
 *
 * ### 用户仓储职责
 * - 管理用户聚合根的完整生命周期
 * - 处理用户相关的领域事件存储和发布
 * - 确保用户聚合边界内的一致性
 * - 支持多租户数据隔离
 *
 * ### 用户查询规则
 * - 查询应该基于业务概念而非技术实现
 * - 查询应该返回完整的用户聚合根
 * - 查询应该支持业务级别的过滤和排序
 * - 查询应该处理数据不存在的情况
 *
 * ### 用户持久化规则
 * - 保存操作应该是原子性的
 * - 应该处理并发冲突
 * - 应该验证数据完整性
 * - 应该支持事务操作
 *
 * @example
 * ```typescript
 * // 在应用层使用
 * @Injectable()
 * export class UserApplicationService {
 *   constructor(
 *     @Inject(USER_REPOSITORY_TOKEN)
 *     private readonly userRepository: IUserRepository
 *   ) {}
 * 
 *   async createUser(command: CreateUserCommand): Promise<UserId> {
 *     const user = UserAggregate.create(...);
 *     await this.userRepository.saveWithEvents(user);
 *     return user.getUserId();
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
import { UserAggregate } from '../user/aggregates/user.aggregate';
import { UserRole } from '@hl8/hybrid-archi';
import { UserStatus } from '@hl8/hybrid-archi';

/**
 * 用户聚合根仓储接口
 *
 * @description 定义用户聚合根数据访问的所有操作
 * 继承自 hybrid-archi 的 IAggregateRepository，提供完整的聚合根管理能力
 *
 * @since 1.0.0
 */
export interface IUserRepository extends IAggregateRepository<UserAggregate, EntityId> {
  /**
   * 根据邮箱查找用户
   *
   * @description 根据邮箱地址查找用户
   *
   * @param email - 用户邮箱
   * @param tenantId - 租户ID（可选）
   * @returns 用户聚合根或null
   *
   * @example
   * ```typescript
   * const user = await userRepository.findByEmail('user@example.com', tenantId);
   * ```
   */
  findByEmail(email: string, tenantId?: EntityId): Promise<UserAggregate | null>;

  /**
   * 根据用户名查找用户
   *
   * @description 根据用户名查找用户
   *
   * @param username - 用户名
   * @param tenantId - 租户ID（可选）
   * @returns 用户聚合根或null
   */
  findByUsername(username: string, tenantId?: EntityId): Promise<UserAggregate | null>;

  /**
   * 根据邮箱和租户查找用户
   *
   * @description 在指定租户下根据邮箱查找用户
   *
   * @param email - 用户邮箱
   * @param tenantId - 租户ID
   * @returns 用户聚合根或null
   */
  findByEmailAndTenant(email: string, tenantId: EntityId): Promise<UserAggregate | null>;

  /**
   * 根据用户名和租户查找用户
   *
   * @description 在指定租户下根据用户名查找用户
   *
   * @param username - 用户名
   * @param tenantId - 租户ID
   * @returns 用户聚合根或null
   */
  findByUsernameAndTenant(username: string, tenantId: EntityId): Promise<UserAggregate | null>;

  /**
   * 根据租户查找用户
   *
   * @description 查找指定租户下的所有用户
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findByTenant(tenantId: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 根据租户分页查找用户
   *
   * @description 分页查找指定租户下的用户
   *
   * @param tenantId - 租户ID
   * @param options - 查询选项
   * @returns 分页结果
   */
  findPaginatedByTenant(tenantId: EntityId, options: IRepositoryQueryOptions): Promise<IPaginatedResult<UserAggregate>>;

  /**
   * 根据用户角色查找用户
   *
   * @description 查找指定角色的用户
   *
   * @param role - 用户角色
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findByRole(role: UserRole, tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 根据用户状态查找用户
   *
   * @description 查找指定状态的用户
   *
   * @param status - 用户状态
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findByStatus(status: UserStatus, tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 查找活跃用户
   *
   * @description 查找所有活跃状态的用户
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findActiveUsers(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 查找管理员用户
   *
   * @description 查找所有管理员角色的用户
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findAdminUsers(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 查找普通用户
   *
   * @description 查找所有普通角色的用户
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findRegularUsers(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 统计租户用户数量
   *
   * @description 统计指定租户下的用户数量
   *
   * @param tenantId - 租户ID
   * @returns 用户数量
   */
  countByTenant(tenantId: EntityId): Promise<number>;

  /**
   * 统计用户角色数量
   *
   * @description 统计指定角色的用户数量
   *
   * @param role - 用户角色
   * @param tenantId - 租户ID（可选）
   * @returns 用户数量
   */
  countByRole(role: UserRole, tenantId?: EntityId): Promise<number>;

  /**
   * 统计用户状态数量
   *
   * @description 统计指定状态的用户数量
   *
   * @param status - 用户状态
   * @param tenantId - 租户ID（可选）
   * @returns 用户数量
   */
  countByStatus(status: UserStatus, tenantId?: EntityId): Promise<number>;

  /**
   * 检查邮箱是否唯一
   *
   * @description 检查邮箱是否已被使用
   *
   * @param email - 用户邮箱
   * @param tenantId - 租户ID（可选）
   * @param excludeId - 排除的用户ID（用于更新时检查）
   * @returns 是否唯一
   */
  isEmailUnique(email: string, tenantId?: EntityId, excludeId?: EntityId): Promise<boolean>;

  /**
   * 检查用户名是否唯一
   *
   * @description 检查用户名是否已被使用
   *
   * @param username - 用户名
   * @param tenantId - 租户ID（可选）
   * @param excludeId - 排除的用户ID（用于更新时检查）
   * @returns 是否唯一
   */
  isUsernameUnique(username: string, tenantId?: EntityId, excludeId?: EntityId): Promise<boolean>;

  /**
   * 验证用户认证
   *
   * @description 验证用户邮箱和密码
   *
   * @param email - 用户邮箱
   * @param password - 用户密码
   * @param tenantId - 租户ID（可选）
   * @returns 用户聚合根或null
   */
  authenticateUser(email: string, password: string, tenantId?: EntityId): Promise<UserAggregate | null>;

  /**
   * 查找用户所属的组织
   *
   * @description 查找用户所属的所有组织
   *
   * @param userId - 用户ID
   * @returns 组织ID列表
   */
  findUserOrganizations(userId: EntityId): Promise<EntityId[]>;

  /**
   * 查找用户所属的部门
   *
   * @description 查找用户所属的所有部门
   *
   * @param userId - 用户ID
   * @returns 部门ID列表
   */
  findUserDepartments(userId: EntityId): Promise<EntityId[]>;

  /**
   * 检查用户是否属于指定组织
   *
   * @description 检查用户是否属于指定组织
   *
   * @param userId - 用户ID
   * @param organizationId - 组织ID
   * @returns 是否属于该组织
   */
  isUserInOrganization(userId: EntityId, organizationId: EntityId): Promise<boolean>;

  /**
   * 检查用户是否属于指定部门
   *
   * @description 检查用户是否属于指定部门
   *
   * @param userId - 用户ID
   * @param departmentId - 部门ID
   * @returns 是否属于该部门
   */
  isUserInDepartment(userId: EntityId, departmentId: EntityId): Promise<boolean>;

  /**
   * 查找租户管理员
   *
   * @description 查找指定租户的所有管理员
   *
   * @param tenantId - 租户ID
   * @returns 用户聚合根列表
   */
  findTenantAdmins(tenantId: EntityId): Promise<UserAggregate[]>;

  /**
   * 查找组织管理员
   *
   * @description 查找指定组织的管理员
   *
   * @param organizationId - 组织ID
   * @returns 用户聚合根列表
   */
  findOrganizationAdmins(organizationId: EntityId): Promise<UserAggregate[]>;

  /**
   * 查找部门管理员
   *
   * @description 查找指定部门的管理员
   *
   * @param departmentId - 部门ID
   * @returns 用户聚合根列表
   */
  findDepartmentAdmins(departmentId: EntityId): Promise<UserAggregate[]>;

  /**
   * 查找待激活用户
   *
   * @description 查找所有待激活状态的用户
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findPendingUsers(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 查找被暂停用户
   *
   * @description 查找所有被暂停状态的用户
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findSuspendedUsers(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;

  /**
   * 查找被禁用用户
   *
   * @description 查找所有被禁用状态的用户
   *
   * @param tenantId - 租户ID（可选）
   * @param options - 查询选项
   * @returns 用户聚合根列表
   */
  findDisabledUsers(tenantId?: EntityId, options?: IRepositoryQueryOptions): Promise<UserAggregate[]>;
}

/**
 * 用户仓储Token
 *
 * @description 用于依赖注入的Token
 *
 * @since 1.0.0
 */
export const USER_REPOSITORY_TOKEN = Symbol('IUserRepository');
