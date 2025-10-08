<!--
Sync Impact Report:
Version change: 1.1.0 → 1.2.0
Modified principles: III. 领域驱动设计架构 → III. 混合架构模式 (expanded with detailed technical requirements)
Added sections: 完整技术栈要求, 包职责分工, 实体与聚合根分离原则
Removed sections: None
Templates requiring updates: ✅ updated - all templates already reviewed for Chinese language and TSDoc compliance
Follow-up TODOs: None
-->

# HL8 SAAS 平台宪法

## 核心原则

### I. 中文优先原则 (NON-NEGOTIABLE)

所有代码注释、文档、错误消息和用户界面必须使用中文。这是项目的非协商性要求，确保中国开发团队的理解和协作效率。代码注释必须清晰、准确、完整地描述业务规则与逻辑。

### II. TSDoc 文档标准 (NON-NEGOTIABLE)

所有公共API、类、方法、接口、枚举等都必须添加完整的TSDoc注释。注释必须包含业务规则描述、前置条件、业务逻辑、异常处理和使用场景。必须使用 @description、@param、@returns、@throws、@example 等标记。

### III. 混合架构模式 (NON-NEGOTIABLE)

项目采用混合架构模式：Clean Architecture + DDD + CQRS + 事件溯源（ES）+ 事件驱动架构（EDA）。严格遵循充血模型设计原则，业务逻辑在实体内，服务层只协调。实体与聚合根明确分离，聚合根管理一致性边界，实体执行具体业务操作。

**架构分层要求**：

- Interface Layer (接口层) → Application Layer (应用层) → Domain Layer (领域层) → Infrastructure Layer (基础设施层)
- 依赖方向：外层依赖内层，内层不依赖外层

**CQRS架构要求**：

- 命令端处理写操作，通过聚合根执行业务逻辑
- 查询端处理读操作，通过读模型提供数据
- 命令和查询使用不同的数据模型和接口

**事件溯源（ES）架构要求**：

- 所有领域事件持久化到事件存储
- 聚合根能够从事件流重建当前状态
- 支持事件版本管理和向后兼容
- 支持聚合状态的快照，提高重建性能

### IV. 实体与聚合根分离原则 (NON-NEGOTIABLE)

**聚合根（管理者）职责**：

- 管理聚合一致性边界，协调内部实体操作
- 发布领域事件，验证业务规则
- 支持事件溯源（ES）和事件驱动架构（EDA）
- 确保多租户数据隔离，支持CQRS命令处理

**实体（被管理者）职责**：

- 执行具体业务操作，维护自身状态
- 实现业务逻辑，遵循聚合根指令
- 包含完整的业务方法，支持CQRS查询操作

### V. 测试优先原则 (NON-NEGOTIABLE)

单元测试文件(.spec.ts)必须与被测试文件放在同级目录下。集成测试和端到端测试统一放置在 `__tests__` 目录。所有测试必须使用中文描述，遵循AAA模式（Arrange-Act-Assert），确保测试隔离和独立性。

### VI. Nx Monorepo 管理

使用Nx管理多个相关项目，通过 `nx.json` 和 `pnpm-workspace.yaml` 管理项目依赖关系。优先使用Nx生成器创建项目结构，通过Nx项目图管理项目间依赖，利用Nx的智能缓存提高构建效率。

### VII. MCP 工具集成

在处理项目相关任务时，优先使用可用的MCP工具。充分利用Nx MCP工具进行项目分析、代码生成、任务执行和代码检查。使用MCP工具比手动操作更准确、更高效。

## 完整技术栈要求

### 核心技术栈

- **TypeScript**: 严格类型检查，使用强类型，避免any类型
- **NestJS**: 遵循依赖注入和模块化设计
- **Fastify**: 高性能Web框架
- **Pino**: 结构化日志记录
- **Nx**: Monorepo管理和构建工具
- **pnpm**: 包管理工具
- **Node.js**: 运行时环境

### 数据存储技术

- **PostgreSQL**: 关系型数据库
- **MongoDB**: 文档数据库
- **MikroORM**: 对象关系映射
- **Redis**: 缓存和会话存储

### 架构模式

- **Clean Architecture**: 清晰的分层架构和依赖方向
- **DDD**: 领域驱动设计，充血模型
- **CQRS**: 命令查询职责分离
- **事件溯源**: 聚合状态通过事件流重建
- **事件驱动**: 通过领域事件实现松耦合
- **多租户**: 完整的多租户架构支持

## 包职责分工

### 核心架构包（hybrid-archi）

**hybrid-archi**: 混合架构核心模块，是所有业务模块开发的基础

- 统一了业务模块开发的基本模式
- 集成了logger、config、cache、database、fastify-pro、multi-tenancy、messaging、common、utils等自定义模块
- 提供混合架构开发所需要的通用功能组件
- 包含领域层、应用层、基础设施层基础组件
- 业务模块开发必须基于hybrid-archi的结构和模式

### 业务模块包

**saas-core**: SAAS核心业务模块，包含用户、租户、组织、部门等业务领域

- 必须基于hybrid-archi开发
- 优先使用hybrid-archi提供的通用功能组件
- 不能偏离hybrid-archi的结构和模式

### 基础设施包（已集成到hybrid-archi）

- **multi-tenancy**: 多租户架构模块，提供租户隔离和数据分离能力
- **fastify-pro**: 企业级Fastify集成，提供高性能Web框架支持
- **cache**: 缓存模块，提供Redis缓存和分布式缓存能力
- **messaging**: 消息模块，提供事件总线和消息队列支持
- **database**: 数据库模块，提供数据访问和持久化能力
- **logger**: 日志模块，提供结构化日志和审计日志能力
- **config**: 配置模块，提供类型安全的配置管理
- **common**: 通用模块，提供共享工具和通用组件
- **utils**: 工具模块，提供通用工具函数和辅助方法

## 开发工作流

### 代码规范

1. 遵循代码即文档的原则
2. 修改代码后必须同步更新代码注释
3. 保持代码的一致性和可维护性
4. 使用中文进行所有文档和注释
5. 严格遵循充血模型设计原则
6. 实体与聚合根必须明确分离

### 工具使用

1. 使用 `nx workspace` 工具了解项目架构
2. 使用 `nx generators` 查看可用的生成器
3. 使用 `nx run` 执行项目任务
4. 利用Nx的依赖图优化构建顺序
5. 使用ESLint MCP工具检查代码质量

### 项目组织

- **apps/**: 应用程序项目
- **packages/**: 业务库、领域模块、共享库和工具包
- **forks/**: 第三方项目代码（仅作为参考）
- **docs/**: 项目文档

## 治理规则

本宪法优先于所有其他实践和规范。所有PR和代码审查必须验证对宪法的遵守情况。复杂性必须得到合理证明。

**版本**: 1.2.0 | **批准日期**: 2025-01-27 | **最后修订**: 2025-01-27
