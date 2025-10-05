/**
 * 创建用户DTO
 *
 * @description 创建用户的数据传输对象，包含完整的验证规则
 * @since 1.0.0
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * 创建用户DTO
 *
 * @description 创建用户的数据传输对象，包含完整的验证规则
 */
export class CreateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @IsNotEmpty({ message: '邮箱不能为空' })
  @MaxLength(320, { message: '邮箱长度不能超过320个字符' })
  email!: string;

  @IsString({ message: '用户名必须是字符串' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '用户名只能包含字母、数字、下划线和连字符',
  })
  username!: string;

  @IsString({ message: '密码必须是字符串' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码长度不能少于8个字符' })
  @MaxLength(128, { message: '密码长度不能超过128个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      '密码必须包含至少一个小写字母、一个大写字母、一个数字和一个特殊字符',
  })
  password!: string;

  @IsString({ message: '姓名必须是字符串' })
  @IsNotEmpty({ message: '姓名不能为空' })
  @MinLength(2, { message: '姓名长度不能少于2个字符' })
  @MaxLength(50, { message: '姓名长度不能超过50个字符' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, {
    message: '姓名只能包含中文、英文和空格',
  })
  firstName!: string;

  @IsString({ message: '姓氏必须是字符串' })
  @IsNotEmpty({ message: '姓氏不能为空' })
  @MinLength(2, { message: '姓氏长度不能少于2个字符' })
  @MaxLength(50, { message: '姓氏长度不能超过50个字符' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, {
    message: '姓氏只能包含中文、英文和空格',
  })
  lastName!: string;

  @IsOptional()
  @IsString({ message: '头像必须是字符串' })
  @MaxLength(500, { message: '头像URL长度不能超过500个字符' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsString({ message: '租户ID必须是字符串' })
  @Matches(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    {
      message: '租户ID格式不正确',
    }
  )
  tenantId?: string;

  /**
   * 获取邮箱域名
   *
   * @description 提取邮箱的域名部分
   * @returns 邮箱域名
   */
  getEmailDomain(): string {
    return this.email.split('@')[1];
  }

  /**
   * 检查是否为企业邮箱
   *
   * @description 判断是否为企业邮箱（非公共邮箱）
   * @returns 是否为企业邮箱
   */
  isCorporateEmail(): boolean {
    const publicDomains = [
      'gmail.com',
      'yahoo.com',
      'qq.com',
      '163.com',
      '126.com',
    ];
    return !publicDomains.includes(this.getEmailDomain().toLowerCase());
  }

  /**
   * 获取完整姓名
   *
   * @description 组合姓名和姓氏
   * @returns 完整姓名
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * 获取用户显示名称
   *
   * @description 获取用户的首字母缩写
   * @returns 用户显示名称
   */
  getDisplayName(): string {
    const firstInitial = this.firstName.charAt(0).toUpperCase();
    const lastInitial = this.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }
}
