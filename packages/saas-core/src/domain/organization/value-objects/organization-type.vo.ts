/**
 * 组织类型值对象
 *
 * @description 封装组织类型的验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 组织类型
 * - PROFESSIONAL_COMMITTEE: 专业委员会
 * - PROJECT_TEAM: 项目管理团队
 * - QUALITY_CONTROL: 质量控制小组
 * - PERFORMANCE_TEAM: 绩效管理小组
 * - CUSTOM: 自定义类型
 *
 * ### 验证规则
 * - 必须是预定义的类型之一
 * - 不可为空
 *
 * @example
 * ```typescript
 * const type = OrganizationType.create('PROFESSIONAL_COMMITTEE');
 * const customType = OrganizationType.custom();
 * ```
 *
 * @class OrganizationType
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { ORGANIZATION_TYPE_CONFIG } from '../../../constants/organization.constants';

/**
 * 组织类型枚举
 */
export type OrganizationTypeValue =
  | 'PROFESSIONAL_COMMITTEE'
  | 'PROJECT_TEAM'
  | 'QUALITY_CONTROL'
  | 'PERFORMANCE_TEAM'
  | 'CUSTOM';

/**
 * 组织类型值对象
 *
 * @class OrganizationType
 * @extends {BaseValueObject}
 */
export class OrganizationType extends BaseValueObject {
  /**
   * 获取组织类型值
   *
   * @readonly
   * @type {OrganizationTypeValue}
   */
  get value(): OrganizationTypeValue {
    return this._value;
  }

  /**
   * 私有构造函数
   *
   * @private
   * @param {OrganizationTypeValue} value - 组织类型
   */
  private constructor(private readonly _value: OrganizationTypeValue) {
    super();
  }

  /**
   * 创建组织类型值对象
   *
   * @static
   * @param {OrganizationTypeValue} type - 组织类型
   * @returns {OrganizationType} 组织类型值对象
   * @throws {Error} 当类型无效时抛出错误
   */
  public static create(type: OrganizationTypeValue): OrganizationType {
    this.validate(type);
    return new OrganizationType(type);
  }

  /**
   * 创建专业委员会类型
   *
   * @static
   * @returns {OrganizationType}
   */
  public static professionalCommittee(): OrganizationType {
    return new OrganizationType('PROFESSIONAL_COMMITTEE');
  }

  /**
   * 创建项目团队类型
   *
   * @static
   * @returns {OrganizationType}
   */
  public static projectTeam(): OrganizationType {
    return new OrganizationType('PROJECT_TEAM');
  }

  /**
   * 创建质量控制类型
   *
   * @static
   * @returns {OrganizationType}
   */
  public static qualityControl(): OrganizationType {
    return new OrganizationType('QUALITY_CONTROL');
  }

  /**
   * 创建绩效团队类型
   *
   * @static
   * @returns {OrganizationType}
   */
  public static performanceTeam(): OrganizationType {
    return new OrganizationType('PERFORMANCE_TEAM');
  }

  /**
   * 创建自定义类型
   *
   * @static
   * @returns {OrganizationType}
   */
  public static custom(): OrganizationType {
    return new OrganizationType('CUSTOM');
  }

  /**
   * 验证组织类型
   *
   * @private
   * @static
   * @param {OrganizationTypeValue} type - 待验证的组织类型
   * @throws {Error} 当类型无效时抛出错误
   */
  private static validate(type: OrganizationTypeValue): void {
    if (!type) {
      throw new Error('组织类型不能为空');
    }

    const validTypes: OrganizationTypeValue[] = [
      'PROFESSIONAL_COMMITTEE',
      'PROJECT_TEAM',
      'QUALITY_CONTROL',
      'PERFORMANCE_TEAM',
      'CUSTOM',
    ];

    if (!validTypes.includes(type)) {
      throw new Error(`无效的组织类型: ${type}`);
    }
  }

  /**
   * 获取组织类型名称
   *
   * @returns {string} 类型名称
   */
  public getName(): string {
    return ORGANIZATION_TYPE_CONFIG[this.value]?.name || this.value;
  }

  /**
   * 获取组织类型描述
   *
   * @returns {string} 类型描述
   */
  public getDescription(): string {
    return ORGANIZATION_TYPE_CONFIG[this.value]?.description || '';
  }

  /**
   * 获取默认成员限制
   *
   * @returns {number} 默认成员限制数
   */
  public getDefaultMemberLimit(): number {
    return ORGANIZATION_TYPE_CONFIG[this.value]?.defaultMemberLimit || 100;
  }

  /**
   * 检查是否为自定义类型
   *
   * @returns {boolean}
   */
  public isCustom(): boolean {
    return this.value === 'CUSTOM';
  }

  /**
   * 转换为字符串
   *
   * @returns {string}
   */
  public override toString(): string {
    return this.value;
  }

  /**
   * 转换为JSON
   *
   * @returns {OrganizationTypeValue}
   */
  public override toJSON(): Record<string, unknown> {
    return { value: this.value };
  }

  protected override arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof OrganizationType)) {
      return false;
    }
    return this._value === other._value;
  }
}

