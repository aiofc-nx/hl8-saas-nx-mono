# 代码审查检查清单

**版本**: 1.0.0  
**更新日期**: 2025-10-09  
**适用范围**: 所有业务模块代码审查

---

## 📋 目录

- [宪章合规性检查](#宪章合规性检查)
- [架构设计检查](#架构设计检查)
- [代码质量检查](#代码质量检查)
- [安全性检查](#安全性检查)
- [性能检查](#性能检查)
- [测试检查](#测试检查)

---

## 宪章合规性检查

### 依赖管理

- [ ] **禁止使用 @nestjs/cqrs**
  - 检查：搜索 `from '@nestjs/cqrs'` 导入语句
  - 正确做法：使用 `@hl8/hybrid-archi` 的 CQRS 组件

- [ ] **禁止直接使用 NestJS 内置 Logger**
  - 检查：搜索 `from '@nestjs/common'` 中的 `Logger` 导入
  - 正确做法：使用 `@hl8/logger` 的 `PinoLogger`

- [ ] **禁止使用 @nestjs/config**
  - 检查：搜索 `from '@nestjs/config'` 导入语句
  - 正确做法：使用 `@hl8/config` 的配置服务

- [ ] **禁止直接使用缓存第三方库**
  - 检查：搜索 `cache-manager`、`@nestjs/cache-manager`、直接的 `redis` 导入
  - 正确做法：使用 `@hl8/cache` 的 `CacheService`

### CQRS 实现

- [ ] **命令类正确继承基类**
  - 检查：所有命令类是否继承 `BaseCommand` 或 `CqrsBaseCommand`
  - 验证：命令类构造函数是否正确传递 `tenantId` 和 `userId`

- [ ] **查询类正确继承基类**
  - 检查：所有查询类是否继承 `BaseQuery` 或 `CqrsBaseQuery`
  - 验证：查询类是否实现 `createCopyWithSortRules` 抽象方法

- [ ] **领域事件正确继承基类**
  - 检查：所有领域事件类是否继承 `BaseDomainEvent`
  - 验证：事件类是否实现 `eventType` getter 方法
  - 验证：`toJSON()` 方法是否使用 `override` 关键字

- [ ] **处理器正确实现接口**
  - 检查：命令处理器实现 `ICommandHandler<TCommand, TResult>`
  - 检查：查询处理器实现 `IQueryHandler<TQuery, TResult>`
  - 检查：事件处理器实现 `IEventHandler<TEvent>`

### EventBus vs Messaging 使用

> 📖 参考：[HL8 SAAS 平台宪章 - EventBus vs Messaging 使用指南](../.specify/memory/constitution.md#eventbus-vs-messaging-使用指南)

- [ ] **EventBus 使用正确性**
  - ✅ 用于聚合根发布领域事件
  - ✅ 用于 CQRS 读写模型同步
  - ✅ 用于领域模型状态变更通知
  - ❌ 不用于跨服务通信
  - ❌ 不用于长时间异步任务

- [ ] **@hl8/messaging 使用正确性**
  - ✅ 用于跨服务/微服务通信
  - ✅ 用于异步任务（发送邮件、生成报表）
  - ✅ 用于长时间运行的后台任务
  - ❌ 不用于进程内的领域事件处理
  - ❌ 不用于 CQRS 读写模型同步

- [ ] **事件类型正确区分**
  - **领域事件**：命名如 `TenantCreatedEvent`，使用 EventBus 处理
  - **集成事件**：命名如 `integration.tenant.created`，使用 messaging 发布
  - 检查：事件处理器是否正确区分两种事件类型

- [ ] **事件处理器架构正确**

  ```typescript
  // ✅ 正确的模式
  @EventHandler('DomainEvent')
  export class DomainEventHandler implements IEventHandler<DomainEvent> {
    constructor(
      @Optional() private readonly messagingService?: MessagingService
    ) {}
  
    async handle(event: DomainEvent): Promise<void> {
      // 1. 处理领域逻辑（EventBus，必须）
      // ...
      
      // 2. 发布集成事件（Messaging，可选）
      if (this.messagingService) {
        await this.messagingService.publish('integration.event', {...});
      }
    }
  }
  ```

### 多租户架构

- [ ] **聚合根继承正确的基类**
  - 检查：业务聚合根是否继承 `TenantAwareAggregateRoot`
  - 验证：聚合根构造函数是否正确传递 `tenantId`

- [ ] **租户上下文验证**
  - 检查：是否使用 `TenantFilterUtils.validateTenantContext()`
  - 检查：是否应用租户过滤器 `createTenantFilter()`

- [ ] **禁止跨租户数据访问**
  - 检查：是否有绕过租户过滤器的查询
  - 检查：是否有硬编码的租户 ID

---

## 架构设计检查

### Clean Architecture 分层

- [ ] **依赖方向正确**
  - 外层依赖内层，内层不依赖外层
  - Domain → Application → Infrastructure → Interface

- [ ] **领域层纯净性**
  - 领域层不依赖外部框架（除 `@hl8/hybrid-archi` 基类）
  - 领域层不包含技术实现细节
  - 领域层不直接依赖数据库、HTTP、消息队列

- [ ] **应用层职责正确**
  - 用例（Use Case）编排领域对象
  - 用例不包含业务逻辑（业务逻辑在领域对象中）
  - CQRS 处理器调用用例，不直接操作领域对象

### DDD 实践

- [ ] **聚合根职责清晰**
  - 聚合根管理一致性边界
  - 聚合根协调内部实体操作
  - 聚合根发布领域事件

- [ ] **实体与聚合根分离**
  - 实体执行具体业务操作
  - 实体通过聚合根访问
  - 实体不直接暴露给外层

- [ ] **值对象不可变性**
  - 值对象使用 `readonly` 属性
  - 值对象没有 setter 方法
  - 值对象修改返回新实例

- [ ] **领域事件使用正确**
  - 重要的业务变更发布事件
  - 事件命名使用过去式（如 `OrderPlacedEvent`）
  - 事件包含完整的业务上下文

---

## 代码质量检查

### TSDoc 注释

- [ ] **所有公共 API 有完整注释**
  - 类、接口、枚举有 `@description`
  - 方法有 `@param`、`@returns`、`@throws`
  - 复杂逻辑有 `@example`

- [ ] **注释使用中文**
  - 遵循"中文优先原则"
  - 注释清晰、准确、完整

- [ ] **注释描述业务规则**
  - 包含业务规则说明
  - 包含前置条件、后置条件
  - 包含异常场景说明

### TypeScript 类型安全

- [ ] **避免使用 `any`**
  - 检查：搜索 `as any` 类型断言
  - 正确做法：使用具体类型或泛型

- [ ] **正确使用 `override` 关键字**
  - 覆盖父类方法时使用 `override`
  - 避免意外覆盖

- [ ] **正确使用访问修饰符**
  - 使用 `private`、`protected`、`public` 明确访问级别
  - 领域模型优先使用 `private` 保护数据

### 命名规范

- [ ] **类名使用 PascalCase**
  - 例如：`UserAggregate`、`TenantCreatedEvent`

- [ ] **方法名使用 camelCase**
  - 例如：`createUser()`、`handleEvent()`

- [ ] **常量使用 UPPER_SNAKE_CASE**
  - 例如：`MAX_RETRY_COUNT`、`DEFAULT_TIMEOUT`

- [ ] **使用统一业务术语**
  - 参考：`docs/definition-of-terms.mdc`
  - 禁止混用同义词（如"组织"和"部门"）

---

## 安全性检查

### 身份认证和授权

- [ ] **所有 API 端点有身份验证**
  - 使用 `@RequireAuth()` 装饰器
  - 或在控制器级别配置认证

- [ ] **权限检查正确**
  - 使用 `@RequirePermissions()` 装饰器
  - 检查权限粒度是否合理

### 数据安全

- [ ] **敏感数据加密存储**
  - 密码使用 bcrypt 或 argon2
  - 敏感字段使用加密存储

- [ ] **输入验证完整**
  - 使用 `class-validator` 验证 DTO
  - 领域层进行业务规则验证

- [ ] **防止 SQL 注入**
  - 使用 ORM 查询构建器
  - 避免字符串拼接 SQL

---

## 性能检查

### 数据库查询

- [ ] **避免 N+1 查询问题**
  - 使用 `populate()` 预加载关联数据
  - 使用 `join` 优化查询

- [ ] **合理使用索引**
  - 频繁查询的字段添加索引
  - 租户 ID、创建时间等字段建索引

- [ ] **分页查询大数据集**
  - 使用 `offset`/`limit` 分页
  - 考虑游标分页（cursor-based）

### 缓存使用

- [ ] **合理使用缓存**
  - 频繁读取的数据使用缓存
  - 使用 `@Cacheable()` 装饰器

- [ ] **缓存失效策略正确**
  - 数据变更时清除相关缓存
  - 设置合理的 TTL

---

## 测试检查

### 单元测试

- [ ] **核心业务逻辑有单元测试**
  - 领域模型的业务方法
  - 用例的核心逻辑
  - 复杂的验证规则

- [ ] **测试文件位置正确**
  - 单元测试与源文件同目录
  - 命名：`{源文件名}.spec.ts`

- [ ] **测试覆盖率达标**
  - 核心业务逻辑 ≥ 80%
  - 关键路径 ≥ 90%

### 集成测试

- [ ] **关键流程有集成测试**
  - CQRS 流程测试
  - 数据库集成测试
  - 事件发布订阅测试

- [ ] **集成测试位置正确**
  - 位于 `__tests__/integration/` 目录

---

## 审查流程

### 审查前

1. **自检**：开发者使用本检查清单自检代码
2. **运行测试**：确保所有测试通过
3. **运行 lint**：确保代码通过 ESLint 检查

### 审查中

1. **功能正确性**：验证功能是否符合需求
2. **架构合规性**：按照本检查清单逐项检查
3. **代码质量**：检查代码可读性、可维护性

### 审查后

1. **修复问题**：开发者修复审查发现的问题
2. **再次审查**：重大问题修复后需要再次审查
3. **合并代码**：审查通过后合并到目标分支

---

## 附录

### 常见问题

#### Q1：为什么不能使用 @nestjs/cqrs？

**A**: 我们使用自定义的 CQRS 实现（`@hl8/hybrid-archi`），提供更好的多租户支持、类型安全和性能优化。详见[宪章 - 业务模块开发指南](../.specify/memory/constitution.md#业务模块开发指南-non-negotiable)。

#### Q2：什么时候使用 EventBus，什么时候使用 messaging？

**A**:

- **EventBus**：进程内的领域事件处理（高性能、严格顺序）
- **messaging**：跨服务通信、异步任务（持久化、可靠传递）

详见[宪章 - EventBus vs Messaging 使用指南](../.specify/memory/constitution.md#eventbus-vs-messaging-使用指南)。

#### Q3：如何区分领域事件和集成事件？

**A**:

- **领域事件**：反映领域模型内部状态变更，使用 EventBus
- **集成事件**：通知其他服务或系统，使用 messaging

详见下一节"[领域事件 vs 集成事件区分指南](./event-types-guide.md)"。

---

## 参考文档

- [HL8 SAAS 平台宪章](../.specify/memory/constitution.md)
- [代码注释规范](./.cursor/constitutions/code-comment-standards.md)
- [测试规范](./testing-standards.md)
- [统一业务术语](./definition-of-terms.mdc)
- [领域层开发指南](./06-DOMAIN_LAYER_DEVELOPMENT_GUIDE.md)
- [应用层开发指南](./07-APPLICATION_LAYER_DEVELOPMENT_GUIDE.md)

---

**版本历史**:

- **1.0.0** (2025-10-09): 初始版本，包含宪章 v1.4.1 的所有审查项
