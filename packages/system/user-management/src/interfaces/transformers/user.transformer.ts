/**
 * 用户转换器
 *
 * @description 用户数据转换器
 * @since 1.0.0
 */

import { Transform, TransformFnParams } from 'class-transformer';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email, Username, Password } from '@hl8/hybrid-archi';
import { UserProfile } from '../../domain/value-objects/user-profile.vo';

/**
 * 用户转换器
 *
 * @description 提供用户数据的转换功能
 *
 * ## 业务规则
 *
 * ### 数据转换规则
 * - 字符串到值对象的转换
 * - 值对象到字符串的转换
 * - 嵌套对象的转换
 * - 数组数据的转换
 *
 * ### 数据验证规则
 * - 转换过程中进行数据验证
 * - 无效数据抛出异常
 * - 支持默认值设置
 * - 支持数据清理和格式化
 */
export class UserTransformer {
  /**
   * 转换用户ID
   *
   * @description 将字符串转换为UserId值对象
   * @param value - 字符串值
   * @returns UserId值对象
   */
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return undefined;
    try {
      return UserId.create(value);
    } catch (error) {
      throw new Error(`无效的用户ID: ${value}`);
    }
  })
  id?: UserId;

  /**
   * 转换邮箱
   *
   * @description 将字符串转换为Email值对象
   * @param value - 字符串值
   * @returns Email值对象
   */
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return undefined;
    try {
      return Email.create(value);
    } catch (error) {
      throw new Error(`无效的邮箱: ${value}`);
    }
  })
  email?: Email;

  /**
   * 转换用户名
   *
   * @description 将字符串转换为Username值对象
   * @param value - 字符串值
   * @returns Username值对象
   */
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return undefined;
    try {
      return Username.create(value);
    } catch (error) {
      throw new Error(`无效的用户名: ${value}`);
    }
  })
  username?: Username;

  /**
   * 转换密码
   *
   * @description 将字符串转换为Password值对象
   * @param value - 字符串值
   * @returns Password值对象
   */
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return undefined;
    try {
      return Password.create(value);
    } catch (error) {
      throw new Error(`无效的密码: ${value}`);
    }
  })
  password?: Password;

  /**
   * 转换用户配置文件
   *
   * @description 将对象转换为UserProfile值对象
   * @param value - 对象值
   * @returns UserProfile值对象
   */
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return undefined;
    try {
      return UserProfile.create(value);
    } catch (error) {
      throw new Error(`无效的用户配置文件: ${JSON.stringify(value)}`);
    }
  })
  profile?: UserProfile;

  /**
   * 转换字符串数组
   *
   * @description 将字符串转换为字符串数组
   * @param value - 字符串值
   * @returns 字符串数组
   */
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim());
    }
    return [];
  })
  tags?: string[];

  /**
   * 转换数字
   *
   * @description 将字符串转换为数字
   * @param value - 字符串值
   * @returns 数字
   */
  @Transform(({ value }: TransformFnParams) => {
    if (value === undefined || value === null) return undefined;
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`无效的数字: ${value}`);
    }
    return num;
  })
  age?: number;

  /**
   * 转换布尔值
   *
   * @description 将字符串转换为布尔值
   * @param value - 字符串值
   * @returns 布尔值
   */
  @Transform(({ value }: TransformFnParams) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  })
  isActive?: boolean;

  /**
   * 转换日期
   *
   * @description 将字符串转换为日期
   * @param value - 字符串值
   * @returns 日期对象
   */
  @Transform(({ value }: TransformFnParams) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error(`无效的日期: ${value}`);
    }
    return date;
  })
  createdAt?: Date;
}
