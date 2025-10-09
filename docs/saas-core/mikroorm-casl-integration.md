# MikroORM 与 CASL 集成指南

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 概述

本文档说明如何在 SAAS-CORE 模块中正确集成 MikroORM 与 CASL 权限系统。

---

## 🎯 集成方案

### 1. 依赖配置

**正确的依赖配置**：

```json
{
  "dependencies": {
    "@casl/ability": "^6.0.0",
    "@mikro-orm/core": "^6.0.0",
    "@mikro-orm/nestjs": "^6.0.0",
    "@mikro-orm/postgresql": "^6.0.0"
  }
}
```

**❌ 错误的依赖**：

- `@casl/prisma` - 项目使用 MikroORM，不需要 Prisma 集成

### 2. CASL 与 MikroORM 集成方式

#### 2.1 自定义适配器

由于 CASL 没有官方的 MikroORM 适配器，我们需要创建自定义适配器：

```typescript
import { AbilityBuilder, Ability, AbilityClass, ExtractSubjectType, InferSubjects } from '@casl/ability';
import { EntityManager } from '@mikro-orm/core';
import { Injectable } from '@nestjs/common';

type Actions = 'create' | 'read' | 'update' | 'delete' | 'manage';
type Subjects = InferSubjects<typeof User | typeof Organization | typeof Department> | 'all';

export type AppAbility = Ability<[Actions, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  constructor(private readonly em: EntityManager) {}

  async createForUser(userId: string, tenantId: string): Promise<AppAbility> {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability as AbilityClass<AppAbility>);

    // 从 MikroORM 获取用户角色和权限
    const userRoles = await this.em.find(UserRole, { userId, tenantId });
    
    for (const userRole of userRoles) {
      const role = await this.em.findOne(Role, { id: userRole.roleId });
      if (role && role.isActive()) {
        const permissions = role.getAllPermissions();
        
        for (const permission of permissions) {
          if (permission.isActive()) {
            can(permission.getActionType(), permission.getResourceType());
          }
        }
      }
    }

    return build({
      detectSubjectType: (item) => item.constructor as ExtractSubjectType<Subjects>
    });
  }
}
```

#### 2.2 权限守卫

```typescript
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from './casl-ability.factory';
import { AppAbility } from './casl-ability.factory';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rules = this.reflector.get<RequiredPermission[]>(
      'permissions',
      context.getHandler()
    ) || [];

    if (!rules.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    const ability = await this.caslAbilityFactory.createForUser(user.id, tenantId);

    return rules.every((rule) => ability.can(rule.action, rule.subject));
  }
}
```

#### 2.3 权限装饰器

```typescript
import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  action: string;
  subject: string;
}

export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata('permissions', permissions);
```

### 3. 使用示例

#### 3.1 控制器中使用权限

```typescript
@Controller('organizations')
@UseGuards(AuthGuard, PermissionsGuard)
export class OrganizationController {
  @Get()
  @RequirePermissions({ action: 'read', subject: 'organization' })
  async findAll(@Headers('x-tenant-id') tenantId: string) {
    // 实现逻辑
  }

  @Post()
  @RequirePermissions({ action: 'create', subject: 'organization' })
  async create(@Body() createOrgDto: CreateOrganizationDto) {
    // 实现逻辑
  }
}
```

#### 3.2 服务中使用权限

```typescript
@Injectable()
export class OrganizationService {
  constructor(
    private readonly em: EntityManager,
    private readonly caslAbilityFactory: CaslAbilityFactory
  ) {}

  async findUserOrganizations(userId: string, tenantId: string) {
    const ability = await this.caslAbilityFactory.createForUser(userId, tenantId);
    
    // 基于权限过滤组织
    const organizations = await this.em.find(Organization, { tenantId });
    
    return organizations.filter(org => 
      ability.can('read', org)
    );
  }
}
```

---

## 🔧 配置步骤

### 1. 安装依赖

```bash
pnpm add @casl/ability
```

### 2. 创建 CASL 模块

```typescript
import { Module } from '@nestjs/common';
import { CaslAbilityFactory } from './casl-ability.factory';
import { PermissionsGuard } from './permissions.guard';

@Module({
  providers: [CaslAbilityFactory, PermissionsGuard],
  exports: [CaslAbilityFactory, PermissionsGuard],
})
export class CaslModule {}
```

### 3. 在主模块中导入

```typescript
import { Module } from '@nestjs/common';
import { CaslModule } from './casl/casl.module';

@Module({
  imports: [CaslModule],
  // ...
})
export class SaasCoreModule {}
```

---

## 📝 最佳实践

### 1. 权限缓存

```typescript
@Injectable()
export class CaslAbilityFactory {
  private readonly cache = new Map<string, AppAbility>();

  async createForUser(userId: string, tenantId: string): Promise<AppAbility> {
    const cacheKey = `${userId}:${tenantId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const ability = await this.buildAbility(userId, tenantId);
    this.cache.set(cacheKey, ability);
    
    return ability;
  }
}
```

### 2. 权限失效处理

```typescript
@Injectable()
export class PermissionCacheService {
  private readonly cache = new Map<string, AppAbility>();

  invalidateUserPermissions(userId: string, tenantId: string): void {
    const cacheKey = `${userId}:${tenantId}`;
    this.cache.delete(cacheKey);
  }

  invalidateRolePermissions(roleId: string): void {
    // 清除所有使用该角色的用户权限缓存
    for (const [key] of this.cache) {
      if (key.includes(roleId)) {
        this.cache.delete(key);
      }
    }
  }
}
```

### 3. 权限日志

```typescript
@Injectable()
export class PermissionAuditService {
  async logPermissionCheck(
    userId: string,
    action: string,
    subject: string,
    result: boolean
  ): Promise<void> {
    // 记录权限检查日志
    console.log(`Permission check: ${userId} ${action} ${subject} = ${result}`);
  }
}
```

---

## ⚠️ 注意事项

1. **性能考虑**：权限检查可能涉及数据库查询，建议使用缓存
2. **权限更新**：当角色或权限变更时，需要清除相关缓存
3. **多租户隔离**：确保权限检查包含租户上下文
4. **异常处理**：权限检查失败时提供清晰的错误信息

---

## 🔗 相关文档

- [CASL 官方文档](https://casl.js.org/)
- [MikroORM 官方文档](https://mikro-orm.io/)
- [NestJS 守卫文档](https://docs.nestjs.com/guards)

---

**文档维护**: HL8 开发团队  
**最后更新**: 2025-01-27  
**版本**: 1.0.0
