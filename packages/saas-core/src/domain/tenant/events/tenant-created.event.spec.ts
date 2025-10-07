/**
 * 租户创建事件单元测试
 * 
 * @description 测试租户创建事件的业务逻辑和事件数据
 * 包括事件创建、数据验证、序列化等功能
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { TenantCreatedEvent } from './tenant-created.event';
import { TenantType } from '@hl8/hybrid-archi';

describe('TenantCreatedEvent', () => {
  let tenantCreatedEvent: TenantCreatedEvent;
  let aggregateId: EntityId;
  let aggregateVersion: number;
  let tenantId: string;
  let code: string;
  let name: string;
  let type: TenantType;
  let adminId: string;

  beforeEach(() => {
    aggregateId = EntityId.generate();
    aggregateVersion = 1;
    tenantId = EntityId.generate().toString();
    code = 'TEST_TENANT';
    name = 'Test Tenant';
    type = TenantType.BASIC;
    adminId = 'admin-123';

    tenantCreatedEvent = new TenantCreatedEvent(
      aggregateId,
      aggregateVersion,
      tenantId,
      code,
      name,
      type,
      adminId
    );
  });

  describe('constructor', () => {
    it('should create tenant created event with valid data', () => {
      // Assert
      expect(tenantCreatedEvent).toBeInstanceOf(TenantCreatedEvent);
      expect(tenantCreatedEvent.aggregateId).toEqual(aggregateId);
      expect(tenantCreatedEvent.aggregateVersion).toBe(aggregateVersion);
      expect(tenantCreatedEvent.tenantId).toBe(tenantId);
      expect(tenantCreatedEvent.code).toBe(code);
      expect(tenantCreatedEvent.name).toBe(name);
      expect(tenantCreatedEvent.type).toBe(type);
      expect(tenantCreatedEvent.adminId).toBe(adminId);
    });

    it('should set event version to 1', () => {
      // Assert
      expect(tenantCreatedEvent.eventVersion).toBe(1);
    });

    it('should set event timestamp', () => {
      // Assert
      expect(tenantCreatedEvent.occurredOn).toBeInstanceOf(Date);
      expect(tenantCreatedEvent.occurredOn.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should generate unique event ID', () => {
      // Act
      const anotherEvent = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        'ANOTHER_TENANT',
        'Another Tenant',
        TenantType.ENTERPRISE,
        'admin-456'
      );

      // Assert
      expect(tenantCreatedEvent.eventId).not.toBe(anotherEvent.eventId);
      expect(tenantCreatedEvent.eventId).toBeDefined();
      expect(anotherEvent.eventId).toBeDefined();
    });
  });

  describe('eventType', () => {
    it('should return correct event type', () => {
      // Act
      const eventType = tenantCreatedEvent.eventType;

      // Assert
      expect(eventType).toBe('TenantCreated');
    });
  });

  describe('eventData', () => {
    it('should return event data with all properties', () => {
      // Act
      const eventData = tenantCreatedEvent.eventData;

      // Assert
      expect(eventData).toEqual({
        code: code,
        name: name,
        type: type,
        adminId: adminId
      });
    });

    it('should return immutable event data', () => {
      // Act
      const eventData = tenantCreatedEvent.eventData;
      const originalCode = eventData.code;

      // Attempt to modify (should not affect original)
      (eventData as Record<string, unknown>).code = 'MODIFIED';

      // Assert
      expect(tenantCreatedEvent.code).toBe(originalCode);
      expect(tenantCreatedEvent.eventData.code).toBe(originalCode);
    });
  });

  describe('tenant types', () => {
    it('should create event with BASIC tenant type', () => {
      // Arrange
      const basicEvent = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        'BASIC_TENANT',
        'Basic Tenant',
        TenantType.BASIC,
        'admin-basic'
      );

      // Assert
      expect(basicEvent.type).toBe(TenantType.BASIC);
      expect(basicEvent.eventData.type).toBe(TenantType.BASIC);
    });

    it('should create event with ENTERPRISE tenant type', () => {
      // Arrange
      const enterpriseEvent = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        'ENTERPRISE_TENANT',
        'Enterprise Tenant',
        TenantType.ENTERPRISE,
        'admin-enterprise'
      );

      // Assert
      expect(enterpriseEvent.type).toBe(TenantType.ENTERPRISE);
      expect(enterpriseEvent.eventData.type).toBe(TenantType.ENTERPRISE);
    });

    it('should create event with PREMIUM tenant type', () => {
      // Arrange
      const premiumEvent = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        'PREMIUM_TENANT',
        'Premium Tenant',
        TenantType.PREMIUM,
        'admin-premium'
      );

      // Assert
      expect(premiumEvent.type).toBe(TenantType.PREMIUM);
      expect(premiumEvent.eventData.type).toBe(TenantType.PREMIUM);
    });
  });

  describe('event properties', () => {
    it('should have readonly properties', () => {
      // Assert
      expect(tenantCreatedEvent.code).toBe(code);
      expect(tenantCreatedEvent.name).toBe(name);
      expect(tenantCreatedEvent.type).toBe(type);
      expect(tenantCreatedEvent.adminId).toBe(adminId);
    });

    it('should maintain property values through event data', () => {
      // Act
      const eventData = tenantCreatedEvent.eventData;

      // Assert
      expect(eventData.code).toBe(tenantCreatedEvent.code);
      expect(eventData.name).toBe(tenantCreatedEvent.name);
      expect(eventData.type).toBe(tenantCreatedEvent.type);
      expect(eventData.adminId).toBe(tenantCreatedEvent.adminId);
    });
  });

  describe('inheritance from BaseDomainEvent', () => {
    it('should inherit from BaseDomainEvent', () => {
      // Assert
      expect(tenantCreatedEvent).toBeInstanceOf(TenantCreatedEvent);
      expect(tenantCreatedEvent.aggregateId).toBeDefined();
      expect(tenantCreatedEvent.aggregateVersion).toBeDefined();
      expect(tenantCreatedEvent.tenantId).toBeDefined();
      expect(tenantCreatedEvent.eventId).toBeDefined();
      expect(tenantCreatedEvent.occurredOn).toBeDefined();
      expect(tenantCreatedEvent.eventVersion).toBeDefined();
    });

    it('should have correct aggregate information', () => {
      // Assert
      expect(tenantCreatedEvent.aggregateId).toEqual(aggregateId);
      expect(tenantCreatedEvent.aggregateVersion).toBe(aggregateVersion);
      expect(tenantCreatedEvent.tenantId).toBe(tenantId);
    });
  });

  describe('event serialization', () => {
    it('should serialize to JSON correctly', () => {
      // Act
      const json = JSON.stringify(tenantCreatedEvent);
      const parsed = JSON.parse(json);

      // Assert
      expect(parsed.eventType).toBe('TenantCreated');
      expect(parsed.code).toBe(code);
      expect(parsed.name).toBe(name);
      expect(parsed.type).toBe(type);
      expect(parsed.adminId).toBe(adminId);
      expect(parsed.aggregateId).toBe(aggregateId.toString());
      expect(parsed.tenantId).toBe(tenantId);
    });

    it('should maintain data integrity during serialization', () => {
      // Act
      const json = JSON.stringify(tenantCreatedEvent);
      const parsed = JSON.parse(json);
      const eventData = parsed.eventData;

      // Assert
      expect(eventData.code).toBe(code);
      expect(eventData.name).toBe(name);
      expect(eventData.type).toBe(type);
      expect(eventData.adminId).toBe(adminId);
    });
  });

  describe('event equality', () => {
    it('should not be equal to different event instance', () => {
      // Arrange
      const anotherEvent = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        'ANOTHER_TENANT',
        'Another Tenant',
        TenantType.ENTERPRISE,
        'admin-456'
      );

      // Assert
      expect(tenantCreatedEvent).not.toEqual(anotherEvent);
      expect(tenantCreatedEvent.eventId).not.toBe(anotherEvent.eventId);
    });

    it('should not be equal to different event type', () => {
      // Arrange
      const differentEvent = {
        eventType: 'TenantActivated',
        aggregateId: tenantCreatedEvent.aggregateId
      };

      // Assert
      expect(tenantCreatedEvent).not.toEqual(differentEvent);
    });
  });

  describe('event validation', () => {
    it('should validate required properties are present', () => {
      // Assert
      expect(tenantCreatedEvent.code).toBeTruthy();
      expect(tenantCreatedEvent.name).toBeTruthy();
      expect(tenantCreatedEvent.type).toBeTruthy();
      expect(tenantCreatedEvent.adminId).toBeTruthy();
    });

    it('should validate event type is correct', () => {
      // Assert
      expect(tenantCreatedEvent.eventType).toBe('TenantCreated');
    });

    it('should validate event version is correct', () => {
      // Assert
      expect(tenantCreatedEvent.eventVersion).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string values', () => {
      // Arrange
      const eventWithEmptyStrings = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        '',
        '',
        TenantType.BASIC,
        ''
      );

      // Assert
      expect(eventWithEmptyStrings.code).toBe('');
      expect(eventWithEmptyStrings.name).toBe('');
      expect(eventWithEmptyStrings.adminId).toBe('');
      expect(eventWithEmptyStrings.eventData.code).toBe('');
      expect(eventWithEmptyStrings.eventData.name).toBe('');
      expect(eventWithEmptyStrings.eventData.adminId).toBe('');
    });

    it('should handle long string values', () => {
      // Arrange
      const longCode = 'A'.repeat(100);
      const longName = 'B'.repeat(200);
      const longAdminId = 'C'.repeat(50);

      const eventWithLongStrings = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        longCode,
        longName,
        TenantType.ENTERPRISE,
        longAdminId
      );

      // Assert
      expect(eventWithLongStrings.code).toBe(longCode);
      expect(eventWithLongStrings.name).toBe(longName);
      expect(eventWithLongStrings.adminId).toBe(longAdminId);
    });

    it('should handle special characters in strings', () => {
      // Arrange
      const specialCode = 'TEST@#$%^&*()_+-=[]{}|;:,.<>?';
      const specialName = '测试租户名称 with special chars !@#$%';
      const specialAdminId = 'admin@example.com';

      const eventWithSpecialChars = new TenantCreatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString(),
        specialCode,
        specialName,
        TenantType.PREMIUM,
        specialAdminId
      );

      // Assert
      expect(eventWithSpecialChars.code).toBe(specialCode);
      expect(eventWithSpecialChars.name).toBe(specialName);
      expect(eventWithSpecialChars.adminId).toBe(specialAdminId);
    });
  });

  describe('event lifecycle', () => {
    it('should have correct event lifecycle properties', () => {
      // Assert
      expect(tenantCreatedEvent.eventId).toBeDefined();
      expect(tenantCreatedEvent.occurredOn).toBeInstanceOf(Date);
      expect(tenantCreatedEvent.eventVersion).toBe(1);
      expect(tenantCreatedEvent.aggregateVersion).toBe(aggregateVersion);
    });

    it('should maintain event order through version', () => {
      // Arrange
      const event1 = new TenantCreatedEvent(
        aggregateId,
        1,
        tenantId,
        code,
        name,
        type,
        adminId
      );
      const event2 = new TenantCreatedEvent(
        aggregateId,
        2,
        tenantId,
        code,
        name,
        type,
        adminId
      );

      // Assert
      expect(event1.aggregateVersion).toBe(1);
      expect(event2.aggregateVersion).toBe(2);
      expect(event1.occurredOn.getTime()).toBeLessThanOrEqual(event2.occurredOn.getTime());
    });
  });
});
