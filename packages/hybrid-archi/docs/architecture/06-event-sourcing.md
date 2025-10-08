# 事件溯源 (Event Sourcing) 设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  

---

## 📋 目录

- [1. 事件溯源概述](#1-事件溯源概述)
- [2. 核心概念](#2-核心概念)
- [3. 架构设计](#3-架构设计)
- [4. 实现指南](#4-实现指南)
- [5. 最佳实践](#5-最佳实践)

---

## 1. 事件溯源概述

### 1.1 定义

事件溯源 (Event Sourcing) 是一种数据持久化模式，不直接存储对象的当前状态，而是存储导致状态变化的所有事件序列。

### 1.2 核心思想

```
传统方式（状态存储）:
┌─────────────┐
│   Current   │
│    State    │  ← 只保存当前状态
│  (Latest)   │
└─────────────┘

事件溯源方式:
┌─────────────┐
│   Event 1   │  ← 用户创建
├─────────────┤
│   Event 2   │  ← 邮箱更新
├─────────────┤
│   Event 3   │  ← 状态激活
└─────────────┘
      ↓
   重建状态
      ↓
┌─────────────┐
│   Current   │
│    State    │
└─────────────┘
```

### 1.3 优势

- ✅ **完整的审计追踪**：记录所有状态变更
- ✅ **时间旅行**：可以重建任意时间点的状态
- ✅ **事件回放**：支持调试和分析
- ✅ **最终一致性**：通过事件实现
- ✅ **业务洞察**：事件流提供业务分析数据

### 1.4 挑战

- ⚠️ **复杂性增加**：需要处理事件版本管理
- ⚠️ **性能考虑**：事件过多时需要快照优化
- ⚠️ **查询复杂**：需要事件投影到读模型
- ⚠️ **事件演化**：需要处理事件结构变化

---

## 2. 核心概念

### 2.1 事件流 (Event Stream)

事件流是聚合根的所有状态变更事件的有序序列。

```typescript
/**
 * 用户聚合的事件流示例
 */
Event Stream for User-123:
[
  {
    eventId: "evt-001",
    eventType: "UserCreated",
    aggregateId: "user-123",
    version: 1,
    occurredOn: "2025-01-27T10:00:00Z",
    data: {
      userId: "user-123",
      name: "张三",
      email: "zhangsan@example.com"
    }
  },
  {
    eventId: "evt-002",
    eventType: "UserEmailUpdated",
    aggregateId: "user-123",
    version: 2,
    occurredOn: "2025-01-27T11:00:00Z",
    data: {
      oldEmail: "zhangsan@example.com",
      newEmail: "zhangsan@newdomain.com"
    }
  },
  {
    eventId: "evt-003",
    eventType: "UserActivated",
    aggregateId: "user-123",
    version: 3,
    occurredOn: "2025-01-27T12:00:00Z",
    data: {
      activatedBy: "admin-456"
    }
  }
]
```

### 2.2 状态重建 (State Reconstruction)

通过重放事件流重建聚合根的当前状态。

```typescript
/**
 * 从事件流重建聚合根
 */
export class UserAggregate extends BaseAggregateRoot {
  /**
   * 从事件流重建聚合根
   */
  static fromEvents(events: DomainEvent[]): UserAggregate {
    // 1. 创建空的聚合根实例
    const aggregate = new UserAggregate(
      EntityId.fromString(events[0].aggregateId.toString()),
      null as any,  // 暂时为空
      { createdBy: 'system', tenantId: events[0].tenantId }
    );
    
    // 2. 按顺序应用每个事件
    events.forEach(event => {
      aggregate.apply(event);
    });
    
    return aggregate;
  }

  /**
   * 应用事件到聚合根
   */
  private apply(event: DomainEvent): void {
    switch (event.eventType) {
      case 'UserCreated':
        this.applyUserCreated(event as UserCreatedEvent);
        break;
      case 'UserEmailUpdated':
        this.applyUserEmailUpdated(event as UserEmailUpdatedEvent);
        break;
      case 'UserActivated':
        this.applyUserActivated(event as UserActivatedEvent);
        break;
      default:
        throw new Error(`Unknown event type: ${event.eventType}`);
    }
    
    // 更新版本号
    this._version = event.version;
  }

  private applyUserCreated(event: UserCreatedEvent): void {
    const email = Email.create(event.userEmail);
    this._user = User.create(event.userName, email, event.tenantId);
  }

  private applyUserEmailUpdated(event: UserEmailUpdatedEvent): void {
    const newEmail = Email.create(event.newEmail);
    this._user.updateEmail(newEmail);
  }

  private applyUserActivated(event: UserActivatedEvent): void {
    this._user.activate();
  }
}
```

### 2.3 快照 (Snapshot)

当事件数量过多时，使用快照优化性能。

```typescript
/**
 * 聚合快照接口
 */
export interface IAggregateSnapshot {
  aggregateId: string;
  aggregateType: string;
  version: number;
  state: Record<string, unknown>;
  createdAt: Date;
}

/**
 * 使用快照优化状态重建
 */
export class UserAggregate extends BaseAggregateRoot {
  static fromSnapshot(
    snapshot: IAggregateSnapshot,
    eventsSinceSnapshot: DomainEvent[]
  ): UserAggregate {
    // 1. 从快照恢复状态
    const aggregate = this.restoreFromSnapshot(snapshot);
    
    // 2. 应用快照后的事件
    eventsSinceSnapshot.forEach(event => {
      aggregate.apply(event);
    });
    
    return aggregate;
  }

  private static restoreFromSnapshot(snapshot: IAggregateSnapshot): UserAggregate {
    const state = snapshot.state;
    const email = Email.create(state.email as string);
    const user = User.create(state.name as string, email, state.tenantId as string);
    
    const aggregate = new UserAggregate(
      EntityId.fromString(snapshot.aggregateId),
      user,
      { createdBy: 'system', tenantId: state.tenantId as string }
    );
    
    aggregate._version = snapshot.version;
    return aggregate;
  }

  /**
   * 创建快照
   */
  toSnapshot(): IAggregateSnapshot {
    return {
      aggregateId: this.id.toString(),
      aggregateType: 'User',
      version: this.version,
      state: {
        name: this._user.name,
        email: this._user.email.value,
        status: this._user.status,
        tenantId: this.tenantId,
      },
      createdAt: new Date(),
    };
  }
}
```

### 2.4 事件存储 (Event Store)

```typescript
/**
 * 事件存储接口
 */
export interface IEventStore {
  /**
   * 保存事件流
   */
  saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion?: number
  ): Promise<void>;

  /**
   * 获取事件流
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number
  ): Promise<DomainEvent[]>;

  /**
   * 保存快照
   */
  saveSnapshot(snapshot: IAggregateSnapshot): Promise<void>;

  /**
   * 获取快照
   */
  getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null>;
}
```

---

## 3. 架构设计

### 3.1 事件溯源架构图

```
┌─────────────────────────────────────────────────────────────┐
│                 Event Sourcing Architecture                  │
└─────────────────────────────────────────────────────────────┘

写入流程:
┌──────────┐    ┌─────────────┐    ┌──────────┐
│ Command  │───▶│  Aggregate  │───▶│  Event   │
│          │    │    Root     │    │          │
└──────────┘    └─────────────┘    └────┬─────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │  Event   │
                                 │  Store   │
                                 └────┬─────┘
                                      │
                                      ▼
                                 ┌──────────┐
                                 │Event Bus │
                                 └────┬─────┘
                                      │
                                      ▼
                                 ┌──────────┐
                                 │Projectors│
                                 └────┬─────┘
                                      │
                                      ▼
                                 ┌──────────┐
                                 │  Read    │
                                 │  Model   │
                                 └──────────┘

读取流程:
┌──────────┐    ┌──────────┐    ┌─────────────┐
│  Query   │───▶│  Event   │───▶│  Aggregate  │
│          │    │  Store   │    │    Root     │
└──────────┘    └──────────┘    └─────────────┘
                                      │
                                      ▼ Apply Events
                                 ┌─────────────┐
                                 │   Current   │
                                 │    State    │
                                 └─────────────┘
```

### 3.2 快照优化架构

```
无快照时：
Events: [1...1000] ───▶ Apply All ───▶ Current State
                       (慢，1000个事件)

有快照时：
Snapshot (V800) + Events: [801...1000] ───▶ Current State
                                            (快，200个事件)

快照策略：
- 每100个事件创建一次快照
- 或每小时创建一次快照
- 或按需创建快照
```

---

## 4. 实现指南

将在后续部分详细说明...

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
