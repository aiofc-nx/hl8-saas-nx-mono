import { CqrsBaseCommand } from '@hl8/hybrid-archi';

export class LoginUserCommand extends CqrsBaseCommand {
  constructor(
    tenantId: string,
    userId: string,
    public readonly email: string,
    public readonly password: string,
    public readonly ip: string,
    public readonly userAgent: string,
  ) {
    super(tenantId, userId);
  }

  get commandType(): string {
    return 'LoginUserCommand';
  }
}

