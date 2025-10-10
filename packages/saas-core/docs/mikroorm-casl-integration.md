# MikroORM 与 CASL 集成指南

> 在 SAAS Core 中集成 MikroORM 和 CASL 实现多租户数据隔离和细粒度权限控制

## 📋 目录

- [概述](#概述)
- [多租户数据隔离](#多租户数据隔离)
- [权限控制集成](#权限控制集成)
- [过滤器实现](#过滤器实现)
- [最佳实践](#最佳实践)
- [常见场景](#常见场景)

## 🎯 概述

本文档介绍如何在 SAAS Core 模块中集成 MikroORM 和 CASL，实现：

- **多租户数据隔离** - 使用 MikroORM 过滤器自动隔离租户数据
- **细粒度权限控制** - 使用 CASL 实现基于角色的访问控制
- **无缝集成** - 两者协同工作，提供完整的安全保障

## 🏢 多租户数据隔离

### 租户过滤器实现

MikroORM 提供了强大的过滤器机制，可以自动在所有查询中注入租户条件。

#### 1. 定义租户过滤器

```typescript
// src/infrastructure/persistence/filters/tenant.filter.ts

import { Filter, EntityManager } from '@mikro-orm/core';

export class TenantFilter implements Filter {
  /**
   * 过滤器名称
   */
  static readonly FILTER_NAME = 'tenant';

  /**
   * 当前租户 ID（从上下文获取）
   */
  private tenantId: string | null = null;

  /**
   * 设置当前租户 ID
   */
  setTenantId(tenantId: string | null) {
    this.tenantId = tenantId;
  }

  /**
   * 获取过滤条件
   */
  getCondition() {
    if (!this.tenantId) {
      throw new Error('租户上下文未设置');
    }

    return {
      tenantId: this.tenantId,
    };
  }

  /**
   * 是否启用过滤器
   */
  isEnabled() {
    return this.tenantId !== null;
  }
}
```

#### 2. 注册过滤器

```typescript
// src/saas-core.module.ts

import { Module, OnModuleInit } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { TenantFilter } from './infrastructure/persistence/filters/tenant.filter';

@Module({
  // ...
})
export class SaasCoreModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  async onModuleInit() {
    // 注册租户过滤器
    this.orm.config.get('filters').tenant = TenantFilter;
    
    // 默认启用过滤器
    this.orm.em.setFilterParams('tenant', { tenantId: null });
  }
}
```

#### 3. 在请求中注入租户上下文

```typescript
// src/interface/interceptors/tenant-context.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';

@Injectable()
export class TenantContextInterceptor implements NestInterceptor {
  constructor(private readonly em: EntityManager) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = this.extractTenantId(request);

    if (tenantId) {
      // 为当前请求设置租户过滤器
      this.em.setFilterParams('tenant', { tenantId });
    }

    return next.handle();
  }

  private extractTenantId(request: any): string | null {
    // 从 JWT 令牌中提取租户 ID
    return request.user?.tenantId || null;
  }
}
```

### 应用租户过滤器

有了租户过滤器，所有查询都会自动过滤租户数据：

```typescript
// 自动过滤当前租户的数据
const users = await this.em.find(UserOrmEntity, {});

// 临时禁用过滤器（需要跨租户查询时）
const allUsers = await this.em.find(
  UserOrmEntity,
  {},
  { filters: { tenant: false } }
);
```

## 🔐 权限控制集成

### CASL Ability 定义

#### 1. 定义能力（Ability）

```typescript
// src/application/authorization/ability.factory.ts

import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';

export type Action = 'manage' | 'create' | 'read' | 'update' | 'delete';
export type Subject = 'User' | 'Tenant' | 'Organization' | 'Department' | 'all';

export type AppAbility = Ability<[Action, Subject]>;

@Injectable()
export class AbilityFactory {
  createForUser(user: UserAggregate, roles: RoleAggregate[]) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>
    );

    // 超级管理员拥有所有权限
    if (user.isSuperAdmin()) {
      can('manage', 'all');
      return build();
    }

    // 基于角色构建权限
    roles.forEach(role => {
      role.getPermissions().forEach(permission => {
        can(
          permission.getAction().value as Action,
          permission.getResource() as Subject,
        );
      });
    });

    // 用户始终可以读取和更新自己的信息
    can('read', 'User', { id: user.id.toString() });
    can('update', 'User', { id: user.id.toString() });

    return build();
  }
}
```

#### 2. 创建权限守卫

```typescript
// src/interface/guards/ability.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AbilityFactory } from '../../application/authorization/ability.factory';

export interface RequiredAbility {
  action: Action;
  subject: Subject;
}

@Injectable()
export class AbilityGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private abilityFactory: AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAbility = this.reflector.get<RequiredAbility>(
      'ability',
      context.getHandler(),
    );

    if (!requiredAbility) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // 获取用户角色
    const roles = await this.getRoles(user.id);

    // 构建用户能力
    const ability = this.abilityFactory.createForUser(user, roles);

    // 检查权限
    const allowed = ability.can(
      requiredAbility.action,
      requiredAbility.subject,
    );

    if (!allowed) {
      throw new ForbiddenException('权限不足');
    }

    return true;
  }
}
```

#### 3. 使用装饰器

```typescript
// src/interface/decorators/check-ability.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { RequiredAbility } from '../guards/ability.guard';

export const CheckAbility = (ability: RequiredAbility) =>
  SetMetadata('ability', ability);
```

### 在控制器中使用

```typescript
@Controller('api/users')
@UseGuards(JwtAuthGuard, AbilityGuard)
export class UserController {
  @Get()
  @CheckAbility({ action: 'read', subject: 'User' })
  async listUsers() {
    // 自动检查权限和租户隔离
    return await this.userService.findAll();
  }

  @Post()
  @CheckAbility({ action: 'create', subject: 'User' })
  async createUser(@Body() data: CreateUserDto) {
    return await this.userService.create(data);
  }

  @Delete(':id')
  @CheckAbility({ action: 'delete', subject: 'User' })
  async deleteUser(@Param('id') id: string) {
    return await this.userService.delete(id);
  }
}
```

## 🔍 过滤器实现

### 软删除过滤器

```typescript
// src/infrastructure/persistence/filters/soft-delete.filter.ts

export class SoftDeleteFilter implements Filter {
  static readonly FILTER_NAME = 'softDelete';

  getCondition() {
    return {
      deletedAt: null,
    };
  }

  isEnabled() {
    return true;
  }
}
```

### 状态过滤器

```typescript
// src/infrastructure/persistence/filters/active-only.filter.ts

export class ActiveOnlyFilter implements Filter {
  static readonly FILTER_NAME = 'activeOnly';

  getCondition() {
    return {
      status: 'ACTIVE',
    };
  }

  isEnabled() {
    return true;
  }
}
```

### 组合使用多个过滤器

```typescript
// 同时应用租户和软删除过滤器
const users = await this.em.find(
  UserOrmEntity,
  {},
  {
    filters: {
      tenant: true,      // 租户隔离
      softDelete: true,  // 排除已删除
    },
  }
);

// 仅应用租户过滤器
const allUsersIncludingDeleted = await this.em.find(
  UserOrmEntity,
  {},
  {
    filters: {
      tenant: true,
      softDelete: false,
    },
  }
);

// 禁用所有过滤器（超级管理员操作）
const allData = await this.em.find(
  UserOrmEntity,
  {},
  {
    filters: false,
  }
);
```

## 🎯 最佳实践

### 1. 租户上下文管理

```typescript
// ✅ 好的做法：使用拦截器自动注入
@Controller('api/data')
@UseInterceptors(TenantContextInterceptor)
export class DataController {
  // 自动应用租户过滤器
}

// ❌ 不好的做法：手动在每个方法中检查
@Get()
async getData(@CurrentUser() user: User) {
  return await this.em.find(Data, { tenantId: user.tenantId });
}
```

### 2. 权限检查时机

```typescript
// ✅ 好的做法：在控制器层面检查
@Post()
@CheckAbility({ action: 'create', subject: 'User' })
async createUser(@Body() data: CreateUserDto) {
  return await this.userService.create(data);
}

// ⚠️ 可选：在服务层面双重检查
async createUser(data: CreateUserDto, currentUser: User) {
  // 业务层额外检查
  if (!this.canCreateUser(currentUser)) {
    throw new ForbiddenException();
  }
  
  // 创建用户
}
```

### 3. 跨租户操作

```typescript
// 平台管理员需要跨租户操作时
async getAllTenants() {
  // 临时禁用租户过滤器
  return await this.em.find(
    TenantOrmEntity,
    {},
    { filters: { tenant: false } }
  );
}
```

### 4. 细粒度权限控制

```typescript
// 基于资源属性的权限控制
const ability = this.abilityFactory.createForUser(user, roles);

// 检查是否可以更新特定用户
if (ability.can('update', subject('User', { id: targetUserId }))) {
  // 允许更新
}

// 检查是否可以删除自己部门的数据
if (ability.can('delete', subject('Department', { id: deptId }))) {
  // 允许删除
}
```

## 🔧 高级用法

### 动态权限规则

```typescript
@Injectable()
export class DynamicAbilityFactory {
  createForUser(user: UserAggregate, roles: RoleAggregate[]) {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>
    );

    // 部门经理可以管理自己部门的数据
    if (user.hasRole('department-manager')) {
      const deptIds = user.getManagedDepartmentIds();
      
      can('manage', 'User', { departmentId: { $in: deptIds } });
      can('read', 'Department', { id: { $in: deptIds } });
    }

    // 租户管理员可以管理租户内所有数据
    if (user.hasRole('tenant-admin')) {
      can('manage', 'User');
      can('manage', 'Organization');
      can('manage', 'Department');
    }

    // 平台管理员拥有所有权限
    if (user.isPlatformAdmin()) {
      can('manage', 'all');
    }

    return build();
  }
}
```

### 条件权限查询

```typescript
// 结合 CASL 和 MikroORM 实现条件查询
@Injectable()
export class SecureUserService {
  async findUsers(currentUser: User, filters: any) {
    const ability = this.abilityFactory.createForUser(currentUser);

    // 获取用户可以访问的条件
    const conditions = ability.rulesFor('read', 'User');

    // 合并到查询条件
    const queryConditions = {
      ...filters,
      ...this.convertAbilityToQuery(conditions),
    };

    return await this.em.find(UserOrmEntity, queryConditions);
  }

  private convertAbilityToQuery(rules: any) {
    // 将 CASL 规则转换为 MikroORM 查询条件
    // 例如：{ departmentId: { $in: ['dept1', 'dept2'] } }
  }
}
```

## 🛡️ 安全检查清单

### 数据访问安全

- ✅ 所有查询都应用租户过滤器
- ✅ 跨租户操作需要显式禁用过滤器
- ✅ 软删除数据默认被过滤
- ✅ 敏感数据自动脱敏

### 权限控制安全

- ✅ 所有写操作都检查权限
- ✅ 读操作根据敏感度检查权限
- ✅ 超级管理员操作有审计日志
- ✅ 权限变更立即生效

### 审计和追踪

- ✅ 所有数据变更记录操作人
- ✅ 敏感操作记录完整上下文
- ✅ 跨租户操作特别标记
- ✅ 权限检查失败记录日志

## 📝 常见场景

### 场景 1：租户管理员查看本租户用户

```typescript
@Get('users')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility({ action: 'read', subject: 'User' })
async getUsers(@CurrentTenant() tenantId: string) {
  // 租户过滤器自动应用，只返回当前租户的用户
  return await this.em.find(UserOrmEntity, {});
}
```

### 场景 2：部门经理管理本部门成员

```typescript
@Put('users/:id')
@UseGuards(JwtAuthGuard, AbilityGuard)
async updateUser(
  @Param('id') userId: string,
  @Body() data: UpdateUserDto,
  @CurrentUser() currentUser: User,
) {
  // 获取目标用户
  const user = await this.userRepository.findById(
    EntityId.fromString(userId)
  );

  // 构建能力
  const ability = this.abilityFactory.createForUser(currentUser);

  // 检查是否可以更新该用户（基于部门）
  if (!ability.can('update', subject('User', {
    departmentId: user.getDepartmentId()?.toString(),
  }))) {
    throw new ForbiddenException('无权修改该用户');
  }

  // 执行更新
  user.updateProfile(data, currentUser.id.toString());
  await this.userRepository.save(user);
}
```

### 场景 3：平台管理员跨租户操作

```typescript
@Get('admin/all-tenants')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
async getAllTenants(@CurrentUser() admin: User) {
  // 验证平台管理员权限
  if (!admin.isPlatformAdmin()) {
    throw new ForbiddenException('需要平台管理员权限');
  }

  // 禁用租户过滤器
  const tenants = await this.em.find(
    TenantOrmEntity,
    {},
    { filters: { tenant: false } }
  );

  // 记录审计日志
  await this.auditService.log({
    action: 'CROSS_TENANT_QUERY',
    operator: admin.id.toString(),
    resource: 'Tenant',
    timestamp: new Date(),
  });

  return tenants;
}
```

### 场景 4：条件权限（基于资源所有者）

```typescript
// 用户只能编辑自己创建的文档
@Injectable()
export class DocumentAbilityFactory {
  createForUser(user: UserAggregate) {
    const { can, build } = new AbilityBuilder<AppAbility>(
      Ability as AbilityClass<AppAbility>
    );

    // 用户可以读取所有文档
    can('read', 'Document');

    // 用户可以创建文档
    can('create', 'Document');

    // 用户可以编辑和删除自己创建的文档
    can('update', 'Document', { createdBy: user.id.toString() });
    can('delete', 'Document', { createdBy: user.id.toString() });

    return build();
  }
}
```

## ⚡ 性能优化

### 1. 过滤器缓存

```typescript
// 在 Redis 中缓存租户配置
@Injectable()
export class CachedTenantFilter {
  constructor(
    private readonly redis: RedisService,
  ) {}

  async getTenantConfig(tenantId: string) {
    // 先从缓存获取
    const cached = await this.redis.get(`tenant:${tenantId}:config`);
    
    if (cached) {
      return JSON.parse(cached);
    }

    // 缓存未命中，从数据库查询
    const config = await this.em.findOne(TenantConfigOrmEntity, {
      tenantId,
    });

    // 存入缓存
    await this.redis.set(
      `tenant:${tenantId}:config`,
      JSON.stringify(config),
      'EX',
      3600, // 1小时过期
    );

    return config;
  }
}
```

### 2. 权限缓存

```typescript
@Injectable()
export class CachedAbilityFactory {
  async createForUser(userId: string) {
    // 缓存用户权限
    const cacheKey = `ability:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return deserializeAbility(cached);
    }

    // 构建权限
    const user = await this.userRepository.findById(userId);
    const roles = await this.roleRepository.findByUserId(userId);
    const ability = this.buildAbility(user, roles);

    // 缓存
    await this.redis.set(cacheKey, serializeAbility(ability), 'EX', 300);

    return ability;
  }
}
```

### 3. 索引优化

确保在租户和状态字段上创建索引：

```typescript
@Entity({ tableName: 'users' })
export class UserOrmEntity {
  @Property({ type: 'uuid' })
  @Index() // ← 租户过滤器索引
  tenantId!: string;

  @Property({ type: 'varchar' })
  @Index() // ← 状态过滤器索引
  status!: string;

  @Property({ type: 'uuid', nullable: true })
  @Index() // ← 部门权限索引
  departmentId?: string;
}
```

## 🐛 故障排查

### 问题：租户过滤器未生效

**症状**：查询返回了其他租户的数据

**解决方案**：

1. 检查过滤器是否已注册
2. 确认租户上下文已设置
3. 检查是否显式禁用了过滤器

```typescript
// 调试代码
console.log('Filters:', this.em.config.get('filters'));
console.log('Tenant ID:', this.em.getFilterParams('tenant'));
```

### 问题：权限检查不生效

**症状**：用户可以访问不应访问的资源

**解决方案**：

1. 检查守卫是否正确应用
2. 验证角色和权限配置
3. 检查 Ability 构建逻辑

```typescript
// 调试权限
const ability = this.abilityFactory.createForUser(user, roles);
console.log('Can read User?', ability.can('read', 'User'));
console.log('Rules:', ability.rules);
```

### 问题：性能问题

**症状**：查询很慢

**解决方案**：

1. 检查是否有 N+1 查询问题
2. 确保关键字段有索引
3. 使用 `populate` 预加载关联数据

```typescript
// 启用查询日志
debug: true,
logger: (message) => console.log('[SQL]', message),
```

## 📚 参考资料

- [MikroORM 过滤器文档](https://mikro-orm.io/docs/filters)
- [CASL 文档](https://casl.js.org/v6/en/)
- [NestJS 守卫文档](https://docs.nestjs.com/guards)
- [项目架构设计](./architecture.md)

## 🎓 学习资源

- [多租户架构最佳实践](https://www.example.com/multi-tenancy)
- [DDD 与 CQRS](https://www.example.com/ddd-cqrs)
- [事件溯源指南](https://www.example.com/event-sourcing)

---

**最后更新**: 2025-10-10  
**维护者**: SAAS Core Team
