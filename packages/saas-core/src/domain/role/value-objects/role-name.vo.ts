/**
 * 角色名称值对象
 *
 * @description 封装角色名称的验证逻辑
 *
 * @class RoleName
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { ROLE_NAME_VALIDATION } from '../../../constants/role.constants';

export interface IRoleNameProps {
  value: string;
}

export class RoleName extends BaseValueObject {
  get value(): string {
    return this._value;
  }

  private constructor(private readonly _value: string) {
    super();
  }

  public static create(name: string): RoleName {
    this.validate(name);
    return new RoleName(name.trim());
  }

  private static validate(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('角色名称不能为空');
    }

    if (
      name.length < ROLE_NAME_VALIDATION.MIN_LENGTH ||
      name.length > ROLE_NAME_VALIDATION.MAX_LENGTH
    ) {
      throw new Error(ROLE_NAME_VALIDATION.ERROR_MESSAGE);
    }
  }

  public toString(): string {
    return this.value;
  }

  public toJSON(): string {
    return this.value;
  }

  protected arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof RoleName)) {
      return false;
    }
    return this._value === other._value;
  }
}

