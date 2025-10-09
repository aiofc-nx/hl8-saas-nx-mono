/**
 * 用户控制器
 *
 * @class UserController
 * @since 1.0.0
 */

import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus, EntityId } from '@hl8/hybrid-archi';
import { RegisterUserDto } from '../dtos/user/register-user.dto';
import { LoginUserDto } from '../dtos/user/login-user.dto';
import { UserResponseDto } from '../dtos/user/user-response.dto';
import { RegisterUserCommand } from '../../application/cqrs/commands/user/register-user.command';
import { LoginUserCommand } from '../../application/cqrs/commands/user/login-user.command';
import { GetUserQuery } from '../../application/cqrs/queries/user/get-user.query';

@Controller('api/users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterUserDto): Promise<{ id: string }> {
    // TODO: 从认证上下文获取 tenantId 和 userId  
    const command = new RegisterUserCommand(
      '', // tenantId - 注册时可为空
      '', // userId - 注册时可为空
      dto.username,
      dto.email,
      dto.password,
      dto.phoneNumber,
    );
    
    const userId = await this.commandBus.execute(command) as unknown as EntityId;
    return { id: userId.toString() };
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<any> {
    // TODO: 从认证上下文获取 tenantId，从请求获取 IP 和 userAgent
    const command = new LoginUserCommand(
      '', // tenantId - 登录时可为空
      '', // userId - 登录时可为空
      dto.email,
      dto.password,
      'unknown', // ip
      'unknown', // userAgent
    );
    
    return await this.commandBus.execute(command);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    // TODO: 从认证上下文获取 tenantId 和 userId
    const query = new GetUserQuery('', 'system', id);
    const aggregate = await this.queryBus.execute(query);

    if (!aggregate) {
      throw new Error(`用户不存在: ${id}`);
    }

    return UserResponseDto.fromAggregate(aggregate);
  }
}

