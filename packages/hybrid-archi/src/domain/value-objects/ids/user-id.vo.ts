/**
 * 用户ID值对象
 * 
 * @description 用户的唯一标识符，封装了用户ID的创建、验证和比较逻辑
 * 用户ID使用UUID格式，确保全局唯一性
 * 
 * ## 业务规则
 * 
 * ### 格式规则
 * - 格式：UUID v4格式
 * - 唯一性：全局唯一
 * - 不可变性：一旦创建不可修改
 * 
 * ### 验证规则
 * - 必须是有效的UUID格式
 * - 支持从字符串创建和生成新ID
 * - 创建时自动验证格式
 * 
 * @example
 * ```typescript
 * // 生成新的用户ID
 * const userId = UserId.generate();
 * 
 * // 从字符串创建用户ID
 * const userId = UserId.create('123e4567-e89b-12d3-a456-426614174000');
 * 
 * // 验证用户ID
 * const isValid = userId.value; // 返回验证后的ID字符串
 * ```
 * 
 * @since 1.0.0
 */

import { EntityId } from '../entity-id.js';

export class UserId {
  private _entityId: EntityId;

  /**
   * 构造函数
   * 
   * @param value 用户ID字符串值（UUID格式）
   * @throws {InvalidUserIdException} 当ID格式不符合要求时
   * @since 1.0.0
   */
  constructor(value: string) {
    this.validate(value);
    this._entityId = EntityId.fromString(value);
  }

  /**
   * 生成新的用户ID
   * 
   * @description 使用UUID生成新的用户ID
   * 
   * @returns 新的用户ID实例
   * @since 1.0.0
   */
  public static generate(): UserId {
    return new UserId(EntityId.generate().toString());
  }

  /**
   * 从字符串创建用户ID
   * 
   * @description 从字符串创建用户ID实例，会进行格式验证
   * 
   * @param value 用户ID字符串值
   * @returns 用户ID实例
   * @throws {InvalidUserIdException} 当ID格式不符合要求时
   * @since 1.0.0
   */
  public static create(value: string): UserId {
    return new UserId(value);
  }

  /**
   * 验证用户ID格式
   * 
   * @description 验证用户ID是否为有效的UUID格式
   * 
   * @throws {InvalidUserIdException} 当ID格式不符合要求时
   * @since 1.0.0
   */
  private validate(value: string): void {
    if (!this.isValidUserId(value)) {
      throw new InvalidUserIdException(value);
    }
  }

  /**
   * 检查用户ID格式是否有效
   * 
   * @description 使用正则表达式验证UUID格式
   * 
   * @param value 要验证的用户ID字符串
   * @returns true如果格式有效，否则false
   * @since 1.0.0
   */
  private isValidUserId(value: string): boolean {
    // UUID v4格式验证
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 获取用户ID的字符串值
   * 
   * @returns 用户ID的字符串表示
   * @since 1.0.0
   */
  public get value(): string {
    return this._entityId.toString();
  }

  /**
   * 比较两个用户ID是否相等
   * 
   * @description 基于EntityId的相等性比较
   * 
   * @param other 要比较的另一个用户ID
   * @returns true如果相等，否则false
   * @since 1.0.0
   */
  public equals(other: UserId): boolean {
    return this._entityId.equals(other._entityId);
  }

  /**
   * 转换为字符串
   * 
   * @returns 用户ID的字符串表示
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
 * 无效用户ID异常
 * 
 * @description 当用户ID格式不符合要求时抛出的异常
 * 
 * @since 1.0.0
 */
export class InvalidUserIdException extends Error {
  constructor(value: string) {
    super(`Invalid user ID format: ${value}. User ID must be a valid UUID v4 format.`);
    this.name = 'InvalidUserIdException';
  }
}
