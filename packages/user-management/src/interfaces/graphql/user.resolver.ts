/**
 * 用户GraphQL解析器
 *
 * @description 用户管理的GraphQL API解析器
 * @since 1.0.0
 */

import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UserApplicationService } from '../../application/services/user-application.service';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { UpdateUserProfileCommand } from '../../application/commands/update-user-profile.command';
import { AuthenticateUserCommand } from '../../application/commands/authenticate-user.command';
import { GetUserQuery } from '../../application/queries/get-user.query';
import { ListUsersQuery } from '../../application/queries/list-users.query';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';

/**
 * 用户类型定义
 */
export class UserType {
  id!: string;
  email!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  avatar?: string;
  phone?: string;
  status!: string;
  tenantId?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

/**
 * 创建用户输入类型
 */
export class CreateUserInput {
  email!: string;
  username!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  avatar?: string;
  phone?: string;
  tenantId?: string;
}

/**
 * 更新用户配置文件输入类型
 */
export class UpdateUserProfileInput {
  firstName!: string;
  lastName!: string;
  avatar?: string;
  phone?: string;
}

/**
 * 认证用户输入类型
 */
export class AuthenticateUserInput {
  password!: string;
}

/**
 * 用户列表结果类型
 */
export class UserListResult {
  users!: UserType[];
  total!: number;
  page!: number;
  limit!: number;
}

/**
 * 用户GraphQL解析器
 *
 * @description 提供用户管理的GraphQL API
 *
 * ## 业务规则
 *
 * ### 查询规则
 * - 支持单个用户查询
 * - 支持用户列表查询
 * - 支持分页和排序
 * - 支持条件过滤
 *
 * ### 变更规则
 * - 支持用户创建
 * - 支持用户配置文件更新
 * - 支持用户认证
 * - 支持用户状态管理
 */
@Resolver(() => UserType)
export class UserResolver {
  constructor(
    private readonly userApplicationService: UserApplicationService
  ) {}

  /**
   * 获取用户
   *
   * @description 根据ID获取用户信息
   * @param id - 用户ID
   * @param context - GraphQL上下文
   * @returns 用户信息
   */
  @Query(() => UserType, { nullable: true })
  async getUser(
    @Args('id') id: string,
    @Context() context?: any
  ): Promise<UserType | null> {
    try {
      const query = new GetUserQuery(UserId.create(id));
      const result = await this.userApplicationService.getUser(query);

      if (!result.success || !result.user) {
        return null;
      }

      return this.mapToUserType(result.user);
    } catch (error) {
      throw new Error(
        `获取用户失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 获取用户列表
   *
   * @description 获取用户列表，支持分页和过滤
   * @param status - 用户状态
   * @param search - 搜索关键词
   * @param page - 页码
   * @param limit - 每页大小
   * @param context - GraphQL上下文
   * @returns 用户列表结果
   */
  @Query(() => UserListResult)
  async getUsers(
    @Args('status', { nullable: true }) status?: string,
    @Args('search', { nullable: true }) search?: string,
    @Args('page', { defaultValue: 1 }) page: number = 1,
    @Args('limit', { defaultValue: 10 }) limit: number = 10,
    @Context() context?: any
  ): Promise<UserListResult> {
    try {
      const query = new ListUsersQuery(
        context.tenantId,
        status,
        page,
        limit,
        search
      );
      const result = await this.userApplicationService.listUsers(query);

      if (!result.success) {
        throw new Error(result.error || '获取用户列表失败');
      }

      return {
        users: result.users?.map((user) => this.mapToUserType(user)) || [],
        total: result.total || 0,
        page,
        limit,
      };
    } catch (error) {
      throw new Error(
        `获取用户列表失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 创建用户
   *
   * @description 创建新用户
   * @param input - 创建用户输入
   * @param context - GraphQL上下文
   * @returns 创建结果
   */
  @Mutation(() => Boolean)
  async createUser(
    @Args('input') input: CreateUserInput,
    @Context() context?: any
  ): Promise<boolean> {
    try {
      const command = new CreateUserCommand(
        UserId.generate(),
        Email.create(input.email),
        Username.create(input.username),
        Password.create(input.password),
        UserProfile.create({
          firstName: input.firstName,
          lastName: input.lastName,
          avatar: input.avatar,
          phone: input.phone,
        }),
        input.tenantId || context.tenantId
      );

      const result = await this.userApplicationService.createUser(command);
      return result.success;
    } catch (error) {
      throw new Error(
        `创建用户失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 更新用户配置文件
   *
   * @description 更新用户配置文件
   * @param id - 用户ID
   * @param input - 更新用户配置文件输入
   * @param context - GraphQL上下文
   * @returns 更新结果
   */
  @Mutation(() => Boolean)
  async updateUserProfile(
    @Args('id') id: string,
    @Args('input') input: UpdateUserProfileInput,
    @Context() context?: any
  ): Promise<boolean> {
    try {
      const command = new UpdateUserProfileCommand(
        UserId.create(id),
        UserProfile.create({
          firstName: input.firstName,
          lastName: input.lastName,
          avatar: input.avatar,
          phone: input.phone,
        })
      );

      const result = await this.userApplicationService.updateUserProfile(
        command
      );
      return result.success;
    } catch (error) {
      throw new Error(
        `更新用户配置文件失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 认证用户
   *
   * @description 认证用户
   * @param id - 用户ID
   * @param input - 认证用户输入
   * @param context - GraphQL上下文
   * @returns 认证结果
   */
  @Mutation(() => Boolean)
  async authenticateUser(
    @Args('id') id: string,
    @Args('input') input: AuthenticateUserInput,
    @Context() context?: any
  ): Promise<boolean> {
    try {
      const command = new AuthenticateUserCommand(
        UserId.create(id),
        Password.create(input.password)
      );

      const result = await this.userApplicationService.authenticateUser(
        command
      );
      return result.success && result.authenticated;
    } catch (error) {
      throw new Error(
        `认证用户失败: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * 映射到用户类型
   *
   * @description 将用户数据映射到GraphQL类型
   * @param user - 用户数据
   * @returns 用户类型
   * @private
   */
  private mapToUserType(user: any): UserType {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      avatar: user.profile?.avatar,
      phone: user.profile?.phone,
      status: user.status,
      tenantId: user.tenantId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
