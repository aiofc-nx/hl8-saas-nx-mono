# 消息队列模块异常处理指南

## 概述

`@hl8/messaging` 模块集成了 `@hl8/common/exceptions` 统一异常处理机制，提供标准化的错误处理、详细的错误信息和符合 RFC7807 标准的错误响应格式。

## 核心特性

- ✅ **标准化异常类**：专门为消息队列场景设计的异常类型
- ✅ **RFC7807 兼容**：符合标准的错误响应格式
- ✅ **多租户支持**：租户级别的错误处理和隔离
- ✅ **详细错误信息**：包含上下文数据和根本原因追踪
- ✅ **自动日志记录**：集成结构化日志记录
- ✅ **国际化支持**：多语言错误消息

## 异常类型

### 1. 连接异常 (MessagingConnectionException)

**触发场景**：

- 消息队列服务器不可用
- 网络连接超时
- 认证失败
- 配置错误

**HTTP状态码**：500 Internal Server Error  
**错误码**：`MESSAGING_CONNECTION_ERROR`

```typescript
import { MessagingConnectionException } from '@hl8/messaging';

// 抛出连接异常
throw new MessagingConnectionException(
  'RabbitMQ connection failed',
  'Unable to connect to RabbitMQ server',
  { adapter: 'rabbitmq', host: 'localhost', port: 5672 }
);
```

### 2. 消息发布异常 (MessagingPublishException)

**触发场景**：

- 消息格式错误
- 主题不存在
- 发布权限不足
- 消息队列满

**HTTP状态码**：400 Bad Request  
**错误码**：`MESSAGING_PUBLISH_ERROR`

```typescript
import { MessagingPublishException } from '@hl8/messaging';

// 抛出发布异常
throw new MessagingPublishException(
  'Failed to publish message',
  'Message format is invalid',
  { topic: 'user.created', messageId: 'msg-123' }
);
```

### 3. 消息消费异常 (MessagingConsumeException)

**触发场景**：

- 消息处理器执行失败
- 消息格式错误
- 业务逻辑错误
- 重试次数超限

**HTTP状态码**：500 Internal Server Error  
**错误码**：`MESSAGING_CONSUME_ERROR`

```typescript
import { MessagingConsumeException } from '@hl8/messaging';

// 抛出消费异常
throw new MessagingConsumeException(
  'Message processing failed',
  'Handler execution error',
  { topic: 'user.created', handler: 'UserEventHandler', messageId: 'msg-123' }
);
```

### 4. 适配器未找到异常 (MessagingAdapterNotFoundException)

**触发场景**：

- 适配器类型不存在
- 适配器未配置
- 适配器实例化失败

**HTTP状态码**：404 Not Found  
**错误码**：`MESSAGING_ADAPTER_NOT_FOUND`

```typescript
import { MessagingAdapterNotFoundException } from '@hl8/messaging';

// 抛出适配器未找到异常
throw new MessagingAdapterNotFoundException(
  'Adapter not found',
  'The requested messaging adapter does not exist',
  { adapterType: 'invalid-adapter' }
);
```

### 5. 租户隔离异常 (MessagingTenantIsolationException)

**触发场景**：

- 租户上下文缺失
- 跨租户访问
- 租户权限不足
- 租户隔离策略失败

**HTTP状态码**：403 Forbidden  
**错误码**：`MESSAGING_TENANT_ISOLATION_ERROR`

```typescript
import { MessagingTenantIsolationException } from '@hl8/messaging';

// 抛出租户隔离异常
throw new MessagingTenantIsolationException(
  'Tenant isolation violation',
  'Cross-tenant access is not allowed',
  { tenantId: 'tenant-123', resource: 'topic:user.events' }
);
```

### 6. 任务处理异常 (MessagingTaskException)

**触发场景**：

- 任务执行失败
- 任务调度错误
- 任务超时
- 任务重试失败

**HTTP状态码**：500 Internal Server Error  
**错误码**：`MESSAGING_TASK_ERROR`

```typescript
import { MessagingTaskException } from '@hl8/messaging';

// 抛出任务异常
throw new MessagingTaskException(
  'Task execution failed',
  'Task handler threw an error',
  { taskId: 'task-123', taskName: 'ProcessUserData' }
);
```

### 7. 配置异常 (MessagingConfigException)

**触发场景**：

- 配置参数无效
- 必填配置缺失
- 配置格式错误
- 配置冲突

**HTTP状态码**：400 Bad Request  
**错误码**：`MESSAGING_CONFIG_ERROR`

```typescript
import { MessagingConfigException } from '@hl8/messaging';

// 抛出配置异常
throw new MessagingConfigException(
  'Invalid messaging configuration',
  'RabbitMQ URL is required',
  { missingField: 'rabbitmq.url' }
);
```

### 8. 序列化异常 (MessagingSerializationException)

**触发场景**：

- 消息序列化失败
- 消息反序列化失败
- 消息格式不兼容
- 编码错误

**HTTP状态码**：400 Bad Request  
**错误码**：`MESSAGING_SERIALIZATION_ERROR`

```typescript
import { MessagingSerializationException } from '@hl8/messaging';

// 抛出序列化异常
throw new MessagingSerializationException(
  'Message serialization failed',
  'Unable to serialize message to JSON',
  { messageType: 'UserEvent', originalError: 'Invalid JSON' }
);
```

## 配置异常处理

### 基本配置

```typescript
import { MessagingModule } from '@hl8/messaging';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MessagingModule.forRoot({
      adapter: 'rabbitmq',
      rabbitmq: {
        url: 'amqp://localhost:5672',
      },
      // 配置异常处理文档URL
      documentationUrl: 'https://docs.hl8.com/messaging/errors',
    }),
  ],
})
export class AppModule {}
```

### 高级配置

```typescript
import { MessagingModule } from '@hl8/messaging';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    MessagingModule.forRoot({
      adapter: 'rabbitmq',
      rabbitmq: {
        url: 'amqp://localhost:5672',
      },
      // 异常处理配置
      documentationUrl: 'https://docs.hl8.com/messaging/errors',
      
      // 多租户配置
      multiTenancy: {
        context: {
          enableAutoInjection: true,
          contextTimeout: 30000,
          enableAuditLog: true,
        },
        isolation: {
          strategy: 'key-prefix',
          keyPrefix: 'hl8:messaging:',
          enableIsolation: true,
          level: 'strict',
        },
      },
    }),
  ],
})
export class AppModule {}
```

## 异常处理最佳实践

### 1. 异常捕获和处理

```typescript
import { Injectable } from '@nestjs/common';
import { MessagingService } from '@hl8/messaging';
import {
  MessagingConnectionException,
  MessagingPublishException,
} from '@hl8/messaging';

@Injectable()
export class UserService {
  constructor(private readonly messagingService: MessagingService) {}

  async createUser(userData: any) {
    try {
      // 发布用户创建事件
      await this.messagingService.publish('user.created', {
        id: userData.id,
        email: userData.email,
      });
    } catch (error) {
      if (error instanceof MessagingConnectionException) {
        // 连接错误 - 记录并重试
        this.logger.error('消息队列连接失败', {
          errorCode: error.errorCode,
          detail: error.detail,
        });
        await this.retryWithFallback(userData);
      } else if (error instanceof MessagingPublishException) {
        // 发布错误 - 记录详细错误信息
        this.logger.error('消息发布失败', {
          topic: error.data?.topic,
          tenantId: error.data?.tenantId,
        });
        // 可以选择降级处理
      }
      throw error;
    }
  }
}
```

### 2. 自定义异常过滤器

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { AnyExceptionFilter } from '@hl8/common/exceptions';
import { MessagingConnectionException } from '@hl8/messaging';

@Catch(MessagingConnectionException)
export class MessagingConnectionExceptionFilter extends AnyExceptionFilter {
  catch(exception: MessagingConnectionException, host: ArgumentsHost) {
    // 自定义连接异常处理逻辑
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    // 记录详细的连接错误信息
    this.logger.error('消息队列连接异常', {
      errorCode: exception.errorCode,
      adapterType: exception.data?.adapterType,
      host: exception.data?.host,
      port: exception.data?.port,
    });

    // 调用父类方法处理标准响应
    super.catch(exception, host);
  }
}
```

### 3. 错误响应格式

所有异常都会转换为符合 RFC7807 标准的错误响应：

```json
{
  "type": "https://docs.hl8.com/messaging/errors",
  "title": "Failed to connect to messaging queue",
  "detail": "Unable to establish connection to messaging queue",
  "status": 500,
  "instance": "req-123456",
  "errorCode": "MESSAGING_CONNECTION_ERROR",
  "data": {
    "adapterType": "rabbitmq",
    "host": "localhost",
    "port": 5672
  }
}
```

## 监控和日志

### 结构化日志记录

所有异常都会自动记录结构化日志：

```typescript
// 自动生成的日志
{
  "level": "error",
  "message": "消息队列连接失败",
  "errorCode": "MESSAGING_CONNECTION_ERROR",
  "adapterType": "rabbitmq",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req-123456",
  "tenantId": "tenant-123"
}
```

### 错误监控

```typescript
import { MessagingMonitorService } from '@hl8/messaging';

@Injectable()
export class ErrorMonitoringService {
  constructor(private readonly monitorService: MessagingMonitorService) {}

  async getErrorStats() {
    const stats = await this.monitorService.getErrorStats();
    
    return {
      totalErrors: stats.totalErrors,
      errorRate: stats.errorRate,
      topErrors: stats.topErrors,
      recentErrors: stats.recentErrors,
    };
  }
}
```

## 故障排除

### 常见问题

1. **连接异常**
   - 检查消息队列服务是否运行
   - 验证连接配置是否正确
   - 确认网络连接是否正常

2. **发布异常**
   - 检查消息格式是否正确
   - 验证主题是否存在
   - 确认发布权限是否足够

3. **租户隔离异常**
   - 检查租户上下文是否正确设置
   - 验证租户权限配置
   - 确认隔离策略是否正确

4. **配置异常**
   - 检查配置文件格式
   - 验证必填配置项
   - 确认配置值是否有效

### 调试技巧

1. **启用详细日志**

   ```typescript
   MessagingModule.forRoot({
     // ... 其他配置
     monitoring: {
       enableDebugLogs: true,
       logLevel: 'debug',
     },
   })
   ```

2. **使用健康检查**

   ```typescript
   import { HealthCheckService } from '@hl8/messaging';

   const healthStatus = await healthCheckService.executeHealthCheck();
   console.log('消息队列健康状态:', healthStatus);
   ```

3. **监控错误统计**

   ```typescript
   import { MessagingStatsService } from '@hl8/messaging';

   const errorStats = await statsService.getErrorStats();
   console.log('错误统计:', errorStats);
   ```

## 迁移指南

### 从旧版本迁移

如果你之前使用的是自定义异常处理，可以按照以下步骤迁移：

1. **更新依赖**

   ```json
   {
     "dependencies": {
       "@hl8/common": "workspace:*"
     }
   }
   ```

2. **更新异常导入**

   ```typescript
   // 旧版本
   import { MessagingError } from './custom-errors';

   // 新版本
   import { MessagingConnectionException } from '@hl8/messaging';
   ```

3. **更新异常抛出**

   ```typescript
   // 旧版本
   throw new MessagingError('Connection failed', 'CONNECTION_ERROR');

   // 新版本
   throw new MessagingConnectionException(
     'Connection failed',
     'Unable to connect to messaging queue',
     { adapter: 'rabbitmq' }
   );
   ```

4. **更新异常处理**

   ```typescript
   // 旧版本
   catch (error) {
     if (error instanceof MessagingError) {
       // 处理逻辑
     }
   }

   // 新版本
   catch (error) {
     if (error instanceof MessagingConnectionException) {
       // 处理逻辑
       console.log('错误码:', error.errorCode);
       console.log('详细信息:', error.data);
     }
   }
   ```

## 总结

`@hl8/messaging` 模块的异常处理机制提供了：

- **标准化**：统一的异常类型和错误响应格式
- **详细性**：丰富的上下文信息和错误追踪
- **可扩展性**：支持自定义异常过滤器和处理逻辑
- **可观测性**：完整的日志记录和监控支持
- **多租户**：租户级别的错误处理和隔离

通过使用这些异常处理机制，你可以构建更加健壮和可维护的消息队列应用。
