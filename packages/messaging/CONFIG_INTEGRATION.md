# 消息队列模块配置集成指南

## 概述

`@hl8/messaging` 模块现已深度集成 `@hl8/config` 模块，提供完全类型安全的配置管理。通过配置模块集成，开发者可以享受：

- **类型安全**：编译时和运行时的配置类型检查
- **配置验证**：自动的配置验证和错误提示
- **多源配置**：支持配置文件、环境变量、数据库等多种配置源
- **配置缓存**：高效的配置缓存和热更新
- **环境隔离**：不同环境的配置管理

## 🚀 核心特性

### 1. 类型安全的配置管理

- 完整的TypeScript类型定义
- 编译时类型检查
- 运行时配置验证
- 智能代码补全

### 2. 多源配置支持

- YAML/JSON配置文件
- 环境变量覆盖
- 数据库配置源
- 远程配置服务

### 3. 配置验证和错误处理

- 基于class-validator的验证
- 详细的错误信息和路径
- 启动时配置检查
- 配置不一致检测

### 4. 灵活的配置覆盖

- 环境变量优先级
- 配置文件合并
- 默认值支持
- 条件配置

## 📦 安装和配置

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
    MessagingModule.forRootWithConfig(configService),
  ],
})
export class AppModule {}
```

### 高级配置

```typescript
import { Module } from '@nestjs/common';
import { MessagingConfigModule } from '@hl8/messaging';
import { MessagingModule } from '@hl8/messaging';

@Module({
  imports: [
    // 异步配置加载
    MessagingConfigModule.forRootAsync({
      useFactory: async (databaseService: DatabaseService) => {
        // 从数据库加载配置
        const dbConfig = await databaseService.getMessagingConfig();
        
        // 从环境变量加载配置
        const envConfig = {
          adapter: process.env.MESSAGING_ADAPTER,
          keyPrefix: process.env.MESSAGING_KEY_PREFIX,
        };
        
        // 合并配置
        return {
          ...dbConfig,
          ...envConfig,
        };
      },
      inject: [DatabaseService],
    }),
    // 消息队列模块
    MessagingModule.forRootWithConfig(configService),
  ],
})
export class AppModule {}
```

## 🎯 配置文件格式

### YAML配置文件示例

```yaml
# config/messaging.yml
adapter: rabbitmq
keyPrefix: "hl8:messaging:"
enableTenantIsolation: true
documentationUrl: "https://docs.hl8.com/messaging/errors"

# RabbitMQ配置
rabbitmq:
  url: "amqp://localhost:5672"
  exchange: "hl8_saas"
  queuePrefix: "hl8_"
  heartbeat: 30
  options:
    connectionTimeout: 30000
    frameMax: 0x1000

# Redis配置
redis:
  host: "localhost"
  port: 6379
  db: 1
  streamPrefix: "hl8:messaging:stream:"
  options:
    retryDelayOnFailover: 100
    maxRetriesPerRequest: 3

# Kafka配置
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

# 缓存配置
cache:
  enableMessageDeduplication: true
  enableConsumerStateCache: true
  enableStatsCache: true
  enableDeadLetterCache: true
  enableTenantConfigCache: true
  keyPrefix: "hl8:messaging:cache:"
  cacheTTL:
    messageDedup: 300        # 5分钟
    consumerState: 3600      # 1小时
    stats: 60                # 1分钟
    deadLetter: 86400        # 24小时
    tenantConfig: 3600       # 1小时
  redis:
    host: "localhost"
    port: 6379
    db: 1

# 多租户配置
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
    tenantSubdomain: true
    validationTimeout: 5000
    strictValidation: true
  security:
    enableSecurityCheck: true
    maxFailedAttempts: 5
    lockoutDuration: 300000
    enableAuditLog: true
    enableIpWhitelist: false

# 监控配置
monitoring:
  enableStats: true
  enableHealthCheck: true
  statsInterval: 60000

# 重试配置
retry:
  maxRetries: 3
  retryDelay: 1000
  backoff: "exponential"
  enableDeadLetterQueue: true

# 租户配置（向后兼容）
tenant:
  enableIsolation: true
  tenantPrefix: "tenant:"
  autoCreateTenantQueues: true
  tenantQueueLimit: 100
```

### 环境变量配置

```bash
# .env 文件示例
MESSAGING_ADAPTER=rabbitmq
MESSAGING_KEY_PREFIX=hl8:messaging:
MESSAGING_ENABLE_TENANT_ISOLATION=true
MESSAGING_DOCUMENTATION_URL=https://docs.hl8.com/messaging/errors

# RabbitMQ 配置
MESSAGING_RABBITMQ__URL=amqp://localhost:5672
MESSAGING_RABBITMQ__EXCHANGE=hl8_saas
MESSAGING_RABBITMQ__QUEUE_PREFIX=hl8_
MESSAGING_RABBITMQ__HEARTBEAT=30

# Redis 配置
MESSAGING_REDIS__HOST=localhost
MESSAGING_REDIS__PORT=6379
MESSAGING_REDIS__DB=1
MESSAGING_REDIS__STREAM_PREFIX=hl8:messaging:stream:

# 缓存配置
MESSAGING_CACHE__ENABLE_MESSAGE_DEDUPLICATION=true
MESSAGING_CACHE__ENABLE_CONSUMER_STATE_CACHE=true
MESSAGING_CACHE__ENABLE_STATS_CACHE=true
MESSAGING_CACHE__KEY_PREFIX=hl8:messaging:cache:
MESSAGING_CACHE__CACHE_TTL__MESSAGE_DEDUP=300
MESSAGING_CACHE__CACHE_TTL__CONSUMER_STATE=3600
MESSAGING_CACHE__CACHE_TTL__STATS=60
MESSAGING_CACHE__REDIS__HOST=localhost
MESSAGING_CACHE__REDIS__PORT=6379
MESSAGING_CACHE__REDIS__DB=1

# 多租户配置
MESSAGING_MULTI_TENANCY__CONTEXT__ENABLE_AUTO_INJECTION=true
MESSAGING_MULTI_TENANCY__CONTEXT__CONTEXT_TIMEOUT=30000
MESSAGING_MULTI_TENANCY__CONTEXT__ENABLE_AUDIT_LOG=true
MESSAGING_MULTI_TENANCY__ISOLATION__STRATEGY=key-prefix
MESSAGING_MULTI_TENANCY__ISOLATION__KEY_PREFIX=hl8:messaging:
MESSAGING_MULTI_TENANCY__ISOLATION__ENABLE_ISOLATION=true
MESSAGING_MULTI_TENANCY__ISOLATION__LEVEL=strict

# 监控配置
MESSAGING_MONITORING__ENABLE_STATS=true
MESSAGING_MONITORING__ENABLE_HEALTH_CHECK=true
MESSAGING_MONITORING__STATS_INTERVAL=60000

# 重试配置
MESSAGING_RETRY__MAX_RETRIES=3
MESSAGING_RETRY__RETRY_DELAY=1000
MESSAGING_RETRY__BACKOFF=exponential
MESSAGING_RETRY__ENABLE_DEAD_LETTER_QUEUE=true
```

## 🔧 在服务中使用配置

### 基本用法

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingConfig } from '@hl8/messaging';
import { MessagingService } from '@hl8/messaging';

@Injectable()
export class MessageProcessor {
  constructor(
    private readonly configService: ConfigService,
    private readonly messagingService: MessagingService
  ) {}

  async processMessage() {
    // 获取完整配置
    const config = this.configService.get<MessagingConfig>('messaging');
    
    // 获取特定配置项
    const adapter = this.configService.get<string>('messaging.adapter');
    const cacheEnabled = this.configService.get<boolean>('messaging.cache.enableMessageDeduplication');
    
    // 使用配置进行业务逻辑
    if (config?.cache?.enableMessageDeduplication) {
      await this.messagingService.publish('user.created', userData);
    }
  }
}
```

### 高级用法

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingConfig } from '@hl8/messaging';

@Injectable()
export class AdvancedMessageProcessor {
  private readonly config: MessagingConfig;

  constructor(private readonly configService: ConfigService) {
    // 在构造函数中获取配置
    this.config = this.configService.get<MessagingConfig>('messaging')!;
  }

  async processMessage() {
    // 配置验证
    if (!this.config.adapter) {
      throw new Error('消息队列适配器未配置');
    }

    // 根据配置选择处理策略
    switch (this.config.adapter) {
      case 'rabbitmq':
        await this.processWithRabbitMQ();
        break;
      case 'redis':
        await this.processWithRedis();
        break;
      case 'kafka':
        await this.processWithKafka();
        break;
    }
  }

  private async processWithRabbitMQ() {
    const rabbitmqConfig = this.config.rabbitmq;
    if (!rabbitmqConfig) {
      throw new Error('RabbitMQ配置未找到');
    }
    
    // 使用RabbitMQ配置
    console.log(`连接到RabbitMQ: ${rabbitmqConfig.url}`);
  }

  private async processWithRedis() {
    const redisConfig = this.config.redis;
    if (!redisConfig) {
      throw new Error('Redis配置未找到');
    }
    
    // 使用Redis配置
    console.log(`连接到Redis: ${redisConfig.host}:${redisConfig.port}`);
  }

  private async processWithKafka() {
    const kafkaConfig = this.config.kafka;
    if (!kafkaConfig) {
      throw new Error('Kafka配置未找到');
    }
    
    // 使用Kafka配置
    console.log(`连接到Kafka: ${kafkaConfig.brokers.join(',')}`);
  }
}
```

## 🔍 配置验证和错误处理

### 自动验证

配置模块会自动验证配置的正确性：

```typescript
// 配置验证失败时会抛出详细的错误信息
@Module({
  imports: [
    MessagingConfigModule.forRoot({
      configPath: './config/messaging.yml',
      validate: true, // 启用验证（默认）
    }),
  ],
})
export class AppModule {}
```

### 自定义验证

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagingConfig } from '@hl8/messaging';

@Injectable()
export class ConfigValidator {
  constructor(private readonly configService: ConfigService) {}

  validateMessagingConfig(): void {
    const config = this.configService.get<MessagingConfig>('messaging');
    
    if (!config) {
      throw new Error('消息队列配置未找到');
    }

    // 自定义验证逻辑
    if (config.adapter === 'rabbitmq' && !config.rabbitmq) {
      throw new Error('RabbitMQ适配器需要配置rabbitmq选项');
    }

    if (config.adapter === 'redis' && !config.redis) {
      throw new Error('Redis适配器需要配置redis选项');
    }

    if (config.adapter === 'kafka' && !config.kafka) {
      throw new Error('Kafka适配器需要配置kafka选项');
    }

    // 缓存配置验证
    if (config.cache?.enableMessageDeduplication && !config.cache.keyPrefix) {
      throw new Error('启用消息去重需要配置缓存键前缀');
    }
  }
}
```

## 🚀 性能优化

### 配置缓存

```typescript
@Module({
  imports: [
    MessagingConfigModule.forRoot({
      configPath: './config/messaging.yml',
      cache: true, // 启用配置缓存（默认）
    }),
  ],
})
export class AppModule {}
```

### 配置预加载

```typescript
@Module({
  imports: [
    MessagingConfigModule.forRootAsync({
      useFactory: async () => {
        // 预加载配置，减少运行时开销
        const config = await this.loadConfig();
        return config;
      },
      cache: true,
    }),
  ],
})
export class AppModule {}
```

## 🔄 环境管理

### 开发环境配置

```yaml
# config/messaging.development.yml
adapter: memory  # 开发环境使用内存适配器
enableTenantIsolation: false
cache:
  enableMessageDeduplication: false  # 开发环境禁用缓存
```

### 生产环境配置

```yaml
# config/messaging.production.yml
adapter: rabbitmq
enableTenantIsolation: true
cache:
  enableMessageDeduplication: true
  enableConsumerStateCache: true
  cacheTTL:
    messageDedup: 300
    consumerState: 3600
```

### 测试环境配置

```yaml
# config/messaging.test.yml
adapter: memory
enableTenantIsolation: false
monitoring:
  enableStats: false  # 测试环境禁用统计
  enableHealthCheck: false
```

## 🚨 故障排除

### 常见问题

1. **配置验证失败**

   ```typescript
   // 检查配置文件格式
   const config = this.configService.get<MessagingConfig>('messaging');
   console.log('当前配置:', JSON.stringify(config, null, 2));
   ```

2. **环境变量未生效**

   ```bash
   # 检查环境变量前缀
   echo $MESSAGING_ADAPTER
   echo $MESSAGING_RABBITMQ__URL
   ```

3. **配置文件未找到**

   ```typescript
   MessagingConfigModule.forRoot({
     configPath: './config/messaging.yml',
     // 设置为可选，避免配置文件不存在时启动失败
   })
   ```

### 调试技巧

1. **启用配置调试**

   ```typescript
   @Module({
     imports: [
       MessagingConfigModule.forRoot({
         configPath: './config/messaging.yml',
         debug: true, // 启用调试模式
       }),
     ],
   })
   export class AppModule {}
   ```

2. **配置日志**

   ```typescript
   @Injectable()
   export class ConfigLogger {
     constructor(private readonly configService: ConfigService) {
       // 记录配置加载过程
       const config = this.configService.get<MessagingConfig>('messaging');
       console.log('消息队列配置已加载:', config);
     }
   }
   ```

## 📈 最佳实践

### 1. 配置文件组织

```text
config/
├── messaging.yml              # 基础配置
├── messaging.development.yml  # 开发环境配置
├── messaging.production.yml   # 生产环境配置
└── messaging.test.yml         # 测试环境配置
```

### 2. 环境变量命名规范

```bash
# 使用双下划线分隔嵌套配置
MESSAGING_RABBITMQ__URL=amqp://localhost:5672
MESSAGING_CACHE__CACHE_TTL__MESSAGE_DEDUP=300
```

### 3. 配置验证策略

- 启动时验证所有必需配置
- 运行时验证动态配置
- 提供详细的错误信息
- 支持配置修复建议

### 4. 性能优化建议

- 启用配置缓存
- 预加载常用配置
- 避免频繁的配置访问
- 使用配置服务单例

## 🎉 总结

通过集成 `@hl8/config` 模块，`@hl8/messaging` 现在提供了：

✅ **类型安全的配置管理**：完整的TypeScript支持和编译时检查  
✅ **灵活的配置源**：支持文件、环境变量、数据库等多种配置源  
✅ **自动配置验证**：基于class-validator的配置验证  
✅ **环境隔离支持**：不同环境的配置管理  
✅ **性能优化**：配置缓存和预加载  
✅ **开发体验**：智能代码补全和错误提示  

这个集成使 `@hl8/messaging` 成为一个更加完整、易用、可靠的企业级消息队列解决方案！
