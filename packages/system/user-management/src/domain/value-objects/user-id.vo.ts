/**
 * 用户ID值对象
 *
 * 用户唯一标识符，基于UUID实现，确保全局唯一性。
 *
 * @description 用户ID是用户实体的唯一标识符，基于UUID实现。
 * 提供类型安全和验证功能，确保用户ID的有效性。
 * 支持生成新的用户ID和从字符串创建用户ID。
 *
 * ## 业务规则
 *
 * ### 唯一性规则
 * - 每个用户ID在系统中必须唯一
 * - 用户ID一旦创建不可修改
 * - 用户ID用于实体的相等性比较
 *
 * ### 格式规则
 * - 用户ID必须是有效的UUID格式
 * - 用户ID不区分大小写
 * - 用户ID长度固定为36个字符
 *
 * ### 生成规则
 * - 新用户ID使用UUID v4生成
 * - 生成的ID具有足够的随机性
 * - 支持从现有字符串创建用户ID
 *
 * @example
 * ```typescript
 * // 生成新的用户ID
 * const userId = UserId.generate();
 * console.log(userId.value); // "550e8400-e29b-41d4-a716-446655440000"
 *
 * // 从字符串创建用户ID
 * const existingId = UserId.create("550e8400-e29b-41d4-a716-446655440000");
 *
 * // 比较用户ID
 * const isEqual = userId.equals(existingId);
 * ```
 *
 * @since 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';
import { EntityId } from '@hl8/hybrid-archi';

/**
 * 用户ID值对象
 *
 * @description 用户唯一标识符，基于UUID实现
 */
export class UserId {
  private _entityId: EntityId;

  /**
   * 构造函数
   *
   * @description 创建用户ID实例
   * @param value - 用户ID字符串值
   */
  constructor(value: string) {
    this._entityId = EntityId.fromString(value);
    this.validate();
  }

  /**
   * 生成新的用户ID
   *
   * @description 使用UUID v4生成新的用户ID
   * @returns 新的用户ID实例
   */
  public static generate(): UserId {
    return new UserId(EntityId.generate().toString());
  }

  /**
   * 从字符串创建用户ID
   *
   * @description 从现有字符串创建用户ID实例
   * @param value - 用户ID字符串值
   * @returns 用户ID实例
   */
  public static create(value: string): UserId {
    return new UserId(value);
  }

  /**
   * 验证用户ID格式
   *
   * @description 验证用户ID是否符合UUID格式
   * @private
   */
  private validate(): void {
    if (!this.isValidUUID(this.value)) {
      throw new InvalidUserIdException(this.value);
    }
  }

  /**
   * 检查是否为有效UUID
   *
   * @description 检查字符串是否为有效的UUID格式
   * @param value - 要检查的字符串
   * @returns 是否为有效UUID
   * @private
   */
  private isValidUUID(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 获取用户ID值
   *
   * @description 返回用户ID的字符串值
   * @returns 用户ID字符串
   */
  public get value(): string {
    return this._entityId.toString();
  }

  /**
   * 比较两个用户ID是否相等
   *
   * @description 比较两个用户ID是否相等
   * @param other - 另一个用户ID实例
   * @returns 是否相等
   */
  public equals(other: UserId): boolean {
    return this._entityId.equals(other._entityId);
  }

  /**
   * 转换为字符串
   *
   * @description 返回用户ID的字符串表示
   * @returns 用户ID字符串
   */
  public toString(): string {
    return this._entityId.toString();
  }

  /**
   * 转换为JSON
   *
   * @description 返回用户ID的JSON表示
   * @returns 用户ID的JSON对象
   */
  public toJSON(): { value: string } {
    return { value: this.value };
  }

  /**
   * 获取EntityId
   *
   * @description 返回内部的EntityId实例
   * @returns EntityId实例
   */
  public getEntityId(): EntityId {
    return this._entityId;
  }
}

/**
 * 无效用户ID异常
 *
 * @description 当用户ID格式无效时抛出
 */
export class InvalidUserIdException extends Error {
  constructor(value: string) {
    super(`Invalid user ID format: ${value}`);
    this.name = 'InvalidUserIdException';
  }
}
