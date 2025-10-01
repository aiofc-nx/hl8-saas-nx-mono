# Hybrid-Architecture 基础设施层重构说明

## 📋 重构概述

本次重构解决了`hybrid-archi`基础设施层中的模块引用冲突、重复实现和架构不一致问题。

## 🎯 重构目标

1. **移除重复实现** - 删除旧项目的基础设施代码
2. **修复模块引用冲突** - 统一使用新系统模块
3. **统一架构设计** - 使用新系统架构和接口

## 🔧 重构内容

### 1. 移除的重复实现

**已删除的目录**：

- ❌ `config/` - 重复的配置管理实现
- ❌ `messaging/` - 重复的消息队列实现  
- ❌ `monitoring/` - 重复的性能监控实现
- ❌ `storage/` - 重复的存储实现

**删除原因**：

- 与重构后的基础设施模块功能重复
- 存在模块引用冲突
- 架构设计不一致

### 2. 保留的通用功能组件

**保留的目录**：

- ✅ `common/` - 通用基础设施功能组件
- ✅ `web/` - Web基础设施（通用功能组件）
- ✅ `mappers/` - 映射器基础设施（通用功能组件）

**保留原因**：

- 提供业务模块所需的通用功能
- 不包含具体的业务实现
- 符合模块边界定义

### 3. 新增的通用功能组件

**新增的组件**：

- ✅ `BaseInfrastructureService` - 基础基础设施服务接口
- ✅ `BaseInfrastructureAdapter` - 基础基础设施适配器
- ✅ `InfrastructureServiceManager` - 基础设施服务管理器
- ✅ `InfrastructureModule` - 基础设施模块

**新增原因**：

- 提供统一的基础设施服务管理
- 支持基础设施服务的生命周期管理
- 提供健康检查和状态监控

## 🏗️ 新的架构设计

### 1. 模块集成

```typescript
// 重构后的基础设施模块集成
export { CacheService, CacheModule } from '@hl8/cache';
export { Logger, LoggerModule } from '@hl8/logger';
export { ConfigService, ConfigModule } from '@hl8/config';
export { MessagingService, EventService, TaskService, MessagingModule } from '@hl8/messaging';
export { TenantContextService, TenantIsolationService, MultiTenancyModule } from '@hl8/multi-tenancy';
export { DatabaseService, TenantDatabaseService, DatabaseModule } from '@hl8/database';
export { FastifyProModule } from '@hl8/fastify-pro';
```

### 2. 通用功能组件

```typescript
// 通用基础设施功能组件
export * from './common';

// Web基础设施（通用功能组件）
export * from './web';

// 映射器基础设施（通用功能组件）
export * from './mappers';
```

### 3. 使用方式

```typescript
// 业务模块中使用基础设施服务
import { 
  CacheService, 
  Logger, 
  ConfigService,
  InfrastructureServiceManager 
} from '@hl8/hybrid-archi';

@Injectable()
export class BusinessService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    private readonly infrastructureManager: InfrastructureServiceManager
  ) {}
}
```

## ✅ 重构效果

### 1. 解决冲突

- ✅ 消除了模块引用冲突
- ✅ 统一了依赖注入方式
- ✅ 统一了接口定义

### 2. 减少重复

- ✅ 删除了重复的配置管理代码
- ✅ 删除了重复的消息队列代码
- ✅ 删除了重复的性能监控代码

### 3. 统一架构

- ✅ 使用新系统架构和接口
- ✅ 统一了错误处理方式
- ✅ 统一了日志记录方式

## 🎯 使用指南

### 1. 基础设施服务使用

```typescript
// 注册基础设施服务
const service = new BaseInfrastructureAdapter(
  'service-id',
  'Service Name',
  '1.0.0',
  { /* 配置 */ }
);

await service.initialize();
await service.start();

// 健康检查
const health = await service.healthCheck();
```

### 2. 基础设施服务管理

```typescript
// 使用基础设施服务管理器
const manager = new InfrastructureServiceManager();

// 注册服务
manager.registerService(service);

// 启动所有服务
await manager.startAllServices();

// 健康检查所有服务
const healthChecks = await manager.healthCheckAllServices();
```

### 3. 基础设施模块使用

```typescript
// 在应用模块中导入
@Module({
  imports: [
    InfrastructureModule.forRoot({
      enableCache: true,
      enableLogging: true,
      enableConfig: true,
      enableMessaging: true,
      enableMultiTenancy: true,
      enableDatabase: true,
      enableWeb: true,
    }),
  ],
})
export class AppModule {}
```

## 🚫 注意事项

### 1. 不要包含具体业务实现

- ❌ 不要实现具体的业务逻辑
- ❌ 不要包含具体的业务配置
- ❌ 不要实现具体的业务服务

### 2. 专注于通用功能组件

- ✅ 提供通用的基础设施接口
- ✅ 提供通用的基础设施适配器
- ✅ 提供通用的基础设施管理

### 3. 使用重构后的基础设施模块

- ✅ 使用`@hl8/cache`而不是`@aiofix/cache`
- ✅ 使用`@hl8/logger`而不是`@aiofix/logging`
- ✅ 使用`@hl8/config`而不是`@aiofix/config`

## 📚 相关文档

- [基础设施层设计原则](../../../docs/hybrid-architecture/infrastructure-layer-design-principles.md)
- [应用层设计原则](../../../docs/hybrid-architecture/application-layer-design-principles.md)
- [领域层设计原则](../../../docs/hybrid-architecture/domain-layer-design-principles.md)
