/**
 * 权限操作值对象
 *
 * @description 封装权限操作类型的验证逻辑
 *
 * ## 业务规则
 *
 * ### 操作类型
 * - CREATE: 创建
 * - READ: 读取
 * - UPDATE: 更新
 * - DELETE: 删除
 * - EXECUTE: 执行（特殊操作）
 *
 * @example
 * ```typescript
 * const action = PermissionAction.create();
 * const read = PermissionAction.read();
 * ```
 *
 * @class PermissionAction
 * @since 1.0.0
 */

import { BaseValueObject } from '@hl8/hybrid-archi';
import { PERMISSION_ACTIONS } from '../../../constants/permission.constants';

export type PermissionActionValue = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'EXECUTE';

export interface IPermissionActionProps {
  value: PermissionActionValue;
}

export class PermissionAction extends BaseValueObject {
  get value(): PermissionActionValue {
    return this._value;
  }

  private constructor(private readonly _value: PermissionActionValue) {
    super();
  }

  public static create(action: PermissionActionValue): PermissionAction {
    this.validate(action);
    return new PermissionAction(action);
  }

  public static createAction(): PermissionAction {
    return new PermissionAction('CREATE');
  }

  public static read(): PermissionAction {
    return new PermissionAction('READ');
  }

  public static update(): PermissionAction {
    return new PermissionAction('UPDATE');
  }

  public static delete(): PermissionAction {
    return new PermissionAction('DELETE');
  }

  public static execute(): PermissionAction {
    return new PermissionAction('EXECUTE');
  }

  private static validate(action: PermissionActionValue): void {
    if (!action) {
      throw new Error('权限操作不能为空');
    }
    const validActions: PermissionActionValue[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'EXECUTE'];
    if (!validActions.includes(action)) {
      throw new Error(`无效的权限操作: ${action}`);
    }
  }

  public isCreate(): boolean {
    return this.value === PERMISSION_ACTIONS.CREATE;
  }

  public isRead(): boolean {
    return this.value === PERMISSION_ACTIONS.READ;
  }

  public isUpdate(): boolean {
    return this.value === PERMISSION_ACTIONS.UPDATE;
  }

  public isDelete(): boolean {
    return this.value === PERMISSION_ACTIONS.DELETE;
  }

  public isExecute(): boolean {
    return this.value === PERMISSION_ACTIONS.EXECUTE;
  }

  public override toString(): string {
    return this.value;
  }

  public override toJSON(): Record<string, unknown> {
    return { value: this.value };
  }

  protected override arePropertiesEqual(other: BaseValueObject): boolean {
    if (!(other instanceof PermissionAction)) {
      return false;
    }
    return this._value === other._value;
  }
}

