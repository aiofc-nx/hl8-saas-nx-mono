# SAAS-CORE

> **版本**: 0.0.1 | **创建日期**: 2025-01-27 | **用途**: SAAS平台核心业务领域模块

## 📋 项目概述

SAAS-CORE是基于`@hl8/hybrid-archi`架构构建的SAAS平台核心业务领域，整合了平台、租户、组织、部门、用户、认证等核心子领域，为整个SAAS平台提供基础业务能力。

## 🏗️ 架构设计

### 技术栈

- **架构模式**: Clean Architecture + CQRS + 事件溯源 + 事件驱动架构
- **核心依赖**: `@hl8/hybrid-archi`（混合架构核心模块）
- **技术栈**: TypeScript + NestJS + Fastify
- **数据存储**: PostgreSQL + Redis
- **消息队列**: 支持异步事件处理

### 项目结构

```
src/
├── domain/                      # 领域层
│   ├── tenant/                 # 租户管理子领域
│   │   ├── entities/           # 租户实体
│   │   ├── aggregates/         # 租户聚合根
│   │   ├── value-objects/      # 租户值对象
│   │   ├── events/             # 租户领域事件
│   │   └── services/           # 租户领域服务
│   ├── shared/                 # 共享领域对象
│   │   └── value-objects/      # 共享值对象
│   └── ...                     # 其他子领域
├── application/                # 应用层
├── infrastructure/             # 基础设施层
├── interfaces/                 # 接口层
├── config/                     # 配置管理
├── constants/                  # 常量定义
└── saas-core.module.ts        # 主模块
```

## 🚀 快速开始

### 安装依赖

```bash
cd packages/saas-core
pnpm install
```

### 构建项目

```bash
nx build saas-core
```

### 运行测试

```bash
nx test saas-core
```

### 使用模块

```typescript
import { SaasCoreModule } from '@hl8/saas-core';

@Module({
  imports: [
    SaasCoreModule.forRoot({
      database: {
        host: 'localhost',
        port: 5432,
        database: 'saas_core'
      },
      cache: {
        host: 'localhost',
        port: 6379
      }
    })
  ]
})
export class AppModule {}
```

## 📊 开发进度

### ✅ 已完成

- [x] 项目基础架构搭建
- [x] 依赖配置和集成
- [x] 共享领域对象创建
- [x] 租户管理领域实现
  - [x] Tenant实体类
  - [x] TenantAggregate聚合根
  - [x] 租户相关领域事件
  - [x] TenantId值对象（已移动到@hl8/hybrid-archi）
- [x] 基础配置和常量定义
- [x] 单元测试框架

### 🔄 进行中

- [ ] 租户ID值对象测试用例

### ⏳ 待开始

- [ ] 用户管理领域实现
- [ ] 组织管理领域实现
- [ ] 部门管理领域实现
- [ ] 认证授权领域实现
- [ ] 应用层开发
- [ ] 基础设施层实现
- [ ] 接口层开发

## 🧪 测试

### 运行所有测试

```bash
nx test saas-core
```

### 运行特定测试

```bash
nx test saas-core --testPathPattern=tenant.entity.spec.ts
```

### 测试覆盖率

```bash
nx test saas-core --coverage
```

## 📚 文档

- [开发技术方案指南](../../docs/designs/saas-core-development-guide.md)
- [开发计划](../../docs/plans/saas-core-development-plan.md)
- [进度跟踪](../../docs/plans/saas-core-progress-tracking.md)
- [项目启动清单](../../docs/plans/saas-core-project-checklist.md)

## 🤝 贡献

1. 遵循项目的编码规范
2. 编写完整的测试用例
3. 更新相关文档
4. 提交Pull Request

## 📄 许可证

本项目采用私有许可证，仅供HL8团队内部使用。
