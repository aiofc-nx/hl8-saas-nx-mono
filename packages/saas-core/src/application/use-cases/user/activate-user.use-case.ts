/**
 * 激活用户用例
 *
 * @class ActivateUserUseCase
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '@hl8/hybrid-archi';
import { ICommandUseCase } from '../base/use-case.interface';
import { IUserAggregateRepository } from '../../../domain/user/repositories/user-aggregate.repository.interface';

export interface IActivateUserCommand {
  userId: string;
  activatedBy: string;
}

@Injectable()
export class ActivateUserUseCase
  implements ICommandUseCase<IActivateUserCommand, void>
{
  constructor(private readonly userRepository: IUserAggregateRepository) {}

  async execute(command: IActivateUserCommand): Promise<void> {
    const userId = EntityId.fromString(command.userId);
    const aggregate = await this.userRepository.findById(userId);

    if (!aggregate) {
      throw new Error(`用户不存在: ${command.userId}`);
    }

    aggregate.verifyEmail(command.activatedBy);
    await this.userRepository.save(aggregate);
  }
}

