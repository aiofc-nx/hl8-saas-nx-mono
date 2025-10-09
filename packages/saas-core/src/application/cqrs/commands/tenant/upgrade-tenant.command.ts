/**
 * 升级租户命令
 *
 * @class UpgradeTenantCommand
 * @since 1.0.0
 */

import { CqrsBaseCommand } from '@hl8/hybrid-archi';
import { TenantType } from '../../../../domain/tenant/value-objects/tenant-type.enum';

export class UpgradeTenantCommand extends CqrsBaseCommand {
  constructor(
    tenantId: string,
    userId: string,
    public readonly targetTenantId: string,
    public readonly targetType: TenantType,
  ) {
    super(tenantId, userId);
  }

  get commandType(): string {
    return 'UpgradeTenantCommand';
  }
}

