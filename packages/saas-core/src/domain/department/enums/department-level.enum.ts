/**
 * 部门层级枚举
 *
 * @description 定义部门的层级级别
 * 用于业务规则验证和层级管理
 *
 * ## 业务规则
 *
 * ### 层级定义（8级组织架构）
 * - LEVEL_1: 总部（根部门）
 * - LEVEL_2: 事业部
 * - LEVEL_3: 区域
 * - LEVEL_4: 分公司
 * - LEVEL_5: 部门
 * - LEVEL_6: 组
 * - LEVEL_7: 小组
 * - LEVEL_8: 专项团队（叶子部门）
 *
 * ### 层级关系
 * - 总部是根部门，没有父部门
 * - 每个层级必须属于其上级层级
 * - 层级关系必须严格遵循父子关系
 * - 专项团队是叶子部门，不能再有子部门
 *
 * @example
 * ```typescript
 * // 检查部门层级
 * if (level === DepartmentLevel.LEVEL_1) {
 *   console.log('这是总部');
 * }
 *
 * // 层级转换
 * const levelNumber = DepartmentLevelUtils.getLevelNumber(DepartmentLevel.LEVEL_2); // 2
 * ```
 *
 * @since 1.0.0
 */
export enum DepartmentLevel {
  /**
   * 总部
   * 
   * @description 组织架构的顶层，根部门
   * 没有父部门，可以包含多个事业部
   */
  LEVEL_1 = 'LEVEL_1',

  /**
   * 事业部
   * 
   * @description 总部的子部门
   * 必须属于总部，可以包含多个区域
   */
  LEVEL_2 = 'LEVEL_2',

  /**
   * 区域
   * 
   * @description 事业部的子部门
   * 必须属于某个事业部，可以包含多个分公司
   */
  LEVEL_3 = 'LEVEL_3',

  /**
   * 分公司
   * 
   * @description 区域的子部门
   * 必须属于某个区域，可以包含多个部门
   */
  LEVEL_4 = 'LEVEL_4',

  /**
   * 部门
   * 
   * @description 分公司的子部门
   * 必须属于某个分公司，可以包含多个组
   */
  LEVEL_5 = 'LEVEL_5',

  /**
   * 组
   * 
   * @description 部门的子部门
   * 必须属于某个部门，可以包含多个小组
   */
  LEVEL_6 = 'LEVEL_6',

  /**
   * 小组
   * 
   * @description 组的子部门
   * 必须属于某个组，可以包含多个专项团队
   */
  LEVEL_7 = 'LEVEL_7',

  /**
   * 专项团队
   * 
   * @description 小组的子部门，叶子部门
   * 必须属于某个小组，不能再有子部门
   */
  LEVEL_8 = 'LEVEL_8'
}

/**
 * 部门层级工具类
 *
 * @description 提供部门层级相关的工具方法
 *
 * @since 1.0.0
 */
export class DepartmentLevelUtils {
  /**
   * 获取层级对应的数字
   *
   * @description 将枚举值转换为对应的数字层级
   *
   * @param level - 部门层级枚举
   * @returns 数字层级
   *
   * @example
   * ```typescript
   * const levelNumber = DepartmentLevelUtils.getLevelNumber(DepartmentLevel.LEVEL_2); // 2
   * ```
   *
   * @since 1.0.0
   */
  public static getLevelNumber(level: DepartmentLevel): number {
    const levelMap: Record<DepartmentLevel, number> = {
      [DepartmentLevel.LEVEL_1]: 1,
      [DepartmentLevel.LEVEL_2]: 2,
      [DepartmentLevel.LEVEL_3]: 3,
      [DepartmentLevel.LEVEL_4]: 4,
      [DepartmentLevel.LEVEL_5]: 5,
      [DepartmentLevel.LEVEL_6]: 6,
      [DepartmentLevel.LEVEL_7]: 7,
      [DepartmentLevel.LEVEL_8]: 8
    };

    return levelMap[level];
  }

  /**
   * 根据数字获取层级枚举
   *
   * @description 将数字层级转换为对应的枚举值
   *
   * @param levelNumber - 数字层级
   * @returns 部门层级枚举
   * @throws {Error} 当层级数字无效时抛出异常
   *
   * @example
   * ```typescript
   * const level = DepartmentLevelUtils.getLevelFromNumber(2); // DepartmentLevel.LEVEL_2
   * ```
   *
   * @since 1.0.0
   */
  public static getLevelFromNumber(levelNumber: number): DepartmentLevel {
    const numberMap: Record<number, DepartmentLevel> = {
      1: DepartmentLevel.LEVEL_1,
      2: DepartmentLevel.LEVEL_2,
      3: DepartmentLevel.LEVEL_3,
      4: DepartmentLevel.LEVEL_4,
      5: DepartmentLevel.LEVEL_5,
      6: DepartmentLevel.LEVEL_6,
      7: DepartmentLevel.LEVEL_7,
      8: DepartmentLevel.LEVEL_8
    };

    const level = numberMap[levelNumber];
    if (!level) {
      throw new Error(`无效的部门层级数字: ${levelNumber}`);
    }

    return level;
  }

  /**
   * 检查是否为根部门
   *
   * @description 检查部门层级是否为一级部门（根部门）
   *
   * @param level - 部门层级枚举
   * @returns 是否为根部门
   *
   * @example
   * ```typescript
   * const isRoot = DepartmentLevelUtils.isRoot(DepartmentLevel.LEVEL_1); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isRoot(level: DepartmentLevel): boolean {
    return level === DepartmentLevel.LEVEL_1;
  }

  /**
   * 检查是否为叶子部门
   *
   * @description 检查部门层级是否为八级部门（专项团队，叶子部门）
   *
   * @param level - 部门层级枚举
   * @returns 是否为叶子部门
   *
   * @example
   * ```typescript
   * const isLeaf = DepartmentLevelUtils.isLeaf(DepartmentLevel.LEVEL_8); // true
   * ```
   *
   * @since 1.0.0
   */
  public static isLeaf(level: DepartmentLevel): boolean {
    return level === DepartmentLevel.LEVEL_8;
  }

  /**
   * 获取父级层级
   *
   * @description 获取当前层级的父级层级
   *
   * @param level - 当前部门层级枚举
   * @returns 父级层级，如果是根部门则返回null
   *
   * @example
   * ```typescript
   * const parentLevel = DepartmentLevelUtils.getParentLevel(DepartmentLevel.LEVEL_2); // DepartmentLevel.LEVEL_1
   * ```
   *
   * @since 1.0.0
   */
  public static getParentLevel(level: DepartmentLevel): DepartmentLevel | null {
    const parentMap: Record<DepartmentLevel, DepartmentLevel | null> = {
      [DepartmentLevel.LEVEL_1]: null,
      [DepartmentLevel.LEVEL_2]: DepartmentLevel.LEVEL_1,
      [DepartmentLevel.LEVEL_3]: DepartmentLevel.LEVEL_2,
      [DepartmentLevel.LEVEL_4]: DepartmentLevel.LEVEL_3,
      [DepartmentLevel.LEVEL_5]: DepartmentLevel.LEVEL_4,
      [DepartmentLevel.LEVEL_6]: DepartmentLevel.LEVEL_5,
      [DepartmentLevel.LEVEL_7]: DepartmentLevel.LEVEL_6,
      [DepartmentLevel.LEVEL_8]: DepartmentLevel.LEVEL_7
    };

    return parentMap[level];
  }

  /**
   * 获取子级层级
   *
   * @description 获取当前层级的子级层级
   *
   * @param level - 当前部门层级枚举
   * @returns 子级层级，如果是叶子部门则返回null
   *
   * @example
   * ```typescript
   * const childLevel = DepartmentLevelUtils.getChildLevel(DepartmentLevel.LEVEL_1); // DepartmentLevel.LEVEL_2
   * ```
   *
   * @since 1.0.0
   */
  public static getChildLevel(level: DepartmentLevel): DepartmentLevel | null {
    const childMap: Record<DepartmentLevel, DepartmentLevel | null> = {
      [DepartmentLevel.LEVEL_1]: DepartmentLevel.LEVEL_2,
      [DepartmentLevel.LEVEL_2]: DepartmentLevel.LEVEL_3,
      [DepartmentLevel.LEVEL_3]: DepartmentLevel.LEVEL_4,
      [DepartmentLevel.LEVEL_4]: DepartmentLevel.LEVEL_5,
      [DepartmentLevel.LEVEL_5]: DepartmentLevel.LEVEL_6,
      [DepartmentLevel.LEVEL_6]: DepartmentLevel.LEVEL_7,
      [DepartmentLevel.LEVEL_7]: DepartmentLevel.LEVEL_8,
      [DepartmentLevel.LEVEL_8]: null
    };

    return childMap[level];
  }

  /**
   * 验证层级关系
   *
   * @description 验证父子层级关系是否有效
   *
   * @param parentLevel - 父部门层级
   * @param childLevel - 子部门层级
   * @returns 是否有效
   *
   * @example
   * ```typescript
   * const isValid = DepartmentLevelUtils.validateParentChildLevel(
   *   DepartmentLevel.LEVEL_1, 
   *   DepartmentLevel.LEVEL_2
   * ); // true
   * ```
   *
   * @since 1.0.0
   */
  public static validateParentChildLevel(parentLevel: DepartmentLevel, childLevel: DepartmentLevel): boolean {
    const parentNumber = this.getLevelNumber(parentLevel);
    const childNumber = this.getLevelNumber(childLevel);
    
    return parentNumber < childNumber && childNumber - parentNumber === 1;
  }

  /**
   * 获取所有层级
   *
   * @description 返回所有有效的部门层级
   *
   * @returns 所有部门层级数组
   *
   * @example
   * ```typescript
   * const allLevels = DepartmentLevelUtils.getAllLevels(); 
   * // [DepartmentLevel.LEVEL_1, DepartmentLevel.LEVEL_2, DepartmentLevel.LEVEL_3, DepartmentLevel.LEVEL_4, DepartmentLevel.LEVEL_5, DepartmentLevel.LEVEL_6, DepartmentLevel.LEVEL_7, DepartmentLevel.LEVEL_8]
   * ```
   *
   * @since 1.0.0
   */
  public static getAllLevels(): DepartmentLevel[] {
    return [
      DepartmentLevel.LEVEL_1,
      DepartmentLevel.LEVEL_2,
      DepartmentLevel.LEVEL_3,
      DepartmentLevel.LEVEL_4,
      DepartmentLevel.LEVEL_5,
      DepartmentLevel.LEVEL_6,
      DepartmentLevel.LEVEL_7,
      DepartmentLevel.LEVEL_8
    ];
  }

  /**
   * 获取层级显示名称
   *
   * @description 获取层级的显示名称
   *
   * @param level - 部门层级枚举
   * @returns 显示名称
   *
   * @example
   * ```typescript
   * const displayName = DepartmentLevelUtils.getDisplayName(DepartmentLevel.LEVEL_1); // "总部"
   * ```
   *
   * @since 1.0.0
   */
  public static getDisplayName(level: DepartmentLevel): string {
    const displayMap: Record<DepartmentLevel, string> = {
      [DepartmentLevel.LEVEL_1]: '总部',
      [DepartmentLevel.LEVEL_2]: '事业部',
      [DepartmentLevel.LEVEL_3]: '区域',
      [DepartmentLevel.LEVEL_4]: '分公司',
      [DepartmentLevel.LEVEL_5]: '部门',
      [DepartmentLevel.LEVEL_6]: '组',
      [DepartmentLevel.LEVEL_7]: '小组',
      [DepartmentLevel.LEVEL_8]: '专项团队'
    };

    return displayMap[level];
  }
}
