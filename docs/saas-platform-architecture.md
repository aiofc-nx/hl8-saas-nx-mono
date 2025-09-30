# HL8 SAAS平台架构设计文档

## 📋 文档概述

### 文档目标

本文档阐述HL8 SAAS平台的完整技术架构设计，基于Clean Architecture + CQRS + Event Sourcing + Event-Driven Architecture混合架构模式，为企业级多租户SAAS平台提供可扩展、高性能、安全可靠的技术解决方案。

### 架构特点

- **混合架构模式**: Clean Architecture + CQRS + Event Sourcing + Event-Driven Architecture
- **多租户支持**: 企业租户、社群租户、团队租户、个人租户
- **高性能**: 基于Fastify + NestJS + TypeScript
- **类型安全**: 严格的TypeScript类型检查
- **微服务就绪**: 模块化设计，支持未来微服务部署

## 🏗️ 整体架构概览

### 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    接口层 (Interface Layer)                    │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   REST API  │ │  GraphQL    │ │   WebSocket │ │  其他   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   应用层 (Application Layer)                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │  命令处理   │ │  查询处理   │ │  事件处理   │ │  用例   │ │
│  │  (Commands) │ │  (Queries)  │ │  (Events)   │ │ (Use Cases)│
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   领域层 (Domain Layer)                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │    实体     │ │   聚合根    │ │   值对象    │ │  服务   │ │
│  │  (Entities) │ │ (Aggregates)│ │(Value Objects)│ │(Services)│
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│               基础设施层 (Infrastructure Layer)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   数据库    │ │   消息队列  │ │    缓存     │ │  外部   │ │
│  │ (Database)  │ │(Message Queue)│ │  (Cache)   │ │  服务   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心架构模式

#### 1. Clean Architecture (分层架构)

- **领域层**: 核心业务逻辑，最内层最稳定
- **应用层**: 用例和业务流程编排
- **基础设施层**: 技术实现和外部服务
- **接口层**: 用户交互和协议适配

#### 2. CQRS (命令查询职责分离)

- **命令端**: 处理写操作，产生领域事件
- **查询端**: 处理读操作，优化查询性能
- **读写分离**: 独立扩展和优化

#### 3. Event Sourcing (事件溯源)

- **事件存储**: 记录所有业务状态变更
- **状态重建**: 从事件历史重建当前状态
- **审计追踪**: 完整的业务操作历史

#### 4. Event-Driven Architecture (事件驱动)

- **异步处理**: 提升系统响应性能
- **松耦合**: 模块间通过事件通信
- **可扩展**: 支持水平扩展

## 🔧 基础框架层

### 已开发的基础框架模块

基于NestJS框架的具体适配和扩展，我们已开发了以下基础框架层模块：

#### 1. Logger模块 (@hl8/logger)

**功能描述**: 提供高性能的日志记录功能，专为Fastify平台设计

**核心特性**:

- 基于Pino日志库，提供优异的性能表现
- 支持请求上下文绑定，使用AsyncLocalStorage实现上下文传递
- 专为Fastify平台优化，支持完整的请求/响应日志记录
- 支持日志注入装饰器，简化日志器使用
- 支持性能监控装饰器，自动记录方法执行时间

**技术实现**:

```typescript
// 模块配置
@Module({
  imports: [LoggerModule.forRoot({
    config: {
      level: 'info',
      destination: { type: 'file', path: './logs/app.log' },
      format: { timestamp: true, colorize: true }
    },
    enableRequestLogging: true,
    enableResponseLogging: true
  })],
})
export class AppModule {}

// 使用示例
@Injectable()
export class UserService {
  @InjectLogger('UserService')
  private readonly logger: PinoLogger;

  async createUser(userData: any) {
    this.logger.info('Creating user', { userData });
    // 业务逻辑
  }
}
```

#### 2. Config模块 (@hl8/config)

**功能描述**: 提供完全类型安全的配置管理模块

**核心特性**:

- 无需类型转换，直接注入配置类即可获得完整的TypeScript支持
- 支持多格式配置文件加载：.env、.json、.yml/.yaml
- 集成class-validator进行配置验证
- 支持${VAR}语法进行环境变量替换
- 支持内存缓存和文件缓存策略

**技术实现**:

```typescript
// 配置类定义
export class DatabaseConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;
}

// 模块配置
@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [
        fileLoader({ path: './config/app.yml' }),
        dotenvLoader({ separator: '__' })
      ]
    })
  ],
})
export class AppModule {}
```

#### 3. Common模块 (@hl8/common)

**功能描述**: 提供平台通用的工具类、类型定义、装饰器、异常处理等功能

**核心特性**:

- 提供完整的TypeScript类型定义
- 提供纯函数式的工具方法
- 提供声明式的功能增强装饰器
- 提供标准化的异常处理机制，遵循RFC7807标准

#### 4. Utils模块 (@hl8/utils)

**功能描述**: 提供平台通用的工具函数集合

**核心特性**:

- 所有工具函数都是纯函数，无副作用
- 支持函数组合和复用
- 提供完整的TypeScript类型定义
- 包含数组操作、对象处理、类型检查、字符串处理、加密解密等功能

#### 5. Fastify-Pro模块 (@hl8/fastify-pro)

**功能描述**: 企业级Fastify集成库，提供高性能、企业级功能的Web框架支持

**核心特性**:

- 基于Fastify和NestJS的企业级适配器
- 提供完整的插件管理系统
- 支持中间件管理和监控系统
- 专为多租户架构优化

### 基础框架层架构图

```
┌─────────────────────────────────────────────────────────────┐
│                   基础框架层 (Foundation Layer)                │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Logger    │ │    Config   │ │   Common    │ │  Utils  │ │
│  │  模块       │ │    模块     │ │    模块     │ │  模块   │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Fastify-Pro 模块                          │ │
│  │         (企业级Fastify集成库)                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 下一步开发计划

### 领域层开发

基于术语定义文档，我们需要开发以下核心业务实体：

#### 平台级实体

- Platform（平台）
- PlatformUser（平台用户）
- PlatformAdmin（平台管理员）

#### 租户级实体

- Tenant（租户）
  - EnterpriseTenant（企业租户）
  - CommunityTenant（社群租户）
  - TeamTenant（团队租户）
  - PersonalTenant（个人租户）
- TenantUser（租户用户）

#### 组织级实体

- Organization（组织）
  - Committee（专业委员会）
  - ProjectTeam（项目管理团队）
  - QualityGroup（质量控制小组）
  - PerformanceGroup（绩效管理小组）

#### 部门级实体

- Department（部门）
  - Level1Department（一级部门）
  - Level2Department（二级部门）
  - Level3Department（三级部门）

#### 用户实体

- User（用户基础实体）
- UserRole（用户角色）
- UserStatus（用户状态）
- UserPermission（用户权限）

### 应用层开发

#### 命令端 (Command Side)

- 用户管理命令
- 租户管理命令
- 组织管理命令
- 部门管理命令

#### 查询端 (Query Side)

- 用户查询服务
- 租户查询服务
- 组织查询服务
- 部门查询服务

#### 事件处理

- 用户事件处理器
- 租户事件处理器
- 组织事件处理器
- 部门事件处理器

### 基础设施层开发

#### 数据库层

- PostgreSQL主数据库
- MongoDB文档数据库
- 数据库迁移管理
- 连接池管理

#### 缓存层

- Redis缓存服务
- 分布式缓存
- 缓存策略管理

#### 消息队列

- 事件发布/订阅
- 异步任务处理
- 消息持久化

## 📊 技术栈总结

### 核心技术

- **运行时**: Node.js
- **框架**: NestJS + Fastify
- **语言**: TypeScript (严格模式)
- **构建工具**: Nx 21.5.3 + SWC
- **包管理**: pnpm

### 数据库技术

- **关系数据库**: PostgreSQL
- **文档数据库**: MongoDB
- **ORM**: MikroORM
- **缓存**: Redis

### 开发工具

- **代码质量**: ESLint + Prettier
- **测试框架**: Jest
- **文档生成**: TSDoc
- **项目管理**: Nx Monorepo

## 🔄 架构演进路径

### 第一阶段：基础框架层 ✅

- Logger模块
- Config模块
- Common模块
- Utils模块
- Fastify-Pro模块

### 第二阶段：领域层开发 🚧

- 核心业务实体
- 领域服务
- 值对象
- 聚合根

### 第三阶段：应用层开发 📋

- 命令处理器
- 查询处理器
- 事件处理器
- 用例实现

### 第四阶段：基础设施层开发 📋

- 数据库集成
- 缓存系统
- 消息队列
- 外部服务集成

### 第五阶段：接口层开发 📋

- REST API
- GraphQL API
- WebSocket支持
- 文档生成

## 📝 总结

HL8 SAAS平台采用混合架构模式，通过Clean Architecture + CQRS + Event Sourcing + Event-Driven Architecture的组合，为企业级多租户SAAS平台提供了完整的技术解决方案。

基础框架层已经完成，为后续的领域层、应用层、基础设施层和接口层开发奠定了坚实的基础。整个架构设计遵循了现代软件工程的最佳实践，确保了系统的可扩展性、可维护性和高性能。
