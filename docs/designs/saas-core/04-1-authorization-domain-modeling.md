# 权限与角色领域建模

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 权限与角色领域概述](#1-权限与角色领域概述)
- [2. 权限实体设计](#2-权限实体设计)
- [3. 权限聚合根设计](#3-权限聚合根设计)
- [4. 角色实体设计](#4-角色实体设计)
- [5. 角色聚合根设计](#5-角色聚合根设计)
- [6. 用户角色关联实体设计](#6-用户角色关联实体设计)
- [7. 权限值对象设计](#7-权限值对象设计)
- [8. 授权领域事件设计](#8-授权领域事件设计)
- [9. 业务规则与验证](#9-业务规则与验证)
- [10. 代码示例](#10-代码示例)

---

## 1. 权限与角色领域概述

### 1.1 领域边界

权限与角色领域负责管理SAAS平台中的权限控制体系，包括：

- **权限管理**: 定义系统中的各种权限
- **角色管理**: 管理角色的创建、修改、删除
- **用户角色关联**: 管理用户与角色的分配关系
- **权限验证**: 提供权限检查机制
- **权限继承**: 支持角色间的权限继承

### 1.2 核心概念

#### 权限 (Permission)

- 系统中对特定资源的操作能力
- 包含资源类型、操作类型、权限范围等信息
- 支持权限级别和范围控制

#### 角色 (Role)

- 权限的集合，代表用户在系统中的权限范围
- 支持角色继承，可以继承其他角色的权限
- 包含系统角色和自定义角色

#### 用户角色关联 (UserRole)

- 管理用户与角色的多对多关系
- 支持角色有效期管理
- 记录角色分配者和分配时间

### 1.3 设计原则

- **实体与聚合根分离**: 权限和角色都有独立的实体和聚合根
- **充血模型**: 所有业务逻辑都在实体内实现
- **指令模式**: 聚合根通过指令协调内部实体操作
- **事件驱动**: 通过领域事件实现松耦合

---

## 2. 权限实体设计

### 2.1 权限实体结构

```typescript
// src/domain/authorization/entities/permission.entity.ts
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { PermissionScope } from '../value-objects/permission.vo';

export class Permission extends BaseEntity {
  constructor(
    id: EntityId,
    private readonly _name: string,
    private _description: string,
    private readonly _resourceType: string,
    private readonly _actionType: string,
    private readonly _scope: PermissionScope,
    private _level: number,
    private readonly _isSystemPermission: boolean,
    private _isActive: boolean
  ) {
    super(id, { createdBy: 'system' });
    this.validate();
  }
}
```

### 2.2 权限业务逻辑

#### 权限创建与验证

```typescript
/**
 * 创建权限实例
 */
public static create(
  id: EntityId,
  name: string,
  description: string,
  resourceType: string,
  actionType: string,
  scope: PermissionScope,
  level: number,
  isSystemPermission: boolean = false
): Permission {
  return new Permission(
    id, name, description, resourceType, actionType,
    scope, level, isSystemPermission, true
  );
}

/**
 * 验证权限数据
 */
protected override validate(): void {
  // 验证权限名称格式
  if (!this._name || this._name.trim().length === 0) {
    throw new InvalidPermissionException('权限名称不能为空');
  }

  const nameRegex = /^[a-z][a-z0-9_]*$/;
  if (!nameRegex.test(this._name)) {
    throw new InvalidPermissionException('权限名称格式不正确');
  }

  // 验证权限级别
  if (this._level < 0 || this._level > 100) {
    throw new InvalidPermissionException('权限级别必须在0-100之间');
  }
}
```

#### 权限管理操作

```typescript
/**
 * 更新权限描述
 */
public updateDescription(newDescription: string): void {
  if (this._isSystemPermission) {
    throw new SystemPermissionModificationException('不能修改系统权限');
  }

  if (!newDescription || newDescription.trim().length === 0) {
    throw new InvalidDescriptionException('权限描述不能为空');
  }

  this._description = newDescription.trim();
  this.updateTimestamp();
}

/**
 * 更新权限级别
 */
public updateLevel(newLevel: number): void {
  if (this._isSystemPermission) {
    throw new SystemPermissionModificationException('不能修改系统权限');
  }

  if (newLevel < 0 || newLevel > 100) {
    throw new InvalidPermissionLevelException('权限级别必须在0-100之间');
  }

  this._level = newLevel;
  this.updateTimestamp();
}

/**
 * 激活/停用权限
 */
public activate(): void {
  this._isActive = true;
  this.updateTimestamp();
}

public deactivate(): void {
  if (this._isSystemPermission) {
    throw new SystemPermissionModificationException('不能停用系统权限');
  }
  this._isActive = false;
  this.updateTimestamp();
}
```

#### 权限比较与继承

```typescript
/**
 * 检查是否可以继承自指定权限
 */
public canInheritFrom(otherPermission: Permission): boolean {
  // 不能继承自己
  if (this._name === otherPermission._name) {
    return false;
  }

  // 检查权限级别
  if (this._level <= otherPermission._level) {
    return false;
  }

  // 检查权限范围
  return this.isScopeHigherThan(otherPermission._scope);
}

/**
 * 检查是否包含指定权限
 */
public contains(permissionName: string): boolean {
  // 完全匹配
  if (this._name === permissionName) {
    return true;
  }

  // 通配符匹配
  if (this._name.endsWith('_all') && 
      permissionName.startsWith(this._name.replace('_all', ''))) {
    return true;
  }

  return false;
}
```

---

## 3. 权限聚合根设计

### 3.1 权限聚合根结构

```typescript
// src/domain/authorization/aggregates/permission.aggregate.ts
import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { Permission } from '../entities/permission.entity';
import { PermissionScope } from '../value-objects/permission.vo';
import { PermissionCreatedEvent, PermissionUpdatedEvent, PermissionDeletedEvent } from '../../events/authorization-events';

export class PermissionAggregate extends BaseAggregateRoot {
  constructor(
    private readonly permissionId: EntityId,
    private readonly permission: Permission
  ) {
    super(permissionId, { createdBy: 'system' });
  }
}
```

### 3.2 权限聚合根职责

#### 权限创建管理

```typescript
/**
 * 创建权限聚合根
 */
public static create(
  id: EntityId,
  name: string,
  description: string,
  resourceType: string,
  actionType: string,
  scope: PermissionScope,
  level: number,
  isSystemPermission: boolean = false
): PermissionAggregate {
  // 1. 创建权限实体
  const permission = Permission.create(
    id, name, description, resourceType, actionType,
    scope, level, isSystemPermission
  );

  // 2. 创建聚合根
  const aggregate = new PermissionAggregate(id, permission);
  
  // 3. 发布领域事件（聚合根职责）
  aggregate.addDomainEvent(new PermissionCreatedEvent(
    id, name, description, resourceType, actionType,
    scope, level, isSystemPermission
  ));

  return aggregate;
}
```

#### 权限更新协调

```typescript
/**
 * 更新权限描述 - 指令模式
 */
public updateDescription(newDescription: string): void {
  // 指令模式：聚合根发出指令给实体
  this.permission.updateDescription(newDescription);
  
  // 发布领域事件（聚合根职责）
  this.addDomainEvent(new PermissionUpdatedEvent(
    this.permissionId, 'description', newDescription.trim()
  ));
}

/**
 * 更新权限级别 - 指令模式
 */
public updateLevel(newLevel: number): void {
  // 指令模式：聚合根发出指令给实体
  this.permission.updateLevel(newLevel);
  
  // 发布领域事件（聚合根职责）
  this.addDomainEvent(new PermissionUpdatedEvent(
    this.permissionId, 'level', newLevel.toString()
  ));
}
```

#### 权限删除管理

```typescript
/**
 * 删除权限
 */
public delete(): void {
  // 检查是否为系统权限
  if (this.permission.isSystemPermission()) {
    throw new SystemPermissionModificationException('不能删除系统权限');
  }

  // 发布领域事件（聚合根职责）
  this.addDomainEvent(new PermissionDeletedEvent(
    this.permissionId, this.permission.getName()
  ));
}
```

---

## 4. 角色实体设计

### 4.1 角色实体结构

```typescript
// src/domain/authorization/entities/role.entity.ts
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { Permission } from './permission.entity';

export class Role extends BaseEntity {
  constructor(
    id: EntityId,
    private readonly _code: string,
    private _name: string,
    private _description: string,
    private _permissions: Permission[],
    private _parentRoleIds: string[],
    private readonly _isSystemRole: boolean,
    private _isActive: boolean
  ) {
    super(id, { createdBy: 'system' });
  }
}
```

### 4.2 角色业务逻辑

#### 权限管理

```typescript
/**
 * 添加权限
 */
public addPermission(permission: Permission): void {
  if (this._isSystemRole) {
    throw new SystemRoleModificationException('不能修改系统角色');
  }

  if (this._permissions.some(p => p.getName() === permission.getName())) {
    throw new PermissionAlreadyExistsException(`权限 ${permission.getName()} 已存在`);
  }

  this._permissions.push(permission);
  this.updateTimestamp();
}

/**
 * 移除权限
 */
public removePermission(permissionName: string): void {
  if (this._isSystemRole) {
    throw new SystemRoleModificationException('不能修改系统角色');
  }

  const index = this._permissions.findIndex(p => p.getName() === permissionName);
  if (index === -1) {
    throw new PermissionNotFoundException(`权限 ${permissionName} 不存在`);
  }

  this._permissions.splice(index, 1);
  this.updateTimestamp();
}
```

#### 角色继承管理

```typescript
/**
 * 添加父角色
 */
public addParentRole(parentRoleId: string): void {
  if (this._isSystemRole) {
    throw new SystemRoleModificationException('不能修改系统角色');
  }

  if (this._parentRoleIds.includes(parentRoleId)) {
    throw new ParentRoleAlreadyExistsException(`父角色 ${parentRoleId} 已存在`);
  }

  // 检查循环继承
  if (parentRoleId === this.id.toString()) {
    throw new CircularInheritanceException('角色不能继承自己');
  }

  this._parentRoleIds.push(parentRoleId);
  this.updateTimestamp();
}

/**
 * 移除父角色
 */
public removeParentRole(parentRoleId: string): void {
  if (this._isSystemRole) {
    throw new SystemRoleModificationException('不能修改系统角色');
  }

  const index = this._parentRoleIds.indexOf(parentRoleId);
  if (index === -1) {
    throw new ParentRoleNotFoundException(`父角色 ${parentRoleId} 不存在`);
  }

  this._parentRoleIds.splice(index, 1);
  this.updateTimestamp();
}
```

#### 权限检查

```typescript
/**
 * 检查是否拥有指定权限
 */
public hasPermission(permissionName: string): boolean {
  // 检查直接权限
  const directPermission = this._permissions.find(p => p.contains(permissionName));
  if (directPermission) {
    return true;
  }

  // 检查通配符权限
  const wildcardPermission = this._permissions.find(p => p.getName() === 'manage_all');
  if (wildcardPermission) {
    return true;
  }

  return false;
}

/**
 * 获取所有权限
 */
public getAllPermissions(): Permission[] {
  // 这里简化处理，实际应该递归获取父角色权限
  return [...this._permissions];
}
```

---

## 5. 角色聚合根设计

### 5.1 角色聚合根结构

```typescript
// src/domain/authorization/aggregates/role.aggregate.ts
import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { RoleCreatedEvent } from '../../events/authorization-events';

export class RoleAggregate extends BaseAggregateRoot {
  constructor(
    private readonly roleId: EntityId,
    private readonly role: Role
  ) {
    super(roleId, { createdBy: 'system' });
  }
}
```

### 5.2 角色聚合根职责

#### 角色创建管理

```typescript
/**
 * 创建角色聚合根
 */
public static create(
  id: EntityId,
  code: string,
  name: string,
  description: string,
  permissions: Permission[],
  isSystemRole: boolean = false
): RoleAggregate {
  // 1. 创建角色实体
  const role = new Role(
    id, code, name, description, permissions,
    [], // 初始没有父角色
    isSystemRole, true // 初始状态为激活
  );

  // 2. 创建聚合根
  const aggregate = new RoleAggregate(id, role);
  
  // 3. 发布领域事件（聚合根职责）
  aggregate.addDomainEvent(new RoleCreatedEvent(
    id, code, name, description, isSystemRole
  ));

  return aggregate;
}
```

#### 权限管理协调

```typescript
/**
 * 添加权限 - 指令模式
 */
public addPermission(permission: Permission): void {
  // 指令模式：聚合根发出指令给实体
  this.role.addPermission(permission);
  
  // 发布领域事件（聚合根职责）
  this.addDomainEvent(new RolePermissionAddedEvent(this.roleId, permission));
}

/**
 * 移除权限 - 指令模式
 */
public removePermission(permissionName: string): void {
  // 指令模式：聚合根发出指令给实体
  this.role.removePermission(permissionName);
  
  // 发布领域事件（聚合根职责）
  this.addDomainEvent(new RolePermissionRemovedEvent(this.roleId, permissionName));
}
```

#### 角色继承协调

```typescript
/**
 * 添加父角色 - 指令模式
 */
public addParentRole(parentRoleId: string): void {
  // 指令模式：聚合根发出指令给实体
  this.role.addParentRole(parentRoleId);
  
  // 发布领域事件（聚合根职责）
  this.addDomainEvent(new RoleParentAddedEvent(this.roleId, parentRoleId));
}

/**
 * 移除父角色 - 指令模式
 */
public removeParentRole(parentRoleId: string): void {
  // 指令模式：聚合根发出指令给实体
  this.role.removeParentRole(parentRoleId);
  
  // 发布领域事件（聚合根职责）
  this.addDomainEvent(new RoleParentRemovedEvent(this.roleId, parentRoleId));
}
```

---

## 6. 用户角色关联实体设计

### 6.1 用户角色关联实体结构

```typescript
// src/domain/authorization/entities/user-role.entity.ts
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';

export class UserRole extends BaseEntity {
  constructor(
    id: EntityId,
    private readonly _userId: EntityId,
    private readonly _roleId: EntityId,
    private readonly _assignedBy: EntityId,
    private readonly _assignedAt: Date,
    private _expiresAt?: Date,
    private _isActive: boolean = true
  ) {
    super(id, { createdBy: _assignedBy.toString() });
  }
}
```

### 6.2 用户角色关联业务逻辑

#### 角色分配管理

```typescript
/**
 * 创建用户角色关联
 */
public static create(
  id: EntityId,
  userId: EntityId,
  roleId: EntityId,
  assignedBy: EntityId,
  expiresInDays?: number
): UserRole {
  const assignedAt = new Date();
  const expiresAt = expiresInDays 
    ? new Date(assignedAt.getTime() + expiresInDays * 24 * 60 * 60 * 1000)
    : undefined;

  return new UserRole(
    id, userId, roleId, assignedBy, assignedAt, expiresAt
  );
}
```

#### 有效期管理

```typescript
/**
 * 延长角色有效期
 */
public extendExpiration(days: number): void {
  if (days <= 0) {
    throw new InvalidExpirationException('延长天数必须大于0');
  }

  const now = new Date();
  const currentExpiresAt = this._expiresAt || now;
  
  // 如果已过期，从当前时间开始计算
  const baseTime = currentExpiresAt > now ? currentExpiresAt : now;
  this._expiresAt = new Date(baseTime.getTime() + days * 24 * 60 * 60 * 1000);
  
  this.updateTimestamp();
}

/**
 * 设置永久有效
 */
public setPermanent(): void {
  this._expiresAt = undefined;
  this.updateTimestamp();
}
```

#### 状态管理

```typescript
/**
 * 激活角色
 */
public activate(): void {
  this._isActive = true;
  this.updateTimestamp();
}

/**
 * 停用角色
 */
public deactivate(): void {
  this._isActive = false;
  this.updateTimestamp();
}

/**
 * 检查角色是否过期
 */
public isExpired(): boolean {
  if (!this._expiresAt) {
    return false; // 永久角色不过期
  }
  return new Date() > this._expiresAt;
}

/**
 * 检查角色是否有效
 */
public isValid(): boolean {
  return this._isActive && !this.isExpired();
}
```

---

## 7. 权限值对象设计

### 7.1 权限范围值对象

```typescript
// src/domain/authorization/value-objects/permission.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';

export interface PermissionProps {
  name: string;
  description: string;
  resourceType: string;
  actionType: string;
  scope: PermissionScope;
  level: number;
  isSystemPermission: boolean;
}

export enum PermissionScope {
  OWN = 'OWN',           // 自己的资源
  DEPARTMENT = 'DEPARTMENT', // 部门内资源
  ORGANIZATION = 'ORGANIZATION', // 组织内资源
  TENANT = 'TENANT',     // 租户内资源
  PLATFORM = 'PLATFORM'  // 平台级资源
}

export class Permission extends BaseValueObject<PermissionProps> {
  private constructor(props: PermissionProps) {
    super(props);
    this.validate();
  }

  public static create(props: PermissionProps): Permission {
    return new Permission(props);
  }

  private validate(): void {
    // 验证权限名称
    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new InvalidPermissionException('权限名称不能为空');
    }

    const nameRegex = /^[a-z][a-z0-9_]*$/;
    if (!nameRegex.test(this.props.name)) {
      throw new InvalidPermissionException('权限名称格式不正确');
    }

    // 验证权限级别
    if (this.props.level < 0 || this.props.level > 100) {
      throw new InvalidPermissionException('权限级别必须在0-100之间');
    }
  }
}
```

---

## 8. 授权领域事件设计

### 8.1 权限相关事件

```typescript
// src/domain/events/authorization-events.ts
import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';
import { Permission } from '../authorization/value-objects/permission.vo';

export class PermissionCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly permissionId: EntityId,
    public readonly name: string,
    public readonly description: string,
    public readonly resourceType: string,
    public readonly actionType: string,
    public readonly scope: any,
    public readonly level: number,
    public readonly isSystemPermission: boolean
  ) {
    super(permissionId, 'PermissionCreated', {
      permissionId: permissionId.toString(),
      name, description, resourceType, actionType, scope, level, isSystemPermission
    });
  }
}

export class PermissionUpdatedEvent extends BaseDomainEvent {
  constructor(
    public readonly permissionId: EntityId,
    public readonly field: string,
    public readonly newValue: string
  ) {
    super(permissionId, 'PermissionUpdated', {
      permissionId: permissionId.toString(),
      field, newValue
    });
  }
}

export class PermissionDeletedEvent extends BaseDomainEvent {
  constructor(
    public readonly permissionId: EntityId,
    public readonly permissionName: string
  ) {
    super(permissionId, 'PermissionDeleted', {
      permissionId: permissionId.toString(),
      permissionName
    });
  }
}
```

### 8.2 角色相关事件

```typescript
export class RoleCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly description: string,
    public readonly isSystemRole: boolean
  ) {
    super(roleId, 'RoleCreated', {
      roleId: roleId.toString(),
      code, name, description, isSystemRole
    });
  }
}

export class RolePermissionAddedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly permission: Permission
  ) {
    super(roleId, 'RolePermissionAdded', {
      roleId: roleId.toString(),
      permission: permission.getAllPermissionInfo()
    });
  }
}

export class RolePermissionRemovedEvent extends BaseDomainEvent {
  constructor(
    public readonly roleId: EntityId,
    public readonly permissionName: string
  ) {
    super(roleId, 'RolePermissionRemoved', {
      roleId: roleId.toString(),
      permissionName
    });
  }
}
```

### 8.3 用户角色相关事件

```typescript
export class UserRoleAssignedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly roleId: EntityId,
    public readonly assignedBy: EntityId,
    public readonly expiresAt?: Date
  ) {
    super(userId, 'UserRoleAssigned', {
      userId: userId.toString(),
      roleId: roleId.toString(),
      assignedBy: assignedBy.toString(),
      expiresAt: expiresAt?.toISOString()
    });
  }
}

export class UserRoleRemovedEvent extends BaseDomainEvent {
  constructor(
    public readonly userId: EntityId,
    public readonly roleId: EntityId,
    public readonly removedBy: EntityId
  ) {
    super(userId, 'UserRoleRemoved', {
      userId: userId.toString(),
      roleId: roleId.toString(),
      removedBy: removedBy.toString()
    });
  }
}
```

---

## 9. 业务规则与验证

### 9.1 权限业务规则

```typescript
// src/domain/rules/permission-rules.ts
export class PermissionBusinessRules {
  // 约束规则
  static readonly PERMISSION_NAME_MUST_BE_UNIQUE = "权限名称必须全局唯一";
  static readonly PERMISSION_NAME_FORMAT = "权限名称只能包含小写字母、数字和下划线";
  static readonly PERMISSION_LEVEL_RANGE = "权限级别必须在0-100之间";
  
  // 系统权限规则
  static readonly SYSTEM_PERMISSION_CANNOT_BE_MODIFIED = "系统权限不能被修改或删除";
  static readonly SYSTEM_PERMISSION_CANNOT_BE_DEACTIVATED = "系统权限不能被停用";
  
  // 权限继承规则
  static readonly PERMISSION_CANNOT_INHERIT_FROM_SELF = "权限不能继承自己";
  static readonly PERMISSION_LEVEL_MUST_BE_HIGHER = "权限级别必须高于被继承权限";
}

export class PermissionRuleValidator {
  public static validatePermissionName(name: string): boolean {
    const nameRegex = /^[a-z][a-z0-9_]*$/;
    return nameRegex.test(name);
  }

  public static validatePermissionLevel(level: number): boolean {
    return level >= 0 && level <= 100;
  }

  public static validatePermissionInheritance(
    permission: Permission, 
    parentPermission: Permission
  ): boolean {
    // 不能继承自己
    if (permission.getName() === parentPermission.getName()) {
      return false;
    }

    // 检查权限级别
    if (permission.getLevel() <= parentPermission.getLevel()) {
      return false;
    }

    return true;
  }
}
```

### 9.2 角色业务规则

```typescript
// src/domain/rules/role-rules.ts
export class RoleBusinessRules {
  // 约束规则
  static readonly ROLE_CODE_MUST_BE_UNIQUE = "角色代码必须全局唯一";
  static readonly ROLE_NAME_MUST_NOT_BE_EMPTY = "角色名称不能为空";
  
  // 系统角色规则
  static readonly SYSTEM_ROLE_CANNOT_BE_MODIFIED = "系统角色不能被修改或删除";
  static readonly SYSTEM_ROLE_CANNOT_BE_DEACTIVATED = "系统角色不能被停用";
  
  // 角色继承规则
  static readonly ROLE_CANNOT_INHERIT_FROM_SELF = "角色不能继承自己";
  static readonly CIRCULAR_INHERITANCE_FORBIDDEN = "角色继承不能形成循环";
}

export class RoleRuleValidator {
  public static validateRoleCode(code: string): boolean {
    const codeRegex = /^[A-Z][A-Z0-9_]*$/;
    return codeRegex.test(code);
  }

  public static validateRoleName(name: string): boolean {
    return name && name.trim().length > 0 && name.length <= 100;
  }

  public static validateCircularInheritance(
    roleId: string, 
    parentRoleIds: string[]
  ): boolean {
    // 检查是否形成循环继承
    return !parentRoleIds.includes(roleId);
  }
}
```

---

## 10. 代码示例

### 10.1 完整的权限管理示例

```typescript
// 创建权限聚合根
const permissionAggregate = PermissionAggregate.create(
  permissionId,
  'manage_users',
  '管理用户',
  'user',
  'manage',
  PermissionScope.TENANT,
  50,
  true // 系统权限
);

// 更新权限描述
permissionAggregate.updateDescription('管理租户用户');

// 获取权限实体
const permission = permissionAggregate.getPermission();
const canInherit = permission.canInheritFrom(otherPermission);
```

### 10.2 完整的角色管理示例

```typescript
// 创建角色聚合根
const roleAggregate = RoleAggregate.create(
  roleId,
  'TENANT_ADMIN',
  '租户管理员',
  '管理租户内的所有资源',
  [permission1, permission2],
  false // 非系统角色
);

// 添加权限
roleAggregate.addPermission(newPermission);

// 添加父角色
roleAggregate.addParentRole('BASE_USER');

// 获取角色实体
const role = roleAggregate.getRole();
const hasPermission = role.hasPermission('manage_users');
```

### 10.3 用户角色分配示例

```typescript
// 创建用户角色关联
const userRole = UserRole.create(
  userRoleId,
  userId,
  roleId,
  assignedBy,
  30 // 30天后过期
);

// 延长有效期
userRole.extendExpiration(60);

// 检查有效性
const isValid = userRole.isValid();
const isExpired = userRole.isExpired();
```

---

## 📚 相关文档

- [领域层开发指南](./04-domain-layer-development.md)
- [应用层开发指南](./05-application-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)

---

**文档维护**: HL8 开发团队  
**最后更新**: 2025-01-27  
**版本**: 1.0.0
