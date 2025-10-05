/**
 * 更新用户配置文件命令处理器
 *
 * @description 处理更新用户配置文件命令，遵循用例编排原则
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  UpdateUserProfileCommand,
  UpdateUserProfileResult,
} from '../../commands/update-user-profile.command';
import { IUserRepository } from '../../../infrastructure/repositories/user.repository.interface';

/**
 * 更新用户配置文件命令处理器
 *
 * @description 处理更新用户配置文件命令，实现用例编排逻辑
 */
@Injectable()
export class UpdateUserProfileHandler {
  constructor(private readonly userRepository: IUserRepository) {}

  /**
   * 执行更新用户配置文件命令
   *
   * @description 编排更新用户配置文件的完整业务流程
   * @param command - 更新用户配置文件命令
   * @returns 更新结果
   */
  async execute(
    command: UpdateUserProfileCommand
  ): Promise<UpdateUserProfileResult> {
    try {
      // 1. 加载用户聚合根
      const userAggregate = await this.userRepository.findById(command.userId);
      if (!userAggregate) {
        throw new Error(`用户 ${command.userId.value} 不存在`);
      }

      // 2. 应用层验证：检查用户状态
      this.validateUserStatus(userAggregate);

      // 3. 更新用户配置文件（领域层业务逻辑）
      userAggregate.updateUserProfile(command.profile);

      // 4. 保存聚合根（基础设施层操作）
      await this.userRepository.save(userAggregate);

      // 5. 返回成功结果
      return new UpdateUserProfileResult(true);
    } catch (error) {
      // 应用层错误处理
      return new UpdateUserProfileResult(
        false,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 验证用户状态
   *
   * @description 检查用户是否可以进行配置文件更新
   * @param userAggregate - 用户聚合根
   * @private
   */
  private validateUserStatus(userAggregate: any): void {
    if (userAggregate.isUserDeleted()) {
      throw new Error('已删除的用户无法更新配置文件');
    }
  }
}
