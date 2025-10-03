/**
 * 基础聚合根测试
 *
 * 测试基础聚合根的核心功能，包括领域事件管理、事件发布、事件重放等。
 *
 * @description 基础聚合根的单元测试
 * @since 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BaseAggregateRoot } from './base-aggregate-root';
import { EntityId } from '../../value-objects/entity-id';
import { DomainEvent } from '../../events/base/base-domain-event';
import { PinoLogger } from '@hl8/logger';
import { TenantContextService } from '@hl8/multi-tenancy';

describe('BaseAggregateRoot', () => {
  let aggregate: TestAggregate;
  let logger: PinoLogger;
  let tenantContext: TenantContextService;

  class TestEvent extends DomainEvent {
    constructor(
      public readonly aggregateId: EntityId,
      public readonly data: string
    ) {
      super();
    }
  }

  class TestAggregate extends BaseAggregateRoot {
    constructor(id: EntityId, private name: string, private email: string) {
      super(id);
    }

    getName(): string {
      return this.name;
    }

    getEmail(): string {
      return this.email;
    }

    createUser(): void {
      this.addDomainEvent(new TestEvent(this.id, 'User created'));
    }

    updateUser(newName: string, newEmail: string): void {
      this.name = newName;
      this.email = newEmail;
      this.addDomainEvent(new TestEvent(this.id, 'User updated'));
    }

    performComplexOperation(): void {
      this.addDomainEvent(new TestEvent(this.id, 'Operation 1'));
      this.addDomainEvent(new TestEvent(this.id, 'Operation 2'));
      this.addDomainEvent(new TestEvent(this.id, 'Operation 3'));
    }
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PinoLogger,
          useValue: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
        {
          provide: TenantContextService,
          useValue: {
            getCurrentTenantId: jest.fn().mockReturnValue('tenant-123'),
            getCurrentUserId: jest.fn().mockReturnValue('user-123'),
          },
        },
      ],
    }).compile();

    logger = module.get<PinoLogger>(PinoLogger);
    tenantContext = module.get<TenantContextService>(TenantContextService);

    aggregate = new TestAggregate(
      EntityId.generate(),
      'Test User',
      'test@example.com'
    );
  });

  describe('构造函数', () => {
    it('应该正确初始化聚合根', () => {
      expect(aggregate).toBeDefined();
      expect(aggregate.id).toBeDefined();
      expect(aggregate.getName()).toBe('Test User');
      expect(aggregate.getEmail()).toBe('test@example.com');
    });

    it('应该初始化空的事件列表', () => {
      expect(aggregate.getUncommittedEvents()).toEqual([]);
      expect(aggregate.getDomainEvents()).toEqual([]);
    });
  });

  describe('领域事件管理', () => {
    it('应该添加领域事件', () => {
      aggregate.createUser();

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TestEvent);
    });

    it('应该添加多个领域事件', () => {
      aggregate.performComplexOperation();

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(3);
    });

    it('应该获取未提交的事件', () => {
      aggregate.createUser();
      aggregate.updateUser('New Name', 'new@example.com');

      const uncommittedEvents = aggregate.getUncommittedEvents();
      expect(uncommittedEvents).toHaveLength(2);
    });

    it('应该获取所有领域事件', () => {
      aggregate.createUser();
      aggregate.markEventsAsCommitted();
      aggregate.updateUser('New Name', 'new@example.com');

      const allEvents = aggregate.getDomainEvents();
      expect(allEvents).toHaveLength(2);
    });
  });

  describe('事件提交', () => {
    it('应该标记事件为已提交', () => {
      aggregate.createUser();
      aggregate.markEventsAsCommitted();

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
      expect(aggregate.getDomainEvents()).toHaveLength(1);
    });

    it('应该清除未提交的事件', () => {
      aggregate.createUser();
      aggregate.updateUser('New Name', 'new@example.com');
      aggregate.clearUncommittedEvents();

      expect(aggregate.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('事件重放', () => {
    it('应该重放事件', () => {
      const events = [
        new TestEvent(aggregate.id, 'Event 1'),
        new TestEvent(aggregate.id, 'Event 2'),
        new TestEvent(aggregate.id, 'Event 3'),
      ];

      aggregate.replayEvents(events);

      expect(aggregate.getDomainEvents()).toHaveLength(3);
    });

    it('应该按顺序重放事件', () => {
      const events = [
        new TestEvent(aggregate.id, 'First'),
        new TestEvent(aggregate.id, 'Second'),
        new TestEvent(aggregate.id, 'Third'),
      ];

      aggregate.replayEvents(events);

      const replayedEvents = aggregate.getDomainEvents();
      expect(replayedEvents[0].data).toBe('First');
      expect(replayedEvents[1].data).toBe('Second');
      expect(replayedEvents[2].data).toBe('Third');
    });
  });

  describe('事件查询', () => {
    it('应该按类型查询事件', () => {
      aggregate.createUser();
      aggregate.updateUser('New Name', 'new@example.com');

      const userEvents = aggregate.getEventsByType(TestEvent.name);
      expect(userEvents).toHaveLength(2);
    });

    it('应该检查是否有未提交的事件', () => {
      expect(aggregate.hasUncommittedEvents()).toBe(false);

      aggregate.createUser();
      expect(aggregate.hasUncommittedEvents()).toBe(true);

      aggregate.markEventsAsCommitted();
      expect(aggregate.hasUncommittedEvents()).toBe(false);
    });

    it('应该获取未提交事件数量', () => {
      expect(aggregate.getUncommittedEventCount()).toBe(0);

      aggregate.createUser();
      expect(aggregate.getUncommittedEventCount()).toBe(1);

      aggregate.updateUser('New Name', 'new@example.com');
      expect(aggregate.getUncommittedEventCount()).toBe(2);
    });
  });

  describe('事件过滤', () => {
    it('应该按条件过滤事件', () => {
      aggregate.createUser();
      aggregate.updateUser('New Name', 'new@example.com');

      const filteredEvents = aggregate.getEventsByCondition(
        (event: DomainEvent) =>
          event instanceof TestEvent &&
          (event as TestEvent).data.includes('created')
      );

      expect(filteredEvents).toHaveLength(1);
    });

    it('应该按时间范围过滤事件', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      aggregate.createUser();

      const recentEvents = aggregate.getEventsByTimeRange(oneHourAgo, now);
      expect(recentEvents).toHaveLength(1);
    });
  });

  describe('事件统计', () => {
    it('应该统计事件数量', () => {
      aggregate.createUser();
      aggregate.updateUser('New Name', 'new@example.com');

      expect(aggregate.getEventCount()).toBe(2);
    });

    it('应该统计按类型的事件数量', () => {
      aggregate.createUser();
      aggregate.updateUser('New Name', 'new@example.com');

      const eventCounts = aggregate.getEventCountsByType();
      expect(eventCounts[TestEvent.name]).toBe(2);
    });
  });

  describe('事件清理', () => {
    it('应该清理旧事件', () => {
      aggregate.createUser();
      aggregate.markEventsAsCommitted();
      aggregate.updateUser('New Name', 'new@example.com');

      const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1天前
      aggregate.cleanupOldEvents(oldDate);

      // 应该保留最近的事件
      expect(aggregate.getDomainEvents()).toHaveLength(1);
    });
  });

  describe('事件验证', () => {
    it('应该验证事件完整性', () => {
      aggregate.createUser();

      const isValid = aggregate.validateEvents();
      expect(isValid).toBe(true);
    });

    it('应该检测无效事件', () => {
      // 添加无效事件（这里需要根据实际实现调整）
      aggregate.addDomainEvent(null as any);

      const isValid = aggregate.validateEvents();
      expect(isValid).toBe(false);
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量事件', () => {
      const startTime = Date.now();

      // 添加1000个事件
      for (let i = 0; i < 1000; i++) {
        aggregate.addDomainEvent(new TestEvent(aggregate.id, `Event ${i}`));
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // 应该在100ms内完成
      expect(aggregate.getEventCount()).toBe(1000);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效事件', () => {
      expect(() => {
        aggregate.addDomainEvent(null as any);
      }).toThrow();
    });

    it('应该处理空事件列表', () => {
      expect(() => {
        aggregate.replayEvents([]);
      }).not.toThrow();
    });
  });

  describe('并发安全', () => {
    it('应该支持并发事件添加', async () => {
      const promises = [];

      // 并发添加事件
      for (let i = 0; i < 100; i++) {
        promises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              aggregate.addDomainEvent(
                new TestEvent(aggregate.id, `Concurrent Event ${i}`)
              );
              resolve(undefined);
            }, Math.random() * 10);
          })
        );
      }

      await Promise.all(promises);

      expect(aggregate.getEventCount()).toBe(100);
    });
  });
});
