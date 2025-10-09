/**
 * 修改密码用例
 *
 * @class ChangePasswordUseCase
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '@hl8/hybrid-archi';
import { ICommandUseCase } from '../base/use-case.interface';
import { IUserAggregateRepository } from '../../../domain/user/repositories/user-aggregate.repository.interface';

export interface IChangePasswordCommand {
  userId: string;
  oldPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordUseCase
  implements ICommandUseCase<IChangePasswordCommand, void>
{
  constructor(private readonly userRepository: IUserAggregateRepository) {}

  async execute(command: IChangePasswordCommand): Promise<void> {
    const userId = EntityId.fromString(command.userId);
    const aggregate = await this.userRepository.findById(userId);

    if (!aggregate) {
      throw new Error(`用户不存在: ${command.userId}`);
    }

    // TODO: 验证旧密码并哈希新密码
    // aggregate.getCredentials().changePassword(newHash, newSalt);
    
    await this.userRepository.save(aggregate);
  }
}

