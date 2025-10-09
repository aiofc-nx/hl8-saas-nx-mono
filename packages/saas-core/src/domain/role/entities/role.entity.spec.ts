import { EntityId } from '@hl8/hybrid-archi';
import { Role } from './role.entity';
import { RoleName } from '../value-objects/role-name.vo';
import { RoleLevel } from '../value-objects/role-level.vo';

describe('Role Entity', () => {
  it('应该创建角色', () => {
    const role = Role.create(
      EntityId.generate(),
      'tenant:admin',
      RoleName.create('租户管理员'),
      RoleLevel.tenant(),
      { createdBy: 'system' },
    );

    expect(role.getCode()).toBe('tenant:admin');
  });
});

