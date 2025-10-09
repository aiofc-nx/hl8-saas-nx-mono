import { EntityId, OrganizationStatus } from '@hl8/hybrid-archi';
import { Organization } from './organization.entity';
import { OrganizationType } from '../value-objects/organization-type.vo';

describe('Organization Entity', () => {
  it('应该创建组织', () => {
    const org = Organization.create(
      EntityId.generate(),
      'tech',
      '技术委员会',
      OrganizationType.professionalCommittee(),
      { createdBy: 'system' },
    );

    expect(org.getName()).toBe('技术委员会');
    expect(org.getStatus()).toBe(OrganizationStatus.ACTIVE);
  });
});

