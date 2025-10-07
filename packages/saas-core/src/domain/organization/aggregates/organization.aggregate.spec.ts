/**
 * 组织聚合根单元测试
 * 
 * @description 测试组织聚合根的业务逻辑和聚合根管理职责
 * 包括聚合一致性边界管理、实体操作协调、领域事件发布、业务规则验证
 * 以及事件溯源（ES）和多租户支持功能
 * 
 * @since 1.0.0
 */

import { EntityId, OrganizationStatus } from '@hl8/hybrid-archi';
import { OrganizationAggregate, OrganizationSnapshot, EmptyEventStreamException, InvalidEventStreamException, CrossTenantOperationException } from './organization.aggregate';
import { Organization } from '../entities/organization.entity';
import { OrganizationType } from '../value-objects/organization-type.vo';
import { 
  OrganizationCreatedEvent,
  OrganizationNameUpdatedEvent,
  OrganizationDescriptionUpdatedEvent,
  OrganizationActivatedEvent,
  OrganizationDeactivatedEvent,
  OrganizationDeletedEvent
} from '../../events/organization-events';

describe('OrganizationAggregate', () => {
  let organizationAggregate: OrganizationAggregate;
  let organizationId: EntityId;
  let organization: Organization;
  let tenantId: EntityId;

  beforeEach(() => {
    organizationId = EntityId.generate();
    tenantId = EntityId.generate();
    
    organization = new Organization(
      organizationId,
      tenantId,
      'Test Organization',
      OrganizationType.COMMITTEE,
      OrganizationStatus.PENDING,
      'admin-id',
      'Test organization description'
    );

    organizationAggregate = new OrganizationAggregate(organizationId, organization);
  });

  describe('create', () => {
    it('should create organization aggregate with initial state', () => {
      // Arrange
      const newOrganizationId = EntityId.generate();
      const code = 'NEW_ORG';
      const name = 'New Organization';
      const description = 'New organization description';
      const type = OrganizationType.PROJECT_TEAM;
      const newTenantId = EntityId.generate();
      const adminId = 'new-admin-id';

      // Act
      const newOrganizationAggregate = OrganizationAggregate.create(
        newOrganizationId,
        code,
        name,
        description,
        type,
        newTenantId,
        adminId
      );

      // Assert
      expect(newOrganizationAggregate).toBeInstanceOf(OrganizationAggregate);
      expect(newOrganizationAggregate.getOrganizationId()).toEqual(newOrganizationId);
      
      const createdOrganization = newOrganizationAggregate.getOrganization();
      expect(createdOrganization.name).toBe(name);
      expect(createdOrganization.type).toBe(type);
      expect(createdOrganization.status).toBe(OrganizationStatus.PENDING);
      expect(createdOrganization.adminId).toBe(adminId);
      expect(createdOrganization.description).toBe(description);
      expect(createdOrganization.getTenantId()).toEqual(newTenantId);
    });

    it('should publish OrganizationCreatedEvent when creating organization', () => {
      // Arrange
      const newOrganizationId = EntityId.generate();
      const code = 'EVENT_ORG';
      const name = 'Event Organization';
      const description = 'Event organization description';
      const type = OrganizationType.QUALITY_GROUP;
      const newTenantId = EntityId.generate();
      const adminId = 'event-admin-id';

      // Act
      const newOrganizationAggregate = OrganizationAggregate.create(
        newOrganizationId,
        code,
        name,
        description,
        type,
        newTenantId,
        adminId
      );

      // Assert
      const domainEvents = newOrganizationAggregate.getUncommittedEvents();
      expect(domainEvents).toHaveLength(1);
      
      const createdEvent = domainEvents[0] as OrganizationCreatedEvent;
      expect(createdEvent).toBeInstanceOf(OrganizationCreatedEvent);
      expect(createdEvent.organizationId).toEqual(newOrganizationId);
      expect(createdEvent.code).toBe(code);
      expect(createdEvent.name).toBe(name);
      expect(createdEvent.description).toBe(description);
      expect(createdEvent.type).toBe(type);
      expect(createdEvent.tenantId).toEqual(newTenantId);
      expect(createdEvent.eventType).toBe('OrganizationCreated');
    });
  });

  describe('updateName', () => {
    it('should update organization name and publish OrganizationNameUpdatedEvent', () => {
      // Arrange
      const newName = 'Updated Organization Name';
      expect(organizationAggregate.getOrganization().name).toBe('Test Organization');

      // Act
      organizationAggregate.updateName(newName);

      // Assert
      expect(organizationAggregate.getOrganization().name).toBe(newName);
      
      const domainEvents = organizationAggregate.getUncommittedEvents();
      const nameUpdatedEvent = domainEvents.find(event => event.eventType === 'OrganizationNameUpdated') as OrganizationNameUpdatedEvent;
      expect(nameUpdatedEvent).toBeDefined();
      expect(nameUpdatedEvent).toBeInstanceOf(OrganizationNameUpdatedEvent);
      expect(nameUpdatedEvent.organizationId).toEqual(organizationId);
      expect(nameUpdatedEvent.newName).toBe(newName);
      expect(nameUpdatedEvent.tenantId).toBe(tenantId.toString());
      expect(nameUpdatedEvent.eventType).toBe('OrganizationNameUpdated');
    });

    it('should coordinate organization entity name update through command pattern', () => {
      // Arrange
      const newName = 'Command Pattern Test';
      const organizationSpy = jest.spyOn(organization, 'updateName');

      // Act
      organizationAggregate.updateName(newName);

      // Assert
      expect(organizationSpy).toHaveBeenCalledWith(newName);
    });
  });

  describe('updateDescription', () => {
    it('should update organization description and publish OrganizationDescriptionUpdatedEvent', () => {
      // Arrange
      const newDescription = 'Updated organization description';
      expect(organizationAggregate.getOrganization().description).toBe('Test organization description');

      // Act
      organizationAggregate.updateDescription(newDescription);

      // Assert
      expect(organizationAggregate.getOrganization().description).toBe(newDescription);
      
      const domainEvents = organizationAggregate.getUncommittedEvents();
      const descriptionUpdatedEvent = domainEvents.find(event => event.eventType === 'OrganizationDescriptionUpdated') as OrganizationDescriptionUpdatedEvent;
      expect(descriptionUpdatedEvent).toBeDefined();
      expect(descriptionUpdatedEvent).toBeInstanceOf(OrganizationDescriptionUpdatedEvent);
      expect(descriptionUpdatedEvent.organizationId).toEqual(organizationId);
      expect(descriptionUpdatedEvent.newDescription).toBe(newDescription);
      expect(descriptionUpdatedEvent.tenantId).toBe(tenantId.toString());
      expect(descriptionUpdatedEvent.eventType).toBe('OrganizationDescriptionUpdated');
    });

    it('should coordinate organization entity description update through command pattern', () => {
      // Arrange
      const newDescription = 'Command description test';
      const organizationSpy = jest.spyOn(organization, 'updateDescription');

      // Act
      organizationAggregate.updateDescription(newDescription);

      // Assert
      expect(organizationSpy).toHaveBeenCalledWith(newDescription);
    });
  });

  describe('activate', () => {
    it('should activate organization and publish OrganizationActivatedEvent', () => {
      // Arrange
      expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.PENDING);

      // Act
      organizationAggregate.activate();

      // Assert
      expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);
      
      const domainEvents = organizationAggregate.getUncommittedEvents();
      const activatedEvent = domainEvents.find(event => event.eventType === 'OrganizationActivated') as OrganizationActivatedEvent;
      expect(activatedEvent).toBeDefined();
      expect(activatedEvent).toBeInstanceOf(OrganizationActivatedEvent);
      expect(activatedEvent.organizationId).toEqual(organizationId);
      expect(activatedEvent.tenantId).toBe(tenantId.toString());
      expect(activatedEvent.eventType).toBe('OrganizationActivated');
    });

    it('should coordinate organization entity activation through command pattern', () => {
      // Arrange
      const organizationSpy = jest.spyOn(organization, 'activate');
      expect(organizationSpy).not.toHaveBeenCalled();

      // Act
      organizationAggregate.activate();

      // Assert
      expect(organizationSpy).toHaveBeenCalledTimes(1);
      expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);
    });
  });

  describe('disable', () => {
    beforeEach(() => {
      // 先激活组织
      organizationAggregate.activate();
      organizationAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should disable organization and publish OrganizationDeactivatedEvent', () => {
      // Arrange
      const reason = '组织重组';
      expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);

      // Act
      organizationAggregate.disable(reason);

      // Assert
      expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.DISABLED);
      
      const domainEvents = organizationAggregate.getUncommittedEvents();
      const deactivatedEvent = domainEvents.find(event => event.eventType === 'OrganizationDeactivated') as OrganizationDeactivatedEvent;
      expect(deactivatedEvent).toBeDefined();
      expect(deactivatedEvent).toBeInstanceOf(OrganizationDeactivatedEvent);
      expect(deactivatedEvent.organizationId).toEqual(organizationId);
      expect(deactivatedEvent.reason).toBe(reason);
      expect(deactivatedEvent.tenantId).toBe(tenantId.toString());
      expect(deactivatedEvent.eventType).toBe('OrganizationDeactivated');
    });

    it('should coordinate organization entity disable through command pattern', () => {
      // Arrange
      const reason = '维护中';
      const organizationSpy = jest.spyOn(organization, 'disable');

      // Act
      organizationAggregate.disable(reason);

      // Assert
      expect(organizationSpy).toHaveBeenCalledWith(reason);
      expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.DISABLED);
    });
  });

  describe('delete', () => {
    it('should publish OrganizationDeletedEvent when deleting organization', () => {
      // Act
      organizationAggregate.delete();

      // Assert
      const domainEvents = organizationAggregate.getUncommittedEvents();
      const deletedEvent = domainEvents.find(event => event.eventType === 'OrganizationDeleted') as OrganizationDeletedEvent;
      expect(deletedEvent).toBeDefined();
      expect(deletedEvent).toBeInstanceOf(OrganizationDeletedEvent);
      expect(deletedEvent.organizationId).toEqual(organizationId);
      expect(deletedEvent.organizationName).toBe('Test Organization');
      expect(deletedEvent.tenantId).toBe(tenantId.toString());
      expect(deletedEvent.eventType).toBe('OrganizationDeleted');
    });
  });

  describe('getOrganization', () => {
    it('should return the organization entity', () => {
      // Act
      const returnedOrganization = organizationAggregate.getOrganization();

      // Assert
      expect(returnedOrganization).toBe(organization);
      expect(returnedOrganization).toBeInstanceOf(Organization);
      expect(returnedOrganization.name).toBe('Test Organization');
      expect(returnedOrganization.type).toBe(OrganizationType.COMMITTEE);
    });

    it('should provide controlled access to organization entity', () => {
      // Arrange & Act
      const organizationEntity = organizationAggregate.getOrganization();

      // Assert - 外部只能通过聚合根访问内部实体
      expect(organizationEntity).toBeDefined();
      expect(organizationEntity).toBeInstanceOf(Organization);
      
      // 验证聚合根管理内部实体访问
      expect(organizationEntity.getId()).toEqual(organizationId);
    });
  });

  describe('getOrganizationId', () => {
    it('should return the organization ID', () => {
      // Act
      const returnedOrganizationId = organizationAggregate.getOrganizationId();

      // Assert
      expect(returnedOrganizationId).toEqual(organizationId);
      expect(returnedOrganizationId).toBeInstanceOf(EntityId);
    });
  });

  describe('aggregate root responsibilities', () => {
    it('should manage aggregate consistency boundary', () => {
      // Arrange
      const newOrganizationAggregate = OrganizationAggregate.create(
        EntityId.generate(),
        'CONSISTENCY_ORG',
        'Consistency Organization',
        'Consistency organization description',
        OrganizationType.PERFORMANCE_GROUP,
        tenantId,
        'admin-id'
      );

      // Act & Assert - 聚合根确保聚合内数据一致性
      expect(newOrganizationAggregate.getOrganization().status).toBe(OrganizationStatus.PENDING);
      
      // 激活组织
      newOrganizationAggregate.activate();
      expect(newOrganizationAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);
      
      // 更新名称
      newOrganizationAggregate.updateName('Updated Name');
      expect(newOrganizationAggregate.getOrganization().name).toBe('Updated Name');
      expect(newOrganizationAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE); // 状态保持一致
    });

    it('should coordinate internal entity operations through command pattern', () => {
      // Arrange
      const organizationSpy1 = jest.spyOn(organization, 'activate');
      const organizationSpy2 = jest.spyOn(organization, 'updateName');
      const organizationSpy3 = jest.spyOn(organization, 'updateDescription');

      // Act - 聚合根发出指令给实体
      organizationAggregate.activate();
      organizationAggregate.updateName('Command Test Name');
      organizationAggregate.updateDescription('Command Test Description');

      // Assert - 验证指令模式的执行
      expect(organizationSpy1).toHaveBeenCalledTimes(1);
      expect(organizationSpy2).toHaveBeenCalledWith('Command Test Name');
      expect(organizationSpy3).toHaveBeenCalledWith('Command Test Description');
    });

    it('should publish domain events for all operations', () => {
      // Act - 执行多个操作
      organizationAggregate.activate();
      organizationAggregate.updateName('Event Test Organization');
      organizationAggregate.updateDescription('Event test description');

      // Assert - 验证所有操作都发布了相应的事件
      const domainEvents = organizationAggregate.getUncommittedEvents();
      
      const activatedEvent = domainEvents.find(event => event.eventType === 'OrganizationActivated');
      const nameUpdatedEvent = domainEvents.find(event => event.eventType === 'OrganizationNameUpdated');
      const descriptionUpdatedEvent = domainEvents.find(event => event.eventType === 'OrganizationDescriptionUpdated');

      expect(activatedEvent).toBeDefined();
      expect(nameUpdatedEvent).toBeDefined();
      expect(descriptionUpdatedEvent).toBeDefined();
      expect(domainEvents).toHaveLength(3);
    });
  });

  describe('event management', () => {
    it('should track uncommitted events', () => {
      // Act - 执行多个操作
      organizationAggregate.activate();
      organizationAggregate.updateName('Event Tracking Test');

      // Assert
      const uncommittedEvents = organizationAggregate.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(2);
      expect(uncommittedEvents.every(event => event.eventType)).toBeTruthy();
    });

    it('should clear events after marking as committed', () => {
      // Arrange
      organizationAggregate.activate();
      expect(organizationAggregate.getUncommittedEvents()).toHaveLength(1);

      // Act
      organizationAggregate.markEventsAsCommitted();

      // Assert
      expect(organizationAggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should accumulate events across multiple operations', () => {
      // Act - 执行多个操作
      organizationAggregate.activate();
      organizationAggregate.updateName('Accumulated Events Test');
      organizationAggregate.updateDescription('Accumulated description');
      organizationAggregate.delete();

      // Assert
      const allEvents = organizationAggregate.getUncommittedEvents();
      expect(allEvents).toHaveLength(4);
      
      const eventTypes = allEvents.map(event => event.eventType);
      expect(eventTypes).toContain('OrganizationActivated');
      expect(eventTypes).toContain('OrganizationNameUpdated');
      expect(eventTypes).toContain('OrganizationDescriptionUpdated');
      expect(eventTypes).toContain('OrganizationDeleted');
    });
  });

  describe('tenant context', () => {
    it('should return tenant context', () => {
      // Act
      const tenantContext = organizationAggregate.getTenantContext();

      // Assert
      expect(tenantContext).toBeDefined();
      expect(tenantContext?.tenantId).toBe(tenantId.toString());
      expect(tenantContext?.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('event sourcing (ES) support', () => {
    describe('fromEvents', () => {
      it('should rebuild aggregate from event stream', () => {
        // Arrange
        const events = [
          new OrganizationCreatedEvent(
            organizationId,
            'ORG_CODE',
            'Original Name',
            'Original description',
            OrganizationType.COMMITTEE,
            tenantId
          ),
          new OrganizationNameUpdatedEvent(
            organizationId,
            'Updated Name',
            tenantId.toString()
          ),
          new OrganizationActivatedEvent(
            organizationId,
            tenantId.toString()
          )
        ];

        // Act
        const rebuiltAggregate = OrganizationAggregate.fromEvents(events);

        // Assert
        expect(rebuiltAggregate).toBeInstanceOf(OrganizationAggregate);
        expect(rebuiltAggregate.getOrganization().name).toBe('Updated Name');
        expect(rebuiltAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);
        expect(rebuiltAggregate.getOrganization().description).toBe('Original description');
        expect(rebuiltAggregate.getUncommittedEvents()).toHaveLength(0); // 历史事件不应作为未提交事件
      });

      it('should throw EmptyEventStreamException when events array is empty', () => {
        // Act & Assert
        expect(() => OrganizationAggregate.fromEvents([]))
          .toThrow(EmptyEventStreamException);
        expect(() => OrganizationAggregate.fromEvents([]))
          .toThrow('事件流不能为空');
      });

      it('should throw InvalidEventStreamException when first event is not OrganizationCreatedEvent', () => {
        // Arrange
        const invalidEvents = [
          new OrganizationNameUpdatedEvent(
            organizationId,
            'Invalid Name',
            tenantId.toString()
          )
        ];

        // Act & Assert
        expect(() => OrganizationAggregate.fromEvents(invalidEvents))
          .toThrow(InvalidEventStreamException);
        expect(() => OrganizationAggregate.fromEvents(invalidEvents))
          .toThrow('第一个事件必须是组织创建事件');
      });

      it('should apply events in correct order', () => {
        // Arrange
        const events = [
          new OrganizationCreatedEvent(
            organizationId,
            'ORG_CODE',
            'Original Name',
            'Original description',
            OrganizationType.COMMITTEE,
            tenantId
          ),
          new OrganizationNameUpdatedEvent(
            organizationId,
            'First Update',
            tenantId.toString()
          ),
          new OrganizationNameUpdatedEvent(
            organizationId,
            'Second Update',
            tenantId.toString()
          ),
          new OrganizationActivatedEvent(
            organizationId,
            tenantId.toString()
          )
        ];

        // Act
        const rebuiltAggregate = OrganizationAggregate.fromEvents(events);

        // Assert
        expect(rebuiltAggregate.getOrganization().name).toBe('Second Update');
        expect(rebuiltAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);
      });
    });

    describe('applyEvent', () => {
      it('should apply OrganizationNameUpdatedEvent', () => {
        // Arrange
        const event = new OrganizationNameUpdatedEvent(
          organizationId,
          'Applied Name',
          tenantId.toString()
        );

        // Act
        organizationAggregate['applyEvent'](event);

        // Assert
        expect(organizationAggregate.getOrganization().name).toBe('Applied Name');
      });

      it('should apply OrganizationDescriptionUpdatedEvent', () => {
        // Arrange
        const event = new OrganizationDescriptionUpdatedEvent(
          organizationId,
          'Applied Description',
          tenantId.toString()
        );

        // Act
        organizationAggregate['applyEvent'](event);

        // Assert
        expect(organizationAggregate.getOrganization().description).toBe('Applied Description');
      });

      it('should apply OrganizationActivatedEvent', () => {
        // Arrange
        const event = new OrganizationActivatedEvent(
          organizationId,
          tenantId.toString()
        );

        // Act
        organizationAggregate['applyEvent'](event);

        // Assert
        expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);
      });

      it('should apply OrganizationDeactivatedEvent', () => {
        // Arrange
        const reason = 'Applied reason';
        const event = new OrganizationDeactivatedEvent(
          organizationId,
          reason,
          tenantId.toString()
        );

        // Act
        organizationAggregate['applyEvent'](event);

        // Assert
        expect(organizationAggregate.getOrganization().status).toBe(OrganizationStatus.DISABLED);
      });
    });

    describe('createSnapshot', () => {
      it('should create organization snapshot', () => {
        // Arrange
        organizationAggregate.activate();

        // Act
        const snapshot = organizationAggregate.createSnapshot();

        // Assert
        expect(snapshot).toBeDefined();
        expect(snapshot.organizationId).toBe(organizationId.toString());
        expect(snapshot.tenantId).toBe(tenantId.toString());
        expect(snapshot.name).toBe('Test Organization');
        expect(snapshot.type).toBe(OrganizationType.COMMITTEE);
        expect(snapshot.status).toBe(OrganizationStatus.ACTIVE);
        expect(snapshot.adminId).toBe('admin-id');
        expect(snapshot.description).toBe('Test organization description');
        expect(snapshot.version).toBeDefined();
        expect(snapshot.createdAt).toBeDefined();
        expect(snapshot.updatedAt).toBeDefined();
      });
    });

    describe('fromSnapshot', () => {
      it('should rebuild aggregate from snapshot', () => {
        // Arrange
        const snapshot: OrganizationSnapshot = {
          organizationId: organizationId.toString(),
          tenantId: tenantId.toString(),
          name: 'Snapshot Organization',
          type: OrganizationType.PROJECT_TEAM,
          status: OrganizationStatus.ACTIVE,
          adminId: 'snapshot-admin',
          description: 'Snapshot description',
          managedDepartmentIds: ['dept1', 'dept2'],
          version: 5,
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-02')
        };

        // Act
        const rebuiltAggregate = OrganizationAggregate.fromSnapshot(snapshot);

        // Assert
        expect(rebuiltAggregate).toBeInstanceOf(OrganizationAggregate);
        expect(rebuiltAggregate.getOrganization().name).toBe('Snapshot Organization');
        expect(rebuiltAggregate.getOrganization().type).toBe(OrganizationType.PROJECT_TEAM);
        expect(rebuiltAggregate.getOrganization().status).toBe(OrganizationStatus.ACTIVE);
        expect(rebuiltAggregate.getOrganization().adminId).toBe('snapshot-admin');
        expect(rebuiltAggregate.getOrganization().description).toBe('Snapshot description');
        expect(rebuiltAggregate.getOrganization().getTenantId().toString()).toBe(tenantId.toString());
      });
    });

    describe('validateEventStream', () => {
      it('should return true for valid event stream', () => {
        // Arrange
        const events = [
          { aggregateVersion: 1 } as { aggregateVersion: number },
          { aggregateVersion: 2 } as { aggregateVersion: number },
          { aggregateVersion: 3 } as { aggregateVersion: number }
        ];

        // Act
        const isValid = OrganizationAggregate.validateEventStream(events);

        // Assert
        expect(isValid).toBe(true);
      });

      it('should return false for invalid event stream with gaps', () => {
        // Arrange
        const events = [
          { aggregateVersion: 1 } as { aggregateVersion: number },
          { aggregateVersion: 3 } as { aggregateVersion: number }, // 缺少版本2
          { aggregateVersion: 4 } as { aggregateVersion: number }
        ];

        // Act
        const isValid = OrganizationAggregate.validateEventStream(events);

        // Assert
        expect(isValid).toBe(false);
      });

      it('should return true for empty event stream', () => {
        // Act
        const isValid = OrganizationAggregate.validateEventStream([]);

        // Assert
        expect(isValid).toBe(true);
      });

      it('should return true for single event', () => {
        // Arrange
        const events = [{ aggregateVersion: 1 } as { aggregateVersion: number }];

        // Act
        const isValid = OrganizationAggregate.validateEventStream(events);

        // Assert
        expect(isValid).toBe(true);
      });
    });
  });

  describe('multi-tenancy support', () => {
    it('should validate tenant boundary', () => {
      // Arrange
      const differentTenantId = EntityId.generate();

      // Act & Assert
      expect(() => organizationAggregate['validateTenantBoundary'](differentTenantId))
        .toThrow(CrossTenantOperationException);
      expect(() => organizationAggregate['validateTenantBoundary'](differentTenantId))
        .toThrow('跨租户操作被拒绝');
    });

    it('should not throw exception for same tenant', () => {
      // Act & Assert - 不应该抛出异常
      expect(() => organizationAggregate['validateTenantBoundary'](tenantId)).not.toThrow();
    });

    it('should include tenant context in events', () => {
      // Act
      organizationAggregate.activate();

      // Assert
      const domainEvents = organizationAggregate.getUncommittedEvents();
      const activatedEvent = domainEvents[0] as OrganizationActivatedEvent;
      expect(activatedEvent.tenantId).toBe(tenantId.toString());
    });
  });
});
