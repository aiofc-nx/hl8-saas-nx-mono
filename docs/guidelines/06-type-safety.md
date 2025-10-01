# TypeScript 类型安全规范

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

## 📖 相关文档

- 📋 [编码规范总览](./01-coding-standards.md) - TypeScript 配置
- 📋 [常量管理规范](./03-constants-management.md) - 类型安全的常量

---

## TypeScript 严格模式

### tsconfig.json 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

---

## 避免使用 any

### ❌ 错误

```typescript
function process(data: any) {
  return data.value;
}
```

### ✅ 正确

```typescript
// 方案1: 使用泛型约束
function process<T extends { value: unknown }>(data: T) {
  return data.value;
}

// 方案2: 使用 unknown
function process(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  throw new Error('Invalid data');
}

// 方案3: 使用具体类型
interface ProcessData {
  value: string;
}

function process(data: ProcessData) {
  return data.value;
}
```

---

## 泛型使用

### 泛型约束

```typescript
// ✅ 使用泛型约束
interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(entity: T): Promise<void>;
}

// ✅ 默认类型参数
interface CacheOptions<T = unknown> {
  key: string;
  value: T;
  ttl?: number;
}
```

---

## 类型守卫

### 自定义类型守卫

```typescript
// ✅ 类型守卫函数
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'status' in obj
  );
}

// 使用
if (isUser(data)) {
  console.log(data.email); // data 的类型是 User
}
```

---

## 联合类型

### 可辨识联合

```typescript
// ✅ 使用可辨识联合
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleResult<T>(result: Result<T>) {
  if (result.success) {
    console.log(result.data); // TypeScript 知道这里有 data
  } else {
    console.error(result.error); // TypeScript 知道这里有 error
  }
}
```

---

## 类型推断

### 使用 as const

```typescript
// ✅ 使用 as const 获得精确类型
export const DI_TOKENS = {
  MODULE_OPTIONS: 'MODULE_OPTIONS',
} as const;

// 类型是: { readonly MODULE_OPTIONS: 'MODULE_OPTIONS' }

// 提取类型
export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];
// 类型是: 'MODULE_OPTIONS'
```

---

## 快速参考

### 类型安全检查清单

- [ ] 启用 TypeScript 严格模式
- [ ] 避免使用 `any`
- [ ] 使用泛型约束
- [ ] 使用类型守卫
- [ ] 使用 `as const` 获得精确类型
- [ ] 使用可辨识联合
- [ ] 正确处理 `null` 和 `undefined`

---

**返回**: [开发规范文档中心](./README.md)
