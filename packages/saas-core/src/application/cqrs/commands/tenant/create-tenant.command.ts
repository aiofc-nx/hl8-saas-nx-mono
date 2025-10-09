/**
 * 创建租户命令
 *
 * @description CQRS 命令对象，封装创建租户的请求数据
 *
 * @class CreateTenantCommand
 * @since 1.0.0
 */

import { TenantType } from '../../../../domain/tenant/value-objects/tenant-type.enum';

export class CreateTenantCommand {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly domain: string,
    public readonly type: TenantType,
    public readonly createdBy: string,
  ) {}
}

