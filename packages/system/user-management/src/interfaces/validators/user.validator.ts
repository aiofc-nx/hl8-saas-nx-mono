/**
 * 用户验证器
 *
 * @description 用户相关数据验证器
 * @since 1.0.0
 */

import {
  IsEmail,
  IsString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
  IsUrl,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  DISABLED = 'disabled',
  DELETED = 'deleted',
}

/**
 * 创建用户验证器
 *
 * @description 验证创建用户请求数据
 */
export class CreateUserValidator {
  @IsEmail({}, { message: '邮箱格式无效' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  email!: string;

  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名至少3个字符' })
  @MaxLength(20, { message: '用户名最多20个字符' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '用户名只能包含字母、数字、下划线和连字符',
  })
  username!: string;

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(128, { message: '密码最多128个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符',
  })
  password!: string;

  @IsString({ message: '名字必须是字符串' })
  @IsNotEmpty({ message: '名字不能为空' })
  @MinLength(1, { message: '名字至少1个字符' })
  @MaxLength(50, { message: '名字最多50个字符' })
  firstName!: string;

  @IsString({ message: '姓氏必须是字符串' })
  @IsNotEmpty({ message: '姓氏不能为空' })
  @MinLength(1, { message: '姓氏至少1个字符' })
  @MaxLength(50, { message: '姓氏最多50个字符' })
  lastName!: string;

  @IsOptional()
  @IsUrl({}, { message: '头像必须是有效的URL' })
  avatar?: string;

  @IsOptional()
  @IsPhoneNumber('CN', { message: '手机号格式无效' })
  phone?: string;

  @IsOptional()
  @IsString({ message: '租户ID必须是字符串' })
  tenantId?: string;
}

/**
 * 更新用户配置文件验证器
 *
 * @description 验证更新用户配置文件请求数据
 */
export class UpdateUserProfileValidator {
  @IsString({ message: '名字必须是字符串' })
  @IsNotEmpty({ message: '名字不能为空' })
  @MinLength(1, { message: '名字至少1个字符' })
  @MaxLength(50, { message: '名字最多50个字符' })
  firstName!: string;

  @IsString({ message: '姓氏必须是字符串' })
  @IsNotEmpty({ message: '姓氏不能为空' })
  @MinLength(1, { message: '姓氏至少1个字符' })
  @MaxLength(50, { message: '姓氏最多50个字符' })
  lastName!: string;

  @IsOptional()
  @IsUrl({}, { message: '头像必须是有效的URL' })
  avatar?: string;

  @IsOptional()
  @IsPhoneNumber('CN', { message: '手机号格式无效' })
  phone?: string;
}

/**
 * 认证用户验证器
 *
 * @description 验证用户认证请求数据
 */
export class AuthenticateUserValidator {
  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  password!: string;
}

/**
 * 用户查询验证器
 *
 * @description 验证用户查询请求数据
 */
export class UserQueryValidator {
  @IsOptional()
  @IsString({ message: '状态必须是字符串' })
  @IsEnum(UserStatus, { message: '状态值无效' })
  status?: UserStatus;

  @IsOptional()
  @IsString({ message: '搜索关键词必须是字符串' })
  @MaxLength(100, { message: '搜索关键词最多100个字符' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码必须大于0' })
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: '每页大小必须是数字' })
  @Min(1, { message: '每页大小必须大于0' })
  @Max(100, { message: '每页大小不能超过100' })
  limit?: number;
}
