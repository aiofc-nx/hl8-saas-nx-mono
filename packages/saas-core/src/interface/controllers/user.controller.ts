/**
 * 用户控制器
 *
 * @class UserController
 * @since 1.0.0
 */

import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
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
    const command = new RegisterUserCommand(
      dto.username,
      dto.email,
      dto.password,
      dto.phoneNumber,
    );
    
    const userId = await this.commandBus.execute(command);
    return { id: userId.toString() };
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto): Promise<any> {
    const command = new LoginUserCommand(
      dto.email,
      dto.password,
      'unknown',
      'unknown',
    );
    
    return await this.commandBus.execute(command);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    const query = new GetUserQuery(id);
    const aggregate = await this.queryBus.execute(query);

    if (!aggregate) {
      throw new Error(`用户不存在: ${id}`);
    }

    return UserResponseDto.fromAggregate(aggregate);
  }
}

