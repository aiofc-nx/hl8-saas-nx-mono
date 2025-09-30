# 多租户模块最终设计方案

## 🎯 架构分离原则

基于Clean Architecture和职责分离原则，将多租户功能分为两个独立但协作的模块：

### 1. **基础设施层** - `@hl8/multi-tenancy`

- **职责**：技术性、架构性的多租户基础设施
- **特点**：纯技术实现，无业务逻辑，高度可复用
- **依赖**：只依赖基础框架模块（logger、config、utils、common等）
- **目标**：为整个平台提供统一的多租户技术支撑

### 2. **业务逻辑层** - `@hl8/tenant`

- **职责**：业务规则、业务逻辑的租户管理
- **特点**：包含具体业务实现，面向具体业务场景
- **依赖**：依赖基础设施层 + 业务模块（database、cache、messaging等）
- **目标**：提供完整的租户管理业务功能

## 📋 详细模块设计

### 🏗️ `@hl8/multi-tenancy` - 多租户基础设施模块

#### 核心职责

- **多层级上下文管理**：基于nestjs-cls的透明上下文传递，支持租户、组织、部门、用户四级隔离
- **多层级隔离框架**：提供从行级到数据库级的数据隔离技术框架
- **租户中间件系统**：请求级别的租户识别和验证
- **租户装饰器系统**：声明式的租户功能注入
- **租户守卫系统**：安全级别的租户访问控制
- **租户拦截器系统**：横切关注点的租户处理

#### 模块结构

```
packages/multi-tenancy/
├── src/
│   ├── lib/
│   │   ├── multi-tenancy.module.ts          # 基础设施模块
│   │   ├── services/                        # 核心服务
│   │   │   ├── tenant-context.service.ts    # 租户上下文服务
│   │   │   ├── tenant-middleware.service.ts # 租户中间件服务
│   │   │   ├── tenant-isolation.service.ts  # 租户隔离服务
│   │   │   ├── multi-level-isolation.service.ts # 多层级隔离服务
│   │   │   └── tenant-security.service.ts   # 租户安全服务
│   │   ├── middleware/                      # 中间件
│   │   │   ├── tenant.middleware.ts         # 租户识别中间件
│   │   │   ├── tenant-context.middleware.ts # 上下文中间件
│   │   │   └── tenant-validation.middleware.ts # 验证中间件
│   │   ├── decorators/                      # 装饰器
│   │   │   ├── tenant-aware.decorator.ts    # 租户感知装饰器
│   │   │   ├── tenant-isolation.decorator.ts # 租户隔离装饰器
│   │   │   └── tenant-context.decorator.ts  # 租户上下文装饰器
│   │   ├── guards/                          # 守卫
│   │   │   ├── tenant.guard.ts              # 租户守卫
│   │   │   ├── tenant-context.guard.ts      # 租户上下文守卫
│   │   │   └── tenant-permission.guard.ts   # 租户权限守卫
│   │   ├── interceptors/                    # 拦截器
│   │   │   ├── tenant-context.interceptor.ts # 上下文拦截器
│   │   │   ├── tenant-isolation.interceptor.ts # 隔离拦截器
│   │   │   └── tenant-audit.interceptor.ts  # 审计拦截器
│   │   ├── types/                           # 类型定义
│   │   │   ├── tenant-core.types.ts         # 核心类型
│   │   │   ├── context.types.ts             # 上下文类型
│   │   │   ├── isolation.types.ts           # 隔离类型
│   │   │   ├── multi-level.types.ts         # 多层级类型
│   │   │   └── security.types.ts            # 安全类型
│   │   ├── strategies/                      # 策略接口
│   │   │   ├── isolation-strategy.interface.ts # 隔离策略接口
│   │   │   ├── multi-level-isolation-strategy.interface.ts # 多层级隔离策略接口
│   │   │   ├── context-strategy.interface.ts # 上下文策略接口
│   │   │   └── security-strategy.interface.ts # 安全策略接口
│   │   ├── utils/                           # 工具函数
│   │   │   ├── tenant-key.util.ts           # 租户键工具
│   │   │   ├── tenant-validator.util.ts     # 租户验证工具
│   │   │   └── tenant-context.util.ts       # 租户上下文工具
│   │   └── constants/                       # 常量定义
│   │       ├── tenant.constants.ts          # 租户常量
│   │       └── context.constants.ts         # 上下文常量
│   ├── examples/                            # 使用示例
│   └── index.ts                             # 模块入口
```

#### 核心接口定义

```typescript
// 租户上下文接口
export interface ITenantContext {
  tenantId: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

// 多层级上下文接口
export interface IMultiLevelContext {
  tenantId: string;
  organizationId?: string;
  departmentId?: string;
  userId?: string;
  isolationLevel: 'tenant' | 'organization' | 'department' | 'user';
  metadata?: Record<string, any>;
  timestamp: Date;
}

// 层级路径接口
export interface IHierarchyPath {
  tenantId: string;
  organizationId?: string;
  departmentId?: string;
  userId?: string;
  path: string[];
  permissions: string[];
}

// 租户隔离策略接口
export interface ITenantIsolationStrategy {
  getTenantKey(key: string, tenantId: string): string;
  getTenantNamespace(tenantId: string): string;
  isolateData(data: any, tenantId: string): any;
  extractTenantData(data: any, tenantId: string): any;
  shouldIsolate(tenantId: string): boolean;
}

// 多层级隔离策略接口
export interface IMultiLevelIsolationStrategy {
  getIsolationKey(key: string, context: IMultiLevelContext): Promise<string>;
  getIsolationNamespace(context: IMultiLevelContext): Promise<string>;
  isolateData(data: any, context: IMultiLevelContext): Promise<any>;
  extractData(data: any, context: IMultiLevelContext): Promise<any>;
  shouldIsolateAtLevel(context: IMultiLevelContext): Promise<boolean>;
  validateHierarchy(context: IMultiLevelContext): Promise<boolean>;
}

// 租户验证策略接口
export interface ITenantValidationStrategy {
  validateTenant(tenantId: string): Promise<boolean>;
  getTenantInfo(tenantId: string): Promise<ITenantInfo>;
  validateTenantAccess(tenantId: string, userId: string): Promise<boolean>;
}

// 租户上下文策略接口
export interface ITenantContextStrategy {
  extractTenantId(request: any): string | null;
  extractUserId(request: any): string | null;
  extractRequestId(request: any): string | null;
  validateContext(context: ITenantContext): Promise<boolean>;
}

// 租户安全策略接口
export interface ITenantSecurityStrategy {
  checkTenantPermission(tenantId: string, permission: string): Promise<boolean>;
  checkCrossTenantAccess(sourceTenant: string, targetTenant: string): Promise<boolean>;
  auditTenantAction(action: ITenantAction): Promise<void>;
}
```

### 🏢 `@hl8/tenant` - 租户业务模块

#### 核心职责

- **租户生命周期管理**：创建、激活、暂停、删除租户
- **多层级关系管理**：组织、部门、用户的层级关系管理
- **租户配置管理**：租户级别的配置和个性化设置
- **多层级权限管理**：支持租户、组织、部门、用户四级权限控制
- **租户审计日志**：完整的租户操作审计追踪
- **租户状态管理**：租户状态流转和监控
- **租户类型管理**：企业、社群、团队、个人租户类型

#### 模块结构

```
packages/tenant/
├── src/
│   ├── lib/
│   │   ├── tenant.module.ts                 # 租户业务模块
│   │   ├── services/                        # 业务服务
│   │   │   ├── tenant.service.ts            # 租户管理服务
│   │   │   ├── tenant-config.service.ts     # 租户配置服务
│   │   │   ├── tenant-permission.service.ts # 租户权限服务
│   │   │   ├── tenant-audit.service.ts      # 租户审计服务
│   │   │   ├── tenant-status.service.ts     # 租户状态服务
│   │   │   ├── tenant-type.service.ts       # 租户类型服务
│   │   │   ├── tenant-hierarchy.service.ts  # 租户层级关系服务
│   │   │   └── multi-level-data.service.ts  # 多层级数据服务
│   │   ├── controllers/                     # 控制器
│   │   │   ├── tenant.controller.ts         # 租户控制器
│   │   │   ├── tenant-config.controller.ts  # 租户配置控制器
│   │   │   └── tenant-permission.controller.ts # 租户权限控制器
│   │   ├── entities/                        # 实体
│   │   │   ├── tenant.entity.ts             # 租户实体
│   │   │   ├── tenant-config.entity.ts      # 租户配置实体
│   │   │   ├── tenant-permission.entity.ts  # 租户权限实体
│   │   │   ├── tenant-audit.entity.ts       # 租户审计实体
│   │   │   ├── organization.entity.ts       # 组织实体
│   │   │   └── department.entity.ts         # 部门实体
│   │   ├── dto/                             # 数据传输对象
│   │   │   ├── create-tenant.dto.ts         # 创建租户DTO
│   │   │   ├── update-tenant.dto.ts         # 更新租户DTO
│   │   │   ├── tenant-config.dto.ts         # 租户配置DTO
│   │   │   └── tenant-permission.dto.ts     # 租户权限DTO
│   │   ├── strategies/                      # 业务策略实现
│   │   │   ├── database-isolation.strategy.ts # 数据库隔离策略
│   │   │   ├── cache-isolation.strategy.ts  # 缓存隔离策略
│   │   │   ├── messaging-isolation.strategy.ts # 消息隔离策略
│   │   │   ├── database-validation.strategy.ts # 数据库验证策略
│   │   │   └── cache-validation.strategy.ts # 缓存验证策略
│   │   ├── types/                           # 业务类型
│   │   │   ├── tenant.types.ts              # 租户业务类型
│   │   │   ├── permission.types.ts          # 权限类型
│   │   │   ├── audit.types.ts               # 审计类型
│   │   │   └── config.types.ts              # 配置类型
│   │   ├── utils/                           # 业务工具
│   │   │   ├── tenant-business.util.ts      # 租户业务工具
│   │   │   ├── permission.util.ts           # 权限工具
│   │   │   └── audit.util.ts                # 审计工具
│   │   └── constants/                       # 业务常量
│   │       ├── tenant-types.constants.ts    # 租户类型常量
│   │       └── permissions.constants.ts     # 权限常量
│   ├── examples/                            # 使用示例
│   └── index.ts                             # 模块入口
```

## 🏗️ 多层级数据隔离设计

### 数据隔离层级

基于HL8 SAAS平台的多租户架构，支持四个层级的数据隔离：

```
平台 (Platform)
└── 租户 (Tenant) - 数据完全隔离
    └── 组织 (Organization) - 租户内水平隔离
        └── 部门 (Department) - 组织内垂直隔离
            └── 用户 (User) - 部门内用户隔离
```

### 键生成策略

```typescript
// 租户级隔离键
tenant:tenant-123:user:456

// 组织级隔离键  
tenant:tenant-123:org:org-456:user:789

// 部门级隔离键
tenant:tenant-123:org:org-456:dept:dept-789:user:101

// 用户级隔离键
tenant:tenant-123:org:org-456:dept:dept-789:user:101:data:202
```

### 隔离策略演进

1. **初始阶段**：行级隔离（Row-level isolation）
   - 使用租户ID作为数据隔离键
   - 所有数据查询自动添加租户过滤条件

2. **扩展阶段**：模式隔离（Schema-level isolation）
   - 每个租户使用独立的数据库模式
   - 支持租户级别的数据库配置

3. **高级阶段**：数据库隔离（Database-level isolation）
   - 每个租户使用独立的数据库实例
   - 支持租户级别的性能调优

### 多层级上下文管理

```typescript
// 在基础设施层定义多层级上下文
export interface IMultiLevelContext {
  tenantId: string;
  organizationId?: string;
  departmentId?: string;
  userId?: string;
  isolationLevel: 'tenant' | 'organization' | 'department' | 'user';
  metadata?: Record<string, any>;
  timestamp: Date;
}

// 在业务层实现层级关系管理
@Injectable()
export class TenantHierarchyService {
  // 验证组织是否属于租户
  async validateOrganizationBelongsToTenant(orgId: string, tenantId: string): Promise<boolean>
  
  // 验证部门是否属于组织
  async validateDepartmentBelongsToOrganization(deptId: string, orgId: string): Promise<boolean>
  
  // 获取用户的完整层级路径
  async getUserHierarchyPath(userId: string): Promise<IHierarchyPath>
}
```

### 权限控制设计

```typescript
// 多层级权限控制
export interface IMultiLevelPermission {
  tenantId: string;
  organizationId?: string;
  departmentId?: string;
  userId?: string;
  permissions: string[];
  accessLevel: 'tenant' | 'organization' | 'department' | 'user';
}

// 权限检查示例
@Injectable()
export class MultiLevelPermissionService {
  async checkDataAccess(
    userId: string, 
    targetLevel: string, 
    operation: string
  ): Promise<boolean> {
    const userHierarchy = await this.getUserHierarchyPath(userId);
    const userPermissions = await this.getUserPermissions(userId);
    
    // 根据用户层级和权限检查访问权限
    return this.validateAccess(userHierarchy, targetLevel, operation, userPermissions);
  }
}
```

## 🔗 模块协作关系

### 依赖关系图

```
@hl8/tenant (业务逻辑层)
    ↓ 依赖
@hl8/multi-tenancy (基础设施层)
    ↓ 依赖
@hl8/logger, @hl8/config, @hl8/utils, @hl8/common (基础框架)

@hl8/cache, @hl8/database, @hl8/messaging (其他业务模块)
    ↓ 使用
@hl8/multi-tenancy (基础设施层)
```

### 协作方式

1. **基础设施层**提供接口和基础实现
2. **业务逻辑层**实现具体的业务策略
3. **业务逻辑层**注册策略到基础设施层
4. **其他模块**使用基础设施层，业务逻辑层可选

## 🎨 使用模式

### 1. 纯技术使用（仅基础设施层）

```typescript
// 只使用基础设施层，自定义业务逻辑
@Module({
  imports: [
    MultiTenancyModule.forRoot({
      context: {
        enableAutoInjection: true,
        contextTimeout: 30000,
      },
      isolation: {
        defaultStrategy: 'custom',
        enableKeyPrefix: true,
      },
      middleware: {
        enableTenantMiddleware: true,
        tenantHeader: 'X-Tenant-ID',
      },
    }),
  ],
})
export class AppModule {}

// 自定义业务策略
@Injectable()
export class CustomTenantValidationStrategy implements ITenantValidationStrategy {
  async validateTenant(tenantId: string): Promise<boolean> {
    // 自定义验证逻辑
    return true;
  }
  
  async getTenantInfo(tenantId: string): Promise<ITenantInfo> {
    // 自定义获取租户信息逻辑
    return { tenantId, name: `Tenant ${tenantId}` };
  }
}
```

### 2. 完整业务使用（基础设施层 + 业务逻辑层）

```typescript
// 使用完整的业务功能
@Module({
  imports: [
    MultiTenancyModule.forRoot({
      context: {
        enableAutoInjection: true,
        contextTimeout: 30000,
      },
      middleware: {
        enableTenantMiddleware: true,
      },
    }),
    TenantModule.forRoot({
      tenant: {
        enableValidation: true,
        defaultTenantId: 'default',
        allowCrossTenantAccess: false,
      },
      permission: {
        enablePermissionCheck: true,
        defaultPermissions: ['read', 'write'],
      },
      audit: {
        enableAuditLog: true,
        auditRetentionDays: 90,
      },
    }),
  ],
})
export class AppModule {}
```

### 3. 混合使用（基础设施层 + 部分自定义）

```typescript
// 使用基础设施层，部分自定义业务逻辑
@Module({
  imports: [
    MultiTenancyModule.forRoot({
      // 基础设施配置
      context: {
        enableAutoInjection: true,
      },
      isolation: {
        defaultStrategy: 'database',
      },
    }),
    TenantModule.forRoot({
      // 部分业务配置
      tenant: {
        enableValidation: true,
      },
      // 自定义策略
      customStrategies: {
        validation: CustomValidationStrategy,
        isolation: CustomIsolationStrategy,
      },
    }),
  ],
})
export class AppModule {}
```

## 📊 配置分离

### 基础设施层配置

```typescript
export interface MultiTenancyModuleOptions {
  // 上下文配置
  context: {
    enableAutoInjection: boolean;
    contextTimeout: number;
    enableAuditLog: boolean;
    contextStorage: 'memory' | 'redis' | 'database';
  };
  
  // 隔离配置
  isolation: {
    defaultStrategy: string;
    enableKeyPrefix: boolean;
    enableNamespace: boolean;
    keySeparator: string;
  };
  
  // 中间件配置
  middleware: {
    enableTenantMiddleware: boolean;
    tenantHeader: string;
    tenantQueryParam: string;
    tenantSubdomain: boolean;
    validationTimeout: number;
  };
  
  // 安全配置
  security: {
    enableSecurityCheck: boolean;
    maxFailedAttempts: number;
    lockoutDuration: number;
  };
}
```

### 业务逻辑层配置

```typescript
export interface TenantModuleOptions {
  // 租户配置
  tenant: {
    enableValidation: boolean;
    defaultTenantId?: string;
    allowCrossTenantAccess: boolean;
    tenantIdPattern: RegExp;
    maxTenantsPerUser: number;
  };
  
  // 权限配置
  permission: {
    enablePermissionCheck: boolean;
    defaultPermissions: string[];
    permissionCache: boolean;
    permissionCacheTTL: number;
  };
  
  // 审计配置
  audit: {
    enableAuditLog: boolean;
    auditRetentionDays: number;
    auditStorage: 'database' | 'file' | 'external';
    sensitiveFields: string[];
  };
  
  // 状态配置
  status: {
    enableStatusManagement: boolean;
    statusTransitions: Record<string, string[]>;
    autoSuspendInactiveDays: number;
  };
  
  // 自定义策略
  customStrategies?: {
    validation?: ITenantValidationStrategy;
    isolation?: ITenantIsolationStrategy;
    context?: ITenantContextStrategy;
    security?: ITenantSecurityStrategy;
  };
}
```

## 🔄 与其他模块的集成

### 1. 与Cache模块集成

```typescript
// Cache模块使用多租户基础设施
@Injectable()
export class CacheService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly multiLevelIsolationService: MultiLevelIsolationService
  ) {}

  async get<T>(key: string, isolationLevel?: string): Promise<T> {
    if (isolationLevel) {
      // 使用多层级隔离
      const context = await this.buildMultiLevelContext(isolationLevel);
      const isolationKey = await this.multiLevelIsolationService.getIsolationKey(key, context);
      return await this.redis.get(isolationKey);
    } else {
      // 使用基础租户隔离
      const tenantId = this.tenantContextService.getTenant();
      const tenantKey = await this.tenantIsolationService.getTenantKey(key, tenantId);
      return await this.redis.get(tenantKey);
    }
  }

  async set<T>(key: string, value: T, isolationLevel?: string): Promise<void> {
    if (isolationLevel) {
      // 使用多层级隔离
      const context = await this.buildMultiLevelContext(isolationLevel);
      const isolationKey = await this.multiLevelIsolationService.getIsolationKey(key, context);
      const isolatedValue = await this.multiLevelIsolationService.isolateData(value, context);
      await this.redis.set(isolationKey, isolatedValue);
    } else {
      // 使用基础租户隔离
      const tenantId = this.tenantContextService.getTenant();
      const tenantKey = await this.tenantIsolationService.getTenantKey(key, tenantId);
      const isolatedValue = await this.tenantIsolationService.isolateData(value, tenantId);
      await this.redis.set(tenantKey, isolatedValue);
    }
  }
}
```

### 2. 与Database模块集成

```typescript
// Database模块使用多租户基础设施
@Injectable()
export class DatabaseService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly multiLevelIsolationService: MultiLevelIsolationService
  ) {}

  async findOne(entity: string, id: string, isolationLevel?: string): Promise<any> {
    if (isolationLevel) {
      // 使用多层级隔离
      const context = await this.buildMultiLevelContext(isolationLevel);
      const namespace = await this.multiLevelIsolationService.getIsolationNamespace(context);
      const query = `SELECT * FROM ${namespace}.${entity} WHERE id = $1`;
      const result = await this.db.query(query, [id]);
      return await this.multiLevelIsolationService.extractData(result.rows[0], context);
    } else {
      // 使用基础租户隔离
      const tenantId = this.tenantContextService.getTenant();
      const tenantNamespace = await this.tenantIsolationService.getTenantNamespace(tenantId);
      const query = `SELECT * FROM ${tenantNamespace}.${entity} WHERE id = $1`;
      const result = await this.db.query(query, [id]);
      return await this.tenantIsolationService.extractTenantData(result.rows[0], tenantId);
    }
  }

  async create(entity: string, data: any, isolationLevel?: string): Promise<any> {
    if (isolationLevel) {
      // 使用多层级隔离
      const context = await this.buildMultiLevelContext(isolationLevel);
      const namespace = await this.multiLevelIsolationService.getIsolationNamespace(context);
      const isolatedData = await this.multiLevelIsolationService.isolateData(data, context);
      // 数据库插入逻辑
    } else {
      // 使用基础租户隔离
      const tenantId = this.tenantContextService.getTenant();
      const tenantNamespace = await this.tenantIsolationService.getTenantNamespace(tenantId);
      const isolatedData = await this.tenantIsolationService.isolateData(data, tenantId);
      // 数据库插入逻辑
    }
  }
}
```

### 3. 与Messaging模块集成

```typescript
// Messaging模块使用多租户基础设施
@Injectable()
export class MessagingService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly multiLevelIsolationService: MultiLevelIsolationService
  ) {}

  async publish(topic: string, message: any, isolationLevel?: string): Promise<void> {
    if (isolationLevel) {
      // 使用多层级隔离
      const context = await this.buildMultiLevelContext(isolationLevel);
      const isolationTopic = await this.multiLevelIsolationService.getIsolationKey(topic, context);
      const isolatedMessage = await this.multiLevelIsolationService.isolateData(message, context);
      await this.messageQueue.publish(isolationTopic, isolatedMessage);
    } else {
      // 使用基础租户隔离
      const tenantId = this.tenantContextService.getTenant();
      const tenantTopic = await this.tenantIsolationService.getTenantKey(topic, tenantId);
      const isolatedMessage = await this.tenantIsolationService.isolateData(message, tenantId);
      await this.messageQueue.publish(tenantTopic, isolatedMessage);
    }
  }

  async subscribe(topic: string, handler: Function, isolationLevel?: string): Promise<void> {
    if (isolationLevel) {
      // 使用多层级隔离
      const context = await this.buildMultiLevelContext(isolationLevel);
      const isolationTopic = await this.multiLevelIsolationService.getIsolationKey(topic, context);
      await this.messageQueue.subscribe(isolationTopic, async (message) => {
        const cleanMessage = await this.multiLevelIsolationService.extractData(message, context);
        return handler(cleanMessage);
      });
    } else {
      // 使用基础租户隔离
      const tenantId = this.tenantContextService.getTenant();
      const tenantTopic = await this.tenantIsolationService.getTenantKey(topic, tenantId);
      await this.messageQueue.subscribe(tenantTopic, async (message) => {
        const cleanMessage = await this.tenantIsolationService.extractTenantData(message, tenantId);
        return handler(cleanMessage);
      });
    }
  }
}
```

## 🚀 实施计划

### 阶段1：基础设施层开发（@hl8/multi-tenancy）

1. **核心服务开发**
   - TenantContextService：基于nestjs-cls的上下文管理
   - TenantMiddlewareService：租户识别和验证
   - TenantIsolationService：基础租户隔离策略管理
   - MultiLevelIsolationService：多层级隔离策略管理
   - TenantSecurityService：安全策略管理

2. **多层级隔离框架**
   - IMultiLevelContext：多层级上下文接口
   - IMultiLevelIsolationStrategy：多层级隔离策略接口
   - MultiLevelKeyGenerator：多层级键生成工具
   - HierarchyValidator：层级关系验证工具

3. **中间件和装饰器**
   - 租户中间件：请求级别的租户处理
   - 多层级上下文中间件：多层级上下文管理
   - 租户装饰器：声明式的租户功能注入
   - 租户守卫：安全级别的访问控制
   - 租户拦截器：横切关注点处理

4. **策略接口和工具**
   - 定义各种策略接口
   - 提供基础工具函数
   - 常量定义和类型定义

### 阶段2：业务逻辑层开发（@hl8/tenant）

1. **业务服务开发**
   - TenantService：租户CRUD操作
   - TenantConfigService：租户配置管理
   - TenantPermissionService：权限管理
   - TenantAuditService：审计日志
   - TenantHierarchyService：多层级关系管理
   - MultiLevelDataService：多层级数据服务

2. **多层级业务实现**
   - 组织管理：组织CRUD、层级关系验证
   - 部门管理：部门CRUD、上下级关系管理
   - 用户层级管理：用户归属、权限分配
   - 多层级权限控制：四级权限验证

3. **策略实现**
   - 数据库隔离策略（行级、模式级、数据库级）
   - 缓存隔离策略
   - 消息隔离策略
   - 多层级验证策略

4. **控制器和DTO**
   - REST API控制器
   - 数据传输对象
   - 业务实体定义（租户、组织、部门）

### 阶段3：集成和优化

1. **模块集成**
   - 集成到现有模块（cache、database、messaging）
   - 替换现有的租户相关代码
   - 确保向后兼容性
   - 多层级隔离集成测试

2. **性能优化和测试**
   - 性能基准测试（单租户 vs 多层级隔离）
   - 完整的功能测试
   - 安全测试和审计
   - 多层级权限性能测试

3. **文档和示例**
   - API文档完善
   - 使用示例和最佳实践
   - 迁移指南
   - 多层级隔离使用指南

## 🎯 优势分析

### 1. **清晰的职责分离**

- **基础设施层**：纯技术实现，无业务耦合，高度可复用
- **业务逻辑层**：具体业务实现，面向具体业务场景

### 2. **多层级隔离支持**

- **四级隔离**：支持租户、组织、部门、用户四级数据隔离
- **灵活配置**：可根据业务需求选择不同的隔离级别
- **渐进演进**：支持从行级隔离扩展到数据库级隔离

### 3. **灵活的部署方式**

- 可以只使用基础设施层（轻量级）
- 可以完整使用两个模块（功能完整）
- 可以混合使用和自定义（灵活定制）
- 支持多层级隔离的渐进式启用

### 4. **更好的可测试性**

- 基础设施层可以独立测试（单元测试）
- 业务逻辑层可以独立测试（集成测试）
- 接口清晰，便于mock和stub
- 多层级隔离可以分层测试

### 5. **更强的扩展性**

- 可以轻松添加新的业务策略
- 可以替换默认的业务实现
- 可以组合不同的策略
- 支持未来扩展到更多隔离层级

### 6. **符合Clean Architecture**

- 依赖方向正确（业务层依赖基础设施层）
- 接口隔离原则
- 单一职责原则
- 多层级隔离保持架构清晰性

## 📋 命名约定

### 包命名

- `@hl8/multi-tenancy`：多租户基础设施模块
- `@hl8/tenant`：租户业务逻辑模块

### 服务命名

- `TenantContextService`：租户上下文服务
- `TenantIsolationService`：租户隔离服务
- `TenantSecurityService`：租户安全服务

### 接口命名

- `ITenantContext`：租户上下文接口
- `ITenantIsolationStrategy`：租户隔离策略接口
- `ITenantValidationStrategy`：租户验证策略接口

这种分离设计更符合Clean Architecture的原则，也更适合SAAS平台的复杂需求，为整个平台提供了统一、灵活、可扩展的多租户技术支撑。
