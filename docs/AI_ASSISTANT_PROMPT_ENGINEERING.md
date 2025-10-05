# HL8 SAAS 平台 AI 助手提示词工程

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **用途**: AI助手开发指导

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 架构设计提示词](#2-架构设计提示词)
- [3. 开发规范提示词](#3-开发规范提示词)
- [4. 术语定义提示词](#4-术语定义提示词)
- [5. 代码生成提示词](#5-代码生成提示词)
- [6. 最佳实践提示词](#6-最佳实践提示词)
- [7. AI助手使用指南](#7-ai助手使用指南)

---

## 1. 项目概述

### 1.1 项目基本信息

**项目名称**: HL8 SAAS 平台  
**架构模式**: 混合架构 = Clean Architecture + CQRS + 事件溯源（ES）+ 事件驱动架构（EDA）  
**技术栈**: TypeScript + NestJS + Fastify + Nx + pnpm + PostgreSQL + Redis  
**项目类型**: Monorepo 多租户 SAAS 平台  

### 1.2 核心设计原则

1. **充血模型**: 业务逻辑在实体内，服务层只协调
2. **分层架构**: Interface → Application → Domain → Infrastructure
3. **事件驱动**: 通过领域事件实现松耦合
4. **多租户**: 完整的多租户架构支持
5. **类型安全**: 严格的TypeScript类型系统

### 1.3 项目结构

```text
hl8-saas-nx-mono/
├── apps/                    # 应用程序
├── packages/               # 共享库包
│   ├── hybrid-archi/      # 混合架构核心模块
│   ├── multi-tenancy/     # 多租户架构模块
│   ├── fastify-pro/       # 企业级Fastify集成
│   └── ...                # 其他基础设施模块
├── docs/                  # 项目文档
└── examples/             # 示例代码
```

---

## 2. 架构设计提示词

### 2.1 混合架构模式

**核心提示词**:

```text
本项目采用混合架构模式，将四种强大的架构模式有机结合：
- Clean Architecture: 提供清晰的分层架构和依赖方向
- Domain-Driven Design (DDD): 提供充血模型和领域建模
- Command Query Responsibility Segregation (CQRS): 分离命令和查询职责
- Event Sourcing (ES): 提供事件溯源能力
- Event-Driven Architecture (EDA): 提供事件驱动架构

架构分层：
Interface Layer (接口层) → Application Layer (应用层) → Domain Layer (领域层) → Infrastructure Layer (基础设施层)

依赖方向：外层依赖内层，内层不依赖外层
```

### 2.2 充血模型设计

**核心提示词**:

```text
严格遵循充血模型设计原则：

1. 业务逻辑在实体内，不在服务层
2. 实体具有行为方法，不只是数据容器
3. 使用值对象封装验证逻辑
4. 聚合根管理一致性边界
5. 领域事件记录业务事实

示例模式：

```typescript
class User extends BaseEntity {
  activate(): void {
    if (this.status !== UserStatus.Pending) {
      throw new UserNotPendingException();
    }
    this.status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
}
```

### 2.3 实体与聚合根分离

**核心提示词**:

```text
本项目的核心设计原则：将实体和聚合根明确分离

聚合根（管理者）职责：
- 管理聚合一致性边界
- 协调内部实体操作
- 发布领域事件
- 验证业务规则

实体（被管理者）职责：
- 执行具体业务操作
- 维护自身状态
- 实现业务逻辑
- 遵循聚合根指令

设计模式：
聚合根作为管理者，负责协调和管理内部实体
实体作为被管理者，执行具体的业务操作
```

---

## 3. 开发规范提示词

### 3.1 常量管理规范

**核心提示词**:

```text
每个项目必须创建 constants.ts，使用命名空间方式：

export const DI_TOKENS = {
  MODULE_OPTIONS: 'MODULE_OPTIONS',
} as const;

使用方式：
import { DI_TOKENS } from './constants';
@Inject(DI_TOKENS.MODULE_OPTIONS)

禁止硬编码：

```typescript
@Inject('MODULE_OPTIONS')  // ❌ 禁止
```

### 3.2 TSDoc 注释规范

**核心提示词**:

```text
严格遵循TSDoc规范，使用中文注释：

/**
 * {功能简述}
 *
 * @description {详细描述}
 *
 * ## 业务规则
 * - {规则}
 *
 * @param {参数} - {说明}
 * @returns {返回值}
 * @throws {异常} {说明}
 * @example
 * ```typescript
 * {示例}
 * ```
 * @since 1.0.0
 */

禁用标记：@created, @author, @version
```

### 3.3 命名规范

**核心提示词**:

```text
文件命名：kebab-case (user.service.ts)
变量命名：camelCase (userName)
常量命名：UPPER_SNAKE_CASE (MAX_RETRIES)
函数命名：camelCase+动词 (createUser())
类命名：PascalCase (UserService)
接口命名：I+PascalCase (IUserService)

TypeScript严格模式：启用所有严格检查
禁止使用any类型
```

---

## 4. 术语定义提示词

### 4.1 业务术语

**核心提示词**:

```text
平台 (Platform): SAAS服务的提供商，负责开发系统、提供技术支持和通用的商业服务
租户 (Tenant): SAAS平台中的独立客户单位，拥有独立的数据空间和配置环境
组织 (Organization): 租户内设的横向部门管理单位，负责管理下属部门的特定职能及业务
部门 (Department): 组织内设的纵向管理机构，具有明确的上下级从属关系
用户 (User): SAAS平台的使用者，是系统中最基本的身份单位

用户分类：
- 按来源：平台用户、租户用户、系统用户
- 按类型：个人用户、企业用户、社群用户、团队用户
- 按角色：管理员用户、普通用户、系统用户
- 按状态：活跃用户、待激活用户、禁用用户、锁定用户、过期用户
```

### 4.2 技术术语

**核心提示词**:

```text
实体 (Entity): 具有唯一标识的业务对象，其相等性基于标识符而不是属性值
聚合根 (Aggregate Root): 管理聚合一致性边界的实体，确保聚合内数据的一致性
值对象 (Value Object): 不可变的对象，其相等性基于属性值而不是标识符
领域服务 (Domain Service): 处理复杂业务逻辑的服务，这些逻辑不属于任何特定的实体或值对象
领域事件 (Domain Event): 表示领域内重要业务变化的事件

充血模型 (Rich Domain Model): 领域对象包含业务逻辑的模型
贫血模型 (Anemic Domain Model): 领域对象只包含数据，不包含业务逻辑的模型（本项目禁止）
```

---

## 5. 代码生成提示词

### 5.1 实体生成模板

**核心提示词**:

```text
生成充血模型实体时，遵循以下模板：

class EntityName extends BaseEntity {
  private constructor(
    private readonly _id: EntityId,
    private _property: PropertyType,
    private _status: StatusType
  ) {
    super(_id);
  }

  static create(...params): EntityName {
    const entity = new EntityName(...);
    entity.addDomainEvent(new EntityCreatedEvent(...));
    return entity;
  }

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
  getId(): EntityId { return this._id; }
  getStatus(): StatusType { return this._status; }
}
```

### 5.2 服务生成模板

**核心提示词**:

```text
生成应用服务时，遵循以下模板：

@Injectable()
export class EntityApplicationService {
  constructor(
    private readonly entityRepository: IEntityRepository,
    private readonly eventBus: IEventBus
  ) {}

  async createEntity(command: CreateEntityCommand): Promise<EntityId> {
    // 1. 验证业务规则
    await this.validateBusinessRules(command);
    
    // 2. 创建实体（业务逻辑在实体内）
    const entity = Entity.create(...);
    
    // 3. 持久化
    await this.entityRepository.save(entity);
    
    // 4. 发布事件
    await this.eventBus.publishAll(entity.getUncommittedEvents());
    
    return entity.getId();
  }
}
```

---

## 6. 最佳实践提示词

### 6.1 开发检查清单

**核心提示词**:

```text
开发完成后，检查以下项目：

充血模型：
- [ ] 业务逻辑在实体内
- [ ] 私有属性+公开方法
- [ ] 使用值对象
- [ ] 发布领域事件
- [ ] 使用业务语言命名

代码规范：
- [ ] 有 constants.ts
- [ ] 完整 TSDoc 注释
- [ ] kebab-case 文件名
- [ ] 无硬编码
- [ ] 导入顺序正确

类型安全：
- [ ] 严格模式
- [ ] 无 any
- [ ] 使用 as const
```

### 6.2 禁止事项

**核心提示词**:

```text
严格禁止以下做法：

❌ 贫血模型（实体有 setter）
❌ 硬编码字符串/数字
❌ 缺少注释
❌ 使用 any
❌ 默认导出
❌ 服务层包含业务逻辑
❌ 实体依赖仓储
❌ 聚合根和实体职责混乱
```

---

## 7. AI助手使用指南

### 7.1 代码生成指导

当用户请求生成代码时，AI助手应当：

1. **确认架构模式**: 确保生成的代码符合混合架构模式
2. **应用充血模型**: 业务逻辑在实体内，服务层只协调
3. **遵循命名规范**: 使用项目规定的命名约定
4. **添加完整注释**: 使用TSDoc规范，包含业务规则描述
5. **使用常量管理**: 避免硬编码，使用constants.ts
6. **确保类型安全**: 避免any，使用严格的TypeScript类型

### 7.2 问题解答指导

当用户询问架构或规范问题时，AI助手应当：

1. **引用项目文档**: 基于项目的具体文档内容回答
2. **提供具体示例**: 使用项目中的实际代码模式
3. **强调业务规则**: 重点说明业务逻辑和规则
4. **区分架构层次**: 明确各层的职责和边界
5. **避免通用答案**: 提供项目特定的解决方案

### 7.3 代码审查指导

当用户请求代码审查时，AI助手应当检查：

1. **架构符合性**: 是否符合混合架构模式
2. **充血模型**: 是否遵循充血模型原则
3. **代码规范**: 是否符合项目编码规范
4. **注释完整性**: 是否包含完整的TSDoc注释
5. **类型安全**: 是否使用了严格的TypeScript类型
6. **业务逻辑**: 是否正确实现了业务规则

---

**文档维护**: HL8 开发团队  
**最后更新**: 2025-01-27  
**版本**: 1.0.0
