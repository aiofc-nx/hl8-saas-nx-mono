/**
 * 权限聚合根仓储接口
 *
 * @description 权限聚合根的数据访问接口
 * 遵循 hybrid-archi 的 IAggregateRepository 设计模式
 *
 * ## 业务规则
 *
 * ### 权限仓储职责
 * - 管理权限聚合根的完整生命周期
 * - 处理权限相关的领域事件存储和发布
 * - 确保权限聚合边界内的一致性
 * - 支持多租户数据隔离
 *
 * ### 权限查询规则
 * - 查询应该基于业务概念而非技术实现
 * - 查询应该返回完整的权限聚合根
 * - 查询应该支持业务级别的过滤和排序
 * - 查询应该处理数据不存在的情况
 *
 * ### 权限持久化规则
 * - 保存操作应该是原子性的
 * - 应该处理并发冲突
 * - 应该验证数据完整性
 * - 应该支持事务操作
 *
 * @example
 * ```typescript
 * // 在应用层使用
 * @Injectable()
 * export class PermissionApplicationService {
 *   constructor(
 *     @Inject(PERMISSION_REPOSITORY_TOKEN)
 *     private readonly permissionRepository: IPermissionRepository
 *   ) {}
 * 
 *   async createPermission(command: CreatePermissionCommand): Promise<PermissionId> {
 *     const permission = PermissionAggregate.create(...);
 *     await this.permissionRepository.saveWithEvents(permission);
 *     return permission.getPermissionId();
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
import { PermissionAggregate } from '../authorization/aggregates/permission.aggregate';
import { PermissionScope } from '../authorization/value-objects/permission.vo';

/**
 * 权限聚合根仓储接口
 *
 * @description 定义权限聚合根数据访问的所有操作
 * 继承自 hybrid-archi 的 IAggregateRepository，提供完整的聚合根管理能力
 *
 * @since 1.0.0
 */
export interface IPermissionRepository extends IAggregateRepository<PermissionAggregate, EntityId> {
  /**
   * 根据权限名称查找权限
   *
   * @description 根据权限名称查找权限
   *
   * @param name - 权限名称
   * @returns 权限聚合根或null
   *
   * @example
   * ```typescript
   * const permission = await permissionRepository.findByName('manage_users');
   * ```
   */
  findByName(name: string): Promise<PermissionAggregate | null>;

  /**
   * 根据资源类型查找权限
   *
   * @description 查找指定资源类型的权限
   *
   * @param resourceType - 资源类型
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findByResourceType(resourceType: string, options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 根据操作类型查找权限
   *
   * @description 查找指定操作类型的权限
   *
   * @param actionType - 操作类型
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findByActionType(actionType: string, options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 根据权限范围查找权限
   *
   * @description 查找指定范围的权限
   *
   * @param scope - 权限范围
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findByScope(scope: PermissionScope, options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 查找系统权限
   *
   * @description 查找所有系统内置权限
   *
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findSystemPermissions(options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 查找自定义权限
   *
   * @description 查找所有自定义权限
   *
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findCustomPermissions(options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 查找活跃权限
   *
   * @description 查找所有活跃状态的权限
   *
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findActivePermissions(options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 查找停用权限
   *
   * @description 查找所有停用状态的权限
   *
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findInactivePermissions(options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 根据权限级别查找权限
   *
   * @description 查找指定级别的权限
   *
   * @param level - 权限级别
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findByLevel(level: number, options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 查找高级别权限
   *
   * @description 查找高级别权限（级别 >= 指定值）
   *
   * @param minLevel - 最小级别
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findHighLevelPermissions(minLevel: number, options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 查找低级别权限
   *
   * @description 查找低级别权限（级别 <= 指定值）
   *
   * @param maxLevel - 最大级别
   * @param options - 查询选项
   * @returns 权限聚合根列表
   */
  findLowLevelPermissions(maxLevel: number, options?: IRepositoryQueryOptions): Promise<PermissionAggregate[]>;

  /**
   * 分页查找权限
   *
   * @description 分页查找权限
   *
   * @param options - 查询选项
   * @returns 分页结果
   */
  findPaginated(options: IRepositoryQueryOptions): Promise<IPaginatedResult<PermissionAggregate>>;

  /**
   * 统计权限类型数量
   *
   * @description 统计指定资源类型的权限数量
   *
   * @param resourceType - 资源类型
   * @returns 权限数量
   */
  countByResourceType(resourceType: string): Promise<number>;

  /**
   * 统计权限范围数量
   *
   * @description 统计指定范围的权限数量
   *
   * @param scope - 权限范围
   * @returns 权限数量
   */
  countByScope(scope: PermissionScope): Promise<number>;

  /**
   * 统计系统权限数量
   *
   * @description 统计系统权限的数量
   *
   * @returns 系统权限数量
   */
  countSystemPermissions(): Promise<number>;

  /**
   * 统计自定义权限数量
   *
   * @description 统计自定义权限的数量
   *
   * @returns 自定义权限数量
   */
  countCustomPermissions(): Promise<number>;

  /**
   * 检查权限名称是否唯一
   *
   * @description 检查权限名称是否已被使用
   *
   * @param name - 权限名称
   * @param excludeId - 排除的权限ID（用于更新时检查）
   * @returns 是否唯一
   */
  isNameUnique(name: string, excludeId?: EntityId): Promise<boolean>;

  /**
   * 检查权限是否存在
   *
   * @description 检查指定名称的权限是否存在
   *
   * @param name - 权限名称
   * @returns 是否存在
   */
  existsByName(name: string): Promise<boolean>;

  /**
   * 查找权限继承关系
   *
   * @description 查找权限的继承关系
   *
   * @param permissionId - 权限ID
   * @returns 继承的权限ID列表
   */
  findInheritedPermissions(permissionId: EntityId): Promise<EntityId[]>;

  /**
   * 查找权限被继承关系
   *
   * @description 查找继承该权限的其他权限
   *
   * @param permissionId - 权限ID
   * @returns 继承该权限的权限ID列表
   */
  findInheritingPermissions(permissionId: EntityId): Promise<EntityId[]>;

  /**
   * 检查权限是否可以继承
   *
   * @description 检查权限是否可以继承
   *
   * @param permissionId - 权限ID
   * @returns 是否可以继承
   */
  canBeInherited(permissionId: EntityId): Promise<boolean>;

  /**
   * 检查权限是否可以管理
   *
   * @description 检查权限是否可以被管理（非系统权限）
   *
   * @param permissionId - 权限ID
   * @returns 是否可以管理
   */
  canBeManaged(permissionId: EntityId): Promise<boolean>;

  /**
   * 查找用户拥有的权限
   *
   * @description 查找用户通过角色拥有的所有权限
   *
   * @param userId - 用户ID
   * @returns 权限聚合根列表
   */
  findUserPermissions(userId: EntityId): Promise<PermissionAggregate[]>;

  /**
   * 查找角色拥有的权限
   *
   * @description 查找角色拥有的所有权限
   *
   * @param roleId - 角色ID
   * @returns 权限聚合根列表
   */
  findRolePermissions(roleId: EntityId): Promise<PermissionAggregate[]>;

  /**
   * 检查用户是否拥有指定权限
   *
   * @description 检查用户是否拥有指定权限
   *
   * @param userId - 用户ID
   * @param permissionName - 权限名称
   * @returns 是否拥有权限
   */
  hasUserPermission(userId: EntityId, permissionName: string): Promise<boolean>;

  /**
   * 检查角色是否拥有指定权限
   *
   * @description 检查角色是否拥有指定权限
   *
   * @param roleId - 角色ID
   * @param permissionName - 权限名称
   * @returns 是否拥有权限
   */
  hasRolePermission(roleId: EntityId, permissionName: string): Promise<boolean>;

  /**
   * 查找权限使用情况
   *
   * @description 查找权限的使用情况统计
   *
   * @param permissionId - 权限ID
   * @returns 使用情况统计
   */
  findPermissionUsage(permissionId: EntityId): Promise<PermissionUsage>;

  /**
   * 查找所有权限名称
   *
   * @description 获取所有权限的名称列表
   *
   * @returns 权限名称列表
   */
  findAllPermissionNames(): Promise<string[]>;

  /**
   * 查找所有资源类型
   *
   * @description 获取所有权限的资源类型列表
   *
   * @returns 资源类型列表
   */
  findAllResourceTypes(): Promise<string[]>;

  /**
   * 查找所有操作类型
   *
   * @description 获取所有权限的操作类型列表
   *
   * @returns 操作类型列表
   */
  findAllActionTypes(): Promise<string[]>;
}

/**
 * 权限使用情况
 *
 * @description 定义权限的使用情况统计
 *
 * @since 1.0.0
 */
export interface PermissionUsage {
  /** 权限ID */
  permissionId: EntityId;
  /** 权限名称 */
  permissionName: string;
  /** 使用该权限的角色数量 */
  roleCount: number;
  /** 使用该权限的用户数量 */
  userCount: number;
  /** 最后使用时间 */
  lastUsedAt?: Date;
  /** 使用频率 */
  usageFrequency: number;
}

/**
 * 权限仓储Token
 *
 * @description 用于依赖注入的Token
 *
 * @since 1.0.0
 */
export const PERMISSION_REPOSITORY_TOKEN = Symbol('IPermissionRepository');
