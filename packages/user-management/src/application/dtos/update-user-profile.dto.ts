/**
 * 更新用户配置文件DTO
 *
 * @description 更新用户配置文件的数据传输对象，包含完整的验证规则
 * @since 1.0.0
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

/**
 * 更新用户配置文件DTO
 *
 * @description 更新用户配置文件的数据传输对象，包含完整的验证规则
 */
export class UpdateUserProfileDto {
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
  @Matches(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i, {
    message: '头像必须是有效的图片URL',
  })
  avatar?: string;

  @IsOptional()
  @IsString({ message: '手机号必须是字符串' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

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

  /**
   * 检查是否有头像
   *
   * @description 判断是否提供了头像URL
   * @returns 是否有头像
   */
  hasAvatar(): boolean {
    return !!this.avatar && this.avatar.trim().length > 0;
  }

  /**
   * 检查是否有手机号
   *
   * @description 判断是否提供了手机号
   * @returns 是否有手机号
   */
  hasPhone(): boolean {
    return !!this.phone && this.phone.trim().length > 0;
  }
}
