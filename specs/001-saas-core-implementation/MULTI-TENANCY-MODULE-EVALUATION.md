# packages/multi-tenancy 模块评估报告

**评估日期**: 2025-10-08  
**评估目标**: 全面理解 multi-tenancy 模块的功能、与 hybrid-archi 的关系，以及对 saas-core 开发的影响  
**评估人**: AI Assistant

---

## 📊 执行摘要

### 核心发现

1. **✅ 纯基础设施层模块**：`multi-tenancy` 是纯技术性的基础设施层，提供多租户技术能力，不包含业务逻辑
2. **✅ 上下文管理与隔离**：核心功能是租户上下文管理（基于 nestjs-cls）和数据隔离策略
3. **✅ EntityId 类型一致性**：tenantId 已使用 `EntityId` 类型（与我们的重构一致）
4. **⚠️ 服务接口返回 string**：虽然类型定义使用 `EntityId`，但服务方法（如 `getTenant()`）返回 `string | null`
5. **🔄 与 hybrid-archi 互补**：multi-tenancy 提供基础设施层支持，hybrid-archi 提供领域层支持，两者互补

### 关键结论

**TenantAwareAggregateRoot 确实具有全局通用性，且非常必要！**

**理由**：

- ✅ multi-tenancy 只提供上下文服务，不提供聚合根级别的租户功能
- ✅ hybrid-archi 的 BaseAggregateRoot 只提供基础 tenantId 字段，没有租户业务逻辑
- ✅ 需要 TenantAwareAggregateRoot 作为桥梁，整合两者的功能
- ✅ 为业务聚合根提供统一的租户验证、租户上下文访问、租户事件发布等能力

---

## 🏗️ 模块架构分析

### 模块定位

```
┌─────────────────────────────────────────────────────┐
│  packages/multi-tenancy（基础设施层 - 技术支持）      │
│  ┌───────────────────────────────────────────────┐  │
│  │  TenantContextService                         │  │
│  │  - 基于 nestjs-cls 的上下文管理                │  │
│  │  - setContext(), getContext(), getTenant()    │  │
│  │  - updateTenant(), updateUser()               │  │
│  │  - 自定义上下文管理                             │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  TenantIsolationService                       │  │
│  │  - 数据隔离策略管理                             │  │
│  │  - getTenantKey(), isolateData()              │  │
│  │  - extractTenantData(), shouldIsolate()       │  │
│  │  - 批量操作支持                                │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────┐
│  packages/hybrid-archi（领域层 - 架构基础）           │
│  ┌───────────────────────────────────────────────┐  │
│  │  BaseEntity                                   │  │
│  │  - tenantId: EntityId（审计信息）              │  │
│  │  - 基础实体功能                                │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  BaseAggregateRoot                            │  │
│  │  - 继承 BaseEntity                            │  │
│  │  - 领域事件管理                                │  │
│  └───────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────┐  │
│  │  TenantAwareAggregateRoot ✨ (建议新增)        │  │
│  │  - 继承 BaseAggregateRoot                     │  │
│  │  - 整合 multi-tenancy 上下文服务               │  │
│  │  - 提供租户验证、租户事件、租户日志             │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────┐
│  packages/saas-core（业务层 - 业务实现）              │
│  ┌───────────────────────────────────────────────┐  │
│  │  TenantAggregate, UserAggregate, ...          │  │
│  │  - 继承 TenantAwareAggregateRoot              │  │
│  │  - 实现具体业务逻辑                             │  │
│  │  - 使用租户验证和租户事件                       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 模块职责划分

| 模块 | 层次 | 职责 | 关键组件 |
|------|------|------|---------|
| **multi-tenancy** | 基础设施层 | 提供租户上下文管理和数据隔离的技术能力 | TenantContextService, TenantIsolationService |
| **hybrid-archi** | 领域层 + 应用层 + 基础设施层 | 提供领域模型的架构基础和通用组件 | BaseEntity, BaseAggregateRoot, BaseDomainEvent |
| **saas-core** | 业务层（四层架构） | 实现多租户SAAS的核心业务逻辑 | TenantAggregate, UserAggregate, RoleAggregate |

---

## 🔍 核心服务详解

### 1. TenantContextService（租户上下文服务）

**功能描述**：基于 nestjs-cls 实现租户上下文的透明传递和管理

**核心方法**：

| 方法 | 功能 | 返回类型 | 说明 |
|------|------|---------|------|
| `setContext(context: ITenantContext)` | 设置租户上下文 | `Promise<void>` | 设置包含 tenantId, userId, requestId 等的完整上下文 |
| `getContext()` | 获取完整上下文 | `ITenantContext \| null` | 返回完整的上下文对象 |
| `getTenant()` | 获取租户ID | `string \| null` | ⚠️ 返回 string 类型的租户ID |
| `getUser()` | 获取用户ID | `string \| null` | 返回当前用户ID |
| `getRequestId()` | 获取请求ID | `string \| null` | 返回当前请求ID |
| `getSessionId()` | 获取会话ID | `string \| null` | 返回当前会话ID |
| `updateTenant(tenantId: string)` | 更新租户ID | `Promise<void>` | 动态切换租户 |
| `updateUser(userId: string)` | 更新用户ID | `Promise<void>` | 更新当前用户 |
| `setCustomContext(key, value)` | 设置自定义上下文 | `Promise<void>` | 扩展上下文信息 |
| `getCustomContext<T>(key)` | 获取自定义上下文 | `T \| null` | 获取扩展信息 |
| `clearContext()` | 清除上下文 | `Promise<void>` | 清理当前请求的上下文 |

**关键特性**：

1. **透明传递**：基于 nestjs-cls，上下文在整个请求生命周期内透明传递，无需手动传参
2. **自动清理**：请求结束时自动清理上下文，防止内存泄漏
3. **审计日志**：可选的审计日志记录所有上下文操作
4. **上下文验证**：严格的上下文验证，包括 tenantId 格式验证（UUID v4）

**租户ID验证规则**（源码 753-773 行）：

```typescript
private validateTenantId(tenantId: string): void {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new TenantContextInvalidException(...);
  }

  // 只支持UUID v4格式
  if (!this.isValidUuidV4(tenantId)) {
    throw new TenantContextInvalidException(
      'Invalid tenant ID format',
      'The tenant ID must be a valid UUID v4 format',
      { 
        tenantId, 
        expectedPattern: '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      }
    );
  }
}
```

**使用示例**：

```typescript
// 在中间件或守卫中设置租户上下文
const context: ITenantContext = {
  tenantId: EntityId.fromString('tenant-123'),
  userId: 'user-456',
  requestId: 'req-789',
  timestamp: new Date()
};
await tenantContextService.setContext(context);

// 在服务中透明获取租户ID
const tenantId = tenantContextService.getTenant(); // 返回 'tenant-123' (string)
```

---

### 2. TenantIsolationService（租户隔离服务）

**功能描述**：实现租户数据隔离的核心功能

**核心方法**：

| 方法 | 功能 | 返回类型 | 说明 |
|------|------|---------|------|
| `getTenantKey(key, tenantId?)` | 生成租户键 | `Promise<string>` | 生成包含租户信息的键，用于缓存/数据库 |
| `getTenantNamespace(tenantId?)` | 生成租户命名空间 | `Promise<string>` | 生成租户命名空间标识 |
| `isolateData<T>(data, tenantId?)` | 隔离数据 | `Promise<T>` | 为数据添加租户标识 |
| `extractTenantData<T>(data, tenantId?)` | 提取数据 | `Promise<T>` | 从隔离数据中提取业务数据 |
| `shouldIsolate(tenantId?)` | 检查是否需要隔离 | `Promise<boolean>` | 判断特定租户是否需要隔离 |
| `getTenantKeys(keys[], tenantId?)` | 批量生成租户键 | `Promise<string[]>` | 批量操作，提高性能 |
| `isolateDataList<T>(dataList[], tenantId?)` | 批量隔离数据 | `Promise<T[]>` | 批量隔离，提高性能 |

**隔离策略**（配置驱动）：

| 策略类型 | 说明 | 示例 |
|---------|------|------|
| `key-prefix` | 键前缀隔离 | `tenant:tenant-123:user:456` |
| `namespace` | 命名空间隔离 | `tenant_123` |
| `database` | 数据库隔离 | 每个租户独立数据库 |
| `schema` | 模式隔离 | 每个租户独立 schema |

**隔离级别**：

- `strict`：严格隔离，所有操作都检查租户权限
- `relaxed`：宽松隔离，允许某些跨租户操作
- `disabled`：禁用隔离（开发/测试环境）

**默认实现**（源码 552-597 行）：

```typescript
// 键前缀隔离策略的默认实现
this.isolationStrategy = {
  getTenantKey: async (key: string, tenantId: string) => {
    const prefix = this.isolationConfig.keyPrefix || 'tenant:';
    return `${prefix}${tenantId}:${key}`;
  },
  getTenantNamespace: async (tenantId: string) => {
    return `tenant_${tenantId}`;
  },
  isolateData: async <T = unknown>(data: T, tenantId: string): Promise<T> => {
    if (data && typeof data === 'object') {
      return {
        ...(data as object),
        _tenantId: tenantId,
        _isolatedAt: new Date(),
      } as T;
    }
    return {
      data,
      _tenantId: tenantId,
      _isolatedAt: new Date(),
    } as T;
  },
  extractTenantData: async <T = unknown>(data: T, tenantId: string): Promise<T> => {
    if (!data || typeof data !== 'object') {
      return data;
    }
    const dataObj = data as Record<string, unknown>;
    const { _tenantId, _isolatedAt, ...cleanData } = dataObj;
    if (_tenantId !== tenantId) {
      throw new Error(`Tenant ID mismatch: expected ${tenantId}, got ${_tenantId}`);
    }
    return cleanData as T;
  },
  shouldIsolate: async (tenantId: string) => {
    return tenantId !== 'default' && tenantId !== 'system';
  },
};
```

**使用示例**：

```typescript
// 生成租户键（用于 Redis 缓存）
const tenantKey = await tenantIsolationService.getTenantKey('user:123');
// 结果: 'tenant:tenant-456:user:123'

// 隔离数据（添加租户标识）
const isolatedData = await tenantIsolationService.isolateData({
  name: 'John',
  age: 30
});
// 结果: { name: 'John', age: 30, _tenantId: 'tenant-456', _isolatedAt: Date }

// 提取数据（移除租户标识）
const cleanData = await tenantIsolationService.extractTenantData(isolatedData);
// 结果: { name: 'John', age: 30 }
```

---

## 📦 类型定义分析

### ITenantContext（租户上下文接口）

```typescript
export interface ITenantContext {
  /** 租户唯一标识符（使用EntityId确保类型安全） */
  tenantId: EntityId;  // ✅ 已使用 EntityId 类型
  /** 用户唯一标识符（可选） */
  userId?: string;
  /** 请求唯一标识符（可选） */
  requestId?: string;
  /** 会话唯一标识符（可选） */
  sessionId?: string;
  /** 额外的元数据（可选） */
  metadata?: Record<string, unknown>;
  /** 上下文创建时间 */
  timestamp: Date;
}
```

**关键点**：

- ✅ `tenantId` 已使用 `EntityId` 类型（与我们的重构一致）
- ✅ 与 `hybrid-archi` 的 `IAuditInfo` 中的 `tenantId` 类型一致
- ⚠️ 但 `TenantContextService.getTenant()` 返回 `string | null`，需要类型转换

---

## ⚠️ 关键问题与建议

### 问题1：服务方法返回类型不一致

**问题描述**：

- `ITenantContext.tenantId` 类型为 `EntityId`
- `TenantContextService.getTenant()` 返回类型为 `string | null`
- 这导致使用时需要手动类型转换

**代码示例**（源码 369-377 行）：

```typescript
getTenant(): string | null {
  try {
    const tenantId = this.cls.get<string>('tenantId');
    return tenantId || null;
  } catch (error) {
    this.logger.error('获取租户ID失败', { error: (error as Error).message });
    return null;
  }
}
```

**影响**：

- 使用时需要手动转换：`EntityId.fromString(tenantContextService.getTenant())`
- 类型不一致可能导致混淆

**建议**：

**方案1：保持当前实现（推荐）** ⭐

- 理由：CLS 存储的是原始的 string 值，提取时返回 string 更自然
- 在业务层使用时手动转换：`EntityId.fromString(tenantId)`
- 修改：在 `TenantAwareAggregateRoot` 中封装转换逻辑

**方案2：修改服务方法返回 EntityId**

- 在 `getTenant()` 中进行转换：`return EntityId.fromString(tenantId)`
- 需要修改 multi-tenancy 模块代码
- 风险较大，可能影响现有使用

**推荐方案1**，并在 `TenantAwareAggregateRoot` 中提供便捷方法：

```typescript
// 在 TenantAwareAggregateRoot 中
protected getCurrentTenantId(): EntityId {
  const tenantIdStr = this.tenantContextService.getTenant();
  if (!tenantIdStr) {
    throw new GeneralBadRequestException('Tenant context required');
  }
  return EntityId.fromString(tenantIdStr);
}
```

---

### 问题2：multi-tenancy 模块独立于 hybrid-archi

**现状分析**：

- multi-tenancy 是独立的基础设施模块
- 不依赖 hybrid-archi（除了 EntityId 类型定义）
- 提供的是纯技术能力，不包含领域模型

**这是合理的设计**：

- ✅ 职责分离：multi-tenancy 负责上下文管理，hybrid-archi 负责领域模型
- ✅ 可复用：multi-tenancy 可以在非 DDD 项目中使用
- ✅ 解耦：两个模块可以独立演进

**但需要在 saas-core 中整合两者**：

- ✅ 通过 `TenantAwareAggregateRoot` 整合
- ✅ 聚合根使用 `TenantContextService` 获取上下文
- ✅ 应用层使用 `TenantIsolationService` 进行数据隔离

---

## 🎯 TenantAwareAggregateRoot 的必要性再确认

### 为什么需要 TenantAwareAggregateRoot？

#### 1. multi-tenancy 不提供聚合根级别的功能

multi-tenancy 只提供：

- ✅ 租户上下文管理（TenantContextService）
- ✅ 数据隔离策略（TenantIsolationService）

multi-tenancy **不提供**：

- ❌ 聚合根的租户验证方法
- ❌ 聚合根的租户事件发布
- ❌ 聚合根的租户业务规则
- ❌ 聚合根的租户日志记录

#### 2. BaseAggregateRoot 不提供租户业务逻辑

BaseAggregateRoot 只提供：

- ✅ 基础的 `tenantId: EntityId` 字段（来自 BaseEntity）
- ✅ 领域事件管理
- ✅ 版本控制

BaseAggregateRoot **不提供**：

- ❌ 租户上下文验证
- ❌ 跨租户操作检查
- ❌ 租户事件简化创建
- ❌ 租户日志记录

#### 3. TenantAwareAggregateRoot 填补空白

TenantAwareAggregateRoot 应该提供：

- ✅ **整合 multi-tenancy 服务**：注入 TenantContextService
- ✅ **租户验证**：`ensureTenantContext()`, `ensureSameTenant()`
- ✅ **租户事件**：`publishTenantEvent()`
- ✅ **租户日志**：`logTenantOperation()`
- ✅ **租户检查**：`belongsToTenant()`, `getTenantId()`

### 层次关系

```
multi-tenancy（基础设施层 - 服务）
    ↓ 依赖注入
TenantAwareAggregateRoot（领域层 - 基类）✨
    ↓ 继承
业务聚合根（领域层 - 业务实现）
```

---

## 💡 实施建议

### 1. 立即创建 TenantAwareAggregateRoot

**位置**：`packages/hybrid-archi/src/domain/aggregates/base/tenant-aware-aggregate-root.ts`

**核心实现**：

```typescript
import { EntityId } from '../../value-objects/entity-id';
import { IPartialAuditInfo } from '../../entities/base/audit-info';
import { PinoLogger } from '@hl8/logger';
import { BaseAggregateRoot } from './base-aggregate-root';
import { BaseDomainEvent } from '../../events/base/base-domain-event';
import { GeneralBadRequestException, GeneralForbiddenException } from '@hl8/common';
import { TenantContextService } from '@hl8/multi-tenancy';  // ✨ 依赖注入

export abstract class TenantAwareAggregateRoot extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    auditInfo: IPartialAuditInfo,
    protected readonly tenantContextService: TenantContextService,  // ✨ 注入上下文服务
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this.ensureTenantContext();
  }

  /**
   * 确保租户上下文存在
   */
  protected ensureTenantContext(): void {
    if (!this.tenantId || !this.tenantId.value || this.tenantId.value.trim() === '') {
      throw new GeneralBadRequestException(
        'Tenant context required',
        '租户上下文缺失，所有操作必须在租户上下文中执行',
        {
          aggregateType: this.constructor.name,
          aggregateId: this.id.toString(),
        }
      );
    }
  }

  /**
   * 确保实体属于同一租户
   */
  protected ensureSameTenant(
    entityTenantId: EntityId,
    entityType: string = 'Entity'
  ): void {
    if (!this.tenantId.equals(entityTenantId)) {
      throw new GeneralForbiddenException(
        'Cross-tenant operation not allowed',
        `无法操作其他租户的${entityType}，数据隔离策略禁止跨租户操作`,
        {
          aggregateType: this.constructor.name,
          aggregateId: this.id.toString(),
          aggregateTenantId: this.tenantId.toString(),
          entityTenantId: entityTenantId.toString(),
          entityType,
        }
      );
    }
  }

  /**
   * 发布租户事件
   */
  protected publishTenantEvent(
    eventFactory: (
      aggregateId: EntityId,
      version: number,
      tenantId: EntityId
    ) => BaseDomainEvent
  ): void {
    const event = eventFactory(this.id, this.version, this.tenantId);
    this.addDomainEvent(event);
  }

  /**
   * 获取当前租户ID（从上下文服务）
   * 
   * 注意：这个方法用于动态获取当前请求的租户ID，
   * 而 this.tenantId 是聚合根实例化时固定的租户ID
   */
  protected getCurrentTenantIdFromContext(): EntityId {
    const tenantIdStr = this.tenantContextService.getTenant();
    if (!tenantIdStr) {
      throw new GeneralBadRequestException('Tenant context not found');
    }
    return EntityId.fromString(tenantIdStr);
  }

  /**
   * 检查是否属于指定租户
   */
  public belongsToTenant(tenantId: EntityId): boolean {
    return this.tenantId.equals(tenantId);
  }

  /**
   * 记录租户级别的日志
   */
  protected logTenantOperation(
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.logger.info(message, {
      aggregateType: this.constructor.name,
      aggregateId: this.id.toString(),
      tenantId: this.tenantId.toString(),
      ...data,
    });
  }
}
```

**关键点**：

- ✅ 依赖注入 `TenantContextService`
- ✅ 构造函数中自动验证租户上下文
- ✅ 提供租户验证方法（`ensureTenantContext`, `ensureSameTenant`）
- ✅ 简化租户事件发布（`publishTenantEvent`）
- ✅ 提供上下文访问方法（`getCurrentTenantIdFromContext`）

---

### 2. 更新 saas-core 的聚合根

**修改前**（使用 BaseAggregateRoot）：

```typescript
export class TenantAggregate extends BaseAggregateRoot {
  public updateName(name: string): void {
    // ❌ 手动验证
    if (!this.tenantId) {
      throw new GeneralBadRequestException(...);
    }
    
    this._tenant.updateName(name);
    
    // ❌ 手动传递 tenantId
    this.addDomainEvent(new TenantUpdatedEvent(
      this.id,
      this.version,
      this.tenantId,
      name
    ));
  }
}
```

**修改后**（使用 TenantAwareAggregateRoot）：

```typescript
export class TenantAggregate extends TenantAwareAggregateRoot {
  public updateName(name: string): void {
    // ✅ 一行验证
    this.ensureTenantContext();
    
    this._tenant.updateName(name);
    
    // ✅ 简化事件发布
    this.publishTenantEvent((id, v, tid) =>
      new TenantUpdatedEvent(id, v, tid, name)
    );
  }
}
```

---

### 3. 在应用层使用 TenantIsolationService

**用例示例**：

```typescript
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserAggregate> {
    // 1. 获取租户上下文
    const tenantId = this.tenantContextService.getTenant();
    
    // 2. 检查是否需要隔离
    const shouldIsolate = await this.tenantIsolationService.shouldIsolate(tenantId);
    
    // 3. 创建用户聚合根
    const user = UserAggregate.create(
      EntityId.generate(),
      EntityId.fromString(tenantId),
      command.username,
      command.email
    );
    
    // 4. 保存到仓储（仓储内部使用 tenantId 进行隔离）
    await this.userRepository.save(user);
    
    return user;
  }
}
```

---

## 📋 总结与行动计划

### ✅ 评估结论

1. **multi-tenancy 模块定位明确**：纯基础设施层，提供租户上下文管理和数据隔离的技术能力
2. **与 hybrid-archi 互补**：multi-tenancy 提供基础设施支持，hybrid-archi 提供领域模型基础
3. **TenantAwareAggregateRoot 确实必要**：作为桥梁整合两者功能，为业务聚合根提供统一的租户能力
4. **tenantId 类型已统一**：已使用 `EntityId` 类型，与 hybrid-archi 一致
5. **服务接口返回 string**：TenantContextService.getTenant() 返回 string，需要在 TenantAwareAggregateRoot 中封装转换

### 🎯 立即行动（推荐）

#### 1. 创建 TenantAwareAggregateRoot（P0 - 高优先级）⭐⭐⭐

- 位置：`packages/hybrid-archi/src/domain/aggregates/base/tenant-aware-aggregate-root.ts`
- 功能：整合 multi-tenancy 和 hybrid-archi 的租户能力
- 收益：节省 300-600 行重复代码，提升安全性和开发效率

#### 2. 更新 plan.md 和 data-model.md（P0 - 高优先级）⭐⭐⭐

- 恢复使用 `TenantAwareAggregateRoot`（现在是正确的）
- 添加 multi-tenancy 模块的使用说明
- 添加 TenantContextService 和 TenantIsolationService 的集成方案

#### 3. 更新 research.md（P1 - 中优先级）⭐⭐

- 添加 multi-tenancy 模块分析章节
- 添加 TenantContextService 使用指南
- 添加 TenantIsolationService 使用指南

#### 4. 创建单元测试（P1 - 中优先级）⭐⭐

- 测试 TenantAwareAggregateRoot 的租户验证功能
- 测试跨租户操作检查
- 测试租户事件发布

---

## 📊 三大模块关系总结

```
┌──────────────────────────────────────────────────────────────┐
│                 多租户SAAS平台架构                             │
├──────────────────────────────────────────────────────────────┤
│  packages/saas-core（业务层）                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TenantAggregate, UserAggregate, ...                   │  │
│  │  - 继承 TenantAwareAggregateRoot                       │  │
│  │  - 实现具体业务逻辑                                     │  │
│  │  - 使用租户验证、租户事件、租户日志                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓ 继承                             │
│  packages/hybrid-archi（架构基础层）                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TenantAwareAggregateRoot ✨ (新增)                     │  │
│  │  - 继承 BaseAggregateRoot                              │  │
│  │  - 注入 TenantContextService                           │  │
│  │  - 提供租户验证、租户事件、租户日志                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓ 继承                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  BaseAggregateRoot                                     │  │
│  │  - 继承 BaseEntity（包含 tenantId: EntityId）           │  │
│  │  - 领域事件管理                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                            ↓ 依赖                             │
│  packages/multi-tenancy（基础设施层）                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TenantContextService                                  │  │
│  │  - 租户上下文管理（基于 nestjs-cls）                     │  │
│  │  - setContext(), getTenant(), updateTenant()           │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  TenantIsolationService                                │  │
│  │  - 数据隔离策略管理                                     │  │
│  │  - getTenantKey(), isolateData(), extractTenantData()  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**总结**：

- ✅ multi-tenancy：提供租户上下文管理和数据隔离（基础设施层）
- ✅ hybrid-archi：提供领域模型基础和通用组件（领域层 + 应用层 + 基础设施层）
- ✅ TenantAwareAggregateRoot：整合两者，为业务聚合根提供统一的租户能力（hybrid-archi 的一部分）
- ✅ saas-core：实现具体的多租户业务逻辑（业务层）

---

**评估完成时间**: 2025-10-08  
**下一步行动**: 创建 TenantAwareAggregateRoot，更新 plan.md 和 data-model.md
