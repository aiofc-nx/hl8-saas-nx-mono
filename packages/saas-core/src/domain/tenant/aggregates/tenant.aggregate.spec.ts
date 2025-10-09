/**
 * 租户聚合根单元测试
 *
 * @description 测试租户聚合根的业务逻辑和一致性管理
 */

import { EntityId } from '@hl8/hybrid-archi';
import { TenantStatus } from '@hl8/hybrid-archi';
import { TenantAggregate } from './tenant.aggregate';
import { TenantCode } from '../value-objects/tenant-code.vo';
import { TenantDomain } from '../value-objects/tenant-domain.vo';
import { TenantQuota } from '../value-objects/tenant-quota.vo';
import { TenantType } from '../value-objects/tenant-type.enum';

describe('TenantAggregate', () => {
  let aggregateId: EntityId;
  let tenantCode: TenantCode;
  let tenantDomain: TenantDomain;

  beforeEach(() => {
    aggregateId = EntityId.generate();
    tenantCode = TenantCode.create('testcorp2024');
    tenantDomain = TenantDomain.create('testcorp.example.com');
  });

  describe('create', () => {
    it('应该创建新的租户聚合根', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corporation',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      expect(aggregate).toBeDefined();
      expect(aggregate.getId()).toEqual(aggregateId);
      expect(aggregate.getCode()).toEqual(tenantCode);
      expect(aggregate.getName()).toBe('Test Corporation');
      expect(aggregate.getType()).toBe(TenantType.FREE);
      expect(aggregate.getStatus()).toBe(TenantStatus.TRIAL);
    });

    it('应该为免费租户设置正确的默认配额', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corporation',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      const config = aggregate.getConfiguration();
      const quota = config.getQuota();

      expect(quota.maxUsers).toBe(5);
      expect(quota.maxStorageMB).toBe(100);
      expect(quota.maxOrganizations).toBe(1);
    });

    it('应该为企业租户设置正确的默认配额', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Enterprise Corp',
        tenantDomain,
        TenantType.ENTERPRISE,
        { createdBy: 'system' },
      );

      const config = aggregate.getConfiguration();
      const quota = config.getQuota();

      expect(quota.maxUsers).toBe(5000);
      expect(quota.maxStorageMB).toBe(102400);
      expect(quota.maxOrganizations).toBe(100);
    });
  });

  describe('updateName', () => {
    it('应该成功更新租户名称', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Old Name',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      aggregate.updateName('New Name', 'admin-123');

      expect(aggregate.getName()).toBe('New Name');
    });
  });

  describe('activate', () => {
    it('应该成功激活试用租户', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      aggregate.activate('admin-123');

      expect(aggregate.getStatus()).toBe(TenantStatus.ACTIVE);
      expect(aggregate.isActive()).toBe(true);
    });
  });

  describe('upgrade', () => {
    it('应该成功从免费版升级到基础版', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      aggregate.upgrade(TenantType.BASIC, 'admin-123');

      expect(aggregate.getType()).toBe(TenantType.BASIC);
      
      const quota = aggregate.getConfiguration().getQuota();
      expect(quota.maxUsers).toBe(50);
      expect(quota.maxStorageMB).toBe(1024);
    });

    it('应该支持跨级升级', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      aggregate.upgrade(TenantType.ENTERPRISE, 'admin-123');

      expect(aggregate.getType()).toBe(TenantType.ENTERPRISE);
    });

    it('应该在尝试降级时抛出错误', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.PROFESSIONAL,
        { createdBy: 'system' },
      );

      expect(() => aggregate.upgrade(TenantType.BASIC, 'admin-123')).toThrow();
    });

    it('应该在同级转换时抛出错误', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.BASIC,
        { createdBy: 'system' },
      );

      expect(() => aggregate.upgrade(TenantType.BASIC, 'admin-123')).toThrow();
    });
  });

  describe('downgrade', () => {
    it('应该成功从专业版降级到基础版', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.PROFESSIONAL,
        { createdBy: 'system' },
      );

      aggregate.downgrade(TenantType.BASIC, 'admin-123');

      expect(aggregate.getType()).toBe(TenantType.BASIC);
      
      const quota = aggregate.getConfiguration().getQuota();
      expect(quota.maxUsers).toBe(50);
    });

    it('应该在尝试升级时抛出错误', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.BASIC,
        { createdBy: 'system' },
      );

      expect(() => aggregate.downgrade(TenantType.PROFESSIONAL, 'admin-123')).toThrow();
    });
  });

  describe('suspend and resume', () => {
    it('应该成功暂停和恢复租户', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      // 先激活
      aggregate.activate('admin-123');
      expect(aggregate.isActive()).toBe(true);

      // 暂停
      aggregate.suspend('Payment overdue', 'admin-123');
      expect(aggregate.getStatus()).toBe(TenantStatus.SUSPENDED);

      // 恢复
      aggregate.resume('admin-123');
      expect(aggregate.isActive()).toBe(true);
    });
  });

  describe('configuration management', () => {
    it('应该成功启用和禁用功能', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      // 启用功能
      aggregate.enableFeature('custom_branding', 'admin-123');
      expect(aggregate.isFeatureEnabled('custom_branding')).toBe(true);

      // 禁用功能
      aggregate.disableFeature('custom_branding', 'admin-123');
      expect(aggregate.isFeatureEnabled('custom_branding')).toBe(false);
    });

    it('应该成功更新自定义配额', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Custom Corp',
        tenantDomain,
        TenantType.CUSTOM,
        { createdBy: 'system' },
      );

      const customQuota = TenantQuota.create({
        maxUsers: 10000,
        maxStorageMB: 500000,
        maxOrganizations: 500,
        maxDepartmentLevels: 12,
        maxApiCallsPerDay: 5000000,
      });

      aggregate.updateQuota(customQuota, 'admin-123');

      const quota = aggregate.getConfiguration().getQuota();
      expect(quota.maxUsers).toBe(10000);
      expect(quota.maxStorageMB).toBe(500000);
    });
  });

  describe('quota checking', () => {
    it('应该正确检查用户配额', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      // 免费版最多5个用户
      expect(aggregate.isUserQuotaReached(4)).toBe(false);
      expect(aggregate.isUserQuotaReached(5)).toBe(true);
      expect(aggregate.isUserQuotaReached(6)).toBe(true);
    });
  });

  describe('toObject', () => {
    it('应该正确序列化聚合根', () => {
      const aggregate = TenantAggregate.create(
        aggregateId,
        tenantCode,
        'Test Corp',
        tenantDomain,
        TenantType.FREE,
        { createdBy: 'system' },
      );

      const obj = aggregate.toObject();

      expect(obj).toHaveProperty('id');
      expect(obj).toHaveProperty('tenant');
      expect(obj).toHaveProperty('configuration');
      expect(obj).toHaveProperty('version');
    });
  });
});

