/**
 * 数据验证器
 *
 * @description 为接口层提供数据验证功能
 * 支持类型验证、格式验证、范围验证等
 *
 * @since 1.0.0
 */
export class DataValidator {
  /**
   * 验证邮箱格式
   *
   * @description 验证邮箱地址的格式是否正确
   *
   * @param email - 邮箱地址
   * @returns 验证结果
   */
  static validateEmail(email: string): ValidationResult {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email);

    return new ValidationResult(isValid, isValid ? [] : ['邮箱格式不正确']);
  }

  /**
   * 验证手机号格式
   *
   * @description 验证手机号码的格式是否正确
   *
   * @param phone - 手机号码
   * @returns 验证结果
   */
  static validatePhone(phone: string): ValidationResult {
    const phoneRegex = /^1[3-9]\d{9}$/;
    const isValid = phoneRegex.test(phone);

    return new ValidationResult(isValid, isValid ? [] : ['手机号格式不正确']);
  }

  /**
   * 验证UUID格式
   *
   * @description 验证UUID的格式是否正确
   *
   * @param uuid - UUID字符串
   * @returns 验证结果
   */
  static validateUUID(uuid: string): ValidationResult {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isValid = uuidRegex.test(uuid);

    return new ValidationResult(isValid, isValid ? [] : ['UUID格式不正确']);
  }

  /**
   * 验证字符串长度
   *
   * @description 验证字符串长度是否在指定范围内
   *
   * @param value - 字符串值
   * @param minLength - 最小长度
   * @param maxLength - 最大长度
   * @returns 验证结果
   */
  static validateStringLength(
    value: string,
    minLength: number,
    maxLength: number
  ): ValidationResult {
    const length = value.length;
    const isValid = length >= minLength && length <= maxLength;

    return new ValidationResult(
      isValid,
      isValid ? [] : [`字符串长度必须在${minLength}-${maxLength}个字符之间`]
    );
  }

  /**
   * 验证数字范围
   *
   * @description 验证数字是否在指定范围内
   *
   * @param value - 数字值
   * @param min - 最小值
   * @param max - 最大值
   * @returns 验证结果
   */
  static validateNumberRange(
    value: number,
    min: number,
    max: number
  ): ValidationResult {
    const isValid = value >= min && value <= max;

    return new ValidationResult(
      isValid,
      isValid ? [] : [`数字必须在${min}-${max}之间`]
    );
  }

  /**
   * 验证日期格式
   *
   * @description 验证日期字符串的格式是否正确
   *
   * @param dateString - 日期字符串
   * @param format - 日期格式
   * @returns 验证结果
   */
  static validateDateFormat(
    dateString: string,
    format: 'ISO' | 'YYYY-MM-DD' | 'DD/MM/YYYY' = 'ISO'
  ): ValidationResult {
    let isValid = false;

    try {
      const date = new Date(dateString);
      isValid = !isNaN(date.getTime());

      if (isValid && format !== 'ISO') {
        // 根据格式进行额外验证
        switch (format) {
          case 'YYYY-MM-DD':
            isValid = /^\d{4}-\d{2}-\d{2}$/.test(dateString);
            break;
          case 'DD/MM/YYYY':
            isValid = /^\d{2}\/\d{2}\/\d{4}$/.test(dateString);
            break;
        }
      }
    } catch {
      isValid = false;
    }

    return new ValidationResult(isValid, isValid ? [] : ['日期格式不正确']);
  }
}

/**
 * 验证结果类
 *
 * @description 定义验证结果的数据结构
 */
export class ValidationResult {
  constructor(
    public readonly isValid: boolean,
    public readonly errors: string[]
  ) {}

  /**
   * 获取错误消息
   *
   * @description 获取所有错误消息的合并字符串
   *
   * @returns 错误消息
   */
  getErrorMessage(): string {
    return this.errors.join('; ');
  }

  /**
   * 检查是否有错误
   *
   * @description 检查验证结果是否包含错误
   *
   * @returns 是否有错误
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
