/**
 * 创建租户命令处理器
 *
 * @description 处理创建租户命令，委托给用例执行
 *
 * @class CreateTenantHandler
 * @since 1.0.0
 */

import { CommandHandler, ICommandHandler } from '@hl8/hybrid-archi';
import { CreateTenantCommand } from './create-tenant.command';
import { CreateTenantUseCase } from '../../../use-cases/tenant/create-tenant.use-case';
import { EntityId } from '@hl8/hybrid-archi';

// @CommandHandler('CreateTenantCommand') // TODO: 修复装饰器类型问题
export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand, EntityId>
{
  constructor(private readonly useCase: CreateTenantUseCase) {}

  async execute(command: CreateTenantCommand): Promise<EntityId> {
    return await this.useCase.execute({
      code: command.code,
      name: command.name,
      domain: command.domain,
      type: command.type,
      createdBy: command.userId, // 使用 BaseCommand 的 userId
    });
  }
}

