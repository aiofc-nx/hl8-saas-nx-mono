# SAAS-CORE 领域层开发指南

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 领域层设计原则](#1-领域层设计原则)
- [2. 充血模型实现](#2-充血模型实现)
- [3. 实体与聚合根分离](#3-实体与聚合根分离)
- [4. 值对象设计](#4-值对象设计)
- [5. 领域事件设计](#5-领域事件设计)
- [6. 业务规则管理](#6-业务规则管理)
- [7. 领域服务设计](#7-领域服务设计)
- [8. 代码示例](#8-代码示例)

---

## 1. 领域层设计原则

### 1.1 充血模型原则

**✅ 正确做法**:

```typescript
// 实体包含业务逻辑
export class User extends BaseEntity {
  public activate(): void {
    if (this.status !== UserStatus.Pending) {
      throw new UserNotPendingException('只有待激活状态的用户才能激活');
    }
    
    this.status = UserStatus.Active;
    this.activatedAt = new Date();
    this.updateTimestamp();
  }
}
```

**❌ 错误做法**:

```typescript
// ❌ 贫血模型 - 只有getter/setter
export class User {
  private _status: UserStatus;
  
  setStatus(status: UserStatus): void {
    this._status = status;
  }
  
  getStatus(): UserStatus {
    return this._status;
  }
}
```

### 1.2 实体与聚合根分离

**聚合根作为管理者**:

- 管理聚合一致性边界
- 协调内部实体操作
- 发布领域事件
- 验证业务规则

**内部实体作为被管理者**:

- 执行具体业务操作
- 维护自身状态
- 遵循聚合根指令
- 实现业务逻辑

### 1.3 指令模式实现

**指令模式** 是实体与聚合根分离的核心实现机制：

```text
聚合根发出指令 → 实体执行指令 → 返回执行结果
```

**指令类型**:

- **方法调用指令**: 聚合根调用实体的业务方法
- **状态变更指令**: 聚合根指示实体变更状态
- **业务规则验证指令**: 聚合根要求实体验证业务规则

---

## 2. 充血模型实现

### 2.1 基础实体设计

```typescript
// src/domain/tenant/entities/tenant.entity.ts
import { BaseEntity, TenantId } from '@hl8/hybrid-archi';

export class Tenant extends BaseEntity {
  constructor(
    id: TenantId,
    private _code: string,
    private _name: string,
    private _type: TenantType,
    private _status: TenantStatus,
    private _adminId: string,
    private _config: TenantConfig,
    private _resourceLimits: ResourceLimits
  ) {
    super(id.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 激活租户 - 实体包含业务逻辑
   */
  public activate(): void {
    // 验证业务规则
    if (this._status !== TENANT_STATUS.PENDING) {
      throw new TenantNotPendingException('只有待激活状态的租户才能激活');
    }
    
    // 执行业务逻辑
    this._status = TENANT_STATUS.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 暂停租户 - 实体包含业务逻辑
   */
  public suspend(reason: string): void {
    // 验证业务规则
    if (this._status !== TENANT_STATUS.ACTIVE) {
      throw new TenantNotActiveException('只有活跃状态的租户才能暂停');
    }
    
    // 执行业务逻辑
    this._status = TENANT_STATUS.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * 检查功能权限 - 实体包含业务逻辑
   */
  public canUseFeature(feature: string): boolean {
    return this._config.features.includes(feature) || 
           this._config.features.includes('all_features');
  }

  /**
   * 检查资源限制 - 实体包含业务逻辑
   */
  public isResourceLimitExceeded(resource: keyof ResourceLimits, currentUsage: number): boolean {
    const limit = this._resourceLimits[resource];
    return limit !== -1 && currentUsage >= limit;
  }

  // ... 其他业务方法
}
```

### 2.2 用户实体设计

```typescript
// src/domain/user/entities/user.entity.ts
import { BaseEntity, UserId, TenantId } from '@hl8/hybrid-archi';
import { UserProfile } from '../value-objects/user-profile.vo';

export class User extends BaseEntity {
  constructor(
    id: UserId,
    private _tenantId: TenantId,
    private _email: string,
    private _username: string,
    private _password: string,
    private _profile: UserProfile,
    private _status: UserStatus,
    private _roles: UserRole[]
  ) {
    super(id.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 激活用户 - 实体包含业务逻辑
   */
  public activate(): void {
    if (this._status !== UserStatus.PENDING) {
      throw new UserNotPendingException('只有待激活状态的用户才能激活');
    }
    
    this._status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * 认证用户 - 实体包含业务逻辑
   */
  public authenticate(password: string): boolean {
    if (this._status !== UserStatus.ACTIVE) {
      throw new UserNotActiveException('只有活跃状态的用户才能登录');
    }
    
    return this._password === password; // 实际项目中应该使用哈希比较
  }

  /**
   * 更新密码 - 实体包含业务逻辑
   */
  public updatePassword(oldPassword: string, newPassword: string): void {
    if (!this.authenticate(oldPassword)) {
      throw new InvalidPasswordException('原密码不正确');
    }
    
    this._password = newPassword;
    this.updateTimestamp();
  }

  /**
   * 分配到租户 - 实体包含业务逻辑
   */
  public assignToTenant(tenantId: TenantId, role: UserRole): void {
    if (this._status !== UserStatus.ACTIVE) {
      throw new UserNotActiveException('只有活跃状态的用户才能分配到租户');
    }
    
    this._tenantId = tenantId;
    if (!this._roles.includes(role)) {
      this._roles.push(role);
    }
    this.updateTimestamp();
  }

  // ... 其他业务方法
}
```

---

## 3. 实体与聚合根分离

### 3.1 聚合根设计

```typescript
// src/domain/tenant/aggregates/tenant.aggregate.ts
import { BaseAggregateRoot, TenantId } from '@hl8/hybrid-archi';
import { Tenant } from '../entities/tenant.entity';
import { TenantCreatedEvent } from '../../events/tenant-events';

export class TenantAggregate extends BaseAggregateRoot {
  constructor(
    private readonly tenantId: TenantId,
    private readonly tenant: Tenant
  ) {
    super(tenantId.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 创建租户聚合根 - 聚合根作为管理者
   */
  public static create(
    id: TenantId,
    code: string,
    name: string,
    type: TenantType,
    adminId: string
  ): TenantAggregate {
    // 1. 创建内部实体
    const config = DEFAULT_TENANT_CONFIGS[type];
    const resourceLimits = DEFAULT_RESOURCE_LIMITS[type];

    const tenant = new Tenant(
      id, code, name, type, TENANT_STATUS.PENDING,
      adminId, config, resourceLimits
    );

    // 2. 创建聚合根
    const aggregate = new TenantAggregate(id, tenant);
    
    // 3. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new TenantCreatedEvent(id, code, name, type, adminId));

    return aggregate;
  }

  /**
   * 激活租户 - 聚合根协调内部实体
   */
  public activate(): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.activate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantActivatedEvent(this.tenantId));
  }

  /**
   * 暂停租户 - 聚合根协调内部实体
   */
  public suspend(reason: string): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.suspend(reason);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantSuspendedEvent(this.tenantId, reason));
  }

  /**
   * 更新配置 - 聚合根协调内部实体
   */
  public updateConfig(config: Partial<TenantConfig>): void {
    // 指令模式：聚合根发出指令给实体
    this.tenant.updateConfig(config);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new TenantConfigUpdatedEvent(this.tenantId, config));
  }

  /**
   * 获取租户实体 - 聚合根管理内部实体访问
   */
  public getTenant(): Tenant {
    return this.tenant;
  }
}
```

### 3.2 用户聚合根设计

```typescript
// src/domain/user/aggregates/user.aggregate.ts
import { BaseAggregateRoot, UserId, TenantId } from '@hl8/hybrid-archi';
import { User } from '../entities/user.entity';
import { UserRegisteredEvent } from '../../events/user-events';

export class UserAggregate extends BaseAggregateRoot {
  constructor(
    private readonly userId: UserId,
    private readonly user: User
  ) {
    super(userId.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 创建用户聚合根 - 聚合根作为管理者
   */
  public static create(
    id: UserId,
    email: string,
    username: string,
    password: string,
    profile: UserProfile
  ): UserAggregate {
    // 1. 创建内部实体
    const user = new User(
      id,
      null, // 初始时不属于任何租户
      email,
      username,
      password,
      profile,
      UserStatus.PENDING,
      []
    );

    // 2. 创建聚合根
    const aggregate = new UserAggregate(id, user);
    
    // 3. 发布领域事件（聚合根职责）
    aggregate.addDomainEvent(new UserRegisteredEvent(id, email, username));

    return aggregate;
  }

  /**
   * 激活用户 - 聚合根协调内部实体
   */
  public activate(): void {
    // 指令模式：聚合根发出指令给实体
    this.user.activate();
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserActivatedEvent(this.userId));
  }

  /**
   * 认证用户 - 聚合根协调内部实体
   */
  public authenticate(password: string): boolean {
    // 指令模式：聚合根发出指令给实体
    const isAuthenticated = this.user.authenticate(password);
    
    if (isAuthenticated) {
      // 发布领域事件（聚合根职责）
      this.addDomainEvent(new UserAuthenticatedEvent(this.userId));
    }
    
    return isAuthenticated;
  }

  /**
   * 分配到租户 - 聚合根协调内部实体
   */
  public assignToTenant(tenantId: TenantId, role: UserRole): void {
    // 指令模式：聚合根发出指令给实体
    this.user.assignToTenant(tenantId, role);
    
    // 发布领域事件（聚合根职责）
    this.addDomainEvent(new UserAssignedToTenantEvent(this.userId, tenantId, role));
  }

  /**
   * 获取用户实体 - 聚合根管理内部实体访问
   */
  public getUser(): User {
    return this.user;
  }
}
```

---

## 4. 值对象设计

### 4.1 租户配置值对象

```typescript
// src/domain/value-objects/tenant-config.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';

export interface TenantConfigProps {
  features: string[];
  theme: string;
  branding: {
    logo?: string;
    colors?: Record<string, string>;
  };
  settings: Record<string, any>;
}

export class TenantConfig extends BaseValueObject<TenantConfigProps> {
  private constructor(props: TenantConfigProps) {
    super(props);
    this.validate();
  }

  public static create(props: TenantConfigProps): TenantConfig {
    return new TenantConfig(props);
  }

  private validate(): void {
    if (!this.props.features || this.props.features.length === 0) {
      throw new InvalidTenantConfigException('租户配置必须包含功能列表');
    }
  }

  /**
   * 更新配置 - 创建新实例而不是修改现有实例
   */
  public updateConfig(updates: Partial<TenantConfigProps>): TenantConfig {
    return TenantConfig.create({ ...this.props, ...updates });
  }

  public get features(): string[] { return this.props.features; }
  public get theme(): string { return this.props.theme; }
  public get branding(): any { return this.props.branding; }
  public get settings(): Record<string, any> { return this.props.settings; }
}
```

### 4.2 用户档案值对象

```typescript
// src/domain/value-objects/user-profile.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';

export interface UserProfileProps {
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  timezone: string;
  locale: string;
  preferences: Record<string, any>;
}

export class UserProfile extends BaseValueObject<UserProfileProps> {
  private constructor(props: UserProfileProps) {
    super(props);
    this.validate();
  }

  public static create(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  private validate(): void {
    if (!this.props.firstName || this.props.firstName.trim().length === 0) {
      throw new InvalidUserProfileException('用户姓名不能为空');
    }
    
    if (!this.props.lastName || this.props.lastName.trim().length === 0) {
      throw new InvalidUserProfileException('用户姓氏不能为空');
    }
  }

  /**
   * 获取全名
   */
  public getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`.trim();
  }

  /**
   * 更新档案 - 创建新实例而不是修改现有实例
   */
  public updateProfile(updates: Partial<UserProfileProps>): UserProfile {
    return UserProfile.create({ ...this.props, ...updates });
  }

  public get firstName(): string { return this.props.firstName; }
  public get lastName(): string { return this.props.lastName; }
  public get avatar(): string | undefined { return this.props.avatar; }
  public get phone(): string | undefined { return this.props.phone; }
  public get timezone(): string { return this.props.timezone; }
  public get locale(): string { return this.props.locale; }
  public get preferences(): Record<string, any> { return this.props.preferences; }
}
```

### 4.3 资源限制值对象

```typescript
// src/domain/value-objects/resource-limits.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';

export interface ResourceLimitsProps {
  maxUsers: number;        // -1 表示无限制
  maxStorage: number;      // GB
  maxOrganizations: number;
  maxDepartments: number;
  maxApiCalls: number;     // 每月
  maxDataTransfer: number; // GB 每月
}

export class ResourceLimits extends BaseValueObject<ResourceLimitsProps> {
  private constructor(props: ResourceLimitsProps) {
    super(props);
    this.validate();
  }

  public static create(props: ResourceLimitsProps): ResourceLimits {
    return new ResourceLimits(props);
  }

  private validate(): void {
    // 验证数值范围
    const limits = Object.values(this.props);
    for (const limit of limits) {
      if (typeof limit === 'number' && limit < -1) {
        throw new InvalidResourceLimitsException('资源限制不能小于-1');
      }
    }
  }

  /**
   * 检查是否有限制
   */
  public hasLimit(resource: keyof ResourceLimitsProps): boolean {
    return this.props[resource] !== -1;
  }

  /**
   * 获取限制值
   */
  public getLimit(resource: keyof ResourceLimitsProps): number {
    return this.props[resource];
  }

  /**
   * 检查是否超过限制
   */
  public isExceeded(resource: keyof ResourceLimitsProps, currentUsage: number): boolean {
    const limit = this.props[resource];
    return limit !== -1 && currentUsage >= limit;
  }

  /**
   * 更新限制 - 创建新实例而不是修改现有实例
   */
  public updateLimits(updates: Partial<ResourceLimitsProps>): ResourceLimits {
    return ResourceLimits.create({ ...this.props, ...updates });
  }
}
```

---

## 5. 领域事件设计

### 5.1 租户领域事件

```typescript
// src/domain/events/tenant-events.ts
import { TenantId } from '@hl8/hybrid-archi';

export class TenantCreatedEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly code: string,
    public readonly name: string,
    public readonly type: TenantType,
    public readonly adminId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class TenantActivatedEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly activatedAt: Date = new Date()
  ) {}
}

export class TenantSuspendedEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly reason: string,
    public readonly suspendedAt: Date = new Date()
  ) {}
}

export class TenantConfigUpdatedEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly config: Partial<TenantConfig>,
    public readonly updatedAt: Date = new Date()
  ) {}
}

export class TenantUpgradedEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly fromType: TenantType,
    public readonly toType: TenantType,
    public readonly upgradedAt: Date = new Date()
  ) {}
}
```

### 5.2 用户领域事件

```typescript
// src/domain/events/user-events.ts
import { UserId, TenantId } from '@hl8/hybrid-archi';

export class UserRegisteredEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: string,
    public readonly username: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserActivatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly activatedAt: Date = new Date()
  ) {}
}

export class UserDeactivatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly deactivatedAt: Date = new Date()
  ) {}
}

export class UserSuspendedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly reason: string,
    public readonly suspendedAt: Date = new Date()
  ) {}
}

export class UserAssignedToTenantEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly role: UserRole,
    public readonly assignedAt: Date = new Date()
  ) {}
}

export class UserRemovedFromTenantEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly removedAt: Date = new Date()
  ) {}
}

export class UserRoleUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: TenantId,
    public readonly oldRole: UserRole,
    public readonly newRole: UserRole,
    public readonly updatedAt: Date = new Date()
  ) {}
}

export class UserAuthenticatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly authenticatedAt: Date = new Date()
  ) {}
}

export class UserPasswordUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly updatedAt: Date = new Date()
  ) {}
}

export class UserProfileUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly profile: UserProfile,
    public readonly updatedAt: Date = new Date()
  ) {}
}
```

---

## 6. 业务规则管理

### 6.1 租户业务规则

```typescript
// src/domain/rules/tenant-rules.ts
export class TenantBusinessRules {
  // 约束规则
  static readonly TENANT_CODE_MUST_BE_UNIQUE = "租户代码必须全局唯一";
  static readonly TENANT_NAME_MUST_NOT_BE_EMPTY = "租户名称不能为空";
  
  // 状态转换规则
  static readonly STATUS_TRANSITION_PENDING_TO_ACTIVE = "租户只能从PENDING状态转换到ACTIVE状态";
  static readonly STATUS_TRANSITION_ACTIVE_TO_SUSPENDED = "租户只能从ACTIVE状态转换到SUSPENDED状态";
  
  // 功能权限规则
  static readonly FREE_TENANT_FEATURES = "免费租户只能使用基础功能";
  static readonly ENTERPRISE_TENANT_FEATURES = "企业租户可以使用所有功能";
}

export class TenantRuleValidator {
  public static validateStatusTransition(currentStatus: TenantStatus, newStatus: TenantStatus): boolean {
    const validTransitions: Record<TenantStatus, TenantStatus[]> = {
      [TenantStatus.PENDING]: [TenantStatus.ACTIVE, TenantStatus.DISABLED],
      [TenantStatus.ACTIVE]: [TenantStatus.SUSPENDED, TenantStatus.DISABLED],
      [TenantStatus.SUSPENDED]: [TenantStatus.ACTIVE, TenantStatus.DISABLED],
      [TenantStatus.DISABLED]: [TenantStatus.ACTIVE],
      [TenantStatus.DELETED]: []
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  public static validateTenantCode(code: string): boolean {
    // 租户代码格式验证
    const codeRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
    return codeRegex.test(code);
  }

  public static validateResourceLimits(limits: ResourceLimits): boolean {
    // 资源限制验证
    return Object.values(limits).every(limit => limit >= -1);
  }
}
```

### 6.2 用户业务规则

```typescript
// src/domain/rules/user-rules.ts
export class UserBusinessRules {
  // 约束规则
  static readonly EMAIL_MUST_BE_UNIQUE = "邮箱地址必须全局唯一";
  static readonly USERNAME_MUST_BE_UNIQUE = "用户名必须全局唯一";
  static readonly PASSWORD_MUST_BE_STRONG = "密码必须符合安全要求";
  
  // 状态转换规则
  static readonly STATUS_TRANSITION_PENDING_TO_ACTIVE = "用户只能从PENDING状态转换到ACTIVE状态";
  static readonly STATUS_TRANSITION_ACTIVE_TO_SUSPENDED = "用户只能从ACTIVE状态转换到SUSPENDED状态";
  
  // 权限规则
  static readonly ADMIN_CAN_MANAGE_USERS = "管理员可以管理用户";
  static readonly USER_CAN_MANAGE_SELF = "用户只能管理自己的信息";
}

export class UserRuleValidator {
  public static validateStatusTransition(currentStatus: UserStatus, newStatus: UserStatus): boolean {
    const validTransitions: Record<UserStatus, UserStatus[]> = {
      [UserStatus.PENDING]: [UserStatus.ACTIVE, UserStatus.DISABLED],
      [UserStatus.ACTIVE]: [UserStatus.SUSPENDED, UserStatus.DISABLED],
      [UserStatus.SUSPENDED]: [UserStatus.ACTIVE, UserStatus.DISABLED],
      [UserStatus.DISABLED]: [UserStatus.ACTIVE],
      [UserStatus.DELETED]: []
    };
    
    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  public static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  public static validateUsername(username: string): boolean {
    // 用户名格式验证
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  }

  public static validatePassword(password: string): boolean {
    // 密码强度验证
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  }
}
```

---

## 7. 领域服务设计

### 7.1 租户领域服务

```typescript
// src/domain/services/tenant-domain-service.ts
export class TenantDomainService {
  constructor(
    private readonly tenantRepository: ITenantRepository
  ) {}

  /**
   * 验证租户代码唯一性 - 跨聚合业务逻辑
   */
  public async validateTenantCodeUniqueness(code: string): Promise<boolean> {
    const existingTenant = await this.tenantRepository.findByCode(code);
    return existingTenant === null;
  }

  /**
   * 检查租户资源使用情况 - 复杂业务逻辑
   */
  public async checkResourceUsage(tenantId: TenantId): Promise<ResourceUsage> {
    return await this.tenantRepository.getResourceUsage(tenantId);
  }

  /**
   * 验证租户是否可以创建新用户 - 跨聚合验证
   */
  public async canCreateUser(tenantId: TenantId, maxUsers: number): Promise<boolean> {
    if (maxUsers === -1) return true; // 无限制
    
    const usage = await this.checkResourceUsage(tenantId);
    return usage.userCount < maxUsers;
  }

  /**
   * 验证租户是否可以创建新组织 - 跨聚合验证
   */
  public async canCreateOrganization(tenantId: TenantId, maxOrganizations: number): Promise<boolean> {
    if (maxOrganizations === -1) return true; // 无限制
    
    const usage = await this.checkResourceUsage(tenantId);
    return usage.organizationCount < maxOrganizations;
  }

  /**
   * 计算租户升级后的资源限制 - 复杂计算
   */
  public calculateUpgradeLimits(currentType: TenantType, targetType: TenantType): ResourceLimits {
    const currentLimits = DEFAULT_RESOURCE_LIMITS[currentType];
    const targetLimits = DEFAULT_RESOURCE_LIMITS[targetType];
    
    // 升级时保持现有使用量，但更新限制
    return ResourceLimits.create({
      maxUsers: targetLimits.maxUsers,
      maxStorage: targetLimits.maxStorage,
      maxOrganizations: targetLimits.maxOrganizations,
      maxDepartments: targetLimits.maxDepartments,
      maxApiCalls: targetLimits.maxApiCalls,
      maxDataTransfer: targetLimits.maxDataTransfer
    });
  }
}
```

### 7.2 用户领域服务

```typescript
// src/domain/services/user-domain-service.ts
export class UserDomainService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tenantRepository: ITenantRepository
  ) {}

  /**
   * 验证邮箱唯一性 - 跨聚合业务逻辑
   */
  public async validateEmailUniqueness(email: string): Promise<boolean> {
    const existingUser = await this.userRepository.findByEmail(email);
    return existingUser === null;
  }

  /**
   * 验证用户名唯一性 - 跨聚合业务逻辑
   */
  public async validateUsernameUniqueness(username: string): Promise<boolean> {
    const existingUser = await this.userRepository.findByUsername(username);
    return existingUser === null;
  }

  /**
   * 验证用户是否可以分配到租户 - 跨聚合验证
   */
  public async canAssignToTenant(userId: UserId, tenantId: TenantId): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    const tenant = await this.tenantRepository.findById(tenantId);
    
    if (!user || !tenant) return false;
    
    // 检查用户状态
    if (user.getStatus() !== UserStatus.ACTIVE) return false;
    
    // 检查租户状态
    if (tenant.getStatus() !== TenantStatus.ACTIVE) return false;
    
    // 检查租户用户限制
    const resourceUsage = await this.tenantRepository.getResourceUsage(tenantId);
    const resourceLimits = tenant.getResourceLimits();
    
    return !resourceLimits.isExceeded('maxUsers', resourceUsage.userCount);
  }

  /**
   * 计算用户权限 - 复杂业务逻辑
   */
  public calculateUserPermissions(userId: UserId, tenantId: TenantId): UserPermission[] {
    // 这里应该根据用户角色和租户配置计算权限
    // 具体实现需要根据业务需求来定义
    return [];
  }
}
```

---

## 8. 代码示例

### 8.1 完整的租户聚合示例

```typescript
// src/domain/tenant/aggregates/tenant.aggregate.ts
import { BaseAggregateRoot, TenantId } from '@hl8/hybrid-archi';
import { Tenant } from '../entities/tenant.entity';
import { TenantCreatedEvent, TenantActivatedEvent, TenantSuspendedEvent } from '../../events/tenant-events';
import { TenantConfig, ResourceLimits } from '../value-objects';
import { TENANT_TYPES, TENANT_STATUS } from '../../constants/business.constants';

export class TenantAggregate extends BaseAggregateRoot {
  constructor(
    private readonly tenantId: TenantId,
    private readonly tenant: Tenant
  ) {
    super(tenantId.getEntityId(), { createdBy: 'system' });
  }

  /**
   * 创建租户聚合根
   */
  public static create(
    id: TenantId,
    code: string,
    name: string,
    type: TenantType,
    adminId: string
  ): TenantAggregate {
    // 创建默认配置和资源限制
    const config = TenantConfig.create({
      features: DEFAULT_TENANT_CONFIGS[type].features,
      theme: DEFAULT_TENANT_CONFIGS[type].theme,
      branding: DEFAULT_TENANT_CONFIGS[type].branding,
      settings: DEFAULT_TENANT_CONFIGS[type].settings
    });

    const resourceLimits = ResourceLimits.create(DEFAULT_RESOURCE_LIMITS[type]);

    // 创建租户实体
    const tenant = new Tenant(
      id, code, name, type, TENANT_STATUS.PENDING,
      adminId, config, resourceLimits
    );

    // 创建聚合根
    const aggregate = new TenantAggregate(id, tenant);
    
    // 发布创建事件
    aggregate.addDomainEvent(new TenantCreatedEvent(id, code, name, type, adminId));

    return aggregate;
  }

  /**
   * 激活租户
   */
  public activate(): void {
    this.tenant.activate();
    this.addDomainEvent(new TenantActivatedEvent(this.tenantId));
  }

  /**
   * 暂停租户
   */
  public suspend(reason: string): void {
    this.tenant.suspend(reason);
    this.addDomainEvent(new TenantSuspendedEvent(this.tenantId, reason));
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<TenantConfigProps>): void {
    this.tenant.updateConfig(config);
    this.addDomainEvent(new TenantConfigUpdatedEvent(this.tenantId, config));
  }

  /**
   * 升级租户类型
   */
  public upgrade(newType: TenantType): void {
    const currentType = this.tenant.getType();
    
    // 验证升级规则
    if (!this.canUpgradeTo(currentType, newType)) {
      throw new InvalidUpgradeException(`不能从 ${currentType} 升级到 ${newType}`);
    }

    // 更新配置和资源限制
    const newConfig = TenantConfig.create({
      features: DEFAULT_TENANT_CONFIGS[newType].features,
      theme: this.tenant.getConfig().theme,
      branding: this.tenant.getConfig().branding,
      settings: { ...this.tenant.getConfig().settings, ...DEFAULT_TENANT_CONFIGS[newType].settings }
    });

    const newResourceLimits = ResourceLimits.create(DEFAULT_RESOURCE_LIMITS[newType]);

    this.tenant.upgrade(newType, newConfig, newResourceLimits);
    this.addDomainEvent(new TenantUpgradedEvent(this.tenantId, currentType, newType));
  }

  /**
   * 检查是否可以升级到指定类型
   */
  private canUpgradeTo(currentType: TenantType, targetType: TenantType): boolean {
    const upgradeMatrix: Record<TenantType, TenantType[]> = {
      [TENANT_TYPES.FREE]: [TENANT_TYPES.BASIC, TENANT_TYPES.PROFESSIONAL, TENANT_TYPES.ENTERPRISE],
      [TENANT_TYPES.BASIC]: [TENANT_TYPES.PROFESSIONAL, TENANT_TYPES.ENTERPRISE],
      [TENANT_TYPES.PROFESSIONAL]: [TENANT_TYPES.ENTERPRISE],
      [TENANT_TYPES.ENTERPRISE]: [],
      [TENANT_TYPES.CUSTOM]: []
    };

    return upgradeMatrix[currentType]?.includes(targetType) || false;
  }

  /**
   * 获取租户实体
   */
  public getTenant(): Tenant {
    return this.tenant;
  }

  /**
   * 获取租户ID
   */
  public getTenantId(): TenantId {
    return this.tenantId;
  }
}
```

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md)
- [项目结构与模块职责](./03-project-structure.md)
- [应用层开发指南](./05-application-layer-development.md)
- [基础设施层开发指南](./06-infrastructure-layer-development.md)
- [接口层开发指南](./07-interface-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [测试策略与部署运维](./09-testing-and-deployment.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)
