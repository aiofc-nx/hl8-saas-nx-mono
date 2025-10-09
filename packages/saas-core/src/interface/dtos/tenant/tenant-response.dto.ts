/**
 * 租户响应 DTO
 *
 * @class TenantResponseDto
 * @since 1.0.0
 */

import { TenantType } from '../../../domain/tenant/value-objects/tenant-type.enum';
import { TenantStatus } from '@hl8/hybrid-archi';

export class TenantResponseDto {
  id!: string;
  code!: string;
  name!: string;
  domain!: string;
  type!: TenantType;
  status!: TenantStatus;
  trialEndsAt?: string;
  activatedAt?: string;
  createdAt!: string;
  updatedAt!: string;

  static fromAggregate(aggregate: any): TenantResponseDto {
    const dto = new TenantResponseDto();
    const tenant = aggregate.getTenant();
    
    dto.id = tenant.id.toString();
    dto.code = tenant.getCode().value;
    dto.name = tenant.getName();
    dto.domain = tenant.getDomain().value;
    dto.type = tenant.getType();
    dto.status = tenant.getStatus();
    dto.trialEndsAt = tenant.getTrialEndsAt()?.toISOString();
    dto.activatedAt = tenant.getActivatedAt()?.toISOString();
    dto.createdAt = tenant.createdAt.toISOString();
    dto.updatedAt = tenant.updatedAt.toISOString();
    
    return dto;
  }
}

