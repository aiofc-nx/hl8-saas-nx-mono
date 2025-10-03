/**
 * 列出用户查询处理器
 *
 * @description 处理列出用户查询，优化查询性能
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { ListUsersQuery, ListUsersResult } from '../list-users.query';
import { IUserRepository } from '../../../infrastructure/repositories/user.repository.interface';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';

/**
 * 列出用户查询处理器
 *
 * @description 处理列出用户查询，实现查询优化逻辑
 */
@Injectable()
export class ListUsersHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * 执行列出用户查询
   *
   * @description 优化查询性能，实现分页和过滤
   * @param query - 列出用户查询
   * @returns 用户列表
   */
  async execute(query: ListUsersQuery): Promise<ListUsersResult> {
    try {
      // 1. 尝试从读模型获取（性能优化）
      const readModelResult = await this.getFromReadModel(query);
      if (readModelResult) {
        return readModelResult;
      }

      // 2. 从数据库获取用户列表
      const result = await this.userRepository.findByTenant(
        query.tenantId || '',
        query.status,
        query.page,
        query.limit,
        query.search
      );

      // 3. 转换为用户信息列表
      const users = result.users.map((userAggregate) =>
        this.mapToUserInfo(userAggregate)
      );

      // 4. 返回查询结果
      return new ListUsersResult(
        true,
        users,
        result.total,
        query.page,
        query.limit
      );
    } catch (error) {
      // 查询错误处理
      return new ListUsersResult(
        false,
        [],
        0,
        query.page,
        query.limit,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 从读模型获取用户列表
   *
   * @description 优先使用读模型提升查询性能
   * @param query - 列出用户查询
   * @returns 读模型结果或null
   * @private
   */
  private async getFromReadModel(
    query: ListUsersQuery
  ): Promise<ListUsersResult | null> {
    try {
      // TODO: 实现读模型查询逻辑
      // const readModel = await this.userReadRepository.findByTenant(
      //   query.tenantId,
      //   query.status,
      //   query.page,
      //   query.limit,
      //   query.search
      // );
      //
      // if (readModel) {
      //   return new ListUsersResult(
      //     true,
      //     readModel.users,
      //     readModel.total,
      //     query.page,
      //     query.limit
      //   );
      // }

      return null;
    } catch (error) {
      // 读模型查询失败，降级到聚合根查询
      return null;
    }
  }

  /**
   * 映射到用户信息
   *
   * @description 将用户聚合根映射为用户信息
   * @param userAggregate - 用户聚合根
   * @returns 用户信息
   * @private
   */
  private mapToUserInfo(userAggregate: UserAggregate): any {
    const user = userAggregate.getUser();

    return {
      id: userAggregate.id.toString(),
      email: user.email.value,
      username: user.username.value,
      profile: {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatar: user.profile.avatar,
        phone: user.profile.phone,
      },
      status: user.status,
      tenantId: user.tenantId,
      createdAt: userAggregate.createdAt,
      updatedAt: userAggregate.updatedAt,
    };
  }
}
