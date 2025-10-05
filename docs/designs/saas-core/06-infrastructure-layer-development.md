# SAAS-CORE 基础设施层开发指南

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 基础设施层设计原则](#1-基础设施层设计原则)
- [2. 适配器模式实现](#2-适配器模式实现)
- [3. 仓储适配器](#3-仓储适配器)
- [4. 事件存储实现](#4-事件存储实现)
- [5. 服务适配器](#5-服务适配器)
- [6. 映射器实现](#6-映射器实现)
- [7. 多租户支持](#7-多租户支持)
- [8. 代码示例](#8-代码示例)

---

## 1. 基础设施层设计原则

### 1.1 适配器模式实现

基础设施层是 Hybrid Architecture 的技术实现层，负责提供技术服务和外部系统集成。基础设施层应该：

- **技术实现集中**: 所有技术实现在基础设施层统一管理
- **外部依赖隔离**: 隔离外部系统依赖
- **适配器模式**: 使用适配器模式实现接口适配
- **可替换性**: 支持技术实现的替换和升级

### 1.2 基础设施层组件结构

```text
基础设施层 (Infrastructure Layer)
├── 适配器 (Adapters)
│   ├── 端口适配器 (Port Adapters)
│   ├── 仓储适配器 (Repository Adapters)
│   ├── 服务适配器 (Service Adapters)
│   └── 事件存储适配器 (Event Store Adapters)
├── 事件溯源 (Event Sourcing)
│   ├── 事件存储实现 (Event Store Implementation)
│   └── 快照存储实现 (Snapshot Store Implementation)
├── 事件驱动架构 (Event-Driven Architecture)
│   ├── 死信队列 (Dead Letter Queue)
│   └── 事件监控 (Event Monitor)
├── 工厂 (Factories)
│   ├── 基础设施工厂 (Infrastructure Factory)
│   └── 基础设施管理器 (Infrastructure Manager)
└── 映射器 (Mappers)
    ├── 领域映射器 (Domain Mappers)
    └── DTO映射器 (DTO Mappers)
```

### 1.3 事件溯源支持

**事件存储实现**:

- **事件持久化**: 支持事件的持久化存储
- **事件检索**: 支持事件的查询和检索
- **快照管理**: 支持聚合状态的快照机制
- **并发控制**: 支持乐观并发控制

### 1.4 事件驱动支持

**消息队列实现**:

- **事件发布**: 支持事件的异步发布
- **事件订阅**: 支持事件的订阅和处理
- **死信队列**: 支持失败事件的处理
- **事件监控**: 支持事件的监控和统计

### 1.5 多租户支持

**租户隔离**:

- **数据隔离**: 确保租户数据的物理隔离
- **缓存隔离**: 支持租户级别的缓存隔离
- **消息隔离**: 支持租户级别的消息隔离
- **监控隔离**: 支持租户级别的监控隔离

---

## 2. 适配器模式实现

### 2.1 仓储适配器实现

```typescript
// src/infrastructure/adapters/repositories/tenant.repository.adapter.ts
@Injectable()
export class TenantRepositoryAdapter implements ITenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly repository: Repository<TenantEntity>,
    private readonly tenantMapper: TenantMapper
  ) {}

  async save(aggregate: TenantAggregate): Promise<void> {
    const entity = this.tenantMapper.toEntity(aggregate);
    await this.repository.save(entity);
  }

  async findById(id: TenantId): Promise<TenantAggregate | null> {
    const entity = await this.repository.findOne({ 
      where: { id: id.getValue() } 
    });
    return entity ? this.tenantMapper.toAggregate(entity) : null;
  }

  async findByCode(code: string): Promise<TenantAggregate | null> {
    const entity = await this.repository.findOne({ 
      where: { code } 
    });
    return entity ? this.tenantMapper.toAggregate(entity) : null;
  }

  async findAll(): Promise<TenantAggregate[]> {
    const entities = await this.repository.find();
    return entities.map(entity => this.tenantMapper.toAggregate(entity));
  }

  async delete(id: TenantId): Promise<void> {
    await this.repository.delete(id.getValue());
  }
}
```

### 2.2 用户仓储适配器

```typescript
// src/infrastructure/adapters/repositories/user.repository.adapter.ts
@Injectable()
export class UserRepositoryAdapter implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>,
    private readonly userMapper: UserMapper
  ) {}

  async save(aggregate: UserAggregate): Promise<void> {
    const entity = this.userMapper.toEntity(aggregate);
    await this.repository.save(entity);
  }

  async findById(id: UserId): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ 
      where: { id: id.getValue() } 
    });
    return entity ? this.userMapper.toAggregate(entity) : null;
  }

  async findByEmail(email: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ 
      where: { email } 
    });
    return entity ? this.userMapper.toAggregate(entity) : null;
  }

  async findByUsername(username: string): Promise<UserAggregate | null> {
    const entity = await this.repository.findOne({ 
      where: { username } 
    });
    return entity ? this.userMapper.toAggregate(entity) : null;
  }

  async findByTenantId(tenantId: TenantId): Promise<UserAggregate[]> {
    const entities = await this.repository.find({ 
      where: { tenantId: tenantId.getValue() } 
    });
    return entities.map(entity => this.userMapper.toAggregate(entity));
  }

  async delete(id: UserId): Promise<void> {
    await this.repository.delete(id.getValue());
  }
}
```

---

## 3. 仓储适配器

### 3.1 多租户仓储适配器

```typescript
// src/infrastructure/adapters/repositories/multi-tenant.repository.adapter.ts
@Injectable()
export class MultiTenantRepositoryAdapter implements ITenantRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly tenantDatabaseService: TenantDatabaseService,
    private readonly tenantMapper: TenantMapper
  ) {}

  async save(aggregate: TenantAggregate): Promise<void> {
    const entity = this.tenantMapper.toEntity(aggregate);
    
    // 使用租户数据库服务保存数据
    await this.tenantDatabaseService.saveTenant(entity);
  }

  async findById(id: TenantId): Promise<TenantAggregate | null> {
    const entity = await this.tenantDatabaseService.findTenantById(id.getValue());
    return entity ? this.tenantMapper.toAggregate(entity) : null;
  }

  async findByCode(code: string): Promise<TenantAggregate | null> {
    const entity = await this.tenantDatabaseService.findTenantByCode(code);
    return entity ? this.tenantMapper.toAggregate(entity) : null;
  }

  async findAll(): Promise<TenantAggregate[]> {
    const entities = await this.tenantDatabaseService.findAllTenants();
    return entities.map(entity => this.tenantMapper.toAggregate(entity));
  }

  async delete(id: TenantId): Promise<void> {
    await this.tenantDatabaseService.deleteTenant(id.getValue());
  }
}
```

### 3.2 缓存仓储适配器

```typescript
// src/infrastructure/adapters/repositories/cached-tenant.repository.adapter.ts
@Injectable()
export class CachedTenantRepositoryAdapter implements ITenantRepository {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly cacheAdapter: CacheAdapter
  ) {}

  async save(aggregate: TenantAggregate): Promise<void> {
    await this.tenantRepository.save(aggregate);
    
    // 更新缓存
    const cacheKey = `tenant:${aggregate.getTenantId().getValue()}`;
    await this.cacheAdapter.set(cacheKey, aggregate, 3600); // 1小时过期
  }

  async findById(id: TenantId): Promise<TenantAggregate | null> {
    const cacheKey = `tenant:${id.getValue()}`;
    
    // 尝试从缓存获取
    const cached = await this.cacheAdapter.get<TenantAggregate>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const aggregate = await this.tenantRepository.findById(id);
    if (aggregate) {
      // 更新缓存
      await this.cacheAdapter.set(cacheKey, aggregate, 3600);
    }

    return aggregate;
  }

  async findByCode(code: string): Promise<TenantAggregate | null> {
    const cacheKey = `tenant:code:${code}`;
    
    // 尝试从缓存获取
    const cached = await this.cacheAdapter.get<TenantAggregate>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从数据库获取
    const aggregate = await this.tenantRepository.findByCode(code);
    if (aggregate) {
      // 更新缓存
      await this.cacheAdapter.set(cacheKey, aggregate, 3600);
    }

    return aggregate;
  }

  async findAll(): Promise<TenantAggregate[]> {
    // 列表查询通常不缓存，直接查询数据库
    return await this.tenantRepository.findAll();
  }

  async delete(id: TenantId): Promise<void> {
    await this.tenantRepository.delete(id);
    
    // 清除缓存
    const cacheKey = `tenant:${id.getValue()}`;
    await this.cacheAdapter.delete(cacheKey);
  }
}
```

---

## 4. 事件存储实现

### 4.1 事件存储适配器

```typescript
// src/infrastructure/adapters/event-store/event-store.adapter.ts
@Injectable()
export class EventStoreAdapter implements IEventStore {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectRepository(SnapshotEntity)
    private readonly snapshotRepository: Repository<SnapshotEntity>
  ) {}

  async saveEvents(aggregateId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    // 乐观并发控制
    const existingEvents = await this.eventRepository.count({
      where: { aggregateId }
    });

    if (existingEvents !== expectedVersion) {
      throw new ConcurrencyException('聚合版本不匹配');
    }

    // 保存事件
    const eventEntities = events.map((event, index) => 
      EventEntity.create(
        aggregateId,
        expectedVersion + index + 1,
        event.constructor.name,
        event,
        new Date()
      )
    );

    await this.eventRepository.save(eventEntities);
  }

  async getEvents(aggregateId: string, fromVersion: number = 0): Promise<DomainEvent[]> {
    const entities = await this.eventRepository.find({
      where: { 
        aggregateId,
        version: MoreThan(fromVersion)
      },
      order: { version: 'ASC' }
    });

    return entities.map(entity => this.deserializeEvent(entity));
  }

  async saveSnapshot(aggregateId: string, aggregate: AggregateRoot): Promise<void> {
    const snapshot = SnapshotEntity.create(
      aggregateId,
      aggregate,
      new Date()
    );

    await this.snapshotRepository.save(snapshot);
  }

  async getSnapshot(aggregateId: string): Promise<SnapshotEntity | null> {
    return await this.snapshotRepository.findOne({
      where: { aggregateId },
      order: { createdAt: 'DESC' }
    });
  }

  private deserializeEvent(entity: EventEntity): DomainEvent {
    // 反序列化事件
    const eventClass = this.getEventClass(entity.eventType);
    return Object.assign(new eventClass(), entity.eventData);
  }

  private getEventClass(eventType: string): any {
    // 根据事件类型获取事件类
    const eventClasses = {
      'TenantCreatedEvent': TenantCreatedEvent,
      'TenantActivatedEvent': TenantActivatedEvent,
      'UserRegisteredEvent': UserRegisteredEvent,
      'UserActivatedEvent': UserActivatedEvent,
      // ... 其他事件类
    };

    return eventClasses[eventType];
  }
}
```

### 4.2 事件发布适配器

```typescript
// src/infrastructure/adapters/event-store/event-publisher.adapter.ts
@Injectable()
export class EventPublisherAdapter implements IEventBus {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly eventStore: IEventStore,
    private readonly logger: ILoggerPort
  ) {}

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      try {
        await this.publish(event);
      } catch (error) {
        this.logger.error('事件发布失败', { event, error });
        // 保存到死信队列
        await this.saveToDeadLetterQueue(event, error);
      }
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    // 发布到消息队列
    const message = {
      eventType: event.constructor.name,
      eventData: event,
      timestamp: new Date(),
      eventId: uuidv4()
    };

    await this.messagingService.publish('domain-events', message);
  }

  private async saveToDeadLetterQueue(event: DomainEvent, error: Error): Promise<void> {
    const deadLetterMessage = {
      eventType: event.constructor.name,
      eventData: event,
      error: error.message,
      timestamp: new Date(),
      retryCount: 0
    };

    await this.messagingService.publish('dead-letter-queue', deadLetterMessage);
  }
}
```

---

## 5. 服务适配器

### 5.1 邮件服务适配器

```typescript
// src/infrastructure/adapters/services/email.service.adapter.ts
@Injectable()
export class EmailServiceAdapter implements IEmailService {
  constructor(
    private readonly emailProvider: IEmailProvider,
    private readonly emailMapper: EmailMapper,
    private readonly logger: ILoggerPort
  ) {}

  async sendWelcomeEmail(adminEmail: string, adminName: string, tenantName: string): Promise<void> {
    try {
      const email = this.emailMapper.createWelcomeEmail(adminEmail, adminName, tenantName);
      await this.emailProvider.send(email);
      this.logger.info('欢迎邮件发送成功', { adminEmail, tenantName });
    } catch (error) {
      this.logger.error('欢迎邮件发送失败', { adminEmail, tenantName, error });
      throw error;
    }
  }

  async sendActivationConfirmation(tenantId: string): Promise<void> {
    try {
      const email = this.emailMapper.createActivationConfirmation(tenantId);
      await this.emailProvider.send(email);
      this.logger.info('激活确认邮件发送成功', { tenantId });
    } catch (error) {
      this.logger.error('激活确认邮件发送失败', { tenantId, error });
      throw error;
    }
  }

  async sendSuspensionNotification(tenantId: string, reason: string): Promise<void> {
    try {
      const email = this.emailMapper.createSuspensionNotification(tenantId, reason);
      await this.emailProvider.send(email);
      this.logger.info('暂停通知邮件发送成功', { tenantId, reason });
    } catch (error) {
      this.logger.error('暂停通知邮件发送失败', { tenantId, reason, error });
      throw error;
    }
  }
}
```

### 5.2 通知服务适配器

```typescript
// src/infrastructure/adapters/services/notification.service.adapter.ts
@Injectable()
export class NotificationServiceAdapter implements INotificationService {
  constructor(
    private readonly notificationProvider: INotificationProvider,
    private readonly notificationMapper: NotificationMapper,
    private readonly logger: ILoggerPort
  ) {}

  async notifyTenantCreated(tenantId: string, tenantCode: string): Promise<void> {
    try {
      const notification = this.notificationMapper.createTenantCreatedNotification(tenantId, tenantCode);
      await this.notificationProvider.send(notification);
      this.logger.info('租户创建通知发送成功', { tenantId, tenantCode });
    } catch (error) {
      this.logger.error('租户创建通知发送失败', { tenantId, tenantCode, error });
      throw error;
    }
  }

  async notifyTenantSuspended(tenantId: string, reason: string): Promise<void> {
    try {
      const notification = this.notificationMapper.createTenantSuspendedNotification(tenantId, reason);
      await this.notificationProvider.send(notification);
      this.logger.info('租户暂停通知发送成功', { tenantId, reason });
    } catch (error) {
      this.logger.error('租户暂停通知发送失败', { tenantId, reason, error });
      throw error;
    }
  }

  async notifyUserRegistered(userId: string, email: string): Promise<void> {
    try {
      const notification = this.notificationMapper.createUserRegisteredNotification(userId, email);
      await this.notificationProvider.send(notification);
      this.logger.info('用户注册通知发送成功', { userId, email });
    } catch (error) {
      this.logger.error('用户注册通知发送失败', { userId, email, error });
      throw error;
    }
  }
}
```

### 5.3 分析服务适配器

```typescript
// src/infrastructure/adapters/services/analytics.service.adapter.ts
@Injectable()
export class AnalyticsServiceAdapter implements IAnalyticsService {
  constructor(
    private readonly analyticsProvider: IAnalyticsProvider,
    private readonly logger: ILoggerPort
  ) {}

  async recordTenantActivation(tenantId: string): Promise<void> {
    try {
      await this.analyticsProvider.track('tenant_activated', {
        tenantId,
        timestamp: new Date(),
        eventType: 'tenant_activation'
      });
      this.logger.info('租户激活分析数据记录成功', { tenantId });
    } catch (error) {
      this.logger.error('租户激活分析数据记录失败', { tenantId, error });
      throw error;
    }
  }

  async recordUserLogin(userId: string): Promise<void> {
    try {
      await this.analyticsProvider.track('user_login', {
        userId,
        timestamp: new Date(),
        eventType: 'user_authentication'
      });
      this.logger.info('用户登录分析数据记录成功', { userId });
    } catch (error) {
      this.logger.error('用户登录分析数据记录失败', { userId, error });
      throw error;
    }
  }

  async recordUserActivation(userId: string): Promise<void> {
    try {
      await this.analyticsProvider.track('user_activated', {
        userId,
        timestamp: new Date(),
        eventType: 'user_activation'
      });
      this.logger.info('用户激活分析数据记录成功', { userId });
    } catch (error) {
      this.logger.error('用户激活分析数据记录失败', { userId, error });
      throw error;
    }
  }
}
```

---

## 6. 映射器实现

### 6.1 租户映射器

```typescript
// src/infrastructure/mappers/tenant.mapper.ts
@Injectable()
export class TenantMapper {
  toEntity(aggregate: TenantAggregate): TenantEntity {
    const tenant = aggregate.getTenant();
    
    return new TenantEntity({
      id: tenant.getId().getValue(),
      code: tenant.getCode(),
      name: tenant.getName(),
      type: tenant.getType(),
      status: tenant.getStatus(),
      adminId: tenant.getAdminId(),
      config: tenant.getConfig().toJSON(),
      resourceLimits: tenant.getResourceLimits().toJSON(),
      createdAt: tenant.getCreatedAt(),
      updatedAt: tenant.getUpdatedAt()
    });
  }

  toAggregate(entity: TenantEntity): TenantAggregate {
    const tenantId = TenantId.create(entity.id);
    const tenant = new Tenant(
      tenantId,
      entity.code,
      entity.name,
      entity.type,
      entity.status,
      entity.adminId,
      TenantConfig.fromJSON(entity.config),
      ResourceLimits.fromJSON(entity.resourceLimits)
    );

    return new TenantAggregate(tenantId, tenant);
  }

  toDTO(aggregate: TenantAggregate): TenantDTO {
    const tenant = aggregate.getTenant();
    
    return {
      tenantId: tenant.getId().getValue(),
      code: tenant.getCode(),
      name: tenant.getName(),
      type: tenant.getType(),
      status: tenant.getStatus(),
      adminId: tenant.getAdminId(),
      config: tenant.getConfig().toJSON(),
      resourceLimits: tenant.getResourceLimits().toJSON(),
      createdAt: tenant.getCreatedAt(),
      updatedAt: tenant.getUpdatedAt()
    };
  }
}
```

### 6.2 用户映射器

```typescript
// src/infrastructure/mappers/user.mapper.ts
@Injectable()
export class UserMapper {
  toEntity(aggregate: UserAggregate): UserEntity {
    const user = aggregate.getUser();
    
    return new UserEntity({
      id: user.getId().getValue(),
      tenantId: user.getTenantId()?.getValue(),
      email: user.getEmail(),
      username: user.getUsername(),
      password: user.getPassword(),
      profile: user.getProfile().toJSON(),
      status: user.getStatus(),
      roles: user.getRoles(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt()
    });
  }

  toAggregate(entity: UserEntity): UserAggregate {
    const userId = UserId.create(entity.id);
    const tenantId = entity.tenantId ? TenantId.create(entity.tenantId) : null;
    
    const user = new User(
      userId,
      tenantId,
      entity.email,
      entity.username,
      entity.password,
      UserProfile.fromJSON(entity.profile),
      entity.status,
      entity.roles
    );

    return new UserAggregate(userId, user);
  }

  toDTO(aggregate: UserAggregate): UserDTO {
    const user = aggregate.getUser();
    
    return {
      userId: user.getId().getValue(),
      tenantId: user.getTenantId()?.getValue(),
      email: user.getEmail(),
      username: user.getUsername(),
      profile: user.getProfile().toJSON(),
      status: user.getStatus(),
      roles: user.getRoles(),
      createdAt: user.getCreatedAt(),
      updatedAt: user.getUpdatedAt()
    };
  }
}
```

### 6.3 事件映射器

```typescript
// src/infrastructure/mappers/event.mapper.ts
@Injectable()
export class EventMapper {
  toEntity(event: DomainEvent, aggregateId: string, version: number): EventEntity {
    return new EventEntity({
      id: uuidv4(),
      aggregateId,
      version,
      eventType: event.constructor.name,
      eventData: event,
      timestamp: new Date()
    });
  }

  toDomainEvent(entity: EventEntity): DomainEvent {
    const eventClass = this.getEventClass(entity.eventType);
    return Object.assign(new eventClass(), entity.eventData);
  }

  private getEventClass(eventType: string): any {
    const eventClasses = {
      'TenantCreatedEvent': TenantCreatedEvent,
      'TenantActivatedEvent': TenantActivatedEvent,
      'TenantSuspendedEvent': TenantSuspendedEvent,
      'UserRegisteredEvent': UserRegisteredEvent,
      'UserActivatedEvent': UserActivatedEvent,
      'UserAuthenticatedEvent': UserAuthenticatedEvent,
      // ... 其他事件类
    };

    return eventClasses[eventType] || DomainEvent;
  }
}
```

---

## 7. 多租户支持

### 7.1 多租户数据库服务

```typescript
// src/infrastructure/services/tenant-database.service.ts
@Injectable()
export class TenantDatabaseService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly multiTenancyService: MultiTenancyService
  ) {}

  async saveTenant(tenantEntity: TenantEntity): Promise<void> {
    // 根据租户ID选择数据库连接
    const connection = await this.getTenantConnection(tenantEntity.id);
    await connection.manager.save(TenantEntity, tenantEntity);
  }

  async findTenantById(tenantId: string): Promise<TenantEntity | null> {
    const connection = await this.getTenantConnection(tenantId);
    return await connection.manager.findOne(TenantEntity, { where: { id: tenantId } });
  }

  async findTenantByCode(code: string): Promise<TenantEntity | null> {
    // 租户代码查询需要遍历所有租户数据库
    const tenantConnections = await this.getAllTenantConnections();
    
    for (const connection of tenantConnections) {
      const tenant = await connection.manager.findOne(TenantEntity, { where: { code } });
      if (tenant) {
        return tenant;
      }
    }
    
    return null;
  }

  async findAllTenants(): Promise<TenantEntity[]> {
    const tenantConnections = await this.getAllTenantConnections();
    const allTenants: TenantEntity[] = [];
    
    for (const connection of tenantConnections) {
      const tenants = await connection.manager.find(TenantEntity);
      allTenants.push(...tenants);
    }
    
    return allTenants;
  }

  async deleteTenant(tenantId: string): Promise<void> {
    const connection = await this.getTenantConnection(tenantId);
    await connection.manager.delete(TenantEntity, { id: tenantId });
  }

  private async getTenantConnection(tenantId: string): Promise<Connection> {
    return await this.multiTenancyService.getTenantConnection(tenantId);
  }

  private async getAllTenantConnections(): Promise<Connection[]> {
    return await this.multiTenancyService.getAllTenantConnections();
  }
}
```

### 7.2 多租户缓存服务

```typescript
// src/infrastructure/services/tenant-cache.service.ts
@Injectable()
export class TenantCacheService {
  constructor(
    private readonly cacheAdapter: CacheAdapter,
    private readonly multiTenancyService: MultiTenancyService
  ) {}

  async setTenantData(tenantId: string, key: string, data: any, ttl?: number): Promise<void> {
    const tenantKey = this.buildTenantKey(tenantId, key);
    await this.cacheAdapter.set(tenantKey, data, ttl);
  }

  async getTenantData(tenantId: string, key: string): Promise<any> {
    const tenantKey = this.buildTenantKey(tenantId, key);
    return await this.cacheAdapter.get(tenantKey);
  }

  async deleteTenantData(tenantId: string, key: string): Promise<void> {
    const tenantKey = this.buildTenantKey(tenantId, key);
    await this.cacheAdapter.delete(tenantKey);
  }

  async clearTenantCache(tenantId: string): Promise<void> {
    const pattern = this.buildTenantPattern(tenantId);
    await this.cacheAdapter.deletePattern(pattern);
  }

  private buildTenantKey(tenantId: string, key: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  private buildTenantPattern(tenantId: string): string {
    return `tenant:${tenantId}:*`;
  }
}
```

---

## 8. 代码示例

### 8.1 Saas-Core 适配器模块

**重要说明**：`saas-core` 不应该定义自己的 `InfrastructureModule`，而应该直接使用 `@hl8/hybrid-archi` 提供的 `InfrastructureModule`。`saas-core` 只需要定义自己的适配器模块来提供业务特定的仓储和服务实现。

```typescript
// src/infrastructure/adapters/saas-core-adapters.module.ts
import { Module } from '@nestjs/common';
import { DatabaseModule } from '@hl8/database';

/**
 * Saas-Core 适配器模块
 * 
 * @description 提供 saas-core 业务特定的基础设施适配器
 * 依赖 @hl8/hybrid-archi 提供的基础设施
 * 
 * @since 1.0.0
 */
@Module({
  imports: [
    // 使用 @hl8/database 提供的 DatabaseModule
    DatabaseModule,
  ],
  providers: [
    // 仓储适配器
    TenantRepositoryAdapter,
    UserRepositoryAdapter,
    MultiTenantRepositoryAdapter,
    CachedTenantRepositoryAdapter,

    // 事件存储
    EventStoreAdapter,
    EventPublisherAdapter,

    // 服务适配器
    EmailServiceAdapter,
    NotificationServiceAdapter,
    AnalyticsServiceAdapter,

    // 映射器
    TenantMapper,
    UserMapper,
    EventMapper,

    // 多租户服务
    TenantDatabaseService,
    TenantCacheService,

    // 基础设施工厂
    InfrastructureFactory,
  ],
  exports: [
    // 导出仓储接口实现
    ITenantRepository,
    IUserRepository,
    IEventStore,
    IEventBus,
    IEmailService,
    INotificationService,
    IAnalyticsService,
  ],
})
export class SaasCoreAdaptersModule {}
```

### 8.2 基础设施工厂

```typescript
// src/infrastructure/factories/infrastructure.factory.ts
@Injectable()
export class InfrastructureFactory {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly userRepository: IUserRepository,
    private readonly eventStore: IEventStore,
    private readonly eventBus: IEventBus,
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService,
    private readonly analyticsService: IAnalyticsService
  ) {}

  createTenantRepository(): ITenantRepository {
    return this.tenantRepository;
  }

  createUserRepository(): IUserRepository {
    return this.userRepository;
  }

  createEventStore(): IEventStore {
    return this.eventStore;
  }

  createEventBus(): IEventBus {
    return this.eventBus;
  }

  createEmailService(): IEmailService {
    return this.emailService;
  }

  createNotificationService(): INotificationService {
    return this.notificationService;
  }

  createAnalyticsService(): IAnalyticsService {
    return this.analyticsService;
  }
}
```

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md)
- [项目结构与模块职责](./03-project-structure.md)
- [领域层开发指南](./04-domain-layer-development.md)
- [应用层开发指南](./05-application-layer-development.md)
- [接口层开发指南](./07-interface-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [测试策略与部署运维](./09-testing-and-deployment.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)
