/**
 * 用户管理模块
 *
 * @description 用户管理的NestJS模块
 * @since 1.0.0
 */

import { Module } from '@nestjs/common';
import { UserApplicationService } from './application/services/user-application.service';
import { UserController } from './interfaces/controllers/user.controller';

/**
 * 用户管理模块
 *
 * @description 用户管理的NestJS模块，提供用户管理功能
 */
@Module({
  controllers: [UserController],
  providers: [UserApplicationService],
  exports: [UserApplicationService],
})
export class UserManagementModule {}
