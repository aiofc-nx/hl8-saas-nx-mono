# SAAS Core API 使用文档

> 完整的 API 使用指南和最佳实践

## 📋 目录

- [快速开始](#快速开始)
- [模块导入](#模块导入)
- [租户管理API](#租户管理api)
- [用户管理API](#用户管理api)
- [组织管理API](#组织管理api)
- [角色权限API](#角色权限api)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 🚀 快速开始

### 安装

```bash
pnpm add @hl8/saas-core
```

### 基础配置

在你的 NestJS 应用中导入 `SaasCoreModule`：

```typescript
import { Module } from '@nestjs/common';
import { SaasCoreModule } from '@hl8/saas-core';

@Module({
  imports: [
    SaasCoreModule.forRoot({
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'saas_platform',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '7d',
      },
    }),
  ],
})
export class AppModule {}
```

## 📦 模块导入

### 按需导入子模块

```typescript
import {
  // 租户模块
  TenantModule,
  TenantAggregate,
  TenantType,
  
  // 用户模块
  UserModule,
  UserAggregate,
  
  // 组织模块
  OrganizationModule,
  DepartmentModule,
  
  // 权限模块
  RoleModule,
  PermissionModule,
} from '@hl8/saas-core';
```

## 🏢 租户管理API

### 创建租户

```typescript
import { Injectable } from '@nestjs/common';
import {
  ITenantAggregateRepository,
  TenantAggregate,
  TenantCode,
  TenantDomain,
  TenantType,
  EntityId,
} from '@hl8/saas-core';

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: ITenantAggregateRepository,
  ) {}

  async createTenant(data: CreateTenantDto) {
    // 创建租户聚合根
    const tenant = TenantAggregate.create(
      EntityId.generate(),
      TenantCode.create(data.code),
      data.name,
      TenantDomain.create(data.domain),
      TenantType[data.type],
      { createdBy: data.createdBy },
    );

    // 持久化
    await this.tenantRepository.save(tenant);

    return tenant;
  }
}
```

### 查询租户

```typescript
async getTenant(id: string) {
  const entityId = EntityId.fromString(id);
  const tenant = await this.tenantRepository.findById(entityId);
  
  if (!tenant) {
    throw new NotFoundException('租户不存在');
  }
  
  return tenant;
}

async getTenantByCode(code: string) {
  const tenantCode = TenantCode.create(code);
  return await this.tenantRepository.findByCode(tenantCode);
}

async listTenants(offset = 0, limit = 20) {
  return await this.tenantRepository.findAll(offset, limit);
}
```

### 租户状态管理

```typescript
async activateTenant(id: string, operatorId: string) {
  const tenant = await this.getTenant(id);
  
  // 激活租户
  tenant.activate(operatorId);
  
  // 保存更改
  await this.tenantRepository.save(tenant);
  
  return tenant;
}

async suspendTenant(id: string, reason: string, operatorId: string) {
  const tenant = await this.getTenant(id);
  
  // 暂停租户
  tenant.suspend(reason, operatorId);
  
  await this.tenantRepository.save(tenant);
  
  return tenant;
}

async resumeTenant(id: string, operatorId: string) {
  const tenant = await this.getTenant(id);
  
  // 恢复租户
  tenant.resume(operatorId);
  
  await this.tenantRepository.save(tenant);
  
  return tenant;
}
```

### 租户升级

```typescript
async upgradeTenant(
  id: string,
  newType: TenantType,
  operatorId: string,
) {
  const tenant = await this.getTenant(id);
  
  // 升级租户类型
  tenant.upgrade(newType, operatorId);
  
  await this.tenantRepository.save(tenant);
  
  return tenant;
}

async downgradeTenant(
  id: string,
  newType: TenantType,
  operatorId: string,
) {
  const tenant = await this.getTenant(id);
  
  // 降级租户类型
  tenant.downgrade(newType, operatorId);
  
  await this.tenantRepository.save(tenant);
  
  return tenant;
}
```

## 👤 用户管理API

### 注册用户

```typescript
import {
  IUserAggregateRepository,
  UserAggregate,
  Username,
  Email,
  PhoneNumber,
  EntityId,
} from '@hl8/saas-core';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: IUserAggregateRepository,
  ) {}

  async registerUser(data: RegisterUserDto) {
    // 创建用户聚合根
    const user = UserAggregate.register(
      EntityId.generate(),
      Username.create(data.username),
      Email.create(data.email),
      PhoneNumber.create(data.phone),
      { createdBy: 'system' },
    );

    // 设置密码
    await user.setPassword(data.password);

    // 持久化
    await this.userRepository.save(user);

    return user;
  }
}
```

### 用户认证

```typescript
async login(username: string, password: string) {
  // 查找用户
  const user = await this.userRepository.findByUsername(
    Username.create(username)
  );

  if (!user) {
    throw new UnauthorizedException('用户名或密码错误');
  }

  // 验证密码
  const isValid = await user.verifyPassword(password);
  
  if (!isValid) {
    throw new UnauthorizedException('用户名或密码错误');
  }

  // 记录登录事件
  user.recordLogin();
  await this.userRepository.save(user);

  // 生成 JWT 令牌
  const token = this.jwtService.sign({
    sub: user.id.toString(),
    username: user.getUsername().value,
  });

  return { token };
}
```

### 用户信息管理

```typescript
async updateProfile(
  userId: string,
  data: UpdateProfileDto,
) {
  const user = await this.getUser(userId);

  // 更新个人信息
  user.updateProfile({
    realName: data.realName,
    nickname: data.nickname,
    avatar: data.avatar,
    bio: data.bio,
  }, userId);

  await this.userRepository.save(user);

  return user;
}

async changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
) {
  const user = await this.getUser(userId);

  // 验证旧密码
  const isValid = await user.verifyPassword(oldPassword);
  
  if (!isValid) {
    throw new BadRequestException('原密码错误');
  }

  // 设置新密码
  await user.setPassword(newPassword);
  
  await this.userRepository.save(user);
}
```

## 🏛️ 组织管理API

### 创建组织

```typescript
import {
  IOrganizationAggregateRepository,
  OrganizationAggregate,
  OrganizationType,
  EntityId,
} from '@hl8/saas-core';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly orgRepository: IOrganizationAggregateRepository,
  ) {}

  async createOrganization(data: CreateOrganizationDto) {
    const org = OrganizationAggregate.create(
      EntityId.generate(),
      data.name,
      OrganizationType.create(data.type),
      EntityId.fromString(data.tenantId),
      { createdBy: data.createdBy },
    );

    await this.orgRepository.save(org);

    return org;
  }
}
```

### 创建部门

```typescript
import {
  IDepartmentAggregateRepository,
  DepartmentAggregate,
  EntityId,
} from '@hl8/saas-core';

@Injectable()
export class DepartmentService {
  constructor(
    private readonly deptRepository: IDepartmentAggregateRepository,
  ) {}

  async createDepartment(data: CreateDepartmentDto) {
    const dept = DepartmentAggregate.create(
      EntityId.generate(),
      data.name,
      EntityId.fromString(data.organizationId),
      data.parentId ? EntityId.fromString(data.parentId) : undefined,
      { createdBy: data.createdBy },
    );

    await this.deptRepository.save(dept);

    return dept;
  }
}
```

### 部门层级查询

```typescript
async getDepartmentTree(organizationId: string) {
  const orgId = EntityId.fromString(organizationId);
  
  // 获取组织下的所有部门
  const departments = await this.deptRepository.findByOrganization(orgId);
  
  // 构建树形结构
  return this.buildDepartmentTree(departments);
}

private buildDepartmentTree(departments: DepartmentAggregate[]) {
  const map = new Map();
  const roots = [];

  departments.forEach(dept => {
    map.set(dept.id.toString(), { ...dept, children: [] });
  });

  departments.forEach(dept => {
    const node = map.get(dept.id.toString());
    const parentId = dept.getParentId()?.toString();
    
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
```

## 🔐 角色权限API

### 创建角色

```typescript
import {
  IRoleAggregateRepository,
  RoleAggregate,
  RoleName,
  RoleLevel,
  EntityId,
} from '@hl8/saas-core';

@Injectable()
export class RoleService {
  constructor(
    private readonly roleRepository: IRoleAggregateRepository,
  ) {}

  async createRole(data: CreateRoleDto) {
    const role = RoleAggregate.create(
      EntityId.generate(),
      RoleName.create(data.name),
      data.description,
      RoleLevel.create(data.level),
      EntityId.fromString(data.tenantId),
      { createdBy: data.createdBy },
    );

    await this.roleRepository.save(role);

    return role;
  }
}
```

### 权限验证

```typescript
import { Ability, AbilityBuilder } from '@casl/ability';

@Injectable()
export class PermissionService {
  buildAbility(user: UserAggregate, roles: RoleAggregate[]) {
    const { can, cannot, build } = new AbilityBuilder(Ability);

    // 基于角色构建权限
    roles.forEach(role => {
      role.getPermissions().forEach(permission => {
        can(
          permission.getAction().value,
          permission.getResource(),
        );
      });
    });

    return build();
  }

  async checkPermission(
    userId: string,
    action: string,
    resource: string,
  ): Promise<boolean> {
    // 获取用户和角色
    const user = await this.userRepository.findById(
      EntityId.fromString(userId)
    );
    const roles = await this.getUserRoles(userId);

    // 构建 Ability
    const ability = this.buildAbility(user, roles);

    // 检查权限
    return ability.can(action, resource);
  }
}
```

## 🎯 最佳实践

### 1. 使用值对象进行验证

```typescript
// ✅ 好的做法：使用值对象
const code = TenantCode.create('mycompany'); // 自动验证格式

// ❌ 不好的做法：直接使用字符串
const code = 'mycompany'; // 没有验证
```

### 2. 使用聚合根管理业务逻辑

```typescript
// ✅ 好的做法：通过聚合根方法
tenant.activate(operatorId);

// ❌ 不好的做法：直接修改状态
tenant.status = TenantStatus.ACTIVE; // 绕过业务规则
```

### 3. 使用仓储进行持久化

```typescript
// ✅ 好的做法：使用仓储
await this.tenantRepository.save(tenant);

// ❌ 不好的做法：直接使用 ORM
await this.em.persistAndFlush(tenantOrmEntity);
```

### 4. 处理领域事件

```typescript
@Injectable()
export class TenantCreatedHandler {
  @EventHandler(TenantCreatedEvent)
  async handle(event: TenantCreatedEvent) {
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.tenantId);
    
    // 初始化默认配置
    await this.setupDefaultConfiguration(event.tenantId);
  }
}
```

### 5. 使用事务

```typescript
async createTenantWithAdmin(data: CreateTenantWithAdminDto) {
  return await this.em.transactional(async (em) => {
    // 创建租户
    const tenant = TenantAggregate.create(...);
    await this.tenantRepository.save(tenant);

    // 创建管理员
    const admin = UserAggregate.register(...);
    await this.userRepository.save(admin);

    // 关联租户和管理员
    tenant.addAdministrator(admin.id);
    await this.tenantRepository.save(tenant);

    return { tenant, admin };
  });
}
```

## ❓ 常见问题

### Q: 如何实现多租户数据隔离？

A: 使用 `@TenantContext` 装饰器自动注入租户上下文：

```typescript
@Controller('api/data')
@TenantContext()
export class DataController {
  @Get()
  async getData(@CurrentTenant() tenantId: string) {
    // 自动过滤当前租户的数据
    return await this.dataService.find();
  }
}
```

### Q: 如何处理租户配额限制？

A: 在业务操作前检查配额：

```typescript
async createUser(tenantId: string, data: CreateUserDto) {
  const tenant = await this.tenantRepository.findById(tenantId);
  
  // 检查用户数配额
  const currentUserCount = await this.userRepository.countByTenant(tenantId);
  if (currentUserCount >= tenant.getQuota().maxUsers) {
    throw new BadRequestException('已达到用户数量限制');
  }

  // 创建用户
  const user = UserAggregate.register(...);
  await this.userRepository.save(user);
}
```

### Q: 如何实现细粒度权限控制？

A: 使用 CASL Ability 和守卫：

```typescript
@Controller('api/users')
export class UserController {
  @Get(':id')
  @CheckAbility({ action: 'read', subject: 'User' })
  async getUser(@Param('id') id: string) {
    return await this.userService.getUser(id);
  }

  @Put(':id')
  @CheckAbility({ action: 'update', subject: 'User' })
  async updateUser(
    @Param('id') id: string,
    @Body() data: UpdateUserDto,
  ) {
    return await this.userService.updateUser(id, data);
  }
}
```

### Q: 如何测试业务逻辑？

A: 使用单元测试测试聚合根，使用集成测试测试仓储：

```typescript
describe('TenantAggregate', () => {
  it('should activate tenant', () => {
    const tenant = TenantAggregate.create(...);
    
    tenant.activate('admin');
    
    expect(tenant.getStatus()).toBe(TenantStatus.ACTIVE);
    expect(tenant.getActivatedAt()).toBeDefined();
  });
});
```

详细测试指南请查看：[测试文档](../__tests__/README.md)

## 📖 更多资源

- [项目 README](../README.md)
- [MikroORM 与 CASL 集成](./mikroorm-casl-integration.md)
- [数据库集成测试指南](../__tests__/README.md)
- [架构设计文档](./architecture.md)

## 🤝 获取帮助

如果你遇到问题或需要帮助：

1. 查看[常见问题](#常见问题)
2. 搜索[Issues](https://github.com/your-org/hl8-saas-nx-mono/issues)
3. 创建新的 [Issue](https://github.com/your-org/hl8-saas-nx-mono/issues/new)
4. 加入我们的[社区讨论](https://github.com/your-org/hl8-saas-nx-mono/discussions)

---

**Happy Coding! 🚀**
