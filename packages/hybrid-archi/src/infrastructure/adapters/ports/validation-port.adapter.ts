/**
 * 验证端口适配器
 *
 * 实现应用层验证端口接口，提供统一的数据验证能力。
 * 作为通用功能组件，支持多种验证规则和验证策略。
 *
 * @description 验证端口适配器实现应用层数据验证需求
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import {
  IValidationPort,
  IValidationSchema,
  IValidationResult,
  IPasswordPolicy,
  IPasswordValidationResult,
  ISanitizationRules,
} from '../../../application/ports/shared/shared-ports.interface';

/**
 * 验证规则类型枚举
 */
export enum ValidationRuleType {
  /** 必填验证 */
  REQUIRED = 'required',
  /** 字符串长度验证 */
  STRING_LENGTH = 'string_length',
  /** 数字范围验证 */
  NUMBER_RANGE = 'number_range',
  /** 邮箱验证 */
  EMAIL = 'email',
  /** 手机号验证 */
  PHONE = 'phone',
  /** 正则表达式验证 */
  REGEX = 'regex',
  /** 自定义验证 */
  CUSTOM = 'custom',
}

/**
 * 验证规则接口
 */
export interface IValidationRule {
  /** 规则类型 */
  type: ValidationRuleType;
  /** 规则参数 */
  params?: Record<string, unknown>;
  /** 错误消息 */
  message?: string;
  /** 自定义验证函数 */
  customValidator?: (value: unknown) => boolean;
}

/**
 * 验证端口适配器
 *
 * 实现应用层验证端口接口
 */
@Injectable()
export class ValidationPortAdapter implements IValidationPort {
  /**
   * 验证数据
   *
   * @param data - 要验证的数据
   * @param schema - 验证模式
   * @returns 验证结果
   */
  async validate(
    data: unknown,
    schema: IValidationSchema
  ): Promise<IValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    try {
      // 验证每个字段
      for (const [fieldName, rules] of Object.entries(schema)) {
        const fieldValue = this.getFieldValue(data, fieldName);
        const fieldErrors = await this.validateField(
          fieldName,
          fieldValue,
          rules
        );
        errors.push(...fieldErrors);
      }

      return {
        isValid: errors.length === 0,
        errors: errors,
        warnings: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: 'system',
            message: '验证过程中发生错误',
            code: 'VALIDATION_ERROR',
            value: error instanceof Error ? error.message : String(error),
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * 验证单个字段
   *
   * @param fieldName - 字段名
   * @param value - 字段值
   * @param rules - 验证规则
   * @returns 字段验证错误
   */
  private async validateField(
    fieldName: string,
    value: unknown,
    rules: IValidationRule[]
  ): Promise<Array<{ field: string; message: string; code: string }>> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    for (const rule of rules) {
      const isValid = await this.validateRule(value, rule);
      if (!isValid) {
        errors.push({
          field: fieldName,
          message: rule.message || `字段 ${fieldName} 验证失败`,
          code: rule.type,
        });
      }
    }

    return errors;
  }

  /**
   * 验证单个规则
   *
   * @param value - 要验证的值
   * @param rule - 验证规则
   * @returns 是否通过验证
   */
  private async validateRule(
    value: unknown,
    rule: IValidationRule
  ): Promise<boolean> {
    switch (rule.type) {
      case ValidationRuleType.REQUIRED:
        return this.validateRequired(value);
      case ValidationRuleType.STRING_LENGTH:
        return this.validateStringLength(value, rule.params);
      case ValidationRuleType.NUMBER_RANGE:
        return this.validateNumberRange(value, rule.params);
      case ValidationRuleType.EMAIL:
        return this.validateEmail(value as string);
      case ValidationRuleType.PHONE:
        return this.validatePhone(value as string);
      case ValidationRuleType.REGEX:
        return this.validateRegex(value, rule.params);
      case ValidationRuleType.CUSTOM:
        return rule.customValidator ? rule.customValidator(value) : true;
      default:
        return true;
    }
  }

  /**
   * 获取字段值
   *
   * @param data - 数据对象
   * @param fieldName - 字段名
   * @returns 字段值
   */
  private getFieldValue(data: unknown, fieldName: string): unknown {
    if (typeof data === 'object' && data !== null) {
      return (data as Record<string, unknown>)[fieldName];
    }
    return undefined;
  }

  // ==================== 验证规则实现 ====================

  /**
   * 必填验证
   */
  private validateRequired(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
  }

  /**
   * 字符串长度验证
   */
  private validateStringLength(
    value: unknown,
    params?: Record<string, unknown>
  ): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const minLength = (params as any)?.minLength as number;
    const maxLength = (params as any)?.maxLength as number;

    if (minLength !== undefined && value.length < minLength) {
      return false;
    }

    if (maxLength !== undefined && value.length > maxLength) {
      return false;
    }

    return true;
  }

  /**
   * 数字范围验证
   */
  private validateNumberRange(
    value: unknown,
    params?: Record<string, unknown>
  ): boolean {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return false;
    }

    const min = (params as any)?.min as number;
    const max = (params as any)?.max as number;

    if (min !== undefined && numValue < min) {
      return false;
    }

    if (max !== undefined && numValue > max) {
      return false;
    }

    return true;
  }

  /**
   * 邮箱验证（私有方法）
   */
  private validateEmailInternal(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * 手机号验证（私有方法）
   */
  private validatePhoneInternal(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(value);
  }

  /**
   * 正则表达式验证
   */
  private validateRegex(
    value: unknown,
    params?: Record<string, unknown>
  ): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const pattern = (params as any)?.pattern as string;
    if (!pattern) {
      return true;
    }

    try {
      const regex = new RegExp(pattern);
      return regex.test(value);
    } catch {
      return false;
    }
  }

  /**
   * 验证邮箱格式
   *
   * @param email - 邮箱地址
   * @returns 如果格式正确返回true，否则返回false
   */
  validateEmail(email: string): boolean {
    return this.validateEmailInternal(email);
  }

  /**
   * 验证手机号格式
   *
   * @param phone - 手机号
   * @param region - 地区代码
   * @returns 如果格式正确返回true，否则返回false
   */
  validatePhone(phone: string, region?: string): boolean {
    return this.validatePhoneInternal(phone);
  }

  /**
   * 验证密码强度
   *
   * @param password - 密码
   * @param policy - 密码策略
   * @returns 验证结果
   */
  validatePassword(
    password: string,
    policy?: IPasswordPolicy
  ): IPasswordValidationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let strength = 0;

    // 基础长度检查
    if (password.length < 8) {
      errors.push('密码长度至少8位');
      suggestions.push('增加密码长度');
    } else {
      strength += 20;
    }

    // 字符类型检查
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (hasUpperCase) strength += 20;
    if (hasLowerCase) strength += 20;
    if (hasNumbers) strength += 20;
    if (hasSpecialChar) strength += 20;

    const typeCount = [
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;

    if (typeCount < 3) {
      errors.push('密码应包含至少3种字符类型（大小写字母、数字、特殊字符）');
      suggestions.push('添加大写字母、小写字母、数字或特殊字符');
    }

    return {
      isValid: errors.length === 0,
      strength,
      errors,
      suggestions,
    };
  }

  /**
   * 数据脱敏
   *
   * @param data - 原始数据
   * @param rules - 脱敏规则
   * @returns 脱敏后的数据
   */
  sanitize<T>(data: T, rules: ISanitizationRules): T {
    if (typeof data === 'string') {
      return data.trim() as T;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item, rules)) as T;
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        const fieldRule = rules.fields[key];
        if (fieldRule) {
          switch (fieldRule.type) {
            case 'mask':
              sanitized[key] = this.maskValue(value);
              break;
            case 'remove':
              // 不添加该字段
              break;
            case 'hash':
              sanitized[key] = this.hashValue(value);
              break;
            case 'encrypt':
              sanitized[key] = this.encryptValue(value);
              break;
            default:
              sanitized[key] = this.sanitize(value, rules);
          }
        } else if (rules.defaultRule) {
          switch (rules.defaultRule.type) {
            case 'mask':
              sanitized[key] = this.maskValue(value);
              break;
            case 'remove':
              // 不添加该字段
              break;
            case 'hash':
              sanitized[key] = this.hashValue(value);
              break;
            case 'encrypt':
              sanitized[key] = this.encryptValue(value);
              break;
            default:
              sanitized[key] = this.sanitize(value, rules);
          }
        } else {
          sanitized[key] = this.sanitize(value, rules);
        }
      }
      return sanitized as T;
    }

    return data;
  }

  /**
   * 掩码处理
   */
  private maskValue(value: unknown): string {
    if (typeof value === 'string') {
      if (value.length <= 2) {
        return '*'.repeat(value.length);
      }
      return (
        value.charAt(0) +
        '*'.repeat(value.length - 2) +
        value.charAt(value.length - 1)
      );
    }
    return '***';
  }

  /**
   * 哈希处理
   */
  private hashValue(value: unknown): string {
    // 简单的哈希实现
    const str = String(value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 加密处理
   */
  private encryptValue(value: unknown): string {
    // 简单的Base64编码作为示例
    return Buffer.from(String(value)).toString('base64');
  }

  /**
   * 创建验证模式构建器
   *
   * @returns 验证模式构建器
   */
  createSchemaBuilder(): IValidationSchemaBuilder {
    return new ValidationSchemaBuilder();
  }
}

/**
 * 验证模式构建器接口
 */
export interface IValidationSchemaBuilder {
  /**
   * 添加字段验证规则
   *
   * @param fieldName - 字段名
   * @param rules - 验证规则
   * @returns 构建器实例
   */
  addField(
    fieldName: string,
    rules: IValidationRule[]
  ): IValidationSchemaBuilder;

  /**
   * 构建验证模式
   *
   * @returns 验证模式
   */
  build(): IValidationSchema;
}

/**
 * 验证模式构建器
 */
class ValidationSchemaBuilder implements IValidationSchemaBuilder {
  private schema: IValidationSchema = { type: 'object' };

  addField(
    fieldName: string,
    rules: IValidationRule[]
  ): IValidationSchemaBuilder {
    (this.schema as any)[fieldName] = rules;
    return this;
  }

  build(): IValidationSchema {
    return { ...this.schema };
  }
}
