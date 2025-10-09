# 数据模型设计: SAAS Core 核心业务模块

**Feature Branch**: `001-saas-core-implementation`  
**Created**: 2025-10-08  
**Phase**: Phase 1 - Data Model & API Contracts  
**Status**: Draft

---

## 设计原则

### 领域模型与ORM分离

根据 `research.md` 中的技术决策，本项目严格遵循领域模型与ORM实体分离的原则：

- **领域模型（Domain Model）**: 纯TypeScript类，无任何ORM注解，位于 `domain/` 层
- **ORM实体（ORM Entity）**: 包含MikroORM装饰器，位于 `infrastructure/persistence/entities/` 层
- **映射器（Mapper）**: 负责两者之间的双向转换，位于 `infrastructure/mappers/` 层

本文档描述的是**领域模型**的结构，不包含ORM实现细节。

### 架构模式

- **Clean Architecture**: 严格依赖方向（Interface → Application → Domain ← Infrastructure）
- **DDD**: 使用聚合根、实体、值对象、领域事件
- **CQRS**: 命令和查询分离
- **Event Sourcing**: 关键操作通过事件溯源记录

---

## 核心概念

### 实体 vs 聚合根

- **聚合根（Aggregate Root）**: 管理一致性边界，负责协调内部实体、发布领域事件
- **内部实体（Entity）**: 被聚合根管理，执行具体业务操作
- **值对象（Value Object）**: 不可变对象，封装业务概念

### 多租户模型

**聚合根继承关系**：

- 所有多租户聚合根继承自 `TenantAwareAggregateRoot`（来自 @hl8/hybrid-archi v1.1.0+）
- 所有实体继承自 `BaseEntity`，通过 `BaseEntity` 的审计信息自动包含 `tenantId: EntityId` 字段

**TenantAwareAggregateRoot 提供的功能**：

- ✅ `ensureTenantContext()`：自动验证租户上下文存在
- ✅ `ensureSameTenant(entityTenantId, entityType)`：验证跨实体的租户一致性
- ✅ `publishTenantEvent(eventFactory)`：简化租户事件的创建和发布
- ✅ `logTenantOperation(message, data)`：记录包含租户信息的日志
- ✅ `getTenantId()`：获取租户ID
- ✅ `belongsToTenant(tenantId)`：检查是否属于指定租户

**重要说明**: TenantAwareAggregateRoot 继承自 BaseAggregateRoot，专为多租户SAAS应用设计。它整合了 @hl8/multi-tenancy 的上下文服务，为业务聚合根提供统一的租户验证、租户事件、租户日志等功能，大幅简化业务代码。

### 实体继承体系

**所有领域实体必须继承自 `@hl8/hybrid-archi` 提供的基类**：

#### BaseEntity（来自 @hl8/hybrid-archi）

所有实体都继承自 `BaseEntity`，自动提供以下功能：

**基础字段**（无需在业务实体中重复定义）：

- `_id: EntityId` - 实体唯一标识（私有字段）
- `_auditInfo: IAuditInfo` - 审计信息（私有字段），包含：
  - `createdAt: Date` - 创建时间
  - `updatedAt: Date` - 更新时间
  - `deletedAt: Date | null` - 删除时间
  - `createdBy: string` - 创建人ID
  - `updatedBy: string` - 更新人ID
  - `deletedBy: string | null` - 删除人ID
  - `tenantId: EntityId` - 租户ID（多租户，使用EntityId确保类型安全）
  - `version: number` - 版本号（乐观锁）
  - `lastOperation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'` - 最后操作类型
  - `lastOperationIp: string | null` - 最后操作IP地址
  - `lastOperationUserAgent: string | null` - 最后操作用户代理
  - `lastOperationSource: 'WEB' | 'API' | 'CLI' | 'SYSTEM' | null` - 最后操作来源
  - `deleteReason: string | null` - 删除原因
- `logger: PinoLogger` - 日志记录器（protected）

**提供的属性**（通过 getter 访问器）：

- `id: EntityId` - 实体唯一标识
- `createdAt: Date` - 创建时间
- `updatedAt: Date` - 更新时间
- `deletedAt: Date | null` - 删除时间
- `tenantId: EntityId` - 租户ID（使用EntityId确保类型安全）
- `version: number` - 版本号
- `isDeleted: boolean` - 是否已删除
- `createdBy: string` - 创建者ID
- `updatedBy: string` - 更新者ID
- `deletedBy: string | null` - 删除者ID

**提供的方法**：

- `markAsDeleted(deletedBy?, deleteReason?, operationContext?): void` - 软删除
- `restoreDeleted(restoredBy?, operationContext?): void` - 恢复删除
- `updateTimestamp(updatedBy?, operationContext?): void` - 更新时间戳（protected）
- `equals(other: IEntity): boolean` - 相等性比较（基于ID）
- `toData(): Record<string, unknown>` - 转换为纯数据对象
- `toJSON(): Record<string, unknown>` - 转换为JSON
- `toString(): string` - 转换为字符串
- `isNew(): boolean` - 检查是否新创建
- `getVersion(): number` - 获取版本号
- `getBusinessIdentifier(): string` - 获取业务标识符
- `getTypeName(): string` - 获取类型名称
- `getHashCode(): string` - 获取哈希码
- `compareTo(other: BaseEntity): number` - 比较大小

**使用示例**：

```typescript
// domain/tenant/entities/tenant.entity.ts
import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
import { PinoLogger } from '@hl8/logger';
import { TenantCode, TenantDomain, TenantStatus } from '../value-objects';

export class Tenant extends BaseEntity {
  constructor(
    id: EntityId,
    private code: TenantCode,
    private name: string,
    private domain: TenantDomain,
    private status: TenantStatus,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger  // ✅ 添加可选的logger参数
  ) {
    // ✅ 调用父类构造函数，传入所有参数
    super(id, auditInfo, logger);
    this.validate(); // 验证业务规则
  }
  
  // ✅ 业务方法：更新时调用updateTimestamp()
  public updateName(name: string, updatedBy?: string): void {
    this.name = name;
    this.updateTimestamp(updatedBy); // 自动更新updatedAt和version
  }
  
  // ✅ Getters（业务字段）
  public getCode(): TenantCode {
    return this.code;
  }
  
  public getName(): string {
    return this.name;
  }
  
  // ✅ 访问基础字段（通过属性，不是方法）
  // const id = tenant.id;              // 而不是 tenant.getId()
  // const createdAt = tenant.createdAt;  // 而不是 tenant.getCreatedAt()
  // const tenantId = tenant.tenantId;    // 而不是 tenant.getTenantId()
  
  // ✅ 软删除功能（由BaseEntity提供）
  // tenant.markAsDeleted('user-123', '租户主动注销');
  // if (tenant.isDeleted) { ... }
  
  private validate(): void {
    // 验证业务规则
  }
}
```

**重要说明**：

1. **不要在业务实体中重复定义基础字段**：`id`、`createdAt`、`updatedAt`、`tenantId`、`version` 等字段已由 `BaseEntity` 提供
2. **构造函数必须调用 `super(id, auditInfo, logger)`**：传入实体ID、审计信息和可选的logger
3. **业务实体只定义业务相关字段**：如 `code`、`name`、`status`、`deletedAt` 等业务字段
4. **使用属性访问基础字段**：通过 `tenant.id`、`tenant.createdAt`、`tenant.tenantId` 等属性（不是方法）
5. **状态变更时调用 `this.updateTimestamp(updatedBy, operationContext)`**：自动更新 `updatedAt` 和递增 `version`
6. **软删除使用 `markAsDeleted()`**：不要自定义删除逻辑，使用 `BaseEntity` 提供的软删除功能
7. **审计信息自动管理**：`createdBy`、`updatedBy`、操作上下文等由 `BaseEntity` 自动管理

---

## 子领域划分

SAAS Core 模块包含以下6个子领域：

1. **Tenant（租户）**: 租户生命周期管理、配置管理、配额管理
2. **User（用户）**: 用户身份管理、认证授权
3. **Organization（组织）**: 横向组织管理
4. **Department（部门）**: 纵向部门管理、层级管理
5. **Role（角色）**: 角色管理、权限分配
6. **Permission（权限）**: 权限定义、权限验证

---

## 1. Tenant 子领域

### 聚合根: TenantAggregate

租户聚合根，管理租户的完整生命周期。

**继承**: `TenantAwareAggregateRoot`（提供租户验证、租户事件、租户日志等功能）

```typescript
import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';

class TenantAggregate extends TenantAwareAggregateRoot {
  // 内部实体
  private _tenant: Tenant;
  private _configuration: TenantConfiguration;
  private _quota: TenantQuota;
  
  constructor(
    id: EntityId,
    tenant: Tenant,
    configuration: TenantConfiguration,
    quota: TenantQuota,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this._tenant = tenant;
    this._configuration = configuration;
    this._quota = quota;
  }
  
  // ✅ 使用 TenantAwareAggregateRoot 的功能
  public updateName(name: string, updatedBy: string): void {
    // 自动验证租户上下文
    this.ensureTenantContext();
    
    // 执行业务逻辑
    this._tenant.updateName(name, updatedBy);
    
    // 简化事件发布（自动注入 aggregateId, version, tenantId）
    this.publishTenantEvent((id, version, tenantId) =>
      new TenantNameUpdatedEvent(id, version, tenantId, name)
    );
    
    // 记录租户操作日志
    this.logTenantOperation('租户名称已更新', {
      oldName: this._tenant.getName(),
      newName: name,
      updatedBy,
    });
  }
}
```

**职责**：

- 创建租户（create租户实体、分配配置、分配配额）
- 升级/降级租户类型
- 激活/暂停/删除租户
- 验证租户业务规则（✅ 使用 `ensureTenantContext()`）
- 发布租户领域事件（✅ 使用 `publishTenantEvent()`）
- 记录租户操作日志（✅ 使用 `logTenantOperation()`）

### 实体: Tenant

租户核心实体，包含租户基本信息。

**继承**: `BaseEntity`（提供 `id`、`createdAt`、`updatedAt`、`tenantId` 等基础字段）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| code | TenantCode | ✓ | 租户代码 | 3-20字符，小写字母+数字 |
| name | string | ✓ | 租户名称 | 1-100字符 |
| type | TenantType | ✓ | 租户类型 | FREE/BASIC/PROFESSIONAL/ENTERPRISE/CUSTOM |
| status | TenantStatus | ✓ | 租户状态 | TRIAL/ACTIVE/SUSPENDED/EXPIRED/DELETED |
| domain | TenantDomain | ✓ | 租户域名 | 唯一，域名格式 |
| trialEndsAt | Date | ✗ | 试用结束时间 | 仅试用状态 |
| activatedAt | Date | ✗ | 激活时间 | 激活后设置 |

**注意**: `id`、`createdAt`、`updatedAt`、`deletedAt`、`tenantId`、`version` 等字段由 `BaseEntity` 提供，通过属性访问（如 `tenant.id`、`tenant.createdAt`、`tenant.deletedAt`）。

**业务方法**：

- `updateName(name: string, updatedBy?: string): void` - 更新租户名称
- `updateType(type: TenantType, updatedBy?: string): void` - 更新租户类型
- `activate(updatedBy?: string): void` - 激活租户
- `suspend(reason: string, updatedBy?: string): void` - 暂停租户
- `expire(updatedBy?: string): void` - 标记过期

**注意**: 软删除使用 `BaseEntity` 提供的 `markAsDeleted(deletedBy?, deleteReason?, operationContext?)` 方法，不要自定义 `delete()` 方法。

### 实体: TenantConfiguration

租户配置实体，包含租户的各项配置。

**继承**: `BaseEntity`（`tenantId` 字段由 `BaseEntity` 提供，用于标识配置所属的租户）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| maxUsers | number | ✓ | 最大用户数 |
| maxStorageMB | number | ✓ | 最大存储空间(MB) |
| maxOrganizations | number | ✓ | 最大组织数 |
| maxDepartmentLevels | number | ✓ | 最大部门层级 |
| maxApiCallsPerDay | number | ✓ | 每日API调用限制 |
| enabledFeatures | string[] | ✓ | 启用的功能列表 |
| customSettings | Record<string, any> | ✗ | 自定义配置 |

**业务方法**：

- `updateQuota(quota: Partial<TenantQuota>): void` - 更新配额
- `enableFeature(feature: string): void` - 启用功能
- `disableFeature(feature: string): void` - 禁用功能
- `setCustomSetting(key: string, value: any): void` - 设置自定义配置

### 值对象

#### TenantCode

租户代码值对象。

**规则**：

- 长度: 3-20字符
- 格式: 小写字母+数字
- 唯一性: 全局唯一

#### TenantDomain

租户域名值对象。

**规则**：

- 格式: 符合域名规范
- 唯一性: 全局唯一

#### TenantQuota

租户配额值对象（不可变）。

**字段**：

- maxUsers: number
- maxStorageMB: number
- maxOrganizations: number
- maxDepartmentLevels: number
- maxApiCallsPerDay: number

**静态工厂方法**：

- `TenantQuota.fromTenantType(type: TenantType): TenantQuota`

### 枚举

#### TenantType

```typescript
enum TenantType {
  FREE = 'FREE',                    // 免费版
  BASIC = 'BASIC',                  // 基础版
  PROFESSIONAL = 'PROFESSIONAL',    // 专业版
  ENTERPRISE = 'ENTERPRISE',        // 企业版
  CUSTOM = 'CUSTOM'                 // 定制版
}
```

#### TenantStatus（来自 @hl8/hybrid-archi）

```typescript
enum TenantStatus {
  TRIAL = 'TRIAL',                  // 试用中
  ACTIVE = 'ACTIVE',                // 活跃
  SUSPENDED = 'SUSPENDED',          // 暂停
  EXPIRED = 'EXPIRED',              // 过期
  DELETED = 'DELETED'               // 已删除
}
```

### 领域事件

- `TenantCreatedEvent` - 租户创建
- `TenantActivatedEvent` - 租户激活
- `TenantSuspendedEvent` - 租户暂停
- `TenantUpgradedEvent` - 租户升级
- `TenantDowngradedEvent` - 租户降级
- `TenantDeletedEvent` - 租户删除

---

## 2. User 子领域

### 聚合根: UserAggregate

用户聚合根，管理用户的完整生命周期和认证信息。

**继承**: `TenantAwareAggregateRoot`

```typescript
import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';

class UserAggregate extends TenantAwareAggregateRoot {
  // 内部实体
  private _user: User;
  private _profile: UserProfile;
  private _credentials: UserCredentials;
  
  constructor(
    id: EntityId,
    user: User,
    profile: UserProfile,
    credentials: UserCredentials,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this._user = user;
    this._profile = profile;
    this._credentials = credentials;
  }
  
  // ✅ 使用 TenantAwareAggregateRoot 的功能
  public assignRole(roleId: EntityId, role: Role): void {
    // 验证角色属于同一租户
    this.ensureSameTenant(role.tenantId, 'Role');
    
    // 执行业务逻辑
    this._user.assignRole(roleId);
    
    // 简化事件发布
    this.publishTenantEvent((id, version, tenantId) =>
      new UserRoleAssignedEvent(id, version, tenantId, roleId)
    );
  }
}
```

**职责**：

- 注册用户（创建用户、生成凭证、发送验证邮件）
- 用户认证（验证密码、创建会话）
- 激活/禁用/锁定用户
- 修改用户信息和凭证（✅ 使用 `ensureTenantContext()`）
- 分配角色（✅ 使用 `ensureSameTenant()` 验证租户一致性）
- 发布用户领域事件（✅ 使用 `publishTenantEvent()`）

### 实体: User

用户核心实体，包含用户基本信息。

**继承**: `BaseEntity`（`tenantId` 字段由 `BaseEntity` 提供，用于标识用户所属的租户）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| username | Username | ✓ | 用户名 | 3-50字符，唯一 |
| email | Email | ✓ | 邮箱 | 邮箱格式，唯一 |
| phoneNumber | PhoneNumber | ✗ | 手机号 | 手机号格式 |
| status | UserStatus | ✓ | 用户状态 | PENDING/ACTIVE/DISABLED/LOCKED/EXPIRED/DELETED |
| emailVerified | boolean | ✓ | 邮箱已验证 | 默认false |
| phoneVerified | boolean | ✓ | 手机已验证 | 默认false |
| lastLoginAt | Date | ✗ | 最后登录时间 | |

**业务方法**：

- `verifyEmail(updatedBy?: string): void` - 验证邮箱
- `verifyPhone(updatedBy?: string): void` - 验证手机号
- `updateProfile(profile: Partial<UserProfile>, updatedBy?: string): void` - 更新个人信息
- `disable(reason: string, updatedBy?: string): void` - 禁用用户
- `lock(reason: string, updatedBy?: string): void` - 锁定用户
- `unlock(updatedBy?: string): void` - 解锁用户
- `recordLogin(): void` - 记录登录时间

### 实体: UserProfile

用户档案实体，包含用户的详细信息。

**继承**: `BaseEntity`

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | EntityId | ✓ | 所属用户（关联字段） |
| fullName | string | ✗ | 真实姓名 |
| nickname | string | ✗ | 昵称 |
| avatar | string | ✗ | 头像URL |
| gender | Gender | ✗ | 性别 |
| birthday | Date | ✗ | 生日 |
| bio | string | ✗ | 个人简介 |
| timezone | string | ✗ | 时区 |
| language | string | ✗ | 语言偏好 |

### 实体: UserCredentials

用户凭证实体，包含认证相关信息。

**继承**: `BaseEntity`

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| userId | EntityId | ✓ | 所属用户（关联字段） |
| passwordHash | string | ✓ | 密码哈希 |
| passwordSalt | string | ✓ | 密码盐值 |
| failedLoginAttempts | number | ✓ | 登录失败次数 |
| lockedUntil | Date | ✗ | 锁定到期时间 |
| passwordChangedAt | Date | ✗ | 密码修改时间 |
| mfaEnabled | boolean | ✓ | MFA已启用 |
| mfaSecret | string | ✗ | MFA密钥 |

**业务方法**：

- `verifyPassword(password: string): boolean` - 验证密码
- `changePassword(oldPassword: string, newPassword: string): void` - 修改密码
- `recordFailedLogin(): void` - 记录登录失败
- `resetFailedAttempts(): void` - 重置失败次数
- `enableMFA(): void` - 启用MFA
- `disableMFA(): void` - 禁用MFA

### 值对象（来自 @hl8/hybrid-archi）

- `Email` - 邮箱值对象
- `Username` - 用户名值对象
- `Password` - 密码值对象（验证规则）
- `PhoneNumber` - 手机号值对象

### 枚举

#### UserStatus（来自 @hl8/hybrid-archi）

```typescript
enum UserStatus {
  PENDING = 'PENDING',              // 待激活
  ACTIVE = 'ACTIVE',                // 活跃
  DISABLED = 'DISABLED',            // 禁用
  LOCKED = 'LOCKED',                // 锁定
  EXPIRED = 'EXPIRED',              // 过期
  DELETED = 'DELETED'               // 已删除
}
```

#### Gender

```typescript
enum Gender {
  MALE = 'MALE',                    // 男
  FEMALE = 'FEMALE',                // 女
  OTHER = 'OTHER',                  // 其他
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY'  // 不愿透露
}
```

### 领域事件

- `UserRegisteredEvent` - 用户注册
- `UserActivatedEvent` - 用户激活
- `UserDisabledEvent` - 用户禁用
- `UserLockedEvent` - 用户锁定
- `UserUnlockedEvent` - 用户解锁
- `UserPasswordChangedEvent` - 密码修改
- `UserEmailVerifiedEvent` - 邮箱验证
- `UserLoginEvent` - 用户登录

---

## 3. Organization 子领域

### 聚合根: OrganizationAggregate

组织聚合根，管理组织生命周期和成员关系。

**继承**: `TenantAwareAggregateRoot`

```typescript
import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';

class OrganizationAggregate extends TenantAwareAggregateRoot {
  // 内部实体
  private _organization: Organization;
  private _members: OrganizationMember[];
  
  constructor(
    id: EntityId,
    organization: Organization,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this._organization = organization;
    this._members = [];
  }
  
  // ✅ 使用 TenantAwareAggregateRoot 的功能
  public addMember(userId: EntityId, user: User): void {
    // 验证用户属于同一租户
    this.ensureSameTenant(user.tenantId, 'User');
    
    // 执行业务逻辑
    const member = new OrganizationMember(userId, this.id);
    this._members.push(member);
    
    // 简化事件发布
    this.publishTenantEvent((id, version, tenantId) =>
      new OrganizationMemberAddedEvent(id, version, tenantId, userId)
    );
  }
}
```

**职责**：

- 创建组织
- 添加/移除组织成员
- 设置成员职位
- 验证组织配额
- 发布组织领域事件

### 实体: Organization

组织核心实体，包含组织基本信息。

**继承**: `BaseEntity`（`tenantId` 字段由 `BaseEntity` 提供，用于标识组织所属的租户）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| code | string | ✓ | 组织代码 | 2-20字符，租户内唯一 |
| name | string | ✓ | 组织名称 | 1-100字符 |
| type | OrganizationType | ✓ | 组织类型 | 枚举值 |
| status | OrganizationStatus | ✓ | 组织状态 | ACTIVE/INACTIVE/DELETED |
| description | string | ✗ | 组织描述 | 最多500字符 |
| isDefault | boolean | ✓ | 是否默认组织 | 每租户仅一个 |
| displayOrder | number | ✓ | 显示顺序 | 用于排序 |

**业务方法**：

- `updateName(name: string, updatedBy?: string): void` - 更新组织名称
- `setDescription(description: string, updatedBy?: string): void` - 设置组织描述
- `activate(updatedBy?: string): void` - 激活组织
- `deactivate(updatedBy?: string): void` - 停用组织

**注意**: 软删除使用 `BaseEntity` 提供的 `markAsDeleted()` 方法。

### 实体: OrganizationMember

组织成员实体，表示用户与组织的关系。

**继承**: `BaseEntity`

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| organizationId | EntityId | ✓ | 所属组织（关联字段） |
| userId | EntityId | ✓ | 用户ID（关联字段） |
| position | string | ✗ | 职位 |
| joinedAt | Date | ✓ | 加入时间 |
| leftAt | Date | ✗ | 离开时间 |

### 值对象

#### OrganizationType

组织类型值对象（特定于 saas-core）。

```typescript
enum OrganizationType {
  PROFESSIONAL_COMMITTEE = 'PROFESSIONAL_COMMITTEE',    // 专业委员会
  PROJECT_TEAM = 'PROJECT_TEAM',                        // 项目管理团队
  QUALITY_CONTROL = 'QUALITY_CONTROL',                  // 质量控制小组
  PERFORMANCE_TEAM = 'PERFORMANCE_TEAM',                // 绩效管理小组
  CUSTOM = 'CUSTOM'                                     // 自定义类型
}
```

### 枚举

#### OrganizationStatus（来自 @hl8/hybrid-archi）

```typescript
enum OrganizationStatus {
  ACTIVE = 'ACTIVE',                // 活跃
  INACTIVE = 'INACTIVE',            // 停用
  DELETED = 'DELETED'               // 已删除
}
```

### 领域事件

- `OrganizationCreatedEvent` - 组织创建
- `OrganizationActivatedEvent` - 组织激活
- `OrganizationDeactivatedEvent` - 组织停用
- `OrganizationDeletedEvent` - 组织删除
- `MemberAddedToOrganizationEvent` - 成员加入
- `MemberRemovedFromOrganizationEvent` - 成员移除

---

## 4. Department 子领域

### 聚合根: DepartmentAggregate

部门聚合根，管理部门生命周期和层级关系。

**继承**: `TenantAwareAggregateRoot`

```typescript
import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';

class DepartmentAggregate extends TenantAwareAggregateRoot {
  // 内部实体
  private _department: Department;
  private _members: DepartmentMember[];
  private _closurePaths: DepartmentClosure[];  // 闭包表记录
  
  constructor(
    id: EntityId,
    department: Department,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this._department = department;
    this._members = [];
    this._closurePaths = [];
  }
  
  // ✅ 使用 TenantAwareAggregateRoot 的功能
  public addMember(userId: EntityId, user: User): void {
    // 验证用户属于同一租户
    this.ensureSameTenant(user.tenantId, 'User');
    
    // 执行业务逻辑
    const member = new DepartmentMember(userId, this.id);
    this._members.push(member);
    
    // 简化事件发布
    this.publishTenantEvent((id, version, tenantId) =>
      new DepartmentMemberAddedEvent(id, version, tenantId, userId)
    );
  }
}
```

**职责**：

- 创建部门（建立闭包表关系）
- 移动部门（更新闭包表）
- 添加/移除部门成员（✅ 使用 `ensureSameTenant()` 验证租户一致性）
- 验证部门层级限制
- 发布部门领域事件

### 实体: Department

部门核心实体，包含部门基本信息。

**继承**: `BaseEntity`（`tenantId` 字段由 `BaseEntity` 提供，用于标识部门所属的租户）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| organizationId | EntityId | ✓ | 所属组织（关联字段） | 外键 |
| parentId | EntityId | ✗ | 父部门ID（关联字段） | 外键，根部门为null |
| code | string | ✓ | 部门代码 | 2-20字符，组织内唯一 |
| name | string | ✓ | 部门名称 | 1-100字符 |
| fullName | string | ✓ | 部门全名 | 自动生成，含路径 |
| level | DepartmentLevel | ✓ | 部门层级 | 1-8（或更多） |
| path | DepartmentPath | ✓ | 部门路径 | 物化路径，如"/1/2/3" |
| status | DepartmentStatus | ✓ | 部门状态 | ACTIVE/INACTIVE/DELETED |
| description | string | ✗ | 部门描述 | 最多500字符 |
| displayOrder | number | ✓ | 显示顺序 | 同级排序 |

**业务方法**：

- `updateName(name: string, updatedBy?: string): void` - 更新部门名称
- `moveTo(newParent: EntityId, updatedBy?: string): void` - 移动到新父部门
- `activate(updatedBy?: string): void` - 激活部门
- `deactivate(updatedBy?: string): void` - 停用部门

**注意**: 软删除使用 `BaseEntity` 提供的 `markAsDeleted()` 方法。

### 实体: DepartmentClosure

部门闭包表实体，用于高效查询部门层级关系。

**继承**: `BaseEntity`（`tenantId` 字段由 `BaseEntity` 提供，用于租户数据隔离）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| ancestor | EntityId | ✓ | 祖先部门ID（关联字段） |
| descendant | EntityId | ✓ | 后代部门ID（关联字段） |
| depth | number | ✓ | 层级深度（0表示自己） |

**用途**：

- 查询某部门的所有子部门（包括孙部门）
- 查询某部门的所有父部门（包括祖先）
- 查询部门层级深度
- 高性能层级查询（无需递归）

### 实体: DepartmentMember

部门成员实体，表示用户与部门的关系。

**继承**: `BaseEntity`

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| departmentId | EntityId | ✓ | 所属部门（关联字段） |
| userId | EntityId | ✓ | 用户ID（关联字段） |
| position | string | ✗ | 职位 |
| isPrimary | boolean | ✓ | 是否主部门 |
| joinedAt | Date | ✓ | 加入时间 |
| leftAt | Date | ✗ | 离开时间 |

### 值对象

#### DepartmentLevel

部门层级值对象（特定于 saas-core）。

```typescript
enum DepartmentLevel {
  LEVEL_1 = 1,      // 总部（根部门）
  LEVEL_2 = 2,      // 事业部
  LEVEL_3 = 3,      // 区域
  LEVEL_4 = 4,      // 分公司
  LEVEL_5 = 5,      // 部门
  LEVEL_6 = 6,      // 组
  LEVEL_7 = 7,      // 小组
  LEVEL_8 = 8,      // 专项团队（叶子部门）
}
```

#### DepartmentPath

部门路径值对象，物化路径表示。

**格式**: `/ancestor1/ancestor2/.../self`

**示例**: `/1/5/12` 表示部门12的父部门是5，祖先是1。

### 枚举

#### DepartmentStatus

```typescript
enum DepartmentStatus {
  ACTIVE = 'ACTIVE',                // 活跃
  INACTIVE = 'INACTIVE',            // 停用
  DELETED = 'DELETED'               // 已删除
}
```

### 领域事件

- `DepartmentCreatedEvent` - 部门创建
- `DepartmentMovedEvent` - 部门移动
- `DepartmentActivatedEvent` - 部门激活
- `DepartmentDeactivatedEvent` - 部门停用
- `DepartmentDeletedEvent` - 部门删除
- `MemberAddedToDepartmentEvent` - 成员加入
- `MemberRemovedFromDepartmentEvent` - 成员移除

---

## 5. Role 子领域

### 聚合根: RoleAggregate

角色聚合根，管理角色生命周期和权限分配。

**继承**: `TenantAwareAggregateRoot`

```typescript
import { TenantAwareAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';

class RoleAggregate extends TenantAwareAggregateRoot {
  // 内部实体
  private _role: Role;
  private _permissions: RolePermission[];
  
  constructor(
    id: EntityId,
    role: Role,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this._role = role;
    this._permissions = [];
  }
  
  // ✅ 使用 TenantAwareAggregateRoot 的功能
  public assignPermission(permissionId: EntityId, permission: Permission): void {
    // 验证权限属于同一租户
    this.ensureSameTenant(permission.tenantId, 'Permission');
    
    // 执行业务逻辑
    const rolePermission = new RolePermission(this.id, permissionId);
    this._permissions.push(rolePermission);
    
    // 简化事件发布
    this.publishTenantEvent((id, version, tenantId) =>
      new RolePermissionAssignedEvent(id, version, tenantId, permissionId)
    );
  }
}
```

**职责**：

- 创建角色
- 分配/移除权限
- 管理角色层级
- 验证权限有效性
- 发布角色领域事件

### 实体: Role

角色核心实体，包含角色基本信息。

**继承**: `BaseEntity`（`tenantId` 字段由 `BaseEntity` 提供，用于标识角色所属的租户）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| code | string | ✓ | 角色代码 | 2-50字符，租户内唯一 |
| name | RoleName | ✓ | 角色名称 | 1-100字符 |
| level | RoleLevel | ✓ | 角色层级 | PLATFORM/TENANT/ORGANIZATION/DEPARTMENT |
| status | RoleStatus | ✓ | 角色状态 | ACTIVE/INACTIVE/DELETED |
| description | string | ✗ | 角色描述 | 最多500字符 |
| isSystem | boolean | ✓ | 是否系统角色 | 系统角色不可删除 |
| isDefault | boolean | ✓ | 是否默认角色 | 新用户默认分配 |

**业务方法**：

- `updateName(name: string, updatedBy?: string): void` - 更新角色名称
- `setDescription(description: string, updatedBy?: string): void` - 设置角色描述
- `activate(updatedBy?: string): void` - 激活角色
- `deactivate(updatedBy?: string): void` - 停用角色

**注意**: 软删除使用 `BaseEntity` 提供的 `markAsDeleted()` 方法。对于系统角色，应在 `markAsDeleted()` 前检查 `isSystem` 属性。

### 实体: RolePermission

角色权限关系实体，表示角色拥有的权限。

**继承**: `BaseEntity`

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roleId | EntityId | ✓ | 角色ID（关联字段） |
| permissionId | EntityId | ✓ | 权限ID（关联字段） |
| grantedAt | Date | ✓ | 授予时间 |
| grantedBy | EntityId | ✓ | 授予人ID（关联字段） |

### 值对象

#### RoleLevel

角色层级值对象（特定于 saas-core）。

```typescript
enum RoleLevel {
  PLATFORM = 'PLATFORM',            // 平台级（最高权限）
  TENANT = 'TENANT',                // 租户级
  ORGANIZATION = 'ORGANIZATION',    // 组织级
  DEPARTMENT = 'DEPARTMENT'         // 部门级
}
```

#### RoleName

角色名称值对象，包含验证逻辑。

### 枚举

#### RoleStatus

```typescript
enum RoleStatus {
  ACTIVE = 'ACTIVE',                // 活跃
  INACTIVE = 'INACTIVE',            // 停用
  DELETED = 'DELETED'               // 已删除
}
```

### 领域事件

- `RoleCreatedEvent` - 角色创建
- `RoleActivatedEvent` - 角色激活
- `RoleDeactivatedEvent` - 角色停用
- `RoleDeletedEvent` - 角色删除
- `PermissionGrantedToRoleEvent` - 权限授予
- `PermissionRevokedFromRoleEvent` - 权限撤销

---

## 6. Permission 子领域

### 聚合根: PermissionAggregate

权限聚合根，管理权限定义。

**继承**: `BaseAggregateRoot`（注意：权限是平台级资源，不关联租户，因此继承 `BaseAggregateRoot` 而非 `TenantAwareAggregateRoot`）

```typescript
import { BaseAggregateRoot, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';

class PermissionAggregate extends BaseAggregateRoot {
  // 内部实体
  private _permission: Permission;
  
  constructor(
    id: EntityId,
    permission: Permission,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this._permission = permission;
  }
  
  // 注意：权限不关联租户，是平台级资源
  // 因此不需要租户验证功能，继承 BaseAggregateRoot 即可
  
  public updateDescription(description: string): void {
    this._permission.updateDescription(description);
    this.addDomainEvent(
      new PermissionDescriptionUpdatedEvent(this.id, this.version, description)
    );
  }
}
```

**职责**：

- 定义权限（平台级资源）
- 管理权限层级
- 验证权限代码唯一性
- 发布权限领域事件

### 实体: Permission

权限核心实体，包含权限基本信息。

**继承**: `BaseEntity`（注意：权限是平台级资源，不关联租户）

**业务字段**：

| 字段名 | 类型 | 必填 | 说明 | 验证规则 |
|--------|------|------|------|----------|
| code | string | ✓ | 权限代码 | 格式：resource:action |
| name | string | ✓ | 权限名称 | 1-100字符 |
| resource | string | ✓ | 资源名称 | 如 tenant, user, organization |
| action | PermissionAction | ✓ | 操作类型 | CREATE/READ/UPDATE/DELETE/EXECUTE |
| description | string | ✗ | 权限描述 | 最多500字符 |
| category | string | ✓ | 权限分类 | 如 tenant_management, user_management |
| isSystem | boolean | ✓ | 是否系统权限 | 系统权限不可删除 |
| status | PermissionStatus | ✓ | 权限状态 | ACTIVE/INACTIVE/DELETED |

**业务方法**：

- `updateDescription(description: string, updatedBy?: string): void` - 更新权限描述
- `activate(updatedBy?: string): void` - 激活权限
- `deactivate(updatedBy?: string): void` - 停用权限

**注意**: 软删除使用 `BaseEntity` 提供的 `markAsDeleted()` 方法。对于系统权限，应在 `markAsDeleted()` 前检查 `isSystem` 属性。

### 枚举

#### PermissionAction

```typescript
enum PermissionAction {
  CREATE = 'CREATE',                // 创建
  READ = 'READ',                    // 读取
  UPDATE = 'UPDATE',                // 更新
  DELETE = 'DELETE',                // 删除
  EXECUTE = 'EXECUTE'               // 执行（特殊操作）
}
```

#### PermissionStatus

```typescript
enum PermissionStatus {
  ACTIVE = 'ACTIVE',                // 活跃
  INACTIVE = 'INACTIVE',            // 停用
  DELETED = 'DELETED'               // 已删除
}
```

### 预定义权限示例

```typescript
// 租户管理权限
TENANT_CREATE = 'tenant:create'
TENANT_READ = 'tenant:read'
TENANT_UPDATE = 'tenant:update'
TENANT_DELETE = 'tenant:delete'
TENANT_UPGRADE = 'tenant:upgrade'

// 用户管理权限
USER_CREATE = 'user:create'
USER_READ = 'user:read'
USER_UPDATE = 'user:update'
USER_DELETE = 'user:delete'
USER_DISABLE = 'user:disable'

// 组织管理权限
ORGANIZATION_CREATE = 'organization:create'
ORGANIZATION_READ = 'organization:read'
ORGANIZATION_UPDATE = 'organization:update'
ORGANIZATION_DELETE = 'organization:delete'

// 部门管理权限
DEPARTMENT_CREATE = 'department:create'
DEPARTMENT_READ = 'department:read'
DEPARTMENT_UPDATE = 'department:update'
DEPARTMENT_DELETE = 'department:delete'
DEPARTMENT_MOVE = 'department:move'

// 角色管理权限
ROLE_CREATE = 'role:create'
ROLE_READ = 'role:read'
ROLE_UPDATE = 'role:update'
ROLE_DELETE = 'role:delete'
ROLE_ASSIGN = 'role:assign'

// 权限管理权限
PERMISSION_READ = 'permission:read'
PERMISSION_GRANT = 'permission:grant'
PERMISSION_REVOKE = 'permission:revoke'
```

### 领域事件

- `PermissionCreatedEvent` - 权限创建
- `PermissionActivatedEvent` - 权限激活
- `PermissionDeactivatedEvent` - 权限停用
- `PermissionDeletedEvent` - 权限删除

---

## 实体关系图

### 核心关系

```text
Platform (平台)
  └── Tenant (租户) 1:N
      ├── TenantConfiguration (租户配置) 1:1
      ├── TenantQuota (租户配额) 1:1
      ├── User (用户) 1:N
      │   ├── UserProfile (用户档案) 1:1
      │   └── UserCredentials (用户凭证) 1:1
      ├── Organization (组织) 1:N
      │   ├── OrganizationMember (组织成员) 1:N
      │   └── Department (部门) 1:N
      │       ├── DepartmentClosure (闭包表) N:N
      │       └── DepartmentMember (部门成员) 1:N
      └── Role (角色) 1:N
          └── RolePermission (角色权限) N:N
              └── Permission (权限) N:1
```

### 用户-租户-组织-部门关系

```text
User (用户)
  ├── UserTenantRelation (用户-租户关系) N:N
  │   └── Tenant (租户)
  ├── OrganizationMember (组织成员) N:N
  │   └── Organization (组织)
  └── DepartmentMember (部门成员) N:N
      └── Department (部门)
```

### 角色-权限关系

```text
User (用户)
  └── UserRole (用户角色) N:N
      └── Role (角色)
          └── RolePermission (角色权限) N:N
              └── Permission (权限)
```

---

## 聚合根持久化策略

根据 `research.md` 中的决策，聚合根通过仓储进行持久化：

### 仓储接口（Domain Layer）

```typescript
// domain/tenant/repositories/tenant-aggregate.repository.interface.ts
interface ITenantAggregateRepository {
  save(aggregate: TenantAggregate): Promise<void>;
  findById(id: EntityId): Promise<TenantAggregate | null>;
  findByCode(code: TenantCode): Promise<TenantAggregate | null>;
  delete(id: EntityId): Promise<void>;
}
```

### 仓储实现（Infrastructure Layer）

仓储适配器负责：

1. 将聚合根映射为ORM实体
2. 保存到数据库
3. 从数据库加载并重建聚合根
4. 发布领域事件

```typescript
// infrastructure/adapters/repositories/tenant-aggregate.repository.ts
class TenantAggregateRepository implements ITenantAggregateRepository {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly mapper: TenantMapper,
    private readonly eventBus: IEventBus
  ) {}
  
  async save(aggregate: TenantAggregate): Promise<void> {
    // 1. 映射聚合根为ORM实体
    const ormEntities = this.mapper.toOrmEntities(aggregate);
    
    // 2. 保存到数据库（事务）
    await this.entityManager.persistAndFlush(ormEntities);
    
    // 3. 发布领域事件
    await this.publishDomainEvents(aggregate);
  }
  
  async findById(id: EntityId): Promise<TenantAggregate | null> {
    // 1. 从数据库加载ORM实体
    const ormEntities = await this.loadOrmEntities(id);
    
    if (!ormEntities) return null;
    
    // 2. 映射为聚合根
    return this.mapper.toDomainAggregate(ormEntities);
  }
}
```

---

## 数据隔离策略

### 行级隔离（默认）

所有多租户表自动包含 `tenant_id` 字段，通过查询过滤实现隔离。

```sql
-- 自动添加租户过滤
SELECT * FROM users WHERE tenant_id = :tenantId AND ...
```

### MikroORM过滤器

使用MikroORM的全局过滤器自动注入租户上下文：

```typescript
// infrastructure/persistence/filters/tenant.filter.ts
@Filter('tenantFilter', (args) => ({
  tenantId: args.tenantId
}))
```

### 租户上下文

使用 `AsyncLocalStorage` 存储当前租户上下文：

```typescript
// infrastructure/multi-tenancy/tenant-context.service.ts
class TenantContextService {
  private asyncLocalStorage: AsyncLocalStorage<TenantContext>;
  
  getCurrentTenantId(): EntityId {
    return this.asyncLocalStorage.getStore()?.tenantId;
  }
}
```

---

## 事件溯源

### 事件存储

关键操作（如租户升级、用户登录、权限变更）通过事件溯源记录：

```typescript
// infrastructure/event-sourcing/event-store.ts
interface EventStore {
  appendEvents(streamId: string, events: DomainEvent[]): Promise<void>;
  readEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;
  createSnapshot(streamId: string, aggregate: any): Promise<void>;
  getSnapshot(streamId: string): Promise<any | null>;
}
```

### 事件流

每个聚合根有独立的事件流：

- `tenant-{tenantId}` - 租户事件流
- `user-{userId}` - 用户事件流
- `organization-{orgId}` - 组织事件流

### 快照

大型聚合根定期创建快照，减少重放事件数量：

```typescript
// 每100个事件创建一次快照
if (eventCount % 100 === 0) {
  await eventStore.createSnapshot(streamId, aggregate);
}
```

---

## 缓存策略

### 权限缓存

用户权限缓存30分钟：

```typescript
const cacheKey = `permissions:${userId}:${tenantId}`;
const ttl = 1800; // 30分钟
```

### 租户配置缓存

租户配置缓存1小时：

```typescript
const cacheKey = `tenant:config:${tenantId}`;
const ttl = 3600; // 1小时
```

### 缓存失效

权限或配置变更时主动失效缓存：

```typescript
// 权限变更时
await cacheService.invalidate(`permissions:${userId}:*`);

// 租户配置变更时
await cacheService.invalidate(`tenant:config:${tenantId}`);
```

---

## 数据迁移考虑

### 租户升级

租户类型变更时，需要：

1. 更新 `tenant.type`
2. 更新 `tenant_configuration` 配额
3. 验证现有数据是否超出新配额
4. 记录升级事件

### 组织迁移

组织删除时，需要：

1. 软删除组织记录
2. 处理组织下的部门（移动到默认组织 or 级联删除）
3. 处理组织成员关系
4. 记录删除事件

### 部门移动

部门移动到新父部门时，需要：

1. 更新 `department.parent_id`
2. 更新 `department.path`（物化路径）
3. 重建 `department_closure` 表（所有子部门）
4. 验证层级限制
5. 记录移动事件

---

## 性能优化

### 索引策略

```sql
-- 租户隔离查询
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_departments_tenant_id ON departments(tenant_id);

-- 唯一性约束
CREATE UNIQUE INDEX idx_tenants_code ON tenants(code);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username_tenant ON users(username, tenant_id);

-- 层级查询优化
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_department_closure_ancestor ON department_closure(ancestor);
CREATE INDEX idx_department_closure_descendant ON department_closure(descendant);

-- 权限查询优化
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
```

### 查询优化

```typescript
// 使用闭包表查询子部门（无需递归）
const subDepartments = await this.em.find(DepartmentClosure, {
  ancestor: departmentId,
  depth: { $gt: 0 }
});

// 使用物化路径查询祖先
const ancestors = await this.em.find(Department, {
  id: { $in: path.split('/').filter(Boolean) }
});
```

---

## 数据验证

### 领域层验证

值对象和实体在创建时验证：

```typescript
// 租户代码验证
class TenantCode {
  constructor(value: string) {
    this.validate(value);
    this._value = value;
  }
  
  private validate(value: string): void {
    if (value.length < 3 || value.length > 20) {
      throw new GeneralBadRequestException('...');
    }
    if (!/^[a-z0-9]+$/.test(value)) {
      throw new GeneralBadRequestException('...');
    }
  }
}
```

### 接口层验证

DTO使用 class-validator 验证：

```typescript
export class CreateTenantDto {
  @Length(3, 20)
  @Matches(/^[a-z0-9]+$/)
  code!: string;
  
  @Length(1, 100)
  name!: string;
  
  @IsEnum(TenantType)
  type!: TenantType;
}
```

### 业务规则验证

聚合根验证复杂业务规则：

```typescript
class TenantAggregate {
  private validateTenantCreation(): void {
    // 验证租户代码唯一性
    // 验证域名唯一性
    // 验证配额合理性
  }
  
  private validateUpgrade(newType: TenantType): void {
    // 验证升级路径是否支持
    // 验证现有数据是否兼容
  }
}
```

---

## 总结

本数据模型设计遵循以下原则：

1. **Clean Architecture**: 领域模型完全独立于技术框架
2. **DDD**: 使用聚合根、实体、值对象、领域事件
3. **继承体系**:
   - 多租户聚合根：继承 `TenantAwareAggregateRoot`（提供租户验证、租户事件、租户日志）
   - 非多租户聚合根：继承 `BaseAggregateRoot`（如 PermissionAggregate）
   - 所有实体：继承 `BaseEntity`（提供基础字段和 tenantId）
4. **多租户**: 所有实体支持租户隔离（通过BaseEntity提供的tenantId）
5. **性能优化**: 使用闭包表、物化路径、缓存策略
6. **事件溯源**: 关键操作通过事件记录
7. **类型安全**: 使用TypeScript强类型和值对象
8. **业务规则**: 验证逻辑封装在领域对象中

### 关键设计决策

#### 0. 聚合根继承 TenantAwareAggregateRoot

**多租户聚合根必须继承** `@hl8/hybrid-archi` v1.1.0+ 提供的 `TenantAwareAggregateRoot`：

**优势**：

- ✅ 自动租户验证：`ensureTenantContext()`
- ✅ 跨实体租户一致性检查：`ensureSameTenant(entityTenantId, entityType)`
- ✅ 简化事件发布：`publishTenantEvent(eventFactory)`
- ✅ 租户日志记录：`logTenantOperation(message, data)`
- ✅ 租户检查：`getTenantId()`, `belongsToTenant(tenantId)`

```typescript
// ✅ 正确示例：多租户聚合根
export class TenantAggregate extends TenantAwareAggregateRoot {
  constructor(
    id: EntityId,
    tenant: Tenant,
    auditInfo: IPartialAuditInfo,
    logger?: PinoLogger
  ) {
    super(id, auditInfo, logger);
    this._tenant = tenant;
  }
  
  public updateName(name: string): void {
    // ✅ 自动验证租户上下文
    this.ensureTenantContext();
    
    // 执行业务逻辑
    this._tenant.updateName(name);
    
    // ✅ 简化事件发布（自动注入 aggregateId, version, tenantId）
    this.publishTenantEvent((id, version, tenantId) =>
      new TenantNameUpdatedEvent(id, version, tenantId, name)
    );
  }
  
  public addUser(userId: EntityId, user: User): void {
    // ✅ 验证租户一致性
    this.ensureSameTenant(user.tenantId, 'User');
    
    // 执行业务逻辑
    // ...
  }
}

// ✅ 正确示例：非多租户聚合根（平台级资源）
export class PermissionAggregate extends BaseAggregateRoot {
  // 权限是平台级资源，不需要租户功能
}

// ❌ 错误示例：不要手动实现租户验证
export class TenantAggregate extends BaseAggregateRoot {
  public updateName(name: string): void {
    // ❌ 手动验证（繁琐且容易遗漏）
    if (!this.tenantId) {
      throw new Error('Tenant context required');
    }
    
    // ❌ 手动传递 tenantId（容易出错）
    this.addDomainEvent(
      new TenantNameUpdatedEvent(this.id, this.version, this.tenantId, name)
    );
  }
}
```

**使用场景**：

- ✅ TenantAggregate, UserAggregate, OrganizationAggregate, DepartmentAggregate, RoleAggregate
- ❌ PermissionAggregate（平台级资源，继承 BaseAggregateRoot）

#### 1. 实体继承 BaseEntity

**所有领域实体必须继承** `@hl8/hybrid-archi` 提供的 `BaseEntity`：

```typescript
// ✅ 正确示例
export class Tenant extends BaseEntity {
  constructor(
    id: EntityId,
    private code: TenantCode,
    private name: string,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo); // 调用父类构造函数
  }
  
  // 只定义业务字段和方法
  // id, createdAt, updatedAt等由BaseEntity提供
}

// ❌ 错误示例：不要重复定义基础字段
export class Tenant {
  private id: EntityId;           // ❌ 错误：BaseEntity已提供
  private createdAt: Date;        // ❌ 错误：BaseEntity已提供
  private updatedAt: Date;        // ❌ 错误：BaseEntity已提供
  private code: TenantCode;
  private name: string;
}
```

**BaseEntity提供的基础功能**：

- **基础字段**: `id`, `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `deletedBy`, `tenantId`, `version`, `isDeleted`
- **审计功能**: 自动记录创建人、修改人、删除人、时间戳、操作上下文（IP、UA、来源）
- **乐观锁**: 通过version字段防止并发冲突，每次更新自动递增
- **多租户支持**: tenantId（EntityId类型）自动从上下文注入，支持租户级数据隔离
- **软删除**: `markAsDeleted()` 和 `restoreDeleted()` 方法，保留删除原因
- **日志记录**: 内置 PinoLogger，自动记录实体操作
- **序列化**: `toData()` 和 `toJSON()` 方法
- **相等性比较**: `equals()` 方法（基于ID和类型）
- **实体状态**: `isNew()` 检查是否新创建，`getVersion()` 获取版本号

**使用注意事项**：

1. 构造函数必须调用 `super(id, auditInfo, logger)`，传入所有参数
2. 不要在业务实体中重复定义基础字段（`id`、`createdAt`、`updatedAt` 等）
3. 通过属性访问基础字段：`tenant.id`、`tenant.createdAt`、`tenant.tenantId` 等（不是方法）
4. `tenantId` 是 `EntityId` 类型，序列化时使用 `entity.tenantId.toString()`
5. 状态变更时调用 `this.updateTimestamp(updatedBy, operationContext)` 更新时间戳和版本号
6. 软删除使用 `this.markAsDeleted(deletedBy, deleteReason, operationContext)`，不要自定义删除逻辑
7. 业务字段使用private修饰符，通过Getter/Setter访问
8. 审计信息（`createdBy`、`updatedBy`、`tenantId`、操作上下文）会自动从多租户上下文获取

#### 2. 字段说明

本文档中的字段表格**只列出业务字段**，不包含BaseEntity提供的基础字段。

**基础字段（由BaseEntity提供，无需定义）**：

- `id: EntityId` - 实体唯一标识
- `createdAt: Date` - 创建时间
- `updatedAt: Date` - 更新时间
- `deletedAt: Date | null` - 删除时间
- `createdBy: string` - 创建人ID（注意：操作者ID使用string类型）
- `updatedBy: string` - 更新人ID（注意：操作者ID使用string类型）
- `deletedBy: string | null` - 删除人ID
- `tenantId: EntityId` - 租户ID（✅ 已重构：使用EntityId确保类型安全）
- `version: number` - 版本号（乐观锁）
- `isDeleted: boolean` - 是否已删除（计算属性）
- `lastOperation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE'` - 最后操作类型
- `lastOperationIp: string | null` - 最后操作IP地址
- `lastOperationUserAgent: string | null` - 最后操作用户代理
- `lastOperationSource: 'WEB' | 'API' | 'CLI' | 'SYSTEM' | null` - 最后操作来源
- `deleteReason: string | null` - 删除原因

**业务字段（需要在子类中定义）**：

- 实体特定的业务属性（如 `code`、`name`、`type` 等）
- 关联字段（如 `userId`、`organizationId`、`parentId` 等）
- 业务状态字段（如 `status`、`emailVerified` 等）
- 业务时间字段（如 `trialEndsAt`、`activatedAt`、`lastLoginAt` 等）
- 其他业务特定字段

#### 3. 实现指导

在实施阶段，所有实体类必须：

1. **导入必要的依赖**：

   ```typescript
   import { BaseEntity, EntityId, IPartialAuditInfo } from '@hl8/hybrid-archi';
   import { PinoLogger } from '@hl8/logger';
   ```

2. **继承BaseEntity**：

   ```typescript
   export class MyEntity extends BaseEntity { ... }
   ```

3. **正确的构造函数签名**：

   ```typescript
   constructor(
     id: EntityId,
     // ... 业务字段
     auditInfo: IPartialAuditInfo,  // 注意：是 IPartialAuditInfo，不是 IAuditInfo
     logger?: PinoLogger             // 可选参数
   ) {
     super(id, auditInfo, logger);  // 传入所有参数
   }
   ```

4. **只定义业务字段和业务方法**，不要重复定义基础字段

5. **正确使用BaseEntity提供的功能**：

   ```typescript
   // ✅ 访问基础字段（属性方式）
   const id = entity.id;
   const createdAt = entity.createdAt;
   const tenantId = entity.tenantId;
   const version = entity.version;
   
   // ✅ 更新操作
   entity.updateName('新名称', 'user-123');
   entity.updateTimestamp('user-123', { source: 'API' });
   
   // ✅ 软删除操作
   entity.markAsDeleted('user-123', '用户主动删除', {
     ip: '192.168.1.1',
     userAgent: 'Mozilla/5.0...',
     source: 'WEB'
   });
   
   // ✅ 检查状态
   if (entity.isDeleted) {
     console.log('实体已删除');
   }
   
   if (entity.isNew()) {
     console.log('这是新创建的实体');
   }
   ```

6. **重要：`tenantId` 使用 EntityId 类型**：

   ```typescript
   // ✅ 正确：BaseEntity提供的tenantId是EntityId类型
   const tenantId = entity.tenantId;  // EntityId类型
   
   // ✅ 序列化时转换为string
   const tenantIdString = entity.tenantId.toString();
   
   // ✅ 比较tenantId
   if (entity.tenantId.equals(anotherTenantId)) {
     console.log('同一租户');
   }
   
   // ❌ 错误：不要在业务实体中重复定义tenantId
   // private tenantId: EntityId;  // 已由BaseEntity提供
   ```

7. **审计信息自动管理**：
   - 构造函数接收 `IPartialAuditInfo`（可选字段）
   - `BaseEntity` 会自动补充缺失的字段
   - 如果存在多租户上下文，会自动注入 `tenantId` 和 `createdBy`

下一步将基于此数据模型设计 API 契约（OpenAPI规范）。
