# CQRS与事件溯源

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

---

## CQRS 模式

### 命令查询职责分离

**Command Query Responsibility Segregation (CQRS)**

- **命令 (Command)**: 修改状态，不返回数据
- **查询 (Query)**: 读取数据，不修改状态

### 命令端

```typescript
// 命令定义
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}
}

// 命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async execute(command: CreateUserCommand): Promise<void> {
    const user = User.create(
      UserId.generate(),
      new Email(command.email),
      HashedPassword.fromPlainText(command.password)
    );
    
    await this.repository.save(user);
    await this.eventBus.publishAll(user.getDomainEvents());
  }
}
```

### 查询端

```typescript
// 查询定义
export class GetUserQuery {
  constructor(public readonly userId: string) {}
}

// 查询处理器
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async execute(query: GetUserQuery): Promise<UserDto> {
    // 使用优化的查询模型
    const user = await this.queryRepository.findById(query.userId);
    return UserDto.fromEntity(user);
  }
}
```

---

## 事件溯源（Event Sourcing）

### 核心概念

- **事件存储**: 记录所有状态变更
- **状态重建**: 从事件历史重建当前状态
- **完整历史**: 保留所有业务操作记录

### 适用场景

- ✅ 需要完整审计追踪
- ✅ 需要回溯历史状态
- ✅ 需要时间旅行调试
- ✅ 复杂的业务规则

---

**返回**: [架构文档中心](./README.md)
