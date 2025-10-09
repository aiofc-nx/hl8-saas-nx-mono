import { CommandHandler, ICommandHandler } from '@hl8/hybrid-archi';
import { RegisterUserCommand } from './register-user.command';
import { RegisterUserUseCase } from '../../../use-cases/user/register-user.use-case';
import { EntityId } from '@hl8/hybrid-archi';

// @CommandHandler('RegisterUserCommand') // TODO: 修复装饰器类型问题
export class RegisterUserHandler implements ICommandHandler<RegisterUserCommand, EntityId> {
  constructor(private readonly useCase: RegisterUserUseCase) {}

  async execute(command: RegisterUserCommand): Promise<EntityId> {
    return await this.useCase.execute(command);
  }
}

