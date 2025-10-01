# 命名规范

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

## 📖 相关文档

- 📋 [编码规范总览](./01-coding-standards.md) - 整体编码规范
- 📋 [常量管理规范](./03-constants-management.md) - 常量命名
- 💡 [充血模型实践](./02-rich-domain-model-practice.md) - 实体和值对象命名

---

## 文件命名

### TypeScript 文件

使用 `kebab-case.{type}.ts` 格式：

```
user.service.ts           # 服务
user.controller.ts        # 控制器
user.entity.ts            # 实体
user.aggregate-root.ts    # 聚合根
user.value-object.ts      # 值对象
user.dto.ts               # 数据传输对象
user.types.ts             # 类型定义
user.interface.ts         # 接口
user.spec.ts              # 单元测试
user.e2e-spec.ts          # E2E测试
```

### 特殊文件

```
constants.ts              # 常量定义
index.ts                  # 导出文件
{module}.config.ts        # 配置文件
{module}.module.ts        # NestJS模块
```

---

## 变量命名

### 常规变量 - camelCase

```typescript
const userName = 'John';
const isActive = true;
const userCount = 10;
const userList = [];
```

### 常量 - UPPER_SNAKE_CASE

```typescript
const MAX_RETRY_COUNT = 3;
const DEFAULT_TIMEOUT = 5000;
const API_BASE_URL = 'https://api.example.com';
```

### 私有属性

```typescript
class UserService {
  private userRepository: UserRepository;  // ✅ 推荐
  private _cache: Cache;                   // ✅ 可选前缀
}
```

---

## 函数/方法命名

使用 `camelCase`，**动词开头**：

### 正确示例

```typescript
// CRUD 操作
createUser()
getUser()
updateUser()
deleteUser()

// 查询
findUserById()
findUsersByRole()
getUserList()

// 布尔判断
isUserActive()
hasPermission()
canPerformAction()
shouldCache()

// 转换
toDto()
fromDto()
serialize()
deserialize()
```

### 错误示例

```typescript
// ❌ 缺少动词
user()
list()

// ❌ 使用 PascalCase
GetUser()
CreateUser()
```

---

## 类命名

使用 `PascalCase`：

```typescript
class UserService {}
class UserEntity {}
class UserAggregateRoot {}
class CreateUserDto {}
class UpdateUserDto {}
class UserRepository {}
class UserController {}
```

---

## 接口命名

使用 `PascalCase`，以 `I` 开头：

```typescript
interface IUserService {}
interface ICacheService {}
interface IRepository<T> {}
interface IMessagingAdapter {}
```

---

## 类型别名命名

使用 `PascalCase`，以 `Type` 结尾：

```typescript
type UserIdType = string;
type ConfigOptionsType = Record<string, unknown>;
type HandlerType = (...args: any[]) => Promise<void>;
```

---

## 枚举命名

### 枚举名 - PascalCase

### 枚举值 - PascalCase

```typescript
enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
  Pending = 'pending',
}

enum TenantType {
  Enterprise = 'enterprise',
  Community = 'community',
  Team = 'team',
  Personal = 'personal',
}
```

---

## 快速参考

| 类型 | 命名规范 | 示例 |
|------|---------|------|
| 文件 | kebab-case | `user.service.ts` |
| 变量 | camelCase | `userName` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRIES` |
| 函数 | camelCase + 动词 | `createUser()` |
| 类 | PascalCase | `UserService` |
| 接口 | PascalCase + I前缀 | `IUserService` |
| 类型别名 | PascalCase + Type后缀 | `UserIdType` |
| 枚举 | PascalCase | `UserStatus` |

---

**返回**: [开发规范文档中心](./README.md)
