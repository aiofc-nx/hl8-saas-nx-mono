# hybrid-archi 快速开始指南

> **文档版本**: 1.0.0  
> **创建日期**: 2025-01-27  
> **预计阅读时间**: 30 分钟  

---

## 📋 目录

- [1. 前置准备](#1-前置准备)
- [2. 创建你的第一个实体](#2-创建你的第一个实体)
- [3. 创建你的第一个聚合根](#3-创建你的第一个聚合根)
- [4. 实现 CQRS](#4-实现-cqrs)
- [5. 集成到应用](#5-集成到应用)
- [6. 下一步](#6-下一步)

---

## 1. 前置准备

### 1.1 环境要求

- Node.js >= 18
- pnpm >= 8
- TypeScript >= 5
- 基本的 DDD 和 CQRS 知识

### 1.2 安装依赖

```bash
# 在你的业务模块中添加依赖
cd packages/your-module

# 添加到 package.json
{
  "dependencies": {
    "@hl8/hybrid-archi": "workspace:*"
  }
}

# 安装依赖
pnpm install
```

### 1.3 项目结构

创建符合混合架构的目录结构：

```bash
mkdir -p src/domain/{entities,aggregates,value-objects,events}
mkdir -p src/application/{use-cases,commands,queries}
mkdir -p src/infrastructure/{repositories,adapters}
mkdir -p src/interface/controllers
```

---

## 2. 创建你的第一个实体

### 2.1 创建值对象

首先创建值对象来封装业务概念：

```typescript
// src/domain/value-objects/email.vo.ts
import { BaseValueObject } from '@hl8/hybrid-archi';

export class Email extends BaseValueObject {
  private constructor(private readonly _value: string) {
    super();
    this.validate();
  }

  static create(value: string): Email {
    return new Email(value);
  }

  get value(): string {
    return this._value;
  }

  protected validate(): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this._value)) {
      throw new Error('Invalid email format');
    }
  }

  equals(other: Email | null | undefined): boolean {
    if (!super.equals(other)) return false;
    return this._value === (other as Email)._value;
  }

  override toString(): string {
    return this._value;
  }
}
```

### 2.2 创建实体

创建遵循充血模型的实体：

```typescript
// src/domain/entities/user.entity.ts
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { Email } from '../value-objects/email.vo';

export enum UserStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE',
  Blocked = 'BLOCKED',
}

export class User extends BaseEntity {
  private constructor(
    id: EntityId,
    private _name: string,
    private _email: Email,
    private _status: UserStatus,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
    this.validate();
  }

  static create(
    name: string,
    email: Email,
    tenantId: string
  ): User {
    return new User(
      EntityId.generate(),
      name,
      email,
      UserStatus.Active,
      { createdBy: 'system', tenantId }
    );
  }

  // 充血模型：业务逻辑在实体内
  activate(): void {
    if (this._status === UserStatus.Active) {
      return;
    }
    if (this._status === UserStatus.Blocked) {
      throw new Error('Cannot activate blocked user');
    }
    this._status = UserStatus.Active;
    this.updateTimestamp();
  }

  block(reason: string): void {
    if (!reason) {
      throw new Error('Block reason is required');
    }
    this._status = UserStatus.Blocked;
    this.updateTimestamp();
  }

  updateEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) {
      return;
    }
    this._email = newEmail;
    this.updateTimestamp();
  }

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('User name is required');
    }
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get status(): UserStatus {
    return this._status;
  }

  isActive(): boolean {
    return this._status === UserStatus.Active;
  }
}
```

---

## 3. 创建你的第一个聚合根

### 3.1 定义领域事件

```typescript
// src/domain/events/user-events.ts
import { BaseDomainEvent, EntityId } from '@hl8/hybrid-archi';

export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly userEmail: string
  ) {
    super(aggregateId, aggregateVersion, tenantId);
  }

  get eventType(): string {
    return 'UserCreated';
  }

  override get eventData(): Record<string, unknown> {
    return {
      userId: this.userId,
      userName: this.userName,
      userEmail: this.userEmail,
    };
  }
}

export class UserEmailUpdatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: EntityId,
    aggregateVersion: number,
    tenantId: string,
    public readonly newEmail: string
  ) {
    super(aggregateId, aggregateVersion, tenantId);
  }

  get eventType(): string {
    return 'UserEmailUpdated';
  }

  override get eventData(): Record<string, unknown> {
    return {
      newEmail: this.newEmail,
    };
  }
}
```

### 3.2 创建聚合根

```typescript
// src/domain/aggregates/user.aggregate.ts
import { BaseAggregateRoot, EntityId } from '@hl8/hybrid-archi';
import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.vo';
import { UserCreatedEvent, UserEmailUpdatedEvent } from '../events/user-events';

export class UserAggregate extends BaseAggregateRoot {
  private constructor(
    id: EntityId,
    private _user: User,
    auditInfo: IPartialAuditInfo
  ) {
    super(id, auditInfo);
  }

  static create(
    name: string,
    email: Email,
    tenantId: string
  ): UserAggregate {
    const user = User.create(name, email, tenantId);
    const aggregate = new UserAggregate(
      user.id,
      user,
      { createdBy: 'system', tenantId }
    );
    
    // 发布创建事件
    aggregate.addDomainEvent(
      new UserCreatedEvent(
        aggregate.id,
        aggregate.version,
        tenantId,
        user.id.toString(),
        user.name,
        user.email.value
      )
    );
    
    return aggregate;
  }

  // 聚合根方法：协调内部实体
  updateEmail(newEmail: Email): void {
    this._user.updateEmail(newEmail);
    
    // 发布事件
    this.addDomainEvent(
      new UserEmailUpdatedEvent(
        this.id,
        this.version,
        this.tenantId,
        newEmail.value
      )
    );
    
    this.incrementVersion();
  }

  get user(): User {
    return this._user;
  }
}
```

---

## 4. 实现 CQRS

### 4.1 创建命令

```typescript
// src/application/commands/create-user.command.ts
import { BaseCommand } from '@hl8/hybrid-archi';

export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string,
    tenantId: string,
    userId: string
  ) {
    super(tenantId, userId);
  }

  get commandType(): string {
    return 'CreateUser';
  }

  override get commandData(): Record<string, unknown> {
    return {
      name: this.name,
      email: this.email,
    };
  }
}
```

### 4.2 实现命令处理器

```typescript
// src/application/commands/create-user.handler.ts
import { CommandHandler } from '@hl8/hybrid-archi';
import { CreateUserCommand } from './create-user.command';

@CommandHandler('CreateUser')
export class CreateUserCommandHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    // 1. 创建聚合根
    const email = Email.create(command.email);
    const user = UserAggregate.create(
      command.name,
      email,
      command.tenantId
    );
    
    // 2. 保存聚合根
    await this.userRepository.save(user);
    
    // 3. 发布事件
    const events = user.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    user.markEventsAsCommitted();
  }
}
```

### 4.3 创建查询

```typescript
// src/application/queries/get-users.query.ts
import { BaseQuery } from '@hl8/hybrid-archi';

export class GetUsersQuery extends BaseQuery {
  constructor(
    public readonly status?: string,
    tenantId: string,
    userId: string,
    page = 1,
    pageSize = 10
  ) {
    super(tenantId, userId, page, pageSize);
  }

  get queryType(): string {
    return 'GetUsers';
  }
}
```

### 4.4 实现查询处理器

```typescript
// src/application/queries/get-users.handler.ts
import { QueryHandler } from '@hl8/hybrid-archi';

@QueryHandler('GetUsers')
export class GetUsersQueryHandler {
  constructor(
    private readonly userReadModel: IUserReadModel
  ) {}

  async execute(query: GetUsersQuery): Promise<UsersQueryResult> {
    const users = await this.userReadModel.getUsers({
      status: query.status,
      page: query.page,
      pageSize: query.pageSize,
    });
    
    return new UsersQueryResult(users.data, users.pagination);
  }
}
```

---

## 5. 集成到应用

### 5.1 创建模块

```typescript
// src/user.module.ts
import { Module } from '@nestjs/common';
import { CommandBus, QueryBus, EventBus } from '@hl8/hybrid-archi';

@Module({
  imports: [],
  providers: [
    // CQRS 总线
    CommandBus,
    QueryBus,
    EventBus,
    
    // 命令处理器
    CreateUserCommandHandler,
    
    // 查询处理器
    GetUsersQueryHandler,
    
    // 仓储
    { provide: 'IUserRepository', useClass: UserRepository },
  ],
  controllers: [UserController],
})
export class UserModule {}
```

### 5.2 创建控制器

```typescript
// src/interface/controllers/user.controller.ts
import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { BaseController, CommandBus, QueryBus } from '@hl8/hybrid-archi';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { GetUsersQuery } from '../../application/queries/get-users.query';

@Controller('users')
export class UserController extends BaseController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {
    super();
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<void> {
    const command = new CreateUserCommand(
      dto.name,
      dto.email,
      this.getTenantId(),  // 自动获取租户 ID
      this.getUserId()     // 自动获取用户 ID
    );
    await this.commandBus.execute(command);
  }

  @Get()
  async getUsers(@Query('status') status?: string): Promise<UserDto[]> {
    const query = new GetUsersQuery(
      status,
      this.getTenantId(),
      this.getUserId()
    );
    const result = await this.queryBus.execute(query);
    return result.getData();
  }
}
```

---

## 6. 下一步

### 6.1 深入学习

- 📖 [领域层设计指南](entity-design.md)
- 📖 [聚合根设计指南](aggregate-design.md)
- 📖 [CQRS 使用指南](cqrs-guide.md)
- 📖 [事件溯源指南](event-sourcing-guide.md)

### 6.2 查看示例

- 💡 [基础示例](../../examples/basic/)
- 💡 [CQRS 示例](../../examples/cqrs/)
- 💡 [完整业务示例](../../examples/complete/user-management/)

### 6.3 参与贡献

- 🤝 [贡献指南](../../CONTRIBUTING.md)
- 🐛 [问题反馈](https://github.com/your-org/hl8-saas-nx-mono/issues)

---

**文档维护**: HL8 架构团队  
**最后更新**: 2025-01-27
