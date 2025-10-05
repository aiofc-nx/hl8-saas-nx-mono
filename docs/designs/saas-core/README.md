# SAAS-CORE 技术文档

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 文档目录

本文档集提供了 SAAS-CORE 模块的完整技术指南，已按功能模块拆分为多个独立文档，便于维护和查阅。

### 📚 核心文档

| 文档 | 描述 | 状态 |
|------|------|------|
| [01-overview-and-architecture.md](./01-overview-and-architecture.md) | 项目概述与架构设计 | ✅ 已完成 |
| [02-tech-stack-and-dependencies.md](./02-tech-stack-and-dependencies.md) | 技术栈选择与依赖管理 | ✅ 已完成 |
| [03-project-structure.md](./03-project-structure.md) | 项目结构与模块职责 | ✅ 已完成 |
| [04-domain-layer-development.md](./04-domain-layer-development.md) | 领域层开发指南 | ✅ 已完成 |
| [05-application-layer-development.md](./05-application-layer-development.md) | 应用层开发指南 | ✅ 已完成 |
| [06-infrastructure-layer-development.md](./06-infrastructure-layer-development.md) | 基础设施层开发指南 | ✅ 已完成 |
| [07-interface-layer-development.md](./07-interface-layer-development.md) | 接口层开发指南 | ✅ 已完成 |
| [08-business-modules.md](./08-business-modules.md) | 业务功能模块开发 | ✅ 已完成 |
| [09-testing-and-deployment.md](./09-testing-and-deployment.md) | 测试策略与部署运维 | ✅ 已完成 |
| [10-best-practices-and-faq.md](./10-best-practices-and-faq.md) | 最佳实践与常见问题 | ✅ 已完成 |

---

## 🎯 文档使用指南

### 新手入门路径

1. **开始**: [项目概述与架构设计](./01-overview-and-architecture.md) - 了解整体架构和设计原则
2. **环境**: [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md) - 搭建开发环境
3. **结构**: [项目结构与模块职责](./03-project-structure.md) - 理解项目组织方式
4. **开发**: [领域层开发指南](./04-domain-layer-development.md) - 开始业务逻辑开发

### 开发参考路径

- **领域建模**: [领域层开发指南](./04-domain-layer-development.md)
- **用例实现**: [应用层开发指南](./05-application-layer-development.md)
- **技术集成**: [基础设施层开发指南](./06-infrastructure-layer-development.md)
- **接口开发**: [接口层开发指南](./07-interface-layer-development.md)

### 业务功能路径

- **租户管理**: [业务功能模块开发](./08-business-modules.md) - 租户相关功能
- **用户管理**: [业务功能模块开发](./08-business-modules.md) - 用户相关功能
- **组织架构**: [业务功能模块开发](./08-business-modules.md) - 组织部门管理

### 质量保证路径

- **测试策略**: [测试策略与部署运维](./09-testing-and-deployment.md)
- **最佳实践**: [最佳实践与常见问题](./10-best-practices-and-faq.md)

---

## 🏗️ 架构概览

### 混合架构模式

SAAS-CORE 采用混合架构模式，结合了四种强大的架构模式：

- **Clean Architecture**: 清晰的分层架构和依赖方向
- **CQRS**: 命令查询职责分离
- **Event Sourcing**: 事件溯源能力
- **Event-Driven Architecture**: 事件驱动架构

### 核心设计原则

- **充血模型**: 业务逻辑集中在领域层
- **实体与聚合根分离**: 聚合根作为管理者，实体作为被管理者
- **用例为中心**: 应用层以业务用例为核心
- **适配器模式**: 基础设施层使用适配器模式
- **多协议支持**: 接口层支持 REST、GraphQL、WebSocket

---

## 🛠️ 技术栈

### 核心框架

- **NestJS**: 企业级 Node.js 框架
- **Fastify**: 高性能 Web 框架
- **MikroORM**: 现代化 TypeScript ORM
- **PostgreSQL**: 关系型数据库
- **Redis**: 缓存和会话存储

### 基础设施

- **@hl8/hybrid-archi**: 混合架构核心模块
- **@hl8/cache**: 缓存系统
- **@hl8/logger**: 日志系统
- **@hl8/config**: 配置管理
- **@hl8/messaging**: 消息队列
- **@hl8/multi-tenancy**: 多租户支持
- **@hl8/database**: 数据库管理
- **@hl8/fastify-pro**: Fastify 企业级集成

---

## 📖 快速开始

### 1. 环境准备

```bash
# 检查环境要求
node --version  # >= 18.0.0
pnpm --version  # >= 8.0.0
```

### 2. 项目初始化

```bash
# 创建项目目录
mkdir saas-core
cd saas-core

# 安装依赖
pnpm add @hl8/hybrid-archi @nestjs/common @nestjs/core @nestjs/platform-fastify
pnpm add @nestjs/terminus redis @casl/ability
```

### 3. 基础配置

参考 [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md) 完成基础配置。

### 4. 开始开发

参考 [领域层开发指南](./04-domain-layer-development.md) 开始业务逻辑开发。

---

## 🤝 贡献指南

### 文档维护

- 每个文档应保持独立性和完整性
- 文档间通过链接建立关联
- 定期更新文档内容，保持与代码同步

### 开发规范

- 遵循混合架构设计原则
- 使用充血模型进行领域建模
- 以用例为中心进行应用层设计
- 使用适配器模式进行基础设施集成

---

## 📞 支持与反馈

如有问题或建议，请参考：

- [最佳实践与常见问题](./10-best-practices-and-faq.md)
- 项目 Issues
- 技术讨论群

---

**最后更新**: 2025-01-27  
**文档版本**: 1.0.0
