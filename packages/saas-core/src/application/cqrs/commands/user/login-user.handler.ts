import { CommandHandler, ICommandHandler } from '@hl8/hybrid-archi';
import { LoginUserCommand } from './login-user.command';
import { LoginUserUseCase } from '../../../use-cases/user/login-user.use-case';

// @CommandHandler('LoginUserCommand') // TODO: 修复装饰器类型问题
export class LoginUserHandler implements ICommandHandler<LoginUserCommand, any> {
  constructor(private readonly useCase: LoginUserUseCase) {}

  async execute(command: LoginUserCommand): Promise<any> {
    return await this.useCase.execute(command);
  }
}

