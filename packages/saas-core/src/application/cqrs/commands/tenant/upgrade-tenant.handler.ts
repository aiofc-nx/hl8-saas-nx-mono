/**
 * 升级租户命令处理器
 *
 * @class UpgradeTenantHandler
 * @since 1.0.0
 */

import { CommandHandler, ICommandHandler } from '@hl8/hybrid-archi';
import { UpgradeTenantCommand } from './upgrade-tenant.command';
import { UpgradeTenantUseCase } from '../../../use-cases/tenant/upgrade-tenant.use-case';

// @CommandHandler('UpgradeTenantCommand') // TODO: 修复装饰器类型问题
export class UpgradeTenantHandler
  implements ICommandHandler<UpgradeTenantCommand, void>
{
  constructor(private readonly useCase: UpgradeTenantUseCase) {}

  async execute(command: UpgradeTenantCommand): Promise<void> {
    await this.useCase.execute({
      tenantId: command.targetTenantId,
      targetType: command.targetType,
      upgradedBy: command.userId, // 使用 BaseCommand 的 userId
    });
  }
}

