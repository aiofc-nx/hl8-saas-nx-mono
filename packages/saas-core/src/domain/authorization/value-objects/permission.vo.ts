import { BaseValueObject } from '@hl8/hybrid-archi';

/**
 * 权限属性接口
 *
 * @description 定义权限的基本信息
 * 包括权限名称、描述、资源类型、操作类型等
 *
 * @since 1.0.0
 */
export interface PermissionProps {
  /**
   * 权限名称
   * 
   * @description 权限的唯一标识
   * 格式如：manage_users, read_tenant_data, create_organization
   */
  name: string;

  /**
   * 权限描述
   * 
   * @description 权限的中文描述
   * 用于界面显示和权限说明
   */
  description: string;

  /**
   * 资源类型
   * 
   * @description 权限作用的资源类型
   * 如：user, tenant, organization, department
   */
  resourceType: string;

  /**
   * 操作类型
   * 
   * @description 权限允许的操作类型
   * 如：create, read, update, delete, manage
   */
  actionType: string;

  /**
   * 权限范围
   * 
   * @description 权限的作用范围
   * 如：own, department, organization, tenant, platform
   */
  scope: PermissionScope;

  /**
   * 权限级别
   * 
   * @description 权限的级别，用于权限继承
   * 数值越大，权限级别越高
   */
  level: number;

  /**
   * 是否系统权限
   * 
   * @description 是否为系统内置权限
   * 系统权限不能被删除或修改
   */
  isSystemPermission: boolean;
}

/**
 * 权限范围枚举
 *
 * @description 定义权限的作用范围
 *
 * @since 1.0.0
 */
export enum PermissionScope {
  /**
   * 自己的资源
   */
  OWN = 'OWN',

  /**
   * 部门内资源
   */
  DEPARTMENT = 'DEPARTMENT',

  /**
   * 组织内资源
   */
  ORGANIZATION = 'ORGANIZATION',

  /**
   * 租户内资源
   */
  TENANT = 'TENANT',

  /**
   * 平台级资源
   */
  PLATFORM = 'PLATFORM'
}

/**
 * 权限值对象
 *
 * @description 封装权限信息
 * 提供权限验证、比较、继承等功能
 *
 * ## 业务规则
 *
 * ### 权限命名规则
 * - 权限名称必须唯一
 * - 格式：{action}_{resource} 或 {action}_{resource}_{scope}
 * - 使用下划线分隔，全小写
 *
 * ### 权限级别规则
 * - 级别数值越大，权限越高
 * - 高级别权限包含低级别权限
 * - 系统权限级别最高
 *
 * ### 权限范围规则
 * - 范围从 OWN 到 PLATFORM 递增
 * - 高级范围包含低级范围
 * - 跨范围权限需要特殊授权
 *
 * @example
 * ```typescript
 * const permission = Permission.create({
 *   name: 'manage_users',
 *   description: '管理用户',
 *   resourceType: 'user',
 *   actionType: 'manage',
 *   scope: PermissionScope.TENANT,
 *   level: 50,
 *   isSystemPermission: true
 * });
 * 
 * const canInherit = permission.canInheritFrom(otherPermission); // true
 * const isHigher = permission.isHigherThan(otherPermission); // true
 * ```
 *
 * @since 1.0.0
 */
export class Permission extends BaseValueObject {
  private readonly _props: PermissionProps;
  /**
   * 私有构造函数
   * 
   * @description 使用工厂方法创建实例
   * 确保数据验证和不变性
   *
   * @param props - 权限属性
   */
  private constructor(props: PermissionProps) {
    super();
    this._props = props;
    this.validate();
  }

  /**
   * 创建权限实例
   *
   * @description 工厂方法，创建并验证权限实例
   *
   * @param props - 权限属性
   * @returns 权限实例
   * @throws {InvalidPermissionException} 当权限数据无效时抛出异常
   *
   * @example
   * ```typescript
   * const permission = Permission.create({
   *   name: 'manage_users',
   *   description: '管理用户',
   *   resourceType: 'user',
   *   actionType: 'manage',
   *   scope: PermissionScope.TENANT,
   *   level: 50,
   *   isSystemPermission: true
   * });
   * ```
   *
   * @since 1.0.0
   */
  public static create(props: PermissionProps): Permission {
    return new Permission(props);
  }

  /**
   * 验证权限数据
   *
   * @description 验证权限数据是否符合业务规则
   *
   * @throws {InvalidPermissionException} 当权限数据无效时抛出异常
   *
   * @since 1.0.0
   */
  protected override validate(): void {
    // 验证权限名称
    if (!this._props.name || this._props.name.trim().length === 0) {
      throw new ValueObjectExceptions.InvalidValueObjectException(
        'Permission',
        '权限名称不能为空',
        { 
          name: this._props.name, 
          description: this._props.description, 
          resourceType: this._props.resourceType, 
          actionType: this._props.actionType, 
          scope: this._props.scope, 
          level: this._props.level, 
          isSystemPermission: this._props.isSystemPermission 
        }
      );
    }

    const nameRegex = /^[a-z][a-z0-9_]*$/;
    if (!nameRegex.test(this._props.name)) {
      throw new ValueObjectExceptions.InvalidValueObjectException(
        'Permission',
        '权限名称格式不正确，只能包含小写字母、数字和下划线',
        { 
          name: this._props.name, 
          description: this._props.description, 
          resourceType: this._props.resourceType, 
          actionType: this._props.actionType, 
          scope: this._props.scope, 
          level: this._props.level, 
          isSystemPermission: this._props.isSystemPermission 
        }
      );
    }

    // 验证描述
    if (!this._props.description || this._props.description.trim().length === 0) {
      throw new ValueObjectExceptions.InvalidValueObjectException(
        'Permission',
        '权限描述不能为空',
        { 
          name: this._props.name, 
          description: this._props.description, 
          resourceType: this._props.resourceType, 
          actionType: this._props.actionType, 
          scope: this._props.scope, 
          level: this._props.level, 
          isSystemPermission: this._props.isSystemPermission 
        }
      );
    }

    if (this._props.description.length > 200) {
      throw new ValueObjectExceptions.InvalidValueObjectException(
        'Permission',
        '权限描述长度不能超过200个字符',
        { 
          name: this._props.name, 
          description: this._props.description, 
          resourceType: this._props.resourceType, 
          actionType: this._props.actionType, 
          scope: this._props.scope, 
          level: this._props.level, 
          isSystemPermission: this._props.isSystemPermission 
        }
      );
    }

    // 验证资源类型
    if (!this._props.resourceType || this._props.resourceType.trim().length === 0) {
      throw new ValueObjectExceptions.InvalidValueObjectException(
        'Permission',
        '资源类型不能为空',
        { 
          name: this._props.name, 
          description: this._props.description, 
          resourceType: this._props.resourceType, 
          actionType: this._props.actionType, 
          scope: this._props.scope, 
          level: this._props.level, 
          isSystemPermission: this._props.isSystemPermission 
        }
      );
    }

    // 验证操作类型
    if (!this._props.actionType || this._props.actionType.trim().length === 0) {
      throw new ValueObjectExceptions.InvalidValueObjectException(
        'Permission',
        '操作类型不能为空',
        { 
          name: this._props.name, 
          description: this._props.description, 
          resourceType: this._props.resourceType, 
          actionType: this._props.actionType, 
          scope: this._props.scope, 
          level: this._props.level, 
          isSystemPermission: this._props.isSystemPermission 
        }
      );
    }

    // 验证权限级别
    if (this._props.level < 0 || this._props.level > 100) {
      throw new ValueObjectExceptions.InvalidValueObjectException(
        'Permission',
        '权限级别必须在0-100之间',
        { 
          name: this._props.name, 
          description: this._props.description, 
          resourceType: this._props.resourceType, 
          actionType: this._props.actionType, 
          scope: this._props.scope, 
          level: this._props.level, 
          isSystemPermission: this._props.isSystemPermission 
        }
      );
    }
  }

  /**
   * 检查是否可以继承自指定权限
   *
   * @description 检查当前权限是否可以继承自指定权限
   * 基于权限级别和范围进行判断
   *
   * @param otherPermission - 其他权限
   * @returns 是否可以继承
   *
   * @example
   * ```typescript
   * const canInherit = permission.canInheritFrom(otherPermission); // true
   * ```
   *
   * @since 1.0.0
   */
  public canInheritFrom(otherPermission: Permission): boolean {
    // 不能继承自己
    if (this._props.name === otherPermission._props.name) {
      return false;
    }

    // 检查权限级别
    if (this._props.level <= otherPermission._props.level) {
      return false;
    }

    // 检查权限范围
    return this.isScopeHigherThan(otherPermission._props.scope);
  }

  /**
   * 检查是否比指定权限级别更高
   *
   * @description 比较两个权限的级别
   *
   * @param otherPermission - 其他权限
   * @returns 是否级别更高
   *
   * @example
   * ```typescript
   * const isHigher = permission.isHigherThan(otherPermission); // true
   * ```
   *
   * @since 1.0.0
   */
  public isHigherThan(otherPermission: Permission): boolean {
    return this._props.level > otherPermission._props.level;
  }

  /**
   * 检查权限范围是否更高
   *
   * @description 比较权限范围的高低
   *
   * @param scope - 权限范围
   * @returns 是否范围更高
   *
   * @since 1.0.0
   */
  private isScopeHigherThan(scope: PermissionScope): boolean {
    const scopeLevels: Record<PermissionScope, number> = {
      [PermissionScope.OWN]: 1,
      [PermissionScope.DEPARTMENT]: 2,
      [PermissionScope.ORGANIZATION]: 3,
      [PermissionScope.TENANT]: 4,
      [PermissionScope.PLATFORM]: 5
    };

    return scopeLevels[this._props.scope] > scopeLevels[scope];
  }

  /**
   * 检查是否包含指定权限
   *
   * @description 检查当前权限是否包含指定权限
   * 基于权限名称、资源类型、操作类型进行判断
   *
   * @param permissionName - 权限名称
   * @returns 是否包含该权限
   *
   * @example
   * ```typescript
   * const contains = permission.contains('read_users'); // true
   * ```
   *
   * @since 1.0.0
   */
  public contains(permissionName: string): boolean {
    // 完全匹配
    if (this._props.name === permissionName) {
      return true;
    }

    // 通配符匹配
    if (this._props.name.endsWith('_all') && permissionName.startsWith(this._props.name.replace('_all', ''))) {
      return true;
    }

    return false;
  }

  /**
   * 获取权限的中文描述
   *
   * @description 返回权限的中文描述
   *
   * @returns 中文描述
   *
   * @since 1.0.0
   */
  public getDescription(): string {
    return this._props.description;
  }

  /**
   * 获取权限范围的中文描述
   *
   * @description 返回权限范围的中文描述
   *
   * @returns 范围中文描述
   *
   * @since 1.0.0
   */
  public getScopeDescription(): string {
    const scopeDescriptions: Record<PermissionScope, string> = {
      [PermissionScope.OWN]: '自己的',
      [PermissionScope.DEPARTMENT]: '部门内',
      [PermissionScope.ORGANIZATION]: '组织内',
      [PermissionScope.TENANT]: '租户内',
      [PermissionScope.PLATFORM]: '平台级'
    };

    return scopeDescriptions[this._props.scope];
  }


  /**
   * 获取所有权限信息
   *
   * @description 返回所有权限信息的副本
   *
   * @returns 权限属性副本
   *
   * @since 1.0.0
   */
  public getAllPermissionInfo(): PermissionProps {
    return { ...this._props };
  }

  // Getter 方法
  public get name(): string { return this._props.name; }
  public get description(): string { return this._props.description; }
  public get resourceType(): string { return this._props.resourceType; }
  public get actionType(): string { return this._props.actionType; }
  public get scope(): PermissionScope { return this._props.scope; }
  public get level(): number { return this._props.level; }
  public get isSystemPermission(): boolean { return this._props.isSystemPermission; }
}

// 导入新的异常类
import { ValueObjectExceptions } from '../../exceptions';
