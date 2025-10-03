/**
 * 用户认证用例
 *
 * @description 用户认证的完整业务流程编排
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Password } from '@hl8/hybrid-archi';
import { AuthenticateUserCommand } from '../commands/authenticate-user.command';
import { AuthenticateUserHandler } from '../commands/handlers/authenticate-user.handler';

/**
 * 用户认证用例请求
 */
export interface AuthenticateUserRequest {
  userId: string;
  password: string;
}

/**
 * 用户认证用例响应
 */
export interface AuthenticateUserResponse {
  success: boolean;
  authenticated: boolean;
  message?: string;
  error?: string;
}

/**
 * 用户认证用例
 *
 * @description 编排用户认证的完整业务流程
 */
@Injectable()
export class AuthenticateUserUseCase {
  constructor(
    private readonly authenticateUserHandler: AuthenticateUserHandler
  ) {}

  /**
   * 执行用户认证用例
   *
   * @description 编排用户认证的完整业务流程
   * @param request - 用户认证请求
   * @returns 认证结果
   */
  async execute(
    request: AuthenticateUserRequest
  ): Promise<AuthenticateUserResponse> {
    try {
      // 1. 应用层验证：检查输入参数
      this.validateRequest(request);

      // 2. 创建值对象
      const userId = UserId.create(request.userId);
      const password = Password.create(request.password);

      // 3. 创建命令
      const command = new AuthenticateUserCommand(userId, password);

      // 4. 执行命令（通过命令处理器）
      const result = await this.authenticateUserHandler.execute(command);

      // 5. 返回用例结果
      if (result.success) {
        return {
          success: true,
          authenticated: result.authenticated,
          message: result.authenticated ? '认证成功' : '认证失败',
        };
      } else {
        return {
          success: false,
          authenticated: false,
          error: result.error,
        };
      }
    } catch (error) {
      // 用例级错误处理
      return {
        success: false,
        authenticated: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 验证请求参数
   *
   * @description 应用层级别的参数验证
   * @param request - 用户认证请求
   * @private
   */
  private validateRequest(request: AuthenticateUserRequest): void {
    if (!request.userId || !request.userId.trim()) {
      throw new Error('用户ID不能为空');
    }

    if (!request.password || !request.password.trim()) {
      throw new Error('密码不能为空');
    }

    // 用户ID格式验证
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(request.userId)) {
      throw new Error('用户ID格式不正确');
    }
  }
}
