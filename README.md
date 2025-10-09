# HL8 SAAS 平台

> 企业级多租户 SAAS 平台 - 基于 Clean Architecture + DDD + CQRS + Event Sourcing + EDA

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0+-red.svg)](https://nestjs.com/)
[![Nx](https://img.shields.io/badge/Nx-21.5+-blue.svg)](https://nx.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📖 目录

- [项目介绍](#项目介绍)
- [核心文档](#核心文档)
- [快速开始](#快速开始)
- [开发工具](#开发工具)
- [项目结构](#项目结构)
- [参与贡献](#参与贡献)

---

## 项目介绍

HL8 SAAS 平台是一个企业级多租户 SAAS 解决方案，采用混合架构模式，融合了五种强大的架构模式：

- **Clean Architecture**: 清晰的分层架构，依赖倒置原则
- **DDD (领域驱动设计)**: 使用统一语言和限界上下文划分业务边界
- **CQRS**: 命令查询职责分离，优化读写性能
- **Event Sourcing**: 事件作为真相源，支持完整审计追踪
- **EDA (事件驱动架构)**: 松耦合的模块通信，提高系统可扩展性

### 技术栈

- **运行时**: Node.js 20+
- **编程语言**: TypeScript 5+
- **后端框架**: NestJS 11+
- **数据库**: PostgreSQL + MongoDB
- **ORM**: MikroORM 6+
- **缓存**: Redis 7+
- **消息队列**: RabbitMQ / Kafka / Redis Streams
- **测试框架**: Jest
- **构建工具**: Nx 21+ (Monorepo 管理)
- **包管理**: pnpm

---

## 核心文档

### 🏛️ 架构和原则

| 文档 | 描述 |
|------|------|
| **[HL8 SAAS 平台宪章](.specify/memory/constitution.md)** | 项目的最高准则，定义核心原则和架构约束 |
| **[统一业务术语](docs/definition-of-terms.mdc)** | 平台、租户、组织、部门、用户等核心术语定义 |
| **[代码注释规范](.cursor/constitutions/code-comment-standards.md)** | TSDoc 规范和中文注释标准 |
| **[测试规范](docs/testing-standards.md)** | 分层测试架构和覆盖率要求 |

### 🔧 开发指南

| 文档 | 描述 |
|------|------|
| **[代码审查检查清单](docs/code-review-checklist.md)** | ✨ 完整的代码审查标准和检查项 |
| **[EventBus vs Messaging 使用指南](.specify/memory/constitution.md#eventbus-vs-messaging-使用指南)** | 何时使用 EventBus，何时使用 messaging |
| **[领域事件 vs 集成事件区分指南](docs/event-types-guide.md)** | ✨ 详细的事件类型区分和实现模式 |
| **[领域层开发指南](docs/06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md)** | 领域实体、聚合根、值对象开发规范 |
| **[应用层开发指南](docs/07-APPLICATION_LAYER_DEVELOPMENT_GUIDE.md)** | CQRS、用例、命令查询开发规范 |
| **[基础设施层开发指南](docs/08-INFRASTRUCTURE_LAYER_DEVELOPMENT_GUIDE.md)** | 仓储、适配器、事件存储开发规范 |
| **[接口层开发指南](docs/09-INTERFACE_LAYER_DEVELOPMENT_GUIDE.md)** | REST API、DTO、控制器开发规范 |

### 📦 核心模块文档

| 模块 | 描述 |
|------|------|
| **[@hl8/hybrid-archi](packages/hybrid-archi/README.md)** | 混合架构核心模块，提供统一的架构基础 |
| **[@hl8/messaging](packages/messaging/README.md)** | 企业级多租户消息队列解决方案 |
| **[@hl8/saas-core](packages/saas-core/README.md)** | SAAS 核心业务模块（租户、用户、组织、权限） |
| **[@hl8/logger](packages/logger/README.md)** | 结构化日志服务（基于 Pino） |
| **[@hl8/config](packages/config/README.md)** | 类型安全的配置管理服务 |
| **[@hl8/cache](packages/cache/README.md)** | 多级缓存服务（基于 Redis） |
| **[@hl8/multi-tenancy](packages/multi-tenancy/README.md)** | 多租户支持（租户隔离、上下文管理） |

> ✨ 标记表示最近更新的文档

---

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL >= 14
- Redis >= 7.0

### 安装依赖

```bash
pnpm install
```

### 构建项目

```bash
# 构建所有项目
pnpm nx run-many --target=build --all

# 构建特定项目
pnpm nx build saas-core
```

### 运行测试

```bash
# 运行所有测试
pnpm nx run-many --target=test --all

# 运行特定项目的测试
pnpm nx test saas-core

# 运行测试并生成覆盖率报告
pnpm nx test saas-core --coverage
```

### 代码检查

```bash
# 运行 ESLint
pnpm nx run-many --target=lint --all

# 修复 ESLint 错误
pnpm nx lint saas-core --fix
```

---

## 开发工具

本项目开发使用了 **[Spec-Kit](https://github.com/github/spec-kit)** 作为 AI 辅助工具。

### Spec-Kit 核心命令

| 命令 | 描述 |
|------|------|
| `/speckit.constitution` | 创建或更新项目管理原则和开发指南 |
| `/speckit.specify` | 定义要构建的内容（需求和用户场景） |
| `/speckit.plan` | 创建技术实施计划 |
| `/speckit.tasks` | 生成可操作的任务列表 |
| `/speckit.implement` | 执行任务，按照计划构建功能 |

---

## 项目结构

```text
hl8-saas-nx-mono/
├── apps/                        # 应用程序
│   └── api/                     # API 服务
├── packages/                    # 共享库
│   ├── hybrid-archi/           # 混合架构核心模块 ⭐
│   ├── saas-core/              # SAAS 核心业务模块 ⭐
│   ├── messaging/              # 消息队列服务
│   ├── logger/                 # 日志服务
│   ├── config/                 # 配置管理
│   ├── cache/                  # 缓存服务
│   ├── multi-tenancy/          # 多租户支持
│   └── ...                     # 其他共享库
├── docs/                        # 项目文档
│   ├── code-review-checklist.md      # ✨ 代码审查检查清单
│   ├── event-types-guide.md          # ✨ 事件类型区分指南
│   ├── definition-of-terms.mdc       # 统一业务术语
│   ├── testing-standards.md          # 测试规范
│   └── *-DEVELOPMENT_GUIDE.md        # 各层开发指南
├── .specify/                    # Spec-Kit 配置和规格
│   └── memory/
│       └── constitution.md     # 项目宪章 ⭐
└── specs/                       # 功能规格文档
    └── 001-saas-core-implementation/  # SAAS Core 实施规格
```

> ⭐ 表示核心模块或文档

---

## 参与贡献

### 开发流程

1. **阅读宪章**: 先阅读 [HL8 SAAS 平台宪章](.specify/memory/constitution.md)
2. **创建分支**: 从 `develop` 创建功能分支 `feature/###-feature-name`
3. **开发功能**: 遵循各层开发指南编写代码
4. **自我审查**: 使用 [代码审查检查清单](docs/code-review-checklist.md) 自检
5. **运行测试**: 确保所有测试通过，覆盖率达标
6. **提交 PR**: 提交 Pull Request 到 `develop` 分支
7. **代码审查**: 等待审查，根据反馈修改
8. **合并代码**: 审查通过后合并

### 代码规范

- ✅ 使用中文编写注释和文档
- ✅ 遵循 TSDoc 注释规范
- ✅ 所有公共 API 必须有完整注释
- ✅ 使用 `@hl8/hybrid-archi` 提供的基类和接口
- ✅ 禁止使用 `@nestjs/cqrs`、`@nestjs/config` 等被禁止的依赖
- ✅ 正确区分领域事件和集成事件
- ✅ 遵循多租户数据隔离规范

详细规范请参考 [代码审查检查清单](docs/code-review-checklist.md)。

### 提交消息规范

使用 Conventional Commits 规范：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Type**:

- `feat`: 新功能
- `fix`: 修复缺陷
- `docs`: 文档更新
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:

```text
feat(saas-core): 实现租户升级功能

- 添加 UpgradeTenantCommand 和处理器
- 实现租户类型验证和配额更新
- 发布 TenantUpgradedEvent 领域事件

Closes #123
```

---

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 联系方式

- **项目主页**: <https://github.com/hl8-saas/hl8-saas-nx-mono>
- **问题反馈**: <https://github.com/hl8-saas/hl8-saas-nx-mono/issues>
- **文档站点**: <https://docs.hl8-saas.com> (待建设)

---

Built with ❤️ by HL8 SAAS Team
