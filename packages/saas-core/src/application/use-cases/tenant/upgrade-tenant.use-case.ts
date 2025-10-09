/**
 * 升级租户用例
 *
 * @description 处理租户类型升级的业务场景
 *
 * @class UpgradeTenantUseCase
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '@hl8/hybrid-archi';
import { ICommandUseCase } from '../base/use-case.interface';
import { ITenantAggregateRepository } from '../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantUpgradeService } from '../../../domain/tenant/services/tenant-upgrade.service';
import { TenantType } from '../../../domain/tenant/value-objects/tenant-type.enum';

export interface IUpgradeTenantCommand {
  tenantId: string;
  targetType: TenantType;
  upgradedBy: string;
}

@Injectable()
export class UpgradeTenantUseCase
  implements ICommandUseCase<IUpgradeTenantCommand, void>
{
  private readonly upgradeService: TenantUpgradeService;

  constructor(private readonly tenantRepository: ITenantAggregateRepository) {
    this.upgradeService = new TenantUpgradeService();
  }

  async execute(command: IUpgradeTenantCommand): Promise<void> {
    // 加载租户聚合根
    const tenantId = EntityId.fromString(command.tenantId);
    const aggregate = await this.tenantRepository.findById(tenantId);

    if (!aggregate) {
      throw new Error(`租户不存在: ${command.tenantId}`);
    }

    // 执行升级
    aggregate.upgrade(command.targetType, command.upgradedBy);

    // 保存
    await this.tenantRepository.save(aggregate);
  }
}

