# 🎯 事件溯源在混合架构中的位置

## 📋 概述

本文档专门展示事件溯源（Event Sourcing）在混合架构中的具体位置和实现方式。

---

## 🏗️ 事件溯源在架构中的位置

### 1. 整体架构中的位置

```mermaid
graph TB
    subgraph "混合架构中的事件溯源"
        subgraph "领域层 (Domain Layer)"
            DOMAIN_EVENTS["领域事件<br/>📢 事件发布"]
            AGGREGATE_ROOT["聚合根<br/>📦 事件收集"]
        end
        
        subgraph "应用层 (Application Layer)"
            CQRS_BUS["CQRS总线<br/>🚌 事件路由"]
            EVENT_HANDLERS["事件处理器<br/>⚙️ 事件处理"]
        end
        
        subgraph "基础设施层 (Infrastructure Layer)"
            EVENT_STORE_ADAPTER["事件存储适配器<br/>📚 事件持久化"]
            EVENT_STORE_FACTORY["事件存储工厂<br/>🏭 服务创建"]
            EVENT_STORE_MANAGER["事件存储管理器<br/>🔧 服务管理"]
        end
        
        subgraph "外部依赖"
            DATABASE["数据库<br/>🗄️ 事件存储"]
            CACHE["缓存<br/>💾 性能优化"]
            MESSAGE_QUEUE["消息队列<br/>📨 事件分发"]
        end
    end
    
    AGGREGATE_ROOT --> DOMAIN_EVENTS
    DOMAIN_EVENTS --> CQRS_BUS
    CQRS_BUS --> EVENT_HANDLERS
    
    EVENT_HANDLERS --> EVENT_STORE_ADAPTER
    EVENT_STORE_ADAPTER --> DATABASE
    EVENT_STORE_ADAPTER --> CACHE
    EVENT_STORE_ADAPTER --> MESSAGE_QUEUE
    
    EVENT_STORE_FACTORY --> EVENT_STORE_ADAPTER
    EVENT_STORE_MANAGER --> EVENT_STORE_ADAPTER
    
    style DOMAIN_EVENTS fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style EVENT_STORE_ADAPTER fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style DATABASE fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
```

### 2. 事件溯源数据流

```mermaid
sequenceDiagram
    participant AR as 聚合根
    participant DE as 领域事件
    participant ES as 事件存储
    participant DB as 数据库
    participant MQ as 消息队列
    participant EH as 事件处理器
    
    Note over AR, EH: 事件溯源完整流程
    
    AR->>DE: 1. 发布领域事件
    DE->>ES: 2. 存储事件
    ES->>DB: 3. 持久化事件
    DB-->>ES: 4. 确认存储
    ES->>MQ: 5. 发布消息
    MQ-->>ES: 6. 确认发布
    ES-->>DE: 7. 确认存储
    
    Note over AR, EH: 事件重放流程
    EH->>ES: 8. 请求事件流
    ES->>DB: 9. 查询事件
    DB-->>ES: 10. 返回事件
    ES-->>EH: 11. 返回事件流
    EH->>EH: 12. 重放事件
```

---

## 📁 事件溯源在代码中的具体位置

### 1. 领域层事件溯源

#### 位置：`packages/hybrid-archi/src/domain/events/`

```typescript
// 基础领域事件
export class BaseDomainEvent {
  // 事件ID、聚合根ID、事件类型、事件数据等
  // 支持事件版本控制
  // 支持事件元数据
}

// 领域事件类型
export interface IDomainEvent {
  eventId: string;
  aggregateId: string;
  eventType: string;
  eventData: unknown;
  eventVersion: number;
  occurredAt: Date;
}
```

### 2. 应用层事件溯源

#### 位置：`packages/hybrid-archi/src/application/cqrs/event-store/`

```typescript
// 事件存储接口
export interface IEventStore {
  saveEvents(aggregateId: string, events: IDomainEvent[]): Promise<void>;
  getEvents(aggregateId: string): Promise<IDomainEvent[]>;
  getEventsFromVersion(aggregateId: string, fromVersion: number): Promise<IDomainEvent[]>;
}

// 事件流结果
export interface IEventStreamResult {
  events: IDomainEvent[];
  nextVersion: number;
  hasMore: boolean;
}
```

### 3. 基础设施层事件溯源

#### 位置：`packages/hybrid-archi/src/infrastructure/adapters/event-store/`

```typescript
// 事件存储适配器
@Injectable()
export class EventStoreAdapter implements IEventStore {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly logger: Logger
  ) {}
  
  async saveEvents(aggregateId: string, events: IDomainEvent[]): Promise<void> {
    // 实现事件存储逻辑
  }
  
  async getEvents(aggregateId: string): Promise<IDomainEvent[]> {
    // 实现事件检索逻辑
  }
}

// 事件存储工厂
@Injectable()
export class EventStoreFactory {
  createEventStore(config: IEventStoreConfig): EventStoreAdapter {
    // 创建事件存储实例
  }
}

// 事件存储管理器
@Injectable()
export class EventStoreManager {
  // 管理事件存储服务
}
```

---

## 🔧 事件溯源的核心功能

### 1. 事件存储功能

```mermaid
graph TB
    subgraph "事件存储功能"
        SAVE_EVENTS["保存事件<br/>💾 事件持久化"]
        GET_EVENTS["获取事件<br/>📖 事件检索"]
        GET_EVENTS_FROM_VERSION["从版本获取事件<br/>🔄 版本控制"]
        GET_EVENTS_BY_TYPE["按类型获取事件<br/>🔍 类型过滤"]
        GET_EVENTS_BY_TIME["按时间获取事件<br/>⏰ 时间过滤"]
    end
    
    SAVE_EVENTS --> GET_EVENTS
    GET_EVENTS --> GET_EVENTS_FROM_VERSION
    GET_EVENTS_FROM_VERSION --> GET_EVENTS_BY_TYPE
    GET_EVENTS_BY_TYPE --> GET_EVENTS_BY_TIME
    
    style SAVE_EVENTS fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style GET_EVENTS fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
```

### 2. 事件重放功能

```mermaid
graph TB
    subgraph "事件重放功能"
        REPLAY_EVENTS["重放事件<br/>🔄 状态重建"]
        REPLAY_FROM_VERSION["从版本重放<br/>📋 版本控制"]
        REPLAY_FROM_TIME["从时间重放<br/>⏰ 时间控制"]
        REPLAY_WITH_SNAPSHOT["快照重放<br/>📸 性能优化"]
    end
    
    REPLAY_EVENTS --> REPLAY_FROM_VERSION
    REPLAY_FROM_VERSION --> REPLAY_FROM_TIME
    REPLAY_FROM_TIME --> REPLAY_WITH_SNAPSHOT
    
    style REPLAY_EVENTS fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style REPLAY_WITH_SNAPSHOT fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

### 3. 事件版本控制

```mermaid
graph TB
    subgraph "事件版本控制"
        EVENT_VERSION["事件版本<br/>📋 版本管理"]
        AGGREGATE_VERSION["聚合版本<br/>📦 聚合版本"]
        EVENT_MIGRATION["事件迁移<br/>🔄 版本升级"]
        BACKWARD_COMPATIBILITY["向后兼容<br/>🔙 兼容性"]
    end
    
    EVENT_VERSION --> AGGREGATE_VERSION
    AGGREGATE_VERSION --> EVENT_MIGRATION
    EVENT_MIGRATION --> BACKWARD_COMPATIBILITY
    
    style EVENT_VERSION fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style BACKWARD_COMPATIBILITY fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

---

## 🎯 事件溯源的优势

### 1. 审计跟踪

```mermaid
graph LR
    subgraph "审计跟踪优势"
        COMPLETE_HISTORY["完整历史<br/>📝 所有事件记录"]
        AUDIT_TRAIL["审计跟踪<br/>🔍 操作追踪"]
        TEMPORAL_QUERIES["时间查询<br/>⏰ 历史状态查询"]
        DEBUGGING["调试能力<br/>🐛 事件重放调试"]
    end
    
    COMPLETE_HISTORY --> AUDIT_TRAIL
    AUDIT_TRAIL --> TEMPORAL_QUERIES
    TEMPORAL_QUERIES --> DEBUGGING
    
    style COMPLETE_HISTORY fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style DEBUGGING fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

### 2. 性能优化

```mermaid
graph LR
    subgraph "性能优化"
        SNAPSHOTS["快照<br/>📸 状态快照"]
        CACHING["缓存<br/>💾 事件缓存"]
        SHARDING["分片<br/>🔀 事件分片"]
        COMPRESSION["压缩<br/>🗜️ 事件压缩"]
    end
    
    SNAPSHOTS --> CACHING
    CACHING --> SHARDING
    SHARDING --> COMPRESSION
    
    style SNAPSHOTS fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style COMPRESSION fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

---

## 📚 事件溯源使用示例

### 1. 创建事件存储

```typescript
import { EventStoreAdapter } from '@hl8/hybrid-archi/infrastructure';
import { DatabaseService } from '@hl8/database';
import { CacheService } from '@hl8/cache';
import { Logger } from '@hl8/logger';

// 创建事件存储适配器
const eventStore = new EventStoreAdapter(
  databaseService,
  cacheService,
  logger
);
```

### 2. 保存事件

```typescript
// 保存领域事件
await eventStore.saveEvents(aggregateId, [
  new UserCreatedEvent(userId, userData),
  new UserActivatedEvent(userId, activationData)
]);
```

### 3. 重放事件

```typescript
// 获取所有事件
const events = await eventStore.getEvents(aggregateId);

// 从特定版本获取事件
const eventsFromVersion = await eventStore.getEventsFromVersion(
  aggregateId, 
  fromVersion
);

// 重放事件重建聚合状态
const aggregate = events.reduce((acc, event) => {
  return acc.apply(event);
}, new UserAggregate());
```

---

## 🎯 总结

事件溯源在混合架构中的位置：

1. **领域层**: 通过 `BaseDomainEvent` 和聚合根发布领域事件
2. **应用层**: 通过 `IEventStore` 接口定义事件存储契约
3. **基础设施层**: 通过 `EventStoreAdapter` 实现具体的事件存储逻辑

事件溯源提供了：

- ✅ **完整的事件历史记录**
- ✅ **审计跟踪能力**
- ✅ **事件重放功能**
- ✅ **时间查询能力**
- ✅ **调试和故障排除能力**

事件溯源是混合架构中实现完整审计跟踪和状态重建的核心技术！
