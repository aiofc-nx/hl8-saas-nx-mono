# 多租户模块日志集成总结

## 🎯 集成目标

确保 `@hl8/multi-tenancy` 模块优先使用自定义的 `@hl8/logger` 模块，提供统一、结构化的日志记录功能。

## ✅ 已完成的日志集成

### 1. **核心服务日志集成**

#### **TenantContextService**

```typescript
import { PinoLogger } from '@hl8/logger';

@Injectable()
export class TenantContextService {
  private readonly logger!: PinoLogger;

  constructor(
    private readonly cls: ClsService,
    @Inject(MULTI_TENANCY_MODULE_OPTIONS) options: IMultiTenancyModuleOptions,
    logger: PinoLogger
  ) {
    this.logger = logger;
    this.logger.setContext({ requestId: 'tenant-context-service' });
  }

  async updateTenant(tenantId: string): Promise<void> {
    try {
      // 业务逻辑
      this.logger.debug('租户ID已更新', { tenantId });
    } catch (error) {
      this.logger.error('更新租户ID失败', {
        tenantId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
```

#### **TenantIsolationService**

```typescript
import { PinoLogger } from '@hl8/logger';

@Injectable()
export class TenantIsolationService {
  private readonly logger!: PinoLogger;

  constructor(
    @Inject(MULTI_TENANCY_MODULE_OPTIONS) options: IMultiTenancyModuleOptions,
    private readonly tenantContextService: TenantContextService,
    logger: PinoLogger
  ) {
    this.logger = logger;
    this.logger.setContext({ requestId: 'tenant-isolation-service' });
  }
}
```

#### **MultiLevelIsolationService**

```typescript
import { PinoLogger } from '@hl8/logger';

@Injectable()
export class MultiLevelIsolationService {
  constructor(
    private readonly logger: PinoLogger,
    private readonly tenantContextService: TenantContextService,
    @Inject(MULTI_TENANCY_MODULE_OPTIONS) private readonly options: IMultiTenancyModuleOptions
  ) {
    this.logger.setContext({ requestId: 'multi-level-isolation-service' });
  }
}
```

### 2. **策略类日志集成**

#### **DefaultMultiLevelContextStrategy**

```typescript
import { PinoLogger } from '@hl8/logger';

@Injectable()
export class DefaultMultiLevelContextStrategy implements IMultiLevelContextStrategy {
  constructor(private readonly logger: PinoLogger = new PinoLogger()) {
    this.logger.setContext({
      requestId: 'default-multi-level-context-strategy',
    });
  }

  async extractContext(request: FastifyRequest): Promise<IMultiLevelContext | null> {
    try {
      // 提取上下文逻辑
      this.logger.debug('从请求中提取多层级上下文', { requestId: request.id });
    } catch (error) {
      this.logger.error('从请求中提取多层级上下文失败', {
        error: (error as Error).message,
        requestInfo: this.getRequestInfo(request),
      });
      return null;
    }
  }
}
```

#### **KeyPrefixMultiLevelIsolationStrategy**

```typescript
import { PinoLogger } from '@hl8/logger';

@Injectable()
export class KeyPrefixMultiLevelIsolationStrategy implements IMultiLevelIsolationStrategy {
  constructor(
    private readonly config: IMultiLevelIsolationConfig,
    private readonly logger: PinoLogger = new PinoLogger()
  ) {
    this.logger.setContext({
      requestId: 'key-prefix-multi-level-isolation-strategy',
    });
  }

  async isolateData<T = unknown>(data: T, context: IMultiLevelContext): Promise<T> {
    const startTime = Date.now();
    try {
      // 隔离逻辑
      this.logger.debug('数据隔离成功', { 
        isolationLevel: context.isolationLevel,
        dataType: typeof data 
      });
    } catch (error) {
      this.logger.error('隔离数据失败', { error: (error as Error).message });
      throw error;
    }
  }
}
```

### 3. **示例代码日志集成**

#### **ExampleService**

```typescript
import { PinoLogger } from '@hl8/logger';

@Injectable()
export class ExampleService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly multiLevelIsolationService: MultiLevelIsolationService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'example-service' });
  }

  async getUserData(userId: string): Promise<any> {
    // 透明获取当前租户ID
    const tenantId = this.tenantContextService.getTenant();
    this.logger.info('当前租户ID', { tenantId });

    // 透明获取当前用户ID
    const currentUserId = this.tenantContextService.getUser();
    this.logger.info('当前用户ID', { currentUserId });

    // 生成租户键
    const tenantKey = await this.tenantIsolationService.getTenantKey(`user:${userId}`);
    this.logger.info('租户键', { tenantKey });

    // 隔离数据
    const isolatedData = await this.tenantIsolationService.isolateData(userData);
    this.logger.info('隔离后的数据', { isolatedData });

    return isolatedData;
  }
}
```

#### **ExtendedExampleService**

```typescript
@Injectable()
export class ExtendedExampleService {
  constructor(
    private readonly multiLevelIsolationService: MultiLevelIsolationService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'extended-example-service' });
  }

  async getOrganizationData(organizationId: string) {
    // 获取当前多层级上下文
    const context = this.multiLevelIsolationService.getCurrentContext();
    this.logger.info('当前多层级上下文', { context });

    // 生成组织级隔离键
    const isolationKey = await this.multiLevelIsolationService.getIsolationKey(
      `org:${organizationId}`,
      context || undefined
    );
    this.logger.info('组织级隔离键', { isolationKey });

    return { context, isolationKey, namespace, isolatedData };
  }
}
```

#### **ErrorHandlingExampleService**

```typescript
@Injectable()
export class ErrorHandlingExampleService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly tenantIsolationService: TenantIsolationService,
    private readonly multiLevelIsolationService: MultiLevelIsolationService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'error-handling-example-service' });
  }

  async handleTenantNotFound() {
    try {
      const tenantId = 'non-existent-tenant';
      const tenant = await this.findTenantById(tenantId);

      if (!tenant) {
        throw new TenantNotFoundException(
          'Tenant not found',
          'The tenant with the specified ID does not exist',
          { tenantId, timestamp: new Date().toISOString() }
        );
      }

      return tenant;
    } catch (error) {
      // 异常会被全局异常过滤器捕获并转换为标准错误响应
      throw error;
    }
  }
}
```

### 4. **日志使用最佳实践**

#### **结构化日志**

```typescript
// ✅ 正确：结构化日志
this.logger.info('租户ID已更新', { 
  tenantId, 
  timestamp: new Date().toISOString(),
  operation: 'update' 
});

// ❌ 错误：字符串拼接
console.log(`租户ID已更新: ${tenantId}`);
```

#### **上下文设置**

```typescript
// ✅ 正确：设置请求上下文
this.logger.setContext({ requestId: 'tenant-context-service' });

// ✅ 正确：设置业务上下文
this.logger.setContext({ 
  requestId: 'tenant-context-service',
  tenantId: 'tenant-123',
  userId: 'user-456'
});
```

#### **日志级别使用**

```typescript
// ✅ 正确：根据重要性选择合适的日志级别
this.logger.debug('调试信息', { data });        // 调试信息
this.logger.info('业务信息', { result });       // 业务信息
this.logger.warn('警告信息', { warning });      // 警告信息
this.logger.error('错误信息', { error });       // 错误信息
```

#### **错误日志记录**

```typescript
// ✅ 正确：记录错误上下文
catch (error) {
  this.logger.error('更新租户ID失败', {
    tenantId,
    error: (error as Error).message,
    stack: (error as Error).stack,
    timestamp: new Date().toISOString()
  });
  throw error;
}
```

### 5. **日志配置集成**

#### **模块配置**

```typescript
// MultiTenancyModule 自动集成日志功能
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: () => {
          return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        },
      },
    }),
    ExceptionModule.forRoot({
      documentationUrl: 'https://docs.hl8.com/errors/multi-tenancy',
      logLevel: 'error',
      enableStackTrace: true,
      defaultLanguage: 'zh-CN',
      supportedLanguages: ['zh-CN', 'en-US'],
    }),
  ],
})
export class MultiTenancyModule {}
```

### 6. **日志输出示例**

#### **结构化日志输出**

```json
{
  "level": 30,
  "time": 1703123456789,
  "pid": 12345,
  "hostname": "server-01",
  "requestId": "tenant-context-service",
  "msg": "租户ID已更新",
  "tenantId": "tenant-123",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "operation": "update"
}
```

#### **错误日志输出**

```json
{
  "level": 50,
  "time": 1703123456789,
  "pid": 12345,
  "hostname": "server-01",
  "requestId": "tenant-context-service",
  "msg": "更新租户ID失败",
  "tenantId": "tenant-123",
  "error": "Invalid tenant ID format",
  "stack": "Error: Invalid tenant ID format\n    at TenantContextService.updateTenant...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚀 集成效果

### **开发体验提升**

- ✅ **统一的日志格式**: 所有日志都使用结构化格式，便于解析和查询
- ✅ **上下文追踪**: 支持请求ID和业务上下文的自动关联
- ✅ **类型安全**: 强类型的日志参数，提供更好的IDE支持
- ✅ **性能优化**: 使用高性能的Pino日志库

### **运维和监控**

- ✅ **结构化数据**: 支持JSON格式输出，便于日志分析工具处理
- ✅ **请求追踪**: 支持分布式请求追踪和问题定位
- ✅ **性能监控**: 支持操作耗时统计和性能分析
- ✅ **错误监控**: 支持错误统计和告警

### **生产就绪**

- ✅ **高性能**: Pino是Node.js中最快的日志库之一
- ✅ **可配置**: 支持不同环境的日志级别和输出格式配置
- ✅ **可扩展**: 支持自定义日志传输器和格式化器
- ✅ **兼容性**: 与主流日志分析工具兼容

## 📊 验证结果

- ✅ **编译检查**: 无TypeScript编译错误
- ✅ **依赖检查**: 正确使用 `@hl8/logger` 模块
- ✅ **服务集成**: 所有服务都已集成PinoLogger
- ✅ **示例更新**: 所有示例都使用结构化日志
- ✅ **最佳实践**: 遵循日志记录的最佳实践

## 🎉 总结

通过集成 `@hl8/logger` 模块，`@hl8/multi-tenancy` 模块现在具有：

1. **统一的日志记录**: 所有组件都使用PinoLogger进行日志记录
2. **结构化日志**: 支持JSON格式的结构化日志输出
3. **上下文追踪**: 支持请求ID和业务上下文的自动关联
4. **性能优化**: 使用高性能的Pino日志库
5. **生产就绪**: 支持生产环境的日志配置和监控需求

这为HL8 SAAS平台提供了企业级的日志记录能力，确保多租户系统的可观测性和可维护性！🎯
