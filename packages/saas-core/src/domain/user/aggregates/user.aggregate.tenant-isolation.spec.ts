/**
 * 用户聚合根租户隔离测试
 *
 * @description 测试用户聚合根的租户隔离功能
 * 验证租户上下文验证、异常处理和数据隔离机制
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { UserRole, UserStatus } from '@hl8/hybrid-archi';
import { UserAggregate } from './user.aggregate';
import { UserProfile } from '../value-objects/user-profile.vo';
import { TenantContextException } from '../../exceptions/tenant-context.exception';

describe('UserAggregate - 租户隔离测试', () => {
  let userId: EntityId;
  let tenantId: EntityId;
  let userProfile: UserProfile;

  beforeEach(() => {
    userId = EntityId.generate();
    tenantId = EntityId.generate();
    userProfile = UserProfile.create({
      firstName: '测试',
      lastName: '用户',
      email: 'test@example.com',
      phone: '+86-138-0000-0000',
      avatar: 'https://example.com/avatar.jpg',
      timezone: 'Asia/Shanghai',
      locale: 'zh-CN',
      preferences: {
        theme: 'light',
        notifications: true,
        language: 'zh-CN'
      }
    });
  });

  describe('租户上下文验证', () => {
    it('应该在没有租户上下文时抛出异常', () => {
      // 创建未分配租户的用户聚合根
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );

      // 验证获取租户ID时抛出异常
      expect(() => {
        userAggregate.getCurrentTenantId();
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.getCurrentTenantId();
      }).toThrow('用户未分配到任何租户');
    });

    it('应该在需要租户上下文的操作中抛出异常', () => {
      // 创建未分配租户的用户聚合根
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );

      // 验证各种操作都会抛出异常
      expect(() => {
        userAggregate.activate();
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.suspend('测试暂停');
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.disable('测试禁用');
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.lock('测试锁定');
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.unlock();
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.authenticate('password123');
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.updatePassword('oldPassword', 'newPassword');
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.resetPassword('newPassword');
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.addRole(UserRole.TENANT_ADMIN);
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.removeRole(UserRole.TENANT_ADMIN);
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.updateProfile(userProfile);
      }).toThrow(TenantContextException);
    });
  });

  describe('租户分配功能', () => {
    it('应该正确分配用户到租户', () => {
      // 创建用户聚合根
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );

      // 分配用户到租户
      userAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);

      // 验证可以获取租户ID
      expect(userAggregate.getCurrentTenantId()).toBe(tenantId.toString());

      // 验证用户实体包含租户信息
      const user = userAggregate.getUser();
      expect(user.getTenantId()).toEqual(tenantId);
    });

    it('应该在有租户上下文时正常执行操作', () => {
      // 创建用户聚合根并分配到租户
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );
      userAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);

      // 验证各种操作都能正常执行
      expect(() => {
        userAggregate.activate();
      }).not.toThrow();

      expect(() => {
        userAggregate.suspend('测试暂停');
      }).not.toThrow();

      expect(() => {
        userAggregate.unlock();
      }).not.toThrow();

      expect(() => {
        userAggregate.addRole(UserRole.DEPARTMENT_ADMIN);
      }).not.toThrow();

      expect(() => {
        userAggregate.updateProfile(userProfile);
      }).not.toThrow();
    });
  });

  describe('租户移除功能', () => {
    it('应该正确从租户移除用户', () => {
      // 创建用户聚合根并分配到租户
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );
      userAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);

      // 验证租户分配成功
      expect(userAggregate.getCurrentTenantId()).toBe(tenantId.toString());

      // 从租户移除用户
      userAggregate.removeFromTenant(tenantId);

      // 验证移除后无法获取租户ID
      expect(() => {
        userAggregate.getCurrentTenantId();
      }).toThrow(TenantContextException);

      // 验证用户实体不再包含租户信息
      const user = userAggregate.getUser();
      expect(user.getTenantId()).toBeUndefined();
    });
  });

  describe('事件发布验证', () => {
    it('应该在租户分配时发布正确的事件', () => {
      // 创建用户聚合根
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );

      // 分配用户到租户
      userAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);

      // 验证事件被正确发布
      const events = userAggregate.uncommittedEvents;
      expect(events).toHaveLength(2); // UserRegisteredEvent + UserAssignedToTenantEvent

      // 验证租户分配事件包含正确的租户信息
      const assignedEvent = events.find(event => 
        event.constructor.name === 'UserAssignedToTenantEvent'
      );
      expect(assignedEvent).toBeDefined();
      expect((assignedEvent as any).assignedTenantId).toEqual(tenantId);
    });

    it('应该在用户激活时发布包含租户信息的事件', () => {
      // 创建用户聚合根并分配到租户
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );
      userAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);

      // 激活用户
      userAggregate.activate();

      // 验证激活事件包含租户信息
      const events = userAggregate.uncommittedEvents;
      const activatedEvent = events.find(event => 
        event.constructor.name === 'UserActivatedEvent'
      );
      expect(activatedEvent).toBeDefined();
      expect((activatedEvent as any).tenantId).toBe(tenantId.toString());
    });
  });

  describe('异常处理验证', () => {
    it('应该提供详细的异常信息', () => {
      // 创建用户聚合根
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );

      try {
        userAggregate.getCurrentTenantId();
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(TenantContextException);
        expect((error as TenantContextException).message).toContain('用户未分配到任何租户');
        expect((error as TenantContextException).code).toBe('TENANT_CONTEXT_ERROR');
      }
    });

    it('应该提供操作上下文信息', () => {
      // 创建用户聚合根
      const userAggregate = UserAggregate.create(
        userId,
        'test@example.com',
        'testuser',
        'password123',
        userProfile
      );

      try {
        userAggregate.activate();
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(TenantContextException);
        expect((error as TenantContextException).message).toContain('操作 用户操作 缺少租户上下文');
      }
    });
  });
});
