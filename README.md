# HL8 SAAS 平台

> 面向现代企业的多租户 SAAS 基础架构

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red)](https://nestjs.com/)
[![Nx](https://img.shields.io/badge/Nx-21.5.3-blue)](https://nx.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange)](https://pnpm.io/)

---

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [开发规范](#开发规范)
- [项目结构](#项目结构)
- [核心包说明](#核心包说明)
- [开发工作流](#开发工作流)

---

## 项目概述

HL8 SAAS 平台是一个企业级多租户 SAAS 基础架构，采用混合架构模式：

- **Clean Architecture**: 分层架构，领域驱动设计
- **CQRS**: 命令查询职责分离
- **Event Sourcing**: 事件溯源
- **Event-Driven Architecture**: 事件驱动架构

### 核心特性

- ✅ **多租户架构**: 支持企业、社群、团队、个人等多种租户类型
- ✅ **充血模型**: 实体包含业务逻辑，遵循领域驱动设计
- ✅ **类型安全**: TypeScript 严格模式，完整的类型推断
- ✅ **高性能**: 基于 Fastify 和 Redis 的高性能实现
- ✅ **可扩展**: 模块化设计，清晰的依赖边界
- ✅ **零技术债**: 不保留向后兼容代码，始终使用最佳实践

---

## 技术栈

- **运行时**: Node.js
- **框架**: NestJS + Fastify
- **语言**: TypeScript (严格模式)
- **构建工具**: Nx 21.5.3 + SWC
- **包管理**: pnpm
- **数据库**: PostgreSQL + MongoDB
- **ORM**: MikroORM
- **缓存**: Redis
- **消息队列**: RabbitMQ / Redis / Kafka

---

## 快速开始

### 前置要求

- Node.js >= 18.x
- pnpm >= 9.x
- PostgreSQL >= 14.x
- Redis >= 7.x

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
# 启动所有服务
pnpm start

# 启动特定服务
nx serve <project-name>
```

### 构建项目

```bash
# 构建所有项目
pnpm build

# 构建特定项目
nx build <project-name>
```

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行特定项目测试
nx test <project-name>

# 查看测试覆盖率
nx test <project-name> --coverage
```

---

## 开发规范

**📖 完整开发规范**: [docs/DEVELOPMENT_GUIDELINES.md](./docs/DEVELOPMENT_GUIDELINES.md)

### 核心规范速览

#### 常量管理

```typescript
// ✅ 使用命名空间组织常量
import { DI_TOKENS, DECORATOR_METADATA } from './constants';

@Inject(DI_TOKENS.MODULE_OPTIONS)
private readonly options: ModuleOptions;
```

#### 代码注释

```typescript
/**
 * 用户服务
 *
 * @description 提供用户相关的业务逻辑处理
 *
 * ## 业务规则
 * - 邮箱必须唯一
 * - 密码长度至少8位
 *
 * @example
 * ```typescript
 * const user = await userService.createUser(dto);
 * ```
 *
 * @since 1.0.0
 */
export class UserService {}
```

#### 类型安全

```typescript
// ✅ 使用类型推断
export const DI_TOKENS = {
  MODULE_OPTIONS: 'MODULE_OPTIONS',
} as const;

export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];
```

---

## 项目结构

```
hl8-saas-nx-mono/
├── packages/              # 共享库和基础设施
│   ├── cache/            # 缓存模块 (Redis)
│   ├── logger/           # 日志模块 (Pino)
│   ├── config/           # 配置模块
│   ├── database/         # 数据库模块 (MikroORM)
│   ├── messaging/        # 消息队列模块
│   ├── multi-tenancy/    # 多租户模块
│   ├── common/           # 通用工具
│   ├── core/             # 核心功能
│   └── utils/            # 工具函数
├── apps/                 # 应用程序
├── libs/                 # 业务库
├── docs/                 # 文档
│   ├── DEVELOPMENT_GUIDELINES.md  # 开发规范
│   ├── TERMINOLOGY.md             # 术语定义
│   └── code-comment-standards.md  # 注释规范
├── nx.json              # Nx 配置
├── pnpm-workspace.yaml  # pnpm 工作区配置
└── tsconfig.json        # TypeScript 配置
```

---

## 核心包说明

### @hl8/cache

Redis 缓存服务，支持多租户隔离。

```typescript
import { CacheModule, CacheService } from '@hl8/cache';
```

**特性**:

- ✅ 自动租户上下文管理
- ✅ 装饰器支持 (`@Cacheable`, `@CachePut`, `@CacheEvict`)
- ✅ 统计监控和健康检查

### @hl8/logger

结构化日志服务，基于 Pino。

```typescript
import { LoggerModule, PinoLogger } from '@hl8/logger';
```

**特性**:

- ✅ 结构化日志输出
- ✅ 请求追踪
- ✅ 性能监控

### @hl8/multi-tenancy

多租户管理服务。

```typescript
import { MultiTenancyModule, TenantContextService } from '@hl8/multi-tenancy';
```

**特性**:

- ✅ 租户上下文管理
- ✅ 数据隔离策略
- ✅ 多层级隔离支持

### @hl8/messaging

消息队列服务，支持多种适配器。

```typescript
import { MessagingModule, MessagingService } from '@hl8/messaging';
```

**特性**:

- ✅ 支持 RabbitMQ、Redis、Kafka
- ✅ 消息去重
- ✅ 死信队列
- ✅ 租户隔离

---

## 开发工作流

### 使用 Nx 工具

```bash
# 查看项目依赖图
nx graph

# 查看可用生成器
nx list

# 生成新库
nx generate @nx/js:library my-lib --directory=packages/my-lib

# 运行受影响的测试
nx affected:test

# 构建受影响的项目
nx affected:build
```

### 代码检查

```bash
# 运行 ESLint
nx lint <project-name>

# 运行 TypeScript 类型检查
nx typecheck <project-name>
```

### Git 提交规范

```bash
# 提交格式
git commit -m "feat(cache): 添加常量统一管理功能"
```

**提交类型**:

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建工具

---

## 相关文档

### 📐 技术架构设计

> 详见：[docs/architecture/](./docs/architecture/)

- 📐 [架构设计原则](./docs/architecture/01-architecture-principles.md) - Clean Architecture、分层架构
- 📐 [领域驱动设计](./docs/architecture/02-domain-driven-design.md) - DDD、充血模型理论
- 📐 [CQRS与事件溯源](./docs/architecture/03-cqrs-event-sourcing.md) - 命令查询分离
- 📐 [事件驱动架构](./docs/architecture/04-event-driven-architecture.md) - 事件驱动模式

### 📋 开发编码规范

> 详见：[docs/guidelines/](./docs/guidelines/)

- 📋 [编码规范总览](./docs/guidelines/01-coding-standards.md) - TypeScript代码规范
- 💡 [充血模型实践](./docs/guidelines/02-rich-domain-model-practice.md) - 充血模型编码实战
- 📋 [常量管理规范](./docs/guidelines/03-constants-management.md) - 常量统一管理
- 📋 [代码注释规范](./docs/guidelines/04-code-comments.md) - TSDoc 注释标准
- 📋 [命名规范](./docs/guidelines/05-naming-conventions.md) - 命名规则
- 📋 [类型安全规范](./docs/guidelines/06-type-safety.md) - TypeScript 类型安全
- 📋 [测试规范](./docs/guidelines/07-testing-standards.md) - 测试标准
- 📋 [Git提交规范](./docs/guidelines/08-git-conventions.md) - Git 规范

### 📁 其他文档

- 📖 [文档中心](./docs/README.md) - 完整文档导航
- 📖 [术语定义](./docs/TERMINOLOGY.md) - 业务术语定义

---

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 联系方式

- **项目维护**: HL8 开发团队
- **问题反馈**: [GitHub Issues](https://github.com/your-org/hl8-saas-nx-mono/issues)

---

<details>
<summary>📚 Nx Workspace 使用指南</summary>

## Generate a library

```sh
npx nx g @nx/js:lib packages/pkg1 --publishable --importPath=@my-org/pkg1
```

## Run tasks

To build the library use:

```sh
npx nx build pkg1
```

To run any task with Nx use:

```sh
npx nx <target> <project-name>
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Versioning and releasing

To version and release the library use

```
npx nx release
```

Pass `--dry-run` to see what would happen without actually releasing the library.

[Learn more about Nx release &raquo;](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Keep TypeScript project references up to date

Nx automatically updates TypeScript [project references](https://www.typescriptlang.org/docs/handbook/project-references.html) in `tsconfig.json` files to ensure they remain accurate based on your project dependencies (`import` or `require` statements). This sync is automatically done when running tasks such as `build` or `typecheck`, which require updated references to function correctly.

To manually trigger the process to sync the project graph dependencies information to the TypeScript project references, run the following command:

```sh
npx nx sync
```

You can enforce that the TypeScript project references are always in the correct state when running in CI by adding a step to your CI job configuration that runs the following command:

```sh
npx nx sync:check
```

[Learn more about nx sync](https://nx.dev/reference/nx-commands#sync)

## Nx Cloud

Nx Cloud ensures a [fast and scalable CI](https://nx.dev/ci/intro/why-nx-cloud?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) pipeline. It includes features such as:

- [Remote caching](https://nx.dev/ci/features/remote-cache?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task distribution across multiple machines](https://nx.dev/ci/features/distribute-task-execution?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Automated e2e test splitting](https://nx.dev/ci/features/split-e2e-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Task flakiness detection and rerunning](https://nx.dev/ci/features/flaky-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

### Set up CI (non-Github Actions CI)

**Note:** This is only required if your CI provider is not GitHub Actions.

Use the following command to configure a CI workflow for your workspace:

```sh
npx nx g ci-workflow
```

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/nx-api/js?utm_source=nx_project&amp;utm_medium=readme&amp;utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
