# Fastify-Pro 与 Multi-Tenancy 集成策略

## 🎯 集成目标

将 `packages/fastify-pro` 中的多租户代码剥离，并与 `packages/multi-tenancy` 模块集成，实现职责分离和功能复用。

## 📊 当前状态分析

### **Fastify-Pro 中的多租户代码**

#### **1. 核心文件**

- `src/lib/middleware/tenant.middleware.ts` - 租户中间件
- `src/lib/types/fastify.types.ts` - 多租户类型定义
- `src/lib/modules/fastify-pro.module.ts` - 模块配置
- `src/lib/adapters/core-fastify.adapter.ts` - 适配器扩展

#### **2. 功能范围**

- 租户ID提取（请求头、查询参数、子域名）
- 租户验证和上下文管理
- FastifyRequest类型扩展
- 多租户配置管理

### **Multi-Tenancy 模块功能**

- 应用层多租户架构
- 数据隔离策略
- 业务级多租户逻辑
- 多级隔离支持（租户、组织、部门、用户）

## 🔄 集成策略

### **策略1: 职责分离**

#### **Fastify-Pro 职责**

- HTTP层面的租户处理
- 请求路由和中间件管理
- 基础租户ID提取和验证
- 与HTTP框架的集成

#### **Multi-Tenancy 职责**

- 应用层多租户架构
- 业务级租户上下文管理
- 数据隔离策略实施
- 多级隔离支持

### **策略2: 集成模式**

#### **模式1: 中间件集成**

```typescript
// Fastify-Pro 提供基础中间件
export class TenantExtractionMiddleware {
  // 提取租户ID
  // 基础验证
  // 设置请求上下文
}

// Multi-Tenancy 提供业务中间件
export class TenantContextMiddleware {
  // 获取完整租户上下文
  // 应用业务逻辑
  // 数据隔离策略
}
```

#### **模式2: 服务集成**

```typescript
// Fastify-Pro 注册 Multi-Tenancy 服务
FastifyProModule.forRoot({
  features: {
    multiTenant: true,
    tenantService: TenantContextService
  }
});
```

#### **模式3: 装饰器集成**

```typescript
// 在控制器中使用
@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @TenantContext() tenantContext: ITenantContext
  ) {
    // 自动注入租户上下文
  }
}
```

## 🛠️ 实施计划

### **阶段1: 代码剥离**

#### **1.1 保留的功能**

- 基础租户ID提取逻辑
- HTTP层面的租户处理
- FastifyRequest类型扩展
- 基础验证机制

#### **1.2 移除的功能**

- 复杂的租户上下文管理
- 业务级租户逻辑
- 数据隔离策略
- 多级隔离支持

#### **1.3 重构的文件**

- `tenant.middleware.ts` → 简化为基础提取中间件
- `fastify.types.ts` → 移除复杂的租户类型
- `fastify-pro.module.ts` → 移除多租户配置
- `core-fastify.adapter.ts` → 移除租户相关扩展

### **阶段2: 依赖集成**

#### **2.1 添加依赖**

```json
{
  "dependencies": {
    "@hl8/multi-tenancy": "workspace:*"
  }
}
```

#### **2.2 服务注入**

```typescript
// 在 Fastify-Pro 模块中注入 Multi-Tenancy 服务
@Module({
  imports: [MultiTenancyModule],
  providers: [TenantExtractionMiddleware],
  exports: [TenantExtractionMiddleware]
})
export class FastifyProModule {}
```

#### **2.3 中间件集成**

```typescript
// 集成 Multi-Tenancy 中间件
export class TenantExtractionMiddleware {
  constructor(
    private readonly tenantContextService: TenantContextService
  ) {}
}
```

### **阶段3: 接口适配**

#### **3.1 接口统一**

```typescript
// 统一的租户配置接口
export interface ITenantConfig {
  extraction: ITenantExtractionConfig;    // Fastify-Pro 配置
  context: IMultiTenancyConfig;           // Multi-Tenancy 配置
}
```

#### **3.2 数据流统一**

```typescript
// 统一的数据流处理
export class TenantPipeline {
  async process(request: FastifyRequest): Promise<void> {
    // 1. 提取租户ID (Fastify-Pro)
    const tenantId = await this.extractTenantId(request);
    
    // 2. 获取租户上下文 (Multi-Tenancy)
    const tenantContext = await this.tenantContextService.getTenantContext(tenantId);
    
    // 3. 设置请求上下文
    request.tenantId = tenantId;
    request.tenantContext = tenantContext;
  }
}
```

## 📋 详细实施步骤

### **步骤1: 分析现有代码**

#### **1.1 识别需要剥离的代码**

```bash
# 需要移除或重构的文件
- src/lib/middleware/tenant.middleware.ts (重构)
- src/lib/types/fastify.types.ts (简化)
- src/lib/modules/fastify-pro.module.ts (移除多租户配置)
- src/lib/adapters/core-fastify.adapter.ts (移除租户扩展)

# 需要保留的文件
- src/lib/middleware/core-fastify.middleware.ts (保留)
- src/lib/adapters/enterprise-fastify.adapter.ts (保留)
- src/lib/plugins/ (保留)
```

#### **1.2 识别需要集成的功能**

```typescript
// 从 Multi-Tenancy 模块集成
- TenantContextService
- TenantIsolationService
- MultiLevelIsolationService
- 相关的异常处理
- 配置管理
```

### **步骤2: 重构 TenantMiddleware**

#### **2.1 简化为基础提取中间件**

```typescript
export class TenantExtractionMiddleware extends CoreFastifyMiddleware {
  constructor(
    private readonly tenantContextService: TenantContextService
  ) {
    super({
      name: 'tenant-extraction',
      priority: 1,
      enabled: true
    });
  }

  middleware = async (
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void
  ): Promise<void> => {
    try {
      // 1. 提取租户ID
      const tenantId = await this.extractTenantId(request);
      
      if (!tenantId) {
        reply.status(400).send({
          error: 'Tenant ID is required',
          code: 'TENANT_ID_REQUIRED'
        });
        return;
      }

      // 2. 获取租户上下文 (使用 Multi-Tenancy 服务)
      const tenantContext = await this.tenantContextService.getTenantContext(tenantId);
      
      // 3. 设置请求上下文
      request.tenantId = tenantId;
      request.tenantContext = tenantContext;
      
      // 4. 设置响应头
      reply.header('X-Tenant-ID', tenantId);
      
      done();
    } catch (error) {
      this.handleError(error, request, reply);
    }
  };

  private async extractTenantId(request: FastifyRequest): Promise<string | null> {
    // 简化的租户ID提取逻辑
    const headerTenantId = request.headers['x-tenant-id'];
    if (headerTenantId && typeof headerTenantId === 'string') {
      return headerTenantId;
    }

    const query = request.query as Record<string, any>;
    const queryTenantId = query.tenant;
    if (queryTenantId && typeof queryTenantId === 'string') {
      return queryTenantId;
    }

    return null;
  }
}
```

#### **2.2 移除复杂的业务逻辑**

- 移除复杂的租户验证逻辑
- 移除子域名解析逻辑
- 移除默认租户处理逻辑
- 移除自定义验证函数支持

### **步骤3: 简化类型定义**

#### **3.1 简化 FastifyRequest 扩展**

```typescript
declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
    tenantContext?: ITenantContext;
  }
}
```

#### **3.2 移除复杂的租户类型**

```typescript
// 移除复杂的租户配置类型
// 移除自定义验证函数类型
// 移除子域名配置类型
```

### **步骤4: 更新模块配置**

#### **4.1 简化模块配置**

```typescript
export interface IFastifyProModuleConfig {
  enterprise?: {
    enableHealthCheck?: boolean;
    enablePerformanceMonitoring?: boolean;
    // 移除多租户配置
  };
}
```

#### **4.2 集成 Multi-Tenancy 模块**

```typescript
@Module({})
export class FastifyProModule {
  static forRoot(config?: IFastifyProModuleConfig): DynamicModule {
    const providers: Provider[] = [
      TenantExtractionMiddleware,
      {
        provide: 'FASTIFY_PRO_ADAPTER',
        useFactory: () => new EnterpriseFastifyAdapter(config?.enterprise)
      }
    ];

    return {
      module: FastifyProModule,
      imports: [
        // 集成 Multi-Tenancy 模块
        MultiTenancyModule.forRoot()
      ],
      providers,
      exports: [TenantExtractionMiddleware],
      global: true
    };
  }
}
```

### **步骤5: 更新测试**

#### **5.1 更新单元测试**

```typescript
describe('TenantExtractionMiddleware', () => {
  let middleware: TenantExtractionMiddleware;
  let mockTenantContextService: jest.Mocked<TenantContextService>;

  beforeEach(() => {
    mockTenantContextService = createMockTenantContextService();
    middleware = new TenantExtractionMiddleware(mockTenantContextService);
  });

  it('should extract tenant ID from header', async () => {
    // 测试租户ID提取
  });

  it('should get tenant context from service', async () => {
    // 测试租户上下文获取
  });
});
```

#### **5.2 更新集成测试**

```typescript
describe('Fastify-Pro Multi-Tenancy Integration', () => {
  it('should integrate with Multi-Tenancy module', async () => {
    // 测试模块集成
  });
});
```

### **步骤6: 更新文档**

#### **6.1 更新 README**

```markdown
# Fastify-Pro

企业级 Fastify 集成库，专注于 HTTP 层面的功能。

## 多租户支持

Fastify-Pro 与 @hl8/multi-tenancy 模块集成，提供完整的多租户支持：

- 基础租户ID提取
- 租户上下文管理
- 数据隔离策略
```

#### **6.2 更新使用示例**

```typescript
// 使用示例
@Module({
  imports: [
    FastifyProModule.forRoot(),
    MultiTenancyModule.forRoot()
  ]
})
export class AppModule {}

// 在控制器中使用
@Controller('users')
export class UserController {
  constructor(
    private readonly tenantContextService: TenantContextService
  ) {}

  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @Req() request: FastifyRequest
  ) {
    const tenantId = request.tenantId;
    const tenantContext = request.tenantContext;
    
    // 使用租户上下文
    return this.userService.findById(id, tenantContext);
  }
}
```

## 🎯 预期效果

### **职责分离**

- Fastify-Pro 专注于 HTTP 层面功能
- Multi-Tenancy 专注于应用层多租户架构
- 清晰的职责边界

### **功能复用**

- 避免重复的租户处理逻辑
- 统一的多租户配置管理
- 共享的异常处理机制

### **维护性提升**

- 单一职责原则
- 更好的代码组织
- 更清晰的依赖关系

### **扩展性增强**

- 更容易添加新的多租户功能
- 更好的模块化设计
- 更灵活的配置选项

## 🚀 实施时间表

### **第1周: 代码分析和设计**

- 分析现有代码结构
- 设计集成方案
- 制定详细实施计划

### **第2周: 代码重构**

- 重构 TenantMiddleware
- 简化类型定义
- 更新模块配置

### **第3周: 集成实施**

- 集成 Multi-Tenancy 模块
- 更新依赖关系
- 实施接口适配

### **第4周: 测试和文档**

- 更新测试用例
- 更新文档
- 性能测试和优化

这个集成策略将实现 Fastify-Pro 和 Multi-Tenancy 模块的职责分离，提高代码的可维护性和可扩展性！
