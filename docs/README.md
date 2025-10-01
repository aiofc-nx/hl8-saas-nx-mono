# HL8 SAAS 平台文档中心

> 📚 项目文档导航和快速索引

---

## 🎯 新手入门

**刚加入项目？** 按以下顺序阅读：

1. 📖 [项目 README](../README.md) - 了解项目概况和快速开始
2. 📖 [术语定义](./TERMINOLOGY.md) - 理解业务术语和概念
3. 📐 [架构设计原则](./architecture/01-architecture-principles.md) - 理解技术架构
4. 📋 [编码规范](./guidelines/01-coding-standards.md) - 掌握编码规范
5. 💡 [充血模型实践](./guidelines/02-rich-domain-model-practice.md) - 学习实体设计

---

## 📚 文档分类

### 技术架构设计

> 📐 **架构文档目录**: [architecture/](./architecture/)

| 文档 | 说明 | 受众 |
|------|------|------|
| [01-架构设计原则](./architecture/01-architecture-principles.md) | Clean Architecture、分层架构 | 架构师、技术负责人 |
| [02-领域驱动设计](./architecture/02-domain-driven-design.md) | DDD、充血模型理论 | 架构师、高级开发 |
| [03-CQRS与事件溯源](./architecture/03-cqrs-event-sourcing.md) | 命令查询分离、事件溯源 | 后端开发人员 |
| [04-事件驱动架构](./architecture/04-event-driven-architecture.md) | 事件驱动、消息队列 | 后端开发人员 |

### 开发编码规范

> 📋 **规范文档目录**: [guidelines/](./guidelines/)

| 文档 | 说明 | 适用人员 |
|------|------|---------|
| [01-编码规范总览](./guidelines/01-coding-standards.md) | TypeScript代码规范、格式化 | 所有开发人员 |
| [02-充血模型实践](./guidelines/02-rich-domain-model-practice.md) | 充血模型编码实战 | 后端开发人员 |
| [03-常量管理规范](./guidelines/03-constants-management.md) | 常量统一管理 | 所有开发人员 |
| [04-代码注释规范](./guidelines/04-code-comments.md) | TSDoc 注释标准 | 所有开发人员 |
| [05-命名规范](./guidelines/05-naming-conventions.md) | 命名规则 | 所有开发人员 |
| [06-类型安全规范](./guidelines/06-type-safety.md) | TypeScript 类型安全 | 所有开发人员 |
| [07-测试规范](./guidelines/07-testing-standards.md) | 测试规范 | 所有开发人员 |
| [08-Git提交规范](./guidelines/08-git-conventions.md) | Git 规范 | 所有开发人员 |

### 设计文档

| 文档 | 说明 | 适用人员 |
|------|------|---------|
| [系统架构设计](./saas-platform-architecture.md) | 整体架构设计 | 架构师、技术负责人 |
| [缓存模块设计](./cache-module-cls-design.md) | 缓存模块设计文档 | 后端开发人员 |
| [数据库模块设计](./database-module-design.md) | 数据库模块设计文档 | 后端开发人员 |
| [消息队列设计](./messaging-module-multitenancy-design.md) | 消息队列模块设计 | 后端开发人员 |
| [多租户设计](./multi-tenancy-final-design.md) | 多租户模块设计 | 后端开发人员 |

### 业务文档

| 文档 | 说明 | 适用人员 |
|------|------|---------|
| [术语定义](./TERMINOLOGY.md) | 业务术语和概念定义 | 所有团队成员 |

### 模块文档

| 模块 | 文档位置 | 说明 |
|------|---------|------|
| cache | [packages/cache/README.md](../packages/cache/README.md) | 缓存模块使用指南 |
| logger | [packages/logger/README.md](../packages/logger/README.md) | 日志模块使用指南 |
| multi-tenancy | [packages/multi-tenancy/README.md](../packages/multi-tenancy/README.md) | 多租户模块使用指南 |
| messaging | [packages/messaging/README.md](../packages/messaging/README.md) | 消息队列模块使用指南 |

---

## 🔍 快速索引

### 按主题查找

#### 架构相关

- [Clean Architecture 分层](./DEVELOPMENT_GUIDELINES.md#21-分层架构)
- [充血模型详解](./RICH_DOMAIN_MODEL.md)
- [CQRS 模式](./DEVELOPMENT_GUIDELINES.md#23-cqrs-模式)
- [事件驱动架构](./DEVELOPMENT_GUIDELINES.md#24-事件驱动架构)
- [实体与聚合根分离](./DEVELOPMENT_GUIDELINES.md#实体与聚合根分离)

#### 代码规范

- [常量管理规范](./DEVELOPMENT_GUIDELINES.md#4-常量管理规范)
- [注释规范](./DEVELOPMENT_GUIDELINES.md#5-注释规范)
- [命名规范](./DEVELOPMENT_GUIDELINES.md#6-命名规范)
- [文件组织规范](./DEVELOPMENT_GUIDELINES.md#7-文件组织规范)
- [类型安全规范](./DEVELOPMENT_GUIDELINES.md#9-类型安全规范)

#### 实体设计

- [充血模型 vs 贫血模型](./RICH_DOMAIN_MODEL.md#3-充血模型-vs-贫血模型)
- [实体设计原则](./RICH_DOMAIN_MODEL.md#4-实体设计原则)
- [值对象设计](./RICH_DOMAIN_MODEL.md#5-值对象设计)
- [聚合根设计](./RICH_DOMAIN_MODEL.md#6-聚合根设计)
- [服务层职责](./RICH_DOMAIN_MODEL.md#7-服务层职责)

#### 最佳实践

- [常量管理最佳实践](./DEVELOPMENT_GUIDELINES.md#41-常量文件结构)
- [TypeScript 类型安全](./DEVELOPMENT_GUIDELINES.md#9-类型安全规范)
- [测试规范](./DEVELOPMENT_GUIDELINES.md#10-测试规范)
- [性能优化建议](./DEVELOPMENT_GUIDELINES.md#122-性能优化建议)
- [安全建议](./DEVELOPMENT_GUIDELINES.md#123-安全建议)

---

## 💡 常见问题

### 开发规范相关

**Q: 如何管理项目常量？**  
A: 查看 [常量管理规范](./DEVELOPMENT_GUIDELINES.md#4-常量管理规范)

**Q: 如何编写符合规范的注释？**  
A: 查看 [注释规范](./DEVELOPMENT_GUIDELINES.md#5-注释规范) 和 [代码注释规范](./code-comment-standards.md)

**Q: 文件应该如何命名？**  
A: 查看 [命名规范](./DEVELOPMENT_GUIDELINES.md#6-命名规范)

### 架构设计相关

**Q: 什么是充血模型？为什么要使用？**  
A: 查看 [充血模型实践指南](./RICH_DOMAIN_MODEL.md#1-什么是充血模型)

**Q: 业务逻辑应该写在哪里？**  
A: 查看 [充血模型 - 服务层职责](./RICH_DOMAIN_MODEL.md#7-服务层职责)

**Q: 实体和聚合根有什么区别？**  
A: 查看 [实体与聚合根分离](./DEVELOPMENT_GUIDELINES.md#实体与聚合根分离)

**Q: 什么时候使用值对象？**  
A: 查看 [值对象设计](./RICH_DOMAIN_MODEL.md#5-值对象设计)

### 实践相关

**Q: 如何设计一个新的实体？**  
A: 按照 [充血模型检查清单](./RICH_DOMAIN_MODEL.md#开发检查清单)

**Q: 如何进行代码审查？**  
A: 使用 [代码审查清单](./DEVELOPMENT_GUIDELINES.md#121-代码审查清单)

---

## 🚀 快速参考

### 常量定义模板

```typescript
// packages/{module}/src/lib/constants.ts

export const DI_TOKENS = {
  MODULE_OPTIONS: 'MODULE_OPTIONS',
} as const;

export const DECORATOR_METADATA = {
  CACHEABLE: 'cacheable',
} as const;

export const MODULE_DEFAULTS = {
  TTL: 3600,
  MAX_RETRIES: 3,
} as const;

export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];
```

### 充血模型实体模板

```typescript
/**
 * {实体名称}
 *
 * @description {实体描述}
 *
 * ## 业务规则
 * - {规则1}
 * - {规则2}
 *
 * @since 1.0.0
 */
class EntityName extends BaseEntity {
  private id: EntityId;
  private status: EntityStatus;
  
  private constructor(id: EntityId) {
    super(id);
    this.id = id;
    this.status = EntityStatus.Initial;
  }
  
  static create(...params): EntityName {
    const entity = new EntityName(...);
    entity.addDomainEvent(new EntityCreatedEvent(...));
    return entity;
  }
  
  /**
   * 业务方法
   *
   * @description 方法描述
   *
   * ## 业务规则
   * - 规则描述
   *
   * @throws {ExceptionType} 异常说明
   */
  businessMethod(): void {
    this.ensureBusinessRule();
    // 业务逻辑
    this.addDomainEvent(new BusinessEvent(...));
  }
  
  private ensureBusinessRule(): void {
    if (!this.isValid()) {
      throw new BusinessRuleViolationException();
    }
  }
  
  // Getter方法
  getId(): EntityId {
    return this.id;
  }
  
  getStatus(): EntityStatus {
    return this.status;
  }
}
```

### TSDoc 注释模板

```typescript
/**
 * {简短描述}
 *
 * @description {详细描述}
 *
 * ## 业务规则
 * - {规则1}
 * - {规则2}
 *
 * @param {参数名} - {参数说明}
 * @returns {返回值说明}
 * @throws {异常类型} {异常说明}
 *
 * @example
 * ```typescript
 * {示例代码}
 * ```
 *
 * @since 1.0.0
 */
```

---

## 📊 文档更新记录

| 日期 | 文档 | 更新内容 |
|------|------|---------|
| 2025-10-01 | DEVELOPMENT_GUIDELINES.md | 创建完整开发规范 |
| 2025-10-01 | RICH_DOMAIN_MODEL.md | 创建充血模型实践指南 |
| 2025-10-01 | README.md | 更新文档索引和引用 |

---

## 🤝 贡献文档

如果您发现文档问题或有改进建议：

1. 在对应文档中标注问题
2. 提交 Issue 或 Pull Request
3. 参与文档评审

---

## 📞 获取帮助

- **文档问题**: 提交 Issue
- **技术问题**: 联系技术负责人
- **业务问题**: 联系产品经理

---

**文档维护**: HL8 开发团队  
**最后更新**: 2025-10-01
