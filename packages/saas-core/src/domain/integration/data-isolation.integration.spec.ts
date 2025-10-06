/**
 * 数据隔离集成测试
 *
 * @description 测试数据隔离机制的端到端功能
 * 验证租户隔离、事件隔离、异常处理等完整流程
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { UserRole, UserStatus } from '@hl8/hybrid-archi';
import { UserAggregate } from '../user/aggregates/user.aggregate';
import { TenantAggregate } from '../tenant/aggregates/tenant.aggregate';
import { OrganizationAggregate } from '../organization/aggregates/organization.aggregate';
import { UserProfile } from '../user/value-objects/user-profile.vo';
import { TenantContextException } from '../exceptions/tenant-context.exception';
import { IsolationService } from '../data-isolation/services/isolation.service';
import { DataIsolationStrategy } from '../data-isolation/value-objects/isolation-strategy.vo';

describe('数据隔离集成测试', () => {
  let tenantId: EntityId;
  let organizationId: EntityId;
  let adminUserId: EntityId;
  let regularUserId: EntityId;
  let userProfile: UserProfile;

  beforeEach(() => {
    tenantId = EntityId.generate();
    organizationId = EntityId.generate();
    adminUserId = EntityId.generate();
    regularUserId = EntityId.generate();
    
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

  describe('租户隔离端到端测试', () => {
    it('应该完整支持租户创建到用户分配的流程', () => {
      // 1. 创建租户
      const tenantAggregate = TenantAggregate.create(
        tenantId,
        'TENANT001',
        '测试租户',
        'BASIC' as any,
        adminUserId.toString()
      );

      expect(tenantAggregate.getTenantId()).toEqual(tenantId);
      expect(tenantAggregate.uncommittedEvents).toHaveLength(1);

      // 2. 激活租户
      tenantAggregate.activate();
      expect(tenantAggregate.uncommittedEvents).toHaveLength(2);

      // 3. 创建管理员用户
      const adminUserAggregate = UserAggregate.create(
        adminUserId,
        'admin@tenant001.com',
        'admin',
        'password123',
        userProfile
      );

      // 4. 分配管理员到租户
      adminUserAggregate.assignToTenant(tenantId, UserRole.TENANT_ADMIN);

      // 验证租户上下文
      expect(adminUserAggregate.getCurrentTenantId()).toBe(tenantId.toString());

      // 5. 创建普通用户
      const regularUserAggregate = UserAggregate.create(
        regularUserId,
        'user@tenant001.com',
        'user',
        'password123',
        userProfile
      );

      // 6. 分配普通用户到租户
      regularUserAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);

      // 验证两个用户都属于同一个租户
      expect(adminUserAggregate.getCurrentTenantId()).toBe(tenantId.toString());
      expect(regularUserAggregate.getCurrentTenantId()).toBe(tenantId.toString());
    });

    it('应该正确处理跨租户访问控制', () => {
      // 创建两个不同的租户
      const tenant1Id = EntityId.generate();
      const tenant2Id = EntityId.generate();

      // 创建租户1
      const tenant1Aggregate = TenantAggregate.create(
        tenant1Id,
        'TENANT001',
        '租户1',
        'BASIC' as any,
        adminUserId.toString()
      );
      tenant1Aggregate.activate();

      // 创建租户2
      const tenant2Aggregate = TenantAggregate.create(
        tenant2Id,
        'TENANT002',
        '租户2',
        'BASIC' as any,
        adminUserId.toString()
      );
      tenant2Aggregate.activate();

      // 创建用户并分配到租户1
      const userAggregate = UserAggregate.create(
        regularUserId,
        'user@tenant001.com',
        'user',
        'password123',
        userProfile
      );
      userAggregate.assignToTenant(tenant1Id, UserRole.REGULAR_USER);

      // 验证用户只能访问租户1的数据
      expect(userAggregate.getCurrentTenantId()).toBe(tenant1Id.toString());

      // 尝试访问租户2的数据应该失败
      const isolationService = new IsolationService();
      const hasAccess = isolationService.validateDataAccess({
        userId: regularUserId,
        userTenantIds: [tenant1Id],
        userOrganizationIds: [],
        userDepartmentIds: [],
        userRole: UserRole.REGULAR_USER.toString(),
        targetTenantId: tenant2Id
      });

      expect(hasAccess).toBe(false);
    });
  });

  describe('事件隔离端到端测试', () => {
    it('应该确保所有事件都包含正确的租户信息', () => {
      // 创建租户和用户
      const tenantAggregate = TenantAggregate.create(
        tenantId,
        'TENANT001',
        '测试租户',
        'BASIC' as any,
        adminUserId.toString()
      );
      tenantAggregate.activate();

      const userAggregate = UserAggregate.create(
        regularUserId,
        'user@tenant001.com',
        'user',
        'password123',
        userProfile
      );
      userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);

      // 执行一系列操作
      userAggregate.activate();
      userAggregate.addRole(UserRole.DEPARTMENT_ADMIN);
      userAggregate.updateProfile(userProfile);

      // 验证所有事件都包含租户信息
      const events = userAggregate.uncommittedEvents;
      events.forEach(event => {
        expect(event.tenantId).toBe(tenantId.toString());
        expect(event.tenantId).toBeDefined();
        expect(event.tenantId).not.toBe('');
      });
    });

    it('应该正确处理租户事件中的租户信息', () => {
      // 创建租户
      const tenantAggregate = TenantAggregate.create(
        tenantId,
        'TENANT001',
        '测试租户',
        'BASIC' as any,
        adminUserId.toString()
      );

      // 执行一系列租户操作
      tenantAggregate.activate();
      tenantAggregate.updateName('新的租户名称');
      tenantAggregate.updateAdmin(regularUserId.toString());

      // 验证所有租户事件都包含正确的租户信息
      const events = tenantAggregate.uncommittedEvents;
      events.forEach(event => {
        expect(event.tenantId).toBe(tenantId.toString());
        expect(event.tenantId).toBeDefined();
        expect(event.tenantId).not.toBe('');
      });
    });
  });

  describe('异常处理端到端测试', () => {
    it('应该正确处理用户未分配租户的情况', () => {
      // 创建未分配租户的用户
      const userAggregate = UserAggregate.create(
        regularUserId,
        'user@example.com',
        'user',
        'password123',
        userProfile
      );

      // 尝试执行需要租户上下文的操作
      expect(() => {
        userAggregate.activate();
      }).toThrow(TenantContextException);

      expect(() => {
        userAggregate.getCurrentTenantId();
      }).toThrow(TenantContextException);
    });

    it('应该提供详细的异常信息用于调试', () => {
      const userAggregate = UserAggregate.create(
        regularUserId,
        'user@example.com',
        'user',
        'password123',
        userProfile
      );

      try {
        userAggregate.getCurrentTenantId();
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(TenantContextException);
        expect((error as TenantContextException).message).toContain('用户未分配到任何租户');
        expect((error as TenantContextException).context?.userId).toBe(regularUserId.toString());
        expect((error as TenantContextException).context?.operation).toBe('getTenantContext');
        expect((error as TenantContextException).context?.reason).toBe('user_not_assigned_to_tenant');
      }
    });
  });

  describe('数据隔离服务集成测试', () => {
    let isolationService: IsolationService;

    beforeEach(() => {
      isolationService = new IsolationService();
    });

    it('应该正确验证数据访问权限', () => {
      const userTenantIds = [tenantId, EntityId.generate()];
      const targetTenantId = tenantId;

      const hasAccess = isolationService.validateDataAccess({
        userId: regularUserId,
        userTenantIds,
        userOrganizationIds: [],
        userDepartmentIds: [],
        userRole: UserRole.REGULAR_USER.toString(),
        targetTenantId
      });

      expect(hasAccess).toBe(true);
    });

    it('应该正确验证查询条件', () => {
      const queryConditions = {
        tenantId: tenantId.toString(),
        organizationId: organizationId.toString()
      };

      const isValid = isolationService.validateQueryConditions(
        queryConditions,
        DataIsolationStrategy.ROW_LEVEL_SECURITY
      );

      expect(isValid).toBe(true);
    });

    it('应该在缺少租户ID时验证失败', () => {
      const queryConditions = {
        organizationId: organizationId.toString()
        // 缺少 tenantId
      };

      const isValid = isolationService.validateQueryConditions(
        queryConditions,
        DataIsolationStrategy.ROW_LEVEL_SECURITY
      );

      expect(isValid).toBe(false);
    });
  });

  describe('组织隔离端到端测试', () => {
    it('应该正确支持组织级别的数据隔离', () => {
      // 创建租户
      const tenantAggregate = TenantAggregate.create(
        tenantId,
        'TENANT001',
        '测试租户',
        'BASIC' as any,
        adminUserId.toString()
      );
      tenantAggregate.activate();

      // 创建组织
      const organizationAggregate = OrganizationAggregate.create(
        organizationId,
        tenantId,
        '测试组织',
        'DEPARTMENT' as any,
        '这是一个测试组织'
      );

      // 验证组织属于正确的租户
      expect(organizationAggregate.getTenantId()).toEqual(tenantId);

      // 验证组织事件包含租户信息
      const events = organizationAggregate.uncommittedEvents;
      events.forEach(event => {
        expect(event.tenantId).toBe(tenantId.toString());
      });
    });
  });

  describe('性能和并发测试', () => {
    it('应该支持并发租户操作', async () => {
      const promises = [];
      
      // 创建多个租户并发操作
      for (let i = 0; i < 5; i++) {
        const tenantId = EntityId.generate();
        const promise = (async () => {
          const tenantAggregate = TenantAggregate.create(
            tenantId,
            `TENANT${i.toString().padStart(3, '0')}`,
            `测试租户${i}`,
            'BASIC' as any,
            adminUserId.toString()
          );
          tenantAggregate.activate();
          return tenantAggregate;
        })();
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      
      // 验证所有租户都正确创建
      expect(results).toHaveLength(5);
      results.forEach((tenantAggregate, index) => {
        expect(tenantAggregate.getTenantId()).toBeDefined();
        expect(tenantAggregate.uncommittedEvents).toHaveLength(2);
      });
    });

    it('应该支持并发用户操作', async () => {
      // 先创建租户
      const tenantAggregate = TenantAggregate.create(
        tenantId,
        'TENANT001',
        '测试租户',
        'BASIC' as any,
        adminUserId.toString()
      );
      tenantAggregate.activate();

      const promises = [];
      
      // 创建多个用户并发操作
      for (let i = 0; i < 10; i++) {
        const userId = EntityId.generate();
        const promise = (async () => {
          const userAggregate = UserAggregate.create(
            userId,
            `user${i}@tenant001.com`,
            `user${i}`,
            'password123',
            userProfile
          );
          userAggregate.assignToTenant(tenantId, UserRole.REGULAR_USER);
          userAggregate.activate();
          return userAggregate;
        })();
        promises.push(promise);
      }

      const results = await Promise.all(promises);
      
      // 验证所有用户都正确创建和分配
      expect(results).toHaveLength(10);
      results.forEach((userAggregate, index) => {
        expect(userAggregate.getCurrentTenantId()).toBe(tenantId.toString());
        expect(userAggregate.uncommittedEvents.length).toBeGreaterThan(0);
      });
    });
  });
});
