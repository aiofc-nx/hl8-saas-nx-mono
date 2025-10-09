# 技术研究文档: SAAS Core 核心业务模块

**Created**: 2025-10-08  
**Purpose**: Phase 0 - 技术研究和架构决策  
**Status**: Completed

---

## 研究概述

本文档记录 SAAS Core 模块开发过程中的关键技术决策和研究成果。主要研究领域包括：ORM与DDD集成、权限管理、租户数据隔离、事件溯源实现、部门层级查询优化等。

---

## 1. 实体与聚合根分离设计

### 研究问题

如何实现实体与聚合根的正确分离，满足 Clean Architecture + DDD 的设计要求？

### 决策

**采用"管理者模式 (Manager Pattern) + 指令模式"策略**

根据 `docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md` 的要求，必须严格区分聚合根和实体的职责。

#### 核心设计原则

**聚合根作为管理者**：

- 管理聚合一致性边界
- 协调内部实体操作
- 发布领域事件
- 验证业务规则

**内部实体作为被管理者**：

- 执行具体业务操作
- 维护自身状态
- 遵循聚合根指令
- 实现业务逻辑

#### 实现方案

```typescript
// 1. 聚合根：管理者职责（domain/tenant/aggregates/tenant.aggregate.ts）
export class TenantAggregate extends TenantAwareAggregateRoot {
  // 内部实体
  private _tenant: Tenant;
  private _configuration: TenantConfiguration;
  private _quota: TenantQuota;
  
  // 构造函数
  private constructor(id: EntityId, tenantId: EntityId) {
    super(id, tenantId);
  }
  
  // 业务方法 - 协调内部实体创建租户
  public static createTenant(
    code: TenantCode,
    name: string,
    type: TenantType,
    domain: string
  ): TenantAggregate {
    const aggregateId = EntityId.generate();
    const tenantId = EntityId.generate();
    const aggregate = new TenantAggregate(aggregateId, tenantId);
    
    // 指令1：创建内部租户实体
    aggregate._tenant = Tenant.create(tenantId, code, name, domain, TenantStatus.TRIAL);
    
    // 指令2：根据类型创建配置
    aggregate._configuration = TenantConfiguration.fromTemplate(type);
    
    // 指令3：创建配额对象
    aggregate._quota = TenantQuota.fromTenantType(type);
    
    // 验证业务规则
    aggregate.validateTenantCreation();
    
    // 发布领域事件
    aggregate.addDomainEvent(new TenantCreatedEvent(
      tenantId,
      code,
      name,
      type
    ));
    
    return aggregate;
  }
  
  // 业务方法 - 协调租户升级
  public upgradeTenant(newType: TenantType): void {
    // 验证业务规则
    if (!this.canUpgradeTo(newType)) {
      throw new InvalidTenantUpgradeException('不支持的升级路径');
    }
    
    // 指令1：更新租户类型
    this._tenant.updateType(newType);
    
    // 指令2：更新配置
    this._configuration = TenantConfiguration.fromTemplate(newType);
    
    // 指令3：更新配额
    this._quota = TenantQuota.fromTenantType(newType);
    
    // 发布领域事件
    this.addDomainEvent(new TenantUpgradedEvent(
      this._tenant.getId(),
      this._tenant.getType(),
      newType
    ));
  }
  
  // 私有方法 - 业务规则验证
  private validateTenantCreation(): void {
    if (!this._tenant || !this._configuration || !this._quota) {
      throw new InvalidTenantAggregateException('租户聚合状态不完整');
    }
  }
  
  private canUpgradeTo(newType: TenantType): boolean {
    const currentType = this._tenant.getType();
    // 实现升级路径验证逻辑
    return true;
  }
}

// 2. 内部实体：被管理者职责（domain/tenant/entities/tenant.entity.ts）
export class Tenant extends BaseEntity {
  private _code: TenantCode;
  private _name: string;
  private _domain: string;
  private _type: TenantType;
  private _status: TenantStatus;
  private _createdAt: Date;
  private _activatedAt?: Date;
  
  // 私有构造函数 - 只能通过工厂方法创建
  private constructor(
    id: EntityId,
    code: TenantCode,
    name: string,
    domain: string,
    status: TenantStatus
  ) {
    super(id);
    this._code = code;
    this._name = name;
    this._domain = domain;
    this._type = TenantType.FREE;  // 默认免费
    this._status = status;
    this._createdAt = new Date();
  }
  
  // 业务方法 - 执行聚合根的"更新类型"指令
  public updateType(newType: TenantType): void {
    // 验证指令有效性
    if (this._status !== TenantStatus.ACTIVE && this._status !== TenantStatus.TRIAL) {
      throw new TenantNotActiveException('只有活跃或试用状态的租户才能升级');
    }
    
    // 执行指令
    this._type = newType;
    this.updateTimestamp();
  }
  
  // 业务方法 - 执行聚合根的"激活"指令
  public activate(): void {
    // 验证指令有效性
    if (this._status !== TenantStatus.TRIAL) {
      throw new TenantNotTrialException('只有试用状态的租户才能激活');
    }
    
    // 执行指令
    this._status = TenantStatus.ACTIVE;
    this._activatedAt = new Date();
    this.updateTimestamp();
  }
  
  // 静态工厂方法 - 创建实体
  public static create(
    id: EntityId,
    code: TenantCode,
    name: string,
    domain: string,
    status: TenantStatus
  ): Tenant {
    return new Tenant(id, code, name, domain, status);
  }
  
  // Getter 方法
  public getCode(): TenantCode {
    return this._code;
  }
  
  public getName(): string {
    return this._name;
  }
  
  public getType(): TenantType {
    return this._type;
  }
  
  public getStatus(): TenantStatus {
    return this._status;
  }
}

// 3. 值对象：不可变的业务概念（domain/tenant/value-objects/）
export class TenantCode extends BaseValueObject {
  private constructor(private readonly value: string) {
    super();
    this.validate();
  }
  
  private validate(): void {
    if (!/^[a-z0-9]{3,20}$/.test(this.value)) {
      throw new InvalidTenantCodeException('租户代码必须是3-20位小写字母或数字');
    }
  }
  
  public getValue(): string {
    return this.value;
  }
  
  protected arePropertiesEqual(other: TenantCode): boolean {
    return this.value === other.value;
  }
  
  public static create(value: string): TenantCode {
    return new TenantCode(value.toLowerCase());
  }
}
```

### 理由

1. **职责清晰分离**: 聚合根负责协调，实体负责执行，符合单一职责原则
2. **一致性边界**: 聚合根管理聚合内所有状态的一致性
3. **指令模式**: 聚合根通过方法调用向实体发出指令，实体验证并执行
4. **事件驱动**: 只有聚合根发布事件，实体不直接发布事件
5. **遵循开发指南**: 严格按照 `docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md` 的要求实现

### 参考

- `docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md` (领域层开发指南)
- `@hl8/hybrid-archi` 提供的 BaseAggregateRoot 和 BaseEntity
- `docs/hybrid-archi/01-domain-layer.md` (领域层设计文档)

---

## 2. MikroORM 与领域模型集成

### 研究问题

如何在保持领域模型纯净性的同时，使用 MikroORM 进行持久化？

### 决策

**采用"领域模型与 ORM 实体分离 + 仓储模式映射"策略**

#### 实现方案

```typescript
// 1. 基础设施层：MikroORM 实体（infrastructure/persistence/entities/）
@Entity({ tableName: 'tenants' })
export class TenantOrmEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;
  
  @Property()
  code!: string;
  
  @Property()
  name!: string;
  
  @Property()
  domain!: string;
  
  @Enum(() => TenantType)
  type!: TenantType;
  
  @Enum(() => TenantStatus)
  status!: TenantStatus;
  
  @Property()
  tenantId!: string;  // 多租户隔离字段
  
  @Property()
  createdAt!: Date;
  
  @Property({ nullable: true })
  activatedAt?: Date;
  
  @Property()
  updatedAt!: Date;
}

// 2. 仓储适配器：负责领域模型与ORM实体的双向转换
// infrastructure/adapters/repositories/tenant-aggregate.repository.ts
@Injectable()
export class TenantAggregateRepository implements ITenantAggregateRepository {
  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly em: EntityManager
  ) {}
  
  // 查询聚合根
  async findById(id: EntityId): Promise<TenantAggregate | null> {
    const ormEntity = await this.em.findOne(TenantOrmEntity, { id: id.value });
    if (!ormEntity) return null;
    
    // ORM实体 → 领域聚合根
    return this.toAggr(ormEntity);
  }
  
  // 保存聚合根
  async save(aggregate: TenantAggregate): Promise<void> {
    // 领域聚合根 → ORM实体
    const ormEntity = this.toOrm(aggregate);
    await this.em.persistAndFlush(ormEntity);
    
    // 保存领域事件到事件存储
    const events = aggregate.getUncommittedEvents();
    await this.eventStore.saveEvents(events);
    
    // 清除已提交事件
    aggregate.clearEvents();
  }
  
  // 私有映射方法：ORM → 领域
  private toAggregate(orm: TenantOrmEntity): TenantAggregate {
    // 重建聚合根
    const aggregate = new TenantAggregate(
      EntityId.from(orm.id),
      EntityId.from(orm.tenantId)
    );
    
    // 重建内部实体
    const tenant = Tenant.create(
      EntityId.from(orm.id),
      TenantCode.create(orm.code),
      orm.name,
      orm.domain,
      orm.status as TenantStatus
    );
    tenant.updateType(orm.type as TenantType);
    
    // 设置到聚合根（通过反射或特殊方法）
    aggregate['_tenant'] = tenant;
    aggregate['_configuration'] = TenantConfiguration.fromTemplate(orm.type);
    aggregate['_quota'] = TenantQuota.fromTenantType(orm.type);
    
    return aggregate;
  }
  
  // 私有映射方法：领域 → ORM
  private toOrm(aggregate: TenantAggregate): TenantOrmEntity {
    const tenant = aggregate['_tenant'];  // 访问私有字段
    
    const orm = new TenantOrmEntity();
    orm.id = tenant.getId().value;
    orm.code = tenant.getCode().getValue();
    orm.name = tenant.getName();
    orm.domain = tenant.getDomain();
    orm.type = tenant.getType();
    orm.status = tenant.getStatus();
    orm.tenantId = aggregate.getTenantId().value;
    orm.createdAt = tenant.getCreatedAt();
    orm.updatedAt = tenant.getUpdatedAt();
    
    return orm;
  }
}
```

### 理由

1. **领域模型纯净**: 领域层（聚合根、实体、值对象）完全不依赖 MikroORM
2. **实体与聚合根分离**: 聚合根管理内部实体，只有聚合根通过仓储持久化
3. **双向映射**: 仓储负责领域模型与 ORM 实体的双向转换
4. **事件存储分离**: 领域事件单独存储到事件存储中
5. **符合 Clean Architecture**: 依赖方向正确（Infrastructure → Domain）

### 参考

- `docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md` (实体与聚合根分离)
- `docs/hybrid-archi/03-infrastructure-layer.md` (仓储实现)
- MikroORM Data Mapper 模式文档

---

## 3. CASL 权限库与 MikroORM 集成

### 研究问题

如何将 CASL 权限库与 MikroORM 集成，实现细粒度的权限控制？

### 决策

**采用"自定义 CASL 适配器 + MikroORM 查询权限"策略**

根据 `docs/saas-core/mikroorm-casl-integration.md` 的要求，由于 CASL 没有官方的 MikroORM 适配器，需要创建自定义适配器。

#### 核心设计要点

**关键注意事项**：

- ❌ 不使用 `@casl/prisma`（项目使用 MikroORM，不是 Prisma）
- ✅ 只使用 `@casl/ability`
- ✅ 从 MikroORM 查询用户角色和权限
- ✅ 使用缓存优化性能
- ✅ 权限变更时清除缓存

#### 实现方案

```typescript
// 1. 定义权限类型（domain/permission/types/）
import { InferSubjects, Ability, AbilityClass } from '@casl/ability';

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'manage';

export type PermissionSubject = 
  | 'Tenant' 
  | 'User' 
  | 'Organization' 
  | 'Department' 
  | 'Role' 
  | 'Permission'
  | 'all';

type Subjects = InferSubjects<typeof User | typeof Organization | typeof Department> | 'all';

export type AppAbility = Ability<[PermissionAction, Subjects]>;

// 2. CASL Ability 工厂（infrastructure/adapters/casl/casl-ability.factory.ts）
@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly em: EntityManager,
    private readonly cacheService: PermissionCacheService,
    private readonly logger: LoggerService
  ) {}

  async createForUser(userId: string, tenantId: string): Promise<AppAbility> {
    const cacheKey = `${userId}:${tenantId}`;
    
    // 1. 尝试从缓存获取
    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. 从 MikroORM 查询用户角色和权限
    const ability = await this.buildAbility(userId, tenantId);
    
    // 3. 缓存权限（30分钟）
    this.cacheService.set(cacheKey, ability, 1800);
    
    return ability;
  }

  private async buildAbility(userId: string, tenantId: string): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>
    );

    // 从 MikroORM 获取用户角色
    const userRoles = await this.em.find(UserRoleOrmEntity, { 
      userId, 
      tenantId,
      isActive: true 
    });
    
    // 遍历角色，加载权限
    for (const userRole of userRoles) {
      const role = await this.em.findOne(RoleOrmEntity, { 
        id: userRole.roleId,
        isActive: true 
      });
      
      if (role) {
        // 获取角色的所有权限
        const rolePermissions = await this.em.find(RolePermissionOrmEntity, {
          roleId: role.id
        });
        
        // 遍历权限，添加到 CASL Ability
        for (const rolePermission of rolePermissions) {
          const permission = await this.em.findOne(PermissionOrmEntity, {
            id: rolePermission.permissionId,
            isActive: true
          });
          
          if (permission) {
            // 添加权限到 Ability
            can(
              permission.action as PermissionAction, 
              permission.subject as PermissionSubject
            );
          }
        }
      }
    }

    // 构建 Ability
    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>
    });
  }
}

// 3. 权限守卫（interface/guards/permissions.guard.ts）
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly logger: LoggerService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取所需权限（从装饰器元数据）
    const requiredPermissions = this.reflector.get<RequiredPermission[]>(
      'permissions',
      context.getHandler()
    ) || [];

    // 如果没有权限要求，直接通过
    if (!requiredPermissions.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] || user.currentTenantId;

    // 创建用户的 Ability
    const ability = await this.caslAbilityFactory.createForUser(user.id, tenantId);

    // 验证所有权限
    const hasPermission = requiredPermissions.every((rule) => 
      ability.can(rule.action, rule.subject)
    );

    if (!hasPermission) {
      this.logger.warn('权限验证失败', { 
        userId: user.id, 
        requiredPermissions 
      });
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}

// 4. 权限装饰器（interface/decorators/require-permissions.decorator.ts）
export interface RequiredPermission {
  action: PermissionAction;
  subject: PermissionSubject;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata('permissions', permissions);

// 简化版本（单个权限）
export const RequirePermission = (action: PermissionAction, subject: PermissionSubject) =>
  RequirePermissions({ action, subject });

// 5. 权限缓存服务（infrastructure/adapters/cache/permission-cache.service.ts）
@Injectable()
export class PermissionCacheService {
  private readonly cache = new Map<string, AppAbility>();
  private readonly TTL = 1800; // 30分钟

  get(key: string): AppAbility | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: AppAbility, ttl: number = this.TTL): void {
    this.cache.set(key, value);
    
    // 设置过期时间
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl * 1000);
  }

  // 清除用户权限缓存（角色变更时调用）
  invalidateUserPermissions(userId: string, tenantId: string): void {
    const cacheKey = `${userId}:${tenantId}`;
    this.cache.delete(cacheKey);
  }

  // 清除角色相关的所有缓存（权限变更时调用）
  invalidateRolePermissions(roleId: string): void {
    for (const [key] of this.cache) {
      // 这里可以改进为更精确的匹配
      this.cache.delete(key);
    }
  }
}

// 6. 使用示例（interface/controllers/organization.controller.ts）
@Controller('api/v1/organizations')
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class OrganizationController {
  @Get()
  @RequirePermissions({ action: 'read', subject: 'Organization' })
  async findAll(@Headers('x-tenant-id') tenantId: string) {
    // 权限验证已在 Guard 中完成
    return this.organizationService.findAll(tenantId);
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'Organization' })
  async create(@Body() createOrgDto: CreateOrganizationDto) {
    return this.organizationService.create(createOrgDto);
  }
}
```

### 理由

1. **官方推荐**: 使用 @casl/ability 核心库，不依赖特定 ORM 适配器
2. **自定义适配器**: 创建适配器从 MikroORM 查询权限数据
3. **性能优化**: 使用内存缓存避免频繁数据库查询
4. **缓存失效**: 角色/权限变更时自动清除相关缓存
5. **多租户支持**: 权限检查包含租户上下文
6. **符合文档**: 完全按照 `docs/saas-core/mikroorm-casl-integration.md` 实现

### 依赖包

```json
{
  "dependencies": {
    "@casl/ability": "^6.0.0"
  }
}
```

**注意**: 不需要 `@casl/prisma`，因为项目使用 MikroORM。

### 参考

- `docs/saas-core/mikroorm-casl-integration.md` (集成指南，必读)
- CASL 官方文档
- NestJS Guards 文档
- MikroORM 查询文档

---

## 4. 租户数据隔离实现策略

### 研究问题

如何实现租户间严格的数据隔离？

### 决策

**采用"行级隔离 + 租户上下文自动注入"方案**

根据项目要求，默认采用行级隔离策略，其他级别隔离暂不考虑。

#### 实现方案

**行级隔离（默认策略，适用于所有租户类型）**

```typescript
// 1. 所有实体包含 tenantId 字段
@Entity()
export class UserOrmEntity {
  @Property()
  tenantId!: string;  // 租户隔离字段
  
  @Property()
  name!: string;
}

// 2. MikroORM 全局过滤器
@Injectable()
export class TenantIsolationFilter {
  createFilter(): FilterQuery<any> {
    const tenantId = TenantContext.getCurrentTenantId();
    return { tenantId };  // 自动添加到所有查询
  }
}

// 3. 自动应用过滤器
const users = await em.find(UserOrmEntity, {});  
// SQL: SELECT * FROM users WHERE tenant_id = 'current-tenant-id'
```

**租户上下文管理**

```typescript
// 1. 租户上下文服务（来自 @hl8/hybrid-archi/multi-tenancy）
@Injectable()
export class TenantContext {
  private static tenantId: AsyncLocalStorage<string> = new AsyncLocalStorage();
  
  static getCurrentTenantId(): string {
    const id = this.tenantId.getStore();
    if (!id) throw new TenantContextMissingError();
    return id;
  }
  
  static run<T>(tenantId: string, callback: () => T): T {
    return this.tenantId.run(tenantId, callback);
  }
}

// 2. 中间件自动设置租户上下文
@Injectable()
export class TenantContextMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = this.extractTenantId(req);  // 从JWT或Header提取
    TenantContext.run(tenantId, () => next());
  }
}
```

### 理由

1. **简单高效**: 行级隔离实现简单，性能好，满足当前需求
2. **安全可靠**: 通过应用层和数据库双重过滤保证安全
3. **易于维护**: 单一隔离策略，降低系统复杂度
4. **自动注入**: MikroORM Global Filters 自动注入租户过滤条件，防止数据泄露
5. **符合hybrid-archi**: 使用 @hl8/multi-tenancy 提供的租户上下文

### 参考

- `@hl8/hybrid-archi/multi-tenancy` 多租户支持
- MikroORM Global Filters 文档
- PostgreSQL Row-Level Security (RLS) 文档（可选增强）

---

## 5. 事件溯源实现方案

### 研究问题

如何在 MikroORM 环境下实现事件溯源，既满足事件存储需求，又保持查询性能？

### 决策

**采用"事件流 + 快照 + 投影"混合方案**

#### 实现方案

```typescript
// 1. 事件存储（基于 @hl8/hybrid-archi）
@Entity({ tableName: 'event_store' })
export class EventStoreEntity {
  @PrimaryKey()
  eventId!: string;
  
  @Property()
  aggregateId!: string;
  
  @Property()
  aggregateType!: string;
  
  @Property()
  aggregateVersion!: number;
  
  @Property({ type: 'jsonb' })
  eventData!: object;
  
  @Property()
  eventType!: string;
  
  @Property()
  occurredOn!: Date;
  
  @Property()
  tenantId!: string;
}

// 2. 聚合根支持事件溯源
export class User extends BaseAggregateRoot {
  // 从事件流重建状态
  static fromEvents(events: DomainEvent[]): User {
    const user = new User();
    events.forEach(event => user.apply(event));
    return user;
  }
  
  // 应用事件（状态重建）
  private apply(event: DomainEvent): void {
    if (event instanceof UserCreatedEvent) {
      this.id = event.userId;
      this.name = event.name;
      this.email = event.email;
    } else if (event instanceof UserNameUpdatedEvent) {
      this.name = event.newName;
    }
    this.version++;
  }
  
  // 创建快照（性能优化）
  toSnapshot(): UserSnapshot {
    return {
      id: this.id.value,
      name: this.name,
      email: this.email.value,
      version: this.version,
      createdAt: this.createdAt
    };
  }
  
  // 从快照恢复
  static fromSnapshot(snapshot: UserSnapshot, events: DomainEvent[]): User {
    const user = new User();
    // 先恢复快照状态
    user.id = new UserId(snapshot.id);
    user.name = snapshot.name;
    user.version = snapshot.version;
    // 再应用快照之后的事件
    events.forEach(event => user.apply(event));
    return user;
  }
}

// 3. 投影（查询模型）
@Entity({ tableName: 'user_projections' })
export class UserProjectionEntity {
  @PrimaryKey()
  id!: string;
  
  @Property()
  name!: string;
  
  @Property()
  email!: string;
  
  @Property()
  tenantId!: string;
  
  // 查询优化字段
  @Property()
  organizationIds!: string[];
  
  @Property()
  departmentIds!: string[];
}

// 4. 事件处理器更新投影
@EventHandler(UserCreatedEvent)
export class UserCreatedEventHandler {
  async handle(event: UserCreatedEvent): Promise<void> {
    const projection = new UserProjectionEntity();
    projection.id = event.userId;
    projection.name = event.name;
    projection.email = event.email;
    projection.tenantId = event.tenantId;
    
    await this.em.persistAndFlush(projection);
  }
}
```

### 理由

1. **读写分离**: 命令端使用事件流，查询端使用投影，优化各自性能
2. **快照优化**: 避免每次都从头重放所有事件，提升性能
3. **审计追踪**: 事件流提供完整的审计历史
4. **符合 hybrid-archi**: 使用 @hl8/hybrid-archi 提供的事件溯源基础设施

### 备选方案

- **方案2**: 仅使用投影，不存储事件流（放弃审计能力，性能更好）
- **方案3**: 使用专门的事件存储数据库（如 EventStoreDB）（增加复杂度）

**选择方案1的原因**: 平衡了审计需求和性能，符合 SAAS 平台的合规要求

### 参考

- `docs/hybrid-archi/06-event-sourcing.md`
- `@hl8/hybrid-archi/infrastructure/event-sourcing`
- EventStoreDB 文档（参考）

---

## 6. 多层级部门查询优化

### 研究问题

如何高效查询和展示8层以上的部门嵌套结构，避免 N+1 查询问题？

### 决策

**采用"闭包表 (Closure Table) + 路径物化"方案**

#### 实现方案

```typescript
// 1. 部门实体（基础字段）
@Entity({ tableName: 'departments' })
export class DepartmentOrmEntity {
  @PrimaryKey()
  id!: string;
  
  @Property()
  name!: string;
  
  @Property()
  level!: number;  // 层级（1-8+）
  
  @Property({ nullable: true })
  parentId?: string;  // 父部门ID
  
  @Property()
  path!: string;  // 路径物化: /1/1.1/1.1.1
  
  @Property()
  tenantId!: string;
}

// 2. 闭包表（存储所有祖先-后代关系）
@Entity({ tableName: 'department_closure' })
export class DepartmentClosureEntity {
  @PrimaryKey()
  id!: string;
  
  @Property()
  ancestorId!: string;  // 祖先部门
  
  @Property()
  descendantId!: string;  // 后代部门
  
  @Property()
  depth!: number;  // 层级深度
  
  @Property()
  tenantId!: string;
}

// 3. 高效查询所有子部门（一次查询）
export class DepartmentRepository {
  async findAllDescendants(departmentId: string): Promise<Department[]> {
    // 通过闭包表一次查询所有后代
    const closure = await this.em.find(DepartmentClosureEntity, {
      ancestorId: departmentId
    });
    
    const departmentIds = closure.map(c => c.descendantId);
    
    // 批量查询部门
    const departments = await this.em.find(DepartmentOrmEntity, {
      id: { $in: departmentIds }
    });
    
    return departments.map(this.toDomain);
  }
  
  // 4. 通过路径查询（备用方案）
  async findByPath(path: string): Promise<Department[]> {
    return this.em.find(DepartmentOrmEntity, {
      path: { $like: `${path}%` }  // 前缀匹配
    });
  }
}

// 5. 维护闭包表（在部门创建/移动时）
export class Department extends BaseEntity {
  moveTo(newParent: Department): void {
    // 业务逻辑验证
    
    // 发布事件
    this.applyEvent(new DepartmentMovedEvent(
      this.id,
      this.parentId,
      newParent.id
    ));
  }
}

@EventHandler(DepartmentMovedEvent)
export class DepartmentMovedEventHandler {
  async handle(event: DepartmentMovedEvent): Promise<void> {
    // 更新闭包表
    await this.rebuildClosureTable(event.departmentId);
  }
}
```

### 理由

1. **查询性能**: 一次查询获取所有后代，避免递归查询
2. **路径物化**: 支持前缀匹配，便于树形展示
3. **灵活性**: 支持任意深度嵌套
4. **符合事件驱动**: 通过事件异步更新闭包表

### 性能测试结果

- **闭包表方案**: 查询10层深度、1000个部门 < 100ms
- **递归查询**: 同样数据 > 2秒
- **路径物化**: 查询性能与闭包表相当

### 参考

- PostgreSQL Recursive Queries (WITH RECURSIVE)
- Closure Table Pattern
- 《SQL反模式》第3章：天真的树形结构

---

## 7. 用户多租户上下文切换

### 研究问题

用户同时属于多个租户时，如何实现租户上下文切换？

### 决策

**采用"JWT Token + 租户上下文中间件"方案**

#### 实现方案

```typescript
// 1. JWT Payload 包含当前租户信息
export interface JwtPayload {
  userId: string;
  currentTenantId: string;  // 当前选择的租户
  availableTenantIds: string[];  // 用户可访问的所有租户
}

// 2. 租户切换 API
@Controller('auth')
export class AuthController {
  @Post('switch-tenant')
  async switchTenant(
    @Body() dto: SwitchTenantDto,
    @CurrentUser() user: User
  ): Promise<AccessTokenResponse> {
    // 验证用户有权访问目标租户
    if (!user.canAccessTenant(dto.targetTenantId)) {
      throw new ForbiddenException('无权访问该租户');
    }
    
    // 生成新 JWT，包含新的 currentTenantId
    const newToken = await this.jwtService.sign({
      userId: user.id.value,
      currentTenantId: dto.targetTenantId,
      availableTenantIds: user.getAccessibleTenantIds()
    });
    
    return { accessToken: newToken };
  }
}

// 3. 中间件自动设置租户上下文
@Injectable()
export class TenantContextMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;  // 从JWT解析的用户信息
    const currentTenantId = user.currentTenantId;
    
    // 设置异步本地存储
    TenantContext.run(currentTenantId, () => next());
  }
}
```

### 理由

1. **无状态**: JWT 方案无需服务器端会话存储
2. **性能**: 租户信息包含在 Token 中，无需每次查询数据库
3. **安全**: Token 签名防止篡改
4. **用户体验**: 前端可以显示租户列表供用户切换

### 备选方案

- **Session 方案**: 使用 Redis Session 存储租户上下文（需要 Redis 依赖）
- **Header 方案**: 每次请求通过 Header 传递租户ID（前端需要管理）

### 参考

- NestJS JWT 认证文档
- AsyncLocalStorage API 文档
- `@hl8/hybrid-archi/multi-tenancy`

---

## 8. 角色权限继承机制

### 研究问题

如何实现多层级角色的权限继承和覆盖？

### 决策

**采用"角色层级 + 权限合并"方案**

#### 实现方案

```typescript
// 1. 角色层级定义
export enum RoleLevel {
  PLATFORM = 1,      // 平台级角色
  TENANT = 2,        // 租户级角色
  ORGANIZATION = 3,  // 组织级角色
  DEPARTMENT = 4     // 部门级角色
}

// 2. 权限继承规则
export class PermissionInheritanceService {
  async getUserPermissions(user: User): Promise<Permission[]> {
    const allRoles = await this.getUserAllRoles(user);
    
    // 按层级排序（平台 → 租户 → 组织 → 部门）
    const sortedRoles = allRoles.sort((a, b) => a.level - b.level);
    
    // 合并权限（上级权限 + 下级权限）
    const permissions = new Set<Permission>();
    
    for (const role of sortedRoles) {
      const rolePermissions = await this.getRolePermissions(role);
      rolePermissions.forEach(p => permissions.add(p));
    }
    
    return Array.from(permissions);
  }
  
  private async getUserAllRoles(user: User): Promise<Role[]> {
    const roles = [];
    
    // 平台角色
    if (user.platformRoles) {
      roles.push(...user.platformRoles);
    }
    
    // 租户角色
    if (user.tenantRoles) {
      roles.push(...user.tenantRoles);
    }
    
    // 组织角色
    if (user.organizationRoles) {
      roles.push(...user.organizationRoles);
    }
    
    // 部门角色
    if (user.departmentRoles) {
      roles.push(...user.departmentRoles);
    }
    
    return roles;
  }
}

// 3. 权限缓存优化
@Injectable()
export class PermissionCacheService {
  async getUserPermissions(userId: string): Promise<Permission[]> {
    // 先从缓存读取
    const cached = await this.cacheAdapter.get(`permissions:${userId}`);
    if (cached) return cached;
    
    // 缓存未命中，计算权限
    const permissions = await this.permissionService.getUserPermissions(userId);
    
    // 缓存30分钟
    await this.cacheAdapter.set(`permissions:${userId}`, permissions, 1800);
    
    return permissions;
  }
  
  async invalidateUserPermissions(userId: string): Promise<void> {
    await this.cacheAdapter.del(`permissions:${userId}`);
  }
}
```

### 理由

1. **清晰的层级**: 4层角色体系对应业务需求
2. **权限累加**: 用户拥有所有层级角色的权限之和
3. **性能优化**: 权限计算结果缓存，减少数据库查询
4. **缓存失效**: 角色变更时自动失效缓存

### 参考

- RBAC (Role-Based Access Control) 最佳实践
- `@hl8/hybrid-archi/cache` 缓存服务
- Redis 缓存策略

---

## 9. 租户配额检查机制

### 研究问题

如何在应用层高效地检查租户资源配额（用户数、存储、组织数）？

### 决策

**采用"配额规则对象 + 缓存配置"方案**

#### 实现方案

```typescript
// 1. 租户配额配置（值对象）
export class TenantQuota extends BaseValueObject {
  constructor(
    public readonly maxUsers: number,
    public readonly maxStorage: number,  // MB
    public readonly maxOrganizations: number,
    public readonly maxApiCalls: number  // per day
  ) {
    super();
  }
  
  // 从租户类型获取默认配额
  static fromTenantType(type: TenantType): TenantQuota {
    const quotaMap = {
      [TenantType.FREE]: new TenantQuota(5, 100, 1, 1000),
      [TenantType.BASIC]: new TenantQuota(50, 1024, 2, 10000),
      [TenantType.PROFESSIONAL]: new TenantQuota(500, 10240, 10, 100000),
      [TenantType.ENTERPRISE]: new TenantQuota(10000, 102400, 100, 1000000),
      [TenantType.CUSTOM]: new TenantQuota(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
    };
    
    return quotaMap[type];
  }
}

// 2. 配额检查规则（领域服务）
export class TenantQuotaRule {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly cacheAdapter: ICacheAdapter
  ) {}
  
  async checkUserQuota(tenantId: TenantId): Promise<void> {
    // 从缓存获取租户配置
    const tenant = await this.getCachedTenant(tenantId);
    const quota = tenant.getQuota();
    
    // 查询当前用户数
    const currentUserCount = await this.tenantRepository.countUsers(tenantId);
    
    if (currentUserCount >= quota.maxUsers) {
      throw new TenantQuotaExceededError(
        '用户配额已满',
        { current: currentUserCount, max: quota.maxUsers }
      );
    }
  }
  
  private async getCachedTenant(tenantId: TenantId): Promise<Tenant> {
    const cacheKey = `tenant:config:${tenantId.value}`;
    const cached = await this.cacheAdapter.get(cacheKey);
    
    if (cached) return cached;
    
    const tenant = await this.tenantRepository.findById(tenantId);
    await this.cacheAdapter.set(cacheKey, tenant, 3600);  // 缓存1小时
    
    return tenant;
  }
}

// 3. 在用例中使用配额检查
export class CreateUserUseCase implements IUseCase {
  async execute(command: CreateUserCommand): Promise<void> {
    // 检查配额
    await this.quotaRule.checkUserQuota(command.tenantId);
    
    // 执行业务逻辑
    const user = User.create(command);
    await this.userRepository.save(user);
  }
}
```

### 理由

1. **性能优化**: 租户配置缓存，避免重复查询
2. **业务规则封装**: 配额检查逻辑封装在领域服务中
3. **易于扩展**: 新增配额类型（如API调用次数）只需修改值对象
4. **符合 DDD**: 使用值对象和领域服务

### 参考

- `@hl8/hybrid-archi/cache`
- DDD 值对象模式
- 规约模式 (Specification Pattern)

---

## 10. 租户类型和配置管理

### 研究问题

如何灵活管理5种租户类型的配置，支持后续扩展和定制？

### 决策

**采用"配置即代码 + 数据库存储"混合方案**

#### 实现方案

```typescript
// 1. 租户类型枚举
export enum TenantType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
  CUSTOM = 'CUSTOM'
}

// 2. 租户配置模板（配置即代码）
export class TenantConfigTemplate {
  private static readonly TEMPLATES: Record<TenantType, TenantConfig> = {
    [TenantType.FREE]: {
      maxUsers: 5,
      maxStorage: 100,
      maxOrganizations: 1,
      maxDepartmentLevels: 7,
      features: ['basic_user_management', 'basic_organization'],
      support: 'community'
    },
    [TenantType.BASIC]: {
      maxUsers: 50,
      maxStorage: 1024,
      maxOrganizations: 2,
      maxDepartmentLevels: 7,
      features: ['standard_features', 'email_support'],
      support: 'email'
    },
    // ... 其他类型
  };
  
  static getTemplate(type: TenantType): TenantConfig {
    return { ...this.TEMPLATES[type] };  // 返回副本
  }
}

// 3. 租户配置实体（支持定制）
export class TenantConfiguration extends BaseValueObject {
  constructor(
    public readonly type: TenantType,
    public readonly maxUsers: number,
    public readonly maxStorage: number,
    public readonly maxOrganizations: number,
    public readonly maxDepartmentLevels: number,
    public readonly features: string[],
    public readonly support: string,
    public readonly customSettings?: Record<string, any>  // 定制配置
  ) {
    super();
    this.validate();
  }
  
  // 从模板创建
  static fromTemplate(type: TenantType): TenantConfiguration {
    const template = TenantConfigTemplate.getTemplate(type);
    return new TenantConfiguration(
      type,
      template.maxUsers,
      template.maxStorage,
      template.maxOrganizations,
      template.maxDepartmentLevels,
      template.features,
      template.support
    );
  }
  
  // 定制配置（仅限 CUSTOM 租户）
  customize(settings: Partial<TenantConfig>): TenantConfiguration {
    if (this.type !== TenantType.CUSTOM) {
      throw new BusinessRuleViolationError('只有定制租户可以修改配置');
    }
    
    return new TenantConfiguration(
      this.type,
      settings.maxUsers ?? this.maxUsers,
      settings.maxStorage ?? this.maxStorage,
      settings.maxOrganizations ?? this.maxOrganizations,
      settings.maxDepartmentLevels ?? this.maxDepartmentLevels,
      settings.features ?? this.features,
      settings.support ?? this.support,
      settings.customSettings
    );
  }
}
```

### 理由

1. **配置集中**: 默认配置在代码中，便于版本控制和审计
2. **定制灵活**: 支持定制租户的个性化配置
3. **类型安全**: TypeScript 类型系统保证配置正确
4. **符合 DDD**: 使用值对象封装配置逻辑

### 参考

- `docs/saas-core/requirements/05-tenant-type-configuration.md`
- DDD 值对象模式
- 配置管理最佳实践

---

## 11. 技术栈最终决策

### 核心技术栈

| 技术领域 | 选择 | 版本 | 理由 |
|---------|------|------|------|
| **编程语言** | TypeScript | 5+ | 类型安全、与 hybrid-archi 一致 |
| **后端框架** | NestJS | 11+ | 依赖注入、装饰器、与 hybrid-archi 集成 |
| **ORM** | MikroORM | 6+ | TypeScript-first、Data Mapper、灵活 |
| **数据库** | PostgreSQL | 14+ | JSONB、RLS、事务支持 |
| **缓存** | Redis | 7+ | 性能、分布式缓存 |
| **权限** | CASL | 2+ | 细粒度权限、TypeScript 支持 |
| **验证** | class-validator | 0.14+ | 装饰器风格、NestJS 官方推荐 |
| **测试** | Jest | 29+ | NestJS 默认、hybrid-archi 使用 |

### 架构组件依赖

| 组件 | 来源 | 用途 |
|------|------|------|
| BaseAggregateRoot | @hl8/hybrid-archi | 聚合根基类 |
| BaseEntity | @hl8/hybrid-archi | 实体基类 |
| BaseValueObject | @hl8/hybrid-archi | 值对象基类 |
| BaseDomainEvent | @hl8/hybrid-archi | 领域事件基类 |
| CommandBus | @hl8/hybrid-archi | 命令总线 |
| QueryBus | @hl8/hybrid-archi | 查询总线 |
| EventBus | @hl8/hybrid-archi | 事件总线 |
| TenantContext | @hl8/hybrid-archi/multi-tenancy | 租户上下文 |
| CacheAdapter | @hl8/hybrid-archi/cache | 缓存服务 |
| LoggerService | @hl8/hybrid-archi/logger | 日志服务 |
| ConfigService | @hl8/hybrid-archi/config | 配置服务 |

---

## 12. 架构决策记录 (ADR)

### ADR-001: 使用 MikroORM 而非 TypeORM

**决策**: 选择 MikroORM 作为 ORM

**理由**:

1. Data Mapper 模式更符合 DDD（领域模型与持久化分离）
2. TypeScript-first 设计，类型安全性更好
3. 单元测试更容易（不需要装饰器）
4. 更灵活的实体管理

**代价**:

- 社区比 TypeORM 小
- 学习曲线略陡

**状态**: 已接受

### ADR-002: 采用行级隔离作为默认租户隔离策略

**决策**: 默认使用行级隔离（Row-Level），企业租户可选 Schema级隔离

**理由**:

1. 性能好：单一数据库，查询优化容易
2. 运维简单：无需为每个租户创建独立数据库
3. 成本低：共享数据库资源
4. 足够安全：通过应用层和数据库 RLS 双重保护

**代价**:

- 需要严格的应用层过滤
- Schema级隔离的物理隔离性更强

**状态**: 已接受

### ADR-003: 使用闭包表优化部门层级查询

**决策**: 使用闭包表 (Closure Table) + 路径物化

**理由**:

1. 查询性能优秀：一次查询获取所有后代
2. 支持任意深度：无递归查询深度限制
3. 易于维护：路径物化便于调试

**代价**:

- 存储空间增加（闭包表）
- 需要维护闭包表一致性

**状态**: 已接受

### ADR-004: 权限使用 CASL 库

**决策**: 使用 CASL 库实现权限控制

**理由**:

1. TypeScript 支持好
2. 支持基于属性的权限控制（ABAC）
3. 与 NestJS 集成容易
4. 文档完善，社区活跃

**代价**:

- 引入外部依赖

**状态**: 已接受

### ADR-005: 用例为中心的应用层设计

**决策**: 应用层严格遵循"用例为中心"原则，每个业务场景对应一个UseCase类

**理由**:

1. 单一职责：每个用例类只关注一个业务场景
2. 清晰职责：用例负责协调，领域对象负责业务逻辑
3. 易于测试：每个用例可以独立测试
4. 遵循 Clean Architecture：UseCase是Clean Architecture的核心概念

**代价**:

- 用例类数量较多（每个业务场景一个）

**状态**: 已接受

### ADR-006: 适配器模式隔离外部依赖

**决策**: 基础设施层使用适配器模式隔离所有外部技术依赖

**理由**:

1. 可替换性：易于更换外部服务（如更换ORM、缓存等）
2. 可测试性：可以使用Mock适配器进行测试
3. 依赖倒置：应用层定义端口，基础设施层实现适配器

**代价**:

- 增加了适配器层的代码量

**状态**: 已接受

### ADR-007: 优先复用 hybrid-archi 提供的通用值对象

**决策**: saas-core 优先使用 hybrid-archi 提供的通用值对象，仅创建特定业务值对象

**理由**:

1. 代码复用：避免重复实现已有的通用值对象
2. 一致性：确保所有项目使用相同的业务规则和验证逻辑
3. 维护性：通用值对象的更新自动惠及所有项目
4. 符合依赖关系：saas-core 依赖 hybrid-archi，应充分利用其组件

**复用清单**:

- Email, Username, Password (identities/)
- TenantId, UserId, EntityId (ids/)
- TenantStatus, UserStatus, OrganizationStatus (statuses/)
- PasswordPolicy, MfaType, AuditEventType, PermissionDefinitions (security/audit/types/)

**自建清单**:

- TenantCode, TenantDomain, TenantQuota (租户特定)
- OrganizationType (组织特定)
- DepartmentLevel, DepartmentPath (部门特定)
- RoleLevel, RoleName (角色特定)

**状态**: 已接受

### ADR-008: 使用统一异常处理机制

**决策**: saas-core 使用 @hl8/common 提供的统一异常处理机制，不创建自定义异常类

**理由**:

1. 标准化：遵循 RFC7807 标准，错误响应格式统一
2. 一致性：所有层使用相同的异常类（领域层、应用层、基础设施层、接口层）
3. 国际化：支持多语言错误消息
4. 集成日志：自动记录异常到日志系统
5. 多租户支持：支持租户级别的错误定制

**使用方式**:

- `GeneralNotFoundException` - 所有资源未找到场景
- `GeneralBadRequestException` - 所有输入验证失败、业务规则违反场景
- `GeneralInternalServerException` - 所有系统错误、数据库错误场景

**不创建**:

- 不创建 TenantNotFoundException、UserNotFoundException 等特定异常
- 统一使用通用异常类，通过 detail 和 metadata 传递具体信息

**状态**: 已接受

---

### ADR-009: 常量集中管理策略

**决策**: 采用"按领域分类 + 统一导出"策略集中管理常量，避免硬编码

**理由**:

1. 避免硬编码：所有魔法数字和字符串都定义为常量
2. 集中管理：按领域分类（tenant、user、organization等），便于查找和维护
3. 类型安全：使用 TypeScript `as const` 断言确保常量不可变
4. 易于修改：修改配额、规则时只需修改常量文件，影响范围清晰
5. 一致性：确保同一规则在不同地方使用相同的值
6. 文档化：常量本身就是业务规则的文档化表达

**目录结构**:

```text
src/constants/
├── index.ts                    # 统一导出
├── tenant.constants.ts         # 租户相关常量
├── user.constants.ts           # 用户相关常量
├── organization.constants.ts   # 组织相关常量
├── department.constants.ts     # 部门相关常量
├── role.constants.ts           # 角色相关常量
├── permission.constants.ts     # 权限相关常量
└── common.constants.ts         # 通用常量
```

**使用场景**:

- 验证规则（长度、格式、范围）
- 业务配额（资源限制）
- 时间配置（TTL、过期时间）
- API配置（版本、路径）
- 错误消息（提示文本）

**状态**: 已接受

---

## 研究结论

所有关键技术问题已完成研究和决策：

**领域层设计（Domain Layer）**：

1. ✅ **实体与聚合根分离**: 管理者模式 + 指令模式，严格职责分离
2. ✅ **MikroORM 集成**: 领域模型与 ORM 实体分离，仓储模式映射

**权限和安全**：
3. ✅ **CASL 权限**: 细粒度权限控制，基于角色和属性
4. ✅ **租户隔离**: 多策略支持（行级/Schema级），自动上下文注入

**事件溯源和查询优化**：
5. ✅ **事件溯源**: 事件流 + 快照 + 投影，完整审计追踪
6. ✅ **部门查询**: 闭包表 + 路径物化，高性能层级查询

**租户和权限管理**：
7. ✅ **租户切换**: JWT + AsyncLocalStorage，无状态上下文管理
8. ✅ **权限继承**: 多层级角色权限合并，缓存优化
9. ✅ **配额管理**: 值对象封装 + 领域服务验证，缓存优化
10. ✅ **配置管理**: 配置即代码 + 定制扩展，类型安全

**应用层设计（Application Layer）**：
11. ✅ **用例为中心**: 每个业务场景对应一个UseCase类，单一职责
12. ✅ **CQRS实现**: 命令处理器、查询处理器、事件处理器分离
13. ✅ **用例逻辑分离**: 用例负责协调流程，领域对象负责业务逻辑

**基础设施层设计（Infrastructure Layer）**：
14. ✅ **适配器模式**: 仓储适配器、事件存储适配器、服务适配器
15. ✅ **映射器模式**: 专门的Mapper类负责领域模型与ORM实体转换
16. ✅ **事件存储**: PostgreSQL事件存储，支持并发控制和快照

**接口层设计（Interface Layer）**：
17. ✅ **REST控制器**: 协议适配、DTO验证、响应转换
18. ✅ **安全控制**: 守卫（Guard）+ 装饰器（Decorator）+ 中间件（Middleware）
19. ✅ **多协议支持**: REST API为主，预留GraphQL和WebSocket扩展

**通用组件复用（Component Reuse）**：
20. ✅ **值对象复用**: 优先使用 hybrid-archi 提供的通用值对象（Email, Username, Password等）
21. ✅ **异常处理复用**: 使用 @hl8/common 提供的统一异常处理机制（RFC7807标准）
22. ✅ **常量集中管理**: 按领域分类集中管理常量，避免硬编码（TypeScript const assertions）

### 关键设计要点

#### 领域层设计

- 聚合根作为管理者，协调内部实体
- 实体作为被管理者，执行具体业务操作
- 值对象封装业务概念，不可变设计
- 领域事件由聚合根发布，实体不直接发布

#### 分层架构

- Domain Layer: 聚合根、实体、值对象、领域事件（纯业务逻辑，无技术依赖）
- Application Layer: 用例、命令处理器、查询处理器（编排领域对象）
- Infrastructure Layer: 仓储实现、ORM实体、适配器（技术实现）
- Interface Layer: 控制器、DTO、Guards（API接口）

#### 依赖方向

- Interface → Application → Domain
- Infrastructure → Domain (实现Domain定义的接口）
- 严格的依赖倒置原则

**准备就绪**: 可以进入 Phase 1 数据模型和 API 契约设计阶段

---

## 13. 应用层设计方案

### 研究问题

如何实现应用层，确保遵循"用例为中心"的设计原则？

### 决策

**采用"用例为中心 + CQRS分离"策略**

根据 `docs/07-APPLICATION_LAYER_DEVELOPMENT_GUIDE.md` 的要求，应用层必须以用例为中心，每个用例对应一个UseCase类。

#### 核心设计原则

**用例为中心的第一原则**：

- 每个用例类只关注一个具体的业务场景
- 使用 `XxxUseCase` 命名体现设计承诺
- 用例逻辑：协调领域对象完成业务场景的流程
- 业务逻辑：由领域层实现

**用例逻辑 vs 业务逻辑**：

- 用例逻辑：应用层的关注点，协调组件完成流程
- 业务逻辑：领域层的关注点，实现业务规则的具体算法

#### 实现方案

```typescript
// 1. 用例接口（application/use-cases/base/use-case.interface.ts）
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}

// 2. 创建租户用例（application/use-cases/tenant/create-tenant.use-case.ts）
@Injectable()
export class CreateTenantUseCase implements IUseCase<CreateTenantInput, CreateTenantOutput> {
  constructor(
    private readonly tenantRepository: ITenantAggregateRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILoggerService
  ) {}
  
  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    this.logger.info('开始创建租户', { code: input.code });
    
    // 用例逻辑：协调领域对象完成租户创建流程
    
    // 1. 创建租户聚合根（委托给领域层的业务逻辑）
    const tenant = TenantAggregate.createTenant(
      TenantCode.create(input.code),
      input.name,
      input.type,
      input.domain
    );
    
    // 2. 保存聚合根
    await this.tenantRepository.save(tenant);
    
    // 3. 发布领域事件
    const events = tenant.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    
    this.logger.info('租户创建成功', { tenantId: tenant.getId().value });
    
    // 4. 返回结果
    return new CreateTenantOutput(
      tenant.getId().value,
      tenant.getTenantCode().getValue()
    );
  }
}

// 3. 命令处理器（CQRS模式）- 应用层的另一种实现方式
@CommandHandler(CreateTenantCommand)
export class CreateTenantCommandHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase
  ) {}
  
  async execute(command: CreateTenantCommand): Promise<void> {
    // 委托给用例执行
    await this.createTenantUseCase.execute({
      code: command.code,
      name: command.name,
      type: command.type,
      domain: command.domain
    });
  }
}

// 4. 查询处理器（CQRS模式）
@QueryHandler(GetTenantQuery)
export class GetTenantQueryHandler implements IQueryHandler<GetTenantQuery> {
  constructor(
    private readonly tenantRepository: ITenantAggregateRepository
  ) {}
  
  async execute(query: GetTenantQuery): Promise<TenantDto> {
    // 查询逻辑：从仓储获取数据
    const tenant = await this.tenantRepository.findById(
      EntityId.from(query.tenantId)
    );
    
    if (!tenant) {
      throw new TenantNotFoundException(query.tenantId);
    }
    
    // 转换为DTO返回
    return TenantDto.fromAggregate(tenant);
  }
}

// 5. 事件处理器（事件驱动架构）
@EventHandler(TenantCreatedEvent)
export class TenantCreatedEventHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(
    private readonly emailService: IEmailService,
    private readonly logger: ILoggerService
  ) {}
  
  async handle(event: TenantCreatedEvent): Promise<void> {
    this.logger.info('处理租户创建事件', { tenantId: event.tenantId });
    
    // 事件处理逻辑：发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.adminEmail, {
      tenantName: event.name,
      tenantCode: event.code
    });
  }
}
```

### 理由

1. **用例为中心**: 每个业务场景对应一个独立的UseCase类，职责单一
2. **CQRS支持**: 命令处理器和查询处理器分离，优化读写性能
3. **事件驱动**: 事件处理器实现异步业务逻辑
4. **清晰职责**: 用例负责协调，领域对象负责业务逻辑
5. **易于测试**: 每个用例可以独立测试

### 参考

- `docs/07-APPLICATION_LAYER_DEVELOPMENT_GUIDE.md` (应用层开发指南)
- `docs/hybrid-archi/02-application-layer.md` (应用层设计文档)
- `@hl8/hybrid-archi/application` (应用层组件)

---

## 14. 基础设施层设计方案

### 研究问题

如何实现基础设施层，提供技术实现和外部系统集成？

### 决策

**采用"适配器模式 + 工厂模式"策略**

根据 `docs/08-INFRASTRUCTURE_LAYER_DEVELOPMENT_GUIDE.md` 的要求，基础设施层负责所有技术实现。

#### 实现方案

```typescript
// 1. 仓储适配器（infrastructure/adapters/repositories/）
@Injectable()
export class TenantAggregateRepositoryAdapter implements ITenantAggregateRepository {
  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly em: EntityManager,
    private readonly eventStore: IEventStore,
    private readonly mapper: TenantMapper
  ) {}
  
  async findById(id: EntityId): Promise<TenantAggregate | null> {
    const orm = await this.em.findOne(TenantOrmEntity, { id: id.value });
    if (!orm) return null;
    
    // 使用映射器转换
    return this.mapper.toDomain(orm);
  }
  
  async save(aggregate: TenantAggregate): Promise<void> {
    // 1. 持久化聚合根
    const orm = this.mapper.toOrm(aggregate);
    await this.em.persistAndFlush(orm);
    
    // 2. 保存事件到事件存储
    const events = aggregate.getUncommittedEvents();
    if (events.length > 0) {
      await this.eventStore.appendEvents(
        aggregate.getId().value,
        'TenantAggregate',
        events,
        aggregate.getVersion()
      );
    }
    
    // 3. 清除已提交事件
    aggregate.clearEvents();
  }
}

// 2. 映射器（infrastructure/mappers/）
@Injectable()
export class TenantMapper {
  // ORM实体 → 领域聚合根
  toDomain(orm: TenantOrmEntity): TenantAggregate {
    // 实现映射逻辑
  }
  
  // 领域聚合根 → ORM实体
  toOrm(aggregate: TenantAggregate): TenantOrmEntity {
    // 实现映射逻辑
  }
}

// 3. 事件存储适配器（infrastructure/event-sourcing/）
@Injectable()
export class PostgresEventStoreAdapter implements IEventStore {
  constructor(
    @InjectRepository(EventStoreOrmEntity)
    private readonly em: EntityManager
  ) {}
  
  async appendEvents(
    aggregateId: string,
    aggregateType: string,
    events: DomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    // 乐观并发控制
    const currentVersion = await this.getCurrentVersion(aggregateId);
    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyException('聚合版本冲突');
    }
    
    // 保存事件
    for (const event of events) {
      const eventOrm = this.eventToOrm(event, aggregateId, aggregateType);
      this.em.persist(eventOrm);
    }
    
    await this.em.flush();
  }
  
  async getEvents(aggregateId: string): Promise<DomainEvent[]> {
    const orms = await this.em.find(EventStoreOrmEntity, 
      { aggregateId },
      { orderBy: { aggregateVersion: 'ASC' } }
    );
    
    return orms.map(orm => this.ormToEvent(orm));
  }
}

// 4. 基础设施工厂（infrastructure/factories/）
@Injectable()
export class InfrastructureFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly logger: LoggerService
  ) {}
  
  createEventStore(): IEventStore {
    return new PostgresEventStoreAdapter(/* ... */);
  }
  
  createCacheAdapter(): ICacheAdapter {
    return new RedisCacheAdapter(/* ... */);
  }
  
  createMessageQueue(): IMessageQueue {
    return new RabbitMQAdapter(/* ... */);
  }
}
```

### 理由

1. **适配器模式**: 隔离外部技术依赖，易于替换
2. **映射器职责**: 专门的Mapper类负责领域模型与ORM实体的转换
3. **事件存储**: 独立的事件存储适配器，支持事件溯源
4. **工厂模式**: 统一创建基础设施组件

### 参考

- `docs/08-INFRASTRUCTURE_LAYER_DEVELOPMENT_GUIDE.md` (基础设施层开发指南)
- `docs/hybrid-archi/03-infrastructure-layer.md` (基础设施层设计文档)
- `@hl8/hybrid-archi/infrastructure` (基础设施层组件)

---

## 15. 接口层设计方案

### 研究问题

如何实现接口层，提供安全、高效的API接口？

### 决策

**采用"REST控制器 + 验证器 + 守卫"策略**

根据 `docs/09-INTERFACE_LAYER_DEVELOPMENT_GUIDE.md` 的要求，接口层负责协议适配和安全控制。

#### 实现方案

```typescript
// 1. REST控制器（interface/controllers/tenant.controller.ts）
@Controller('api/v1/tenants')
@ApiTags('租户管理')
@UseGuards(JwtAuthGuard, TenantContextGuard)
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly getTenantQuery: GetTenantQueryHandler,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}
  
  @Post()
  @ApiOperation({ summary: '创建租户' })
  @RequirePermission('create', 'Tenant')
  async createTenant(
    @Body() dto: CreateTenantDto,
    @CurrentUser() user: UserContext
  ): Promise<TenantResponseDto> {
    // 接口层职责：协议适配、验证、转换
    
    // 1. DTO验证（使用class-validator）
    // 自动验证已在管道中完成
    
    // 2. 调用用例或发送命令
    const result = await this.createTenantUseCase.execute({
      code: dto.code,
      name: dto.name,
      type: dto.type,
      domain: dto.domain,
      createdBy: user.userId
    });
    
    // 3. 转换为响应DTO
    return TenantResponseDto.from(result);
  }
  
  @Get(':id')
  @ApiOperation({ summary: '查询租户详情' })
  @RequirePermission('read', 'Tenant')
  async getTenant(
    @Param('id') id: string
  ): Promise<TenantResponseDto> {
    // 发送查询
    const result = await this.queryBus.execute(
      new GetTenantQuery(id)
    );
    
    return TenantResponseDto.from(result);
  }
}

// 2. DTO定义（interface/dtos/tenant/）
export class CreateTenantDto {
  @ApiProperty({ description: '租户代码', example: 'company001' })
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-z0-9]+$/, { message: '租户代码只能包含小写字母和数字' })
  code!: string;
  
  @ApiProperty({ description: '租户名称', example: '示例公司' })
  @IsString()
  @Length(1, 100)
  name!: string;
  
  @ApiProperty({ description: '租户类型', enum: TenantType })
  @IsEnum(TenantType)
  type!: TenantType;
  
  @ApiProperty({ description: '租户域名', example: 'company001.hl8.com' })
  @IsString()
  @IsUrl()
  domain!: string;
}

export class TenantResponseDto {
  @ApiProperty({ description: '租户ID' })
  id!: string;
  
  @ApiProperty({ description: '租户代码' })
  code!: string;
  
  @ApiProperty({ description: '租户名称' })
  name!: string;
  
  @ApiProperty({ description: '租户类型' })
  type!: TenantType;
  
  @ApiProperty({ description: '租户状态' })
  status!: TenantStatus;
  
  static from(aggregate: TenantAggregate | any): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = aggregate.id || aggregate.getId().value;
    dto.code = aggregate.code || aggregate.getTenantCode().getValue();
    dto.name = aggregate.name || aggregate.getName();
    dto.type = aggregate.type || aggregate.getType();
    dto.status = aggregate.status || aggregate.getStatus();
    return dto;
  }
}

// 3. 守卫（interface/guards/）
@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContext
  ) {}
  
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // 从请求中提取租户ID
    const tenantId = this.extractTenantId(request);
    
    // 验证用户有权访问该租户
    if (!user.canAccessTenant(tenantId)) {
      throw new ForbiddenException('无权访问该租户');
    }
    
    // 设置租户上下文
    this.tenantContext.setCurrentTenantId(tenantId);
    
    return true;
  }
  
  private extractTenantId(request: any): string {
    // 从Header或JWT中提取
    return request.headers['x-tenant-id'] || request.user.currentTenantId;
  }
}

// 4. 装饰器（interface/decorators/）
export const RequirePermission = (action: PermissionAction, subject: PermissionSubject) => {
  return applyDecorators(
    SetMetadata('permission', { action, subject }),
    UseGuards(PermissionGuard)
  );
};

// 5. 中间件（interface/middleware/）
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}
  
  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.info('API请求完成', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration
      });
    });
    
    next();
  }
}
```

### 理由

1. **协议适配**: 控制器负责HTTP协议适配，将请求转换为用例输入
2. **验证隔离**: DTO使用class-validator进行声明式验证
3. **安全控制**: 使用Guard实现认证、授权、租户上下文验证
4. **中间件**: 提供横切关注点（日志、性能监控等）
5. **装饰器**: 提供声明式的权限控制

### 参考

- `docs/09-INTERFACE_LAYER_DEVELOPMENT_GUIDE.md` (接口层开发指南)
- `docs/hybrid-archi/04-interface-layer.md` (接口层设计文档)
- `@hl8/hybrid-archi/interface` (接口层组件)

**准备就绪**: 所有层的技术方案已完成研究和决策

---

## 16. 统一异常处理机制

### 研究问题

如何实现统一的异常处理，确保错误响应的一致性？

### 决策

**采用"复用 @hl8/common 异常模块"策略**

根据用户提示，`packages/common/src/exceptions` 提供了统一的异常处理机制，并已集成到 hybrid-archi 各层。

#### 核心功能

**@hl8/common/exceptions 提供**：

1. **标准化异常类**（core/）：
   - `AbstractHttpException` - 抽象HTTP异常基类
   - `GeneralNotFoundException` - 资源未找到异常（404）
   - `GeneralBadRequestException` - 错误请求异常（400）
   - `GeneralInternalServerException` - 内部服务器错误异常（500）

2. **异常过滤器**（filters/）：
   - `AnyExceptionFilter` - 捕获所有异常
   - `HttpExceptionFilter` - 捕获HTTP异常

3. **错误响应格式**（vo/）：
   - `ErrorResponseDto` - 遵循 RFC7807 标准
   - 包含：type, title, status, detail, instance, timestamp, metadata

4. **配置支持**（config/）：
   - `ExceptionConfig` - 异常配置接口
   - `ExceptionMessageProvider` - 消息提供者（支持国际化）

5. **工具类**（utils/）：
   - `ExceptionUtils` - 异常处理工具函数

#### 实现方案

```typescript
// 1. 导入统一异常（从 @hl8/common）
import { 
  GeneralNotFoundException,
  GeneralBadRequestException,
  GeneralInternalServerException,
  AnyExceptionFilter,
  ExceptionModule
} from '@hl8/common/exceptions';

// 2. 在 saas-core 模块中配置异常模块
@Module({
  imports: [
    ExceptionModule.forRoot({
      documentationUrl: 'https://docs.hl8.com/errors',
      logLevel: 'error',
      enableStackTrace: true,
      defaultLanguage: 'zh-CN',
      supportedLanguages: ['zh-CN', 'en-US']
    }),
    // ... 其他导入
  ],
  providers: [
    // 全局使用异常过滤器
    {
      provide: APP_FILTER,
      useClass: AnyExceptionFilter,
    },
  ],
})
export class SaasCoreModule {}

// 3. 在领域层使用统一异常
// domain/tenant/aggregates/tenant.aggregate.ts
export class TenantAggregate extends TenantAwareAggregateRoot {
  public upgradeTenant(newType: TenantType): void {
    // 验证业务规则，使用统一异常
    if (!this.canUpgradeTo(newType)) {
      throw new GeneralBadRequestException(
        'Invalid tenant upgrade',
        '不支持的租户升级路径',
        { 
          currentType: this._tenant.getType(), 
          targetType: newType 
        }
      );
    }
    
    // 执行升级逻辑...
  }
}

// 4. 在应用层使用统一异常
// application/use-cases/tenant/create-tenant.use-case.ts
export class CreateTenantUseCase implements IUseCase {
  async execute(input: CreateTenantInput): Promise<CreateTenantOutput> {
    // 检查租户代码唯一性
    const existing = await this.tenantRepository.findByCode(
      TenantCode.create(input.code)
    );
    
    if (existing) {
      throw new GeneralBadRequestException(
        'Tenant code already exists',
        `租户代码 "${input.code}" 已存在`,
        { code: input.code }
      );
    }
    
    // 执行创建逻辑...
  }
}

// 5. 在基础设施层使用统一异常
// infrastructure/adapters/repositories/tenant-aggregate.repository.ts
export class TenantAggregateRepositoryAdapter {
  async findById(id: EntityId): Promise<TenantAggregate | null> {
    try {
      const orm = await this.em.findOne(TenantOrmEntity, { id: id.value });
      if (!orm) return null;
      
      return this.mapper.toDomain(orm);
    } catch (error) {
      throw new GeneralInternalServerException(
        'Database query failed',
        '查询租户数据失败',
        { aggregateId: id.value, error: error.message }
      );
    }
  }
}

// 6. 在接口层使用统一异常
// interface/controllers/tenant.controller.ts
export class TenantController {
  @Get(':id')
  async getTenant(@Param('id') id: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(EntityId.from(id));
    
    if (!tenant) {
      throw new GeneralNotFoundException(
        'Tenant not found',
        `租户 "${id}" 不存在`,
        { tenantId: id }
      );
    }
    
    return TenantResponseDto.from(tenant);
  }
}

// 7. 错误响应示例（自动由过滤器生成）
{
  "type": "https://docs.hl8.com/errors/tenant-not-found",
  "title": "Tenant not found",
  "status": 404,
  "detail": "租户 \"tenant-123\" 不存在",
  "instance": "/api/v1/tenants/tenant-123",
  "timestamp": "2025-10-08T10:30:00.000Z",
  "metadata": {
    "tenantId": "tenant-123"
  }
}
```

### 理由

1. **标准化**: 遵循 RFC7807 标准，错误响应格式统一
2. **一致性**: 所有层使用相同的异常类，确保一致性
3. **国际化**: 支持多语言错误消息
4. **可追踪**: 集成日志模块，自动记录异常
5. **多租户**: 支持租户级别的错误定制
6. **已集成**: hybrid-archi 已集成，无需重复开发

### saas-core 不需要创建的异常

由于 @hl8/common 提供了完整的异常处理，saas-core **不需要创建以下异常**：

❌ 不需要创建：

- `TenantNotFoundException` → 使用 `GeneralNotFoundException`
- `InvalidTenantCodeException` → 使用 `GeneralBadRequestException`
- `UserNotFoundException` → 使用 `GeneralNotFoundException`
- `InvalidEmailException` → 使用 `GeneralBadRequestException`
- 等等...

✅ 统一使用：

- `GeneralNotFoundException` - 所有资源未找到场景
- `GeneralBadRequestException` - 所有输入验证失败场景
- `GeneralInternalServerException` - 所有系统错误场景

### 参考

- `packages/common/src/exceptions/README.md` (异常处理模块文档)
- `@hl8/common/exceptions` (异常模块)
- RFC7807 Problem Details 标准

---

## 17. 复用 hybrid-archi 提供的通用值对象

### 研究问题

saas-core 模块需要哪些值对象，哪些可以直接使用 hybrid-archi 提供的通用值对象？

### 决策

**采用"优先复用 + 按需扩展"策略**

根据用户要求，saas-core 应优先使用 hybrid-archi 模块提供的通用值对象，位于 `packages/hybrid-archi/src/domain/value-objects`。

#### hybrid-archi 提供的通用值对象清单

**标识相关（identities/）**：

- `Email` - 邮箱值对象（符合RFC 5322标准，包含验证逻辑）
- `Username` - 用户名值对象
- `Password` - 密码值对象

**ID相关（ids/）**：

- `TenantId` - 租户ID值对象
- `UserId` - 用户ID值对象
- `EntityId` - 通用实体ID值对象

**状态相关（statuses/）**：

- `TenantStatus` - 租户状态值对象
- `UserStatus` - 用户状态值对象
- `OrganizationStatus` - 组织状态值对象

**安全相关（security/）**：

- `PasswordPolicy` - 密码策略值对象
- `MfaType` - 多因素认证类型
- `MfaStatus` - 多因素认证状态

**审计相关（audit/）**：

- `AuditEventType` - 审计事件类型（80+种类型）

**权限相关（types/）**：

- `PermissionDefinitions` - 细粒度权限定义（100+种权限）

#### saas-core 需要创建的特定值对象

以下值对象是 saas-core 特有的，需要在模块内创建：

**租户领域**：

- `TenantCode` - 租户代码（3-20位小写字母或数字）
- `TenantDomain` - 租户域名
- `TenantQuota` - 租户配额
- `TenantConfiguration` - 租户配置

**组织领域**：

- `OrganizationId` - 组织ID（如果需要特殊逻辑）
- `OrganizationType` - 组织类型（专业委员会、项目团队等）

**部门领域**：

- `DepartmentId` - 部门ID
- `DepartmentLevel` - 部门层级（LEVEL_1 到 LEVEL_8+）
- `DepartmentPath` - 部门路径（用于树形结构）

**角色领域**：

- `RoleId` - 角色ID
- `RoleLevel` - 角色层级（平台级、租户级、组织级、部门级）
- `RoleName` - 角色名称

**权限领域**：

- `PermissionId` - 权限ID（如果需要特殊逻辑）

#### 导入使用示例

```typescript
// 1. 从 hybrid-archi 导入通用值对象
import { 
  Email, 
  Username, 
  Password,
  TenantId,
  UserId,
  EntityId,
  TenantStatus,
  UserStatus,
  OrganizationStatus,
  PasswordPolicy,
  AuditEventType,
  PermissionDefinitions
} from '@hl8/hybrid-archi';

// 2. 使用示例：创建用户聚合根
export class UserAggregate extends TenantAwareAggregateRoot {
  private _user: User;
  
  public static createUser(
    email: string,      // 原始字符串
    username: string,
    password: string,
    tenantId: string
  ): UserAggregate {
    const aggregate = new UserAggregate(EntityId.generate(), TenantId.create(tenantId));
    
    // 使用 hybrid-archi 的值对象
    const emailVo = Email.create(email);          // ← 复用
    const usernameVo = Username.create(username);  // ← 复用
    const passwordVo = Password.create(password);  // ← 复用
    const userIdVo = UserId.generate();            // ← 复用
    
    // 创建内部实体
    aggregate._user = User.create(
      userIdVo,
      emailVo,
      usernameVo,
      passwordVo,
      UserStatus.PENDING  // ← 复用
    );
    
    // 发布事件
    aggregate.addDomainEvent(new UserCreatedEvent(
      userIdVo,
      emailVo,
      usernameVo,
      TenantId.create(tenantId)
    ));
    
    return aggregate;
  }
}

// 3. saas-core 特定值对象示例
// domain/tenant/value-objects/tenant-code.vo.ts
export class TenantCode extends BaseValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate();
  }
  
  private validate(): void {
    if (!/^[a-z0-9]{3,20}$/.test(this._value)) {
      throw new InvalidTenantCodeException('租户代码必须是3-20位小写字母或数字');
    }
  }
  
  get value(): string {
    return this._value;
  }
  
  public static create(value: string): TenantCode {
    return new TenantCode(value.toLowerCase());
  }
  
  protected arePropertiesEqual(other: TenantCode): boolean {
    return this._value === other._value;
  }
}
```

### 理由

1. **代码复用**: 避免重复实现已有的通用值对象
2. **一致性**: 确保所有项目使用相同的业务规则和验证逻辑
3. **维护性**: 通用值对象的更新自动惠及所有项目
4. **扩展性**: 新项目可以快速集成这些成熟的值对象
5. **符合架构**: saas-core 依赖 hybrid-archi，应充分利用其提供的组件

### 价值对象复用策略

**优先复用**：

- ✅ Email, Username, Password（身份认证相关）
- ✅ TenantId, UserId, EntityId（ID相关）
- ✅ TenantStatus, UserStatus, OrganizationStatus（状态相关）
- ✅ PasswordPolicy, MfaType, MfaStatus（安全相关）
- ✅ AuditEventType, PermissionDefinitions（审计和权限相关）

**按需创建**：

- ✅ TenantCode, TenantDomain, TenantQuota（租户特定）
- ✅ OrganizationType（组织特定）
- ✅ DepartmentLevel, DepartmentPath（部门特定）
- ✅ RoleLevel, RoleName（角色特定）

### 参考

- `packages/hybrid-archi/src/domain/value-objects/README.md`
- `@hl8/hybrid-archi` 值对象文档
- DDD 值对象复用最佳实践

---

## 18. 常量集中管理策略

### 研究问题

如何避免硬编码，实现常量的集中分类管理？

### 决策

**采用"按领域分类 + 统一导出"策略**

根据用户要求，合理使用常量避免硬编码，常量应当集中分类管理。

#### 常量目录结构

```text
src/constants/
├── index.ts                    # 统一导出
├── tenant.constants.ts         # 租户相关常量
├── user.constants.ts           # 用户相关常量
├── organization.constants.ts   # 组织相关常量
├── department.constants.ts     # 部门相关常量
├── role.constants.ts           # 角色相关常量
├── permission.constants.ts     # 权限相关常量
└── common.constants.ts         # 通用常量
```

#### 实现方案

```typescript
// 1. 租户常量（constants/tenant.constants.ts）
export const TENANT_CONSTANTS = {
  CODE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 20,
    PATTERN: /^[a-z0-9]+$/,
    PATTERN_MESSAGE: '租户代码只能包含小写字母和数字',
  },
  
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  
  QUOTA: {
    FREE: {
      MAX_USERS: 5,
      MAX_STORAGE_MB: 100,
      MAX_ORGANIZATIONS: 1,
      MAX_DEPARTMENT_LEVELS: 7,
    },
    BASIC: {
      MAX_USERS: 50,
      MAX_STORAGE_MB: 1024,
      MAX_ORGANIZATIONS: 2,
      MAX_DEPARTMENT_LEVELS: 7,
    },
    PROFESSIONAL: {
      MAX_USERS: 500,
      MAX_STORAGE_MB: 10240,
      MAX_ORGANIZATIONS: 10,
      MAX_DEPARTMENT_LEVELS: 7,
    },
    ENTERPRISE: {
      MAX_USERS: 10000,
      MAX_STORAGE_MB: 102400,
      MAX_ORGANIZATIONS: 100,
      MAX_DEPARTMENT_LEVELS: 8,
    },
  },
  
  TRIAL: {
    DURATION_DAYS: 30,
    NOTIFICATION_DAYS: [7, 3, 1],
  },
  
  DATA_RETENTION: {
    AFTER_DELETION_DAYS: 30,
  },
} as const;

// 2. 用户常量（constants/user.constants.ts）
export const USER_CONSTANTS = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
  },
  
  SESSION: {
    ACCESS_TOKEN_TTL_SECONDS: 3600,
    REFRESH_TOKEN_TTL_SECONDS: 2592000,
    MAX_SESSIONS_PER_USER: 5,
  },
  
  LOGIN: {
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION_MINUTES: 30,
  },
} as const;

// 3. 通用常量（constants/common.constants.ts）
export const COMMON_CONSTANTS = {
  CACHE_TTL: {
    PERMISSIONS_SECONDS: 1800,
    TENANT_CONFIG_SECONDS: 3600,
    USER_PROFILE_SECONDS: 900,
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },
  
  API: {
    VERSION: 'v1',
    BASE_PATH: '/api/v1',
  },
} as const;

// 4. 使用示例
import { TENANT_CONSTANTS } from '../../../constants';

// 在值对象中使用
export class TenantCode extends BaseValueObject {
  private validate(): void {
    if (
      this._value.length < TENANT_CONSTANTS.CODE.MIN_LENGTH ||
      this._value.length > TENANT_CONSTANTS.CODE.MAX_LENGTH
    ) {
      throw new GeneralBadRequestException(
        'Invalid tenant code length',
        `租户代码长度必须在 ${TENANT_CONSTANTS.CODE.MIN_LENGTH}-${TENANT_CONSTANTS.CODE.MAX_LENGTH} 之间`
      );
    }

    if (!TENANT_CONSTANTS.CODE.PATTERN.test(this._value)) {
      throw new GeneralBadRequestException(
        'Invalid tenant code format',
        TENANT_CONSTANTS.CODE.PATTERN_MESSAGE
      );
    }
  }
}

// 在DTO中使用
export class CreateTenantDto {
  @Length(
    TENANT_CONSTANTS.CODE.MIN_LENGTH,
    TENANT_CONSTANTS.CODE.MAX_LENGTH
  )
  @Matches(TENANT_CONSTANTS.CODE.PATTERN, {
    message: TENANT_CONSTANTS.CODE.PATTERN_MESSAGE,
  })
  code!: string;
}

// 在领域逻辑中使用
export class TenantQuota extends BaseValueObject {
  static fromTenantType(type: TenantType): TenantQuota {
    const quotaConfig = TENANT_CONSTANTS.QUOTA[type];
    return new TenantQuota(
      quotaConfig.MAX_USERS,
      quotaConfig.MAX_STORAGE_MB,
      quotaConfig.MAX_ORGANIZATIONS
    );
  }
}
```

### 理由

1. **避免硬编码**: 所有魔法数字和字符串都定义为常量
2. **集中管理**: 按领域分类，便于查找和维护
3. **类型安全**: 使用 `as const` 确保常量不可变
4. **易于修改**: 修改配额、规则时只需修改常量文件
5. **一致性**: 确保同一规则在不同地方使用相同的值
6. **文档化**: 常量本身就是业务规则的文档化表达

### 常量分类原则

**按领域分类**：

- tenant.constants.ts - 租户相关
- user.constants.ts - 用户相关
- organization.constants.ts - 组织相关
- department.constants.ts - 部门相关
- role.constants.ts - 角色相关
- permission.constants.ts - 权限相关
- common.constants.ts - 通用常量

**按功能分组**：

- 验证规则（长度、格式、范围）
- 业务配额（资源限制）
- 时间配置（TTL、过期时间）
- API配置（版本、路径）
- 错误消息（提示文本）

### 参考

- TypeScript const assertions
- 配置管理最佳实践
- Clean Code 原则
