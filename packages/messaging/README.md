# @hl8/messaging

[![Version](https://img.shields.io/badge/version-0.0.1-blue.svg)](https://www.npmjs.com/package/@hl8/messaging)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> 企业级多租户消息队列解决方案 - 基于NestJS的高性能、可扩展消息传递系统

## 🚀 特性

### 核心功能

- **多适配器支持**: RabbitMQ、Redis Streams、Apache Kafka、Memory
- **多租户架构**: 完整的租户隔离和安全保障
- **事件驱动**: 支持事件发布/订阅模式
- **异步任务**: 强大的任务队列和批处理能力
- **类型安全**: 完整的TypeScript支持和智能提示

### 企业级特性

- **配置管理**: 集成`@hl8/config`提供类型安全的配置管理
- **缓存集成**: 深度集成`@hl8/cache`提供消息去重和状态管理
- **异常处理**: 统一的异常处理和错误响应机制
- **监控统计**: 完整的性能监控和健康检查
- **日志记录**: 结构化日志记录和审计追踪

### 性能优化

- **消息去重**: 防止重复消息处理
- **消费者状态管理**: 故障恢复和状态持久化
- **批量处理**: 高效的批量消息处理
- **连接池**: 优化的连接管理和资源利用
- **内存管理**: 智能的内存使用和垃圾回收

## 📦 安装

```bash
npm install @hl8/messaging
# 或
pnpm add @hl8/messaging
# 或
yarn add @hl8/messaging
```

## 🎯 快速开始

### 基本配置

```typescript
import { Module } from '@nestjs/common';
import { MessagingConfigModule } from '@hl8/messaging';
import { MessagingModule } from '@hl8/messaging';

@Module({
  imports: [
    // 配置模块 - 类型安全的配置管理
    MessagingConfigModule.forRoot({
      configPath: './config/messaging.yml',
      envPrefix: 'MESSAGING_',
    }),
    
    // 消息队列模块 - 使用配置
    MessagingModule.forRootWithConfig(ConfigService),
  ],
})
export class AppModule {}
```

### 配置文件示例

```yaml
# config/messaging.yml
adapter: rabbitmq
keyPrefix: "hl8:messaging:"
enableTenantIsolation: true

rabbitmq:
  url: "amqp://localhost:5672"
  exchange: "hl8_saas"
  queuePrefix: "hl8_"

cache:
  enableMessageDeduplication: true
  enableConsumerStateCache: true
  cacheTTL:
    messageDedup: 300
    consumerState: 3600

multiTenancy:
  context:
    enableAutoInjection: true
    contextTimeout: 30000
  isolation:
    strategy: "key-prefix"
    enableIsolation: true
    level: "strict"
```

### 基本使用

```typescript
import { Injectable } from '@nestjs/common';
import { EventService, TaskService } from '@hl8/messaging';

@Injectable()
export class UserService {
  constructor(
    private readonly eventService: EventService,
    private readonly taskService: TaskService
  ) {}

  async createUser(userData: any) {
    // 创建用户
    const user = await this.saveUser(userData);
    
    // 发布用户创建事件
    await this.eventService.publish('user.created', {
      userId: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });

    // 发送欢迎邮件任务
    await this.taskService.publish('send-welcome-email', {
      userId: user.id,
      email: user.email,
    });

    return user;
  }
}
```

## 🔧 配置选项

### 适配器配置

#### RabbitMQ

```yaml
rabbitmq:
  url: "amqp://localhost:5672"
  exchange: "hl8_saas"
  queuePrefix: "hl8_"
  heartbeat: 30
  options:
    connectionTimeout: 30000
    frameMax: 4096
```

#### Redis Streams

```yaml
redis:
  host: "localhost"
  port: 6379
  db: 1
  streamPrefix: "hl8:messaging:stream:"
  options:
    retryDelayOnFailover: 100
    maxRetriesPerRequest: 3
```

#### Apache Kafka

```yaml
kafka:
  clientId: "hl8-messaging-client"
  brokers:
    - "localhost:9092"
  topicPrefix: "hl8:messaging:"
  options:
    requestTimeout: 30000
    retry:
      initialRetryTime: 100
      maxRetryTime: 30000
```

### 缓存配置

```yaml
cache:
  enableMessageDeduplication: true
  enableConsumerStateCache: true
  enableStatsCache: true
  keyPrefix: "hl8:messaging:cache:"
  cacheTTL:
    messageDedup: 300        # 5分钟
    consumerState: 3600      # 1小时
    stats: 60               # 1分钟
  redis:
    host: "localhost"
    port: 6379
    db: 2
```

### 多租户配置

```yaml
multiTenancy:
  context:
    enableAutoInjection: true
    contextTimeout: 30000
    enableAuditLog: true
    contextStorage: "memory"
    allowCrossTenantAccess: false
  isolation:
    strategy: "key-prefix"
    keyPrefix: "hl8:messaging:"
    namespace: "messaging-namespace"
    enableIsolation: true
    level: "strict"
  middleware:
    enableTenantMiddleware: true
    tenantHeader: "X-Tenant-ID"
    tenantQueryParam: "tenant"
    validationTimeout: 5000
  security:
    enableSecurityCheck: true
    maxFailedAttempts: 5
    lockoutDuration: 300000
```

## 📚 使用指南

### 事件处理

```typescript
import { Injectable } from '@nestjs/common';
import { EventService, EventHandler } from '@hl8/messaging';

@Injectable()
export class UserEventHandler {
  constructor(private readonly eventService: EventService) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.eventService.on('user.created', this.handleUserCreated.bind(this));
    this.eventService.on('user.updated', this.handleUserUpdated.bind(this));
  }

  @EventHandler('user.created')
  async handleUserCreated(data: UserCreatedEvent) {
    console.log('用户创建事件:', data);
    // 处理用户创建逻辑
  }

  @EventHandler('user.updated')
  async handleUserUpdated(data: UserUpdatedEvent) {
    console.log('用户更新事件:', data);
    // 处理用户更新逻辑
  }
}
```

### 任务处理

```typescript
import { Injectable } from '@nestjs/common';
import { TaskService, TaskHandler } from '@hl8/messaging';

@Injectable()
export class EmailTaskHandler {
  constructor(private readonly taskService: TaskService) {
    this.setupTaskHandlers();
  }

  private setupTaskHandlers() {
    this.taskService.on('send-email', this.handleSendEmail.bind(this));
    this.taskService.on('batch-process', this.handleBatchProcess.bind(this));
  }

  @TaskHandler('send-email')
  async handleSendEmail(data: EmailTaskData) {
    console.log('发送邮件任务:', data);
    // 发送邮件逻辑
  }

  @TaskHandler('batch-process')
  async handleBatchProcess(data: BatchProcessData) {
    console.log('批量处理任务:', data);
    // 批量处理逻辑
  }
}
```

### 租户隔离

```typescript
import { Injectable } from '@nestjs/common';
import { TenantContextService } from '@hl8/messaging';

@Injectable()
export class TenantAwareService {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly eventService: EventService
  ) {}

  async processTenantData(data: any) {
    // 获取当前租户ID
    const tenantId = this.tenantContextService.getTenant();
    
    // 发布租户隔离的事件
    await this.eventService.publish('tenant.data.processed', {
      tenantId,
      data,
      timestamp: new Date(),
    });
  }

  // 在特定租户上下文中执行操作
  async processWithTenant(tenantId: string, data: any) {
    return this.tenantContextService.runWithTenant(tenantId, async () => {
      // 在这个上下文中，所有操作都会自动使用指定的租户ID
      await this.eventService.publish('tenant.specific.event', data);
    });
  }
}
```

### 监控和统计

```typescript
import { Injectable } from '@nestjs/common';
import { MessagingMonitor, MessagingStatsService } from '@hl8/messaging';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly monitor: MessagingMonitor,
    private readonly statsService: MessagingStatsService
  ) {}

  async getSystemHealth() {
    const health = await this.monitor.getHealth();
    console.log('系统健康状态:', health);
    return health;
  }

  async getPerformanceStats() {
    const stats = this.statsService.getStats();
    console.log('性能统计:', stats);
    return stats;
  }

  async getTenantStats(tenantId: string) {
    const tenantStats = this.statsService.getTenantStats(tenantId);
    console.log('租户统计:', tenantStats);
    return tenantStats;
  }
}
```

## 🏗️ 架构设计

### 模块架构

```
@hl8/messaging
├── 核心模块
│   ├── MessagingModule - 主模块
│   ├── MessagingService - 核心服务
│   ├── EventService - 事件服务
│   └── TaskService - 任务服务
├── 适配器层
│   ├── BaseAdapter - 基础适配器
│   ├── RabbitMQAdapter - RabbitMQ适配器
│   ├── RedisAdapter - Redis适配器
│   ├── KafkaAdapter - Kafka适配器
│   └── MemoryAdapter - 内存适配器
├── 配置管理
│   ├── MessagingConfigModule - 配置模块
│   ├── MessagingConfig - 配置类
│   └── 多环境配置支持
├── 缓存集成
│   ├── MessageDeduplicationService - 消息去重
│   └── ConsumerStateService - 消费者状态
├── 监控统计
│   ├── MessagingMonitor - 监控服务
│   ├── MessagingStatsService - 统计服务
│   └── HealthCheckService - 健康检查
├── 异常处理
│   ├── MessagingException - 基础异常
│   ├── ConnectionException - 连接异常
│   └── 统一异常处理机制
└── 装饰器
    ├── EventHandler - 事件处理器
    ├── TaskHandler - 任务处理器
    └── MessageHandler - 消息处理器
```

### 数据流

```
消息发布 → 适配器层 → 消息队列 → 消费者 → 业务处理
    ↓
缓存层 → 去重检查 → 状态管理 → 监控统计
    ↓
异常处理 → 错误重试 → 死信队列 → 审计日志
```

## 🔍 性能优化

### 消息去重

```typescript
// 自动消息去重
await this.eventService.publish('user.created', userData);
// 相同的消息在TTL时间内不会被重复处理
```

### 批量处理

```typescript
// 批量发布消息
const messages = users.map(user => ({
  event: 'user.created',
  data: user
}));
await this.eventService.publishBatch(messages);
```

### 连接池优化

```typescript
// 连接池配置
rabbitmq:
  options:
    connectionTimeout: 30000
    frameMax: 4096
    channelMax: 1000
```

## 🧪 测试

### 单元测试

```bash
npm run test
```

### 集成测试

```bash
npm run test:integration
```

### 性能测试

```typescript
import { PerformanceBenchmark } from '@hl8/messaging';

const benchmark = new PerformanceBenchmark();
await benchmark.runAllTests();
```

## 📊 监控指标

### 基础指标

- **消息吞吐量**: 消息/秒
- **处理延迟**: 平均/最大延迟
- **错误率**: 失败消息比例
- **连接状态**: 连接健康状态

### 租户指标

- **租户消息量**: 每个租户的消息统计
- **租户隔离**: 隔离效果验证
- **租户性能**: 租户级别的性能指标

### 缓存指标

- **缓存命中率**: 消息去重缓存命中率
- **缓存性能**: 缓存操作延迟
- **内存使用**: 缓存内存占用

## 🚨 故障排除

### 常见问题

#### 连接问题

```typescript
// 检查连接状态
const health = await this.monitor.getHealth();
console.log('连接状态:', health.connections);
```

#### 配置问题

```typescript
// 验证配置
const config = this.configService.get<MessagingConfig>('messaging');
console.log('当前配置:', config);
```

#### 性能问题

```typescript
// 查看性能统计
const stats = this.statsService.getStats();
console.log('性能统计:', stats);
```

### 调试模式

```typescript
// 启用调试日志
MessagingConfigModule.forRoot({
  configPath: './config/messaging.yml',
  debug: true, // 启用调试模式
})
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [HL8 SAAS平台](https://github.com/hl8-saas)
- [NestJS文档](https://nestjs.com/)
- [RabbitMQ文档](https://www.rabbitmq.com/documentation.html)
- [Redis文档](https://redis.io/documentation)
- [Apache Kafka文档](https://kafka.apache.org/documentation/)

## 📞 支持

如果您遇到问题或有任何疑问，请：

1. 查看 [FAQ](docs/FAQ.md)
2. 搜索 [Issues](https://github.com/hl8-saas/hl8-saas-nx-mono/issues)
3. 创建新的 [Issue](https://github.com/hl8-saas/hl8-saas-nx-mono/issues/new)
4. 联系开发团队

---

**@hl8/messaging** - 让消息传递变得简单、可靠、高效！ 🚀
