/**
 * 用户仓储接口
 *
 * @description 用户仓储的接口定义
 * @since 1.0.0
 */

import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { DomainEvent } from '@hl8/hybrid-archi';

/**
 * 用户仓储接口
 *
 * @description 用户仓储的接口定义，遵循仓储模式
 */
export interface IUserRepository {
  /**
   * 根据ID查找用户
   *
   * @description 根据用户ID查找用户聚合根
   * @param id - 用户ID
   * @returns 用户聚合根或undefined
   */
  findById(id: UserId): Promise<UserAggregate | undefined>;

  /**
   * 根据邮箱查找用户
   *
   * @description 根据邮箱查找用户聚合根
   * @param email - 用户邮箱
   * @param tenantId - 租户ID
   * @returns 用户聚合根或undefined
   */
  findByEmail(
    email: string,
    tenantId?: string
  ): Promise<UserAggregate | undefined>;

  /**
   * 根据用户名查找用户
   *
   * @description 根据用户名查找用户聚合根
   * @param username - 用户名
   * @param tenantId - 租户ID
   * @returns 用户聚合根或undefined
   */
  findByUsername(
    username: string,
    tenantId?: string
  ): Promise<UserAggregate | undefined>;

  /**
   * 保存用户
   *
   * @description 保存用户聚合根
   * @param userAggregate - 用户聚合根
   * @returns 保存结果
   */
  save(userAggregate: UserAggregate): Promise<void>;

  /**
   * 删除用户
   *
   * @description 删除用户
   * @param id - 用户ID
   * @returns 删除结果
   */
  delete(id: UserId): Promise<void>;

  /**
   * 根据租户查找用户
   *
   * @description 根据租户ID查找用户列表
   * @param tenantId - 租户ID
   * @param status - 用户状态
   * @param page - 页码
   * @param limit - 每页数量
   * @param search - 搜索关键词
   * @returns 用户列表
   */
  findByTenant(
    tenantId: string,
    status?: string,
    page?: number,
    limit?: number,
    search?: string
  ): Promise<{
    users: UserAggregate[];
    total: number;
  }>;

  /**
   * 检查邮箱是否存在
   *
   * @description 检查邮箱是否已存在
   * @param email - 用户邮箱
   * @param tenantId - 租户ID
   * @returns 是否存在
   */
  existsByEmail(email: string, tenantId?: string): Promise<boolean>;

  /**
   * 检查用户名是否存在
   *
   * @description 检查用户名是否已存在
   * @param username - 用户名
   * @param tenantId - 租户ID
   * @returns 是否存在
   */
  existsByUsername(username: string, tenantId?: string): Promise<boolean>;

  // ========== 事件溯源支持方法 ==========

  /**
   * 保存聚合及其事件
   *
   * @description 使用事件溯源模式保存聚合，包含乐观并发控制
   * @param userAggregate - 用户聚合根
   * @param expectedVersion - 期望的聚合版本号
   * @returns 保存结果
   */
  saveWithEvents(
    userAggregate: UserAggregate,
    expectedVersion: number
  ): Promise<void>;

  /**
   * 从事件重建聚合
   *
   * @description 从事件存储重建用户聚合根
   * @param id - 用户ID
   * @returns 重建的用户聚合根或undefined
   */
  findByIdFromEvents(id: UserId): Promise<UserAggregate | undefined>;

  /**
   * 获取聚合的所有事件
   *
   * @description 获取用户聚合的所有事件
   * @param id - 用户ID
   * @returns 事件列表
   */
  getEvents(id: UserId): Promise<DomainEvent[]>;

  /**
   * 获取聚合的当前版本
   *
   * @description 获取用户聚合的当前版本号
   * @param id - 用户ID
   * @returns 版本号
   */
  getVersion(id: UserId): Promise<number>;
}
