/**
 * 注册用户用例
 *
 * @description 注册用户的完整业务流程编排
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';
import { CreateUserCommand } from '../commands/create-user.command';
import { CreateUserHandler } from '../commands/handlers/create-user.handler';

/**
 * 注册用户用例请求
 */
export interface RegisterUserRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  tenantId?: string;
}

/**
 * 注册用户用例响应
 */
export interface RegisterUserResponse {
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
}

/**
 * 注册用户用例
 *
 * @description 编排注册用户的完整业务流程
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(private readonly createUserHandler: CreateUserHandler) {}

  /**
   * 执行注册用户用例
   *
   * @description 编排注册用户的完整业务流程
   * @param request - 注册用户请求
   * @returns 注册结果
   */
  async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    try {
      // 1. 应用层验证：检查输入参数
      this.validateRequest(request);

      // 2. 创建值对象
      const userId = UserId.generate();
      const email = Email.create(request.email);
      const username = Username.create(request.username);
      const password = Password.create(request.password);
      const profile = UserProfile.create({
        firstName: request.firstName,
        lastName: request.lastName,
        avatar: request.avatar,
        phone: request.phone,
      });

      // 3. 创建命令
      const command = new CreateUserCommand(
        userId,
        email,
        username,
        password,
        profile,
        request.tenantId
      );

      // 4. 执行命令（通过命令处理器）
      const result = await this.createUserHandler.execute(command);

      // 5. 返回用例结果
      if (result.success) {
        return {
          success: true,
          userId: result.userId?.value,
          message: '用户注册成功',
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      // 用例级错误处理
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 验证请求参数
   *
   * @description 应用层级别的参数验证
   * @param request - 注册用户请求
   * @private
   */
  private validateRequest(request: RegisterUserRequest): void {
    if (!request.email || !request.email.trim()) {
      throw new Error('邮箱不能为空');
    }

    if (!request.username || !request.username.trim()) {
      throw new Error('用户名不能为空');
    }

    if (!request.password || !request.password.trim()) {
      throw new Error('密码不能为空');
    }

    if (!request.firstName || !request.firstName.trim()) {
      throw new Error('姓名不能为空');
    }

    if (!request.lastName || !request.lastName.trim()) {
      throw new Error('姓氏不能为空');
    }

    // 密码强度验证
    if (request.password.length < 8) {
      throw new Error('密码长度不能少于8位');
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      throw new Error('邮箱格式不正确');
    }
  }
}
