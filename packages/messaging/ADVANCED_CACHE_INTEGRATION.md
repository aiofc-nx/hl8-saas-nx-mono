# 高级缓存集成功能文档

## 🎯 概述

本文档详细介绍了`@hl8/messaging`模块第二阶段的高级缓存集成功能，包括死信队列缓存、租户配置缓存、高级监控缓存等企业级功能。

## 🚀 第二阶段功能特性

### 1. 死信队列缓存服务 (DeadLetterCacheService)

#### 核心功能

- **失败消息存储**: 自动存储处理失败的消息到死信队列
- **智能重试机制**: 支持指数退避策略的自动重试
- **错误分类**: 根据错误类型判断是否可重试
- **批量操作**: 支持批量重试和清理操作
- **统计分析**: 提供详细的死信队列统计信息

#### 主要方法

```typescript
// 存储死信消息
await deadLetterCache.storeDeadMessage(message, error, retryCount, tenantId);

// 获取死信消息
const deadMessage = await deadLetterCache.getDeadMessage(messageId, tenantId);

// 重试死信消息
const result = await deadLetterCache.retryDeadMessage(messageId, handler, tenantId);

// 批量重试
const batchResult = await deadLetterCache.batchRetryDeadMessages(messageIds, handler, tenantId);

// 获取统计信息
const stats = await deadLetterCache.getDeadLetterStats(tenantId);
```

#### 配置选项

```typescript
interface DeadLetterConfig {
  cacheTTL: number;           // 缓存TTL（默认24小时）
  keyPrefix: string;          // 缓存键前缀
  retryStrategy: 'exponential' | 'linear' | 'fixed';  // 重试策略
  maxRetries: number;         // 最大重试次数
  retryDelays: number[];      // 重试延迟配置
}
```

### 2. 租户配置缓存服务 (TenantConfigCacheService)

#### 核心功能

- **动态配置管理**: 支持租户级别的消息队列配置
- **配置继承**: 支持配置继承和默认值回退
- **实时更新**: 配置变更实时生效，支持缓存刷新
- **批量操作**: 支持批量更新多个租户配置
- **配置验证**: 完整的配置验证和错误处理

#### 主要方法

```typescript
// 获取租户配置
const config = await tenantConfigCache.getTenantConfig(tenantId, forceRefresh);

// 更新租户配置
const result = await tenantConfigCache.updateTenantConfig(tenantId, config, persist);

// 批量更新配置
const batchResult = await tenantConfigCache.batchUpdateTenantConfigs(updates, persist);

// 删除租户配置
const deleteResult = await tenantConfigCache.deleteTenantConfig(tenantId, deleteFromSource);

// 获取配置统计
const stats = await tenantConfigCache.getTenantConfigStats(tenantId);
```

#### 配置结构

```typescript
interface TenantMessagingConfig {
  tenantId: string;
  queuePrefix: string;
  exchangePrefix: string;
  maxRetries: number;
  retryDelay: number;
  retryBackoff: 'linear' | 'exponential' | 'fixed';
  enableDeadLetterQueue: boolean;
  deadLetterTTL: number;
  maxMessageSize: number;
  enableMessageCompression: boolean;
  compressionThreshold: number;
  enableMessageEncryption: boolean;
  routingRules: RoutingRule[];
  rateLimit: RateLimitConfig;
  monitoring: MonitoringConfig;
  createdAt: string;
  updatedAt: string;
}
```

### 3. 高级监控缓存服务 (AdvancedMonitoringCacheService)

#### 核心功能

- **实时指标收集**: 收集消息处理、队列性能、错误等实时指标
- **历史趋势分析**: 提供历史数据分析和趋势预测
- **智能告警**: 基于阈值的智能告警系统
- **性能优化**: 高效的数据存储和查询机制
- **数据清理**: 自动清理过期的监控数据

#### 主要方法

```typescript
// 记录消息处理指标
await monitoringCache.recordMessageProcessed(messageId, processingTime, messageSize, status, tenantId);

// 记录队列性能指标
await monitoringCache.recordQueueMetrics(queueName, metrics, tenantId);

// 记录错误指标
await monitoringCache.recordErrorMetrics(error, context, tenantId);

// 获取实时监控指标
const realtimeMetrics = await monitoringCache.getRealtimeMetrics(tenantId, timeRange);

// 获取历史趋势分析
const trends = await monitoringCache.getHistoricalTrends(tenantId, timeRange, granularity);

// 获取告警状态
const alertStatus = await monitoringCache.getAlertStatus(tenantId, thresholds);
```

#### 监控指标

```typescript
interface RealtimeMetrics {
  messagesProcessed: number;      // 已处理消息数
  avgProcessingTime: number;      // 平均处理时间
  throughput: number;            // 吞吐量（消息/秒）
  errorRate: number;             // 错误率
  queueDepths: Record<string, number>;  // 队列深度
  topErrors: ErrorMetrics[];     // 主要错误
  performanceTrend: 'improving' | 'stable' | 'degrading';
}
```

## 🔧 集成配置

### 模块配置

```typescript
MessagingModule.forRoot({
  adapter: MessagingAdapterType.RABBITMQ,
  cache: {
    // 基础缓存配置
    enableMessageDeduplication: true,
    enableConsumerStateCache: true,
    
    // 高级缓存配置
    enableDeadLetterCache: true,
    enableTenantConfigCache: true,
    enableAdvancedMonitoringCache: true,
    
    // 缓存TTL配置
    cacheTTL: {
      messageDedup: 300,        // 消息去重：5分钟
      consumerState: 3600,      // 消费者状态：1小时
      deadLetter: 86400,        // 死信队列：24小时
      tenantConfig: 3600,       // 租户配置：1小时
      stats: 60,                // 统计信息：1分钟
    },
    
    // Redis配置
    redis: {
      host: 'localhost',
      port: 6379,
      db: 2,
    },
  },
})
```

### 环境变量配置

```bash
# 高级缓存配置
MESSAGING_CACHE__ENABLE_DEAD_LETTER_CACHE=true
MESSAGING_CACHE__ENABLE_TENANT_CONFIG_CACHE=true
MESSAGING_CACHE__ENABLE_ADVANCED_MONITORING_CACHE=true

# 缓存TTL配置
MESSAGING_CACHE__CACHE_TTL__DEAD_LETTER=86400
MESSAGING_CACHE__CACHE_TTL__TENANT_CONFIG=3600
MESSAGING_CACHE__CACHE_TTL__STATS=60

# Redis配置
MESSAGING_CACHE__REDIS__HOST=localhost
MESSAGING_CACHE__REDIS__PORT=6379
MESSAGING_CACHE__REDIS__DB=2
```

## 📊 使用示例

### 完整使用示例

```typescript
import { Injectable } from '@nestjs/common';
import {
  DeadLetterCacheService,
  TenantConfigCacheService,
  AdvancedMonitoringCacheService,
  TenantContextService,
} from '@hl8/messaging';

@Injectable()
export class AdvancedMessagingService {
  constructor(
    private readonly deadLetterCache: DeadLetterCacheService,
    private readonly tenantConfigCache: TenantConfigCacheService,
    private readonly monitoringCache: AdvancedMonitoringCacheService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async processMessage(message: any) {
    const tenantId = this.tenantContextService.getTenant();
    const startTime = Date.now();

    try {
      // 获取租户配置
      const config = await this.tenantConfigCache.getTenantConfig(tenantId);
      
      // 处理消息
      await this.handleMessage(message, config);
      
      // 记录成功指标
      await this.monitoringCache.recordMessageProcessed(
        message.id,
        Date.now() - startTime,
        JSON.stringify(message).length,
        'success',
        tenantId
      );
      
    } catch (error) {
      // 记录失败指标
      await this.monitoringCache.recordMessageProcessed(
        message.id,
        Date.now() - startTime,
        JSON.stringify(message).length,
        'failed',
        tenantId
      );
      
      // 记录错误指标
      await this.monitoringCache.recordErrorMetrics(
        error,
        { messageId: message.id, queueName: 'main-queue' },
        tenantId
      );
      
      // 存储到死信队列
      await this.deadLetterCache.storeDeadMessage(
        message,
        error,
        0,
        tenantId
      );
    }
  }

  async getSystemHealth() {
    const tenantId = this.tenantContextService.getTenant();
    
    // 获取实时监控指标
    const metrics = await this.monitoringCache.getRealtimeMetrics(tenantId);
    
    // 获取告警状态
    const alerts = await this.monitoringCache.getAlertStatus(tenantId);
    
    // 获取死信队列统计
    const deadLetterStats = await this.deadLetterCache.getDeadLetterStats(tenantId);
    
    return {
      metrics,
      alerts,
      deadLetterStats,
      isHealthy: alerts.isHealthy && deadLetterStats.currentCount === 0,
    };
  }
}
```

## 🎯 性能优化

### 缓存策略

1. **分层缓存**: 实时指标使用短期缓存，历史数据使用长期缓存
2. **批量操作**: 支持批量读取和写入，减少网络开销
3. **异步处理**: 监控数据收集采用异步方式，不影响主业务
4. **智能清理**: 自动清理过期数据，保持缓存效率

### 内存优化

1. **数据压缩**: 大型监控数据自动压缩存储
2. **采样策略**: 高频数据采用采样存储
3. **分片存储**: 大量数据分片存储，提高查询效率
4. **LRU淘汰**: 使用LRU策略淘汰不常用数据

## 🔍 监控和告警

### 告警阈值配置

```typescript
interface AlertThresholds {
  maxThroughput: number;      // 最大吞吐量
  maxLatency: number;         // 最大延迟
  maxErrorRate: number;       // 最大错误率
  maxQueueDepth: number;      // 最大队列深度
}
```

### 告警级别

- **Critical**: 系统严重故障，需要立即处理
- **High**: 性能严重下降，需要及时处理
- **Medium**: 性能异常，需要关注
- **Low**: 轻微异常，可以观察

## 🧪 测试支持

### 单元测试

```typescript
describe('DeadLetterCacheService', () => {
  it('should store dead message correctly', async () => {
    const message = { id: 'test-msg', content: 'test' };
    const error = new Error('test error');
    
    const cacheKey = await service.storeDeadMessage(message, error, 0);
    expect(cacheKey).toBeDefined();
    
    const stored = await service.getDeadMessage('test-msg');
    expect(stored).toBeDefined();
    expect(stored.error.message).toBe('test error');
  });
});
```

### 集成测试

```typescript
describe('Advanced Cache Integration', () => {
  it('should work together seamlessly', async () => {
    // 测试所有高级缓存服务的协同工作
    await service.demonstrateComprehensiveUsage();
    
    const health = await service.getSystemHealth();
    expect(health.isHealthy).toBe(true);
  });
});
```

## 📈 最佳实践

### 1. 配置管理

- 为不同环境设置不同的缓存TTL
- 使用配置继承减少重复配置
- 定期刷新租户配置缓存

### 2. 错误处理

- 合理设置重试策略和次数
- 及时清理不可重试的死信消息
- 监控错误趋势，提前发现问题

### 3. 性能监控

- 设置合适的告警阈值
- 定期分析历史趋势
- 根据监控数据优化系统配置

### 4. 数据管理

- 定期清理过期监控数据
- 备份重要的配置和统计信息
- 监控缓存使用情况

## 🔗 相关文档

- [基础缓存集成文档](./CACHE_INTEGRATION.md)
- [配置管理文档](./CONFIG_INTEGRATION.md)
- [多租户集成文档](./MULTI_TENANCY_INTEGRATION.md)
- [API参考文档](./API_REFERENCE.md)

## 📞 支持

如有问题或建议，请联系开发团队或提交Issue。

---

**@hl8/messaging 高级缓存集成** - 让企业级消息队列更加智能、可靠、高效！ 🚀
