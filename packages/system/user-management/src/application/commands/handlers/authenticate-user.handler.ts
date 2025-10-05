/**
 * 用户认证命令处理器
 *
 * @description 处理用户认证命令，遵循用例编排原则
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  AuthenticateUserCommand,
  AuthenticateUserResult,
} from '../../commands/authenticate-user.command';
import { IUserRepository } from '../../../infrastructure/repositories/user.repository.interface';

/**
 * 用户认证命令处理器
 *
 * @description 处理用户认证命令，实现用例编排逻辑
 */
@Injectable()
export class AuthenticateUserHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * 执行用户认证命令
   *
   * @description 编排用户认证的完整业务流程
   * @param command - 用户认证命令
   * @returns 认证结果
   */
  async execute(
    command: AuthenticateUserCommand
  ): Promise<AuthenticateUserResult> {
    try {
      // 1. 加载用户聚合根
      const userAggregate = await this.userRepository.findById(command.userId);
      if (!userAggregate) {
        return new AuthenticateUserResult(true, false, '用户不存在');
      }

      // 2. 应用层验证：检查用户状态
      this.validateUserStatus(userAggregate);

      // 3. 认证用户（领域层业务逻辑）
      const authenticated = userAggregate.authenticateUser(command.password);

      // 4. 如果认证成功，保存聚合根
      if (authenticated) {
        await this.userRepository.save(userAggregate);
      }

      // 5. 返回认证结果
      return new AuthenticateUserResult(true, authenticated);
    } catch (error) {
      // 应用层错误处理
      return new AuthenticateUserResult(
        true,
        false,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 验证用户状态
   *
   * @description 检查用户是否可以进行认证
   * @param userAggregate - 用户聚合根
   * @private
   */
  private validateUserStatus(userAggregate: any): void {
    if (userAggregate.isUserDeleted()) {
      throw new Error('已删除的用户无法进行认证');
    }
  }
}
