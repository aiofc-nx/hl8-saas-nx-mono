/**
 * 组织领域规约
 *
 * @description 组织相关的领域规约（Specifications）
 * 规约模式用于封装复杂的业务规则和查询条件
 *
 * ## 规约模式
 *
 * ### 规约的作用
 * - 封装复杂的业务规则
 * - 提供可组合的查询条件
 * - 实现业务规则的复用
 * - 支持规约的组合和逻辑运算
 *
 * ### 规约的设计原则
 * - 单一职责：每个规约只负责一个业务规则
 * - 可组合性：规约可以组合成更复杂的规约
 * - 可测试性：规约可以独立测试
 * - 可读性：规约名称清晰表达业务意图
 *
 * @example
 * ```typescript
 * // 创建规约
 * const activeOrgSpec = new ActiveOrganizationSpecification();
 * const committeeSpec = new CommitteeOrganizationSpecification();
 * 
 * // 组合规约
 * const activeCommitteeSpec = activeOrgSpec.and(committeeSpec);
 * 
 * // 使用规约
 * const organizations = await organizationRepository.findBySpecification(activeCommitteeSpec);
 * ```
 *
 * @since 1.0.0
 */

import { IDomainService } from '@hl8/hybrid-archi';
import { EntityId } from '@hl8/hybrid-archi';
import { Organization } from '../organization/entities/organization.entity';
import { OrganizationType } from '../organization/value-objects/organization-type.vo';

/**
 * 规约接口
 *
 * @description 定义规约的基础契约
 * 所有规约都必须实现此接口
 *
 * @since 1.0.0
 */
export interface ISpecification<T> {
  /**
   * 检查对象是否满足规约
   *
   * @param candidate - 待检查的对象
   * @returns 是否满足规约
   */
  isSatisfiedBy(candidate: T): boolean;

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string;
}

/**
 * 基础规约
 *
 * @description 规约的基类，提供通用的规约功能
 *
 * @since 1.0.0
 */
export abstract class BaseSpecification<T> implements ISpecification<T> {
  /**
   * 检查对象是否满足规约
   *
   * @param candidate - 待检查的对象
   * @returns 是否满足规约
   */
  abstract isSatisfiedBy(candidate: T): boolean;

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  abstract getDescription(): string;

  /**
   * 逻辑与操作
   *
   * @param other - 另一个规约
   * @returns 组合后的规约
   */
  and(other: ISpecification<T>): ISpecification<T> {
    return new AndSpecification(this, other);
  }

  /**
   * 逻辑或操作
   *
   * @param other - 另一个规约
   * @returns 组合后的规约
   */
  or(other: ISpecification<T>): ISpecification<T> {
    return new OrSpecification(this, other);
  }

  /**
   * 逻辑非操作
   *
   * @returns 取反后的规约
   */
  not(): ISpecification<T> {
    return new NotSpecification(this);
  }
}

/**
 * 活跃组织规约
 *
 * @description 检查组织是否处于活跃状态
 *
 * @since 1.0.0
 */
export class ActiveOrganizationSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足活跃状态规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.isActive();
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '活跃组织规约：组织必须处于活跃状态';
  }
}

/**
 * 委员会组织规约
 *
 * @description 检查组织是否为委员会类型
 *
 * @since 1.0.0
 */
export class CommitteeOrganizationSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足委员会类型规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.getType() === OrganizationType.COMMITTEE;
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '委员会组织规约：组织必须是委员会类型';
  }
}

/**
 * 项目管理团队规约
 *
 * @description 检查组织是否为项目管理团队类型
 *
 * @since 1.0.0
 */
export class ProjectTeamOrganizationSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足项目管理团队类型规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.getType() === OrganizationType.PROJECT_TEAM;
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '项目管理团队规约：组织必须是项目管理团队类型';
  }
}

/**
 * 质量控制小组规约
 *
 * @description 检查组织是否为质量控制小组类型
 *
 * @since 1.0.0
 */
export class QualityGroupOrganizationSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足质量控制小组类型规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.getType() === OrganizationType.QUALITY_GROUP;
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '质量控制小组规约：组织必须是质量控制小组类型';
  }
}

/**
 * 绩效管理小组规约
 *
 * @description 检查组织是否为绩效管理小组类型
 *
 * @since 1.0.0
 */
export class PerformanceGroupOrganizationSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足绩效管理小组类型规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.getType() === OrganizationType.PERFORMANCE_GROUP;
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '绩效管理小组规约：组织必须是绩效管理小组类型';
  }
}

/**
 * 租户组织规约
 *
 * @description 检查组织是否属于指定租户
 *
 * @since 1.0.0
 */
export class TenantOrganizationSpecification extends BaseSpecification<Organization> {
  /**
   * 构造函数
   *
   * @param tenantId - 租户ID
   */
  constructor(private readonly tenantId: EntityId) {
    super();
  }

  /**
   * 检查组织是否满足租户规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.getTenantId().equals(this.tenantId);
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return `租户组织规约：组织必须属于租户 ${this.tenantId.toString()}`;
  }
}

/**
 * 管理部门规约
 *
 * @description 检查组织是否可以管理部门
 *
 * @since 1.0.0
 */
export class DepartmentManagementCapableSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足管理部门规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.canManageDepartments();
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '管理部门规约：组织必须具有管理部门的能力';
  }
}

/**
 * 管理用户规约
 *
 * @description 检查组织是否可以管理用户
 *
 * @since 1.0.0
 */
export class UserManagementCapableSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足管理用户规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.canManageUsers();
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '管理用户规约：组织必须具有管理用户的能力';
  }
}

/**
 * 管理预算规约
 *
 * @description 检查组织是否可以管理预算
 *
 * @since 1.0.0
 */
export class BudgetManagementCapableSpecification extends BaseSpecification<Organization> {
  /**
   * 检查组织是否满足管理预算规约
   *
   * @param organization - 组织实体
   * @returns 是否满足规约
   */
  isSatisfiedBy(organization: Organization): boolean {
    return organization.canManageBudget();
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return '管理预算规约：组织必须具有管理预算的能力';
  }
}

/**
 * 与规约
 *
 * @description 实现逻辑与操作的规约组合
 *
 * @since 1.0.0
 */
export class AndSpecification<T> extends BaseSpecification<T> {
  /**
   * 构造函数
   *
   * @param left - 左规约
   * @param right - 右规约
   */
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>
  ) {
    super();
  }

  /**
   * 检查对象是否满足与规约
   *
   * @param candidate - 待检查的对象
   * @returns 是否满足规约
   */
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return `(${this.left.getDescription()}) AND (${this.right.getDescription()})`;
  }
}

/**
 * 或规约
 *
 * @description 实现逻辑或操作的规约组合
 *
 * @since 1.0.0
 */
export class OrSpecification<T> extends BaseSpecification<T> {
  /**
   * 构造函数
   *
   * @param left - 左规约
   * @param right - 右规约
   */
  constructor(
    private readonly left: ISpecification<T>,
    private readonly right: ISpecification<T>
  ) {
    super();
  }

  /**
   * 检查对象是否满足或规约
   *
   * @param candidate - 待检查的对象
   * @returns 是否满足规约
   */
  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return `(${this.left.getDescription()}) OR (${this.right.getDescription()})`;
  }
}

/**
 * 非规约
 *
 * @description 实现逻辑非操作的规约组合
 *
 * @since 1.0.0
 */
export class NotSpecification<T> extends BaseSpecification<T> {
  /**
   * 构造函数
   *
   * @param specification - 要取反的规约
   */
  constructor(private readonly specification: ISpecification<T>) {
    super();
  }

  /**
   * 检查对象是否满足非规约
   *
   * @param candidate - 待检查的对象
   * @returns 是否满足规约
   */
  isSatisfiedBy(candidate: T): boolean {
    return !this.specification.isSatisfiedBy(candidate);
  }

  /**
   * 获取规约描述
   *
   * @returns 规约描述
   */
  getDescription(): string {
    return `NOT (${this.specification.getDescription()})`;
  }
}

/**
 * 组织规约工厂
 *
 * @description 提供组织规约的工厂方法
 * 简化规约的创建和使用
 *
 * @since 1.0.0
 */
export class OrganizationSpecificationFactory implements IDomainService {
  /**
   * 构造函数
   *
   * @since 1.0.0
   */
  constructor() {
    // IDomainService 是接口，不需要调用 super()
  }

  /**
   * 获取服务名称
   *
   * @returns 服务名称
   */
  public getServiceName(): string {
    return 'OrganizationSpecificationFactory';
  }

  /**
   * 创建活跃组织规约
   *
   * @returns 活跃组织规约
   */
  createActiveOrganizationSpecification(): ActiveOrganizationSpecification {
    return new ActiveOrganizationSpecification();
  }

  /**
   * 创建委员会组织规约
   *
   * @returns 委员会组织规约
   */
  createCommitteeOrganizationSpecification(): CommitteeOrganizationSpecification {
    return new CommitteeOrganizationSpecification();
  }

  /**
   * 创建项目管理团队规约
   *
   * @returns 项目管理团队规约
   */
  createProjectTeamOrganizationSpecification(): ProjectTeamOrganizationSpecification {
    return new ProjectTeamOrganizationSpecification();
  }

  /**
   * 创建质量控制小组规约
   *
   * @returns 质量控制小组规约
   */
  createQualityGroupOrganizationSpecification(): QualityGroupOrganizationSpecification {
    return new QualityGroupOrganizationSpecification();
  }

  /**
   * 创建绩效管理小组规约
   *
   * @returns 绩效管理小组规约
   */
  createPerformanceGroupOrganizationSpecification(): PerformanceGroupOrganizationSpecification {
    return new PerformanceGroupOrganizationSpecification();
  }

  /**
   * 创建租户组织规约
   *
   * @param tenantId - 租户ID
   * @returns 租户组织规约
   */
  createTenantOrganizationSpecification(tenantId: EntityId): TenantOrganizationSpecification {
    return new TenantOrganizationSpecification(tenantId);
  }

  /**
   * 创建管理部门规约
   *
   * @returns 管理部门规约
   */
  createDepartmentManagementCapableSpecification(): DepartmentManagementCapableSpecification {
    return new DepartmentManagementCapableSpecification();
  }

  /**
   * 创建管理用户规约
   *
   * @returns 管理用户规约
   */
  createUserManagementCapableSpecification(): UserManagementCapableSpecification {
    return new UserManagementCapableSpecification();
  }

  /**
   * 创建管理预算规约
   *
   * @returns 管理预算规约
   */
  createBudgetManagementCapableSpecification(): BudgetManagementCapableSpecification {
    return new BudgetManagementCapableSpecification();
  }

  /**
   * 创建活跃委员会规约
   *
   * @description 组合规约：活跃组织 AND 委员会组织
   *
   * @returns 活跃委员会规约
   */
  createActiveCommitteeSpecification(): ISpecification<Organization> {
    return this.createActiveOrganizationSpecification()
      .and(this.createCommitteeOrganizationSpecification());
  }

  /**
   * 创建租户活跃组织规约
   *
   * @description 组合规约：租户组织 AND 活跃组织
   *
   * @param tenantId - 租户ID
   * @returns 租户活跃组织规约
   */
  createTenantActiveOrganizationSpecification(tenantId: EntityId): ISpecification<Organization> {
    return this.createTenantOrganizationSpecification(tenantId)
      .and(this.createActiveOrganizationSpecification());
  }

  /**
   * 创建管理部门规约
   *
   * @description 组合规约：活跃组织 AND 管理部门能力
   *
   * @returns 管理部门规约
   */
  createActiveDepartmentManagementSpecification(): ISpecification<Organization> {
    return this.createActiveOrganizationSpecification()
      .and(this.createDepartmentManagementCapableSpecification());
  }
}
