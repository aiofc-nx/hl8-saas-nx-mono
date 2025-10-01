/**
 * 基础业务规则接口
 *
 * 定义业务模块所需的通用业务规则功能接口。
 * 提供统一的业务规则契约，不包含具体的业务规则实现。
 *
 * @description 通用业务规则功能组件接口
 * @since 1.0.0
 */

import { EntityId } from '../value-objects/entity-id';

/**
 * 业务规则类型枚举
 */
export enum BusinessRuleType {
  /** 格式验证规则 */
  FORMAT_VALIDATION = 'format_validation',
  /** 业务逻辑规则 */
  BUSINESS_LOGIC = 'business_logic',
  /** 数据完整性规则 */
  DATA_INTEGRITY = 'data_integrity',
  /** 权限验证规则 */
  PERMISSION_CHECK = 'permission_check',
  /** 配额限制规则 */
  QUOTA_LIMIT = 'quota_limit',
  /** 时间约束规则 */
  TIME_CONSTRAINT = 'time_constraint',
  /** 依赖关系规则 */
  DEPENDENCY_CHECK = 'dependency_check',
}

/**
 * 业务规则作用域枚举
 */
export enum BusinessRuleScope {
  /** 字段级规则 */
  FIELD = 'field',
  /** 实体级规则 */
  ENTITY = 'entity',
  /** 聚合级规则 */
  AGGREGATE = 'aggregate',
  /** 跨聚合规则 */
  CROSS_AGGREGATE = 'cross_aggregate',
  /** 系统级规则 */
  SYSTEM = 'system',
}

/**
 * 业务规则验证结果
 */
export interface IBusinessRuleValidationResult {
  /**
   * 验证是否成功
   */
  isValid: boolean;

  /**
   * 错误信息
   */
  errorMessage?: string;

  /**
   * 错误代码
   */
  errorCode?: string;

  /**
   * 验证上下文
   */
  context?: Record<string, unknown>;
}

/**
 * 基础业务规则接口
 *
 * 定义业务模块所需的通用业务规则功能
 */
export interface IBaseBusinessRule<TValue = unknown> {
  /**
   * 规则标识符
   */
  readonly id: EntityId;

  /**
   * 规则代码
   */
  readonly code: string;

  /**
   * 规则名称
   */
  readonly name: string;

  /**
   * 规则描述
   */
  readonly description: string;

  /**
   * 规则类型
   */
  readonly type: BusinessRuleType;

  /**
   * 规则作用域
   */
  readonly scope: BusinessRuleScope;

  /**
   * 验证值
   *
   * @param value - 要验证的值
   * @returns 验证结果
   */
  validate(value: TValue): IBusinessRuleValidationResult;

  /**
   * 异步验证值
   *
   * @param value - 要验证的值
   * @returns 验证结果的Promise
   */
  validateAsync(value: TValue): Promise<IBusinessRuleValidationResult>;

  /**
   * 检查规则是否有效
   *
   * @returns 规则是否有效
   */
  isValid(): boolean;

  /**
   * 获取规则元数据
   *
   * @returns 规则元数据
   */
  getMetadata(): Record<string, unknown>;
}

/**
 * 业务规则管理器接口
 *
 * 定义业务模块所需的通用业务规则管理功能
 */
export interface IBusinessRuleManager {
  /**
   * 注册业务规则
   *
   * @param rule - 业务规则
   */
  registerRule(rule: IBaseBusinessRule): void;

  /**
   * 注销业务规则
   *
   * @param ruleCode - 规则代码
   */
  unregisterRule(ruleCode: string): void;

  /**
   * 获取业务规则
   *
   * @param ruleCode - 规则代码
   * @returns 业务规则
   */
  getRule(ruleCode: string): IBaseBusinessRule | undefined;

  /**
   * 验证业务规则
   *
   * @param ruleCode - 规则代码
   * @param value - 要验证的值
   * @returns 验证结果
   */
  validateRule(ruleCode: string, value: unknown): IBusinessRuleValidationResult;

  /**
   * 批量验证业务规则
   *
   * @param ruleCodes - 规则代码列表
   * @param value - 要验证的值
   * @returns 验证结果映射
   */
  validateRules(
    ruleCodes: string[],
    value: unknown
  ): Record<string, IBusinessRuleValidationResult>;
}
