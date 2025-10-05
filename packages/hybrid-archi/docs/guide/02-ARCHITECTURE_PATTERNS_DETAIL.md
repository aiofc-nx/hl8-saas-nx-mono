# Hybrid Architecture 架构模式详细设计

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/hybrid-archi

---

## 📋 目录

- [1. Clean Architecture 详细设计](#1-clean-architecture-详细设计)
- [2. Domain-Driven Design 详细设计](#2-domain-driven-design-详细设计)
- [3. CQRS 详细设计](#3-cqrs-详细设计)
- [4. Event Sourcing 详细设计](#4-event-sourcing-详细设计)
- [5. Event-Driven Architecture 详细设计](#5-event-driven-architecture-详细设计)

---

## 1. Clean Architecture 详细设计

### 1.1 分层架构设计

#### 1.1.1 领域层 (Domain Layer)

**设计原则**:

- 无外部依赖，纯业务逻辑
- 包含实体、聚合根、值对象、领域服务
- 定义业务规则和约束

**核心组件**:

```typescript
// 基础实体类
export abstract class BaseEntity<TId = EntityId> {
  protected constructor(
    protected readonly _id: TId,
    protected _createdAt: Date = new Date(),
    protected _updatedAt: Date = new Date()
  ) {}

  public getId(): TId {
    return this._id;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public getUpdatedAt(): Date {
    return this._updatedAt;
  }

  protected updateTimestamp(): void {
    this._updatedAt = new Date();
  }
}

// 基础聚合根类
export abstract class BaseAggregateRoot<TId = EntityId> extends BaseEntity<TId> {
  private _domainEvents: BaseDomainEvent[] = [];

  protected addDomainEvent(event: BaseDomainEvent): void {
    this._domainEvents.push(event);
  }

  public getUncommittedEvents(): BaseDomainEvent[] {
    return [...this._domainEvents];
  }

  public clearUncommittedEvents(): void {
    this._domainEvents = [];
  }
}

// 基础值对象类
export abstract class BaseValueObject {
  protected constructor() {}

  protected abstract arePropertiesEqual(other: BaseValueObject): boolean;

  public equals(other: BaseValueObject): boolean {
    if (this.constructor !== other.constructor) {
      return false;
    }
    return this.arePropertiesEqual(other);
  }
}
```

#### 1.1.2 应用层 (Application Layer)

**设计原则**:

- 协调领域对象完成用例
- 不包含业务逻辑，只协调
- 定义用例接口和端口

**核心组件**:

```typescript
// 基础用例类
export abstract class BaseUseCase<TRequest, TResponse> {
  public abstract execute(request: TRequest): Promise<TResponse>;
}

// 用例接口
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

// 命令接口
export interface ICommand {
  readonly commandId: string;
  readonly timestamp: Date;
}

// 查询接口
export interface IQuery<TResult = any> {
  readonly queryId: string;
  readonly timestamp: Date;
}
```

#### 1.1.3 基础设施层 (Infrastructure Layer)

**设计原则**:

- 实现应用层定义的接口
- 处理外部系统集成
- 提供技术实现细节

**核心组件**:

```typescript
// 基础基础设施适配器
export abstract class BaseInfrastructureAdapter {
  protected constructor(
    protected readonly logger: ILogger,
    protected readonly config: IConfiguration
  ) {}

  protected logInfo(message: string, context?: any): void {
    this.logger.info(message, context);
  }

  protected logError(message: string, error: Error, context?: any): void {
    this.logger.error(message, error, context);
  }
}

// 缓存适配器
export abstract class CacheAdapter extends BaseInfrastructureAdapter {
  public abstract get<T>(key: string): Promise<T | null>;
  public abstract set<T>(key: string, value: T, ttl?: number): Promise<void>;
  public abstract delete(key: string): Promise<void>;
  public abstract clear(): Promise<void>;
}

// 数据库适配器
export abstract class DatabaseAdapter extends BaseInfrastructureAdapter {
  public abstract findById<T>(id: string): Promise<T | null>;
  public abstract save<T>(entity: T): Promise<void>;
  public abstract delete(id: string): Promise<void>;
}
```

#### 1.1.4 接口层 (Interface Layer)

**设计原则**:

- 处理外部请求和响应
- 数据转换和验证
- 横切关注点处理

**核心组件**:

```typescript
// 基础控制器类
export abstract class BaseController {
  protected constructor(
    protected readonly logger: ILogger,
    protected readonly validator: IValidator
  ) {}

  protected validateRequest<T>(data: any, schema: any): T {
    const result = this.validator.validate(data, schema);
    if (!result.isValid) {
      throw new ValidationException(result.errors);
    }
    return result.data;
  }

  protected handleError(error: Error): void {
    this.logger.error('Controller error', error);
    throw new ControllerException(error.message);
  }
}

// 基础GraphQL解析器类
export abstract class BaseResolver {
  protected constructor(
    protected readonly logger: ILogger,
    protected readonly validator: IValidator
  ) {}

  protected validateInput<T>(input: any, schema: any): T {
    const result = this.validator.validate(input, schema);
    if (!result.isValid) {
      throw new ValidationException(result.errors);
    }
    return result.data;
  }
}
```

### 1.2 依赖倒置原则

#### 1.2.1 端口定义

```typescript
// 领域层定义端口接口
export interface IUserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: UserId): Promise<void>;
}

// 应用层定义用例接口
export interface ICreateUserUseCase {
  execute(request: CreateUserRequest): Promise<CreateUserResponse>;
}
```

#### 1.2.2 适配器实现

```typescript
// 基础设施层实现端口
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: EntityRepository<UserEntity>,
    private readonly mapper: UserMapper
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.userEntityRepository.findOne({ id: id.value });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const entity = this.mapper.toEntity(user);
    await this.userEntityRepository.persistAndFlush(entity);
  }
}
```

---

## 2. Domain-Driven Design 详细设计

### 2.1 充血模型设计

#### 2.1.1 实体设计

```typescript
/**
 * 用户实体
 * 
 * @description 用户聚合根，管理用户的完整生命周期
 * 包含用户基础信息、认证信息、权限信息等
 */
export class User extends BaseAggregateRoot<UserId> {
  private constructor(
    private readonly _id: UserId,
    private _email: Email,
    private _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _tenantId?: TenantId
  ) {
    super(_id);
  }

  // 业务方法 - 用户注册
  public register(email: Email, username: Username, password: Password): void {
    if (this._status !== UserStatus.Pending) {
      throw new UserAlreadyRegisteredException();
    }
    
    this._email = email;
    this._username = username;
    this._password = password;
    this._status = UserStatus.Active;
    
    this.addDomainEvent(new UserRegisteredEvent(this._id, this._email));
  }

  // 业务方法 - 用户认证
  public authenticate(password: Password): boolean {
    if (this._status !== UserStatus.Active) {
      throw new UserNotActiveException();
    }
    
    const isValid = this._password.verify(password);
    if (isValid) {
      this.addDomainEvent(new UserAuthenticatedEvent(this._id));
    }
    
    return isValid;
  }

  // 业务方法 - 更新用户资料
  public updateProfile(profile: UserProfile): void {
    this._profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this._id, profile));
  }

  // 业务方法 - 分配租户
  public assignToTenant(tenantId: TenantId): void {
    this._tenantId = tenantId;
    this.addDomainEvent(new UserAssignedToTenantEvent(this._id, tenantId));
  }

  // 业务方法 - 激活用户
  public activate(): void {
    if (this._status === UserStatus.Active) {
      throw new UserAlreadyActiveException();
    }
    
    this._status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this._id));
  }

  // 业务方法 - 停用用户
  public deactivate(): void {
    if (this._status === UserStatus.Inactive) {
      throw new UserAlreadyInactiveException();
    }
    
    this._status = UserStatus.Inactive;
    this.addDomainEvent(new UserDeactivatedEvent(this._id));
  }

  // 获取器方法
  public getEmail(): Email {
    return this._email;
  }

  public getUsername(): Username {
    return this._username;
  }

  public getProfile(): UserProfile {
    return this._profile;
  }

  public getStatus(): UserStatus {
    return this._status;
  }

  public getTenantId(): TenantId | undefined {
    return this._tenantId;
  }

  // 静态工厂方法
  public static create(
    id: UserId,
    email: Email,
    username: Username,
    password: Password,
    profile: UserProfile,
    status: UserStatus = UserStatus.Pending,
    tenantId?: TenantId
  ): User {
    return new User(id, email, username, password, profile, status, tenantId);
  }
}
```

#### 2.1.2 值对象设计

```typescript
/**
 * 邮箱值对象
 * 
 * @description 邮箱地址值对象，确保邮箱格式正确
 */
export class Email extends BaseValueObject {
  private constructor(private readonly value: string) {
    super();
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new InvalidEmailException('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.value)) {
      throw new InvalidEmailException('Invalid email format');
    }
  }

  public getValue(): string {
    return this.value;
  }

  public getDomain(): string {
    return this.value.split('@')[1];
  }

  public getLocalPart(): string {
    return this.value.split('@')[0];
  }

  protected arePropertiesEqual(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  public static create(value: string): Email {
    return new Email(value);
  }
}

/**
 * 密码值对象
 * 
 * @description 密码值对象，处理密码加密和验证
 */
export class Password extends BaseValueObject {
  private constructor(
    private readonly hashedValue: string,
    private readonly salt: string
  ) {
    super();
  }

  public verify(plainPassword: string): boolean {
    const hash = this.hashPassword(plainPassword, this.salt);
    return hash === this.hashedValue;
  }

  private hashPassword(password: string, salt: string): string {
    // 实际的密码哈希逻辑
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  }

  protected arePropertiesEqual(other: Password): boolean {
    return this.hashedValue === other.hashedValue && this.salt === other.salt;
  }

  public static create(plainPassword: string): Password {
    const salt = crypto.randomBytes(32).toString('hex');
    const hashedValue = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
    return new Password(hashedValue, salt);
  }
}
```

### 2.2 聚合设计

#### 2.2.1 聚合根设计

```typescript
/**
 * 用户聚合根
 * 
 * @description 用户聚合根，管理用户聚合的一致性边界
 */
export class UserAggregate extends BaseAggregateRoot<UserId> {
  private constructor(
    private readonly _id: UserId,
    private _email: Email,
    private _username: Username,
    private _password: Password,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _tenantId?: TenantId
  ) {
    super(_id);
  }

  // 聚合业务方法
  public createUser(email: Email, username: Username, password: Password, profile: UserProfile): void {
    this._email = email;
    this._username = username;
    this._password = password;
    this._profile = profile;
    this._status = UserStatus.Pending;
    
    this.addDomainEvent(new UserCreatedEvent(this._id, this._email, this._username));
  }

  public activateUser(): void {
    if (this._status !== UserStatus.Pending) {
      throw new UserNotPendingException();
    }
    
    this._status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this._id));
  }

  public updateUserProfile(profile: UserProfile): void {
    this._profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this._id, profile));
  }

  // 获取器方法
  public getEmail(): Email {
    return this._email;
  }

  public getUsername(): Username {
    return this._username;
  }

  public getProfile(): UserProfile {
    return this._profile;
  }

  public getStatus(): UserStatus {
    return this._status;
  }

  public getTenantId(): TenantId | undefined {
    return this._tenantId;
  }
}
```

### 2.3 领域服务设计

#### 2.3.1 领域服务接口

```typescript
/**
 * 领域服务接口
 * 
 * @description 领域服务基础接口
 */
export interface IDomainService {
  // 领域服务方法
}

/**
 * 用户领域服务
 * 
 * @description 处理用户相关的复杂业务逻辑
 */
export class UserDomainService implements IDomainService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly emailService: IEmailService
  ) {}

  public async isEmailUnique(email: Email, tenantId?: TenantId): Promise<boolean> {
    const existingUser = await this.userRepository.findByEmail(email, tenantId);
    return existingUser === null;
  }

  public async isUsernameUnique(username: Username, tenantId?: TenantId): Promise<boolean> {
    const existingUser = await this.userRepository.findByUsername(username, tenantId);
    return existingUser === null;
  }

  public async validateUserRegistration(
    email: Email,
    username: Username,
    tenantId?: TenantId
  ): Promise<void> {
    if (!(await this.isEmailUnique(email, tenantId))) {
      throw new EmailAlreadyExistsException(email.getValue());
    }
    
    if (!(await this.isUsernameUnique(username, tenantId))) {
      throw new UsernameAlreadyExistsException(username.getValue());
    }
  }
}
```

---

## 3. CQRS 详细设计

### 3.1 命令端设计

#### 3.1.1 命令定义

```typescript
/**
 * 基础命令类
 * 
 * @description 所有命令的基类
 */
export abstract class BaseCommand implements ICommand {
  public readonly commandId: string;
  public readonly timestamp: Date;
  public readonly tenantId?: string;
  public readonly userId?: string;

  constructor(tenantId?: string, userId?: string) {
    this.commandId = uuidv4();
    this.timestamp = new Date();
    this.tenantId = tenantId;
    this.userId = userId;
  }
}

/**
 * 创建用户命令
 * 
 * @description 创建新用户的命令
 */
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly profile: UserProfileDto,
    tenantId?: string,
    userId?: string
  ) {
    super(tenantId, userId);
  }
}

/**
 * 更新用户命令
 * 
 * @description 更新用户信息的命令
 */
export class UpdateUserCommand extends BaseCommand {
  constructor(
    public readonly userId: string,
    public readonly name?: string,
    public readonly email?: string,
    public readonly profile?: UserProfileDto,
    tenantId?: string,
    user?: string
  ) {
    super(tenantId, user);
  }
}
```

#### 3.1.2 命令处理器

```typescript
/**
 * 命令处理器接口
 * 
 * @description 命令处理器基础接口
 */
export interface ICommandHandler<TCommand extends ICommand, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}

/**
 * 创建用户命令处理器
 * 
 * @description 处理创建用户命令
 */
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand, string> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly eventBus: IEventBus
  ) {}

  async handle(command: CreateUserCommand): Promise<string> {
    // 验证用户注册信息
    await this.userDomainService.validateUserRegistration(
      Email.create(command.email),
      Username.create(command.name),
      command.tenantId ? TenantId.create(command.tenantId) : undefined
    );

    // 创建用户聚合
    const user = UserAggregate.create(
      UserId.generate(),
      Email.create(command.email),
      Username.create(command.name),
      Password.create(command.password),
      UserProfile.create(command.profile),
      UserStatus.Pending,
      command.tenantId ? TenantId.create(command.tenantId) : undefined
    );

    // 保存用户
    await this.userRepository.save(user);

    // 发布领域事件
    await this.eventBus.publishAll(user.getUncommittedEvents());

    return user.getId().getValue();
  }
}
```

### 3.2 查询端设计

#### 3.2.1 查询定义

```typescript
/**
 * 基础查询类
 * 
 * @description 所有查询的基类
 */
export abstract class BaseQuery<TResult = any> implements IQuery<TResult> {
  public readonly queryId: string;
  public readonly timestamp: Date;
  public readonly tenantId?: string;
  public readonly userId?: string;

  constructor(tenantId?: string, userId?: string) {
    this.queryId = uuidv4();
    this.timestamp = new Date();
    this.tenantId = tenantId;
    this.userId = userId;
  }
}

/**
 * 获取用户查询
 * 
 * @description 根据用户ID获取用户信息
 */
export class GetUserQuery extends BaseQuery<UserDto> {
  constructor(
    public readonly userId: string,
    tenantId?: string,
    user?: string
  ) {
    super(tenantId, user);
  }
}

/**
 * 获取用户列表查询
 * 
 * @description 获取用户列表
 */
export class GetUsersQuery extends BaseQuery<UserDto[]> {
  constructor(
    public readonly page: number = 1,
    public readonly limit: number = 10,
    public readonly filters?: UserFilters,
    tenantId?: string,
    user?: string
  ) {
    super(tenantId, user);
  }
}
```

#### 3.2.2 查询处理器

```typescript
/**
 * 查询处理器接口
 * 
 * @description 查询处理器基础接口
 */
export interface IQueryHandler<TQuery extends IQuery, TResult = any> {
  handle(query: TQuery): Promise<TResult>;
}

/**
 * 获取用户查询处理器
 * 
 * @description 处理获取用户查询
 */
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDto> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly cache: ICacheService
  ) {}

  async handle(query: GetUserQuery): Promise<UserDto> {
    // 尝试从缓存获取
    const cacheKey = `user:${query.userId}`;
    const cachedUser = await this.cache.get<UserDto>(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }

    // 从数据库获取
    const user = await this.userRepository.findById(UserId.create(query.userId));
    if (!user) {
      throw new UserNotFoundException(query.userId);
    }

    // 转换为DTO
    const userDto = UserDto.fromEntity(user);

    // 缓存结果
    await this.cache.set(cacheKey, userDto, 3600);

    return userDto;
  }
}
```

### 3.3 CQRS总线设计

#### 3.3.1 命令总线

```typescript
/**
 * 命令总线接口
 * 
 * @description 命令总线基础接口
 */
export interface ICommandBus {
  execute<TCommand extends ICommand, TResult = void>(
    command: TCommand
  ): Promise<TResult>;
}

/**
 * 核心命令总线
 * 
 * @description 命令总线实现
 */
export class CoreCommandBus implements ICommandBus {
  private readonly handlers = new Map<string, ICommandHandler<any, any>>();

  constructor(private readonly moduleRef: ModuleRef) {}

  public registerHandler<TCommand extends ICommand, TResult>(
    commandType: new (...args: any[]) => TCommand,
    handler: ICommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandType.name, handler);
  }

  public async execute<TCommand extends ICommand, TResult = void>(
    command: TCommand
  ): Promise<TResult> {
    const handler = this.handlers.get(command.constructor.name);
    if (!handler) {
      throw new CommandHandlerNotFoundException(command.constructor.name);
    }

    return await handler.handle(command);
  }
}
```

#### 3.3.2 查询总线

```typescript
/**
 * 查询总线接口
 * 
 * @description 查询总线基础接口
 */
export interface IQueryBus {
  execute<TQuery extends IQuery, TResult = any>(
    query: TQuery
  ): Promise<TResult>;
}

/**
 * 核心查询总线
 * 
 * @description 查询总线实现
 */
export class CoreQueryBus implements IQueryBus {
  private readonly handlers = new Map<string, IQueryHandler<any, any>>();

  constructor(private readonly moduleRef: ModuleRef) {}

  public registerHandler<TQuery extends IQuery, TResult>(
    queryType: new (...args: any[]) => TQuery,
    handler: IQueryHandler<TQuery, TResult>
  ): void {
    this.handlers.set(queryType.name, handler);
  }

  public async execute<TQuery extends IQuery, TResult = any>(
    query: TQuery
  ): Promise<TResult> {
    const handler = this.handlers.get(query.constructor.name);
    if (!handler) {
      throw new QueryHandlerNotFoundException(query.constructor.name);
    }

    return await handler.handle(query);
  }
}
```

---

## 4. Event Sourcing 详细设计

### 4.1 事件存储设计

#### 4.1.1 事件存储接口

```typescript
/**
 * 事件存储接口
 * 
 * @description 事件存储基础接口
 */
export interface IEventStore {
  saveEvents(
    aggregateId: string,
    events: BaseDomainEvent[],
    expectedVersion: number
  ): Promise<void>;
  
  getEvents(aggregateId: string): Promise<BaseDomainEvent[]>;
  
  getEventsFromVersion(
    aggregateId: string,
    fromVersion: number
  ): Promise<BaseDomainEvent[]>;
}

/**
 * 事件存储实现
 * 
 * @description 基于数据库的事件存储实现
 */
export class EventStoreImplementation implements IEventStore {
  constructor(
    private readonly database: IDatabaseAdapter,
    private readonly serializer: IEventSerializer
  ) {}

  async saveEvents(
    aggregateId: string,
    events: BaseDomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    const eventData = events.map(event => ({
      aggregateId,
      eventType: event.constructor.name,
      eventData: this.serializer.serialize(event),
      version: expectedVersion + events.indexOf(event) + 1,
      timestamp: new Date()
    }));

    await this.database.saveEvents(eventData);
  }

  async getEvents(aggregateId: string): Promise<BaseDomainEvent[]> {
    const eventRecords = await this.database.getEvents(aggregateId);
    return eventRecords.map(record => 
      this.serializer.deserialize(record.eventType, record.eventData)
    );
  }

  async getEventsFromVersion(
    aggregateId: string,
    fromVersion: number
  ): Promise<BaseDomainEvent[]> {
    const eventRecords = await this.database.getEventsFromVersion(aggregateId, fromVersion);
    return eventRecords.map(record => 
      this.serializer.deserialize(record.eventType, record.eventData)
    );
  }
}
```

### 4.2 事件重放设计

#### 4.2.1 聚合重建

```typescript
/**
 * 聚合重建器
 * 
 * @description 从事件重建聚合状态
 */
export class AggregateRebuilder {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly aggregateFactory: IAggregateFactory
  ) {}

  async rebuildAggregate<T extends BaseAggregateRoot>(
    aggregateType: new (...args: any[]) => T,
    aggregateId: string
  ): Promise<T> {
    const events = await this.eventStore.getEvents(aggregateId);
    
    if (events.length === 0) {
      throw new AggregateNotFoundException(aggregateId);
    }

    const aggregate = this.aggregateFactory.create(aggregateType, aggregateId);
    
    for (const event of events) {
      aggregate.applyEvent(event);
    }

    return aggregate;
  }
}
```

---

## 5. Event-Driven Architecture 详细设计

### 5.1 事件总线设计

#### 5.1.1 事件总线接口

```typescript
/**
 * 事件总线接口
 * 
 * @description 事件总线基础接口
 */
export interface IEventBus {
  publish<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void>;
  publishAll(events: BaseDomainEvent[]): Promise<void>;
  subscribe<TEvent extends BaseDomainEvent>(
    eventType: string,
    handler: IEventHandler<TEvent>
  ): Promise<void>;
}

/**
 * 核心事件总线
 * 
 * @description 事件总线实现
 */
export class CoreEventBus implements IEventBus {
  private readonly handlers = new Map<string, IEventHandler<any>[]>();

  constructor(private readonly moduleRef: ModuleRef) {}

  public async publish<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void> {
    const eventType = event.constructor.name;
    const eventHandlers = this.handlers.get(eventType) || [];
    
    for (const handler of eventHandlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error);
      }
    }
  }

  public async publishAll(events: BaseDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  public async subscribe<TEvent extends BaseDomainEvent>(
    eventType: string,
    handler: IEventHandler<TEvent>
  ): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
  }
}
```

### 5.2 事件处理器设计

#### 5.2.1 事件处理器接口

```typescript
/**
 * 事件处理器接口
 * 
 * @description 事件处理器基础接口
 */
export interface IEventHandler<TEvent extends BaseDomainEvent> {
  handle(event: TEvent): Promise<void>;
}

/**
 * 用户注册事件处理器
 * 
 * @description 处理用户注册成功后的后续操作
 */
@EventsHandler(UserRegisteredEvent)
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly notificationService: INotificationService
  ) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.email);
    
    // 发送通知
    await this.notificationService.notifyUserRegistration(event.userId);
  }
}
```

---

## 🎯 总结

Hybrid Architecture 通过融合五种强大的架构模式，为SAAS平台提供了：

1. **Clean Architecture**: 清晰的分层架构和依赖方向
2. **DDD**: 充血模型和领域建模
3. **CQRS**: 命令查询职责分离
4. **Event Sourcing**: 事件溯源能力
5. **Event-Driven Architecture**: 事件驱动架构

这种混合架构模式确保了系统的可维护性、可扩展性和高性能。

---

**下一步**: 查看 [应用指南](./03-APPLICATION_GUIDE.md) 了解如何在实际项目中使用这些架构模式。
