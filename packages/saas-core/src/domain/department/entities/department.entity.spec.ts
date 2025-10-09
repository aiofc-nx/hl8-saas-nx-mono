import { EntityId } from '@hl8/hybrid-archi';
import { Department } from './department.entity';

describe('Department Entity', () => {
  it('应该创建根部门', () => {
    const dept = Department.createRoot(
      EntityId.generate(),
      EntityId.generate(),
      'HQ',
      '总部',
      { createdBy: 'system' },
    );

    expect(dept.getName()).toBe('总部');
    expect(dept.getLevel().isRoot()).toBe(true);
  });
});

