/**
 * 租户聚合根单元测试
 * 
 * @description 测试租户聚合根的业务逻辑和聚合根管理职责
 * 包括聚合一致性边界管理、实体操作协调、领域事件发布、业务规则验证
 * 
 * @since 1.0.0
 */

import { EntityId, TenantType, TenantStatus } from '@hl8/hybrid-archi';
import { TenantAggregate } from './tenant.aggregate';
import { Tenant } from '../entities/tenant.entity';
import { TenantConfig } from '../value-objects/tenant-config.vo';
import { ResourceLimits } from '../value-objects/resource-limits.vo';
import { 
  TenantCreatedEvent,
  TenantActivatedEvent,
  TenantSuspendedEvent,
  TenantDisabledEvent,
  TenantUpgradedEvent,
  TenantNameUpdatedEvent,
  TenantAdminUpdatedEvent,
  TenantConfigUpdatedEvent,
  TenantResourceLimitsUpdatedEvent
} from '../../events/tenant-events';

describe('TenantAggregate', () => {
  let tenantAggregate: TenantAggregate;
  let tenantId: EntityId;
  let tenant: Tenant;
  let config: TenantConfig;
  let resourceLimits: ResourceLimits;

  beforeEach(() => {
    tenantId = EntityId.generate();
    config = TenantConfig.create({
      features: ['user_management', 'organization'],
      theme: 'default',
      branding: {
        brandName: '测试租户',
        brandDescription: '测试租户描述'
      },
      settings: {},
      locale: 'zh-CN',
      timezone: 'Asia/Shanghai'
    });
    resourceLimits = ResourceLimits.create({
      maxUsers: 100,
      maxStorage: 1024,
      maxOrganizations: 5,
      maxDepartments: 20,
      maxApiCalls: 10000,
      maxDataTransfer: 100
    });

    tenant = new Tenant(
      tenantId,
      'test-tenant',
      'Test Tenant',
      TenantType.BASIC,
      TenantStatus.PENDING,
      'admin-id',
      config,
      resourceLimits
    );

    tenantAggregate = new TenantAggregate(tenantId, tenant);
  });

  describe('create', () => {
    it('should create tenant aggregate with default config and resource limits', () => {
      // Arrange
      const newTenantId = EntityId.generate();
      const code = 'NEW-TENANT';
      const name = 'New Tenant';
      const type = TenantType.BASIC;
      const adminId = 'admin-user-id';

      // Act
      const newTenantAggregate = TenantAggregate.create(
        newTenantId,
        code,
        name,
        type,
        adminId
      );

      // Assert
      expect(newTenantAggregate).toBeInstanceOf(TenantAggregate);
      expect(newTenantAggregate.getTenantId()).toEqual(newTenantId);
      
      const createdTenant = newTenantAggregate.getTenant();
      expect(createdTenant.code).toBe(code);
      expect(createdTenant.name).toBe(name);
      expect(createdTenant.type).toBe(type);
      expect(createdTenant.status).toBe(TenantStatus.PENDING);
      expect(createdTenant.adminId).toBe(adminId);
      
      // 验证默认配置
      expect(createdTenant.config).toBeDefined();
      expect(createdTenant.config.features).toContain('user_management');
      
      // 验证默认资源限制
      expect(createdTenant.resourceLimits).toBeDefined();
      expect(createdTenant.resourceLimits.maxUsers).toBe(50); // BASIC类型的默认值
    });

    it('should publish TenantCreatedEvent when creating tenant', () => {
      // Arrange
      const newTenantId = EntityId.generate();
      const code = 'EVENT-TENANT';
      const name = 'Event Tenant';
      const type = TenantType.PROFESSIONAL;
      const adminId = 'event-admin-id';

      // Act
      const newTenantAggregate = TenantAggregate.create(
        newTenantId,
        code,
        name,
        type,
        adminId
      );

      // Assert
      const domainEvents = newTenantAggregate.getUncommittedEvents();
      expect(domainEvents).toHaveLength(1);
      
      const createdEvent = domainEvents[0] as TenantCreatedEvent;
      expect(createdEvent).toBeInstanceOf(TenantCreatedEvent);
      expect(createdEvent.tenantEntityId).toEqual(newTenantId);
      expect(createdEvent.code).toBe(code);
      expect(createdEvent.name).toBe(name);
      expect(createdEvent.type).toBe(type);
      expect(createdEvent.adminId).toBe(adminId);
      expect(createdEvent.eventType).toBe('TenantCreated');
    });

    it('should create different default configs for different tenant types', () => {
      // Arrange
      const basicTenantId = EntityId.generate();
      const enterpriseTenantId = EntityId.generate();

      // Act
      const basicTenantAggregate = TenantAggregate.create(
        basicTenantId,
        'BASIC-TENANT',
        'Basic Tenant',
        TenantType.BASIC,
        'admin-id'
      );

      const enterpriseTenantAggregate = TenantAggregate.create(
        enterpriseTenantId,
        'ENTERPRISE-TENANT',
        'Enterprise Tenant',
        TenantType.ENTERPRISE,
        'admin-id'
      );

      // Assert
      const basicTenant = basicTenantAggregate.getTenant();
      const enterpriseTenant = enterpriseTenantAggregate.getTenant();

      // BASIC类型有资源限制
      expect(basicTenant.resourceLimits.maxUsers).toBe(50);
      expect(basicTenant.resourceLimits.maxStorage).toBe(10);
      
      // ENTERPRISE类型无限制
      expect(enterpriseTenant.resourceLimits.maxUsers).toBe(-1);
      expect(enterpriseTenant.resourceLimits.maxStorage).toBe(-1);
    });
  });

  describe('activate', () => {
    it('should activate tenant and publish TenantActivatedEvent', () => {
      // Arrange
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.PENDING);

      // Act
      tenantAggregate.activate();

      // Assert
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.ACTIVE);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const activatedEvent = domainEvents.find(event => event.eventType === 'TenantActivated') as TenantActivatedEvent;
      expect(activatedEvent).toBeDefined();
      expect(activatedEvent).toBeInstanceOf(TenantActivatedEvent);
      expect(activatedEvent.tenantEntityId).toEqual(tenantId);
      expect(activatedEvent.eventType).toBe('TenantActivated');
    });

    it('should coordinate tenant entity activation through command pattern', () => {
      // Arrange
      const tenantSpy = jest.spyOn(tenant, 'activate');
      expect(tenantSpy).not.toHaveBeenCalled();

      // Act
      tenantAggregate.activate();

      // Assert
      expect(tenantSpy).toHaveBeenCalledTimes(1);
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.ACTIVE);
    });
  });

  describe('suspend', () => {
    beforeEach(() => {
      // 先激活租户
      tenantAggregate.activate();
      tenantAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should suspend tenant and publish TenantSuspendedEvent', () => {
      // Arrange
      const reason = '违反服务条款';
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.ACTIVE);

      // Act
      tenantAggregate.suspend(reason);

      // Assert
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.SUSPENDED);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const suspendedEvent = domainEvents.find(event => event.eventType === 'TenantSuspended') as TenantSuspendedEvent;
      expect(suspendedEvent).toBeDefined();
      expect(suspendedEvent).toBeInstanceOf(TenantSuspendedEvent);
      expect(suspendedEvent.tenantEntityId).toEqual(tenantId);
      expect(suspendedEvent.reason).toBe(reason);
      expect(suspendedEvent.eventType).toBe('TenantSuspended');
    });

    it('should coordinate tenant entity suspension through command pattern', () => {
      // Arrange
      const reason = '维护中';
      const tenantSpy = jest.spyOn(tenant, 'suspend');

      // Act
      tenantAggregate.suspend(reason);

      // Assert
      expect(tenantSpy).toHaveBeenCalledWith(reason);
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.SUSPENDED);
    });
  });

  describe('disable', () => {
    beforeEach(() => {
      // 先激活租户
      tenantAggregate.activate();
      tenantAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should disable tenant and publish TenantDisabledEvent', () => {
      // Arrange
      const reason = '账户违规';
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.ACTIVE);

      // Act
      tenantAggregate.disable(reason);

      // Assert
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.DISABLED);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const disabledEvent = domainEvents.find(event => event.eventType === 'TenantDisabled') as TenantDisabledEvent;
      expect(disabledEvent).toBeDefined();
      expect(disabledEvent).toBeInstanceOf(TenantDisabledEvent);
      expect(disabledEvent.tenantEntityId).toEqual(tenantId);
      expect(disabledEvent.reason).toBe(reason);
      expect(disabledEvent.eventType).toBe('TenantDisabled');
    });

    it('should coordinate tenant entity disable through command pattern', () => {
      // Arrange
      const reason = '安全原因';
      const tenantSpy = jest.spyOn(tenant, 'disable');

      // Act
      tenantAggregate.disable(reason);

      // Assert
      expect(tenantSpy).toHaveBeenCalledWith(reason);
      expect(tenantAggregate.getTenant().status).toBe(TenantStatus.DISABLED);
    });
  });

  describe('upgrade', () => {
    beforeEach(() => {
      // 先激活租户
      tenantAggregate.activate();
      tenantAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should upgrade tenant and publish TenantUpgradedEvent', () => {
      // Arrange
      const newType = TenantType.PROFESSIONAL;
      expect(tenantAggregate.getTenant().type).toBe(TenantType.BASIC);

      // Act
      tenantAggregate.upgrade(newType);

      // Assert
      expect(tenantAggregate.getTenant().type).toBe(TenantType.PROFESSIONAL);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const upgradedEvent = domainEvents.find(event => event.eventType === 'TenantUpgraded') as TenantUpgradedEvent;
      expect(upgradedEvent).toBeDefined();
      expect(upgradedEvent).toBeInstanceOf(TenantUpgradedEvent);
      expect(upgradedEvent.tenantEntityId).toEqual(tenantId);
      expect(upgradedEvent.fromType).toBe(TenantType.BASIC);
      expect(upgradedEvent.toType).toBe(TenantType.PROFESSIONAL);
      expect(upgradedEvent.eventType).toBe('TenantUpgraded');
    });

    it('should update config and resource limits when upgrading', () => {
      // Arrange
      const newType = TenantType.ENTERPRISE;
      const originalConfig = tenantAggregate.getTenant().config;
      const originalResourceLimits = tenantAggregate.getTenant().resourceLimits;

      // Act
      tenantAggregate.upgrade(newType);

      // Assert
      const upgradedTenant = tenantAggregate.getTenant();
      expect(upgradedTenant.type).toBe(TenantType.ENTERPRISE);
      
      // 配置应该被更新
      expect(upgradedTenant.config).not.toEqual(originalConfig);
      expect(upgradedTenant.resourceLimits).not.toEqual(originalResourceLimits);
      
      // ENTERPRISE类型应该有更高的资源限制
      expect(upgradedTenant.resourceLimits.maxUsers).toBe(-1); // 无限制
      expect(upgradedTenant.resourceLimits.maxStorage).toBe(-1); // 无限制
    });

    it('should coordinate tenant entity upgrade through command pattern', () => {
      // Arrange
      const newType = TenantType.PROFESSIONAL;
      const tenantSpy = jest.spyOn(tenant, 'upgrade');

      // Act
      tenantAggregate.upgrade(newType);

      // Assert
      expect(tenantSpy).toHaveBeenCalledWith(
        newType,
        expect.any(TenantConfig),
        expect.any(ResourceLimits)
      );
    });
  });

  describe('updateName', () => {
    it('should update tenant name and publish TenantNameUpdatedEvent', () => {
      // Arrange
      const newName = 'Updated Tenant Name';
      expect(tenantAggregate.getTenant().name).toBe('Test Tenant');

      // Act
      tenantAggregate.updateName(newName);

      // Assert
      expect(tenantAggregate.getTenant().name).toBe(newName);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const nameUpdatedEvent = domainEvents.find(event => event.eventType === 'TenantNameUpdated') as TenantNameUpdatedEvent;
      expect(nameUpdatedEvent).toBeDefined();
      expect(nameUpdatedEvent).toBeInstanceOf(TenantNameUpdatedEvent);
      expect(nameUpdatedEvent.tenantEntityId).toEqual(tenantId);
      expect(nameUpdatedEvent.newName).toBe(newName);
      expect(nameUpdatedEvent.eventType).toBe('TenantNameUpdated');
    });

    it('should coordinate tenant entity name update through command pattern', () => {
      // Arrange
      const newName = 'Command Pattern Test';
      const tenantSpy = jest.spyOn(tenant, 'updateName');

      // Act
      tenantAggregate.updateName(newName);

      // Assert
      expect(tenantSpy).toHaveBeenCalledWith(newName);
    });
  });

  describe('updateAdmin', () => {
    it('should update tenant admin and publish TenantAdminUpdatedEvent', () => {
      // Arrange
      const newAdminId = 'new-admin-user-id';
      expect(tenantAggregate.getTenant().adminId).toBe('admin-id');

      // Act
      tenantAggregate.updateAdmin(newAdminId);

      // Assert
      expect(tenantAggregate.getTenant().adminId).toBe(newAdminId);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const adminUpdatedEvent = domainEvents.find(event => event.eventType === 'TenantAdminUpdated') as TenantAdminUpdatedEvent;
      expect(adminUpdatedEvent).toBeDefined();
      expect(adminUpdatedEvent).toBeInstanceOf(TenantAdminUpdatedEvent);
      expect(adminUpdatedEvent.tenantEntityId).toEqual(tenantId);
      expect(adminUpdatedEvent.newAdminId).toBe(newAdminId);
      expect(adminUpdatedEvent.eventType).toBe('TenantAdminUpdated');
    });

    it('should coordinate tenant entity admin update through command pattern', () => {
      // Arrange
      const newAdminId = 'command-admin-id';
      const tenantSpy = jest.spyOn(tenant, 'updateAdmin');

      // Act
      tenantAggregate.updateAdmin(newAdminId);

      // Assert
      expect(tenantSpy).toHaveBeenCalledWith(newAdminId);
    });
  });

  describe('updateConfig', () => {
    it('should update tenant config and publish TenantConfigUpdatedEvent', () => {
      // Arrange
      const newConfig = TenantConfig.create({
        features: ['user_management', 'organization', 'department'],
        theme: 'dark',
        branding: {
          brandName: '新品牌',
          brandDescription: '新品牌描述'
        },
        settings: { newSetting: 'value' },
        locale: 'en-US',
        timezone: 'America/New_York'
      });

      // Act
      tenantAggregate.updateConfig(newConfig);

      // Assert
      expect(tenantAggregate.getTenant().config).toEqual(newConfig);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const configUpdatedEvent = domainEvents.find(event => event.eventType === 'TenantConfigUpdated') as TenantConfigUpdatedEvent;
      expect(configUpdatedEvent).toBeDefined();
      expect(configUpdatedEvent).toBeInstanceOf(TenantConfigUpdatedEvent);
      expect(configUpdatedEvent.tenantEntityId).toEqual(tenantId);
      expect(configUpdatedEvent.newConfig).toEqual(newConfig);
      expect(configUpdatedEvent.eventType).toBe('TenantConfigUpdated');
    });

    it('should coordinate tenant entity config update through command pattern', () => {
      // Arrange
      const newConfig = TenantConfig.create({
        features: ['user_management'],
        theme: 'light',
        branding: { brandName: 'Test Brand' },
        settings: {},
        locale: 'zh-CN',
        timezone: 'Asia/Shanghai'
      });
      const tenantSpy = jest.spyOn(tenant, 'updateConfig');

      // Act
      tenantAggregate.updateConfig(newConfig);

      // Assert
      expect(tenantSpy).toHaveBeenCalledWith(newConfig);
    });
  });

  describe('updateResourceLimits', () => {
    it('should update tenant resource limits and publish TenantResourceLimitsUpdatedEvent', () => {
      // Arrange
      const newResourceLimits = ResourceLimits.create({
        maxUsers: 200,
        maxStorage: 2048,
        maxOrganizations: 10,
        maxDepartments: 50,
        maxApiCalls: 20000,
        maxDataTransfer: 200
      });

      // Act
      tenantAggregate.updateResourceLimits(newResourceLimits);

      // Assert
      expect(tenantAggregate.getTenant().resourceLimits).toEqual(newResourceLimits);
      
      const domainEvents = tenantAggregate.getUncommittedEvents();
      const resourceLimitsUpdatedEvent = domainEvents.find(event => event.eventType === 'TenantResourceLimitsUpdated') as TenantResourceLimitsUpdatedEvent;
      expect(resourceLimitsUpdatedEvent).toBeDefined();
      expect(resourceLimitsUpdatedEvent).toBeInstanceOf(TenantResourceLimitsUpdatedEvent);
      expect(resourceLimitsUpdatedEvent.tenantEntityId).toEqual(tenantId);
      expect(resourceLimitsUpdatedEvent.newResourceLimits).toEqual(newResourceLimits);
      expect(resourceLimitsUpdatedEvent.eventType).toBe('TenantResourceLimitsUpdated');
    });

    it('should coordinate tenant entity resource limits update through command pattern', () => {
      // Arrange
      const newResourceLimits = ResourceLimits.create({
        maxUsers: 150,
        maxStorage: 1500,
        maxOrganizations: 8,
        maxDepartments: 30,
        maxApiCalls: 15000,
        maxDataTransfer: 150
      });
      const tenantSpy = jest.spyOn(tenant, 'updateResourceLimits');

      // Act
      tenantAggregate.updateResourceLimits(newResourceLimits);

      // Assert
      expect(tenantSpy).toHaveBeenCalledWith(newResourceLimits);
    });
  });

  describe('getTenant', () => {
    it('should return the tenant entity', () => {
      // Act
      const returnedTenant = tenantAggregate.getTenant();

      // Assert
      expect(returnedTenant).toBe(tenant);
      expect(returnedTenant).toBeInstanceOf(Tenant);
      expect(returnedTenant.code).toBe('test-tenant');
      expect(returnedTenant.name).toBe('Test Tenant');
    });

    it('should provide controlled access to tenant entity', () => {
      // Arrange & Act
      const tenantEntity = tenantAggregate.getTenant();

      // Assert - 外部只能通过聚合根访问内部实体
      expect(tenantEntity).toBeDefined();
      expect(tenantEntity).toBeInstanceOf(Tenant);
      
      // 验证聚合根管理内部实体访问
      expect(tenantEntity.getId()).toEqual(tenantId);
    });
  });

  describe('aggregate root responsibilities', () => {
    it('should manage aggregate consistency boundary', () => {
      // Arrange
      const newTenantAggregate = TenantAggregate.create(
        EntityId.generate(),
        'CONSISTENCY-TENANT',
        'Consistency Tenant',
        TenantType.BASIC,
        'admin-id'
      );

      // Act & Assert - 聚合根确保聚合内数据一致性
      const tenant = newTenantAggregate.getTenant();
      expect(tenant.status).toBe(TenantStatus.PENDING);
      
      // 激活租户
      newTenantAggregate.activate();
      expect(newTenantAggregate.getTenant().status).toBe(TenantStatus.ACTIVE);
      
      // 升级租户
      newTenantAggregate.upgrade(TenantType.PROFESSIONAL);
      expect(newTenantAggregate.getTenant().type).toBe(TenantType.PROFESSIONAL);
      expect(newTenantAggregate.getTenant().status).toBe(TenantStatus.ACTIVE); // 状态保持一致
    });

    it('should coordinate internal entity operations through command pattern', () => {
      // Arrange
      const tenantSpy = jest.spyOn(tenant, 'activate');
      const tenantSpy2 = jest.spyOn(tenant, 'updateName');
      const tenantSpy3 = jest.spyOn(tenant, 'upgrade');

      // Act - 聚合根发出指令给实体
      tenantAggregate.activate();
      tenantAggregate.updateName('New Name');
      tenantAggregate.upgrade(TenantType.PROFESSIONAL);

      // Assert - 验证指令模式的执行
      expect(tenantSpy).toHaveBeenCalledTimes(1);
      expect(tenantSpy2).toHaveBeenCalledWith('New Name');
      expect(tenantSpy3).toHaveBeenCalledWith(
        TenantType.PROFESSIONAL,
        expect.any(TenantConfig),
        expect.any(ResourceLimits)
      );
    });

    it('should publish domain events for all operations', () => {
      // Act - 执行多个操作
      tenantAggregate.activate();
      tenantAggregate.updateName('Event Test Tenant');
      tenantAggregate.updateAdmin('new-admin-id');

      // Assert - 验证所有操作都发布了相应的事件
      const domainEvents = tenantAggregate.getUncommittedEvents();
      
      const activatedEvent = domainEvents.find(event => event.eventType === 'TenantActivated');
      const nameUpdatedEvent = domainEvents.find(event => event.eventType === 'TenantNameUpdated');
      const adminUpdatedEvent = domainEvents.find(event => event.eventType === 'TenantAdminUpdated');

      expect(activatedEvent).toBeDefined();
      expect(nameUpdatedEvent).toBeDefined();
      expect(adminUpdatedEvent).toBeDefined();
      expect(domainEvents).toHaveLength(3);
    });

    it('should validate business rules through entity coordination', () => {
      // Arrange
      const invalidConfig = TenantConfig.create({
        features: ['invalid_feature'],
        theme: 'default',
        branding: { brandName: 'Test' },
        settings: {},
        locale: 'zh-CN',
        timezone: 'Asia/Shanghai'
      });

      // Act & Assert - 聚合根通过实体验证业务规则
      expect(() => tenantAggregate.updateConfig(invalidConfig)).toThrow();
      
      // 验证实体状态未被修改
      expect(tenantAggregate.getTenant().config).toEqual(config);
    });
  });

  describe('event management', () => {
    it('should track uncommitted events', () => {
      // Act - 执行多个操作
      tenantAggregate.activate();
      tenantAggregate.updateName('Event Tracking Test');

      // Assert
      const uncommittedEvents = tenantAggregate.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(2);
      expect(uncommittedEvents.every(event => event.eventType)).toBeTruthy();
    });

    it('should clear events after marking as committed', () => {
      // Arrange
      tenantAggregate.activate();
      expect(tenantAggregate.getUncommittedEvents()).toHaveLength(1);

      // Act
      tenantAggregate.markEventsAsCommitted();

      // Assert
      expect(tenantAggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should accumulate events across multiple operations', () => {
      // Act - 执行多个操作
      tenantAggregate.activate();
      tenantAggregate.updateName('Accumulated Events Test');
      tenantAggregate.updateAdmin('accumulated-admin');
      tenantAggregate.upgrade(TenantType.PROFESSIONAL);

      // Assert
      const allEvents = tenantAggregate.getUncommittedEvents();
      expect(allEvents).toHaveLength(4);
      
      const eventTypes = allEvents.map(event => event.eventType);
      expect(eventTypes).toContain('TenantActivated');
      expect(eventTypes).toContain('TenantNameUpdated');
      expect(eventTypes).toContain('TenantAdminUpdated');
      expect(eventTypes).toContain('TenantUpgraded');
    });
  });

  describe('tenant type specific behavior', () => {
    it('should create appropriate default limits for FREE tenant type', () => {
      // Act
      const freeTenantAggregate = TenantAggregate.create(
        EntityId.generate(),
        'FREE-TENANT',
        'Free Tenant',
        TenantType.FREE,
        'admin-id'
      );

      // Assert
      const freeTenant = freeTenantAggregate.getTenant();
      expect(freeTenant.resourceLimits.maxUsers).toBe(5);
      expect(freeTenant.resourceLimits.maxStorage).toBe(1);
      expect(freeTenant.resourceLimits.maxOrganizations).toBe(2);
    });

    it('should create appropriate default limits for PERSONAL tenant type', () => {
      // Act
      const personalTenantAggregate = TenantAggregate.create(
        EntityId.generate(),
        'PERSONAL-TENANT',
        'Personal Tenant',
        TenantType.PERSONAL,
        'admin-id'
      );

      // Assert
      const personalTenant = personalTenantAggregate.getTenant();
      expect(personalTenant.resourceLimits.maxUsers).toBe(1);
      expect(personalTenant.resourceLimits.maxStorage).toBe(2);
      expect(personalTenant.resourceLimits.maxOrganizations).toBe(1);
    });

    it('should create appropriate default limits for TEAM tenant type', () => {
      // Act
      const teamTenantAggregate = TenantAggregate.create(
        EntityId.generate(),
        'TEAM-TENANT',
        'Team Tenant',
        TenantType.TEAM,
        'admin-id'
      );

      // Assert
      const teamTenant = teamTenantAggregate.getTenant();
      expect(teamTenant.resourceLimits.maxUsers).toBe(20);
      expect(teamTenant.resourceLimits.maxStorage).toBe(20);
      expect(teamTenant.resourceLimits.maxOrganizations).toBe(5);
    });

    it('should create unlimited resources for ENTERPRISE tenant type', () => {
      // Act
      const enterpriseTenantAggregate = TenantAggregate.create(
        EntityId.generate(),
        'ENTERPRISE-TENANT',
        'Enterprise Tenant',
        TenantType.ENTERPRISE,
        'admin-id'
      );

      // Assert
      const enterpriseTenant = enterpriseTenantAggregate.getTenant();
      expect(enterpriseTenant.resourceLimits.maxUsers).toBe(-1);
      expect(enterpriseTenant.resourceLimits.maxStorage).toBe(-1);
      expect(enterpriseTenant.resourceLimits.maxOrganizations).toBe(-1);
      expect(enterpriseTenant.resourceLimits.maxDepartments).toBe(-1);
      expect(enterpriseTenant.resourceLimits.maxApiCalls).toBe(-1);
      expect(enterpriseTenant.resourceLimits.maxDataTransfer).toBe(-1);
    });
  });
});
