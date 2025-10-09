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
 * @extends {BaseValueObject<IRoleLevelProps>}
 */
export class RoleLevel extends BaseValueObject<IRoleLevelProps> {
  get value(): RoleLevelValue {
    return this.props.value;
  }

  private constructor(props: IRoleLevelProps) {
    super(props);
  }

  public static create(level: RoleLevelValue): RoleLevel {
    this.validate(level);
    return new RoleLevel({ value: level });
  }

  public static platform(): RoleLevel {
    return new RoleLevel({ value: 'PLATFORM' });
  }

  public static tenant(): RoleLevel {
    return new RoleLevel({ value: 'TENANT' });
  }

  public static organization(): RoleLevel {
    return new RoleLevel({ value: 'ORGANIZATION' });
  }

  public static department(): RoleLevel {
    return new RoleLevel({ value: 'DEPARTMENT' });
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

  public toString(): string {
    return this.value;
  }

  public toJSON(): RoleLevelValue {
    return this.value;
  }
}

