/**
 * 数据验证管道
 *
 * @description 为控制器提供数据验证功能
 * 支持DTO验证、类型转换、格式检查等
 *
 * @since 1.0.0
 */

import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ILoggerService } from '../../shared/interfaces';

/**
 * 数据验证管道
 *
 * @description 实现数据验证和转换
 */
@Injectable()
export class ValidationPipe implements PipeTransform<unknown> {
  constructor(private readonly logger: ILoggerService) {}

  /**
   * 数据验证和转换
   *
   * @description 验证输入数据并转换为目标类型
   *
   * @param value - 输入值
   * @param metadata - 参数元数据
   * @returns 转换后的值
   * @throws {BadRequestException} 验证失败
   */
  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    const { type, metatype, data } = metadata;

    // 跳过基础类型
    if (!metatype || this.isBasicType(metatype)) {
      return value;
    }

    try {
      // 1. 类型转换
      const transformedValue = this.transformValue(value, metatype);

      // 2. 数据验证
      const validationResult = await this.validateValue(
        transformedValue,
        metatype
      );

      if (!validationResult.isValid) {
        throw new BadRequestException({
          message: '数据验证失败',
          errors: validationResult.errors,
          field: data,
        });
      }

      // 3. 安全清理
      const sanitizedValue = this.sanitizeValue(validationResult.value);

      this.logger.debug('数据验证通过', {
        type,
        metatype: metatype.name,
        field: data,
      });

      return sanitizedValue;
    } catch (error) {
      this.logger.error('数据验证失败', {
        type,
        metatype: metatype?.name,
        field: data,
        value: this.safeStringify(value),
        error: error instanceof Error ? error.message : String(error),
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('请求参数格式错误');
    }
  }

  /**
   * 类型转换
   *
   * @description 将输入值转换为目标类型
   *
   * @param value - 输入值
   * @param metatype - 目标类型
   * @returns 转换后的值
   */
  private transformValue(value: unknown, metatype: unknown): unknown {
    // 字符串转换
    if (typeof value === 'string') {
      value = value.trim();
    }

    // 数字转换
    if (metatype === Number && typeof value === 'string') {
      const num = Number(value);
      if (!isNaN(num)) {
        return num;
      }
    }

    // 布尔转换
    if (metatype === Boolean && typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    // 日期转换
    if (metatype === Date && typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    // 对象转换
    if (typeof value === 'object' && value !== null && metatype !== Object) {
      return plainToClass(metatype as { new (): unknown }, value as object);
    }

    return value;
  }

  /**
   * 数据验证
   *
   * @description 验证转换后的数据
   *
   * @param value - 要验证的值
   * @param metatype - 目标类型
   * @returns 验证结果
   */
  private async validateValue(
    value: unknown,
    metatype: unknown
  ): Promise<{
    isValid: boolean;
    value: unknown;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 使用class-validator进行验证
    const validationErrors = await validate(value as object);

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => {
        if (error.constraints) {
          Object.values(error.constraints).forEach((constraint) => {
            errors.push(constraint);
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      value,
      errors,
    };
  }

  /**
   * 数据清理
   *
   * @description 清理敏感信息和潜在的安全风险
   *
   * @param value - 要清理的值
   * @returns 清理后的值
   */
  private sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      // XSS防护
      value = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '');

      // SQL注入防护
      value = (value as string).replace(/'/g, "''").replace(/;/g, '');
    }

    if (typeof value === 'object' && value !== null) {
      // 递归清理对象属性
      const sanitized: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val);
      }
      return sanitized;
    }

    return value;
  }

  /**
   * 检查是否为基础类型
   *
   * @description 检查类型是否为JavaScript基础类型
   *
   * @param metatype - 类型
   * @returns 是否为基础类型
   */
  private isBasicType(metatype: unknown): boolean {
    const basicTypes = [String, Boolean, Number, Array, Object];
    return basicTypes.includes(metatype as typeof String);
  }

  /**
   * 安全序列化
   *
   * @description 安全地将值序列化为字符串
   *
   * @param value - 要序列化的值
   * @returns 序列化后的字符串
   */
  private safeStringify(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
