/**
 * 部门聚合根单元测试
 * 
 * @description 测试部门聚合根的业务逻辑和聚合根管理职责
 * 包括聚合一致性边界管理、实体操作协调、领域事件发布、业务规则验证
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { DepartmentAggregate } from './department.aggregate';
import { Department } from '../entities/department.entity';
import { DepartmentLevel } from '../value-objects/department-level.vo';
import { DepartmentType } from '../value-objects/department-type.vo';
import { DepartmentStatus } from '../value-objects/department-status.vo';
import { 
  DepartmentCreatedEvent,
  DepartmentNameUpdatedEvent,
  DepartmentDescriptionUpdatedEvent,
  DepartmentActivatedEvent,
  DepartmentDeactivatedEvent,
  DepartmentDeletedEvent
} from '../../events/department-events';

describe('DepartmentAggregate', () => {
  let departmentAggregate: DepartmentAggregate;
  let departmentId: EntityId;
  let department: Department;
  let tenantId: EntityId;
  let organizationId: EntityId;

  beforeEach(() => {
    departmentId = EntityId.generate();
    tenantId = EntityId.generate();
    organizationId = EntityId.generate();
    
    department = new Department(
      departmentId,
      'TECH_DEPT',
      tenantId,
      organizationId,
      'Test Department',
      DepartmentType.TECHNICAL,
      DepartmentStatus.PENDING,
      'admin-id',
      'Test department description',
      DepartmentLevel.LEVEL_1
    );

    departmentAggregate = new DepartmentAggregate(departmentId, department);
  });

  describe('create', () => {
    it('should create department aggregate with initial state', () => {
      // Arrange
      const newDepartmentId = EntityId.generate();
      const code = 'NEW_DEPT';
      const name = 'New Department';
      const description = 'New department description';
      const level = DepartmentLevel.LEVEL_2;
      const newTenantId = EntityId.generate();
      const newOrganizationId = EntityId.generate();
      const parentDepartmentId = EntityId.generate();

      // Act
      const newDepartmentAggregate = DepartmentAggregate.create(
        newDepartmentId,
        code,
        name,
        description,
        level,
        newTenantId,
        newOrganizationId,
        parentDepartmentId
      );

      // Assert
      expect(newDepartmentAggregate).toBeInstanceOf(DepartmentAggregate);
      expect(newDepartmentAggregate.getDepartmentId()).toEqual(newDepartmentId);
      
      const createdDepartment = newDepartmentAggregate.getDepartment();
      expect(createdDepartment.code).toBe(code);
      expect(createdDepartment.name).toBe(name);
      expect(createdDepartment.description).toBe(description);
      expect(createdDepartment.level).toBe(level);
      expect(createdDepartment.status).toBe(DepartmentStatus.PENDING);
      expect(createdDepartment.adminId).toBe('system');
      expect(createdDepartment.getTenantId()).toEqual(newTenantId);
      expect(createdDepartment.getOrganizationId()).toEqual(newOrganizationId);
    });

    it('should publish DepartmentCreatedEvent when creating department', () => {
      // Arrange
      const newDepartmentId = EntityId.generate();
      const code = 'EVENT_DEPT';
      const name = 'Event Department';
      const description = 'Event department description';
      const level = DepartmentLevel.LEVEL_3;
      const newTenantId = EntityId.generate();
      const newOrganizationId = EntityId.generate();

      // Act
      const newDepartmentAggregate = DepartmentAggregate.create(
        newDepartmentId,
        code,
        name,
        description,
        level,
        newTenantId,
        newOrganizationId
      );

      // Assert
      const domainEvents = newDepartmentAggregate.getUncommittedEvents();
      expect(domainEvents).toHaveLength(1);
      
      const createdEvent = domainEvents[0] as DepartmentCreatedEvent;
      expect(createdEvent).toBeInstanceOf(DepartmentCreatedEvent);
      expect(createdEvent.departmentId).toEqual(newDepartmentId);
      expect(createdEvent.code).toBe(code);
      expect(createdEvent.name).toBe(name);
      expect(createdEvent.description).toBe(description);
      expect(createdEvent.level).toBe(level);
      expect(createdEvent.tenantId).toEqual(newTenantId);
      expect(createdEvent.organizationId).toEqual(newOrganizationId);
      expect(createdEvent.eventType).toBe('DepartmentCreated');
    });

    it('should create department with parent department ID', () => {
      // Arrange
      const newDepartmentId = EntityId.generate();
      const parentDepartmentId = EntityId.generate();

      // Act
      const newDepartmentAggregate = DepartmentAggregate.create(
        newDepartmentId,
        'SUB_DEPT',
        'Sub Department',
        'Sub department description',
        DepartmentLevel.LEVEL_2,
        tenantId,
        organizationId,
        parentDepartmentId
      );

      // Assert
      const domainEvents = newDepartmentAggregate.getUncommittedEvents();
      const createdEvent = domainEvents[0] as DepartmentCreatedEvent;
      expect(createdEvent.parentDepartmentId).toEqual(parentDepartmentId);
    });
  });

  describe('updateName', () => {
    it('should update department name and publish DepartmentNameUpdatedEvent', () => {
      // Arrange
      const newName = 'Updated Department Name';
      expect(departmentAggregate.getDepartment().name).toBe('Test Department');

      // Act
      departmentAggregate.updateName(newName);

      // Assert
      expect(departmentAggregate.getDepartment().name).toBe(newName);
      
      const domainEvents = departmentAggregate.getUncommittedEvents();
      const nameUpdatedEvent = domainEvents.find(event => event.eventType === 'DepartmentNameUpdated') as DepartmentNameUpdatedEvent;
      expect(nameUpdatedEvent).toBeDefined();
      expect(nameUpdatedEvent).toBeInstanceOf(DepartmentNameUpdatedEvent);
      expect(nameUpdatedEvent.departmentId).toEqual(departmentId);
      expect(nameUpdatedEvent.newName).toBe(newName);
      expect(nameUpdatedEvent.tenantId).toBe(tenantId.toString());
      expect(nameUpdatedEvent.eventType).toBe('DepartmentNameUpdated');
    });

    it('should coordinate department entity name update through command pattern', () => {
      // Arrange
      const newName = 'Command Pattern Test';
      const departmentSpy = jest.spyOn(department, 'updateName');

      // Act
      departmentAggregate.updateName(newName);

      // Assert
      expect(departmentSpy).toHaveBeenCalledWith(newName);
    });
  });

  describe('updateDescription', () => {
    it('should update department description and publish DepartmentDescriptionUpdatedEvent', () => {
      // Arrange
      const newDescription = 'Updated department description';
      expect(departmentAggregate.getDepartment().description).toBe('Test department description');

      // Act
      departmentAggregate.updateDescription(newDescription);

      // Assert
      expect(departmentAggregate.getDepartment().description).toBe(newDescription);
      
      const domainEvents = departmentAggregate.getUncommittedEvents();
      const descriptionUpdatedEvent = domainEvents.find(event => event.eventType === 'DepartmentDescriptionUpdated') as DepartmentDescriptionUpdatedEvent;
      expect(descriptionUpdatedEvent).toBeDefined();
      expect(descriptionUpdatedEvent).toBeInstanceOf(DepartmentDescriptionUpdatedEvent);
      expect(descriptionUpdatedEvent.departmentId).toEqual(departmentId);
      expect(descriptionUpdatedEvent.newDescription).toBe(newDescription);
      expect(descriptionUpdatedEvent.tenantId).toBe(tenantId.toString());
      expect(descriptionUpdatedEvent.eventType).toBe('DepartmentDescriptionUpdated');
    });

    it('should coordinate department entity description update through command pattern', () => {
      // Arrange
      const newDescription = 'Command description test';
      const departmentSpy = jest.spyOn(department, 'updateDescription');

      // Act
      departmentAggregate.updateDescription(newDescription);

      // Assert
      expect(departmentSpy).toHaveBeenCalledWith(newDescription);
    });
  });

  describe('activate', () => {
    it('should activate department and publish DepartmentActivatedEvent', () => {
      // Arrange
      expect(departmentAggregate.getDepartment().status).toBe(DepartmentStatus.PENDING);

      // Act
      departmentAggregate.activate();

      // Assert
      expect(departmentAggregate.getDepartment().status).toBe(DepartmentStatus.ACTIVE);
      
      const domainEvents = departmentAggregate.getUncommittedEvents();
      const activatedEvent = domainEvents.find(event => event.eventType === 'DepartmentActivated') as DepartmentActivatedEvent;
      expect(activatedEvent).toBeDefined();
      expect(activatedEvent).toBeInstanceOf(DepartmentActivatedEvent);
      expect(activatedEvent.departmentId).toEqual(departmentId);
      expect(activatedEvent.tenantId).toBe(tenantId.toString());
      expect(activatedEvent.eventType).toBe('DepartmentActivated');
    });

    it('should coordinate department entity activation through command pattern', () => {
      // Arrange
      const departmentSpy = jest.spyOn(department, 'activate');
      expect(departmentSpy).not.toHaveBeenCalled();

      // Act
      departmentAggregate.activate();

      // Assert
      expect(departmentSpy).toHaveBeenCalledTimes(1);
      expect(departmentAggregate.getDepartment().status).toBe(DepartmentStatus.ACTIVE);
    });
  });

  describe('deactivate', () => {
    beforeEach(() => {
      // 先激活部门
      departmentAggregate.activate();
      departmentAggregate.markEventsAsCommitted(); // 清除已提交的事件
    });

    it('should deactivate department and publish DepartmentDeactivatedEvent', () => {
      // Arrange
      expect(departmentAggregate.getDepartment().status).toBe(DepartmentStatus.ACTIVE);

      // Act
      departmentAggregate.deactivate();

      // Assert
      expect(departmentAggregate.getDepartment().status).toBe(DepartmentStatus.INACTIVE);
      
      const domainEvents = departmentAggregate.getUncommittedEvents();
      const deactivatedEvent = domainEvents.find(event => event.eventType === 'DepartmentDeactivated') as DepartmentDeactivatedEvent;
      expect(deactivatedEvent).toBeDefined();
      expect(deactivatedEvent).toBeInstanceOf(DepartmentDeactivatedEvent);
      expect(deactivatedEvent.departmentId).toEqual(departmentId);
      expect(deactivatedEvent.tenantId).toBe(tenantId.toString());
      expect(deactivatedEvent.eventType).toBe('DepartmentDeactivated');
    });

    it('should coordinate department entity deactivation through command pattern', () => {
      // Arrange
      const departmentSpy = jest.spyOn(department, 'deactivate');

      // Act
      departmentAggregate.deactivate();

      // Assert
      expect(departmentSpy).toHaveBeenCalledTimes(1);
      expect(departmentAggregate.getDepartment().status).toBe(DepartmentStatus.INACTIVE);
    });
  });

  describe('delete', () => {
    it('should publish DepartmentDeletedEvent when deleting department', () => {
      // Act
      departmentAggregate.delete();

      // Assert
      const domainEvents = departmentAggregate.getUncommittedEvents();
      const deletedEvent = domainEvents.find(event => event.eventType === 'DepartmentDeleted') as DepartmentDeletedEvent;
      expect(deletedEvent).toBeDefined();
      expect(deletedEvent).toBeInstanceOf(DepartmentDeletedEvent);
      expect(deletedEvent.departmentId).toEqual(departmentId);
      expect(deletedEvent.departmentCode).toBe('TECH_DEPT');
      expect(deletedEvent.tenantId).toBe(tenantId.toString());
      expect(deletedEvent.eventType).toBe('DepartmentDeleted');
    });
  });

  describe('getDepartment', () => {
    it('should return the department entity', () => {
      // Act
      const returnedDepartment = departmentAggregate.getDepartment();

      // Assert
      expect(returnedDepartment).toBe(department);
      expect(returnedDepartment).toBeInstanceOf(Department);
      expect(returnedDepartment.name).toBe('Test Department');
      expect(returnedDepartment.type).toBe(DepartmentType.TECHNICAL);
    });

    it('should provide controlled access to department entity', () => {
      // Arrange & Act
      const departmentEntity = departmentAggregate.getDepartment();

      // Assert - 外部只能通过聚合根访问内部实体
      expect(departmentEntity).toBeDefined();
      expect(departmentEntity).toBeInstanceOf(Department);
      
      // 验证聚合根管理内部实体访问
      expect(departmentEntity.getId()).toEqual(departmentId);
    });
  });

  describe('getDepartmentId', () => {
    it('should return the department ID', () => {
      // Act
      const returnedDepartmentId = departmentAggregate.getDepartmentId();

      // Assert
      expect(returnedDepartmentId).toEqual(departmentId);
      expect(returnedDepartmentId).toBeInstanceOf(EntityId);
    });
  });

  describe('aggregate root responsibilities', () => {
    it('should manage aggregate consistency boundary', () => {
      // Arrange
      const newDepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'CONSISTENCY_DEPT',
        'Consistency Department',
        'Consistency department description',
        DepartmentLevel.LEVEL_1,
        tenantId,
        organizationId
      );

      // Act & Assert - 聚合根确保聚合内数据一致性
      expect(newDepartmentAggregate.getDepartment().status).toBe(DepartmentStatus.PENDING);
      
      // 激活部门
      newDepartmentAggregate.activate();
      expect(newDepartmentAggregate.getDepartment().status).toBe(DepartmentStatus.ACTIVE);
      
      // 更新名称
      newDepartmentAggregate.updateName('Updated Name');
      expect(newDepartmentAggregate.getDepartment().name).toBe('Updated Name');
      expect(newDepartmentAggregate.getDepartment().status).toBe(DepartmentStatus.ACTIVE); // 状态保持一致
    });

    it('should coordinate internal entity operations through command pattern', () => {
      // Arrange
      const departmentSpy1 = jest.spyOn(department, 'activate');
      const departmentSpy2 = jest.spyOn(department, 'updateName');
      const departmentSpy3 = jest.spyOn(department, 'updateDescription');

      // Act - 聚合根发出指令给实体
      departmentAggregate.activate();
      departmentAggregate.updateName('Command Test Name');
      departmentAggregate.updateDescription('Command Test Description');

      // Assert - 验证指令模式的执行
      expect(departmentSpy1).toHaveBeenCalledTimes(1);
      expect(departmentSpy2).toHaveBeenCalledWith('Command Test Name');
      expect(departmentSpy3).toHaveBeenCalledWith('Command Test Description');
    });

    it('should publish domain events for all operations', () => {
      // Act - 执行多个操作
      departmentAggregate.activate();
      departmentAggregate.updateName('Event Test Department');
      departmentAggregate.updateDescription('Event test description');
      departmentAggregate.delete();

      // Assert - 验证所有操作都发布了相应的事件
      const domainEvents = departmentAggregate.getUncommittedEvents();
      
      const activatedEvent = domainEvents.find(event => event.eventType === 'DepartmentActivated');
      const nameUpdatedEvent = domainEvents.find(event => event.eventType === 'DepartmentNameUpdated');
      const descriptionUpdatedEvent = domainEvents.find(event => event.eventType === 'DepartmentDescriptionUpdated');
      const deletedEvent = domainEvents.find(event => event.eventType === 'DepartmentDeleted');

      expect(activatedEvent).toBeDefined();
      expect(nameUpdatedEvent).toBeDefined();
      expect(descriptionUpdatedEvent).toBeDefined();
      expect(deletedEvent).toBeDefined();
      expect(domainEvents).toHaveLength(4);
    });
  });

  describe('event management', () => {
    it('should track uncommitted events', () => {
      // Act - 执行多个操作
      departmentAggregate.activate();
      departmentAggregate.updateName('Event Tracking Test');

      // Assert
      const uncommittedEvents = departmentAggregate.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(2);
      expect(uncommittedEvents.every(event => event.eventType)).toBeTruthy();
    });

    it('should clear events after marking as committed', () => {
      // Arrange
      departmentAggregate.activate();
      expect(departmentAggregate.getUncommittedEvents()).toHaveLength(1);

      // Act
      departmentAggregate.markEventsAsCommitted();

      // Assert
      expect(departmentAggregate.getUncommittedEvents()).toHaveLength(0);
    });

    it('should accumulate events across multiple operations', () => {
      // Act - 执行多个操作
      departmentAggregate.activate();
      departmentAggregate.updateName('Accumulated Events Test');
      departmentAggregate.updateDescription('Accumulated description');
      departmentAggregate.deactivate();

      // Assert
      const allEvents = departmentAggregate.getUncommittedEvents();
      expect(allEvents).toHaveLength(4);
      
      const eventTypes = allEvents.map(event => event.eventType);
      expect(eventTypes).toContain('DepartmentActivated');
      expect(eventTypes).toContain('DepartmentNameUpdated');
      expect(eventTypes).toContain('DepartmentDescriptionUpdated');
      expect(eventTypes).toContain('DepartmentDeactivated');
    });
  });

  describe('department hierarchy', () => {
    it('should create root department without parent', () => {
      // Act
      const rootDepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'ROOT_DEPT',
        'Root Department',
        'Root department description',
        DepartmentLevel.LEVEL_1,
        tenantId,
        organizationId
      );

      // Assert
      const domainEvents = rootDepartmentAggregate.getUncommittedEvents();
      const createdEvent = domainEvents[0] as DepartmentCreatedEvent;
      expect(createdEvent.parentDepartmentId).toBeUndefined();
    });

    it('should create sub department with parent', () => {
      // Arrange
      const parentDepartmentId = EntityId.generate();

      // Act
      const subDepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'SUB_DEPT',
        'Sub Department',
        'Sub department description',
        DepartmentLevel.LEVEL_2,
        tenantId,
        organizationId,
        parentDepartmentId
      );

      // Assert
      const domainEvents = subDepartmentAggregate.getUncommittedEvents();
      const createdEvent = domainEvents[0] as DepartmentCreatedEvent;
      expect(createdEvent.parentDepartmentId).toEqual(parentDepartmentId);
    });
  });

  describe('department types', () => {
    it('should create technical department', () => {
      // Act
      const technicalDepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'TECH_DEPT',
        'Technical Department',
        'Technical department description',
        DepartmentLevel.LEVEL_1,
        tenantId,
        organizationId
      );

      // Assert
      const createdDepartment = technicalDepartmentAggregate.getDepartment();
      expect(createdDepartment.type).toBe(DepartmentType.TECHNICAL);
    });

    it('should create administrative department', () => {
      // Arrange
      const adminDepartment = new Department(
        EntityId.generate(),
        'ADMIN_DEPT',
        tenantId,
        organizationId,
        'Administrative Department',
        DepartmentType.ADMINISTRATIVE,
        DepartmentStatus.PENDING,
        'admin-id',
        'Administrative department description',
        DepartmentLevel.LEVEL_1
      );
      const adminDepartmentAggregate = new DepartmentAggregate(EntityId.generate(), adminDepartment);

      // Assert
      expect(adminDepartmentAggregate.getDepartment().type).toBe(DepartmentType.ADMINISTRATIVE);
    });
  });

  describe('department levels', () => {
    it('should create level 1 department', () => {
      // Act
      const level1DepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'LEVEL1_DEPT',
        'Level 1 Department',
        'Level 1 department description',
        DepartmentLevel.LEVEL_1,
        tenantId,
        organizationId
      );

      // Assert
      const createdDepartment = level1DepartmentAggregate.getDepartment();
      expect(createdDepartment.level).toBe(DepartmentLevel.LEVEL_1);
    });

    it('should create level 2 department', () => {
      // Act
      const level2DepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'LEVEL2_DEPT',
        'Level 2 Department',
        'Level 2 department description',
        DepartmentLevel.LEVEL_2,
        tenantId,
        organizationId
      );

      // Assert
      const createdDepartment = level2DepartmentAggregate.getDepartment();
      expect(createdDepartment.level).toBe(DepartmentLevel.LEVEL_2);
    });

    it('should create level 3 department', () => {
      // Act
      const level3DepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'LEVEL3_DEPT',
        'Level 3 Department',
        'Level 3 department description',
        DepartmentLevel.LEVEL_3,
        tenantId,
        organizationId
      );

      // Assert
      const createdDepartment = level3DepartmentAggregate.getDepartment();
      expect(createdDepartment.level).toBe(DepartmentLevel.LEVEL_3);
    });
  });

  describe('tenant and organization context', () => {
    it('should maintain tenant context in events', () => {
      // Act
      departmentAggregate.activate();

      // Assert
      const domainEvents = departmentAggregate.getUncommittedEvents();
      const activatedEvent = domainEvents[0] as DepartmentActivatedEvent;
      expect(activatedEvent.tenantId).toBe(tenantId.toString());
    });

    it('should maintain organization context in creation event', () => {
      // Act
      const newDepartmentAggregate = DepartmentAggregate.create(
        EntityId.generate(),
        'ORG_DEPT',
        'Organization Department',
        'Organization department description',
        DepartmentLevel.LEVEL_1,
        tenantId,
        organizationId
      );

      // Assert
      const domainEvents = newDepartmentAggregate.getUncommittedEvents();
      const createdEvent = domainEvents[0] as DepartmentCreatedEvent;
      expect(createdEvent.organizationId).toEqual(organizationId);
    });
  });
});
