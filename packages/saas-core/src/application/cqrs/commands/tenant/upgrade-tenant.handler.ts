/**
 * 升级租户命令处理器
 *
 * @class UpgradeTenantHandler
 * @since 1.0.0
 */

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpgradeTenantCommand } from './upgrade-tenant.command';
import { UpgradeTenantUseCase } from '../../../use-cases/tenant/upgrade-tenant.use-case';

@CommandHandler(UpgradeTenantCommand)
export class UpgradeTenantHandler
  implements ICommandHandler<UpgradeTenantCommand, void>
{
  constructor(private readonly useCase: UpgradeTenantUseCase) {}

  async execute(command: UpgradeTenantCommand): Promise<void> {
    await this.useCase.execute({
      tenantId: command.tenantId,
      targetType: command.targetType,
      upgradedBy: command.upgradedBy,
    });
  }
}

