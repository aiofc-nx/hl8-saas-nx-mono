/**
 * 多因素认证类型枚举
 *
 * @description 定义多因素认证支持的类型
 * 提供多种MFA方式以满足不同安全需求
 *
 * ## 业务规则
 *
 * ### MFA类型定义
 * - TOTP: 基于时间的一次性密码（如Google Authenticator）
 * - SMS: 短信验证码
 * - EMAIL: 邮箱验证码
 * - BACKUP_CODES: 备用验证码
 * - BIOMETRIC: 生物识别（指纹、面部识别等）
 * - HARDWARE_TOKEN: 硬件令牌
 *
 * ### 安全级别
 * - 高安全级别：TOTP、HARDWARE_TOKEN、BIOMETRIC
 * - 中安全级别：SMS、EMAIL
 * - 低安全级别：BACKUP_CODES
 *
 * ### 使用场景
 * - 登录验证：所有类型
 * - 敏感操作：高安全级别类型
 * - 备用验证：BACKUP_CODES
 *
 * @example
 * ```typescript
 * const mfaType = MfaType.TOTP;
 * const securityLevel = MfaTypeUtils.getSecurityLevel(mfaType); // 'high'
 * const isSupported = MfaTypeUtils.isSupported(mfaType); // true
 * ```
 *
 * @since 1.0.0
 */
export enum MfaType {
  /**
   * 基于时间的一次性密码
   * 
   * @description 使用TOTP算法生成的一次性密码
   * 如Google Authenticator、Microsoft Authenticator等
   * 提供高安全级别和离线支持
   */
  TOTP = 'TOTP',

  /**
   * 短信验证码
   * 
   * @description 通过短信发送的验证码
   * 需要手机号支持，提供中等安全级别
   */
  SMS = 'SMS',

  /**
   * 邮箱验证码
   * 
   * @description 通过邮箱发送的验证码
   * 需要邮箱地址，提供中等安全级别
   */
  EMAIL = 'EMAIL',

  /**
   * 备用验证码
   * 
   * @description 预生成的备用验证码
   * 用于主MFA方式不可用时的备用验证
   * 提供低安全级别但高可用性
   */
  BACKUP_CODES = 'BACKUP_CODES',

  /**
   * 生物识别
   * 
   * @description 基于生物特征的认证
   * 如指纹、面部识别、虹膜识别等
   * 提供高安全级别和便捷性
   */
  BIOMETRIC = 'BIOMETRIC',

  /**
   * 硬件令牌
   * 
   * @description 基于硬件的安全令牌
   * 如YubiKey、RSA SecurID等
   * 提供最高安全级别
   */
  HARDWARE_TOKEN = 'HARDWARE_TOKEN'
}

/**
 * MFA类型工具类
 *
 * @description 提供MFA类型相关的工具方法
 * 包括安全级别评估、支持检查、配置验证等功能
 *
 * @since 1.0.0
 */
export class MfaTypeUtils {
  /**
   * 安全级别定义
   * 
   * @description 定义不同MFA类型的安全级别
   */
  private static readonly SECURITY_LEVELS: Record<MfaType, 'low' | 'medium' | 'high'> = {
    [MfaType.TOTP]: 'high',
    [MfaType.SMS]: 'medium',
    [MfaType.EMAIL]: 'medium',
    [MfaType.BACKUP_CODES]: 'low',
    [MfaType.BIOMETRIC]: 'high',
    [MfaType.HARDWARE_TOKEN]: 'high'
  };

  /**
   * 支持状态定义
   * 
   * @description 定义不同MFA类型的支持状态
   */
  private static readonly SUPPORT_STATUS: Record<MfaType, boolean> = {
    [MfaType.TOTP]: true,
    [MfaType.SMS]: true,
    [MfaType.EMAIL]: true,
    [MfaType.BACKUP_CODES]: true,
    [MfaType.BIOMETRIC]: false, // 需要设备支持
    [MfaType.HARDWARE_TOKEN]: false // 需要硬件设备
  };

  /**
   * 配置要求定义
   * 
   * @description 定义不同MFA类型的配置要求
   */
  private static readonly CONFIG_REQUIREMENTS: Record<MfaType, string[]> = {
    [MfaType.TOTP]: ['secret_key'],
    [MfaType.SMS]: ['phone_number', 'sms_provider'],
    [MfaType.EMAIL]: ['email_address', 'smtp_config'],
    [MfaType.BACKUP_CODES]: ['backup_codes'],
    [MfaType.BIOMETRIC]: ['device_support'],
    [MfaType.HARDWARE_TOKEN]: ['hardware_device', 'device_id']
  };

  /**
   * 验证码长度定义
   * 
   * @description 定义不同MFA类型的验证码长度
   */
  private static readonly CODE_LENGTHS: Record<MfaType, number> = {
    [MfaType.TOTP]: 6,
    [MfaType.SMS]: 6,
    [MfaType.EMAIL]: 6,
    [MfaType.BACKUP_CODES]: 8,
    [MfaType.BIOMETRIC]: 0, // 不需要验证码
    [MfaType.HARDWARE_TOKEN]: 6
  };

  /**
   * 验证码有效期定义（秒）
   * 
   * @description 定义不同MFA类型的验证码有效期
   */
  private static readonly CODE_VALIDITY_PERIODS: Record<MfaType, number> = {
    [MfaType.TOTP]: 30, // TOTP每30秒更新
    [MfaType.SMS]: 300, // 短信验证码5分钟有效
    [MfaType.EMAIL]: 600, // 邮箱验证码10分钟有效
    [MfaType.BACKUP_CODES]: 0, // 备用码永久有效（使用后失效）
    [MfaType.BIOMETRIC]: 0, // 生物识别不需要验证码
    [MfaType.HARDWARE_TOKEN]: 30 // 硬件令牌30秒有效
  };

  /**
   * 获取安全级别
   *
   * @description 返回MFA类型的安全级别
   *
   * @param mfaType - MFA类型
   * @returns 安全级别
   *
   * @example
   * ```typescript
   * const level = MfaTypeUtils.getSecurityLevel(MfaType.TOTP); // 'high'
   * ```
   *
   * @since 1.0.0
   */
  public static getSecurityLevel(mfaType: MfaType): 'low' | 'medium' | 'high' {
    return this.SECURITY_LEVELS[mfaType];
  }

  /**
   * 检查是否支持
   *
   * @description 检查指定MFA类型是否被支持
   *
   * @param mfaType - MFA类型
   * @returns 是否支持
   *
   * @example
   * ```typescript
   * const supported = MfaTypeUtils.isSupported(MfaType.TOTP); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isSupported(mfaType: MfaType): boolean {
    return this.SUPPORT_STATUS[mfaType];
  }

  /**
   * 获取配置要求
   *
   * @description 获取指定MFA类型的配置要求
   *
   * @param mfaType - MFA类型
   * @returns 配置要求列表
   *
   * @example
   * ```typescript
   * const requirements = MfaTypeUtils.getConfigRequirements(MfaType.TOTP);
   * // ['secret_key']
   * ```
   *
   * @since 1.0.0
   */
  public static getConfigRequirements(mfaType: MfaType): string[] {
    return [...this.CONFIG_REQUIREMENTS[mfaType]];
  }

  /**
   * 获取验证码长度
   *
   * @description 获取指定MFA类型的验证码长度
   *
   * @param mfaType - MFA类型
   * @returns 验证码长度
   *
   * @example
   * ```typescript
   * const length = MfaTypeUtils.getCodeLength(MfaType.TOTP); // 6
   * ```
   *
   * @since 1.0.0
   */
  public static getCodeLength(mfaType: MfaType): number {
    return this.CODE_LENGTHS[mfaType];
  }

  /**
   * 获取验证码有效期
   *
   * @description 获取指定MFA类型的验证码有效期（秒）
   *
   * @param mfaType - MFA类型
   * @returns 有效期（秒）
   *
   * @example
   * ```typescript
   * const validity = MfaTypeUtils.getCodeValidityPeriod(MfaType.TOTP); // 30
   * ```
   *
   * @since 1.0.0
   */
  public static getCodeValidityPeriod(mfaType: MfaType): number {
    return this.CODE_VALIDITY_PERIODS[mfaType];
  }

  /**
   * 获取MFA类型的中文描述
   *
   * @description 返回MFA类型的中文描述，用于界面显示
   *
   * @param mfaType - MFA类型
   * @returns 中文描述
   *
   * @example
   * ```typescript
   * const description = MfaTypeUtils.getDescription(MfaType.TOTP);
   * // "基于时间的一次性密码"
   * ```
   *
   * @since 1.0.0
   */
  public static getDescription(mfaType: MfaType): string {
    const descriptions: Record<MfaType, string> = {
      [MfaType.TOTP]: '基于时间的一次性密码',
      [MfaType.SMS]: '短信验证码',
      [MfaType.EMAIL]: '邮箱验证码',
      [MfaType.BACKUP_CODES]: '备用验证码',
      [MfaType.BIOMETRIC]: '生物识别',
      [MfaType.HARDWARE_TOKEN]: '硬件令牌'
    };

    return descriptions[mfaType];
  }

  /**
   * 获取MFA类型的详细说明
   *
   * @description 返回MFA类型的详细说明，包括特点和使用场景
   *
   * @param mfaType - MFA类型
   * @returns 详细说明
   *
   * @example
   * ```typescript
   * const details = MfaTypeUtils.getDetailedDescription(MfaType.TOTP);
   * // "使用TOTP算法生成的一次性密码，提供高安全级别和离线支持"
   * ```
   *
   * @since 1.0.0
   */
  public static getDetailedDescription(mfaType: MfaType): string {
    const descriptions: Record<MfaType, string> = {
      [MfaType.TOTP]: '使用TOTP算法生成的一次性密码，如Google Authenticator、Microsoft Authenticator等。提供高安全级别和离线支持，适合大多数用户使用。',
      [MfaType.SMS]: '通过短信发送的验证码，需要手机号支持。提供中等安全级别，使用简单但依赖网络和短信服务。',
      [MfaType.EMAIL]: '通过邮箱发送的验证码，需要邮箱地址。提供中等安全级别，适合没有手机的用户或作为备用验证方式。',
      [MfaType.BACKUP_CODES]: '预生成的备用验证码，用于主MFA方式不可用时的备用验证。提供低安全级别但高可用性，应妥善保管。',
      [MfaType.BIOMETRIC]: '基于生物特征的认证，如指纹、面部识别、虹膜识别等。提供高安全级别和便捷性，但需要设备支持。',
      [MfaType.HARDWARE_TOKEN]: '基于硬件的安全令牌，如YubiKey、RSA SecurID等。提供最高安全级别，适合高安全要求的场景。'
    };

    return descriptions[mfaType];
  }

  /**
   * 验证配置是否完整
   *
   * @description 验证指定MFA类型的配置是否完整
   *
   * @param mfaType - MFA类型
   * @param config - 配置对象
   * @returns 配置是否完整
   *
   * @example
   * ```typescript
   * const isValid = MfaTypeUtils.validateConfig(MfaType.TOTP, { secret_key: 'abc123' });
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateConfig(mfaType: MfaType, config: unknown): boolean {
    const requirements = this.getConfigRequirements(mfaType);
    
    for (const requirement of requirements) {
      if (!(config as Record<string, unknown>)[requirement]) {
        return false;
      }
    }

    return true;
  }

  /**
   * 比较安全级别
   *
   * @description 比较两个MFA类型的安全级别高低
   *
   * @param mfaType1 - 第一个MFA类型
   * @param mfaType2 - 第二个MFA类型
   * @returns 比较结果：-1(更低), 0(相等), 1(更高)
   *
   * @example
   * ```typescript
   * const result = MfaTypeUtils.compareSecurityLevel(MfaType.SMS, MfaType.TOTP);
   * // -1 (更低)
   * ```
   *
   * @since 1.0.0
   */
  public static compareSecurityLevel(mfaType1: MfaType, mfaType2: MfaType): number {
    const level1 = this.getSecurityLevel(mfaType1);
    const level2 = this.getSecurityLevel(mfaType2);
    
    const levelValues = { low: 1, medium: 2, high: 3 };
    
    if (levelValues[level1] < levelValues[level2]) return -1;
    if (levelValues[level1] > levelValues[level2]) return 1;
    return 0;
  }

  /**
   * 获取推荐的主MFA类型
   *
   * @description 根据安全需求推荐主要的MFA类型
   *
   * @param securityRequirement - 安全需求级别
   * @returns 推荐的MFA类型
   *
   * @example
   * ```typescript
   * const recommended = MfaTypeUtils.getRecommendedPrimaryType('high');
   * // MfaType.TOTP
   * ```
   *
   * @since 1.0.0
   */
  public static getRecommendedPrimaryType(securityRequirement: 'low' | 'medium' | 'high'): MfaType {
    switch (securityRequirement) {
      case 'high':
        return MfaType.TOTP; // 高安全级别推荐TOTP
      case 'medium':
        return MfaType.SMS; // 中安全级别推荐SMS
      case 'low':
        return MfaType.EMAIL; // 低安全级别推荐EMAIL
      default:
        return MfaType.TOTP;
    }
  }

  /**
   * 获取推荐的备用MFA类型
   *
   * @description 根据主MFA类型推荐备用的MFA类型
   *
   * @param primaryType - 主MFA类型
   * @returns 推荐的备用MFA类型
   *
   * @example
   * ```typescript
   * const backup = MfaTypeUtils.getRecommendedBackupType(MfaType.TOTP);
   * // MfaType.BACKUP_CODES
   * ```
   *
   * @since 1.0.0
   */
  public static getRecommendedBackupType(_primaryType: MfaType): MfaType {
    // 推荐备用验证码作为备用方式
    return MfaType.BACKUP_CODES;
  }

  /**
   * 检查是否为高安全级别
   *
   * @description 判断MFA类型是否为高安全级别
   *
   * @param mfaType - MFA类型
   * @returns 是否为高安全级别
   *
   * @example
   * ```typescript
   * const isHigh = MfaTypeUtils.isHighSecurityLevel(MfaType.TOTP);
   * // true
   * ```
   *
   * @since 1.0.0
   */
  public static isHighSecurityLevel(mfaType: MfaType): boolean {
    return this.getSecurityLevel(mfaType) === 'high';
  }

  /**
   * 获取所有支持的MFA类型
   *
   * @description 返回系统中所有支持的MFA类型
   *
   * @returns 支持的MFA类型列表
   *
   * @example
   * ```typescript
   * const supported = MfaTypeUtils.getSupportedTypes();
   * ```
   *
   * @since 1.0.0
   */
  public static getSupportedTypes(): MfaType[] {
    return Object.values(MfaType).filter(type => this.isSupported(type));
  }

  /**
   * 获取所有MFA类型
   *
   * @description 返回系统中定义的所有MFA类型
   *
   * @returns 所有MFA类型列表
   *
   * @example
   * ```typescript
   * const allTypes = MfaTypeUtils.getAllTypes();
   * ```
   *
   * @since 1.0.0
   */
  public static getAllTypes(): MfaType[] {
    return Object.values(MfaType);
  }
}
