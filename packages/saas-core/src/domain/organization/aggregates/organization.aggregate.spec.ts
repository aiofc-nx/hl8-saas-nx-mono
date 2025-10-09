import { EntityId } from '@hl8/hybrid-archi';
import { OrganizationAggregate } from './organization.aggregate';
import { OrganizationType } from '../value-objects/organization-type.vo';

describe('OrganizationAggregate', () => {
  it('应该创建组织聚合根', () => {
    const aggregate = OrganizationAggregate.create(
      EntityId.generate(),
      'tech',
      '技术委员会',
      OrganizationType.professionalCommittee(),
      { createdBy: 'system' },
    );

    expect(aggregate).toBeDefined();
    expect(aggregate.getOrganization().getName()).toBe('技术委员会');
  });
});

