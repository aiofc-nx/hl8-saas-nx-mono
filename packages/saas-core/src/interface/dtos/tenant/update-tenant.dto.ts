/**
 * 更新租户 DTO
 *
 * @class UpdateTenantDto
 * @since 1.0.0
 */

import { IsString, IsOptional, Length } from 'class-validator';
import { TENANT_NAME_VALIDATION } from '../../../constants/tenant.constants';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  @Length(
    TENANT_NAME_VALIDATION.MIN_LENGTH,
    TENANT_NAME_VALIDATION.MAX_LENGTH,
    { message: TENANT_NAME_VALIDATION.ERROR_MESSAGE },
  )
  name?: string;
}

