# 基础设施层文档

## 概述

基础设施层是混合架构模式的核心组件，提供统一的业务模块设计范式和通用功能组件。它集成了重构后的基础设施模块，支持多租户、多数据库、多级缓存等高级功能。

## 文档结构

### 📚 使用指南

- [快速开始](./guides/getting-started.md) - 基础设施层的基础使用和配置

### 📖 API文档

- [API参考](./api/README.md) - 完整的API接口文档

### 🎯 最佳实践

- [最佳实践](./best-practices/README.md) - 架构设计、性能优化、错误处理等最佳实践

### 💡 示例代码

- [示例代码](./examples/README.md) - 完整的使用示例和集成示例

## 核心组件

### 1. 端口适配器

- **LoggerPortAdapter** - 日志记录
- **IdGeneratorPortAdapter** - ID生成
- **TimeProviderPortAdapter** - 时间提供
- **ValidationPortAdapter** - 数据验证
- **ConfigurationPortAdapter** - 配置管理
- **EventBusPortAdapter** - 事件发布

### 2. 缓存适配器

- **CacheAdapter** - 多级缓存策略
- **CacheFactory** - 缓存实例管理
- **CacheManager** - 缓存生命周期管理

### 3. 数据库适配器

- **DatabaseAdapter** - 多数据库策略
- **DatabaseFactory** - 数据库实例管理
- **DatabaseManager** - 数据库生命周期管理

### 4. 事件存储适配器

- **EventStoreAdapter** - 事件溯源
- **EventStoreFactory** - 事件存储实例管理
- **EventStoreManager** - 事件存储生命周期管理

### 5. 消息队列适配器

- **MessageQueueAdapter** - 消息发布订阅
- **MessageQueueFactory** - 消息队列实例管理
- **MessageQueueManager** - 消息队列生命周期管理

### 6. 基础设施工厂

- **InfrastructureFactory** - 基础设施服务创建
- **InfrastructureManager** - 基础设施服务管理

## 快速开始

### 1. 安装依赖

```bash
npm install @hl8/hybrid-archi
```

### 2. 基础配置

```typescript
import { Module } from '@nestjs/common';
import {
  InfrastructureFactoriesModule,
  PortAdaptersModule,
  CacheAdaptersModule,
  DatabaseAdaptersModule,
  EventStoreAdaptersModule,
  MessageQueueAdaptersModule,
} from '@hl8/hybrid-archi/infrastructure';

@Module({
  imports: [
    InfrastructureFactoriesModule.forRoot(),
    PortAdaptersModule.forRoot(),
    CacheAdaptersModule.forRoot(),
    DatabaseAdaptersModule.forRoot(),
    EventStoreAdaptersModule.forRoot(),
    MessageQueueAdaptersModule.forRoot(),
  ],
})
export class AppModule {}
```

### 3. 使用服务

```typescript
import { Injectable } from '@nestjs/common';
import {
  LoggerPortAdapter,
  CacheAdapter,
  DatabaseAdapter,
} from '@hl8/hybrid-archi/infrastructure';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: LoggerPortAdapter,
    private readonly cache: CacheAdapter,
    private readonly database: DatabaseAdapter,
  ) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    this.logger.info('Creating user', { userData });
    
    const user = await this.database.insert('users', userData);
    await this.cache.set(`user:${user.id}`, user, 300);
    
    return user;
  }
}
```

## 特性

### 🚀 高性能

- 多级缓存策略
- 数据库连接池
- 异步消息处理
- 查询优化

### 🔒 高安全

- 数据加密
- 访问控制
- 输入验证
- 审计日志

### 📈 高可扩展

- 微服务架构
- 事件驱动
- 水平扩展
- 负载均衡

### 🛠️ 高可维护

- 模块化设计
- 依赖注入
- 配置管理
- 监控告警

## 架构模式

### 1. Clean Architecture

- 领域层：业务逻辑和规则
- 应用层：用例和协调
- 基础设施层：技术实现
- 接口层：用户交互

### 2. CQRS

- 命令：写操作
- 查询：读操作
- 分离：读写分离

### 3. Event Sourcing

- 事件存储
- 事件重放
- 状态重建

### 4. Event-Driven Architecture

- 事件发布
- 事件订阅
- 异步处理

## 技术栈

### 核心框架

- **NestJS** - 应用框架
- **TypeScript** - 编程语言
- **Node.js** - 运行环境

### 基础设施

- **PostgreSQL** - 关系数据库
- **MongoDB** - 文档数据库
- **Redis** - 缓存和消息队列
- **RabbitMQ** - 消息队列

### 监控和日志

- **Pino** - 日志记录
- **Prometheus** - 指标监控
- **Grafana** - 可视化

## 最佳实践

### 1. 架构设计

- 分层架构
- 依赖注入
- 接口隔离
- 单一职责

### 2. 性能优化

- 缓存策略
- 数据库优化
- 异步处理
- 资源管理

### 3. 错误处理

- 分层错误处理
- 错误分类
- 错误监控
- 故障恢复

### 4. 安全考虑

- 数据加密
- 访问控制
- 输入验证
- 审计日志

## 故障排除

### 常见问题

#### 1. 服务启动失败

- 检查依赖配置
- 验证服务状态
- 查看错误日志

#### 2. 缓存问题

- 检查缓存配置
- 验证缓存连接
- 查看缓存统计

#### 3. 数据库问题

- 检查数据库连接
- 验证查询性能
- 查看数据库统计

### 调试技巧

#### 1. 日志记录

```typescript
this.logger.debug('Debug message', { context: 'debug' });
this.logger.info('Info message', { context: 'info' });
this.logger.warn('Warning message', { context: 'warning' });
this.logger.error('Error message', error, { context: 'error' });
```

#### 2. 性能监控

```typescript
const startTime = Date.now();
await someOperation();
const duration = Date.now() - startTime;
this.logger.info('Operation completed', { duration });
```

#### 3. 健康检查

```typescript
const healthResults = await infrastructureManager.healthCheckAllServices();
console.log('Health results:', healthResults);
```

## 贡献指南

### 1. 代码规范

- 遵循TypeScript规范
- 使用ESLint检查
- 编写单元测试
- 更新文档

### 2. 提交规范

- 使用语义化提交
- 提供详细描述
- 关联相关Issue
- 通过CI检查

### 3. 文档更新

- 更新API文档
- 添加使用示例
- 完善最佳实践
- 更新版本说明

## 许可证

MIT License

## 支持

如有问题或建议，请：

1. 查看文档
2. 搜索Issue
3. 创建Issue
4. 联系维护者

---

**基础设施层** - 为混合架构提供统一的基础设施服务
