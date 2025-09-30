# @hl8/logger 模块技术设计方案

## 🎯 模块概述

### **模块定位**

`@hl8/logger` 是 SAAS 平台的基础设施层日志模块，基于 Pino 提供高性能、结构化、类型安全的日志记录功能。

### **核心特性**

- 🚀 **高性能**: 基于 Pino 的异步日志记录
- 🏗️ **结构化**: 支持 JSON 格式的结构化日志
- 🔒 **类型安全**: 完整的 TypeScript 类型支持
- 🌐 **请求追踪**: 基于 AsyncLocalStorage 的请求上下文管理
- 🔌 **框架集成**: 深度集成 NestJS 和 Fastify
- 🎨 **装饰器支持**: 提供依赖注入和上下文装饰器
- 📊 **多级别**: 支持 trace、debug、info、warn、error、fatal
- 🎯 **企业级**: 支持生产环境的高性能日志记录

### **设计原则**

1. **通用性**: 提供通用的日志记录功能，不包含业务特定逻辑
2. **性能优先**: 基于 Pino 的高性能异步日志记录
3. **类型安全**: 完整的 TypeScript 类型支持
4. **可扩展性**: 支持灵活的上下文扩展和自定义配置
5. **框架集成**: 深度集成 NestJS 和 Fastify 生态系统

## 🏗️ 架构设计

### **整体架构**

```
┌─────────────────────────────────────────────────────────────┐
│                    @hl8/logger 模块                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   PinoLogger    │  │  NestJSLogger   │  │   Middleware    │ │
│  │   (核心日志器)   │  │  (NestJS适配)   │  │   (中间件)      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Context Store  │  │   Decorators    │  │   Types &       │ │
│  │  (上下文存储)    │  │   (装饰器)      │  │   Interfaces    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Pino (底层日志库)                        │
└─────────────────────────────────────────────────────────────┘
```

### **核心组件**

#### **1. PinoLogger (核心日志器)**

- **职责**: 提供核心的日志记录功能
- **特性**: 高性能、结构化、多级别日志
- **集成**: 深度集成 Pino 和 AsyncLocalStorage

#### **2. NestJSLogger (NestJS适配器)**

- **职责**: 适配 NestJS 的 LoggerService 接口
- **特性**: 无缝集成 NestJS 生态系统
- **支持**: 依赖注入、生命周期管理

#### **3. Context Store (上下文存储)**

- **职责**: 管理请求级别的上下文信息
- **特性**: 基于 AsyncLocalStorage 的上下文隔离
- **支持**: 请求追踪、用户识别、自定义元数据

#### **4. Decorators (装饰器)**

- **职责**: 提供依赖注入和上下文装饰器
- **特性**: 类型安全的依赖注入和上下文访问
- **支持**: @InjectLogger、@RequestContext、@LogContext

#### **5. Middleware (中间件)**

- **职责**: 提供 Fastify 中间件集成
- **特性**: 自动请求日志记录、错误处理
- **支持**: 请求开始、完成、错误日志

## 🔧 核心功能

### **1. 日志记录功能**

#### **多级别日志支持**

```typescript
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}
```

#### **结构化日志**

```typescript
// 基础日志记录
logger.info('User logged in', { userId: 'user-123', ip: '192.168.1.1' });

// 错误日志记录
logger.error('Database connection failed', { 
  error: error.message,
  stack: error.stack,
  database: 'postgres'
});

// 性能日志记录
logger.info('Request completed', {
  method: 'POST',
  url: '/api/users',
  statusCode: 201,
  duration: 150,
  requestId: 'req-123'
});
```

### **2. 请求上下文管理**

#### **RequestContext 接口**

```typescript
export interface RequestContext {
  /** 请求唯一标识 */
  requestId: string;
  /** 用户ID */
  userId?: string;
  /** 追踪ID */
  traceId?: string;
  /** 会话ID */
  sessionId?: string;
  /** 自定义上下文数据 */
  metadata?: RequestMetadata;
}
```

#### **上下文存储和访问**

```typescript
// 设置请求上下文
logger.setContext({
  requestId: 'req-123',
  userId: 'user-456',
  traceId: 'trace-789',
  metadata: { tenantId: 'tenant-101' }
});

// 获取当前上下文
const context = logger.getContext();
console.log(`Request ID: ${context?.requestId}`);
```

### **3. 装饰器支持**

#### **@InjectLogger 装饰器**

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectLogger('UserService') private readonly logger: PinoLogger
  ) {}

  async createUser(userData: CreateUserDto) {
    this.logger.info('Creating user', { userData });
    // 业务逻辑
  }
}
```

#### **@RequestContext 装饰器**

```typescript
@Controller('users')
export class UserController {
  @Get(':id')
  async getUser(
    @Param('id') id: string,
    @RequestContext('userId') userId: string
  ) {
    // userId 自动从请求上下文中提取
    return this.userService.findById(id);
  }
}
```

#### **@LogContext 装饰器**

```typescript
@Injectable()
export class UserService {
  @LogContext({ service: 'UserService', version: '1.0.0' })
  async createUser(userData: CreateUserDto) {
    // 自动设置日志上下文
    this.logger.info('Creating user', { userData });
  }
}
```

### **4. 中间件集成**

#### **Fastify 中间件**

```typescript
// 自动请求日志记录
app.register(fastifyMiddleware, {
  enableRequestLogging: true,
  enableResponseLogging: true,
  requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
});

// 中间件功能
// - 自动生成请求ID
// - 记录请求开始时间
// - 记录请求完成状态
// - 记录请求错误信息
// - 计算请求耗时
```

## 📊 类型系统

### **核心类型定义**

#### **日志级别类型**

```typescript
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}
```

#### **请求上下文类型**

```typescript
export interface RequestContext {
  requestId: string;
  userId?: string;
  traceId?: string;
  sessionId?: string;
  metadata?: RequestMetadata;
}

export interface RequestMetadata {
  [key: string]: unknown;
}
```

#### **日志条目类型**

```typescript
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: RequestContext;
  error?: Error;
  data?: Record<string, unknown>;
}
```

#### **模块配置类型**

```typescript
export interface LoggerModuleOptions {
  level?: LogLevel;
  pretty?: boolean;
  enableRequestLogging?: boolean;
  enableResponseLogging?: boolean;
  requestIdGenerator?: (req: FastifyRequest) => string;
  context?: RequestContext;
}
```

### **类型安全特性**

#### **泛型支持**

```typescript
export interface PinoLogger<T = unknown> {
  log(message: unknown, context?: T): void;
  verbose(message: unknown, context?: T): void;
  // ...
}
```

#### **类型推断**

```typescript
// 自动类型推断
const logger = getLogger('UserService');
logger.info('User created', { userId: '123' }); // 自动推断类型
```

## 🔄 加载流程

### **模块初始化流程**

```
1. 模块配置加载
   ├── 环境变量读取
   ├── 配置文件解析
   └── 默认配置应用

2. Pino 实例创建
   ├── 日志级别设置
   ├── 格式化器配置
   └── 传输器配置

3. 上下文存储初始化
   ├── AsyncLocalStorage 创建
   ├── 上下文管理器初始化
   └── 请求追踪器设置

4. 中间件注册
   ├── Fastify 中间件注册
   ├── 请求处理器设置
   └── 错误处理器配置

5. 装饰器注册
   ├── 依赖注入装饰器
   ├── 上下文装饰器
   └── 日志上下文装饰器
```

### **运行时流程**

```
请求到达 → 中间件拦截 → 上下文设置 → 业务处理 → 日志记录 → 响应返回
    ↓           ↓            ↓          ↓          ↓          ↓
  生成ID    提取信息      存储上下文   业务逻辑    记录日志    清理上下文
```

## 🛠️ 实现细节

### **1. PinoLogger 实现**

#### **核心日志记录**

```typescript
export class PinoLogger implements LoggerService {
  private readonly pino: Logger;
  private readonly store: ContextStore;

  constructor(options: LoggerModuleOptions = {}) {
    this.pino = this.createPinoInstance(options);
    this.store = new ContextStore();
  }

  private createPinoInstance(options: LoggerModuleOptions): Logger {
    const pinoOptions: LoggerOptions = {
      level: options.level || 'info',
      formatters: {
        level: (label) => ({ level: label }),
        log: (object) => {
          const context = this.store.getContext();
          return {
            ...object,
            requestId: context?.requestId,
            userId: context?.userId,
            traceId: context?.traceId,
            ...context?.metadata
          };
        }
      },
      ...(options.pretty && { transport: { target: 'pino-pretty' } })
    };

    return pino(pinoOptions);
  }
}
```

#### **上下文管理**

```typescript
export class ContextStore {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  setContext(context: RequestContext): void {
    this.asyncLocalStorage.enterWith(context);
  }

  getContext(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  clearContext(): void {
    this.asyncLocalStorage.exit(() => {});
  }
}
```

### **2. NestJS 集成**

#### **LoggerService 实现**

```typescript
export class NestJSLogger implements LoggerService {
  constructor(private readonly pinoLogger: PinoLogger) {}

  log(message: unknown, context?: string): void {
    this.pinoLogger.info(String(message), { context });
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.pinoLogger.error(String(message), { trace, context });
  }

  warn(message: unknown, context?: string): void {
    this.pinoLogger.warn(String(message), { context });
  }

  debug(message: unknown, context?: string): void {
    this.pinoLogger.debug(String(message), { context });
  }

  verbose(message: unknown, context?: string): void {
    this.pinoLogger.verbose(String(message), { context });
  }
}
```

#### **模块配置**

```typescript
@Module({})
export class LoggerModule {
  static forRoot(options: LoggerModuleOptions = {}): DynamicModule {
    const providers: Provider[] = [
      {
        provide: PinoLogger,
        useFactory: () => new PinoLogger(options)
      },
      {
        provide: NestJSLogger,
        useFactory: (pinoLogger: PinoLogger) => new NestJSLogger(pinoLogger),
        inject: [PinoLogger]
      },
      {
        provide: LoggerService,
        useExisting: NestJSLogger
      }
    ];

    return {
      module: LoggerModule,
      providers,
      exports: [PinoLogger, NestJSLogger, LoggerService],
      global: true
    };
  }
}
```

### **3. 中间件实现**

#### **Fastify 中间件**

```typescript
export class FastifyMiddleware {
  constructor(
    private readonly logger: PinoLogger,
    private readonly options: LoggerModuleOptions
  ) {}

  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const requestId = this.generateRequestId(request);
      const context: RequestContext = {
        requestId,
        userId: request.headers['x-user-id'] as string,
        traceId: request.headers['x-trace-id'] as string,
        metadata: {
          method: request.method,
          url: request.url,
          userAgent: request.headers['user-agent'],
          ip: request.ip
        }
      };

      this.logger.setContext(context);
      this.logger.logRequestStart(request, context);

      request.on('error', (error) => {
        this.logger.logRequestError(request, error, context);
      });

      reply.addHook('onSend', (request, reply, payload, done) => {
        this.logger.logRequestComplete(request, reply, context, Date.now() - request.startTime);
        done();
      });
    };
  }
}
```

## 🚨 错误处理

### **错误处理策略**

#### **日志记录错误**

```typescript
export class LoggerError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoggerError';
  }
}

export class ContextError extends LoggerError {
  constructor(message: string, originalError?: Error) {
    super(`Context error: ${message}`, originalError);
    this.name = 'ContextError';
  }
}
```

#### **错误恢复机制**

```typescript
export class PinoLogger {
  private logSafely(level: string, message: string, data?: any): void {
    try {
      this.pino[level](data, message);
    } catch (error) {
      // 降级到 console 输出
      console.error('Logger error:', error);
      console[level] || console.log(message, data);
    }
  }
}
```

### **异常处理**

#### **上下文异常**

```typescript
export class ContextStore {
  getContext(): RequestContext | undefined {
    try {
      return this.asyncLocalStorage.getStore();
    } catch (error) {
      console.error('Context access error:', error);
      return undefined;
    }
  }
}
```

#### **中间件异常**

```typescript
export class FastifyMiddleware {
  createMiddleware() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // 中间件逻辑
      } catch (error) {
        console.error('Middleware error:', error);
        // 继续请求处理，不中断
      }
    };
  }
}
```

## ⚡ 性能优化

### **性能特性**

#### **异步日志记录**

```typescript
export class PinoLogger {
  private readonly pino: Logger;

  constructor(options: LoggerModuleOptions = {}) {
    this.pino = pino({
      level: options.level || 'info',
      // 异步写入，不阻塞主线程
      sync: false,
      // 批量写入，提高性能
      batch: {
        size: 100,
        timeout: 1000
      }
    });
  }
}
```

#### **内存优化**

```typescript
export class ContextStore {
  private readonly contextCache = new Map<string, RequestContext>();

  setContext(context: RequestContext): void {
    // 限制缓存大小，避免内存泄漏
    if (this.contextCache.size > 1000) {
      this.contextCache.clear();
    }
    
    this.asyncLocalStorage.enterWith(context);
    this.contextCache.set(context.requestId, context);
  }
}
```

#### **性能监控**

```typescript
export class PerformanceMonitor {
  private readonly metrics = {
    logCount: 0,
    errorCount: 0,
    averageLatency: 0,
    memoryUsage: 0
  };

  recordLog(level: string, duration: number): void {
    this.metrics.logCount++;
    if (level === 'error') this.metrics.errorCount++;
    
    // 更新平均延迟
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.logCount - 1) + duration) / 
      this.metrics.logCount;
  }
}
```

### **配置优化**

#### **生产环境配置**

```typescript
export const productionConfig: LoggerModuleOptions = {
  level: 'info',
  pretty: false,
  enableRequestLogging: true,
  enableResponseLogging: false, // 生产环境关闭响应日志
  requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
};
```

#### **开发环境配置**

```typescript
export const developmentConfig: LoggerModuleOptions = {
  level: 'debug',
  pretty: true,
  enableRequestLogging: true,
  enableResponseLogging: true,
  requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
};
```

## 🔒 安全考虑

### **敏感信息过滤**

#### **数据脱敏**

```typescript
export class DataSanitizer {
  private readonly sensitiveKeys = [
    'password', 'secret', 'token', 'key', 'auth',
    'creditCard', 'ssn', 'phone', 'email'
  ];

  sanitize(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    
    for (const key of Object.keys(sanitized)) {
      if (this.sensitiveKeys.some(sensitive => 
        key.toLowerCase().includes(sensitive.toLowerCase())
      )) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }
}
```

#### **日志级别控制**

```typescript
export class SecurityLogger {
  constructor(private readonly logger: PinoLogger) {}

  logSecurityEvent(event: string, data: any): void {
    // 安全事件始终记录，不受级别限制
    this.logger.error(`Security: ${event}`, this.sanitize(data));
  }

  logAccessAttempt(userId: string, resource: string, success: boolean): void {
    this.logger.warn('Access attempt', {
      userId,
      resource,
      success,
      timestamp: new Date().toISOString()
    });
  }
}
```

### **访问控制**

#### **日志访问权限**

```typescript
export class LogAccessControl {
  canAccessLogs(userId: string, logLevel: LogLevel): boolean {
    // 实现基于用户角色的日志访问控制
    const userRole = this.getUserRole(userId);
    
    switch (logLevel) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        return userRole === 'admin' || userRole === 'developer';
      case LogLevel.INFO:
      case LogLevel.WARN:
        return userRole === 'admin' || userRole === 'developer' || userRole === 'operator';
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return true; // 所有用户都可以访问错误日志
      default:
        return false;
    }
  }
}
```

## 🧪 测试策略

### **单元测试**

#### **PinoLogger 测试**

```typescript
describe('PinoLogger', () => {
  let logger: PinoLogger;
  let mockPino: jest.Mocked<Logger>;

  beforeEach(() => {
    mockPino = createMockPino();
    logger = new PinoLogger({ level: 'info' });
    (logger as any).pino = mockPino;
  });

  it('should log info message', () => {
    logger.info('Test message', { userId: '123' });
    
    expect(mockPino.info).toHaveBeenCalledWith(
      { userId: '123' },
      'Test message'
    );
  });

  it('should handle context correctly', () => {
    const context: RequestContext = {
      requestId: 'req-123',
      userId: 'user-456'
    };

    logger.setContext(context);
    logger.info('Test message');

    expect(mockPino.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'req-123',
        userId: 'user-456'
      }),
      'Test message'
    );
  });
});
```

#### **ContextStore 测试**

```typescript
describe('ContextStore', () => {
  let store: ContextStore;

  beforeEach(() => {
    store = new ContextStore();
  });

  it('should store and retrieve context', () => {
    const context: RequestContext = {
      requestId: 'req-123',
      userId: 'user-456'
    };

    store.setContext(context);
    const retrieved = store.getContext();

    expect(retrieved).toEqual(context);
  });

  it('should handle context isolation', async () => {
    const context1: RequestContext = { requestId: 'req-1' };
    const context2: RequestContext = { requestId: 'req-2' };

    store.setContext(context1);
    
    await new Promise(resolve => {
      setTimeout(() => {
        store.setContext(context2);
        expect(store.getContext()).toEqual(context2);
        resolve(undefined);
      }, 10);
    });
  });
});
```

### **集成测试**

#### **中间件集成测试**

```typescript
describe('FastifyMiddleware Integration', () => {
  let app: FastifyInstance;
  let logger: PinoLogger;

  beforeEach(async () => {
    app = fastify();
    logger = new PinoLogger({ level: 'info' });
    
    app.register(fastifyMiddleware, {
      logger,
      enableRequestLogging: true
    });

    app.get('/test', async (request, reply) => {
      return { message: 'success' };
    });

    await app.ready();
  });

  it('should log request and response', async () => {
    const logSpy = jest.spyOn(logger, 'logRequestStart');
    
    await app.inject({
      method: 'GET',
      url: '/test'
    });

    expect(logSpy).toHaveBeenCalled();
  });
});
```

### **性能测试**

#### **性能基准测试**

```typescript
describe('Performance Tests', () => {
  it('should handle high volume logging', async () => {
    const logger = new PinoLogger({ level: 'info' });
    const startTime = Date.now();
    const logCount = 10000;

    for (let i = 0; i < logCount; i++) {
      logger.info(`Test message ${i}`, { index: i });
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    expect(duration / logCount).toBeLessThan(0.1); // 每条日志平均小于0.1ms
  });
});
```

## 📈 监控和指标

### **性能指标**

#### **日志性能监控**

```typescript
export class LogMetrics {
  private readonly metrics = {
    totalLogs: 0,
    errors: 0,
    warnings: 0,
    averageLatency: 0,
    memoryUsage: 0
  };

  recordLog(level: string, duration: number): void {
    this.metrics.totalLogs++;
    
    switch (level) {
      case 'error':
        this.metrics.errors++;
        break;
      case 'warn':
        this.metrics.warnings++;
        break;
    }

    this.updateAverageLatency(duration);
  }

  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.errors / this.metrics.totalLogs,
      warningRate: this.metrics.warnings / this.metrics.totalLogs
    };
  }
}
```

#### **健康检查**

```typescript
export class LoggerHealthCheck {
  constructor(private readonly logger: PinoLogger) {}

  async checkHealth(): Promise<HealthCheckResult> {
    try {
      // 测试日志记录
      const testMessage = `Health check at ${new Date().toISOString()}`;
      this.logger.info(testMessage);
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        details: {
          logger: 'operational',
          context: 'available'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
        details: {
          logger: 'error',
          context: 'error'
        }
      };
    }
  }
}
```

## 🚀 部署和配置

### **环境配置**

#### **开发环境**

```typescript
export const developmentConfig: LoggerModuleOptions = {
  level: 'debug',
  pretty: true,
  enableRequestLogging: true,
  enableResponseLogging: true,
  requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
};
```

#### **生产环境**

```typescript
export const productionConfig: LoggerModuleOptions = {
  level: 'info',
  pretty: false,
  enableRequestLogging: true,
  enableResponseLogging: false,
  requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
};
```

### **Docker 配置**

#### **Dockerfile 优化**

```dockerfile
FROM node:18-alpine

# 安装必要的依赖
RUN apk add --no-cache dumb-init

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 使用 dumb-init 处理信号
ENTRYPOINT ["dumb-init", "--"]

# 启动应用
CMD ["node", "dist/main.js"]
```

### **Kubernetes 配置**

#### **ConfigMap 配置**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: logger-config
data:
  LOG_LEVEL: "info"
  LOG_PRETTY: "false"
  ENABLE_REQUEST_LOGGING: "true"
  ENABLE_RESPONSE_LOGGING: "false"
```

#### **Deployment 配置**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: logger-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: logger-app
  template:
    metadata:
      labels:
        app: logger-app
    spec:
      containers:
      - name: logger-app
        image: logger-app:latest
        env:
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: logger-config
              key: LOG_LEVEL
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

## 📚 使用示例

### **基础使用**

#### **模块导入和配置**

```typescript
import { LoggerModule } from '@hl8/logger';

@Module({
  imports: [
    LoggerModule.forRoot({
      level: 'info',
      pretty: true,
      enableRequestLogging: true
    })
  ]
})
export class AppModule {}
```

#### **服务中使用日志**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectLogger, PinoLogger } from '@hl8/logger';

@Injectable()
export class UserService {
  constructor(
    @InjectLogger('UserService') private readonly logger: PinoLogger
  ) {}

  async createUser(userData: CreateUserDto) {
    this.logger.info('Creating user', { userData });
    
    try {
      const user = await this.userRepository.create(userData);
      this.logger.info('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', { 
        error: error.message,
        userData 
      });
      throw error;
    }
  }
}
```

#### **控制器中使用日志**

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { InjectLogger, PinoLogger, RequestContext } from '@hl8/logger';

@Controller('users')
export class UserController {
  constructor(
    @InjectLogger('UserController') private readonly logger: PinoLogger
  ) {}

  @Post()
  async createUser(
    @Body() userData: CreateUserDto,
    @RequestContext('userId') userId: string
  ) {
    this.logger.info('Creating user', { 
      userData,
      requestedBy: userId 
    });
    
    return this.userService.createUser(userData);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    this.logger.info('Getting user', { userId: id });
    
    return this.userService.findById(id);
  }
}
```

### **高级使用**

#### **自定义上下文**

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLogger, RequestContext } from '@hl8/logger';

@Injectable()
export class TenantService {
  constructor(private readonly logger: PinoLogger) {}

  async processTenantData(tenantId: string, data: any) {
    // 设置租户上下文
    const context: RequestContext = {
      requestId: this.generateRequestId(),
      metadata: {
        tenantId,
        operation: 'processTenantData'
      }
    };

    this.logger.setContext(context);
    this.logger.info('Processing tenant data', { 
      tenantId,
      dataSize: JSON.stringify(data).length 
    });

    try {
      const result = await this.processData(data);
      this.logger.info('Tenant data processed successfully', { 
        tenantId,
        resultSize: JSON.stringify(result).length 
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to process tenant data', {
        tenantId,
        error: error.message
      });
      throw error;
    }
  }
}
```

#### **中间件集成**

```typescript
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { LoggerModule } from '@hl8/logger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );

  // 注册日志中间件
  await app.register(require('@hl8/logger/fastify-middleware'), {
    enableRequestLogging: true,
    enableResponseLogging: true,
    requestIdGenerator: (req) => req.headers['x-request-id'] || generateId()
  });

  await app.listen(3000);
}
bootstrap();
```

## 🎯 总结

### **核心优势**

1. **高性能**: 基于 Pino 的异步日志记录，性能优异
2. **类型安全**: 完整的 TypeScript 类型支持，开发体验优秀
3. **框架集成**: 深度集成 NestJS 和 Fastify，使用简单
4. **上下文管理**: 基于 AsyncLocalStorage 的请求上下文隔离
5. **装饰器支持**: 丰富的装饰器，简化依赖注入和上下文访问
6. **企业级**: 支持生产环境的高性能日志记录

### **设计原则**

1. **通用性**: 提供通用的日志记录功能，不包含业务特定逻辑
2. **性能优先**: 基于 Pino 的高性能异步日志记录
3. **类型安全**: 完整的 TypeScript 类型支持
4. **可扩展性**: 支持灵活的上下文扩展和自定义配置
5. **框架集成**: 深度集成 NestJS 和 Fastify 生态系统

### **技术特点**

1. **异步日志记录**: 不阻塞主线程，性能优异
2. **结构化日志**: 支持 JSON 格式的结构化日志输出
3. **请求追踪**: 基于 AsyncLocalStorage 的请求上下文管理
4. **多级别支持**: 支持 trace、debug、info、warn、error、fatal
5. **中间件集成**: 自动请求日志记录和错误处理
6. **装饰器支持**: 依赖注入和上下文装饰器

### **适用场景**

1. **企业级应用**: 需要高性能日志记录的企业级应用
2. **微服务架构**: 需要请求追踪和上下文管理的微服务
3. **NestJS 应用**: 基于 NestJS 框架的应用
4. **Fastify 应用**: 基于 Fastify 框架的应用
5. **多租户系统**: 需要上下文隔离的多租户系统

`@hl8/logger` 模块为 SAAS 平台提供了强大、灵活、高性能的日志记录能力，是构建企业级应用的重要基础设施！🚀
