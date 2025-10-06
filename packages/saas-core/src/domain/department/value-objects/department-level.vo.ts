import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 部门层级属性接口
 *
 * @description 定义部门的层级信息
 * 包括层级级别、父部门ID、子部门列表等
 *
 * @since 1.0.0
 */
export interface DepartmentLevelProps {
  /**
   * 层级级别
   * 
   * @description 部门在组织架构中的层级
   * 1表示一级部门，2表示二级部门，以此类推
   */
  level: number;

  /**
   * 父部门ID
   * 
   * @description 上级部门的ID
   * 一级部门的父部门ID为空
   */
  parentDepartmentId?: string;

  /**
   * 子部门ID列表
   * 
   * @description 下级部门的ID列表
   * 叶子部门没有子部门
   */
  childDepartmentIds: string[];

  /**
   * 部门路径
   * 
   * @description 从根部门到当前部门的完整路径
   * 格式如：/root/parent/current
   */
  path: string;

  /**
   * 排序序号
   * 
   * @description 在同级部门中的排序序号
   * 用于界面显示和操作顺序
   */
  sortOrder: number;
}

/**
 * 部门层级值对象
 *
 * @description 封装部门的层级信息
 * 提供层级验证、路径管理、层级操作等功能
 *
 * ## 业务规则
 *
 * ### 层级规则
 * - 层级级别必须 >= 1
 * - 一级部门的父部门ID必须为空
 * - 非一级部门的父部门ID不能为空
 * - 部门路径必须唯一
 * - 排序序号在同级部门中必须唯一
 *
 * ### 路径规则
 * - 路径格式：/root/parent/current
 * - 路径不能包含特殊字符
 * - 路径长度不能超过500个字符
 * - 路径必须反映真实的层级关系
 *
 * @example
 * ```typescript
 * const level = DepartmentLevel.create({
 *   level: 2,
 *   parentDepartmentId: 'parent-dept-id',
 *   childDepartmentIds: ['child1-dept-id', 'child2-dept-id'],
 *   path: '/root/parent/current',
 *   sortOrder: 1
 * });
 * 
 * const isRoot = level.isRoot(); // false
 * const hasChildren = level.hasChildren(); // true
 * const newLevel = level.addChild('new-child-id');
 * ```
 *
 * @since 1.0.0
 */
export class DepartmentLevel extends BaseValueObject {
  /**
   * 私有属性存储
   */
  private readonly _props: DepartmentLevelProps;
  /**
   * 私有构造函数
   * 
   * @description 使用工厂方法创建实例
   * 确保数据验证和不变性
   *
   * @param props - 部门层级属性
   */
  private constructor(props: DepartmentLevelProps) {
    super();
    this._props = props;
    this.validate();
  }

  /**
   * 创建部门层级实例
   *
   * @description 工厂方法，创建并验证部门层级实例
   *
   * @param props - 部门层级属性
   * @returns 部门层级实例
   * @throws {InvalidDepartmentLevelException} 当层级数据无效时抛出异常
   *
   * @example
   * ```typescript
   * const level = DepartmentLevel.create({
   *   level: 1,
   *   childDepartmentIds: [],
   *   path: '/root',
   *   sortOrder: 1
   * });
   * ```
   *
   * @since 1.0.0
   */
  public static create(props: DepartmentLevelProps): DepartmentLevel {
    return new DepartmentLevel(props);
  }

  /**
   * 创建根部门层级
   *
   * @description 创建一级部门（根部门）的层级信息
   *
   * @param sortOrder - 排序序号
   * @returns 根部门层级实例
   *
   * @example
   * ```typescript
   * const rootLevel = DepartmentLevel.createRoot(1);
   * ```
   *
   * @since 1.0.0
   */
  public static createRoot(sortOrder: number): DepartmentLevel {
    return DepartmentLevel.create({
      level: 1,
      childDepartmentIds: [],
      path: '/root',
      sortOrder
    });
  }

  /**
   * 验证部门层级数据
   *
   * @description 验证层级数据是否符合业务规则
   *
   * @throws {InvalidDepartmentLevelException} 当层级数据无效时抛出异常
   *
   * @since 1.0.0
   */
  protected override validate(): void {
    // 验证层级级别
    if (this._props.level < 1) {
      throw new InvalidDepartmentLevelException('部门层级级别不能小于1');
    }

    // 验证一级部门
    if (this._props.level === 1) {
      if (this._props.parentDepartmentId) {
        throw new InvalidDepartmentLevelException('一级部门不能有父部门');
      }
      if (this._props.path !== '/root') {
        throw new InvalidDepartmentLevelException('一级部门路径必须为 /root');
      }
    } else {
      // 验证非一级部门
      if (!this._props.parentDepartmentId) {
        throw new InvalidDepartmentLevelException('非一级部门必须有父部门');
      }
      if (!this._props.path.startsWith('/')) {
        throw new InvalidDepartmentLevelException('部门路径必须以 / 开头');
      }
    }

    // 验证路径长度
    if (this._props.path.length > 500) {
      throw new InvalidDepartmentLevelException('部门路径长度不能超过500个字符');
    }

    // 验证排序序号
    if (this._props.sortOrder < 0) {
      throw new InvalidDepartmentLevelException('排序序号不能为负数');
    }

    // 验证子部门ID列表
    if (this._props.childDepartmentIds.some(id => !id || id.trim().length === 0)) {
      throw new InvalidDepartmentLevelException('子部门ID不能为空');
    }
  }

  /**
   * 检查是否为根部门
   *
   * @description 检查部门是否为一级部门（根部门）
   *
   * @returns 是否为根部门
   *
   * @example
   * ```typescript
   * const isRoot = level.isRoot(); // true
   * ```
   *
   * @since 1.0.0
   */
  public isRoot(): boolean {
    return this._props.level === 1;
  }

  /**
   * 检查是否有子部门
   *
   * @description 检查部门是否拥有子部门
   *
   * @returns 是否有子部门
   *
   * @example
   * ```typescript
   * const hasChildren = level.hasChildren(); // true
   * ```
   *
   * @since 1.0.0
   */
  public hasChildren(): boolean {
    return this._props.childDepartmentIds.length > 0;
  }

  /**
   * 检查是否为叶子部门
   *
   * @description 检查部门是否为叶子部门（没有子部门）
   *
   * @returns 是否为叶子部门
   *
   * @example
   * ```typescript
   * const isLeaf = level.isLeaf(); // false
   * ```
   *
   * @since 1.0.0
   */
  public isLeaf(): boolean {
    return !this.hasChildren();
  }

  /**
   * 添加子部门
   *
   * @description 创建新的层级实例，添加子部门
   * 遵循值对象不变性原则
   *
   * @param childDepartmentId - 子部门ID
   * @returns 新的部门层级实例
   *
   * @example
   * ```typescript
   * const newLevel = level.addChild('new-child-dept-id');
   * ```
   *
   * @since 1.0.0
   */
  public addChild(childDepartmentId: string): DepartmentLevel {
    if (!childDepartmentId || childDepartmentId.trim().length === 0) {
      throw new InvalidDepartmentLevelException('子部门ID不能为空');
    }

    if (this._props.childDepartmentIds.includes(childDepartmentId)) {
      throw new InvalidDepartmentLevelException('子部门ID已存在');
    }

    return DepartmentLevel.create({
      ...this._props,
      childDepartmentIds: [...this._props.childDepartmentIds, childDepartmentId]
    });
  }

  /**
   * 移除子部门
   *
   * @description 创建新的层级实例，移除子部门
   *
   * @param childDepartmentId - 子部门ID
   * @returns 新的部门层级实例
   *
   * @example
   * ```typescript
   * const newLevel = level.removeChild('child-dept-id');
   * ```
   *
   * @since 1.0.0
   */
  public removeChild(childDepartmentId: string): DepartmentLevel {
    const index = this._props.childDepartmentIds.indexOf(childDepartmentId);
    if (index === -1) {
      throw new InvalidDepartmentLevelException('子部门ID不存在');
    }

    const newChildIds = [...this._props.childDepartmentIds];
    newChildIds.splice(index, 1);

    return DepartmentLevel.create({
      ...this._props,
      childDepartmentIds: newChildIds
    });
  }

  /**
   * 更新排序序号
   *
   * @description 创建新的层级实例，更新排序序号
   *
   * @param sortOrder - 新的排序序号
   * @returns 新的部门层级实例
   *
   * @example
   * ```typescript
   * const newLevel = level.updateSortOrder(2);
   * ```
   *
   * @since 1.0.0
   */
  public updateSortOrder(sortOrder: number): DepartmentLevel {
    if (sortOrder < 0) {
      throw new InvalidDepartmentLevelException('排序序号不能为负数');
    }

    return DepartmentLevel.create({
      ...this._props,
      sortOrder
    });
  }

  /**
   * 更新路径
   *
   * @description 创建新的层级实例，更新部门路径
   *
   * @param path - 新的路径
   * @returns 新的部门层级实例
   *
   * @example
   * ```typescript
   * const newLevel = level.updatePath('/root/parent/new');
   * ```
   *
   * @since 1.0.0
   */
  public updatePath(path: string): DepartmentLevel {
    if (!path || path.trim().length === 0) {
      throw new InvalidDepartmentLevelException('部门路径不能为空');
    }

    if (path.length > 500) {
      throw new InvalidDepartmentLevelException('部门路径长度不能超过500个字符');
    }

    return DepartmentLevel.create({
      ...this._props,
      path: path.trim()
    });
  }

  /**
   * 获取子部门数量
   *
   * @description 返回子部门的数量
   *
   * @returns 子部门数量
   *
   * @example
   * ```typescript
   * const childCount = level.getChildCount(); // 3
   * ```
   *
   * @since 1.0.0
   */
  public getChildCount(): number {
    return this._props.childDepartmentIds.length;
  }

  /**
   * 获取所有层级信息
   *
   * @description 返回所有层级信息的副本
   *
   * @returns 层级属性副本
   *
   * @since 1.0.0
   */
  public getAllLevelInfo(): DepartmentLevelProps {
    return { ...this._props };
  }

  // Getter 方法
  public get level(): number { return this._props.level; }
  public get parentDepartmentId(): string | undefined { return this._props.parentDepartmentId; }
  public get childDepartmentIds(): string[] { return [...this._props.childDepartmentIds]; }
  public get path(): string { return this._props.path; }
  public get sortOrder(): number { return this._props.sortOrder; }
}

/**
 * 无效部门层级异常
 *
 * @description 当部门层级数据无效时抛出的异常
 *
 * @since 1.0.0
 */
export class InvalidDepartmentLevelException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentLevelException';
  }
}
