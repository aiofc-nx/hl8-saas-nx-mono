/**
 * 密码策略值对象
 *
 * @description 定义密码的安全策略和规则
 * 提供密码强度验证和策略管理功能
 *
 * ## 业务规则
 *
 * ### 密码强度规则
 * - 最小长度：8-128字符
 * - 必须包含大写字母
 * - 必须包含小写字母
 * - 必须包含数字
 * - 必须包含特殊字符
 * - 不能包含用户名
 * - 不能包含常见弱密码
 *
 * ### 密码历史规则
 * - 不能重复使用最近N个密码
 * - 密码历史记录保存时间
 * - 密码变更频率限制
 *
 * ### 密码过期规则
 * - 密码有效期设置
 * - 过期前提醒时间
 * - 过期后锁定策略
 *
 * @example
 * ```typescript
 * const policy = new PasswordPolicy({
 *   minLength: 12,
 *   requireUppercase: true,
 *   requireLowercase: true,
 *   requireNumbers: true,
 *   requireSpecialChars: true,
 *   maxAge: 90 // 天
 * });
 * 
 * const isValid = policy.validatePassword('MySecure123!');
 * ```
 *
 * @since 1.0.0
 */

import { BaseValueObject } from '../base-value-object';

/**
 * 密码策略属性接口
 *
 * @description 定义密码策略的基本属性
 */
export interface PasswordPolicyProps {
  /** 最小长度 */
  minLength: number;
  
  /** 最大长度 */
  maxLength: number;
  
  /** 是否要求大写字母 */
  requireUppercase: boolean;
  
  /** 是否要求小写字母 */
  requireLowercase: boolean;
  
  /** 是否要求数字 */
  requireNumbers: boolean;
  
  /** 是否要求特殊字符 */
  requireSpecialChars: boolean;
  
  /** 密码有效期（天） */
  maxAge: number;
  
  /** 密码历史记录数量 */
  historyCount: number;
  
  /** 是否检查常见弱密码 */
  checkCommonPasswords: boolean;
  
  /** 是否检查用户名包含 */
  checkUsernameInclusion: boolean;
  
  /** 允许的特殊字符 */
  allowedSpecialChars?: string;
  
  /** 禁止的特殊字符 */
  forbiddenSpecialChars?: string;
}

/**
 * 密码验证结果
 *
 * @description 密码验证的详细结果
 */
export interface PasswordValidationResult {
  /** 是否有效 */
  isValid: boolean;
  
  /** 错误消息列表 */
  errors: string[];
  
  /** 警告消息列表 */
  warnings: string[];
  
  /** 强度评分（0-100） */
  strengthScore: number;
  
  /** 强度等级 */
  strengthLevel: 'weak' | 'medium' | 'strong' | 'very_strong';
}

/**
 * 密码策略值对象
 *
 * @description 密码安全策略的领域对象
 * 包含密码验证逻辑和策略管理功能
 */
export class PasswordPolicy extends BaseValueObject<PasswordPolicyProps> {
  /**
   * 构造函数
   *
   * @param props - 密码策略属性
   */
  constructor(props: PasswordPolicyProps) {
    super(props);
    this.validateProps(props);
  }

  /**
   * 创建默认密码策略
   *
   * @description 创建符合安全标准的默认密码策略
   *
   * @returns 默认密码策略实例
   *
   * @example
   * ```typescript
   * const defaultPolicy = PasswordPolicy.createDefault();
   * ```
   *
   * @since 1.0.0
   */
  public static createDefault(): PasswordPolicy {
    return new PasswordPolicy({
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 90,
      historyCount: 5,
      checkCommonPasswords: true,
      checkUsernameInclusion: true,
      allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      forbiddenSpecialChars: ''
    });
  }

  /**
   * 创建宽松密码策略
   *
   * @description 创建较为宽松的密码策略，用于测试环境
   *
   * @returns 宽松密码策略实例
   *
   * @example
   * ```typescript
   * const relaxedPolicy = PasswordPolicy.createRelaxed();
   * ```
   *
   * @since 1.0.0
   */
  public static createRelaxed(): PasswordPolicy {
    return new PasswordPolicy({
      minLength: 8,
      maxLength: 128,
      requireUppercase: false,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false,
      maxAge: 180,
      historyCount: 3,
      checkCommonPasswords: false,
      checkUsernameInclusion: false,
      allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      forbiddenSpecialChars: ''
    });
  }

  /**
   * 创建严格密码策略
   *
   * @description 创建严格的密码策略，用于高安全要求的环境
   *
   * @returns 严格密码策略实例
   *
   * @example
   * ```typescript
   * const strictPolicy = PasswordPolicy.createStrict();
   * ```
   *
   * @since 1.0.0
   */
  public static createStrict(): PasswordPolicy {
    return new PasswordPolicy({
      minLength: 16,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxAge: 60,
      historyCount: 10,
      checkCommonPasswords: true,
      checkUsernameInclusion: true,
      allowedSpecialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      forbiddenSpecialChars: ''
    });
  }

  /**
   * 验证密码
   *
   * @description 根据密码策略验证密码是否符合要求
   *
   * @param password - 待验证的密码
   * @param username - 用户名（可选，用于检查是否包含用户名）
   * @returns 密码验证结果
   *
   * @example
   * ```typescript
   * const result = policy.validatePassword('MySecure123!', 'john.doe');
   * if (result.isValid) {
   *   console.log('密码验证通过');
   * } else {
   *   console.log('密码验证失败:', result.errors);
   * }
   * ```
   *
   * @since 1.0.0
   */
  public validatePassword(password: string, username?: string): PasswordValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let strengthScore = 0;

    // 基础长度检查
    if (password.length < this.props.minLength) {
      errors.push(`密码长度不能少于${this.props.minLength}个字符`);
    }
    if (password.length > this.props.maxLength) {
      errors.push(`密码长度不能超过${this.props.maxLength}个字符`);
    }

    // 字符类型检查
    if (this.props.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含至少一个大写字母');
    }
    if (this.props.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含至少一个小写字母');
    }
    if (this.props.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('密码必须包含至少一个数字');
    }
    if (this.props.requireSpecialChars) {
      const specialChars = this.props.allowedSpecialChars || '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialCharRegex = new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
      if (!specialCharRegex.test(password)) {
        errors.push('密码必须包含至少一个特殊字符');
      }
    }

    // 用户名包含检查
    if (this.props.checkUsernameInclusion && username && password.toLowerCase().includes(username.toLowerCase())) {
      errors.push('密码不能包含用户名');
    }

    // 常见弱密码检查
    if (this.props.checkCommonPasswords && this.isCommonPassword(password)) {
      errors.push('密码过于简单，请使用更复杂的密码');
    }

    // 计算强度评分
    strengthScore = this.calculateStrengthScore(password);

    // 生成强度等级
    const strengthLevel = this.getStrengthLevel(strengthScore);

    // 生成警告
    if (strengthScore < 60) {
      warnings.push('密码强度较弱，建议使用更复杂的密码');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      strengthScore,
      strengthLevel
    };
  }

  /**
   * 计算密码强度评分
   *
   * @description 根据密码复杂度计算强度评分（0-100）
   *
   * @param password - 密码
   * @returns 强度评分
   *
   * @since 1.0.0
   */
  private calculateStrengthScore(password: string): number {
    let score = 0;

    // 长度评分
    if (password.length >= 12) score += 25;
    else if (password.length >= 8) score += 15;
    else score += 5;

    // 字符类型评分
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^a-zA-Z0-9]/.test(password)) score += 15;

    // 复杂度评分
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 15;
    else if (uniqueChars >= 5) score += 10;
    else score += 5;

    // 模式检查（降低评分）
    if (/(.)\1{2,}/.test(password)) score -= 10; // 重复字符
    if (/123|abc|qwe/i.test(password)) score -= 10; // 连续字符
    if (/password|admin|user/i.test(password)) score -= 20; // 常见词汇

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 获取强度等级
   *
   * @description 根据强度评分返回强度等级
   *
   * @param score - 强度评分
   * @returns 强度等级
   *
   * @since 1.0.0
   */
  private getStrengthLevel(score: number): 'weak' | 'medium' | 'strong' | 'very_strong' {
    if (score < 30) return 'weak';
    if (score < 60) return 'medium';
    if (score < 80) return 'strong';
    return 'very_strong';
  }

  /**
   * 检查是否为常见弱密码
   *
   * @description 检查密码是否在常见弱密码列表中
   *
   * @param password - 密码
   * @returns 是否为常见弱密码
   *
   * @since 1.0.0
   */
  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', '12345678', '12345',
      '1234567', '1234567890', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890',
      'dragon', 'master', 'hello', 'freedom', 'whatever'
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * 验证属性
   *
   * @description 验证密码策略属性的有效性
   *
   * @param props - 密码策略属性
   * @throws 如果属性无效
   *
   * @since 1.0.0
   */
  private validateProps(props: PasswordPolicyProps): void {
    if (props.minLength < 1 || props.minLength > 128) {
      throw new Error('密码最小长度必须在1-128之间');
    }

    if (props.maxLength < props.minLength || props.maxLength > 128) {
      throw new Error('密码最大长度必须大于等于最小长度且不超过128');
    }

    if (props.maxAge < 1 || props.maxAge > 365) {
      throw new Error('密码有效期必须在1-365天之间');
    }

    if (props.historyCount < 0 || props.historyCount > 50) {
      throw new Error('密码历史记录数量必须在0-50之间');
    }
  }

  /**
   * 获取最小长度
   *
   * @returns 最小长度
   *
   * @since 1.0.0
   */
  public getMinLength(): number {
    return this.props.minLength;
  }

  /**
   * 获取最大长度
   *
   * @returns 最大长度
   *
   * @since 1.0.0
   */
  public getMaxLength(): number {
    return this.props.maxLength;
  }

  /**
   * 是否要求大写字母
   *
   * @returns 是否要求大写字母
   *
   * @since 1.0.0
   */
  public requiresUppercase(): boolean {
    return this.props.requireUppercase;
  }

  /**
   * 是否要求小写字母
   *
   * @returns 是否要求小写字母
   *
   * @since 1.0.0
   */
  public requiresLowercase(): boolean {
    return this.props.requireLowercase;
  }

  /**
   * 是否要求数字
   *
   * @returns 是否要求数字
   *
   * @since 1.0.0
   */
  public requiresNumbers(): boolean {
    return this.props.requireNumbers;
  }

  /**
   * 是否要求特殊字符
   *
   * @returns 是否要求特殊字符
   *
   * @since 1.0.0
   */
  public requiresSpecialChars(): boolean {
    return this.props.requireSpecialChars;
  }

  /**
   * 获取密码有效期
   *
   * @returns 密码有效期（天）
   *
   * @since 1.0.0
   */
  public getMaxAge(): number {
    return this.props.maxAge;
  }

  /**
   * 获取密码历史记录数量
   *
   * @returns 密码历史记录数量
   *
   * @since 1.0.0
   */
  public getHistoryCount(): number {
    return this.props.historyCount;
  }

  /**
   * 是否检查常见弱密码
   *
   * @returns 是否检查常见弱密码
   *
   * @since 1.0.0
   */
  public checksCommonPasswords(): boolean {
    return this.props.checkCommonPasswords;
  }

  /**
   * 是否检查用户名包含
   *
   * @returns 是否检查用户名包含
   *
   * @since 1.0.0
   */
  public checksUsernameInclusion(): boolean {
    return this.props.checkUsernameInclusion;
  }

  /**
   * 获取允许的特殊字符
   *
   * @returns 允许的特殊字符
   *
   * @since 1.0.0
   */
  public getAllowedSpecialChars(): string {
    return this.props.allowedSpecialChars || '';
  }

  /**
   * 获取禁止的特殊字符
   *
   * @returns 禁止的特殊字符
   *
   * @since 1.0.0
   */
  public getForbiddenSpecialChars(): string {
    return this.props.forbiddenSpecialChars || '';
  }

  /**
   * 比较两个密码策略是否相等
   *
   * @param other - 另一个密码策略
   * @returns 是否相等
   *
   * @since 1.0.0
   */
  public equals(other: PasswordPolicy): boolean {
    if (!(other instanceof PasswordPolicy)) {
      return false;
    }

    const thisProps = this.props;
    const otherProps = other.props;

    return (
      thisProps.minLength === otherProps.minLength &&
      thisProps.maxLength === otherProps.maxLength &&
      thisProps.requireUppercase === otherProps.requireUppercase &&
      thisProps.requireLowercase === otherProps.requireLowercase &&
      thisProps.requireNumbers === otherProps.requireNumbers &&
      thisProps.requireSpecialChars === otherProps.requireSpecialChars &&
      thisProps.maxAge === otherProps.maxAge &&
      thisProps.historyCount === otherProps.historyCount &&
      thisProps.checkCommonPasswords === otherProps.checkCommonPasswords &&
      thisProps.checkUsernameInclusion === otherProps.checkUsernameInclusion &&
      thisProps.allowedSpecialChars === otherProps.allowedSpecialChars &&
      thisProps.forbiddenSpecialChars === otherProps.forbiddenSpecialChars
    );
  }
}
