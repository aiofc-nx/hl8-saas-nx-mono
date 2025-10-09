/**
 * 创建租户用例
 *
 * @description 处理创建新租户的业务场景
 *
 * ## 业务规则
 *
 * ### 前置条件
 * - 租户代码必须全局唯一
 * - 租户域名必须全局唯一
 * - 租户名称不能为空
 *
 * ### 业务流程
 * 1. 验证租户代码和域名唯一性
 * 2. 创建租户聚合根（默认试用状态）
 * 3. 根据租户类型分配配额
 * 4. 保存租户到仓储
 * 5. 发布租户创建事件
 *
 * ### 后置条件
 * - 租户状态为 TRIAL
 * - 试用期为30天
 * - 配额已按类型配置
 *
 * @example
 * ```typescript
 * const useCase = new CreateTenantUseCase(tenantRepository);
 * const command = {
 *   code: 'acme2024',
 *   name: 'Acme Corporation',
 *   domain: 'acme.example.com',
 *   type: 'FREE',
 *   createdBy: 'admin-123',
 * };
 * const tenantId = await useCase.execute(command);
 * ```
 *
 * @class CreateTenantUseCase
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '@hl8/hybrid-archi';
import { ICommandUseCase } from '../base/use-case.interface';
import { TenantAggregate } from '../../../domain/tenant/aggregates/tenant.aggregate';
import { ITenantAggregateRepository } from '../../../domain/tenant/repositories/tenant-aggregate.repository.interface';
import { TenantCode } from '../../../domain/tenant/value-objects/tenant-code.vo';
import { TenantDomain } from '../../../domain/tenant/value-objects/tenant-domain.vo';
import { TenantType } from '../../../domain/tenant/value-objects/tenant-type.enum';

/**
 * 创建租户命令
 *
 * @interface ICreateTenantCommand
 */
export interface ICreateTenantCommand {
  /** 租户代码 */
  code: string;
  /** 租户名称 */
  name: string;
  /** 租户域名 */
  domain: string;
  /** 租户类型 */
  type: TenantType;
  /** 创建人ID */
  createdBy: string;
}

/**
 * 创建租户用例
 *
 * @class CreateTenantUseCase
 * @implements {ICommandUseCase<ICreateTenantCommand, EntityId>}
 */
@Injectable()
export class CreateTenantUseCase
  implements ICommandUseCase<ICreateTenantCommand, EntityId>
{
  constructor(
    private readonly tenantRepository: ITenantAggregateRepository,
  ) {}

  /**
   * 执行创建租户用例
   *
   * @async
   * @param {ICreateTenantCommand} command - 创建租户命令
   * @returns {Promise<EntityId>} 新创建的租户ID
   * @throws {Error} 当租户代码或域名已存在时抛出错误
   */
  async execute(command: ICreateTenantCommand): Promise<EntityId> {
    // 1. 创建值对象
    const code = TenantCode.create(command.code);
    const domain = TenantDomain.create(command.domain);

    // 2. 验证唯一性
    await this.validateUniqueness(code, domain);

    // 3. 创建租户聚合根
    const tenantId = EntityId.generate();
    const aggregate = TenantAggregate.create(
      tenantId,
      code,
      command.name,
      domain,
      command.type,
      { createdBy: command.createdBy },
    );

    // 4. 保存到仓储
    await this.tenantRepository.save(aggregate);

    // 5. 返回租户ID
    return tenantId;
  }

  /**
   * 验证租户代码和域名的唯一性
   *
   * @private
   * @async
   * @param {TenantCode} code - 租户代码
   * @param {TenantDomain} domain - 租户域名
   * @throws {Error} 当代码或域名已存在时抛出错误
   */
  private async validateUniqueness(
    code: TenantCode,
    domain: TenantDomain,
  ): Promise<void> {
    // 检查代码唯一性
    const codeExists = await this.tenantRepository.existsByCode(code);
    if (codeExists) {
      throw new Error(`租户代码 ${code.value} 已存在`);
    }

    // 检查域名唯一性
    const domainExists = await this.tenantRepository.existsByDomain(domain);
    if (domainExists) {
      throw new Error(`租户域名 ${domain.value} 已存在`);
    }
  }
}

