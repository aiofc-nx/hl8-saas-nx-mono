/**
 * 部门路径值对象
 *
 * @description 封装部门物化路径的验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 路径格式
 * - 格式：`/ancestor1/ancestor2/.../self`
 * - 示例：`/1/5/12` 表示部门12的父部门是5，祖先是1
 * - 分隔符：`/`
 *
 * ### 验证规则
 * - 路径必须以 `/` 开头
 * - 路径中只包含数字和 `/`
 * - 路径长度不超过最大限制
 *
 * @example
 * ```typescript
 * const path = DepartmentPath.create('/1/5/12');
 * const rootPath = DepartmentPath.root('1');
 * console.log(path.getDepth()); // 3
 * console.log(path.getAncestors()); // ['1', '5']
 * ```
 *
 * @class DepartmentPath
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { DEPARTMENT_PATH_CONFIG } from '../../../constants/department.constants';

/**
 * 部门路径属性
 *
 * @interface IDepartmentPathProps
 */
export interface IDepartmentPathProps {
  value: string;
}

/**
 * 部门路径值对象
 *
 * @class DepartmentPath
 * @extends {BaseValueObject}
 */
export class DepartmentPath extends BaseValueObject {
  /**
   * 获取路径字符串
   *
   * @readonly
   * @type {string}
   */
  get value(): string {
    return this._value;
  }

  /**
   * 私有构造函数
   *
   * @private
   * @param {string} value - 部门路径
   */
  private constructor(private readonly _value: string) {
    super();
  }

  /**
   * 创建部门路径值对象
   *
   * @static
   * @param {string} path - 路径字符串
   * @returns {DepartmentPath} 部门路径值对象
   * @throws {Error} 当路径无效时抛出错误
   */
  public static create(path: string): DepartmentPath {
    this.validate(path);
    return new DepartmentPath(path);
  }

  /**
   * 创建根部门路径
   *
   * @static
   * @param {string} rootId - 根部门ID
   * @returns {DepartmentPath} 根部门路径
   */
  public static root(rootId: string): DepartmentPath {
    return new DepartmentPath(`/${rootId}`);
  }

  /**
   * 从父路径和当前ID创建路径
   *
   * @static
   * @param {DepartmentPath} parentPath - 父部门路径
   * @param {string} departmentId - 当前部门ID
   * @returns {DepartmentPath} 新的部门路径
   */
  public static fromParent(parentPath: DepartmentPath, departmentId: string): DepartmentPath {
    const newPath = `${parentPath.value}${DEPARTMENT_PATH_CONFIG.SEPARATOR}${departmentId}`;
    return new DepartmentPath(newPath);
  }

  /**
   * 验证部门路径
   *
   * @private
   * @static
   * @param {string} path - 待验证的路径
   * @throws {Error} 当路径无效时抛出错误
   */
  private static validate(path: string): void {
    if (!path || path.length === 0) {
      throw new Error('部门路径不能为空');
    }

    if (!path.startsWith(DEPARTMENT_PATH_CONFIG.SEPARATOR)) {
      throw new Error('部门路径必须以 / 开头');
    }

    if (path.length > DEPARTMENT_PATH_CONFIG.MAX_LENGTH) {
      throw new Error(
        `部门路径长度不能超过 ${DEPARTMENT_PATH_CONFIG.MAX_LENGTH} 字符`,
      );
    }

    // 验证路径格式：只包含数字和分隔符
    const pathPattern = /^\/[\d\/]+$/;
    if (!pathPattern.test(path)) {
      throw new Error(DEPARTMENT_PATH_CONFIG.ERROR_MESSAGE);
    }

    // 验证不能有连续的分隔符
    if (path.includes('//')) {
      throw new Error('部门路径不能包含连续的分隔符');
    }

    // 验证不能以分隔符结尾（除非是根路径）
    if (path.length > 1 && path.endsWith(DEPARTMENT_PATH_CONFIG.SEPARATOR)) {
      throw new Error('部门路径不能以分隔符结尾');
    }
  }

  /**
   * 获取路径深度（层级数）
   *
   * @returns {number} 路径深度
   */
  public getDepth(): number {
    return this.getSegments().length;
  }

  /**
   * 获取路径片段（所有部门ID）
   *
   * @returns {string[]} 部门ID数组
   */
  public getSegments(): string[] {
    return this.value
      .split(DEPARTMENT_PATH_CONFIG.SEPARATOR)
      .filter((segment) => segment.length > 0);
  }

  /**
   * 获取祖先部门ID列表（不包含当前部门）
   *
   * @returns {string[]} 祖先部门ID数组
   */
  public getAncestors(): string[] {
    const segments = this.getSegments();
    return segments.slice(0, -1);
  }

  /**
   * 获取当前部门ID
   *
   * @returns {string} 当前部门ID
   */
  public getCurrentId(): string {
    const segments = this.getSegments();
    return segments[segments.length - 1];
  }

  /**
   * 获取父部门ID
   *
   * @returns {string | null} 父部门ID，如果是根部门则返回null
   */
  public getParentId(): string | null {
    const ancestors = this.getAncestors();
    return ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
  }

  /**
   * 获取根部门ID
   *
   * @returns {string} 根部门ID
   */
  public getRootId(): string {
    const segments = this.getSegments();
    return segments[0];
  }

  /**
   * 检查是否为根路径
   *
   * @returns {boolean}
   */
  public isRoot(): boolean {
    return this.getDepth() === 1;
  }

  /**
   * 检查是否包含指定的祖先部门
   *
   * @param {string} ancestorId - 祖先部门ID
   * @returns {boolean}
   */
  public hasAncestor(ancestorId: string): boolean {
    return this.getAncestors().includes(ancestorId);
  }

  /**
   * 检查是否为指定路径的子孙
   *
   * @param {DepartmentPath} ancestorPath - 祖先路径
   * @returns {boolean}
   */
  public isDescendantOf(ancestorPath: DepartmentPath): boolean {
    return this.value.startsWith(ancestorPath.value + DEPARTMENT_PATH_CONFIG.SEPARATOR);
  }

  /**
   * 获取父路径
   *
   * @returns {DepartmentPath | null} 父路径，如果是根路径则返回null
   */
  public getParentPath(): DepartmentPath | null {
    if (this.isRoot()) {
      return null;
    }
    const segments = this.getSegments();
    const parentSegments = segments.slice(0, -1);
    return new DepartmentPath(
      DEPARTMENT_PATH_CONFIG.SEPARATOR + parentSegments.join(DEPARTMENT_PATH_CONFIG.SEPARATOR),
    );
  }

  /**
   * 转换为字符串
   *
   * @returns {string}
   */
  public toString(): string {
    return this.value;
  }

  /**
   * 转换为JSON
   *
   * @returns {string}
   */
  public toJSON(): string {
    return this.value;
  }

  protected arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof DepartmentPath)) {
      return false;
    }
    return this._value === other._value;
  }
}

