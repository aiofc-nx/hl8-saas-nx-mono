/**
 * 租户ID值对象
 * 
 * @description 租户的唯一标识符，封装了租户ID的创建、验证和比较逻辑
 * 租户ID格式：3-20个字符，字母开头，只能包含字母、数字、连字符、下划线
 * 
 * ## 业务规则
 * 
 * ### 格式规则
 * - 长度：3-20个字符
 * - 开头：必须是字母（a-z, A-Z）
 * - 字符集：字母、数字、连字符(-)、下划线(_)
 * - 唯一性：全局唯一
 * 
 * ### 验证规则
 * - 创建时自动验证格式
 * - 格式不符合要求时抛出异常
 * - 支持从字符串创建和生成新ID
 * 
 * @example
 * ```typescript
 * // 生成新的租户ID
 * const tenantId = TenantId.generate();
 * 
 * // 从字符串创建租户ID
 * const tenantId = TenantId.create('my-tenant-123');
 * 
 * // 验证租户ID
 * const isValid = tenantId.value; // 返回验证后的ID字符串
 * ```
 * 
 * @since 1.0.0
 */

import { EntityId } from '../entity-id';

export class TenantId {
  private _entityId: EntityId;

  /**
   * 构造函数
   * 
   * @param value 租户ID字符串值
   * @throws {InvalidTenantIdException} 当ID格式不符合要求时
   * @since 1.0.0
   */
  constructor(value: string) {
    this._entityId = EntityId.fromString(value);
    this.validate();
  }

  /**
   * 生成新的租户ID
   * 
   * @description 使用UUID生成新的租户ID
   * 
   * @returns 新的租户ID实例
   * @since 1.0.0
   */
  public static generate(): TenantId {
    return new TenantId(EntityId.generate().toString());
  }

  /**
   * 从字符串创建租户ID
   * 
   * @description 从字符串创建租户ID实例，会进行格式验证
   * 
   * @param value 租户ID字符串值
   * @returns 租户ID实例
   * @throws {InvalidTenantIdException} 当ID格式不符合要求时
   * @since 1.0.0
   */
  public static create(value: string): TenantId {
    return new TenantId(value);
  }

  /**
   * 验证租户ID格式
   * 
   * @description 验证租户ID是否符合格式要求
   * 
   * @throws {InvalidTenantIdException} 当ID格式不符合要求时
   * @since 1.0.0
   */
  private validate(): void {
    if (!this.isValidTenantId(this.value)) {
      throw new InvalidTenantIdException(this.value);
    }
  }

  /**
   * 检查租户ID格式是否有效
   * 
   * @description 使用正则表达式验证租户ID格式
   * 
   * @param value 要验证的租户ID字符串
   * @returns true如果格式有效，否则false
   * @since 1.0.0
   */
  private isValidTenantId(value: string): boolean {
    // 租户ID格式验证：3-20个字符，字母开头，只能包含字母、数字、连字符、下划线
    const tenantIdRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
    return tenantIdRegex.test(value);
  }

  /**
   * 获取租户ID的字符串值
   * 
   * @returns 租户ID的字符串表示
   * @since 1.0.0
   */
  public get value(): string {
    return this._entityId.toString();
  }

  /**
   * 比较两个租户ID是否相等
   * 
   * @description 基于EntityId的相等性比较
   * 
   * @param other 要比较的另一个租户ID
   * @returns true如果相等，否则false
   * @since 1.0.0
   */
  public equals(other: TenantId): boolean {
    return this._entityId.equals(other._entityId);
  }

  /**
   * 转换为字符串
   * 
   * @returns 租户ID的字符串表示
   * @since 1.0.0
   */
  public toString(): string {
    return this._entityId.toString();
  }

  /**
   * 获取EntityId实例
   * 
   * @description 获取内部的EntityId实例，用于与hybrid-archi集成
   * 
   * @returns EntityId实例
   * @since 1.0.0
   */
  public getEntityId(): EntityId {
    return this._entityId;
  }
}

/**
 * 无效租户ID异常
 * 
 * @description 当租户ID格式不符合要求时抛出的异常
 * 
 * @since 1.0.0
 */
export class InvalidTenantIdException extends Error {
  constructor(value: string) {
    super(`Invalid tenant ID format: ${value}. Tenant ID must be 3-20 characters long, start with a letter, and contain only letters, numbers, hyphens, and underscores.`);
    this.name = 'InvalidTenantIdException';
  }
}
