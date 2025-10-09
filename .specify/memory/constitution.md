<!--
===================================================================================
宪章同步影响报告
===================================================================================

版本变更：1.4.0 → 1.4.1
修改日期：2025-10-09

新增内容：
  - 添加"EventBus vs Messaging 使用指南"小节
  - 澄清 EventBus 和 @hl8/messaging 的使用场景和区别
  - 提供详细的使用决策表和架构决策规则
  - 明确区分领域事件和集成事件的处理方式
  - 补充实际代码示例

版本升级理由：
  - PATCH 版本升级（1.4.0 → 1.4.1）
  - 原因：澄清和补充说明，未改变已有的强制性约束
  - 影响：帮助开发者更好理解何时使用 EventBus vs messaging

历史版本：
  1.4.1 (2025-10-09):
    - 添加 EventBus vs Messaging 使用指南
    - 澄清进程内事件总线和分布式消息队列的使用场景
  
  1.4.0 (2025-10-09):
    - 添加业务模块开发指南
    - 强调 CQRS、日志、配置、缓存模块使用规范
  
  1.3.2 (2025-10-08):
    - 移除不存在的 packages/auth/ 模块引用
    - 澄清认证和授权功能集成在 @hl8/saas-core 中
  
  1.3.1 (2025-10-08):
    - 添加核心业务模块说明
  
  1.3.0 (2025-10-08):
    - 添加统一业务术语原则
  
  1.2.1 (2025-10-08):
    - 修正文档路径引用
  
  1.2.0 (2025-10-08):
    - 添加 @hl8/hybrid-archi 模块作为架构基础
    - 明确基础设施模块集成要求
    - 规定业务模块开发必须遵循 hybrid-archi 技术要求
  
  1.1.0 (2025-10-08):
    - 添加分层测试架构原则
    - 扩展 TDD 为完整的测试架构
    - 混合架构模式添加 DDD
  
  1.0.0 (2025-10-08):
    - 初始版本
    - 确立核心原则和架构约束

模板一致性检查：
  ✅ plan-template.md - 已验证，与宪章原则一致
  ✅ spec-template.md - 已验证，与宪章原则一致
  ✅ tasks-template.md - 已验证，与宪章原则一致
  ✅ code-comment-standards.md - 已验证，与宪章中文优先原则一致
  ✅ testing-standards.md - 已验证，与宪章测试原则一致
  ✅ definition-of-terms.mdc - 已验证，业务术语定义文档

后续行动项：
  - 审查现有业务模块是否使用了 @nestjs/cqrs，需要迁移到 @hl8/hybrid-archi
  - 审查现有业务模块是否直接使用了 NestJS 内置日志/配置，需要迁移到 hybrid-archi
  - 审查现有业务模块是否直接使用了第三方缓存库，需要迁移到 @hl8/cache
  - 更新业务模块开发文档，明确依赖选择规范
  - 在代码审查流程中增加依赖合规性检查

===================================================================================
-->

# HL8 SAAS 平台宪章

## 核心原则

### I. 中文优先原则 (NON-NEGOTIABLE)

**所有代码注释、文档、错误消息和用户界面必须使用中文。**

这是项目的非协商性要求，确保中国开发团队的理解和协作效率。

- 代码注释必须使用中文，遵循 TSDoc 规范
- 技术文档必须使用中文编写
- 用户界面文本必须使用中文
- 错误消息和日志必须使用中文
- API 文档和接口说明必须使用中文
- Git 提交消息推荐使用中文
- 代码变量命名使用英文，但必须有中文注释说明

**理由**：本项目面向中国大陆地区的企业级SAAS平台，中文优先确保团队沟通效率、代码可维护性和业务理解的一致性。

### II. 代码即文档原则

**代码注释必须清晰、准确、完整地描述业务规则与逻辑。**

- 遵循 TSDoc 注释规范
- 所有公共 API、类、方法、接口、枚举都必须添加完整的 TSDoc 注释
- 注释必须包含业务规则、业务逻辑、异常处理和使用示例
- 代码变更时必须同步更新注释
- 详细规范见 `.cursor/constitutions/code-comment-standards.md`

**理由**：通过详细的注释让代码本身成为最好的业务文档，减少文档维护成本，提高团队协作效率。

### III. 混合架构模式

**项目采用 Clean Architecture + 领域驱动设计(DDD) + CQRS + 事件溯源(ES) + 事件驱动架构(EDA) 的混合模式。**

- **Clean Architecture**：明确的分层架构，依赖倒置原则
  - Domain Layer：领域实体、聚合根、领域事件、领域服务
  - Application Layer：用例、命令处理器、查询处理器
  - Infrastructure Layer：数据访问、外部服务、技术实现
  - Interface Layer：API、Web UI、消息处理

- **领域驱动设计(DDD)**：提供领域建模的指导思想和工具
  - 使用统一语言(Ubiquitous Language)进行团队沟通
  - 通过限界上下文(Bounded Context)划分业务边界
  - 使用聚合(Aggregate)管理业务一致性
  - 指导开发业务模块的领域层

- **CQRS**：命令查询职责分离
  - 写操作通过命令(Command)处理
  - 读操作通过查询(Query)处理
  - 读写模型分离，优化各自性能

- **事件溯源(ES)**：事件作为真相源
  - 所有状态变更通过事件记录
  - 支持完整的审计追踪
  - 可重建任意时间点的状态

- **事件驱动架构(EDA)**：松耦合的模块通信
  - 模块间通过领域事件通信
  - 支持异步处理和最终一致性
  - 提高系统可扩展性和弹性

**理由**：这个混合架构模式为SAAS平台提供高可扩展性、高性能、高可靠性和高可维护性，满足企业级应用需求。

### IV. 多租户架构

**系统必须支持多租户架构，确保租户间数据隔离和安全性。**

- 所有业务实体继承 TenantAwareAggregateRoot
- 所有数据访问必须包含租户上下文验证
- 跨租户数据访问被严格禁止
- 支持租户级别的配额和资源限制
- 每个租户的数据物理隔离或逻辑隔离

**理由**：多租户架构是SAAS平台的核心特性，确保数据安全性和业务隔离性。

### V. Nx Monorepo 管理

**使用 Nx 管理 Monorepo，统一管理多个应用和库。**

- 使用 Nx 生成器创建新项目和库
- 使用 Nx 任务执行器运行构建、测试、lint 等任务
- 利用 Nx 的依赖图管理项目间依赖
- 使用 pnpm 作为包管理工具
- 共享代码通过 packages/ 下的库管理

**理由**：Nx Monorepo 提供强大的项目管理能力，提高开发效率和代码复用性。

### VI. 分层测试架构

**项目采用分层测试架构，遵循测试金字塔模型，确保代码质量。**

#### 测试驱动开发 (TDD)

- 关键业务逻辑必须采用测试驱动开发
- 先编写测试用例，确保测试失败
- 然后实现功能代码，使测试通过
- 最后重构代码，保持测试通过

#### 分层测试原则

本项目遵循以下测试架构原则：

1. **就近原则**：单元测试文件与被测试文件在同一目录
   - 文件命名：`{被测试文件名}.spec.ts`
   - 便于维护和快速定位测试
   - 确保测试与代码同步更新

2. **集中管理**：集成测试、端到端测试统一放置在 `__tests__` 目录
   - 集成测试：`__tests__/integration/`
   - 端到端测试：`__tests__/e2e/`
   - 便于统一管理和执行

3. **类型分离**：不同类型的测试使用不同的目录结构
   - 单元测试：与源代码同目录
   - 集成测试：按模块组织在 `__tests__/integration/`
   - 端到端测试：按功能组织在 `__tests__/e2e/`

4. **依赖隔离**：测试之间相互独立，不依赖执行顺序
   - 每个测试用例独立运行
   - 使用 beforeEach/afterEach 清理状态
   - 避免共享可变状态

5. **快速反馈**：单元测试快速执行，集成测试覆盖关键路径
   - 单元测试：毫秒级执行
   - 集成测试：秒级执行
   - 端到端测试：分钟级执行

#### 测试金字塔

```text
           ┌─────────────────┐
           │   E2E Tests     │  ← 少量，覆盖关键用户流程
           │   (端到端测试)    │
           └─────────────────┘
        ┌─────────────────────┐
        │  Integration Tests  │  ← 适量，测试模块间交互
        │   (集成测试)         │
        └─────────────────────┘
     ┌─────────────────────────┐
     │     Unit Tests          │  ← 大量，测试单个组件
     │     (单元测试)           │
     └─────────────────────────┘
```

#### 测试覆盖率要求

- 核心业务逻辑测试覆盖率 ≥ 80%
- 关键路径测试覆盖率 ≥ 90%
- 所有公共 API 必须有对应的测试用例

**理由**：分层测试架构确保代码质量，减少缺陷，提供快速反馈，详细规范见 `docs/testing-standards.md`。

### VII. 事件驱动设计

**模块间通信优先使用领域事件。**

- 聚合根状态变更必须发布领域事件
- 模块间通过事件总线通信
- 支持事件的异步处理
- 事件必须包含完整的业务上下文
- 事件命名遵循过去式（如 UserCreatedEvent）

**理由**：事件驱动设计实现松耦合的模块化架构，提高系统的可扩展性和可维护性。

### VIII. 统一业务术语

**所有代码、文档、通信必须使用统一的业务术语，确保业务概念的一致性。**

#### 核心业务术语

项目定义了以下核心业务实体术语，必须在整个系统中统一使用：

1. **平台 (Platform)**：SAAS服务提供商，负责系统开发、技术支持和平台运营
   - 英文命名：`Platform`、`PlatformAdmin`、`PlatformUser`
   - 职责：系统开发、技术支持、租户管理、用户管理

2. **租户 (Tenant)**：平台的独立客户单位，拥有独立的数据空间和配置环境
   - 英文命名：`Tenant`、`TenantUser`、`TenantAdmin`
   - 类型：企业租户、社群租户、团队租户、个人租户
   - 特点：数据完全隔离、独立配置、独立权限体系

3. **组织 (Organization)**：租户内的横向管理单位，负责特定职能管理
   - 英文命名：`Organization`、`OrganizationAdmin`、`OrganizationUser`
   - 类型：专业委员会、项目管理团队、质量控制小组、绩效管理小组
   - 特点：横向设置、无从属关系、专注特定职能

4. **部门 (Department)**：组织内的纵向管理机构，具有明确的层级关系
   - 英文命名：`Department`、`DepartmentAdmin`、`DepartmentUser`
   - 层级：支持8层以上部门嵌套（总部→事业部→区域→分公司→部门→组→小组→专项团队）
   - 特点：纵向设置、层级关系、汇报关系明确

5. **用户 (User)**：系统的使用者，是最基本的身份单位
   - 英文命名：`User`、`UserRole`、`UserStatus`、`UserPermission`
   - 分类：按来源、类型、角色、状态、归属进行多维度分类
   - 特点：首先属于平台，可被分配到租户、组织、部门

#### 层级关系

系统遵循以下层级关系：

```text
Platform（平台）
  └── Tenant（租户）
        ├── Organization（组织）- 横向
        │     └── Department（部门）- 纵向
        │           └── Sub-Department（子部门）
        └── User（用户）
```

#### 术语使用要求

1. **命名一致性**
   - 类名、接口名、变量名必须使用统一的英文术语
   - 中文注释必须使用统一的中文术语
   - 数据库表名、字段名必须使用统一的英文术语

2. **文档一致性**
   - 技术文档、业务文档必须使用统一术语
   - API 文档、接口说明必须使用统一术语
   - 用户界面文本必须使用统一术语

3. **沟通一致性**
   - 团队讨论、需求沟通必须使用统一术语
   - 代码审查、技术评审必须使用统一术语
   - 禁止使用同义词或模糊术语

4. **禁止混淆**
   - 禁止混用"组织"和"部门"
   - 禁止混用"租户"和"企业"
   - 禁止混用"平台用户"和"租户用户"
   - 禁止使用未定义的业务术语

**理由**：统一业务术语确保业务概念的一致性，减少理解偏差，提高团队协作效率，详细定义见 `docs/definition-of-terms.mdc`。

## 架构约束

### 统一架构基础 (NON-NEGOTIABLE)

**所有业务模块必须基于 @hl8/hybrid-archi 模块开发，不得偏离。**

#### @hl8/hybrid-archi 模块定位

`@hl8/hybrid-archi` 是专为实现混合架构模式设计的统一基础模块，提供：

- 混合架构的通用功能组件和基类
- 标准化的基础设施服务接口和实现
- Clean Architecture + DDD + CQRS + ES + EDA 的开箱即用支持
- 各业务模块架构统一性和一致性保障

#### 集成的基础设施模块

`@hl8/hybrid-archi` 集成了以下自定义的核心基础设施模块：

- **@hl8/logger**：结构化日志服务（基于 Pino）
- **@hl8/config**：配置管理服务（支持多环境、动态配置）
- **@hl8/cache**：缓存服务（基于 Redis，支持多级缓存）
- **@hl8/database**：数据库访问服务（支持 PostgreSQL、MongoDB）
- **@hl8/common**：公共工具和基础类型定义
- **@hl8/multi-tenancy**：多租户支持（租户隔离、上下文管理）
- **@hl8/fastify-pro**：企业级 Web 框架（高性能、可扩展）
- **@hl8/messaging**：消息服务（事件总线、消息队列）
- **@hl8/utils**：通用工具函数库

#### 业务模块开发要求

1. **强制依赖**：所有业务模块必须依赖 `@hl8/hybrid-archi`
2. **技术一致性**：必须遵循 hybrid-archi 的技术规范和最佳实践
3. **架构合规性**：必须使用 hybrid-archi 提供的基类和接口
4. **禁止偏离**：不得绕过 hybrid-archi 实现自定义的基础设施
5. **文档参考**：详细规范见 `packages/hybrid-archi/README.md` 和 `docs/hybrid-archi/`

**理由**：统一架构基础确保系统的一致性、可维护性和可扩展性，降低技术债务，提高开发效率。

### 业务模块开发指南 (NON-NEGOTIABLE)

**业务模块开发必须优先使用 @hl8/hybrid-archi 提供的功能组件，禁止直接使用 NestJS 内置或第三方依赖。**

#### CQRS 实现规范

`@hl8/hybrid-archi` 提供了完整的 CQRS 功能组件，业务模块必须使用这些组件：

1. **命令处理**
   - ✅ **必须使用**：`CommandBus`、`ICommandHandler`、`BaseCommand` (from `@hl8/hybrid-archi`)
   - ❌ **禁止使用**：`@nestjs/cqrs` 的 `CommandBus`、`ICommandHandler`、`CommandHandler`
   - 命令类必须继承 `BaseCommand` (或使用别名 `CqrsBaseCommand`)
   - 命令处理器必须实现 `ICommandHandler<TCommand, TResult>`

2. **查询处理**
   - ✅ **必须使用**：`QueryBus`、`IQueryHandler`、`BaseQuery` (from `@hl8/hybrid-archi`)
   - ❌ **禁止使用**：`@nestjs/cqrs` 的 `QueryBus`、`IQueryHandler`、`QueryHandler`
   - 查询类必须继承 `BaseQuery` (或使用别名 `CqrsBaseQuery`)
   - 查询处理器必须实现 `IQueryHandler<TQuery, TResult>`

3. **事件处理**
   - ✅ **必须使用**：`EventBus`、`IEventHandler`、`BaseDomainEvent` (from `@hl8/hybrid-archi`)
   - ❌ **禁止使用**：`@nestjs/cqrs` 的 `EventBus`、`IEventHandler`、`EventsHandler`
   - 领域事件必须继承 `BaseDomainEvent`
   - 事件处理器必须实现 `IEventHandler<TEvent>`

#### EventBus vs Messaging 使用指南

**核心原则**：`EventBus` 用于进程内的领域事件处理，`@hl8/messaging` 用于跨服务的分布式通信。

##### 1. EventBus（进程内事件总线）

**定位**：CQRS 模式的领域事件处理

**使用场景**：

- ✅ 聚合根发布领域事件（状态变更通知）
- ✅ 同一进程内的事件订阅和处理
- ✅ CQRS 读写模型同步
- ✅ 领域模型的一致性维护

**特点**：

- 进程内通信（内存级别）
- 微秒级延迟
- 紧密耦合的业务逻辑
- 高性能、低开销

**示例**：

```typescript
// 领域事件发布
export class TenantAggregate extends TenantAwareAggregateRoot {
  public activate(userId: string): void {
    // 业务逻辑
    this._tenant.activate();
    
    // 发布领域事件
    this.addDomainEvent(new TenantActivatedEvent(
      this.id,
      this.version,
      this.tenantId
    ));
  }
}

// 领域事件处理
@EventHandler('TenantActivated')
export class TenantActivatedHandler implements IEventHandler<TenantActivatedEvent> {
  async handle(event: TenantActivatedEvent): Promise<void> {
    // 更新读模型、触发其他领域逻辑
    console.log('租户已激活:', event.aggregateId);
  }
}
```

##### 2. @hl8/messaging（分布式消息队列）

**定位**：企业级多租户消息队列解决方案

**使用场景**：

- ✅ 跨服务/微服务通信（集成事件）
- ✅ 异步任务处理（发送邮件、生成报表）
- ✅ 长时间运行的后台任务
- ✅ 解耦的分布式系统集成

**特点**：

- 跨进程/跨服务通信
- 毫秒级延迟
- 松耦合的分布式架构
- 支持多种适配器（RabbitMQ、Kafka、Redis Streams）

**示例**：

```typescript
// 发布集成事件到消息队列
@EventHandler('TenantCreated')
export class TenantCreatedHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(
    @Optional() private readonly messagingService?: MessagingService
  ) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    // 1. 处理领域逻辑（必须）
    console.log('租户创建事件:', event.toJSON());
    // TODO: 创建默认组织、根部门
    
    // 2. 发布集成事件（可选，如果配置了 messaging）
    if (this.messagingService) {
      await this.messagingService.publish('integration.tenant.created', {
        tenantId: event.aggregateId.toString(),
        tenantCode: event.code,
        tenantName: event.name,
      });
    }
  }
}

// 异步任务发布
@EventHandler('UserRegistered')
export class UserRegisteredHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(private readonly taskService: TaskService) {} // from @hl8/messaging

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 发布异步任务
    await this.taskService.publish('send-verification-email', {
      userId: event.aggregateId.toString(),
      email: event.email,
    });
  }
}
```

##### 3. 使用决策表

| 方面 | EventBus | @hl8/messaging |
|------|----------|----------------|
| **使用场景** | CQRS 领域事件 | 分布式系统集成 |
| **通信范围** | 进程内 | 跨进程/跨服务 |
| **延迟** | 微秒级 | 毫秒级 |
| **可靠性** | 进程可靠性 | 消息队列可靠性 |
| **持久化** | 不持久化（内存） | 持久化（队列） |
| **顺序保证** | 严格顺序 | 部分顺序（取决于适配器） |
| **适用模块** | 所有业务模块（核心） | 需要跨服务通信的模块 |
| **依赖关系** | 必须（hybrid-archi 提供） | 可选（按需引入） |

##### 4. 架构决策规则

**核心业务模块（如 saas-core）**：

- ✅ **必须使用** `EventBus` 处理领域事件
- ✅ **可选引入** `@hl8/messaging`（仅当需要跨服务通信时）
- 保持架构简洁，优先使用高性能的进程内通信

**独立服务模块（如邮件服务、通知服务）**：

- ✅ **必须使用** `EventBus` 处理内部领域事件
- ✅ **必须引入** `@hl8/messaging` 接收集成事件
- 通过消息队列与其他服务解耦

**微服务架构**：

- ✅ **必须使用** `EventBus` 处理内部领域事件
- ✅ **必须引入** `@hl8/messaging` 实现服务间通信
- 领域事件和集成事件明确分离

##### 5. 事件类型区分

**领域事件（Domain Events）**：

- 反映领域模型内部状态变更
- 使用 `EventBus` 发布和处理
- 例如：`TenantCreatedEvent`、`UserRegisteredEvent`、`OrderPlacedEvent`

**集成事件（Integration Events）**：

- 通知其他服务或系统的事件
- 使用 `@hl8/messaging` 发布和处理
- 例如：`integration.tenant.created`、`integration.order.paid`

**理由**：明确区分领域事件和集成事件，确保核心业务模块保持高性能的进程内通信，同时为分布式架构提供灵活的扩展能力。

#### 模块集成

   ```typescript
   // ✅ 正确的模块配置
   import { CommandBus, QueryBus, EventBus } from '@hl8/hybrid-archi';
   
   @Module({
     providers: [CommandBus, QueryBus, EventBus, ...],
     exports: [CommandBus, QueryBus, EventBus],
   })
   export class MyModule {}
   
   // ❌ 禁止导入 @nestjs/cqrs
   import { CqrsModule } from '@nestjs/cqrs'; // 禁止
   ```

#### 基础设施依赖规范

业务模块必须通过 `@hl8/hybrid-archi` 使用基础设施服务，禁止直接依赖第三方库：

1. **日志服务**
   - ✅ **必须使用**：`@hl8/logger` (通过 `@hl8/hybrid-archi` 集成)
   - ❌ **禁止使用**：`@nestjs/common` 的 `Logger`、`winston`、`bunyan` 等
   - 提供结构化日志、日志级别控制、性能追踪
   - 支持租户级别的日志隔离

2. **配置管理**
   - ✅ **必须使用**：`@hl8/config` (通过 `@hl8/hybrid-archi` 集成)
   - ❌ **禁止使用**：`@nestjs/config`、`dotenv`、`config` 等
   - 支持多环境配置、动态配置、类型安全配置
   - 提供配置验证和配置变更通知

3. **缓存服务**
   - ✅ **必须使用**：`@hl8/cache` (通过 `@hl8/hybrid-archi` 集成)
   - ❌ **禁止使用**：`@nestjs/cache-manager`、`cache-manager`、`redis` 直接依赖
   - 提供多级缓存、缓存装饰器、缓存失效策略
   - 支持租户级别的缓存隔离

4. **数据库访问**
   - ✅ **必须使用**：`@hl8/database` (通过 `@hl8/hybrid-archi` 集成)
   - ✅ **ORM 选择**：必须使用 `MikroORM`（已集成）
   - 提供连接池管理、事务管理、查询构建器
   - 支持租户级别的数据隔离

5. **多租户支持**
   - ✅ **必须使用**：`@hl8/multi-tenancy` (通过 `@hl8/hybrid-archi` 集成)
   - 提供租户上下文管理、租户识别、租户过滤器
   - 确保所有数据访问自动应用租户隔离

6. **通用工具**
   - ✅ **必须使用**：`@hl8/common`、`@hl8/utils` (通过 `@hl8/hybrid-archi` 集成)
   - 提供类型定义、工具函数、装饰器、验证器

#### 依赖声明规范

在 `package.json` 中正确声明依赖：

```json
{
  "dependencies": {
    "@hl8/hybrid-archi": "^x.x.x",      // ✅ 必须
    "@hl8/saas-core": "^x.x.x",         // ✅ 业务模块通常需要
    "@nestjs/common": "^11.x.x",        // ✅ NestJS 核心
    "@nestjs/core": "^11.x.x",          // ✅ NestJS 核心
    
    // ❌ 以下依赖禁止直接声明
    // "@nestjs/cqrs": "...",            // 使用 @hl8/hybrid-archi 的 CQRS
    // "@nestjs/config": "...",          // 使用 @hl8/config
    // "@nestjs/cache-manager": "...",   // 使用 @hl8/cache
    // "winston": "...",                 // 使用 @hl8/logger
    // "pino": "...",                    // 已集成在 @hl8/logger
    // "redis": "...",                   // 使用 @hl8/cache
    // "cache-manager": "..."            // 使用 @hl8/cache
  }
}
```

#### 代码审查检查项

在代码审查时，必须检查以下合规性：

- [ ] 是否导入了 `@nestjs/cqrs`？（禁止）
- [ ] 是否直接使用了 NestJS 内置的 `Logger`？（禁止）
- [ ] 是否直接导入了 `@nestjs/config`？（禁止）
- [ ] 是否直接导入了缓存相关的第三方库？（禁止）
- [ ] CQRS 命令/查询是否继承了正确的基类？（必须）
- [ ] 是否正确使用了 `@hl8/hybrid-archi` 提供的服务？（必须）
- [ ] 是否遵循了多租户数据隔离规范？（必须）

#### 迁移指南

对于现有使用了 `@nestjs/cqrs` 或其他第三方依赖的业务模块：

1. **CQRS 迁移**
   - 将 `@nestjs/cqrs` 导入替换为 `@hl8/hybrid-archi`
   - 命令/查询类继承 `BaseCommand`/`BaseQuery`
   - 装饰器参数从类引用改为字符串（例如：`@CommandHandler('CreateTenant')`）
   - 在模块中显式提供 `CommandBus`、`QueryBus`、`EventBus`

2. **日志迁移**
   - 将 `@nestjs/common` 的 `Logger` 替换为 `@hl8/logger` 的 `PinoLogger`
   - 更新日志调用方式，使用结构化日志格式

3. **配置迁移**
   - 将 `@nestjs/config` 的 `ConfigService` 替换为 `@hl8/config`
   - 使用类型安全的配置模式

4. **缓存迁移**
   - 将缓存相关依赖替换为 `@hl8/cache` 的 `CacheService`
   - 使用缓存装饰器简化缓存逻辑

**理由**：统一使用 hybrid-archi 提供的功能组件确保架构一致性、降低依赖冲突、简化升级维护、提供更好的多租户支持和性能优化。

### 核心业务模块

**@hl8/saas-core 是 SAAS 平台的核心业务模块，为所有业务功能提供基础能力。**

#### @hl8/saas-core 模块定位

`@hl8/saas-core` 是基于 `@hl8/hybrid-archi` 开发的核心业务模块，提供：

- SAAS 平台的基础业务实体和领域模型
- 多租户架构的核心实现
- 组织架构和部门管理的完整实现
- 用户、角色和权限管理的标准实现
- 为其他业务模块提供必需的基础业务能力

#### 包含的子领域

`@hl8/saas-core` 包含以下核心子领域：

1. **租户领域 (Tenant Domain)**
   - 租户管理：企业租户、社群租户、团队租户、个人租户
   - 租户配置：独立配置环境、租户级别设置
   - 数据隔离：确保租户间数据完全隔离

2. **组织领域 (Organization Domain)**
   - 组织管理：横向管理单位的创建和维护
   - 职能管理：专业委员会、项目管理团队、质量控制小组等
   - 权限管理：组织级别的权限控制

3. **部门领域 (Department Domain)**
   - 部门管理：纵向管理机构的创建和维护
   - 层级管理：支持8层以上的部门嵌套
   - 汇报关系：明确的上下级关系和汇报链

4. **用户领域 (User Domain)**
   - 用户管理：平台用户、租户用户的全生命周期管理
   - 身份认证：统一的身份认证机制
   - 用户归属：用户在平台、租户、组织、部门中的归属关系

5. **角色领域 (Role Domain)**
   - 角色管理：角色的定义、分配和维护
   - 角色层级：平台角色、租户角色、组织角色、部门角色
   - 角色继承：角色权限的继承和覆盖机制

6. **权限领域 (Permission Domain)**
   - 权限管理：细粒度的权限定义和控制
   - 权限分配：基于角色的权限分配（RBAC）
   - 权限验证：统一的权限验证机制

#### 核心职能

`@hl8/saas-core` 负责以下核心职能：

1. **数据隔离**
   - 实现租户级别的数据完全隔离
   - 提供租户上下文管理和验证
   - 确保跨租户数据访问的安全性

2. **身份认证**
   - 提供统一的用户身份认证服务
   - 支持多种认证方式（用户名密码、OAuth、SSO等）
   - 管理用户会话和令牌

3. **权限管理**
   - 实现基于角色的访问控制（RBAC）
   - 提供细粒度的权限验证
   - 支持多层级的权限继承

4. **基础业务能力**
   - 为人力资源模块提供用户和组织数据
   - 为财务管理模块提供租户和部门数据
   - 为其他业务模块提供统一的身份和权限服务

#### 依赖关系

- `@hl8/saas-core` 必须依赖 `@hl8/hybrid-archi`
- 其他业务模块（如人力资源、财务管理等）必须依赖 `@hl8/saas-core`
- 形成清晰的依赖层次：`业务模块 → saas-core → hybrid-archi`

**理由**：@hl8/saas-core 作为核心业务模块，为整个 SAAS 平台提供统一的基础业务能力，确保多租户架构、身份认证和权限管理的一致性实现。

### 技术栈要求

- **运行时环境**：Node.js 20+
- **编程语言**：TypeScript 5+
- **后端框架**：NestJS 11+
- **架构基础**：@hl8/hybrid-archi (必须)
- **核心业务**：@hl8/saas-core (必须)
- **数据库**：PostgreSQL + MongoDB
- **ORM**：MikroORM
- **缓存**：Redis 7+ (分布式缓存)
- **消息队列**：RabbitMQ 或 Kafka (事件总线)
- **日志**：Pino (结构化日志)
- **测试框架**：Jest (单元测试和集成测试)
- **包管理**：pnpm (Monorepo 包管理)
- **构建工具**：Nx 21+ (Monorepo 管理)

### 代码质量要求

- 所有代码必须通过 ESLint 检查
- 所有代码必须通过 TypeScript 类型检查
- 核心业务逻辑测试覆盖率 ≥ 80%
- 关键路径测试覆盖率 ≥ 90%
- 所有公共 API 必须有完整的 TSDoc 注释

### 性能要求

- API 响应时间 P95 < 500ms
- 数据库查询时间 P95 < 200ms
- 缓存命中率 > 80%
- 系统支持 1000+ 并发用户
- 单租户数据查询性能隔离

### 安全要求

- 所有 API 必须经过身份验证
- 所有数据访问必须经过授权检查
- 敏感数据必须加密存储
- 租户数据严格隔离
- 定期进行安全审计

## 开发工作流

### 项目组织

项目采用 Nx Monorepo 架构，主要包含以下目录：

- `apps/`：应用程序（如 API 服务）
- `packages/`：业务库（如领域模块）、共享库（如 @hl8/hybrid-archi、认证、日志、公共工具等）
- `docs/`：项目文档

**关键模块**：

- `packages/hybrid-archi/`：统一架构基础模块（所有业务模块的基础）
- `packages/saas-core/`：核心业务模块（提供租户、组织、部门、用户、角色、权限、认证、授权等基础业务能力）

### 开发流程

1. **需求分析**：使用 `/speckit.spec` 命令创建功能规格说明
2. **实施计划**：使用 `/speckit.plan` 命令创建实施计划
3. **任务分解**：使用 `/speckit.tasks` 命令创建任务列表
4. **代码实现**：按照任务列表实施功能，基于 @hl8/hybrid-archi 开发
5. **代码审查**：提交 PR，进行代码审查，验证架构合规性
6. **集成测试**：运行集成测试，确保功能正确
7. **部署上线**：通过 CI/CD 流程部署到生产环境

### 分支管理

- `main`：主分支，保护分支，仅接受 PR 合并
- `develop`：开发分支，日常开发的目标分支
- `feature/###-feature-name`：功能分支，开发新功能
- `fix/###-bug-name`：修复分支，修复缺陷
- `hotfix/###-critical-fix`：热修复分支，紧急修复

### 提交规范

使用 Conventional Commits 规范：

- `feat: 新功能描述`
- `fix: 缺陷修复描述`
- `docs: 文档更新描述`
- `refactor: 重构描述`
- `test: 测试相关描述`
- `chore: 构建/工具相关描述`

## 治理规则

### 宪章权威性

本宪章是项目的最高准则，优先于所有其他实践和约定。所有代码、文档和流程必须遵循宪章规定。

### 宪章修订

- 宪章修订必须经过团队讨论和一致同意
- 修订必须更新版本号，遵循语义化版本规范
- 修订必须记录变更历史和理由
- 重大修订需要制定迁移计划

### 合规性审查

- 所有 PR 必须验证宪章合规性
- 验证业务模块是否正确依赖 @hl8/hybrid-archi
- 验证是否使用了禁止的依赖（如 @nestjs/cqrs）
- 验证代码和文档是否使用统一的业务术语
- 定期进行宪章合规性审计
- 违反宪章的代码不得合并到主分支
- 复杂性必须有充分的理由和文档

### 运行时指导

- 项目根目录的 `.cursor/rules/pre-rule.mdc` 提供开发时的详细指导
- `.cursor/constitutions/code-comment-standards.md` 提供注释规范的详细说明
- `docs/testing-standards.md` 提供测试规范的详细说明
- `docs/definition-of-terms.mdc` 提供统一业务术语的详细定义
- `packages/hybrid-archi/README.md` 提供混合架构模块的使用指南
- `docs/hybrid-archi/` 提供详细的架构文档
- 使用 Nx MCP 工具进行项目管理和任务执行
- 遵循 Clean Architecture 分层原则进行代码组织

**版本**: 1.4.1 | **批准日期**: 2025-10-08 | **最后修订**: 2025-10-09
