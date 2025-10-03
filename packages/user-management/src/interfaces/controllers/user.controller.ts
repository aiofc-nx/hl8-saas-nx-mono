/**
 * 用户控制器
 *
 * @description 用户管理的REST API控制器
 * @since 1.0.0
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
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
 * 创建用户请求DTO
 */
export class CreateUserRequestDto {
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
 * 更新用户配置文件请求DTO
 */
export class UpdateUserProfileRequestDto {
  firstName!: string;
  lastName!: string;
  avatar?: string;
  phone?: string;
}

/**
 * 认证用户请求DTO
 */
export class AuthenticateUserRequestDto {
  password!: string;
}

/**
 * 用户控制器
 *
 * @description 用户管理的REST API控制器
 */
@Controller('users')
export class UserController {
  constructor(
    private readonly userApplicationService: UserApplicationService
  ) {}

  /**
   * 创建用户
   *
   * @description 创建新用户
   * @param createUserDto - 创建用户请求DTO
   * @returns 创建结果
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserRequestDto) {
    try {
      const command = new CreateUserCommand(
        UserId.generate(),
        Email.create(createUserDto.email),
        Username.create(createUserDto.username),
        Password.create(createUserDto.password),
        UserProfile.create({
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          avatar: createUserDto.avatar,
          phone: createUserDto.phone,
        }),
        createUserDto.tenantId
      );

      const result = await this.userApplicationService.createUser(command);

      if (result.success) {
        return {
          success: true,
          userId: result.userId?.value,
          message: 'User created successfully',
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 获取用户
   *
   * @description 根据ID获取用户信息
   * @param id - 用户ID
   * @returns 用户信息
   */
  @Get(':id')
  async getUser(@Param('id') id: string) {
    try {
      const query = new GetUserQuery(UserId.create(id));
      const result = await this.userApplicationService.getUser(query);

      if (result.success) {
        return {
          success: true,
          user: result.user,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 列出用户
   *
   * @description 列出用户
   * @param query - 查询参数
   * @returns 用户列表
   */
  @Get()
  async listUsers(@Query() query: any) {
    try {
      const listQuery = new ListUsersQuery(
        query.tenantId,
        query.status,
        parseInt(query.page) || 1,
        parseInt(query.limit) || 10,
        query.search
      );

      const result = await this.userApplicationService.listUsers(listQuery);

      return {
        success: true,
        users: result.users,
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 更新用户配置文件
   *
   * @description 更新用户配置文件
   * @param id - 用户ID
   * @param updateProfileDto - 更新配置文件请求DTO
   * @returns 更新结果
   */
  @Put(':id/profile')
  async updateUserProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateUserProfileRequestDto
  ) {
    try {
      const command = new UpdateUserProfileCommand(
        UserId.create(id),
        UserProfile.create({
          firstName: updateProfileDto.firstName,
          lastName: updateProfileDto.lastName,
          avatar: updateProfileDto.avatar,
          phone: updateProfileDto.phone,
        })
      );

      const result = await this.userApplicationService.updateUserProfile(
        command
      );

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 认证用户
   *
   * @description 认证用户
   * @param id - 用户ID
   * @param authenticateDto - 认证请求DTO
   * @returns 认证结果
   */
  @Post(':id/authenticate')
  async authenticateUser(
    @Param('id') id: string,
    @Body() authenticateDto: AuthenticateUserRequestDto
  ) {
    try {
      const command = new AuthenticateUserCommand(
        UserId.create(id),
        Password.create(authenticateDto.password)
      );

      const result = await this.userApplicationService.authenticateUser(
        command
      );

      return {
        success: result.success,
        authenticated: result.authenticated,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        authenticated: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
