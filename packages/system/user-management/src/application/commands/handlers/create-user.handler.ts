/**
 * 创建用户命令处理器
 *
 * @description 处理创建用户命令，遵循用例编排原则
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  CreateUserCommand,
  CreateUserResult,
} from '../../commands/create-user.command';
import { UserAggregate } from '../../../domain/aggregates/user.aggregate';
import { User } from '../../../domain/entities/user.entity';
import { UserStatus } from '@hl8/hybrid-archi';
import { IUserRepository } from '../../../infrastructure/repositories/user.repository.interface';
import { ICommandHandler } from '@hl8/hybrid-archi';
import { EventPublisherService } from '@hl8/hybrid-archi';

/**
 * 创建用户命令处理器
 *
 * @description 处理创建用户命令，实现用例编排逻辑
 */
@Injectable()
export class CreateUserHandler
  implements ICommandHandler<CreateUserCommand, CreateUserResult>
{
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: EventPublisherService
  ) {}

  /**
   * 执行创建用户命令
   *
   * @description 编排创建用户的完整业务流程
   * @param command - 创建用户命令
   * @returns 创建结果
   */
  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    try {
      // 1. 应用层验证：检查邮箱和用户名唯一性
      await this.validateUniqueness(command);

      // 2. 创建用户实体（领域层操作）
      const user = new User(
        command.userId,
        command.email,
        command.username,
        command.password,
        command.profile,
        UserStatus.Pending,
        command.tenantId
      );

      // 3. 创建用户聚合根
      const userAggregate = new UserAggregate(command.userId, user);

      // 4. 注册用户（领域层业务逻辑）
      userAggregate.registerUser(
        command.email,
        command.username,
        command.password
      );

      // 5. 保存聚合根（基础设施层操作）
      await this.userRepository.save(userAggregate);

      // 6. 发布未提交的事件（EDA）
      await this.eventPublisher.publishUncommittedEvents(
        userAggregate.id.value,
        [...userAggregate.uncommittedEvents]
      );

      // 7. 标记事件为已提交
      userAggregate.clearUncommittedEvents();

      // 8. 返回成功结果
      return new CreateUserResult(true, command.userId);
    } catch (error) {
      // 应用层错误处理
      return new CreateUserResult(
        false,
        undefined,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * 验证用户唯一性
   *
   * @description 检查邮箱和用户名在租户内的唯一性
   * @param command - 创建用户命令
   * @private
   */
  private async validateUniqueness(command: CreateUserCommand): Promise<void> {
    // 检查邮箱唯一性
    const emailExists = await this.userRepository.existsByEmail(
      command.email.value,
      command.tenantId
    );
    if (emailExists) {
      throw new Error(`邮箱 ${command.email.value} 已存在`);
    }

    // 检查用户名唯一性
    const usernameExists = await this.userRepository.existsByUsername(
      command.username.value,
      command.tenantId
    );
    if (usernameExists) {
      throw new Error(`用户名 ${command.username.value} 已存在`);
    }
  }
}
