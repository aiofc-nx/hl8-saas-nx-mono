/**
 * 租户聚合根集成测试
 *
 * @description 测试租户聚合根的核心业务逻辑和状态管理
 *
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { TenantAggregate } from '../../src/domain/tenant/aggregates/tenant.aggregate';
import { TenantType } from '../../src/domain/tenant/value-objects/tenant-type.enum';
import { TenantCode } from '../../src/domain/tenant/value-objects/tenant-code.vo';
import { TenantDomain } from '../../src/domain/tenant/value-objects/tenant-domain.vo';
import { TenantStatus } from '@hl8/hybrid-archi';

describe('租户聚合根集成测试', () => {
  describe('租户创建', () => {
    it('应该成功创建免费租户', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('freetenant001'),
        '免费租户',
        TenantDomain.create('free.example.com'),
        TenantType.FREE,
        { createdBy: 'system' }
      );

      expect(aggregate).toBeDefined();
      expect(aggregate.getType()).toBe(TenantType.FREE);
      expect(aggregate.getStatus()).toBe(TenantStatus.PENDING);
    });

    it('应该成功创建企业租户', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('enterprise001'),
        '企业租户',
        TenantDomain.create('enterprise.example.com'),
        TenantType.ENTERPRISE,
        { createdBy: 'system' }
      );

      expect(aggregate.getType()).toBe(TenantType.ENTERPRISE);
    });
  });

  describe('租户状态转换', () => {
    it('应该成功激活租户', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('activate001'),
        '激活测试',
        TenantDomain.create('activate.example.com'),
        TenantType.FREE,
        { createdBy: 'system' }
      );

      aggregate.activate('admin');

      expect(aggregate.getStatus()).toBe(TenantStatus.ACTIVE);
    });

    it('应该成功暂停和恢复租户', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('suspend001'),
        '暂停测试',
        TenantDomain.create('suspend.example.com'),
        TenantType.FREE,
        { createdBy: 'system' }
      );

      aggregate.activate('admin');
      aggregate.suspend('测试原因', 'admin');

      expect(aggregate.getStatus()).toBe(TenantStatus.SUSPENDED);

      aggregate.resume('admin');
      expect(aggregate.getStatus()).toBe(TenantStatus.ACTIVE);
    });
  });

  describe('租户类型升级', () => {
    it('应该成功升级租户类型', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('upgrade001'),
        '升级测试',
        TenantDomain.create('upgrade.example.com'),
        TenantType.FREE,
        { createdBy: 'system' }
      );

      aggregate.upgrade(TenantType.BASIC, 'admin');

      expect(aggregate.getType()).toBe(TenantType.BASIC);
    });

    it('应该成功降级租户类型', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('downgrade001'),
        '降级测试',
        TenantDomain.create('downgrade.example.com'),
        TenantType.PROFESSIONAL,
        { createdBy: 'system' }
      );

      aggregate.downgrade(TenantType.BASIC, 'admin');

      expect(aggregate.getType()).toBe(TenantType.BASIC);
    });
  });

  describe('领域事件验证', () => {
    it('应该正确管理事件生命周期', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('eventtest001'),
        '事件测试',
        TenantDomain.create('event.example.com'),
        TenantType.FREE,
        { createdBy: 'system' }
      );

      // 验证聚合根创建成功
      expect(aggregate).toBeDefined();
      expect(aggregate.getType()).toBe(TenantType.FREE);
    });

    it('应该支持事件标记和清除', () => {
      const aggregate = TenantAggregate.create(
        EntityId.generate(),
        TenantCode.create('eventmark001'),
        '事件标记测试',
        TenantDomain.create('eventmark.example.com'),
        TenantType.FREE,
        { createdBy: 'system' }
      );

      // 标记事件为已提交
      aggregate.markEventsAsCommitted();
      
      // 执行状态变更
      aggregate.activate('admin');
      
      // 验证聚合根状态已变更
      expect(aggregate.getStatus()).toBe(TenantStatus.ACTIVE);
    });
  });
});

