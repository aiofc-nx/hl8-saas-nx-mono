/**
 * 租户聚合根仓储接口
 *
 * @description 定义租户聚合根的持久化操作契约
 *
 * ## 业务规则
 *
 * ### 仓储职责
 * - 保存和加载租户聚合根
 * - 查询租户（按ID、代码、域名）
 * - 保证事务一致性
 * - 发布领域事件
 *
 * ### 实现要求
 * - 在基础设施层实现此接口
 * - 使用 MikroORM 进行持久化
 * - 使用映射器转换领域模型和ORM实体
 * - 保存时发布所有未提交的领域事件
 *
 * @example
 * ```typescript
 * // 应用层使用
 * class CreateTenantUseCase {
 *   constructor(
 *     private readonly tenantRepository: ITenantAggregateRepository
 *   ) {}
 *
 *   async execute(command: CreateTenantCommand): Promise<void> {
 *     const aggregate = TenantAggregate.create(...);
 *     await this.tenantRepository.save(aggregate);
 *   }
 * }
 * ```
 *
 * @interface ITenantAggregateRepository
 * @since 1.0.0
 */

import { TenantAggregate } from '../aggregates/tenant.aggregate';
import { TenantCode } from '../value-objects/tenant-code.vo';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { EntityId } from '@hl8/hybrid-archi';

/**
 * 租户聚合根仓储接口
 *
 * @interface ITenantAggregateRepository
 */
export interface ITenantAggregateRepository {
  /**
   * 保存租户聚合根
   *
   * @description 持久化租户聚合根及其内部实体
   *
   * ## 业务规则
   * 1. 在事务中保存所有实体
   * 2. 发布聚合根的所有领域事件
   * 3. 更新版本号（乐观锁）
   * 4. 保存成功后清空事件队列
   *
   * @async
   * @param {TenantAggregate} aggregate - 租户聚合根
   * @returns {Promise<void>}
   * @throws {Error} 当保存失败或版本冲突时抛出错误
   */
  save(aggregate: TenantAggregate): Promise<void>;

  /**
   * 根据ID查找租户聚合根
   *
   * @description 从数据库加载租户聚合根
   *
   * @async
   * @param {EntityId} id - 租户ID
   * @returns {Promise<TenantAggregate | null>} 租户聚合根或null
   */
  findById(id: EntityId): Promise<TenantAggregate | null>;

  /**
   * 根据租户代码查找
   *
   * @description 通过租户代码查找租户（用于唯一性验证）
   *
   * @async
   * @param {TenantCode} code - 租户代码
   * @returns {Promise<TenantAggregate | null>} 租户聚合根或null
   */
  findByCode(code: TenantCode): Promise<TenantAggregate | null>;

  /**
   * 根据租户域名查找
   *
   * @description 通过租户域名查找租户（用于唯一性验证）
   *
   * @async
   * @param {TenantDomain} domain - 租户域名
   * @returns {Promise<TenantAggregate | null>} 租户聚合根或null
   */
  findByDomain(domain: TenantDomain): Promise<TenantAggregate | null>;

  /**
   * 查找所有租户
   *
   * @description 获取租户列表（支持分页）
   *
   * @async
   * @param {number} offset - 偏移量
   * @param {number} limit - 限制数量
   * @returns {Promise<TenantAggregate[]>} 租户聚合根数组
   */
  findAll(offset?: number, limit?: number): Promise<TenantAggregate[]>;

  /**
   * 删除租户聚合根
   *
   * @description 软删除租户（实际是更新 deletedAt 字段）
   *
   * @async
   * @param {EntityId} id - 租户ID
   * @param {string} deletedBy - 删除人ID
   * @param {string} reason - 删除原因
   * @returns {Promise<void>}
   */
  delete(id: EntityId, deletedBy: string, reason: string): Promise<void>;

  /**
   * 检查租户代码是否存在
   *
   * @description 用于创建租户前的唯一性验证
   *
   * @async
   * @param {TenantCode} code - 租户代码
   * @returns {Promise<boolean>} 是否存在
   */
  existsByCode(code: TenantCode): Promise<boolean>;

  /**
   * 检查租户域名是否存在
   *
   * @description 用于创建租户前的唯一性验证
   *
   * @async
   * @param {TenantDomain} domain - 租户域名
   * @returns {Promise<boolean>} 是否存在
   */
  existsByDomain(domain: TenantDomain): Promise<boolean>;

  /**
   * 统计租户数量
   *
   * @description 获取租户总数（用于监控）
   *
   * @async
   * @returns {Promise<number>} 租户总数
   */
  count(): Promise<number>;
}

