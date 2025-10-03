# 基础设施层常量管理

## 概述

基础设施层常量管理提供了统一的常量定义，避免硬编码，提高代码可维护性和一致性。

## 文件结构

```
infrastructure/
├── constants.ts                    # 主常量定义文件
├── examples/
│   └── constants-usage.example.ts  # 使用示例
└── constants/
    └── README.md                   # 本文档
```

## 常量分类

### 1. 缓存相关常量 (`CACHE`)

```typescript
import { INFRASTRUCTURE_CONSTANTS } from './constants';

// 使用缓存常量
const cacheConfig = {
  ttl: INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_TTL,
  keyPrefix: INFRASTRUCTURE_CONSTANTS.CACHE.KEY_PREFIX,
  memoryCacheSize: INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_MEMORY_CACHE_SIZE,
};
```

**包含的常量：**

- `DEFAULT_TTL`: 默认缓存生存时间（3600秒）
- `DEFAULT_MEMORY_CACHE_SIZE`: 默认内存缓存大小（1000）
- `DEFAULT_REDIS_CACHE_SIZE`: 默认Redis缓存大小（10000）
- `KEY_PREFIX`: 缓存键前缀（'hybrid_archi'）
- `CLEANUP_INTERVAL`: 缓存清理间隔（300000毫秒）
- `HIT_RATE_THRESHOLD`: 缓存命中率阈值（0.8）

### 2. 数据库相关常量 (`DATABASE`)

```typescript
// 使用数据库常量
const dbConfig = {
  queryTimeout: INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_QUERY_TIMEOUT,
  connectionTimeout: INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_CONNECTION_TIMEOUT,
  poolSize: INFRASTRUCTURE_CONSTANTS.DATABASE.DEFAULT_POOL_SIZE,
};
```

**包含的常量：**

- `DEFAULT_QUERY_TIMEOUT`: 默认查询超时（30000毫秒）
- `DEFAULT_CONNECTION_TIMEOUT`: 默认连接超时（10000毫秒）
- `DEFAULT_TRANSACTION_TIMEOUT`: 默认事务超时（60000毫秒）
- `DEFAULT_POOL_SIZE`: 默认连接池大小（10）
- `DEFAULT_RETRY_COUNT`: 默认重试次数（3）
- `SLOW_QUERY_THRESHOLD`: 慢查询阈值（1000毫秒）

### 3. 消息队列相关常量 (`MESSAGE_QUEUE`)

```typescript
// 使用消息队列常量
const mqConfig = {
  messageTtl: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_MESSAGE_TTL,
  retryCount: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_RETRY_COUNT,
  queueSize: INFRASTRUCTURE_CONSTANTS.MESSAGE_QUEUE.DEFAULT_QUEUE_SIZE,
};
```

**包含的常量：**

- `DEFAULT_MESSAGE_TTL`: 默认消息TTL（300000毫秒）
- `DEFAULT_RETRY_COUNT`: 默认重试次数（3）
- `DEFAULT_QUEUE_SIZE`: 默认队列大小（1000）
- `DEFAULT_BATCH_SIZE`: 默认批处理大小（100）
- `PRIORITY`: 消息优先级枚举

### 4. 事件存储相关常量 (`EVENT_STORE`)

```typescript
// 使用事件存储常量
const eventStoreConfig = {
  eventTtl: INFRASTRUCTURE_CONSTANTS.EVENT_STORE.DEFAULT_EVENT_TTL,
  snapshotInterval: INFRASTRUCTURE_CONSTANTS.EVENT_STORE.DEFAULT_SNAPSHOT_INTERVAL,
  batchSize: INFRASTRUCTURE_CONSTANTS.EVENT_STORE.DEFAULT_BATCH_SIZE,
};
```

**包含的常量：**

- `DEFAULT_EVENT_TTL`: 默认事件TTL（86400000毫秒）
- `DEFAULT_SNAPSHOT_INTERVAL`: 默认快照间隔（100）
- `DEFAULT_BATCH_SIZE`: 默认批处理大小（1000）

### 5. 端口适配器相关常量 (`PORT_ADAPTERS`)

```typescript
// 使用端口适配器常量
const adapterConfig = {
  healthCheckInterval: INFRASTRUCTURE_CONSTANTS.PORT_ADAPTERS.DEFAULT_HEALTH_CHECK_INTERVAL,
  retryCount: INFRASTRUCTURE_CONSTANTS.PORT_ADAPTERS.DEFAULT_RETRY_COUNT,
  timeout: INFRASTRUCTURE_CONSTANTS.PORT_ADAPTERS.DEFAULT_TIMEOUT,
};
```

**包含的常量：**

- `DEFAULT_HEALTH_CHECK_INTERVAL`: 默认健康检查间隔（30000毫秒）
- `DEFAULT_RETRY_COUNT`: 默认重试次数（3）
- `DEFAULT_TIMEOUT`: 默认超时时间（5000毫秒）
- `TYPE`: 适配器类型枚举
- `HEALTH_STATUS`: 健康状态枚举

### 6. 映射器相关常量 (`MAPPERS`)

```typescript
// 使用映射器常量
const mapperConfig = {
  cacheSize: INFRASTRUCTURE_CONSTANTS.MAPPERS.DEFAULT_CACHE_SIZE,
  ttl: INFRASTRUCTURE_CONSTANTS.MAPPERS.DEFAULT_TTL,
};
```

**包含的常量：**

- `DEFAULT_CACHE_SIZE`: 默认缓存大小（100）
- `DEFAULT_TTL`: 默认TTL（3600000毫秒）
- `TYPE`: 映射器类型枚举
- `STATUS`: 映射器状态枚举

### 7. 工厂相关常量 (`FACTORIES`)

```typescript
// 使用工厂常量
const factoryConfig = {
  serviceStartTimeout: INFRASTRUCTURE_CONSTANTS.FACTORIES.DEFAULT_SERVICE_START_TIMEOUT,
  serviceStopTimeout: INFRASTRUCTURE_CONSTANTS.FACTORIES.DEFAULT_SERVICE_STOP_TIMEOUT,
  healthCheckTimeout: INFRASTRUCTURE_CONSTANTS.FACTORIES.DEFAULT_HEALTH_CHECK_TIMEOUT,
};
```

**包含的常量：**

- `DEFAULT_SERVICE_START_TIMEOUT`: 默认服务启动超时（30000毫秒）
- `DEFAULT_SERVICE_STOP_TIMEOUT`: 默认服务停止超时（10000毫秒）
- `DEFAULT_HEALTH_CHECK_TIMEOUT`: 默认健康检查超时（5000毫秒）
- `TYPE`: 工厂类型枚举

## 错误消息常量

### 错误码常量 (`ERROR_CODES`)

```typescript
// 使用错误码常量
const errorCode = INFRASTRUCTURE_CONSTANTS.ERROR_CODES.CACHE.KEY_NOT_FOUND;
```

### 错误消息常量 (`INFRASTRUCTURE_ERROR_MESSAGES`)

```typescript
// 使用错误消息常量
const errorMessage = INFRASTRUCTURE_ERROR_MESSAGES.CACHE.KEY_NOT_FOUND;
```

## 默认配置常量

### 默认配置 (`INFRASTRUCTURE_DEFAULT_CONFIG`)

```typescript
// 使用默认配置
const config = INFRASTRUCTURE_DEFAULT_CONFIG.CACHE;
```

## 使用示例

### 1. 基本使用

```typescript
import { INFRASTRUCTURE_CONSTANTS } from './constants';

// 创建缓存配置
const cacheConfig = {
  ttl: INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_TTL,
  keyPrefix: INFRASTRUCTURE_CONSTANTS.CACHE.KEY_PREFIX,
  memoryCacheSize: INFRASTRUCTURE_CONSTANTS.CACHE.DEFAULT_MEMORY_CACHE_SIZE,
};
```

### 2. 错误处理

```typescript
import { INFRASTRUCTURE_ERROR_MESSAGES } from './constants';

// 获取错误消息
const errorMessage = INFRASTRUCTURE_ERROR_MESSAGES.CACHE.KEY_NOT_FOUND;
```

### 3. 配置管理

```typescript
import { INFRASTRUCTURE_DEFAULT_CONFIG } from './constants';

// 使用默认配置
const config = INFRASTRUCTURE_DEFAULT_CONFIG.DATABASE;
```

### 4. 类型检查

```typescript
import { INFRASTRUCTURE_CONSTANTS } from './constants';

// 检查缓存级别
const isValidLevel = Object.values(INFRASTRUCTURE_CONSTANTS.CACHE.LEVEL).includes(level);
```

## 最佳实践

### 1. 常量命名

- 使用 `UPPER_SNAKE_CASE` 命名
- 按功能模块分组
- 提供清晰的注释说明

### 2. 类型安全

- 使用 `as const` 确保类型安全
- 提供完整的 TypeScript 类型定义
- 使用命名空间避免命名冲突

### 3. 组织管理

- 按功能模块分组
- 每个模块内部按字母顺序排列
- 提供完整的 JSDoc 注释

### 4. 使用建议

- 优先使用常量而不是硬编码
- 通过常量进行配置管理
- 使用常量进行类型检查
- 通过常量进行错误处理

## 扩展指南

### 添加新常量

1. 在 `INFRASTRUCTURE_CONSTANTS` 中添加新的模块
2. 在 `INFRASTRUCTURE_ERROR_MESSAGES` 中添加对应的错误消息
3. 在 `INFRASTRUCTURE_DEFAULT_CONFIG` 中添加默认配置
4. 更新类型定义
5. 添加使用示例

### 修改现有常量

1. 确保向后兼容性
2. 更新相关文档
3. 更新使用示例
4. 进行充分的测试

## 注意事项

1. **类型安全**: 所有常量都使用 `as const` 确保类型安全
2. **命名空间**: 使用命名空间避免命名冲突
3. **文档完整**: 提供完整的 JSDoc 注释
4. **向后兼容**: 修改常量时确保向后兼容性
5. **测试覆盖**: 确保常量使用的测试覆盖

## 相关文件

- `constants.ts`: 主常量定义文件
- `examples/constants-usage.example.ts`: 使用示例
- `README.md`: 本文档
