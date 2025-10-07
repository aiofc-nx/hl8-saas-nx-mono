/**
 * 租户ID值对象
 * 
 * @description 租户的唯一标识符，使用UUID v4格式确保全局唯一性
 * 租户代码作为租户实体的独立属性，用于人类可读的标识
 * 
 * ## 业务规则
 * 
 * ### 格式规则
 * - 租户ID：UUID v4格式，全局唯一
 * - 唯一性：租户ID在系统中必须唯一
 * 
 * ### 验证规则
 * - 租户ID必须符合UUID v4格式
 * - 创建时自动验证格式
 * - 格式不符合要求时抛出异常
 * 
 * @example
 * ```typescript
 * // 生成新的租户ID
 * const tenantId = TenantId.generate();
 * 
 * // 从UUID字符串创建租户ID
 * const tenantId = TenantId.create('123e4567-e89b-4d3a-a456-426614174000');
 * 
 * // 获取租户ID值
 * const idValue = tenantId.value; // UUID字符串
 * ```
 * 
 * @since 1.0.0
 */

import { EntityId } from '../entity-id.js';

export class TenantId {
  private _entityId: EntityId;

  /**
   * 构造函数
   * 
   * @param value 租户ID字符串值（UUID v4格式）
   * @throws {InvalidTenantIdException} 当ID格式不符合要求时
   * @since 1.0.0
   */
  constructor(value: string) {
    try {
      this._entityId = EntityId.fromString(value);
    } catch (error) {
      throw new InvalidTenantIdException(value);
    }
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
   * @description 基于租户ID字符串生成EntityId实例，用于与hybrid-archi集成
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
