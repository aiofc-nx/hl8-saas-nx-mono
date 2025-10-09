import { CqrsBaseCommand } from '@hl8/hybrid-archi';

export class RegisterUserCommand extends CqrsBaseCommand {
  constructor(
    tenantId: string,
    userId: string,
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly phoneNumber?: string,
  ) {
    super(tenantId, userId);
  }

  get commandType(): string {
    return 'RegisterUserCommand';
  }
}

