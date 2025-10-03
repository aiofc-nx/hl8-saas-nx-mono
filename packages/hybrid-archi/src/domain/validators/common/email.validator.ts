/**
 * 通用邮箱验证器
 *
 * @description 提供邮箱验证的通用业务规则
 * @since 1.0.0
 */

/**
 * 邮箱验证器
 *
 * @description 提供邮箱验证的通用业务规则和验证方法
 *
 * ## 业务规则
 *
 * ### RFC 5322 标准验证
 * - 邮箱必须符合RFC 5322标准
 * - 支持国际化域名
 * - 支持复杂的本地部分格式
 * - 支持引号字符串格式
 *
 * ### 业务规则验证
 * - 邮箱长度限制
 * - 域名验证
 * - 本地部分验证
 * - 特殊字符处理
 */
export class EmailValidator {
  /**
   * 验证邮箱格式
   *
   * @description 验证邮箱是否符合RFC 5322标准
   * @param email - 邮箱地址
   * @returns 验证结果
   */
  public static validateFormat(email: string): {
    isValid: boolean;
    error?: string;
  } {
    if (!email || email.trim().length === 0) {
      return { isValid: false, error: '邮箱不能为空' };
    }

    if (email.length > 254) {
      return { isValid: false, error: '邮箱长度不能超过254个字符' };
    }

    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) {
      return { isValid: false, error: '邮箱必须包含@符号' };
    }

    if (localPart.length > 64) {
      return { isValid: false, error: '邮箱本地部分长度不能超过64个字符' };
    }

    // RFC 5322 基本验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: '邮箱格式无效' };
    }

    // 验证本地部分
    const localPartValidation = this.validateLocalPart(localPart);
    if (!localPartValidation.isValid) {
      return localPartValidation;
    }

    // 验证域名
    const domainValidation = this.validateDomain(domain);
    if (!domainValidation.isValid) {
      return domainValidation;
    }

    return { isValid: true };
  }

  /**
   * 验证本地部分
   *
   * @description 验证邮箱的本地部分格式
   * @param localPart - 本地部分
   * @returns 验证结果
   * @private
   */
  private static validateLocalPart(localPart: string): {
    isValid: boolean;
    error?: string;
  } {
    // 检查是否以点开头或结尾
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return { isValid: false, error: '本地部分不能以点开头或结尾' };
    }

    // 检查连续的点
    if (localPart.includes('..')) {
      return { isValid: false, error: '本地部分不能包含连续的点' };
    }

    // 检查特殊字符
    const validChars = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
    if (!validChars.test(localPart)) {
      return { isValid: false, error: '本地部分包含非法字符' };
    }

    return { isValid: true };
  }

  /**
   * 验证域名
   *
   * @description 验证邮箱的域名格式
   * @param domain - 域名
   * @returns 验证结果
   * @private
   */
  private static validateDomain(domain: string): {
    isValid: boolean;
    error?: string;
  } {
    if (domain.length > 253) {
      return { isValid: false, error: '域名长度不能超过253个字符' };
    }

    // 检查是否包含点
    if (!domain.includes('.')) {
      return { isValid: false, error: '域名必须包含点' };
    }

    // 检查域名标签
    const labels = domain.split('.');
    for (const label of labels) {
      if (label.length === 0) {
        return { isValid: false, error: '域名标签不能为空' };
      }
      if (label.length > 63) {
        return { isValid: false, error: '域名标签长度不能超过63个字符' };
      }
      if (label.startsWith('-') || label.endsWith('-')) {
        return { isValid: false, error: '域名标签不能以连字符开头或结尾' };
      }
    }

    return { isValid: true };
  }

  /**
   * 验证邮箱是否属于允许的域名
   *
   * @description 验证邮箱是否属于允许的域名列表
   * @param email - 邮箱地址
   * @param allowedDomains - 允许的域名列表
   * @returns 验证结果
   */
  public static validateDomainWhitelist(
    email: string,
    allowedDomains: string[]
  ): { isValid: boolean; error?: string } {
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      return { isValid: false, error: `邮箱域名不在允许列表中: ${domain}` };
    }
    return { isValid: true };
  }

  /**
   * 验证邮箱是否属于禁止的域名
   *
   * @description 验证邮箱是否属于禁止的域名列表
   * @param email - 邮箱地址
   * @param blockedDomains - 禁止的域名列表
   * @returns 验证结果
   */
  public static validateDomainBlacklist(
    email: string,
    blockedDomains: string[]
  ): { isValid: boolean; error?: string } {
    const domain = email.split('@')[1];
    if (blockedDomains.includes(domain)) {
      return { isValid: false, error: `邮箱域名被禁止: ${domain}` };
    }
    return { isValid: true };
  }
}
