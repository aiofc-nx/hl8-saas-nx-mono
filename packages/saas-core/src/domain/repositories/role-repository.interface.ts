/**
 * 角色聚合根仓储接口
 *
 * @description 角色聚合根的数据访问接口
 * 遵循 hybrid-archi 的 IAggregateRepository 设计模式
 *
 * ## 业务规则
 *
 * ### 角色仓储职责
 * - 管理角色聚合根的完整生命周期
 * - 处理角色相关的领域事件存储和发布
 * - 确保角色聚合边界内的一致性
 * - 支持多租户数据隔离
 *
 * ### 角色查询规则
 * - 查询应该基于业务概念而非技术实现
 * - 查询应该返回完整的角色聚合根
 * - 查询应该支持业务级别的过滤和排序
 * - 查询应该处理数据不存在的情况
 *
 * ### 角色持久化规则
 * - 保存操作应该是原子性的
 * - 应该处理并发冲突
 * - 应该验证数据完整性
 * - 应该支持事务操作
 *
 * @example
 * ```typescript
 * // 在应用层使用
 * @Injectable()
 * export class RoleApplicationService {
 *   constructor(
 *     @Inject(ROLE_REPOSITORY_TOKEN)
 *     private readonly roleRepository: IRoleRepository
 *   ) {}
 * 
 *   async createRole(command: CreateRoleCommand): Promise<RoleId> {
 *     const role = RoleAggregate.create(...);
 *     await this.roleRepository.saveWithEvents(role);
 *     return role.getRoleId();
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
import { RoleAggregate } from '../authorization/aggregates/role.aggregate';

/**
 * 角色聚合根仓储接口
 *
 * @description 定义角色聚合根数据访问的所有操作
 * 继承自 hybrid-archi 的 IAggregateRepository，提供完整的聚合根管理能力
 *
 * @since 1.0.0
 */
export interface IRoleRepository extends IAggregateRepository<RoleAggregate, EntityId> {
  /**
   * 根据角色代码查找角色
   *
   * @description 根据角色代码查找角色
   *
   * @param code - 角色代码
   * @returns 角色聚合根或null
   *
   * @example
   * ```typescript
   * const role = await roleRepository.findByCode('TENANT_ADMIN');
   * ```
   */
  findByCode(code: string): Promise<RoleAggregate | null>;

  /**
   * 根据角色名称查找角色
   *
   * @description 根据角色名称查找角色
   *
   * @param name - 角色名称
   * @returns 角色聚合根或null
   */
  findByName(name: string): Promise<RoleAggregate | null>;

  /**
   * 查找系统角色
   *
   * @description 查找所有系统内置角色
   *
   * @param options - 查询选项
   * @returns 角色聚合根列表
   */
  findSystemRoles(options?: IRepositoryQueryOptions): Promise<RoleAggregate[]>;

  /**
   * 查找自定义角色
   *
   * @description 查找所有自定义角色
   *
   * @param options - 查询选项
   * @returns 角色聚合根列表
   */
  findCustomRoles(options?: IRepositoryQueryOptions): Promise<RoleAggregate[]>;

  /**
   * 查找活跃角色
   *
   * @description 查找所有活跃状态的角色
   *
   * @param options - 查询选项
   * @returns 角色聚合根列表
   */
  findActiveRoles(options?: IRepositoryQueryOptions): Promise<RoleAggregate[]>;

  /**
   * 查找停用角色
   *
   * @description 查找所有停用状态的角色
   *
   * @param options - 查询选项
   * @returns 角色聚合根列表
   */
  findInactiveRoles(options?: IRepositoryQueryOptions): Promise<RoleAggregate[]>;

  /**
   * 分页查找角色
   *
   * @description 分页查找角色
   *
   * @param options - 查询选项
   * @returns 分页结果
   */
  findPaginated(options: IRepositoryQueryOptions): Promise<IPaginatedResult<RoleAggregate>>;

  /**
   * 统计系统角色数量
   *
   * @description 统计系统角色的数量
   *
   * @returns 系统角色数量
   */
  countSystemRoles(): Promise<number>;

  /**
   * 统计自定义角色数量
   *
   * @description 统计自定义角色的数量
   *
   * @returns 自定义角色数量
   */
  countCustomRoles(): Promise<number>;

  /**
   * 检查角色代码是否唯一
   *
   * @description 检查角色代码是否已被使用
   *
   * @param code - 角色代码
   * @param excludeId - 排除的角色ID（用于更新时检查）
   * @returns 是否唯一
   */
  isCodeUnique(code: string, excludeId?: EntityId): Promise<boolean>;

  /**
   * 检查角色名称是否唯一
   *
   * @description 检查角色名称是否已被使用
   *
   * @param name - 角色名称
   * @param excludeId - 排除的角色ID（用于更新时检查）
   * @returns 是否唯一
   */
  isNameUnique(name: string, excludeId?: EntityId): Promise<boolean>;

  /**
   * 查找角色继承关系
   *
   * @description 查找角色的父角色继承关系
   *
   * @param roleId - 角色ID
   * @returns 父角色ID列表
   */
  findParentRoles(roleId: EntityId): Promise<EntityId[]>;

  /**
   * 查找角色被继承关系
   *
   * @description 查找继承该角色的子角色
   *
   * @param roleId - 角色ID
   * @returns 子角色ID列表
   */
  findChildRoles(roleId: EntityId): Promise<EntityId[]>;

  /**
   * 检查角色继承循环
   *
   * @description 检查角色继承关系是否存在循环
   *
   * @param roleId - 角色ID
   * @param parentRoleId - 父角色ID
   * @returns 是否存在循环
   */
  hasInheritanceCycle(roleId: EntityId, parentRoleId: EntityId): Promise<boolean>;

  /**
   * 查找角色拥有的权限
   *
   * @description 查找角色拥有的所有权限
   *
   * @param roleId - 角色ID
   * @returns 权限ID列表
   */
  findRolePermissions(roleId: EntityId): Promise<EntityId[]>;

  /**
   * 查找角色继承的权限
   *
   * @description 查找角色通过继承获得的所有权限
   *
   * @param roleId - 角色ID
   * @returns 权限ID列表
   */
  findInheritedPermissions(roleId: EntityId): Promise<EntityId[]>;

  /**
   * 查找角色所有权限
   *
   * @description 查找角色拥有的所有权限（包括继承的权限）
   *
   * @param roleId - 角色ID
   * @returns 权限ID列表
   */
  findAllRolePermissions(roleId: EntityId): Promise<EntityId[]>;

  /**
   * 检查角色是否拥有指定权限
   *
   * @description 检查角色是否拥有指定权限
   *
   * @param roleId - 角色ID
   * @param permissionName - 权限名称
   * @returns 是否拥有权限
   */
  hasPermission(roleId: EntityId, permissionName: string): Promise<boolean>;

  /**
   * 查找使用角色的用户
   *
   * @description 查找使用指定角色的所有用户
   *
   * @param roleId - 角色ID
   * @param options - 查询选项
   * @returns 用户ID列表
   */
  findRoleUsers(roleId: EntityId, options?: IRepositoryQueryOptions): Promise<EntityId[]>;

  /**
   * 统计使用角色的用户数量
   *
   * @description 统计使用指定角色的用户数量
   *
   * @param roleId - 角色ID
   * @returns 用户数量
   */
  countRoleUsers(roleId: EntityId): Promise<number>;

  /**
   * 检查角色是否可以被删除
   *
   * @description 检查角色是否可以被删除（没有用户使用且非系统角色）
   *
   * @param roleId - 角色ID
   * @returns 是否可以删除
   */
  canBeDeleted(roleId: EntityId): Promise<boolean>;

  /**
   * 检查角色是否可以被管理
   *
   * @description 检查角色是否可以被管理（非系统角色）
   *
   * @param roleId - 角色ID
   * @returns 是否可以管理
   */
  canBeManaged(roleId: EntityId): Promise<boolean>;

  /**
   * 查找角色使用情况
   *
   * @description 查找角色的使用情况统计
   *
   * @param roleId - 角色ID
   * @returns 使用情况统计
   */
  findRoleUsage(roleId: EntityId): Promise<RoleUsage>;

  /**
   * 查找所有角色代码
   *
   * @description 获取所有角色的代码列表
   *
   * @returns 角色代码列表
   */
  findAllRoleCodes(): Promise<string[]>;

  /**
   * 查找所有角色名称
   *
   * @description 获取所有角色的名称列表
   *
   * @returns 角色名称列表
   */
  findAllRoleNames(): Promise<string[]>;

  /**
   * 查找用户拥有的角色
   *
   * @description 查找用户拥有的所有角色
   *
   * @param userId - 用户ID
   * @returns 角色聚合根列表
   */
  findUserRoles(userId: EntityId): Promise<RoleAggregate[]>;

  /**
   * 检查用户是否拥有指定角色
   *
   * @description 检查用户是否拥有指定角色
   *
   * @param userId - 用户ID
   * @param roleCode - 角色代码
   * @returns 是否拥有角色
   */
  hasUserRole(userId: EntityId, roleCode: string): Promise<boolean>;

  /**
   * 查找角色层级关系
   *
   * @description 查找角色的完整层级关系
   *
   * @param roleId - 角色ID
   * @returns 角色层级关系
   */
  findRoleHierarchy(roleId: EntityId): Promise<RoleHierarchy>;

  /**
   * 查找根角色
   *
   * @description 查找没有父角色的根角色
   *
   * @param options - 查询选项
   * @returns 角色聚合根列表
   */
  findRootRoles(options?: IRepositoryQueryOptions): Promise<RoleAggregate[]>;

  /**
   * 查找叶子角色
   *
   * @description 查找没有子角色的叶子角色
   *
   * @param options - 查询选项
   * @returns 角色聚合根列表
   */
  findLeafRoles(options?: IRepositoryQueryOptions): Promise<RoleAggregate[]>;
}

/**
 * 角色使用情况
 *
 * @description 定义角色的使用情况统计
 *
 * @since 1.0.0
 */
export interface RoleUsage {
  /** 角色ID */
  roleId: EntityId;
  /** 角色代码 */
  roleCode: string;
  /** 角色名称 */
  roleName: string;
  /** 使用该角色的用户数量 */
  userCount: number;
  /** 角色拥有的权限数量 */
  permissionCount: number;
  /** 最后使用时间 */
  lastUsedAt?: Date;
  /** 使用频率 */
  usageFrequency: number;
}

/**
 * 角色层级关系
 *
 * @description 定义角色的层级关系
 *
 * @since 1.0.0
 */
export interface RoleHierarchy {
  /** 角色ID */
  roleId: EntityId;
  /** 角色代码 */
  roleCode: string;
  /** 角色名称 */
  roleName: string;
  /** 父角色列表 */
  parentRoles: RoleHierarchy[];
  /** 子角色列表 */
  childRoles: RoleHierarchy[];
  /** 层级深度 */
  depth: number;
  /** 是否为根角色 */
  isRoot: boolean;
  /** 是否为叶子角色 */
  isLeaf: boolean;
}

/**
 * 角色仓储Token
 *
 * @description 用于依赖注入的Token
 *
 * @since 1.0.0
 */
export const ROLE_REPOSITORY_TOKEN = Symbol('IRoleRepository');
