import { EntityId } from '@hl8/hybrid-archi';
import { Permission } from './permission.entity';
import { PermissionAction } from '../value-objects/permission-action.vo';

describe('Permission Entity', () => {
  it('应该创建权限', () => {
    const permission = Permission.create(
      EntityId.generate(),
      'tenant:create',
      '创建租户',
      'tenant',
      PermissionAction.createAction(),
      'tenant_management',
      { createdBy: 'system' },
    );

    expect(permission.getCode()).toBe('tenant:create');
  });
});

