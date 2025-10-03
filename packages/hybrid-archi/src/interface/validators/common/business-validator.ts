/**
 * 业务验证器
 *
 * 提供完整的业务验证功能，包括业务规则验证、数据完整性验证、业务逻辑验证等。
 * 作为通用功能组件，为业务模块提供强大的验证能力。
 *
 * @description 业务验证器的完整实现，支持多种验证场景
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { PinoLogger } from '@hl8/logger';

/**
 * 验证结果接口
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: ValidationMetadata;
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
  severity: 'error' | 'warning' | 'info';
  context?: Record<string, any>;
}

/**
 * 验证警告接口
 */
export interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  value?: any;
  context?: Record<string, any>;
}

/**
 * 验证元数据接口
 */
export interface ValidationMetadata {
  validatedAt: Date;
  validator: string;
  version: string;
  duration: number;
  rulesApplied: string[];
  customData?: Record<string, any>;
}

/**
 * 业务规则接口
 */
export interface BusinessRule {
  name: string;
  description: string;
  validator: (value: any, context?: any) => boolean;
  errorMessage: string;
  severity: 'error' | 'warning' | 'info';
  dependencies?: string[];
}

/**
 * 验证上下文接口
 */
export interface ValidationContext {
  tenantId?: string;
  userId?: string;
  operation?: string;
  entityType?: string;
  entityId?: string;
  customData?: Record<string, any>;
}

/**
 * 业务验证器
 *
 * 提供完整的业务验证功能
 */
@Injectable()
export class BusinessValidator {
  private readonly rules = new Map<string, BusinessRule>();
  private readonly ruleGroups = new Map<string, string[]>();

  constructor(private readonly logger: PinoLogger) {
    this.initializeDefaultRules();
  }

  /**
   * 验证业务数据
   *
   * @description 根据业务规则验证数据
   * @param data - 要验证的数据
   * @param rules - 要应用的规则名称列表
   * @param context - 验证上下文
   * @returns 验证结果
   */
  async validateBusinessData(
    data: any,
    rules: string[],
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const startTime = Date.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const appliedRules: string[] = [];

    try {
      // 验证每个规则
      for (const ruleName of rules) {
        const rule = this.rules.get(ruleName);
        if (!rule) {
          this.logger.warn('未找到验证规则', { ruleName });
          continue;
        }

        appliedRules.push(ruleName);

        try {
          const isValid = rule.validator(data, context);
          if (!isValid) {
            const error: ValidationError = {
              field: ruleName,
              code: ruleName,
              message: rule.errorMessage,
              value: data,
              severity: rule.severity,
              context: context,
            };

            if (rule.severity === 'error') {
              errors.push(error);
            } else if (rule.severity === 'warning') {
              warnings.push({
                field: ruleName,
                code: ruleName,
                message: rule.errorMessage,
                value: data,
                context: context,
              });
            }
          }
        } catch (error) {
          this.logger.error('验证规则执行失败', error, { ruleName });
          errors.push({
            field: ruleName,
            code: 'VALIDATION_ERROR',
            message: `验证规则执行失败: ${
              error instanceof Error ? error.message : String(error)
            }`,
            value: data,
            severity: 'error',
            context: context,
          });
        }
      }

      const duration = Date.now() - startTime;
      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date(),
          validator: 'BusinessValidator',
          version: '1.0.0',
          duration,
          rulesApplied: appliedRules,
          customData: context?.customData,
        },
      };

      this.logger.debug('业务数据验证完成', {
        isValid: result.isValid,
        errorCount: errors.length,
        warningCount: warnings.length,
        duration,
        rulesApplied: appliedRules,
      });

      return result;
    } catch (error) {
      this.logger.error('业务数据验证失败', error);
      throw error;
    }
  }

  /**
   * 验证实体数据
   *
   * @description 验证实体数据的完整性和业务规则
   * @param entity - 实体数据
   * @param entityType - 实体类型
   * @param context - 验证上下文
   * @returns 验证结果
   */
  async validateEntity(
    entity: any,
    entityType: string,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const rules = this.getEntityRules(entityType);
    return this.validateBusinessData(entity, rules, context);
  }

  /**
   * 验证业务操作
   *
   * @description 验证业务操作是否允许执行
   * @param operation - 操作名称
   * @param data - 操作数据
   * @param context - 验证上下文
   * @returns 验证结果
   */
  async validateBusinessOperation(
    operation: string,
    data: any,
    context?: ValidationContext
  ): Promise<ValidationResult> {
    const rules = this.getOperationRules(operation);
    return this.validateBusinessData(data, rules, context);
  }

  /**
   * 添加业务规则
   *
   * @description 添加新的业务规则
   * @param rule - 业务规则
   */
  addRule(rule: BusinessRule): void {
    this.rules.set(rule.name, rule);
    this.logger.info('业务规则已添加', { ruleName: rule.name });
  }

  /**
   * 移除业务规则
   *
   * @description 移除指定的业务规则
   * @param ruleName - 规则名称
   */
  removeRule(ruleName: string): void {
    this.rules.delete(ruleName);
    this.logger.info('业务规则已移除', { ruleName });
  }

  /**
   * 获取所有规则
   *
   * @description 获取所有可用的业务规则
   * @returns 规则列表
   */
  getAllRules(): BusinessRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 获取规则组
   *
   * @description 获取指定规则组的规则列表
   * @param groupName - 规则组名称
   * @returns 规则名称列表
   */
  getRuleGroup(groupName: string): string[] {
    return this.ruleGroups.get(groupName) || [];
  }

  /**
   * 添加规则组
   *
   * @description 添加新的规则组
   * @param groupName - 规则组名称
   * @param rules - 规则名称列表
   */
  addRuleGroup(groupName: string, rules: string[]): void {
    this.ruleGroups.set(groupName, rules);
    this.logger.info('规则组已添加', { groupName, ruleCount: rules.length });
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化默认规则
   */
  private initializeDefaultRules(): void {
    // 数据完整性规则
    this.addRule({
      name: 'required',
      description: '必填字段验证',
      validator: (value: any) =>
        value !== null && value !== undefined && value !== '',
      errorMessage: '字段不能为空',
      severity: 'error',
    });

    this.addRule({
      name: 'notNull',
      description: '非空验证',
      validator: (value: any) => value !== null,
      errorMessage: '字段不能为null',
      severity: 'error',
    });

    this.addRule({
      name: 'notUndefined',
      description: '非undefined验证',
      validator: (value: any) => value !== undefined,
      errorMessage: '字段不能为undefined',
      severity: 'error',
    });

    // 数据类型规则
    this.addRule({
      name: 'isString',
      description: '字符串类型验证',
      validator: (value: any) => typeof value === 'string',
      errorMessage: '字段必须是字符串类型',
      severity: 'error',
    });

    this.addRule({
      name: 'isNumber',
      description: '数字类型验证',
      validator: (value: any) => typeof value === 'number' && !isNaN(value),
      errorMessage: '字段必须是数字类型',
      severity: 'error',
    });

    this.addRule({
      name: 'isBoolean',
      description: '布尔类型验证',
      validator: (value: any) => typeof value === 'boolean',
      errorMessage: '字段必须是布尔类型',
      severity: 'error',
    });

    this.addRule({
      name: 'isArray',
      description: '数组类型验证',
      validator: (value: any) => Array.isArray(value),
      errorMessage: '字段必须是数组类型',
      severity: 'error',
    });

    this.addRule({
      name: 'isObject',
      description: '对象类型验证',
      validator: (value: any) =>
        typeof value === 'object' && value !== null && !Array.isArray(value),
      errorMessage: '字段必须是对象类型',
      severity: 'error',
    });

    // 长度规则
    this.addRule({
      name: 'minLength',
      description: '最小长度验证',
      validator: (value: any, context: any) => {
        const minLength = context?.minLength || 0;
        return typeof value === 'string' ? value.length >= minLength : true;
      },
      errorMessage: '字段长度不能小于最小值',
      severity: 'error',
    });

    this.addRule({
      name: 'maxLength',
      description: '最大长度验证',
      validator: (value: any, context: any) => {
        const maxLength = context?.maxLength || Infinity;
        return typeof value === 'string' ? value.length <= maxLength : true;
      },
      errorMessage: '字段长度不能大于最大值',
      severity: 'error',
    });

    // 数值范围规则
    this.addRule({
      name: 'minValue',
      description: '最小值验证',
      validator: (value: any, context: any) => {
        const minValue = context?.minValue || -Infinity;
        return typeof value === 'number' ? value >= minValue : true;
      },
      errorMessage: '字段值不能小于最小值',
      severity: 'error',
    });

    this.addRule({
      name: 'maxValue',
      description: '最大值验证',
      validator: (value: any, context: any) => {
        const maxValue = context?.maxValue || Infinity;
        return typeof value === 'number' ? value <= maxValue : true;
      },
      errorMessage: '字段值不能大于最大值',
      severity: 'error',
    });

    // 格式规则
    this.addRule({
      name: 'email',
      description: '邮箱格式验证',
      validator: (value: any) => {
        if (typeof value !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
      },
      errorMessage: '邮箱格式不正确',
      severity: 'error',
    });

    this.addRule({
      name: 'phone',
      description: '手机号格式验证',
      validator: (value: any) => {
        if (typeof value !== 'string') return false;
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(value);
      },
      errorMessage: '手机号格式不正确',
      severity: 'error',
    });

    this.addRule({
      name: 'uuid',
      description: 'UUID格式验证',
      validator: (value: any) => {
        if (typeof value !== 'string') return false;
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
      },
      errorMessage: 'UUID格式不正确',
      severity: 'error',
    });

    // 业务规则
    this.addRule({
      name: 'businessHours',
      description: '营业时间验证',
      validator: (value: any) => {
        if (typeof value !== 'string') return false;
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(value);
      },
      errorMessage: '时间格式不正确',
      severity: 'error',
    });

    this.addRule({
      name: 'positiveNumber',
      description: '正数验证',
      validator: (value: any) => typeof value === 'number' && value > 0,
      errorMessage: '字段必须是正数',
      severity: 'error',
    });

    this.addRule({
      name: 'nonNegativeNumber',
      description: '非负数验证',
      validator: (value: any) => typeof value === 'number' && value >= 0,
      errorMessage: '字段必须是非负数',
      severity: 'error',
    });

    // 初始化规则组
    this.addRuleGroup('basic', ['required', 'notNull', 'notUndefined']);
    this.addRuleGroup('type', [
      'isString',
      'isNumber',
      'isBoolean',
      'isArray',
      'isObject',
    ]);
    this.addRuleGroup('length', ['minLength', 'maxLength']);
    this.addRuleGroup('range', ['minValue', 'maxValue']);
    this.addRuleGroup('format', ['email', 'phone', 'uuid']);
    this.addRuleGroup('business', [
      'businessHours',
      'positiveNumber',
      'nonNegativeNumber',
    ]);
  }

  /**
   * 获取实体规则
   */
  private getEntityRules(entityType: string): string[] {
    // 这里应该根据实体类型返回相应的规则
    // 实际实现中会从配置或数据库中获取
    return this.getRuleGroup('basic');
  }

  /**
   * 获取操作规则
   */
  private getOperationRules(operation: string): string[] {
    // 这里应该根据操作类型返回相应的规则
    // 实际实现中会从配置或数据库中获取
    return this.getRuleGroup('basic');
  }
}
