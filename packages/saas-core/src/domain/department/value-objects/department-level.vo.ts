/**
 * 部门层级值对象
 *
 * @description 封装部门层级的验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 层级定义
 * - LEVEL_1: 总部（根部门）
 * - LEVEL_2: 事业部
 * - LEVEL_3: 区域
 * - LEVEL_4: 分公司
 * - LEVEL_5: 部门
 * - LEVEL_6: 组
 * - LEVEL_7: 小组
 * - LEVEL_8: 专项团队
 *
 * ### 验证规则
 * - 层级必须在1-8之间（可扩展到10）
 * - 层级必须为正整数
 *
 * @example
 * ```typescript
 * const level = DepartmentLevel.create(1); // 总部
 * const level2 = DepartmentLevel.fromString('LEVEL_2'); // 事业部
 * ```
 *
 * @class DepartmentLevel
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import {
  DEPARTMENT_LEVEL_CONFIG,
  DEPARTMENT_HIERARCHY_LIMITS,
} from '../../../constants/department.constants';

/**
 * 部门层级属性
 *
 * @interface IDepartmentLevelProps
 */
export interface IDepartmentLevelProps {
  level: number;
}

/**
 * 部门层级值对象
 *
 * @class DepartmentLevel
 * @extends {BaseValueObject}
 */
export class DepartmentLevel extends BaseValueObject {
  /**
   * 获取层级数值
   *
   * @readonly
   * @type {number}
   */
  get level(): number {
    return this._level;
  }

  /**
   * 私有构造函数
   *
   * @private
   * @param {number} level - 部门层级
   */
  private constructor(private readonly _level: number) {
    super();
  }

  /**
   * 创建部门层级值对象
   *
   * @static
   * @param {number} level - 层级数值
   * @returns {DepartmentLevel} 部门层级值对象
   * @throws {Error} 当层级无效时抛出错误
   */
  public static create(level: number): DepartmentLevel {
    this.validate(level);
    return new DepartmentLevel(level);
  }

  /**
   * 从字符串创建层级
   *
   * @static
   * @param {string} levelString - 层级字符串（如 'LEVEL_1'）
   * @returns {DepartmentLevel} 部门层级值对象
   * @throws {Error} 当层级字符串无效时抛出错误
   */
  public static fromString(levelString: string): DepartmentLevel {
    const match = levelString.match(/LEVEL_(\d+)/);
    if (!match) {
      throw new Error(`无效的层级字符串: ${levelString}`);
    }
    const level = parseInt(match[1], 10);
    return this.create(level);
  }

  /**
   * 创建根部门层级
   *
   * @static
   * @returns {DepartmentLevel}
   */
  public static root(): DepartmentLevel {
    return new DepartmentLevel(1);
  }

  /**
   * 验证部门层级
   *
   * @private
   * @static
   * @param {number} level - 待验证的层级
   * @throws {Error} 当层级无效时抛出错误
   */
  private static validate(level: number): void {
    if (!Number.isInteger(level)) {
      throw new Error('部门层级必须为整数');
    }

    if (
      level < DEPARTMENT_HIERARCHY_LIMITS.MIN_LEVEL ||
      level > DEPARTMENT_HIERARCHY_LIMITS.MAX_LEVEL_ABSOLUTE
    ) {
      throw new Error(
        `部门层级必须在 ${DEPARTMENT_HIERARCHY_LIMITS.MIN_LEVEL} 到 ${DEPARTMENT_HIERARCHY_LIMITS.MAX_LEVEL_ABSOLUTE} 之间`,
      );
    }
  }

  /**
   * 获取层级名称
   *
   * @returns {string} 层级名称
   */
  public getName(): string {
    const levelKey = `LEVEL_${this.level}` as keyof typeof DEPARTMENT_LEVEL_CONFIG;
    return DEPARTMENT_LEVEL_CONFIG[levelKey]?.name || `第${this.level}级`;
  }

  /**
   * 获取层级描述
   *
   * @returns {string} 层级描述
   */
  public getDescription(): string {
    const levelKey = `LEVEL_${this.level}` as keyof typeof DEPARTMENT_LEVEL_CONFIG;
    return DEPARTMENT_LEVEL_CONFIG[levelKey]?.description || '';
  }

  /**
   * 获取该层级的最大子部门数
   *
   * @returns {number} 最大子部门数
   */
  public getMaxChildren(): number {
    const levelKey = `LEVEL_${this.level}` as keyof typeof DEPARTMENT_LEVEL_CONFIG;
    return DEPARTMENT_LEVEL_CONFIG[levelKey]?.maxChildren || 0;
  }

  /**
   * 检查是否为根层级
   *
   * @returns {boolean}
   */
  public isRoot(): boolean {
    return this.level === DEPARTMENT_HIERARCHY_LIMITS.MIN_LEVEL;
  }

  /**
   * 检查是否为叶子层级（最深层级）
   *
   * @returns {boolean}
   */
  public isLeaf(): boolean {
    return this.level === DEPARTMENT_HIERARCHY_LIMITS.MAX_LEVEL_DEFAULT;
  }

  /**
   * 检查是否可以有子部门
   *
   * @returns {boolean}
   */
  public canHaveChildren(): boolean {
    return this.level < DEPARTMENT_HIERARCHY_LIMITS.MAX_LEVEL_DEFAULT;
  }

  /**
   * 获取下一层级
   *
   * @returns {DepartmentLevel} 下一层级
   * @throws {Error} 当已是最深层级时抛出错误
   */
  public getNextLevel(): DepartmentLevel {
    if (!this.canHaveChildren()) {
      throw new Error('已达到最大层级深度，无法创建下一层级');
    }
    return new DepartmentLevel(this.level + 1);
  }

  /**
   * 获取上一层级
   *
   * @returns {DepartmentLevel} 上一层级
   * @throws {Error} 当已是根层级时抛出错误
   */
  public getParentLevel(): DepartmentLevel {
    if (this.isRoot()) {
      throw new Error('根层级没有上一层级');
    }
    return new DepartmentLevel(this.level - 1);
  }

  /**
   * 转换为字符串
   *
   * @returns {string}
   */
  public toString(): string {
    return `LEVEL_${this.level}`;
  }

  /**
   * 转换为JSON
   *
   * @returns {number}
   */
  public toJSON(): number {
    return this.level;
  }

  protected arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof DepartmentLevel)) {
      return false;
    }
    return this._level === other._level;
  }
}

