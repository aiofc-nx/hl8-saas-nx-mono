# SAAS-CORE 最佳实践与常见问题

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 最佳实践](#1-最佳实践)
- [2. 常见问题](#2-常见问题)
- [3. 性能优化](#3-性能优化)
- [4. 安全最佳实践](#4-安全最佳实践)
- [5. 代码质量](#5-代码质量)
- [6. 团队协作](#6-团队协作)
- [7. 故障排查](#7-故障排查)
- [8. 参考资料](#8-参考资料)

---

## 1. 最佳实践

### 1.1 领域层最佳实践

#### ✅ 充血模型实现

```typescript
// ✅ 正确：业务逻辑在实体内
export class Tenant extends BaseEntity {
  public activate(): void {
    // 验证业务规则
    if (this._status !== TENANT_STATUS.PENDING) {
      throw new TenantNotPendingException('只有待激活状态的租户才能激活');
    }
    
    // 执行业务逻辑
    this._status = TENANT_STATUS.ACTIVE;
    this.updateTimestamp();
    
    // 发布领域事件
    this.addDomainEvent(new TenantActivatedEvent(this.getId()));
  }
}

// ❌ 错误：贫血模型
export class Tenant {
  private _status: TenantStatus;
  
  setStatus(status: TenantStatus): void {
    this._status = status;
  }
}
```

#### ✅ 聚合根与实体分离

```typescript
// ✅ 正确：聚合根作为管理者
export class TenantAggregate extends BaseAggregateRoot {
  public activate(): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.activate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantActivatedEvent(this.tenantId));
  }
}

// ✅ 正确：实体作为被管理者
export class Tenant extends BaseEntity {
  public activate(): void {
    // 执行业务逻辑
    this._status = TENANT_STATUS.ACTIVE;
    this.updateTimestamp();
  }
}
```

### 1.2 应用层最佳实践

#### ✅ 用例为中心的设计

```typescript
// ✅ 正确：单一职责的用例
export class CreateTenantUseCase {
  async execute(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    // 只处理创建租户的业务场景
  }
}

export class ActivateTenantUseCase {
  async execute(request: ActivateTenantRequest): Promise<ActivateTenantResponse> {
    // 只处理激活租户的业务场景
  }
}

// ❌ 错误：违反单一职责
export class TenantService {
  async createTenant(): Promise<void> { }
  async updateTenant(): Promise<void> { }
  async deleteTenant(): Promise<void> { }
  async activateTenant(): Promise<void> { }
}
```

#### ✅ 事务边界管理

```typescript
// ✅ 正确：在用例层管理事务边界
export class CreateTenantWithUserUseCase {
  async execute(request: CreateTenantWithUserRequest): Promise<CreateTenantWithUserResponse> {
    return await this.dataSource.transaction(async () => {
      // 1. 创建租户
      const tenantAggregate = TenantAggregate.create(...);
      await this.tenantRepository.save(tenantAggregate);
      
      // 2. 创建用户
      const userAggregate = UserAggregate.create(...);
      await this.userRepository.save(userAggregate);
      
      // 3. 发布事件
      await this.eventBus.publishAll(tenantAggregate.getUncommittedEvents());
      await this.eventBus.publishAll(userAggregate.getUncommittedEvents());
      
      return response;
    });
  }
}
```

### 1.3 基础设施层最佳实践

#### ✅ 适配器模式实现

```typescript
// ✅ 正确：使用适配器模式隔离外部依赖
export class TenantRepositoryAdapter implements ITenantRepository {
  constructor(
    private readonly repository: Repository<TenantEntity>,
    private readonly tenantMapper: TenantMapper
  ) {}

  async save(aggregate: TenantAggregate): Promise<void> {
    const entity = this.tenantMapper.toEntity(aggregate);
    await this.repository.save(entity);
  }
}
```

#### ✅ 缓存策略

```typescript
// ✅ 正确：多级缓存策略
export class CachedTenantRepositoryAdapter implements ITenantRepository {
  async findById(id: TenantId): Promise<TenantAggregate | null> {
    const cacheKey = `tenant:${id.getValue()}`;
    
    // L1: 内存缓存
    const cached = await this.memoryCache.get<TenantAggregate>(cacheKey);
    if (cached) return cached;
    
    // L2: Redis缓存
    const redisCached = await this.redisCache.get<TenantAggregate>(cacheKey);
    if (redisCached) {
      await this.memoryCache.set(cacheKey, redisCached, 300); // 5分钟
      return redisCached;
    }
    
    // L3: 数据库
    const aggregate = await this.tenantRepository.findById(id);
    if (aggregate) {
      await this.redisCache.set(cacheKey, aggregate, 3600); // 1小时
      await this.memoryCache.set(cacheKey, aggregate, 300); // 5分钟
    }
    
    return aggregate;
  }
}
```

### 1.4 接口层最佳实践

#### ✅ 输入验证

```typescript
// ✅ 正确：完整的输入验证
export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Matches(/^[a-zA-Z][a-zA-Z0-9_-]*$/)
  @Validate(TenantCodeUniqueValidator)
  code: string;

  @IsEmail()
  adminEmail: string;
}
```

#### ✅ 错误处理

```typescript
// ✅ 正确：统一的错误处理
@Controller('tenants')
export class TenantController {
  @Post()
  async createTenant(@Body() createTenantDto: CreateTenantDto): Promise<CreateTenantResponseDto> {
    try {
      const request = TenantTransformer.toCreateRequest(createTenantDto);
      const response = await this.createTenantUseCase.execute(request);
      return TenantTransformer.toResponseDto(response);
    } catch (error) {
      if (error instanceof TenantCodeAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof ValidationException) {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('创建租户失败');
    }
  }
}
```

---

## 2. 常见问题

### 2.1 架构相关问题

#### Q: 为什么要在领域层使用充血模型？

**A**: 充血模型将业务逻辑集中在领域对象中，确保：

- **业务规则一致性**: 所有业务规则都在一个地方维护
- **封装性**: 业务逻辑被正确封装，外部不能绕过业务规则
- **可测试性**: 业务逻辑可以独立测试
- **可维护性**: 业务变更只需要修改领域对象

#### Q: 聚合根和实体的区别是什么？

**A**:

- **聚合根**: 管理聚合的一致性边界，协调内部实体，发布领域事件
- **实体**: 执行具体的业务操作，维护自身状态，实现业务逻辑
- **关系**: 聚合根通过指令模式协调实体，实体响应聚合根的指令

#### Q: 什么时候使用领域服务？

**A**: 使用领域服务的场景：

- **跨聚合业务逻辑**: 涉及多个聚合的复杂业务
- **外部服务集成**: 需要调用外部服务但属于领域逻辑
- **复杂计算**: 需要复杂计算但不属于特定实体的逻辑

### 2.2 应用层相关问题

#### Q: 用例服务和服务类的区别？

**A**:

- **用例服务**: 单一职责，每个用例对应一个服务类
- **服务类**: 通常包含多个相关功能，职责相对广泛
- **建议**: 优先使用用例服务，确保单一职责原则

#### Q: 如何处理跨用例的事务？

**A**:

```typescript
// 创建协调用例
export class CompleteTenantSetupUseCase {
  async execute(request: CompleteTenantSetupRequest): Promise<CompleteTenantSetupResponse> {
    return await this.dataSource.transaction(async () => {
      // 1. 创建租户
      const tenantResponse = await this.createTenantUseCase.execute(createTenantRequest);
      
      // 2. 注册用户
      const userResponse = await this.registerUserUseCase.execute(registerUserRequest);
      
      // 3. 激活租户
      await this.activateTenantUseCase.execute(activateTenantRequest);
      
      return response;
    });
  }
}
```

### 2.3 基础设施层相关问题

#### Q: 如何选择合适的缓存策略？

**A**:

- **读多写少**: 使用缓存，设置合理的过期时间
- **读写频繁**: 使用缓存，配合缓存更新策略
- **强一致性**: 谨慎使用缓存，或使用缓存失效策略
- **多级缓存**: 内存缓存 + Redis缓存，提高命中率

#### Q: 如何处理事件存储的版本兼容性？

**A**:

```typescript
// 事件版本管理
export class EventVersionManager {
  private eventVersions = new Map<string, number>();

  registerEvent(eventType: string, version: number): void {
    this.eventVersions.set(eventType, version);
  }

  getEventVersion(eventType: string): number {
    return this.eventVersions.get(eventType) || 1;
  }

  migrateEvent(event: DomainEvent, fromVersion: number, toVersion: number): DomainEvent {
    // 事件迁移逻辑
    return event;
  }
}
```

### 2.4 性能相关问题

#### Q: 如何优化数据库查询性能？

**A**:

```typescript
// 1. 使用索引
@Entity()
@Index(['code'], { unique: true })
@Index(['status', 'type'])
export class TenantEntity {
  // ...
}

// 2. 分页查询
async findTenantsWithPagination(page: number, limit: number): Promise<PaginatedResult<TenantAggregate>> {
  const [entities, total] = await this.repository.findAndCount({
    skip: (page - 1) * limit,
    take: limit,
    order: { createdAt: 'DESC' }
  });
  
  return {
    data: entities.map(entity => this.tenantMapper.toAggregate(entity)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

// 3. 批量操作
async saveBatch(aggregates: TenantAggregate[]): Promise<void> {
  const entities = aggregates.map(aggregate => this.tenantMapper.toEntity(aggregate));
  await this.repository.save(entities);
}
```

#### Q: 如何优化事件处理性能？

**A**:

```typescript
// 1. 异步处理
@EventsHandler(TenantCreatedEvent)
export class TenantCreatedHandler implements IEventHandler<TenantCreatedEvent> {
  async handle(event: TenantCreatedEvent): Promise<void> {
    // 异步发送邮件
    setImmediate(() => {
      this.emailService.sendWelcomeEmail(event.adminEmail);
    });
  }
}

// 2. 批量处理
@EventsHandler(TenantCreatedEvent)
export class TenantCreatedHandler implements IEventHandler<TenantCreatedEvent> {
  private eventQueue: TenantCreatedEvent[] = [];
  private batchSize = 10;

  async handle(event: TenantCreatedEvent): Promise<void> {
    this.eventQueue.push(event);
    
    if (this.eventQueue.length >= this.batchSize) {
      await this.processBatch();
    }
  }

  private async processBatch(): Promise<void> {
    const batch = this.eventQueue.splice(0, this.batchSize);
    await this.emailService.sendBatchWelcomeEmails(batch);
  }
}
```

---

## 3. 性能优化

### 3.1 数据库优化

```typescript
// 1. 连接池配置
export const databaseConfig = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [TenantEntity, UserEntity],
  synchronize: false, // 生产环境关闭
  logging: false,
  poolSize: 20, // 连接池大小
  acquireTimeout: 60000,
  timeout: 60000,
  extra: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
};

// 2. 查询优化
export class OptimizedTenantRepository {
  async findActiveTenantsWithUsers(): Promise<TenantWithUsers[]> {
    return await this.repository
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.users', 'user')
      .where('tenant.status = :status', { status: TENANT_STATUS.ACTIVE })
      .andWhere('user.status = :userStatus', { userStatus: UserStatus.ACTIVE })
      .select([
        'tenant.id',
        'tenant.code',
        'tenant.name',
        'user.id',
        'user.email',
        'user.username'
      ])
      .getMany();
  }
}
```

### 3.2 缓存优化

```typescript
// 1. 缓存预热
export class CacheWarmupService {
  async warmupTenantCache(): Promise<void> {
    const activeTenants = await this.tenantRepository.findActiveTenants();
    
    for (const tenant of activeTenants) {
      const cacheKey = `tenant:${tenant.getId().getValue()}`;
      await this.cacheAdapter.set(cacheKey, tenant, 3600);
    }
  }
}

// 2. 缓存更新策略
export class CacheUpdateStrategy {
  // 写入时更新缓存
  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<void> {
    // 1. 更新数据库
    await this.tenantRepository.update(tenantId, updates);
    
    // 2. 更新缓存
    const updatedTenant = await this.tenantRepository.findById(TenantId.create(tenantId));
    const cacheKey = `tenant:${tenantId}`;
    await this.cacheAdapter.set(cacheKey, updatedTenant, 3600);
  }
  
  // 删除时清理缓存
  async deleteTenant(tenantId: string): Promise<void> {
    // 1. 删除数据库记录
    await this.tenantRepository.delete(TenantId.create(tenantId));
    
    // 2. 清理缓存
    const cacheKey = `tenant:${tenantId}`;
    await this.cacheAdapter.delete(cacheKey);
  }
}
```

### 3.3 内存优化

```typescript
// 1. 对象池
export class TenantAggregatePool {
  private pool: TenantAggregate[] = [];
  private maxSize = 100;

  acquire(): TenantAggregate {
    return this.pool.pop() || new TenantAggregate();
  }

  release(aggregate: TenantAggregate): void {
    if (this.pool.length < this.maxSize) {
      aggregate.reset(); // 重置状态
      this.pool.push(aggregate);
    }
  }
}

// 2. 内存监控
export class MemoryMonitorService {
  private memoryThreshold = 100 * 1024 * 1024; // 100MB

  checkMemoryUsage(): void {
    const usage = process.memoryUsage();
    
    if (usage.heapUsed > this.memoryThreshold) {
      this.logger.warn('内存使用量过高', { usage });
      
      // 触发垃圾回收
      if (global.gc) {
        global.gc();
      }
    }
  }
}
```

---

## 4. 安全最佳实践

### 4.1 输入验证

```typescript
// 1. 严格的输入验证
export class SecureTenantController {
  @Post()
  async createTenant(@Body() createTenantDto: CreateTenantDto): Promise<CreateTenantResponseDto> {
    // 验证输入
    await this.validateInput(createTenantDto);
    
    // 清理输入
    const cleanedInput = this.sanitizeInput(createTenantDto);
    
    // 执行业务逻辑
    return await this.createTenantUseCase.execute(cleanedInput);
  }

  private async validateInput(dto: CreateTenantDto): Promise<void> {
    // 检查SQL注入
    if (this.containsSqlInjection(dto.name) || this.containsSqlInjection(dto.code)) {
      throw new BadRequestException('输入包含非法字符');
    }
    
    // 检查XSS
    if (this.containsXss(dto.name)) {
      throw new BadRequestException('输入包含潜在XSS攻击');
    }
  }

  private sanitizeInput(dto: CreateTenantDto): CreateTenantDto {
    return {
      ...dto,
      name: this.escapeHtml(dto.name),
      code: this.escapeHtml(dto.code)
    };
  }
}
```

### 4.2 权限控制

```typescript
// 1. 细粒度权限控制
export class SecureTenantService {
  @CheckPolicies((ability: AppAbility) => ability.can('create', 'Tenant'))
  async createTenant(request: CreateTenantRequest, user: User): Promise<CreateTenantResponse> {
    // 检查租户级别权限
    if (user.getTenantId() && !ability.can('create', 'Tenant', { tenantId: user.getTenantId() })) {
      throw new ForbiddenException('没有权限在此租户下创建租户');
    }
    
    return await this.createTenantUseCase.execute(request);
  }

  @CheckPolicies((ability: AppAbility) => ability.can('read', 'Tenant'))
  async getTenant(tenantId: string, user: User): Promise<GetTenantResponse> {
    // 检查数据访问权限
    if (!ability.can('read', 'Tenant', { tenantId })) {
      throw new ForbiddenException('没有权限访问此租户');
    }
    
    return await this.getTenantUseCase.execute(new GetTenantRequest(tenantId));
  }
}
```

### 4.3 数据加密

```typescript
// 1. 敏感数据加密
export class DataEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

---

## 5. 代码质量

### 5.1 代码规范

```typescript
// 1. 命名规范
export class TenantAggregate extends BaseAggregateRoot { // PascalCase
  private readonly tenantId: TenantId; // camelCase
  private readonly tenant: Tenant; // camelCase

  private static readonly MAX_RETRY_ATTEMPTS = 3; // UPPER_SNAKE_CASE

  public activate(): void { // camelCase
    // 方法实现
  }
}

// 2. 注释规范
/**
 * 租户聚合根
 * 
 * 负责管理租户的生命周期和业务规则验证
 * 
 * @description 租户聚合根是租户领域的管理者，负责协调内部实体操作
 * 并确保聚合内数据的一致性
 * 
 * @example
 * ```typescript
 * const tenantAggregate = TenantAggregate.create(
 *   tenantId,
 *   'acme-corp',
 *   'Acme Corporation',
 *   TenantType.BASIC,
 *   'admin-123'
 * );
 * 
 * tenantAggregate.activate();
 * ```
 * 
 * @since 1.0.0
 */
export class TenantAggregate extends BaseAggregateRoot {
  // 实现
}
```

### 5.2 错误处理

```typescript
// 1. 自定义异常
export class TenantBusinessException extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TenantBusinessException';
  }
}

// 2. 异常处理策略
export class TenantService {
  async createTenant(request: CreateTenantRequest): Promise<CreateTenantResponse> {
    try {
      return await this.createTenantUseCase.execute(request);
    } catch (error) {
      if (error instanceof TenantBusinessException) {
        // 业务异常，直接抛出
        throw error;
      }
      
      if (error instanceof ValidationException) {
        // 验证异常，转换为客户端错误
        throw new BadRequestException(error.message);
      }
      
      // 未知异常，记录日志并抛出通用错误
      this.logger.error('创建租户失败', { request, error });
      throw new InternalServerErrorException('创建租户失败，请稍后重试');
    }
  }
}
```

---

## 6. 团队协作

### 6.1 Git工作流

```bash
# 1. 功能开发
git checkout -b feature/tenant-management
git commit -m "feat: 添加租户管理功能"
git push origin feature/tenant-management

# 2. 代码审查
git checkout -b fix/tenant-validation-bug
git commit -m "fix: 修复租户验证逻辑错误"
git push origin fix/tenant-validation-bug

# 3. 发布准备
git checkout -b release/v1.0.0
git commit -m "chore: 准备发布v1.0.0"
git tag v1.0.0
git push origin v1.0.0
```

### 6.2 代码审查检查清单

```markdown
## 代码审查检查清单

### 架构设计
- [ ] 是否符合Clean Architecture原则
- [ ] 是否遵循充血模型
- [ ] 聚合根和实体职责是否清晰
- [ ] 用例服务是否单一职责

### 代码质量
- [ ] 是否有完整的TSDoc注释
- [ ] 命名是否清晰明确
- [ ] 是否有适当的错误处理
- [ ] 是否有单元测试覆盖

### 性能考虑
- [ ] 数据库查询是否优化
- [ ] 是否有适当的缓存策略
- [ ] 是否有内存泄漏风险
- [ ] 是否有性能瓶颈

### 安全考虑
- [ ] 输入验证是否完整
- [ ] 权限控制是否正确
- [ ] 敏感数据是否加密
- [ ] 是否有安全漏洞
```

---

## 7. 故障排查

### 7.1 常见故障

#### 数据库连接问题

```typescript
// 1. 连接池耗尽
export class DatabaseHealthCheck {
  async checkConnectionPool(): Promise<HealthStatus> {
    const pool = this.dataSource.driver.pool;
    
    if (pool.numUsed() >= pool.numFree()) {
      return {
        status: 'unhealthy',
        message: '数据库连接池接近耗尽',
        details: {
          used: pool.numUsed(),
          free: pool.numFree(),
          total: pool.numUsed() + pool.numFree()
        }
      };
    }
    
    return { status: 'healthy' };
  }
}

// 2. 查询超时
export class QueryTimeoutHandler {
  async executeWithTimeout<T>(query: () => Promise<T>, timeoutMs: number = 5000): Promise<T> {
    return Promise.race([
      query(),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('查询超时')), timeoutMs)
      )
    ]);
  }
}
```

#### 内存泄漏问题

```typescript
// 1. 事件监听器泄漏
export class EventListenerManager {
  private listeners = new Map<string, Function[]>();

  addListener(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  removeListener(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}

// 2. 缓存泄漏
export class CacheLeakDetector {
  private cacheStats = new Map<string, { hits: number; misses: number; size: number }>();

  trackCacheUsage(cacheName: string, hit: boolean, size: number): void {
    if (!this.cacheStats.has(cacheName)) {
      this.cacheStats.set(cacheName, { hits: 0, misses: 0, size: 0 });
    }
    
    const stats = this.cacheStats.get(cacheName)!;
    if (hit) {
      stats.hits++;
    } else {
      stats.misses++;
    }
    stats.size = size;
  }

  detectLeaks(): string[] {
    const leaks: string[] = [];
    
    for (const [cacheName, stats] of this.cacheStats) {
      const hitRate = stats.hits / (stats.hits + stats.misses);
      if (hitRate < 0.5 && stats.size > 1000) {
        leaks.push(`缓存 ${cacheName} 可能存在泄漏，命中率: ${hitRate.toFixed(2)}`);
      }
    }
    
    return leaks;
  }
}
```

### 7.2 监控和告警

```typescript
// 1. 性能监控
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // 保持最近1000个值
    if (values.length > 1000) {
      values.shift();
    }
  }

  getMetricStats(name: string): MetricStats | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      count: len,
      min: sorted[0],
      max: sorted[len - 1],
      avg: values.reduce((a, b) => a + b, 0) / len,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }
}

// 2. 告警系统
export class AlertManager {
  private alertRules = new Map<string, AlertRule>();

  addAlertRule(name: string, rule: AlertRule): void {
    this.alertRules.set(name, rule);
  }

  async checkAlerts(): Promise<void> {
    for (const [name, rule] of this.alertRules) {
      const value = await rule.getValue();
      
      if (this.evaluateCondition(value, rule.condition)) {
        await this.sendAlert({
          rule: name,
          value,
          threshold: rule.threshold,
          severity: rule.severity,
          message: rule.message
        });
      }
    }
  }

  private evaluateCondition(value: number, condition: string): boolean {
    // 简化的条件评估
    if (condition.includes('>')) {
      const threshold = parseFloat(condition.split('>')[1]);
      return value > threshold;
    }
    
    if (condition.includes('<')) {
      const threshold = parseFloat(condition.split('<')[1]);
      return value < threshold;
    }
    
    return false;
  }
}
```

---

## 8. 参考资料

### 8.1 官方文档

- [NestJS官方文档](https://docs.nestjs.com/)
- [MikroORM官方文档](https://mikro-orm.io/)
- [Domain-Driven Design](https://martinfowler.com/tags/domain%20driven%20design.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### 8.2 最佳实践指南

- [TypeScript最佳实践](https://typescript-eslint.io/docs/)
- [Node.js性能最佳实践](https://nodejs.org/en/docs/guides/simple-profiling/)
- [PostgreSQL性能调优](https://wiki.postgresql.org/wiki/Performance_Optimization)

### 8.3 工具和库

- [Jest测试框架](https://jestjs.io/)
- [ESLint代码检查](https://eslint.org/)
- [Prettier代码格式化](https://prettier.io/)
- [Docker容器化](https://docs.docker.com/)

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md)
- [项目结构与模块职责](./03-project-structure.md)
- [领域层开发指南](./04-domain-layer-development.md)
- [应用层开发指南](./05-application-layer-development.md)
- [基础设施层开发指南](./06-infrastructure-layer-development.md)
- [接口层开发指南](./07-interface-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [测试策略与部署运维](./09-testing-and-deployment.md)
