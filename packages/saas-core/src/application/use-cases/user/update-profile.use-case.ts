/**
 * 更新用户档案用例
 *
 * @class UpdateProfileUseCase
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '@hl8/hybrid-archi';
import { ICommandUseCase } from '../base/use-case.interface';
import { IUserAggregateRepository } from '../../../domain/user/repositories/user-aggregate.repository.interface';

export interface IUpdateProfileCommand {
  userId: string;
  fullName?: string;
  nickname?: string;
  avatar?: string;
}

@Injectable()
export class UpdateProfileUseCase
  implements ICommandUseCase<IUpdateProfileCommand, void>
{
  constructor(private readonly userRepository: IUserAggregateRepository) {}

  async execute(command: IUpdateProfileCommand): Promise<void> {
    const userId = EntityId.fromString(command.userId);
    const aggregate = await this.userRepository.findById(userId);

    if (!aggregate) {
      throw new Error(`用户不存在: ${command.userId}`);
    }

    const profile = aggregate.getProfile();
    
    if (command.fullName) {
      profile.updateFullName(command.fullName, command.userId);
    }
    if (command.nickname) {
      profile.updateNickname(command.nickname, command.userId);
    }
    if (command.avatar) {
      profile.updateAvatar(command.avatar, command.userId);
    }

    await this.userRepository.save(aggregate);
  }
}

