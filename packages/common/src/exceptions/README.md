# 异常处理模块

## 概述

异常处理模块提供了统一的异常处理机制，支持标准化错误响应、消息提供者、自定义日志等功能。遵循RFC7807标准，集成自定义logger，支持多租户架构。

## 主要功能

### 标准化异常处理

- 遵循RFC7807标准的错误响应格式
- 支持Swagger文档自动生成
- 统一的异常处理机制

### 消息提供者支持

- 支持自定义消息提供者
- 支持消息参数替换
- 支持默认消息回退机制

### 自定义日志集成

- 集成@hl8/logger日志模块
- 结构化日志记录
- 支持错误追踪和监控

### 多租户支持

- 支持租户级别的错误消息定制
- 统一的异常处理适用于所有租户类型
- 支持租户特定的错误码和消息

## 快速开始

### 1. 基本配置

```typescript
import { ExceptionModule } from '@hl8/common/exceptions';

@Module({
  imports: [
    ExceptionModule.forRoot({
      documentationUrl: 'https://docs.example.com/errors',
      logLevel: 'error',
      enableStackTrace: true,
    }),
  ],
})
export class AppModule {}
```

### 2. 异步配置

```typescript
import { ExceptionModule } from '@hl8/common/exceptions';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ExceptionModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        documentationUrl: configService.get('EXCEPTION_DOCS_URL'),
        logLevel: configService.get('LOG_LEVEL', 'error'),
        enableStackTrace: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### 3. 使用异常

```typescript
import { 
  GeneralNotFoundException,
  GeneralBadRequestException,
  GeneralInternalServerException 
} from '@hl8/common/exceptions';

// 资源未找到异常
throw new GeneralNotFoundException(
  'User not found',
  'The user with ID "user-123" does not exist',
  { userId: 'user-123' }
);

// 错误请求异常
throw new GeneralBadRequestException(
  'Invalid email format',
  'The email address must be a valid email format',
  { field: 'email', value: 'invalid-email' }
);

// 内部服务器错误异常
throw new GeneralInternalServerException(
  'Database operation failed',
  'Unable to save user data to database',
  { operation: 'createUser', table: 'users' },
  originalError
);
```

## 自定义异常

### 创建自定义异常

```typescript
import { AbstractHttpException } from '@hl8/common/exceptions';

export class UserNotFoundException extends AbstractHttpException {
  constructor(userId: string) {
    super(
      'USER_NOT_FOUND',
      'User not found',
      'The user with the specified ID does not exist',
      404,
      { userId },
      'USER_NOT_FOUND',
      new Error('User not found in database')
    );
  }
}

// 使用自定义异常
throw new UserNotFoundException('user-123');
```

### 创建业务特定异常

```typescript
export class InsufficientPermissionsException extends AbstractHttpException {
  constructor(resource: string, action: string) {
    super(
      'INSUFFICIENT_PERMISSIONS',
      'Insufficient permissions',
      `You do not have permission to ${action} ${resource}`,
      403,
      { resource, action },
      'INSUFFICIENT_PERMISSIONS'
    );
  }
}
```

## 自定义消息提供者

### 实现消息提供者

```typescript
import { ExceptionMessageProvider } from '@hl8/common/exceptions';

export class CustomMessageProvider implements ExceptionMessageProvider {
  private messages = {
    'USER_NOT_FOUND': {
      title: 'User Not Found',
      detail: 'The user with ID "{userId}" does not exist'
    },
    'INSUFFICIENT_PERMISSIONS': {
      title: 'Insufficient Permissions',
      detail: 'You do not have permission to {action} {resource}'
    }
  };

  getMessage(errorCode: string, messageType: 'title' | 'detail', params?: Record<string, any>): string | undefined {
    const message = this.messages[errorCode]?.[messageType];
    if (!message) return undefined;

    if (params) {
      return message.replace(/\{(\w+)\}/g, (match, key) => {
        return params[key]?.toString() || match;
      });
    }

    return message;
  }

  hasMessage(errorCode: string, messageType: 'title' | 'detail'): boolean {
    return !!this.messages[errorCode]?.[messageType];
  }

  getAvailableErrorCodes(): string[] {
    return Object.keys(this.messages);
  }
}
```

### 使用自定义消息提供者

```typescript
@Module({
  imports: [
    ExceptionModule.forRoot({
      documentationUrl: 'https://docs.example.com/errors',
      messageProvider: new CustomMessageProvider(),
    }),
  ],
})
export class AppModule {}
```

## 配置选项

### ExceptionConfig 接口

```typescript
interface ExceptionConfig {
  // 文档链接URL
  documentationUrl?: string;
  
  // 消息提供者
  messageProvider?: ExceptionMessageProvider;
  
  // 日志级别
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  
  // 是否启用堆栈跟踪
  enableStackTrace?: boolean;
  
  // 是否启用请求日志记录
  enableRequestLogging?: boolean;
  
  // 是否启用响应日志记录
  enableResponseLogging?: boolean;
  
  // 是否启用性能监控
  enablePerformanceMonitoring?: boolean;
}
```

## 错误响应格式

所有异常都会转换为符合RFC7807标准的错误响应格式：

```json
{
  "type": "https://docs.example.com/errors#user-not-found",
  "title": "User Not Found",
  "detail": "The user with ID \"user-123\" does not exist",
  "status": 404,
  "instance": "req-456",
  "errorCode": "USER_NOT_FOUND",
  "data": {
    "userId": "user-123"
  }
}
```

## 日志记录

异常处理模块会自动记录结构化日志：

```json
{
  "level": "error",
  "message": "HTTP exception occurred",
  "exception": {
    "errorCode": "USER_NOT_FOUND",
    "status": 404,
    "title": "User Not Found",
    "detail": "The user with ID \"user-123\" does not exist",
    "hasData": true,
    "hasRootCause": true
  },
  "request": {
    "id": "req-456",
    "method": "GET",
    "url": "/api/users/user-123",
    "headers": { ... }
  },
  "response": {
    "status": 404,
    "errorCode": "USER_NOT_FOUND"
  }
}
```

## 最佳实践

### 1. 异常命名规范

- 使用描述性的异常名称
- 遵循 `{Entity}{Action}Exception` 格式
- 例如：`UserNotFoundException`, `PermissionDeniedException`

### 2. 错误码规范

- 使用大写字母和下划线
- 遵循 `{MODULE}_{ACTION}` 格式
- 例如：`USER_NOT_FOUND`, `PERMISSION_DENIED`

### 3. 消息提供者

- 提供一致的消息格式
- 支持消息参数替换
- 使用描述性的错误消息

### 4. 日志记录

- 记录足够的上下文信息
- 避免记录敏感信息
- 使用结构化日志格式

### 5. 性能考虑

- 避免在异常构造函数中执行重操作
- 合理使用堆栈跟踪
- 考虑生产环境的日志级别

## 故障排除

### 常见问题

1. **异常过滤器未生效**
   - 检查是否正确注册了异常过滤器
   - 确认模块导入顺序

2. **消息提供者不工作**
   - 检查消息提供者配置
   - 确认消息键值正确

3. **日志记录不完整**
   - 检查logger配置
   - 确认日志级别设置

### 调试技巧

1. 启用详细日志记录
2. 检查异常堆栈跟踪
3. 验证消息提供者配置
4. 测试异常响应格式

## 更新日志

### v1.0.0

- 初始版本发布
- 支持基本异常处理功能
- 集成自定义logger
- 支持消息提供者
- 遵循RFC7807标准
- 移除i18n依赖，简化架构
