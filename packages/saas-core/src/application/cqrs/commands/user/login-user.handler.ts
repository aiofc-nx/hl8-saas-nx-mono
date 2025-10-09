import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LoginUserCommand } from './login-user.command';
import { LoginUserUseCase } from '../../../use-cases/user/login-user.use-case';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand, any> {
  constructor(private readonly useCase: LoginUserUseCase) {}

  async execute(command: LoginUserCommand): Promise<any> {
    return await this.useCase.execute(command);
  }
}

