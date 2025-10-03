/**
 * 用户应用服务
 *
 * @description 用户管理的应用服务，协调领域层和基础设施层
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { User } from '../../domain/entities/user.entity';
import { UserStatus } from '@hl8/hybrid-archi';
import {
  CreateUserCommand,
  CreateUserResult,
} from '../commands/create-user.command';
import {
  UpdateUserProfileCommand,
  UpdateUserProfileResult,
} from '../commands/update-user-profile.command';
import {
  AuthenticateUserCommand,
  AuthenticateUserResult,
} from '../commands/authenticate-user.command';
import {
  GetUserQuery,
  GetUserResult,
  UserInfo,
} from '../queries/get-user.query';
import { ListUsersQuery, ListUsersResult } from '../queries/list-users.query';

/**
 * 用户应用服务
 *
 * @description 用户管理的应用服务，提供用户管理的用例
 */
@Injectable()
export class UserApplicationService {
  constructor() {} // 这里会注入仓储和其他依赖

  /**
   * 创建用户
   *
   * @description 创建新用户
   * @param command - 创建用户命令
   * @returns 创建结果
   */
  async createUser(command: CreateUserCommand): Promise<CreateUserResult> {
    try {
      // 创建用户实体
      const user = new User(
        command.userId,
        command.email,
        command.username,
        command.password,
        command.profile,
        UserStatus.Pending,
        command.tenantId
      );

      // 创建用户聚合根
      const userAggregate = new UserAggregate(command.userId, user);

      // 注册用户
      userAggregate.registerUser(
        command.email,
        command.username,
        command.password
      );

      // 这里会保存到仓储
      // await this.userRepository.save(userAggregate);

      return new CreateUserResult(true, command.userId);
    } catch (error) {
      return new CreateUserResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 更新用户配置文件
   *
   * @description 更新用户配置文件
   * @param command - 更新用户配置文件命令
   * @returns 更新结果
   */
  async updateUserProfile(
    command: UpdateUserProfileCommand
  ): Promise<UpdateUserProfileResult> {
    try {
      // 这里会从仓储获取用户聚合根
      // const userAggregate = await this.userRepository.findById(command.userId);

      // 更新用户配置文件
      // userAggregate.updateUserProfile(command.profile);

      // 保存到仓储
      // await this.userRepository.save(userAggregate);

      return new UpdateUserProfileResult(true);
    } catch (error) {
      return new UpdateUserProfileResult(
        false,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 认证用户
   *
   * @description 认证用户
   * @param command - 认证用户命令
   * @returns 认证结果
   */
  async authenticateUser(
    command: AuthenticateUserCommand
  ): Promise<AuthenticateUserResult> {
    try {
      // 这里会从仓储获取用户聚合根
      // const userAggregate = await this.userRepository.findById(command.userId);

      // 认证用户
      // const authenticated = userAggregate.authenticateUser(command.password);

      // 如果认证成功，保存到仓储
      // if (authenticated) {
      //   await this.userRepository.save(userAggregate);
      // }

      return new AuthenticateUserResult(true, true);
    } catch (error) {
      return new AuthenticateUserResult(
        true,
        false,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 获取用户
   *
   * @description 获取用户信息
   * @param query - 获取用户查询
   * @returns 用户信息
   */
  async getUser(query: GetUserQuery): Promise<GetUserResult> {
    try {
      // 这里会从仓储获取用户聚合根
      // const userAggregate = await this.userRepository.findById(query.userId);

      // 转换为用户信息
      // const userInfo = this.mapToUserInfo(userAggregate);

      return new GetUserResult(true, undefined);
    } catch (error) {
      return new GetUserResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 列出用户
   *
   * @description 列出用户
   * @param query - 列出用户查询
   * @returns 用户列表
   */
  async listUsers(query: ListUsersQuery): Promise<ListUsersResult> {
    try {
      // 这里会从仓储获取用户列表
      // const users = await this.userRepository.findByTenant(query.tenantId, query.status, query.page, query.limit, query.search);

      return new ListUsersResult(true, [], 0, query.page, query.limit);
    } catch (error) {
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
   * 映射到用户信息
   *
   * @description 将用户聚合根映射为用户信息
   * @param userAggregate - 用户聚合根
   * @returns 用户信息
   */
  private mapToUserInfo(userAggregate: UserAggregate): UserInfo {
    const user = userAggregate.getUser();

    return {
      id: userAggregate.id.value,
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
