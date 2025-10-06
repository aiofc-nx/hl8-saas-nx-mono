import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 资源限制属性接口
 *
 * @description 定义租户的各种资源限制
 * -1 表示无限制，其他数值表示具体的限制数量
 *
 * @since 1.0.0
 */
export interface ResourceLimitsProps {
  /**
   * 最大用户数量
   * 
   * @description 租户可以创建的最大用户数量
   * -1 表示无限制
   */
  maxUsers: number;

  /**
   * 最大存储空间（GB）
   * 
   * @description 租户可以使用的最大存储空间
   * -1 表示无限制
   */
  maxStorage: number;

  /**
   * 最大组织数量
   * 
   * @description 租户可以创建的最大组织数量
   * -1 表示无限制
   */
  maxOrganizations: number;

  /**
   * 最大部门数量
   * 
   * @description 租户可以创建的最大部门数量
   * -1 表示无限制
   */
  maxDepartments: number;

  /**
   * 最大API调用次数（每月）
   * 
   * @description 租户每月可以进行的最大API调用次数
   * -1 表示无限制
   */
  maxApiCalls: number;

  /**
   * 最大数据传输量（GB/月）
   * 
   * @description 租户每月可以传输的最大数据量
   * -1 表示无限制
   */
  maxDataTransfer: number;
}

/**
 * 资源限制值对象
 *
 * @description 封装租户的资源限制信息
 * 提供资源限制验证、检查、更新等功能
 *
 * ## 业务规则
 *
 * ### 限制值规则
 * - 所有限制值必须 >= -1
 * - -1 表示无限制
 * - 0 表示完全禁止
 * - 正数表示具体限制
 *
 * ### 资源检查规则
 * - 无限制资源（-1）始终通过检查
 * - 有限制资源需要比较当前使用量与限制值
 * - 使用量达到或超过限制值时检查失败
 *
 * @example
 * ```typescript
 * const limits = ResourceLimits.create({
 *   maxUsers: 100,
 *   maxStorage: 10,
 *   maxOrganizations: 5,
 *   maxDepartments: 20,
 *   maxApiCalls: 10000,
 *   maxDataTransfer: 50
 * });
 * 
 * const isExceeded = limits.isExceeded('maxUsers', 150); // true
 * const hasLimit = limits.hasLimit('maxUsers'); // true
 * ```
 *
 * @since 1.0.0
 */
export class ResourceLimits extends BaseValueObject {
  /**
   * 私有属性存储
   */
  private readonly _props: ResourceLimitsProps;

  /**
   * 私有构造函数
   * 
   * @description 使用工厂方法创建实例
   * 确保数据验证和不变性
   *
   * @param props - 资源限制属性
   */
  private constructor(props: ResourceLimitsProps) {
    super();
    this._props = props;
    this.validate();
  }

  /**
   * 创建资源限制实例
   *
   * @description 工厂方法，创建并验证资源限制实例
   *
   * @param props - 资源限制属性
   * @returns 资源限制实例
   * @throws {InvalidResourceLimitsException} 当限制值无效时抛出异常
   *
   * @example
   * ```typescript
   * const limits = ResourceLimits.create({
   *   maxUsers: 100,
   *   maxStorage: 10,
   *   maxOrganizations: 5,
   *   maxDepartments: 20,
   *   maxApiCalls: 10000,
   *   maxDataTransfer: 50
   * });
   * ```
   *
   * @since 1.0.0
   */
  public static create(props: ResourceLimitsProps): ResourceLimits {
    return new ResourceLimits(props);
  }

  /**
   * 验证资源限制数据
   *
   * @description 验证所有限制值是否符合业务规则
   * 所有限制值必须 >= -1
   *
   * @throws {InvalidResourceLimitsException} 当限制值无效时抛出异常
   *
   * @since 1.0.0
   */
  protected override validate(): void {
    const limits = Object.values(this._props);
    for (const limit of limits) {
      if (typeof limit === 'number' && limit < -1) {
        throw new InvalidResourceLimitsException('资源限制不能小于-1');
      }
    }
  }

  /**
   * 检查是否有限制
   *
   * @description 检查指定资源是否有限制
   * -1 表示无限制，其他值表示有限制
   *
   * @param resource - 资源类型
   * @returns 是否有限制
   *
   * @example
   * ```typescript
   * const hasLimit = limits.hasLimit('maxUsers'); // true
   * const noLimit = limits.hasLimit('maxStorage'); // false (如果值为-1)
   * ```
   *
   * @since 1.0.0
   */
  public hasLimit(resource: keyof ResourceLimitsProps): boolean {
    return this._props[resource] !== -1;
  }

  /**
   * 获取限制值
   *
   * @description 获取指定资源的限制值
   *
   * @param resource - 资源类型
   * @returns 限制值
   *
   * @example
   * ```typescript
   * const limit = limits.getLimit('maxUsers'); // 100
   * ```
   *
   * @since 1.0.0
   */
  public getLimit(resource: keyof ResourceLimitsProps): number {
    return this._props[resource];
  }

  /**
   * 检查是否超过限制
   *
   * @description 检查当前使用量是否超过资源限制
   * 无限制资源（-1）始终返回 false
   *
   * @param resource - 资源类型
   * @param currentUsage - 当前使用量
   * @returns 是否超过限制
   *
   * @example
   * ```typescript
   * const isExceeded = limits.isExceeded('maxUsers', 150); // true
   * const notExceeded = limits.isExceeded('maxUsers', 50); // false
   * ```
   *
   * @since 1.0.0
   */
  public isExceeded(resource: keyof ResourceLimitsProps, currentUsage: number): boolean {
    const limit = this._props[resource];
    return limit !== -1 && currentUsage >= limit;
  }

  /**
   * 获取剩余配额
   *
   * @description 计算指定资源的剩余配额
   * 无限制资源返回 -1
   *
   * @param resource - 资源类型
   * @param currentUsage - 当前使用量
   * @returns 剩余配额，-1表示无限制
   *
   * @example
   * ```typescript
   * const remaining = limits.getRemainingQuota('maxUsers', 30); // 70
   * const unlimited = limits.getRemainingQuota('maxStorage', 5); // -1 (如果无限制)
   * ```
   *
   * @since 1.0.0
   */
  public getRemainingQuota(resource: keyof ResourceLimitsProps, currentUsage: number): number {
    const limit = this._props[resource];
    if (limit === -1) {
      return -1; // 无限制
    }
    return Math.max(0, limit - currentUsage);
  }

  /**
   * 更新限制
   *
   * @description 创建新的资源限制实例，更新指定限制
   * 遵循值对象不变性原则
   *
   * @param updates - 要更新的限制
   * @returns 新的资源限制实例
   *
   * @example
   * ```typescript
   * const newLimits = limits.updateLimits({
   *   maxUsers: 200,
   *   maxStorage: 20
   * });
   * ```
   *
   * @since 1.0.0
   */
  public updateLimits(updates: Partial<ResourceLimitsProps>): ResourceLimits {
    return ResourceLimits.create({ ...this._props, ...updates });
  }

  /**
   * 获取所有限制信息
   *
   * @description 返回所有资源限制的副本
   *
   * @returns 资源限制属性副本
   *
   * @since 1.0.0
   */
  public getAllLimits(): ResourceLimitsProps {
    return { ...this._props };
  }

  /**
   * 检查是否所有资源都无限制
   *
   * @description 检查是否所有资源都设置为无限制（-1）
   *
   * @returns 是否所有资源都无限制
   *
   * @example
   * ```typescript
   * const isUnlimited = limits.isUnlimited(); // false
   * ```
   *
   * @since 1.0.0
   */
  public isUnlimited(): boolean {
    return Object.values(this._props).every(limit => limit === -1);
  }
}

/**
 * 无效资源限制异常
 *
 * @description 当资源限制值无效时抛出的异常
 *
 * @since 1.0.0
 */
export class InvalidResourceLimitsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResourceLimitsException';
  }
}
