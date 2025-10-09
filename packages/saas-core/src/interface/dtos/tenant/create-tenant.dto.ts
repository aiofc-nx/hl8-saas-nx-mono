/**
 * 创建租户 DTO
 *
 * @description 创建租户的请求数据传输对象
 *
 * @class CreateTenantDto
 * @since 1.0.0
 */

import { IsString, IsEnum, Length, Matches, IsNotEmpty } from 'class-validator';
import { TenantType } from '../../../domain/tenant/value-objects/tenant-type.enum';
import {
  TENANT_CODE_VALIDATION,
  TENANT_NAME_VALIDATION,
  TENANT_DOMAIN_VALIDATION,
} from '../../../constants/tenant.constants';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: '租户代码不能为空' })
  @Length(
    TENANT_CODE_VALIDATION.MIN_LENGTH,
    TENANT_CODE_VALIDATION.MAX_LENGTH,
    { message: TENANT_CODE_VALIDATION.ERROR_MESSAGE },
  )
  @Matches(TENANT_CODE_VALIDATION.PATTERN, {
    message: TENANT_CODE_VALIDATION.ERROR_MESSAGE,
  })
  code!: string;

  @IsString()
  @IsNotEmpty({ message: '租户名称不能为空' })
  @Length(
    TENANT_NAME_VALIDATION.MIN_LENGTH,
    TENANT_NAME_VALIDATION.MAX_LENGTH,
    { message: TENANT_NAME_VALIDATION.ERROR_MESSAGE },
  )
  name!: string;

  @IsString()
  @IsNotEmpty({ message: '租户域名不能为空' })
  @Matches(TENANT_DOMAIN_VALIDATION.PATTERN, {
    message: TENANT_DOMAIN_VALIDATION.ERROR_MESSAGE,
  })
  domain!: string;

  @IsEnum(TenantType, { message: '无效的租户类型' })
  type!: TenantType;
}

