/**
 * 租户激活事件单元测试
 * 
 * @description 测试租户激活事件的业务逻辑和事件数据
 * 包括事件创建、数据验证、序列化等功能
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { TenantActivatedEvent } from './tenant-activated.event';

describe('TenantActivatedEvent', () => {
  let tenantActivatedEvent: TenantActivatedEvent;
  let aggregateId: EntityId;
  let aggregateVersion: number;
  let tenantId: string;

  beforeEach(() => {
    aggregateId = EntityId.generate();
    aggregateVersion = 1;
    tenantId = EntityId.generate().toString();

    tenantActivatedEvent = new TenantActivatedEvent(
      aggregateId,
      aggregateVersion,
      tenantId
    );
  });

  describe('constructor', () => {
    it('should create tenant activated event with valid data', () => {
      // Assert
      expect(tenantActivatedEvent).toBeInstanceOf(TenantActivatedEvent);
      expect(tenantActivatedEvent.aggregateId).toEqual(aggregateId);
      expect(tenantActivatedEvent.aggregateVersion).toBe(aggregateVersion);
      expect(tenantActivatedEvent.tenantId).toBe(tenantId);
    });

    it('should set event version to 1', () => {
      // Assert
      expect(tenantActivatedEvent.eventVersion).toBe(1);
    });

    it('should set event timestamp', () => {
      // Assert
      expect(tenantActivatedEvent.occurredOn).toBeInstanceOf(Date);
      expect(tenantActivatedEvent.occurredOn.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should generate unique event ID', () => {
      // Act
      const anotherEvent = new TenantActivatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString()
      );

      // Assert
      expect(tenantActivatedEvent.eventId).not.toBe(anotherEvent.eventId);
      expect(tenantActivatedEvent.eventId).toBeDefined();
      expect(anotherEvent.eventId).toBeDefined();
    });
  });

  describe('eventType', () => {
    it('should return correct event type', () => {
      // Act
      const eventType = tenantActivatedEvent.eventType;

      // Assert
      expect(eventType).toBe('TenantActivated');
    });
  });

  describe('eventData', () => {
    it('should return empty event data', () => {
      // Act
      const eventData = tenantActivatedEvent.eventData;

      // Assert
      expect(eventData).toEqual({});
    });

    it('should return immutable event data', () => {
      // Act
      const eventData = tenantActivatedEvent.eventData;

      // Attempt to modify (should not affect original)
      (eventData as Record<string, unknown>).newProperty = 'test';

      // Assert
      expect(tenantActivatedEvent.eventData).toEqual({});
    });
  });

  describe('inheritance from BaseDomainEvent', () => {
    it('should inherit from BaseDomainEvent', () => {
      // Assert
      expect(tenantActivatedEvent).toBeInstanceOf(TenantActivatedEvent);
      expect(tenantActivatedEvent.aggregateId).toBeDefined();
      expect(tenantActivatedEvent.aggregateVersion).toBeDefined();
      expect(tenantActivatedEvent.tenantId).toBeDefined();
      expect(tenantActivatedEvent.eventId).toBeDefined();
      expect(tenantActivatedEvent.occurredOn).toBeDefined();
      expect(tenantActivatedEvent.eventVersion).toBeDefined();
    });

    it('should have correct aggregate information', () => {
      // Assert
      expect(tenantActivatedEvent.aggregateId).toEqual(aggregateId);
      expect(tenantActivatedEvent.aggregateVersion).toBe(aggregateVersion);
      expect(tenantActivatedEvent.tenantId).toBe(tenantId);
    });
  });

  describe('event serialization', () => {
    it('should serialize to JSON correctly', () => {
      // Act
      const json = JSON.stringify(tenantActivatedEvent);
      const parsed = JSON.parse(json);

      // Assert
      expect(parsed.eventType).toBe('TenantActivated');
      expect(parsed.aggregateId).toBe(aggregateId.toString());
      expect(parsed.tenantId).toBe(tenantId);
      expect(parsed.eventData).toEqual({});
    });

    it('should maintain data integrity during serialization', () => {
      // Act
      const json = JSON.stringify(tenantActivatedEvent);
      const parsed = JSON.parse(json);
      const eventData = parsed.eventData;

      // Assert
      expect(eventData).toEqual({});
    });
  });

  describe('event equality', () => {
    it('should not be equal to different event instance', () => {
      // Arrange
      const anotherEvent = new TenantActivatedEvent(
        EntityId.generate(),
        1,
        EntityId.generate().toString()
      );

      // Assert
      expect(tenantActivatedEvent).not.toEqual(anotherEvent);
      expect(tenantActivatedEvent.eventId).not.toBe(anotherEvent.eventId);
    });

    it('should not be equal to different event type', () => {
      // Arrange
      const differentEvent = {
        eventType: 'TenantCreated',
        aggregateId: tenantActivatedEvent.aggregateId
      };

      // Assert
      expect(tenantActivatedEvent).not.toEqual(differentEvent);
    });
  });

  describe('event validation', () => {
    it('should validate event type is correct', () => {
      // Assert
      expect(tenantActivatedEvent.eventType).toBe('TenantActivated');
    });

    it('should validate event version is correct', () => {
      // Assert
      expect(tenantActivatedEvent.eventVersion).toBe(1);
    });

    it('should validate required properties are present', () => {
      // Assert
      expect(tenantActivatedEvent.aggregateId).toBeDefined();
      expect(tenantActivatedEvent.tenantId).toBeDefined();
      expect(tenantActivatedEvent.aggregateVersion).toBeDefined();
    });
  });

  describe('event lifecycle', () => {
    it('should have correct event lifecycle properties', () => {
      // Assert
      expect(tenantActivatedEvent.eventId).toBeDefined();
      expect(tenantActivatedEvent.occurredOn).toBeInstanceOf(Date);
      expect(tenantActivatedEvent.eventVersion).toBe(1);
      expect(tenantActivatedEvent.aggregateVersion).toBe(aggregateVersion);
    });

    it('should maintain event order through version', () => {
      // Arrange
      const event1 = new TenantActivatedEvent(
        aggregateId,
        1,
        tenantId
      );
      const event2 = new TenantActivatedEvent(
        aggregateId,
        2,
        tenantId
      );

      // Assert
      expect(event1.aggregateVersion).toBe(1);
      expect(event2.aggregateVersion).toBe(2);
      expect(event1.occurredOn.getTime()).toBeLessThanOrEqual(event2.occurredOn.getTime());
    });
  });

  describe('business rules', () => {
    it('should represent tenant activation state change', () => {
      // Assert
      expect(tenantActivatedEvent.eventType).toBe('TenantActivated');
      expect(tenantActivatedEvent.tenantId).toBe(tenantId);
    });

    it('should be associated with correct tenant', () => {
      // Assert
      expect(tenantActivatedEvent.tenantId).toBe(tenantId);
      expect(tenantActivatedEvent.aggregateId).toEqual(aggregateId);
    });

    it('should have minimal event data for activation', () => {
      // Assert
      expect(tenantActivatedEvent.eventData).toEqual({});
    });
  });

  describe('event consistency', () => {
    it('should maintain consistent event structure', () => {
      // Act
      const multipleEvents = Array.from({ length: 5 }, () => 
        new TenantActivatedEvent(
          EntityId.generate(),
          1,
          EntityId.generate().toString()
        )
      );

      // Assert
      multipleEvents.forEach(event => {
        expect(event.eventType).toBe('TenantActivated');
        expect(event.eventVersion).toBe(1);
        expect(event.eventData).toEqual({});
        expect(event.aggregateId).toBeDefined();
        expect(event.tenantId).toBeDefined();
      });
    });

    it('should have unique event IDs for each instance', () => {
      // Act
      const multipleEvents = Array.from({ length: 10 }, () => 
        new TenantActivatedEvent(
          aggregateId,
          1,
          tenantId
        )
      );

      // Assert
      const eventIds = multipleEvents.map(event => event.eventId);
      const uniqueEventIds = new Set(eventIds);
      expect(uniqueEventIds.size).toBe(eventIds.length);
    });
  });

  describe('edge cases', () => {
    it('should handle empty tenant ID', () => {
      // Arrange
      const eventWithEmptyTenantId = new TenantActivatedEvent(
        EntityId.generate(),
        1,
        ''
      );

      // Assert
      expect(eventWithEmptyTenantId.tenantId).toBe('');
      expect(eventWithEmptyTenantId.eventType).toBe('TenantActivated');
    });

    it('should handle high aggregate versions', () => {
      // Arrange
      const highVersionEvent = new TenantActivatedEvent(
        EntityId.generate(),
        1000,
        EntityId.generate().toString()
      );

      // Assert
      expect(highVersionEvent.aggregateVersion).toBe(1000);
      expect(highVersionEvent.eventVersion).toBe(1);
    });
  });
});
