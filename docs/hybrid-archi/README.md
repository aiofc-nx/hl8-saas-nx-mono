# hybrid-archi 架构设计文档

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  
> **文档类型**: 架构设计文档索引  

---

## 📚 文档导航

### 核心架构文档

#### 1. [架构概述](00-overview.md) ⭐ **必读**

**内容**：

- 模块定位与职责
- 架构愿景
- 混合架构模式详解
- 架构分层详解
- 核心组件说明
- SOLID 设计原则
- 技术栈
- 完整架构图

**适合人群**：所有开发者

**阅读时间**：30 分钟

---

#### 2. [领域层设计](01-domain-layer.md) ⭐⭐⭐ **核心**

**内容**：

- 领域层概述和职责
- BaseEntity - 基础实体
- BaseAggregateRoot - 基础聚合根
- BaseValueObject - 基础值对象
- BaseDomainEvent - 基础领域事件
- 充血模型设计原则
- 实体与聚合根分离原则
- 完整实现模板
- DO & DON'T 最佳实践

**适合人群**：所有开发者（必读）

**阅读时间**：45 分钟

---

#### 3. [应用层设计](02-application-layer.md) ⭐⭐⭐ **核心**

**内容**：

- 应用层概述和职责
- 用例系统（IUseCase）
- CQRS 系统（CommandBus、QueryBus、EventBus）
- Saga 系统（分布式事务编排）
- 事件投影器（更新读模型）
- 应用服务（缓存、权限）
- 用例设计原则
- CQRS 最佳实践
- 完整实现模板

**适合人群**：所有开发者（必读）

**阅读时间**：40 分钟

---

#### 4. [基础设施层设计](03-infrastructure-layer.md) ⭐⭐ **重要**

**内容**：

- 基础设施层概述和职责
- 仓储实现（Repository Implementation）
- 适配器模式（Adapter Pattern）
- 事件存储实现（Event Store）
- 快照存储实现（Snapshot Store）
- 端口适配器架构
- 数据映射器（Mapper）
- 仓储和适配器最佳实践
- 完整实现模板

**适合人群**：后端开发者、架构师

**阅读时间**：35 分钟

---

#### 5. [接口层设计](04-interface-layer.md) ⭐⭐ **重要**

**内容**：

- 接口层概述和职责
- BaseController - REST 控制器基类
- 守卫系统（JwtAuthGuard、PermissionGuard、TenantIsolationGuard）
- 装饰器（@RequirePermissions、@CacheTTL）
- 管道（ValidationPipe）
- REST API 设计规范
- 安全机制（认证、授权、租户隔离）
- DTO 设计和验证
- 控制器最佳实践
- 完整实现模板

**适合人群**：前端开发者、后端开发者

**阅读时间**：30 分钟

---

#### 6. [CQRS 模式设计](05-cqrs-pattern.md) ⭐⭐⭐ **核心**

**内容**：

- CQRS 概述和核心概念
- 命令端架构设计（Command Side）
- 查询端架构设计（Query Side）
- CommandBus - 命令总线详解
- QueryBus - 查询总线详解
- EventBus - 事件总线详解
- 命令处理流程
- 查询处理流程
- 事件发布订阅
- 命令和查询设计最佳实践
- 完整实现示例

**适合人群**：所有开发者（必读）

**阅读时间**：50 分钟

---

#### 6. [事件溯源设计](06-event-sourcing.md) ⭐⭐⭐ **核心**

**内容**：

- 事件溯源概述和核心思想
- 事件流（Event Stream）
- 状态重建（State Reconstruction）
- 快照机制（Snapshot）
- 事件存储（Event Store）
- 事件溯源架构图
- 快照优化策略
- 实现指南和示例

**适合人群**：后端开发者、架构师

**阅读时间**：40 分钟

---

#### 7. [事件驱动架构设计](07-event-driven-architecture.md) ⭐⭐⭐ **核心**

**内容**：

- 事件驱动架构概述
- 核心概念（Event Bus、Event Handler）
- 发布订阅模式（Publish-Subscribe）
- 事件总线实现
- 事件处理器实现
- 异步处理和重试机制
- 事件驱动架构图
- 最佳实践（解耦、异步、幂等性）

**适合人群**：所有开发者（必读）

**阅读时间**：35 分钟

---

### 专题文档（计划中）

#### 8. [多租户架构设计](08-multi-tenancy.md) ⏳

**计划内容**：

- 多租户概述
- 租户隔离策略
- 数据隔离实现
- 租户上下文管理
- 性能优化

**状态**：待创建

---

## 📖 学习路径

### 路径 1: 快速入门（新手）

```
1. 架构概述 (00-overview.md)
   ↓
2. 领域层设计 (01-domain-layer.md)
   ↓
3. 应用层设计 (02-application-layer.md)
   ↓
4. 快速开始指南 (../guides/getting-started.md)
```

**时间**：约 2-3 小时  
**目标**：了解基本概念，能够开始开发

---

### 路径 2: 全面理解（进阶）

```
1. 架构概述 (00-overview.md)
   ↓
2. 领域层设计 (01-domain-layer.md)
   ↓
3. 应用层设计 (02-application-layer.md)
   ↓
4. CQRS 模式设计 (05-cqrs-pattern.md)
   ↓
5. 基础设施层设计 (03-infrastructure-layer.md)
   ↓
6. 接口层设计 (04-interface-layer.md)
```

**时间**：约 4-5 小时  
**目标**：全面理解架构，掌握最佳实践

---

### 路径 3: 专题深入（高级）

```
1. 全面理解路径（路径 2）
   ↓
2. 事件溯源设计 (06-event-sourcing.md)
   ↓
3. 多租户架构设计 (07-multi-tenancy.md)
   ↓
4. 示例代码学习 (../../examples/)
```

**时间**：约 8-10 小时  
**目标**：精通架构，能够指导他人

---

## 🎯 文档使用指南

### 按角色查看

#### 新成员

**必读文档**：

- ✅ 架构概述 (00-overview.md)
- ✅ 领域层设计 (01-domain-layer.md)
- ✅ 快速开始指南 (../guides/getting-started.md)

**可选文档**：

- CQRS 模式设计 (05-cqrs-pattern.md)
- 应用层设计 (02-application-layer.md)

#### 前端开发者

**必读文档**：

- ✅ 架构概述 (00-overview.md)
- ✅ 接口层设计 (04-interface-layer.md)
- ✅ CQRS 模式设计 (05-cqrs-pattern.md)

**可选文档**：

- 应用层设计 (02-application-layer.md)

#### 后端开发者

**必读文档**：

- ✅ 架构概述 (00-overview.md)
- ✅ 领域层设计 (01-domain-layer.md)
- ✅ 应用层设计 (02-application-layer.md)
- ✅ CQRS 模式设计 (05-cqrs-pattern.md)

**推荐文档**：

- 基础设施层设计 (03-infrastructure-layer.md)
- 接口层设计 (04-interface-layer.md)

#### 架构师

**必读文档**：

- ✅ 所有架构文档

---

## 📊 文档完整性

### 当前状态

| 文档 | 状态 | 完成度 |
|------|------|--------|
| 00-overview.md | ✅ | 100% |
| 01-domain-layer.md | ✅ | 100% |
| 02-application-layer.md | ✅ | 100% |
| 03-infrastructure-layer.md | ✅ | 100% |
| 04-interface-layer.md | ✅ | 100% |
| 05-cqrs-pattern.md | ✅ | 100% |
| 06-event-sourcing.md | ✅ | 100% |
| 07-event-driven-architecture.md | ✅ | 100% |
| 08-multi-tenancy.md | ⏳ | 0% |

### 覆盖范围

```
✅ 已覆盖（8/9）：
  - 混合架构概述 ✅
  - 四层架构设计（领域、应用、基础设施、接口）✅
  - 五大模式中的四个：
    ├── Clean Architecture ✅
    ├── DDD ✅
    ├── CQRS ✅
    ├── Event Sourcing ✅
    └── Event-Driven Architecture ✅
  - 核心组件 ✅
  - 设计原则 ✅
  - 最佳实践 ✅

⏳ 待补充（1/9）：
  - 多租户架构详细设计
```

---

## 🔄 文档更新流程

### 更新原则

1. **保持同步**：代码变更时同步更新文档
2. **版本管理**：文档包含版本号和更新日期
3. **示例更新**：示例代码与实际代码保持一致
4. **反馈驱动**：根据团队反馈持续改进

### 更新责任

- **架构团队**：维护架构概述和设计原则
- **开发团队**：维护实现指南和示例
- **技术文档团队**：维护文档质量和格式

---

## 💬 反馈和建议

如果你在阅读文档时有任何疑问或建议：

- **提交 Issue**: [GitHub Issues](https://github.com/your-org/hl8-saas-nx-mono/issues)
- **团队讨论**: 每周架构评审会
- **直接联系**: 架构团队负责人

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27  
**版本**: 1.0.0
