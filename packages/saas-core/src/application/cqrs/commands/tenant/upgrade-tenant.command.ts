/**
 * 升级租户命令
 *
 * @class UpgradeTenantCommand
 * @since 1.0.0
 */

import { TenantType } from '../../../../domain/tenant/value-objects/tenant-type.enum';

export class UpgradeTenantCommand {
  constructor(
    public readonly tenantId: string,
    public readonly targetType: TenantType,
    public readonly upgradedBy: string,
  ) {}
}

