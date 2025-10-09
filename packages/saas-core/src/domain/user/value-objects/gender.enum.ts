/**
 * 性别枚举
 *
 * @description 定义用户性别选项
 *
 * ## 业务规则
 *
 * ### 性别选项
 * - MALE: 男性
 * - FEMALE: 女性
 * - OTHER: 其他
 * - PREFER_NOT_TO_SAY: 不愿透露
 *
 * @example
 * ```typescript
 * const gender = Gender.MALE;
 * console.log(GenderUtils.getDisplayName(gender)); // '男'
 * ```
 *
 * @enum {string}
 * @since 1.0.0
 */
export enum Gender {
  /** 男性 */
  MALE = 'MALE',

  /** 女性 */
  FEMALE = 'FEMALE',

  /** 其他 */
  OTHER = 'OTHER',

  /** 不愿透露 */
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

/**
 * 性别枚举辅助工具
 *
 * @class GenderUtils
 */
export class GenderUtils {
  /**
   * 获取所有性别选项
   *
   * @static
   * @returns {Gender[]}
   */
  public static getAllGenders(): Gender[] {
    return Object.values(Gender);
  }

  /**
   * 检查是否为有效的性别
   *
   * @static
   * @param {string} gender - 待验证的性别
   * @returns {boolean}
   */
  public static isValidGender(gender: string): gender is Gender {
    return Object.values(Gender).includes(gender as Gender);
  }

  /**
   * 从字符串转换为性别枚举
   *
   * @static
   * @param {string} gender - 性别字符串
   * @returns {Gender}
   * @throws {Error} 当性别无效时抛出错误
   */
  public static fromString(gender: string): Gender {
    if (!this.isValidGender(gender)) {
      throw new Error(`无效的性别: ${gender}`);
    }
    return gender as Gender;
  }

  /**
   * 获取性别的显示名称
   *
   * @static
   * @param {Gender} gender - 性别枚举
   * @returns {string}
   */
  public static getDisplayName(gender: Gender): string {
    const names: Record<Gender, string> = {
      [Gender.MALE]: '男',
      [Gender.FEMALE]: '女',
      [Gender.OTHER]: '其他',
      [Gender.PREFER_NOT_TO_SAY]: '不愿透露',
    };
    return names[gender];
  }
}

