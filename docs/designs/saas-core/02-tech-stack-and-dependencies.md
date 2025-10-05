# SAAS-CORE 技术栈选择与依赖管理

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 核心依赖](#1-核心依赖)
- [2. 依赖分析说明](#2-依赖分析说明)
- [3. 技术选型理由](#3-技术选型理由)
- [4. 安装指南](#4-安装指南)

---

## 1. 核心依赖

### 1.1 package.json 配置

```json
{
  "name": "@hl8/saas-core",
  "version": "1.0.0",
  "description": "SAAS平台核心业务领域模块",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "@hl8/hybrid-archi": "workspace:*",
    "@nestjs/common": "^11.1.6",
    "@nestjs/core": "^11.1.6",
    "@nestjs/platform-fastify": "^11.1.6",
    "@nestjs/terminus": "^10.0.0",
    "redis": "^4.6.0",
    "@casl/ability": "^6.7.0"
  },
  "devDependencies": {
    "@types/pg": "^8.10.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.3.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0"
  }
}
```

---

## 2. 依赖分析说明

### 2.1 已包含在 @hl8/hybrid-archi 中的所有基础设施

`@hl8/hybrid-archi` 通过 `InfrastructureModule` 集成了以下所有基础设施模块：

```json
{
  "基础设施模块": {
    "@hl8/cache": "缓存系统",
    "@hl8/logger": "日志系统", 
    "@hl8/config": "配置管理",
    "@hl8/messaging": "消息队列",
    "@hl8/multi-tenancy": "多租户支持",
    "@hl8/database": "数据库管理",
    "@hl8/fastify-pro": "Fastify企业级集成"
  },
  "通用依赖": {
    "@nestjs/config": "NestJS配置模块",
    "@nestjs/cache-manager": "NestJS缓存管理器",
    "class-validator": "验证器",
    "class-transformer": "转换器",
    "tslib": "TypeScript库",
    "uuid": "UUID生成器",
    "reflect-metadata": "反射元数据",
    "rxjs": "响应式编程库",
    "fastify": "Web框架",
    "@fastify/cors": "CORS支持",
    "@fastify/static": "静态文件服务",
    "@mikro-orm/core": "MikroORM核心",
    "@mikro-orm/nestjs": "MikroORM NestJS集成",
    "@mikro-orm/migrations": "MikroORM迁移",
    "pg": "PostgreSQL驱动",
    "nestjs-cls": "上下文本地存储"
  }
}
```

### 2.2 需要单独安装的依赖

只有以下依赖需要单独安装，因为它们不在 `@hl8/hybrid-archi` 中：

```json
{
  "必需依赖": {
    "@hl8/hybrid-archi": "混合架构核心模块（包含所有基础设施）",
    "@nestjs/common": "NestJS核心",
    "@nestjs/core": "NestJS核心", 
    "@nestjs/platform-fastify": "Fastify平台支持",
    "@nestjs/terminus": "健康检查",
    "redis": "Redis客户端",
    "@casl/ability": "CASL权限管理"
  }
}
```

### 2.3 关键优势

通过使用 `@hl8/hybrid-archi` 的 `InfrastructureModule`，我们实现了：

1. **统一架构**：所有基础设施通过一个模块统一管理
2. **依赖简化**：只需要安装 `@hl8/hybrid-archi` 即可获得所有基础设施
3. **配置一致**：所有基础设施使用统一的配置模式
4. **版本兼容**：基础设施模块版本统一，避免兼容性问题
5. **开发效率**：减少重复配置，专注于业务逻辑开发

---

## 3. 技术选型理由

### 3.1 框架选择

#### 3.1.1 NestJS

- **企业级特性**: 支持依赖注入和模块化
- **TypeScript 原生支持**: 完整的类型安全
- **丰富的生态系统**: 大量的官方和社区模块
- **性能优异**: 基于 Express/Fastify 的高性能框架

#### 3.1.2 Fastify

- **高性能**: 比 Express 快 2-3 倍
- **低开销**: 最小的性能开销
- **类型安全**: 完整的 TypeScript 支持
- **插件生态**: 丰富的插件系统

#### 3.1.3 MikroORM

- **现代化设计**: 专为 TypeScript 设计的 ORM
- **多数据库支持**: PostgreSQL, MySQL, SQLite, MongoDB
- **高级查询**: 支持复杂查询和关联
- **迁移管理**: 完整的数据库迁移支持

### 3.2 数据存储

#### 3.2.1 PostgreSQL

- **成熟稳定**: 企业级关系型数据库
- **高级特性**: 支持 JSON、数组、全文搜索等
- **ACID 事务**: 完整的事务支持
- **扩展性**: 支持水平和垂直扩展

#### 3.2.2 Redis

- **高性能**: 内存数据库，极快的读写速度
- **多数据结构**: 支持字符串、列表、集合、哈希等
- **持久化**: 支持 RDB 和 AOF 持久化
- **集群支持**: 支持主从复制和集群模式

### 3.3 开发工具

#### 3.3.1 TypeScript

- **类型安全**: 编译时类型检查
- **智能提示**: 完整的 IDE 支持
- **重构支持**: 安全的代码重构
- **团队协作**: 减少类型相关的 bug

#### 3.3.2 Jest

- **零配置**: 开箱即用的测试框架
- **快照测试**: 支持组件快照测试
- **覆盖率报告**: 完整的测试覆盖率统计
- **并行执行**: 支持并行测试执行

#### 3.3.3 ESLint

- **代码质量**: 统一的代码风格和质量标准
- **自动修复**: 支持自动修复常见问题
- **插件生态**: 丰富的插件和规则
- **团队协作**: 统一的代码规范

---

## 4. 安装指南

### 4.1 环境要求

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0

### 4.2 安装步骤

```bash
# 1. 初始化项目
mkdir saas-core
cd saas-core
npm init -y

# 2. 安装核心依赖
pnpm add @hl8/hybrid-archi
pnpm add @nestjs/common @nestjs/core @nestjs/platform-fastify
pnpm add @nestjs/terminus
pnpm add redis @casl/ability

# 3. 安装开发依赖
pnpm add -D @types/pg @types/uuid typescript jest ts-jest

# 4. 创建基础目录结构
mkdir -p src/{config,domain,application,infrastructure,interface}
mkdir -p src/domain/{tenant,user,organization,department}
mkdir -p src/application/{commands,queries,handlers,services}
mkdir -p src/infrastructure/{repositories,adapters,events}
mkdir -p src/interface/{controllers,dtos,middleware}
```

### 4.3 配置文件

#### 4.3.1 TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

#### 4.3.2 Jest 配置

```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [项目结构与模块职责](./03-project-structure.md)
- [领域层开发指南](./04-domain-layer-development.md)
- [应用层开发指南](./05-application-layer-development.md)
- [基础设施层开发指南](./06-infrastructure-layer-development.md)
- [接口层开发指南](./07-interface-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [测试策略与部署运维](./09-testing-and-deployment.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)
