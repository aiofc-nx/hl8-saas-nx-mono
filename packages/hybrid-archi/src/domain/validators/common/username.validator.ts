/**
 * 通用用户名验证器
 *
 * @description 提供用户名验证的通用业务规则
 * @since 1.0.0
 */

/**
 * 用户名验证器
 *
 * @description 提供用户名验证的通用业务规则和验证方法
 *
 * ## 业务规则
 *
 * ### 格式规则验证
 * - 用户名长度验证
 * - 字符类型验证
 * - 特殊字符验证
 * - 连续字符验证
 *
 * ### 业务规则验证
 * - 保留字检测
 * - 租户级别唯一性
 * - 用户级别唯一性
 * - 国际化支持
 */
export class UsernameValidator {
  /**
   * 验证用户名格式
   *
   * @description 验证用户名是否符合格式要求
   * @param username - 用户名
   * @param options - 验证选项
   * @returns 验证结果
   */
  public static validateFormat(
    username: string,
    options: UsernameValidationOptions = {}
  ): UsernameValidationResult {
    const {
      minLength = 3,
      maxLength = 20,
      allowNumbers = true,
      allowSpecialChars = true,
      specialChars = '_-',
      checkReservedWords = true,
    } = options;

    const errors: string[] = [];

    // 基本验证
    if (!username || username.trim().length === 0) {
      errors.push('用户名不能为空');
      return { isValid: false, errors };
    }

    // 长度验证
    if (username.length < minLength) {
      errors.push(`用户名至少${minLength}个字符`);
    }

    if (username.length > maxLength) {
      errors.push(`用户名最多${maxLength}个字符`);
    }

    // 字符类型验证
    if (allowNumbers && allowSpecialChars) {
      const validChars = new RegExp(`^[a-zA-Z0-9${specialChars}]+$`);
      if (!validChars.test(username)) {
        errors.push(`用户名只能包含字母、数字和特殊字符: ${specialChars}`);
      }
    } else if (allowNumbers) {
      const validChars = /^[a-zA-Z0-9]+$/;
      if (!validChars.test(username)) {
        errors.push('用户名只能包含字母和数字');
      }
    } else {
      const validChars = /^[a-zA-Z]+$/;
      if (!validChars.test(username)) {
        errors.push('用户名只能包含字母');
      }
    }

    // 特殊字符验证
    if (allowSpecialChars) {
      const specialCharRegex = new RegExp(`[${specialChars}]{2,}`);
      if (specialCharRegex.test(username)) {
        errors.push('用户名不能包含连续的特殊字符');
      }
    }

    // 保留字检测
    if (checkReservedWords) {
      const reservedWordCheck = this.checkReservedWords(username);
      if (!reservedWordCheck.isValid) {
        errors.push(reservedWordCheck.error!);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 检查保留字
   *
   * @description 检查用户名是否为系统保留字
   * @param username - 用户名
   * @returns 验证结果
   * @private
   */
  private static checkReservedWords(username: string): {
    isValid: boolean;
    error?: string;
  } {
    const reservedWords = [
      'admin',
      'administrator',
      'root',
      'system',
      'user',
      'guest',
      'api',
      'www',
      'mail',
      'ftp',
      'support',
      'help',
      'info',
      'test',
      'demo',
      'sample',
      'example',
      'null',
      'undefined',
      'true',
      'false',
      'yes',
      'no',
      'on',
      'off',
      'login',
      'logout',
      'register',
      'signup',
      'signin',
      'signout',
      'profile',
      'account',
      'settings',
      'config',
      'configuration',
      'setup',
      'install',
    ];

    if (reservedWords.includes(username.toLowerCase())) {
      return { isValid: false, error: `用户名 "${username}" 是系统保留字` };
    }

    return { isValid: true };
  }

  /**
   * 验证用户名唯一性
   *
   * @description 验证用户名在指定范围内是否唯一
   * @param username - 用户名
   * @param existingUsernames - 已存在的用户名列表
   * @param caseSensitive - 是否区分大小写
   * @returns 验证结果
   */
  public static validateUniqueness(
    username: string,
    existingUsernames: string[],
    caseSensitive = false
  ): { isValid: boolean; error?: string } {
    const comparisonUsername = caseSensitive
      ? username
      : username.toLowerCase();
    const comparisonExisting = caseSensitive
      ? existingUsernames
      : existingUsernames.map((u) => u.toLowerCase());

    if (comparisonExisting.includes(comparisonUsername)) {
      return { isValid: false, error: `用户名 "${username}" 已存在` };
    }

    return { isValid: true };
  }

  /**
   * 验证用户名国际化
   *
   * @description 验证用户名是否支持国际化字符
   * @param username - 用户名
   * @param allowUnicode - 是否允许Unicode字符
   * @returns 验证结果
   */
  public static validateInternationalization(
    username: string,
    allowUnicode = false
  ): { isValid: boolean; error?: string } {
    if (!allowUnicode) {
      // 只允许ASCII字符
      const asciiRegex = /^[\x20-\x7E]+$/;
      if (!asciiRegex.test(username)) {
        return { isValid: false, error: '用户名只能包含ASCII字符' };
      }
    } else {
      // 允许Unicode字符，但排除一些特殊字符
      const unicodeRegex = /^[\p{L}\p{N}_-]+$/u;
      if (!unicodeRegex.test(username)) {
        return { isValid: false, error: '用户名包含非法字符' };
      }
    }

    return { isValid: true };
  }

  /**
   * 验证用户名策略
   *
   * @description 根据用户名策略验证用户名
   * @param username - 用户名
   * @param policy - 用户名策略
   * @returns 验证结果
   */
  public static validateUsernamePolicy(
    username: string,
    policy: UsernamePolicy
  ): UsernameValidationResult {
    const options: UsernameValidationOptions = {
      minLength: policy.minLength,
      maxLength: policy.maxLength,
      allowNumbers: policy.allowNumbers,
      allowSpecialChars: policy.allowSpecialChars,
      specialChars: policy.specialChars,
      checkReservedWords: policy.checkReservedWords,
    };

    return this.validateFormat(username, options);
  }
}

/**
 * 用户名验证选项
 */
export interface UsernameValidationOptions {
  minLength?: number;
  maxLength?: number;
  allowNumbers?: boolean;
  allowSpecialChars?: boolean;
  specialChars?: string;
  checkReservedWords?: boolean;
}

/**
 * 用户名验证结果
 */
export interface UsernameValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 用户名策略
 */
export interface UsernamePolicy {
  minLength: number;
  maxLength: number;
  allowNumbers: boolean;
  allowSpecialChars: boolean;
  specialChars: string;
  checkReservedWords: boolean;
}
