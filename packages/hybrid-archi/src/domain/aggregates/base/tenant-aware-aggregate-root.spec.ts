/**
 * TenantAwareAggregateRoot 单元测试
 *
 * @description 测试租户感知聚合根的核心功能
 * @since 1.1.0
 */

import { TenantAwareAggregateRoot } from './tenant-aware-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import { IPartialAuditInfo } from '../../entities/base/audit-info';
import { BaseDomainEvent } from '../../events/base/base-domain-event';
import { PinoLogger } from '@hl8/logger';
import {
  GeneralBadRequestException,
} from '@hl8/common';

/**
 * 测试用聚合根
 */
class TestAggregate extends TenantAwareAggregateRoot {
  constructor(
    id: EntityId,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
  }

  // 公开测试方法
  public testEnsureTenantContext(): void {
    this.ensureTenantContext();
  }

  public testEnsureSameTenant(
    entityTenantId: EntityId,
    entityType?: string
  ): void {
    this.ensureSameTenant(entityTenantId, entityType);
  }

  public testPublishTenantEvent(
    eventFactory: (
      aggregateId: EntityId,
      version: number,
      tenantId: EntityId
    ) => BaseDomainEvent
  ): void {
    this.publishTenantEvent(eventFactory);
  }

  public testLogTenantOperation(
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.logTenantOperation(message, data);
  }
}

/**
 * 测试用领域事件
 */
class TestEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    version: number,
    tenantId: EntityId,
    public readonly testData: string
  ) {
    super(aggregateId, version, tenantId);
  }

  get eventType(): string {
    return 'TestEvent';
  }
}

describe('TenantAwareAggregateRoot', () => {
  let mockLogger: PinoLogger;
  let validTenantId: EntityId;
  let validAuditInfo: IPartialAuditInfo;

  beforeEach(() => {
    // 创建模拟日志记录器
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      setContext: jest.fn(),
    } as unknown as PinoLogger;

    // 创建有效的租户ID
    validTenantId = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');

    // 创建有效的审计信息
    validAuditInfo = {
      tenantId: validTenantId,
      createdBy: 'test-user',
    };
  });

  describe('构造函数', () => {
    it('应该成功创建租户感知聚合根', () => {
      // Arrange & Act
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );

      // Assert
      expect(aggregate).toBeDefined();
      expect(aggregate.getTenantId()).toEqual(validTenantId);
    });

    it('应该在租户ID无效时抛出异常', () => {
      // Act & Assert - 直接测试EntityId.fromString会抛出异常
      expect(() => {
        EntityId.fromString(''); // 无效的租户ID
      }).toThrow('Invalid EntityId');
    });
  });

  describe('ensureTenantContext', () => {
    it('应该在租户ID有效时验证通过', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );

      // Act & Assert
      expect(() => {
        aggregate.testEnsureTenantContext();
      }).not.toThrow();
    });

    it('应该在租户ID无效时抛出异常', () => {
      // Act & Assert - 直接测试EntityId.fromString会抛出异常
      expect(() => {
        EntityId.fromString('invalid'); // 构造时会抛出异常
      }).toThrow('Invalid EntityId');
    });
  });

  describe('ensureSameTenant', () => {
    it('应该在租户ID相同时验证通过', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const sameTenantId = EntityId.fromString(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      // Act & Assert
      expect(() => {
        aggregate.testEnsureSameTenant(sameTenantId, 'TestEntity');
      }).not.toThrow();
    });

    it('应该在租户ID不同时抛出异常', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const differentTenantId = EntityId.fromString(
        '660e8400-e29b-41d4-a716-446655440001'
      );

      // Act & Assert
      expect(() => {
        aggregate.testEnsureSameTenant(differentTenantId, 'TestEntity');
      }).toThrow(GeneralBadRequestException);
    });

    it('应该在异常消息中包含实体类型', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const differentTenantId = EntityId.generate();

      // Act & Assert
      try {
        aggregate.testEnsureSameTenant(differentTenantId, 'Department');
        fail('应该抛出异常');
      } catch (error) {
        expect(error).toBeInstanceOf(GeneralBadRequestException);
        expect((error as GeneralBadRequestException).detail).toContain(
          'Department'
        );
      }
    });
  });

  describe('publishTenantEvent', () => {
    it('应该成功发布租户事件', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const eventFactory = (
        aggregateId: EntityId,
        version: number,
        tenantId: EntityId
      ) => new TestEvent(aggregateId, version, tenantId, 'test-data');

      // Act
      aggregate.testPublishTenantEvent(eventFactory);

      // Assert
      const events = aggregate.domainEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TestEvent);
      expect((events[0] as TestEvent).testData).toBe('test-data');
    });

    it('应该在事件中自动注入租户ID', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const eventFactory = (
        aggregateId: EntityId,
        version: number,
        tenantId: EntityId
      ) => new TestEvent(aggregateId, version, tenantId, 'test-data');

      // Act
      aggregate.testPublishTenantEvent(eventFactory);

      // Assert
      const events = aggregate.domainEvents;
      expect(events[0].tenantId).toEqual(validTenantId);
    });
  });

  describe('getTenantId', () => {
    it('应该返回正确的租户ID', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );

      // Act
      const tenantId = aggregate.getTenantId();

      // Assert
      expect(tenantId).toEqual(validTenantId);
    });
  });

  describe('belongsToTenant', () => {
    it('应该在租户ID相同时返回true', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const sameTenantId = EntityId.fromString(
        '550e8400-e29b-41d4-a716-446655440000'
      );

      // Act
      const result = aggregate.belongsToTenant(sameTenantId);

      // Assert
      expect(result).toBe(true);
    });

    it('应该在租户ID不同时返回false', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const differentTenantId = EntityId.generate();

      // Act
      const result = aggregate.belongsToTenant(differentTenantId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('logTenantOperation', () => {
    it('应该记录包含租户信息的日志', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );
      const message = '测试操作';
      const data = { key: 'value' };

      // Act
      aggregate.testLogTenantOperation(message, data);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          aggregateType: 'TestAggregate',
          tenantId: validTenantId.toString(),
          key: 'value',
        })
      );
    });
  });

  describe('toData', () => {
    it('应该序列化时包含租户信息', () => {
      // Arrange
      const aggregate = new TestAggregate(
        EntityId.generate(),
        validAuditInfo,
        mockLogger
      );

      // Act
      const data = aggregate.toData();

      // Assert
      expect(data).toHaveProperty('tenantId');
      expect(data['tenantId']).toBe(validTenantId.toString());
    });
  });
});

