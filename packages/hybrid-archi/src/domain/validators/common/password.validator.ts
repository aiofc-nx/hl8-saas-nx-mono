/**
 * 通用密码验证器
 *
 * @description 提供密码验证的通用业务规则
 * @since 1.0.0
 */

/**
 * 密码验证器
 *
 * @description 提供密码验证的通用业务规则和验证方法
 *
 * ## 业务规则
 *
 * ### 安全标准验证
 * - 密码长度验证
 * - 字符复杂度验证
 * - 常见弱密码检测
 * - 密码历史检查
 *
 * ### 业务规则验证
 * - 密码策略配置
 * - 租户级别密码规则
 * - 用户级别密码要求
 * - 密码过期策略
 */
export class PasswordValidator {
  /**
   * 验证密码强度
   *
   * @description 验证密码是否符合强度要求
   * @param password - 密码
   * @param options - 验证选项
   * @returns 验证结果
   */
  public static validateStrength(
    password: string,
    options: PasswordValidationOptions = {}
  ): PasswordValidationResult {
    const {
      minLength = 8,
      maxLength = 128,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSpecialChars = true,
      minSpecialChars = 1,
      checkCommonPasswords = true,
    } = options;

    const errors: string[] = [];

    // 长度验证
    if (password.length < minLength) {
      errors.push(`密码长度至少${minLength}个字符`);
    }

    if (password.length > maxLength) {
      errors.push(`密码长度不能超过${maxLength}个字符`);
    }

    // 字符复杂度验证
    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }

    if (requireNumbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }

    if (requireSpecialChars) {
      const specialCharCount = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || [])
        .length;
      if (specialCharCount < minSpecialChars) {
        errors.push(`密码必须包含至少${minSpecialChars}个特殊字符`);
      }
    }

    // 常见弱密码检测
    if (checkCommonPasswords) {
      const commonPasswordCheck = this.checkCommonPasswords(password);
      if (!commonPasswordCheck.isValid) {
        errors.push(commonPasswordCheck.error!);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      score: this.calculatePasswordScore(password),
    };
  }

  /**
   * 检查常见弱密码
   *
   * @description 检查密码是否为常见的弱密码
   * @param password - 密码
   * @returns 验证结果
   * @private
   */
  private static checkCommonPasswords(password: string): {
    isValid: boolean;
    error?: string;
  } {
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      '12345678',
      'password1',
      'qwerty123',
      'admin123',
      'root',
    ];

    const lowerCasePassword = password.toLowerCase();
    if (commonPasswords.includes(lowerCasePassword)) {
      return { isValid: false, error: '密码不能使用常见弱密码' };
    }

    return { isValid: true };
  }

  /**
   * 计算密码强度分数
   *
   * @description 计算密码的强度分数（0-100）
   * @param password - 密码
   * @returns 强度分数
   * @private
   */
  private static calculatePasswordScore(password: string): number {
    let score = 0;

    // 长度分数
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // 字符复杂度分数
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;

    // 字符多样性分数
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 10;
    if (uniqueChars >= 12) score += 10;

    return Math.min(score, 100);
  }

  /**
   * 验证密码历史
   *
   * @description 验证密码是否与历史密码重复
   * @param password - 新密码
   * @param passwordHistory - 历史密码列表
   * @param maxHistoryCount - 最大历史密码数量
   * @returns 验证结果
   */
  public static validatePasswordHistory(
    password: string,
    passwordHistory: string[],
    maxHistoryCount = 5
  ): { isValid: boolean; error?: string } {
    const recentPasswords = passwordHistory.slice(-maxHistoryCount);

    for (const historyPassword of recentPasswords) {
      if (password === historyPassword) {
        return { isValid: false, error: '密码不能与最近使用的密码相同' };
      }
    }

    return { isValid: true };
  }

  /**
   * 验证密码策略
   *
   * @description 根据密码策略验证密码
   * @param password - 密码
   * @param policy - 密码策略
   * @returns 验证结果
   */
  public static validatePasswordPolicy(
    password: string,
    policy: PasswordPolicy
  ): PasswordValidationResult {
    const options: PasswordValidationOptions = {
      minLength: policy.minLength,
      maxLength: policy.maxLength,
      requireUppercase: policy.requireUppercase,
      requireLowercase: policy.requireLowercase,
      requireNumbers: policy.requireNumbers,
      requireSpecialChars: policy.requireSpecialChars,
      minSpecialChars: policy.minSpecialChars,
      checkCommonPasswords: policy.checkCommonPasswords,
    };

    return this.validateStrength(password, options);
  }
}

/**
 * 密码验证选项
 */
export interface PasswordValidationOptions {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  minSpecialChars?: number;
  checkCommonPasswords?: boolean;
}

/**
 * 密码验证结果
 */
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number;
}

/**
 * 密码策略
 */
export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minSpecialChars: number;
  checkCommonPasswords: boolean;
}
