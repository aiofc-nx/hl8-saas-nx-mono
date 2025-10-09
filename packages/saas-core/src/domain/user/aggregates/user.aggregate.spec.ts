/**
 * 用户聚合根单元测试
 */

import { EntityId, Username, Email } from '@hl8/hybrid-archi';
import { UserAggregate } from './user.aggregate';

describe('UserAggregate', () => {
  it('应该创建用户聚合根', () => {
    const id = EntityId.generate();
    const username = Username.create('johndoe');
    const email = Email.create('john@example.com');

    const aggregate = UserAggregate.create(
      id,
      username,
      email,
      null,
      'hash',
      'salt',
      { createdBy: 'system' },
    );

    expect(aggregate).toBeDefined();
    expect(aggregate.getUser()).toBeDefined();
    expect(aggregate.getProfile()).toBeDefined();
    expect(aggregate.getCredentials()).toBeDefined();
  });
});

