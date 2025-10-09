/**
 * 租户实体单元测试
 *
 * @description 测试租户实体的业务逻辑和状态管理
 */

import { EntityId } from '@hl8/hybrid-archi';
import { TenantStatus } from '@hl8/hybrid-archi';
import { Tenant } from './tenant.entity';
import { TenantCode } from '../value-objects/tenant-code.vo';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { TenantType } from '../value-objects/tenant-type.enum';

describe('Tenant Entity', () => {
  let tenantId: EntityId;
  let tenantCode: TenantCode;
  let tenantDomain: TenantDomain;

  beforeEach(() => {
    tenantId = EntityId.generate();
    tenantCode = TenantCode.create('testcorp2024');
    tenantDomain = TenantDomain.create('testcorp.example.com');
  });

  describe('create', () => {
    it('应该创建新的试用租户', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corporation',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      expect(tenant.getId()).toEqual(tenantId);
      expect(tenant.getCode()).toEqual(tenantCode);
      expect(tenant.getName()).toBe('Test Corporation');
      expect(tenant.getType()).toBe(TenantType.FREE);
      expect(tenant.getStatus()).toBe(TenantStatus.TRIAL);
      expect(tenant.isTrial()).toBe(true);
      expect(tenant.getTrialEndsAt()).not.toBeNull();
    });

    it('应该设置30天的试用期', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corporation',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      const trialEndsAt = tenant.getTrialEndsAt();
      expect(trialEndsAt).not.toBeNull();

      const now = new Date();
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 30);

      // 允许1天的误差
      const diff = Math.abs(trialEndsAt!.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(24 * 60 * 60 * 1000);
    });
  });

  describe('updateName', () => {
    it('应该成功更新租户名称', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Old Name',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      tenant.updateName('New Name', 'admin-123');

      expect(tenant.getName()).toBe('New Name');
    });

    it('应该在名称为空时抛出错误', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      expect(() => tenant.updateName('', 'admin-123')).toThrow('租户名称不能为空');
    });

    it('应该在名称超过100字符时抛出错误', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      const longName = 'a'.repeat(101);
      expect(() => tenant.updateName(longName, 'admin-123')).toThrow(
        '租户名称不能超过100字符',
      );
    });
  });

  describe('activate', () => {
    it('应该成功激活试用租户', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      tenant.activate('admin-123');

      expect(tenant.getStatus()).toBe(TenantStatus.ACTIVE);
      expect(tenant.isActive()).toBe(true);
      expect(tenant.getActivatedAt()).not.toBeNull();
      expect(tenant.getTrialEndsAt()).toBeNull();
    });

    it('应该在不允许的状态转换时抛出错误', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      // 先激活
      tenant.activate('admin-123');

      // 尝试再次激活应该失败
      expect(() => tenant.activate('admin-123')).toThrow();
    });
  });

  describe('suspend', () => {
    it('应该成功暂停活跃租户', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      tenant.activate('admin-123');
      tenant.suspend('Payment overdue', 'admin-123');

      expect(tenant.getStatus()).toBe(TenantStatus.SUSPENDED);
      expect(tenant.isSuspended()).toBe(true);
    });
  });

  describe('resume', () => {
    it('应该成功恢复暂停的租户', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      tenant.activate('admin-123');
      tenant.suspend('Test', 'admin-123');
      tenant.resume('admin-123');

      expect(tenant.getStatus()).toBe(TenantStatus.ACTIVE);
      expect(tenant.isActive()).toBe(true);
    });

    it('应该在非暂停状态时抛出错误', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      expect(() => tenant.resume('admin-123')).toThrow('只有暂停状态的租户可以恢复');
    });
  });

  describe('updateType', () => {
    it('应该成功更新租户类型', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      tenant.updateType(TenantType.BASIC, 'admin-123');

      expect(tenant.getType()).toBe(TenantType.BASIC);
    });
  });

  describe('trial management', () => {
    it('应该正确计算试用剩余天数', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      const daysRemaining = tenant.getTrialDaysRemaining();
      expect(daysRemaining).not.toBeNull();
      expect(daysRemaining).toBeGreaterThan(0);
      expect(daysRemaining).toBeLessThanOrEqual(30);
    });

    it('应该检测试用即将到期', () => {
      // 注意：这个测试比较难模拟，因为 trialEndsAt 是在创建时设置的
      // 在实际测试中，可能需要使用依赖注入或时间mock
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      // 当前创建的租户试用期是30天，不会即将到期
      expect(tenant.isTrialExpiringSoon()).toBe(false);
    });
  });

  describe('toObject', () => {
    it('应该正确序列化为对象', () => {
      const tenant = Tenant.create(
        tenantId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      const obj = tenant.toObject();

      expect(obj).toHaveProperty('id');
      expect(obj).toHaveProperty('code', 'testcorp2024');
      expect(obj).toHaveProperty('name', 'Test Corp');
      expect(obj).toHaveProperty('type', TenantType.FREE);
      expect(obj).toHaveProperty('status', TenantStatus.TRIAL);
    });
  });
});

