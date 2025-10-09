/**
 * 角色层级值对象
 *
 * @description 封装角色层级的验证逻辑和业务规则
 *
 * ## 业务规则
 *
 * ### 角色层级
 * - PLATFORM: 平台级（最高权限）
 * - TENANT: 租户级
 * - ORGANIZATION: 组织级
 * - DEPARTMENT: 部门级
 *
 * ### 权限继承
 * - PLATFORM > TENANT > ORGANIZATION > DEPARTMENT
 * - 上级角色包含下级角色的所有权限
 *
 * @example
 * ```typescript
 * const level = RoleLevel.platform();
 * const level2 = RoleLevel.create('TENANT');
 * console.log(level.canManage(level2)); // true
 * ```
 *
 * @class RoleLevel
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { ROLE_LEVEL_CONFIG } from '../../../constants/role.constants';

/**
 * 角色层级枚举
 */
export type RoleLevelValue = 'PLATFORM' | 'TENANT' | 'ORGANIZATION' | 'DEPARTMENT';

/**
 * 角色层级属性
 *
 * @interface IRoleLevelProps
 */
export interface IRoleLevelProps {
  value: RoleLevelValue;
}

/**
 * 角色层级值对象
 *
 * @class RoleLevel
 * @extends {BaseValueObject}
 */
export class RoleLevel extends BaseValueObject {
  get value(): RoleLevelValue {
    return this._value;
  }

  private constructor(private readonly _value: RoleLevelValue) {
    super();
  }

  public static create(level: RoleLevelValue): RoleLevel {
    this.validate(level);
    return new RoleLevel(level);
  }

  public static platform(): RoleLevel {
    return new RoleLevel('PLATFORM');
  }

  public static tenant(): RoleLevel {
    return new RoleLevel('TENANT');
  }

  public static organization(): RoleLevel {
    return new RoleLevel('ORGANIZATION');
  }

  public static department(): RoleLevel {
    return new RoleLevel('DEPARTMENT');
  }

  private static validate(level: RoleLevelValue): void {
    if (!level) {
      throw new Error('角色层级不能为空');
    }
    const validLevels: RoleLevelValue[] = ['PLATFORM', 'TENANT', 'ORGANIZATION', 'DEPARTMENT'];
    if (!validLevels.includes(level)) {
      throw new Error(`无效的角色层级: ${level}`);
    }
  }

  public getPriority(): number {
    return ROLE_LEVEL_CONFIG[this.value]?.priority || 99;
  }

  public getName(): string {
    return ROLE_LEVEL_CONFIG[this.value]?.name || this.value;
  }

  public getDescription(): string {
    return ROLE_LEVEL_CONFIG[this.value]?.description || '';
  }

  public canManage(otherLevel: RoleLevel): boolean {
    return this.getPriority() <= otherLevel.getPriority();
  }

  public override toString(): string {
    return this.value;
  }

  public override toJSON(): Record<string, unknown> {
    return { value: this.value };
  }

  protected override arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof RoleLevel)) {
      return false;
    }
    return this._value === other._value;
  }
}

