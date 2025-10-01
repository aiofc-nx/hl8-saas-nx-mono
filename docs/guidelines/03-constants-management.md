# 常量管理规范

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

## 📖 相关文档

- 📋 [编码规范总览](./01-coding-standards.md) - 整体编码规范
- 📋 [命名规范](./05-naming-conventions.md) - 命名约定
- 📋 [类型安全规范](./06-type-safety.md) - TypeScript 类型使用

---

## 📋 目录

- [1. 概述](#1-概述)
- [2. 常量文件结构](#2-常量文件结构)
- [3. 常量分类](#3-常量分类)
- [4. 使用规范](#4-使用规范)
- [5. 类型安全](#5-类型安全)
- [6. 最佳实践](#6-最佳实践)

---

## 1. 概述

### 1.1 为什么需要统一管理常量

- ✅ **避免硬编码**: 消除代码中的魔法字符串和数字
- ✅ **类型安全**: 通过 TypeScript 类型系统确保正确性
- ✅ **易于维护**: 集中管理，修改方便
- ✅ **自动补全**: IDE 可以提供智能提示
- ✅ **避免重复**: 常量可以在多处复用

### 1.2 核心原则

1. **使用 `as const`**: 确保获得最精确的类型推断
2. **分类组织**: 按功能或模块分类常量
3. **命名规范**: 使用全大写+下划线（UPPER_SNAKE_CASE）命名常量对象
4. **避免魔法数字**: 将所有硬编码值定义为常量
5. **类型安全**: 利用 TypeScript 的类型系统

---

## 2. 常量文件结构

### 2.1 文件位置

每个项目必须在 `src/lib/` 目录下创建 `constants.ts` 文件：

```
packages/{module}/src/lib/constants.ts
```

### 2.2 文件模板

```typescript
/**
 * {模块名称} 模块常量定义
 *
 * @description 定义{模块}中使用的常量
 *
 * ## 最佳实践
 *
 * - ✅ 使用 `as const` 确保类型推断
 * - ✅ 按功能模块分类组织
 * - ✅ 使用 UPPER_SNAKE_CASE 命名常量对象
 * - ✅ 避免魔法数字和硬编码字符串
 * - ✅ 提供类型安全的常量访问
 *
 * @fileoverview {模块}常量定义文件
 */

// ============================================================================
// 依赖注入令牌 (Dependency Injection Tokens)
// ============================================================================

export const DI_TOKENS = {
  MODULE_OPTIONS: '{MODULE}_MODULE_OPTIONS',
  // ... 其他令牌
} as const;

// ============================================================================
// 装饰器元数据键 (Decorator Metadata Keys)
// ============================================================================

export const DECORATOR_METADATA = {
  FEATURE_NAME: 'feature_name',
  // ... 其他元数据键
} as const;

// ============================================================================
// 配置默认值常量 (Configuration Defaults)
// ============================================================================

export const MODULE_DEFAULTS = {
  TTL: 3600,
  MAX_RETRIES: 3,
  // ... 其他默认值
} as const;

// ============================================================================
// 类型导出 (Type Exports)
// ============================================================================

export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];
export type DecoratorMetadataType =
  (typeof DECORATOR_METADATA)[keyof typeof DECORATOR_METADATA];
```

---

## 3. 常量分类

### 3.1 依赖注入令牌

用于 NestJS 依赖注入系统：

```typescript
export const DI_TOKENS = {
  /**
   * 模块配置选项令牌
   */
  MODULE_OPTIONS: 'CACHE_MODULE_OPTIONS',
  
  /**
   * 配置服务选项令牌
   */
  CONFIG_OPTIONS: 'CACHE_CONFIG_OPTIONS',
} as const;
```

**使用方式**:

```typescript
import { DI_TOKENS } from './constants';

@Injectable()
export class CacheService {
  constructor(
    @Inject(DI_TOKENS.MODULE_OPTIONS)
    private readonly options: CacheModuleOptions
  ) {}
}
```

### 3.2 装饰器元数据键

用于装饰器系统：

```typescript
export const DECORATOR_METADATA = {
  /**
   * 可缓存装饰器元数据键
   */
  CACHEABLE: 'cacheable',
  
  /**
   * 缓存更新装饰器元数据键
   */
  CACHE_PUT: 'cache_put',
  
  /**
   * 缓存清除装饰器元数据键
   */
  CACHE_EVICT: 'cache_evict',
} as const;
```

**使用方式**:

```typescript
import { DECORATOR_METADATA } from './constants';

export function Cacheable(keyPrefix: string) {
  return SetMetadata(DECORATOR_METADATA.CACHEABLE, { keyPrefix });
}
```

### 3.3 枚举类型常量

定义状态、类型等枚举值：

```typescript
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const;

export const TENANT_TYPES = {
  ENTERPRISE: 'enterprise',
  COMMUNITY: 'community',
  TEAM: 'team',
  PERSONAL: 'personal',
} as const;
```

### 3.4 配置默认值

定义模块的默认配置值：

```typescript
export const CACHE_DEFAULTS = {
  /**
   * 默认TTL（秒）
   */
  TTL: 3600,
  
  /**
   * 默认键前缀
   */
  KEY_PREFIX: 'cache',
  
  /**
   * 连接重试延迟（毫秒）
   */
  RETRY_DELAY: 3000,
  
  /**
   * 最大重试次数
   */
  MAX_RETRIES: 3,
} as const;
```

---

## 4. 使用规范

### 4.1 导入常量

**✅ 推荐方式**: 导入命名空间对象

```typescript
import { DI_TOKENS, DECORATOR_METADATA, MODULE_DEFAULTS } from './constants';

// 使用
@Inject(DI_TOKENS.MODULE_OPTIONS)
SetMetadata(DECORATOR_METADATA.CACHEABLE, config)
const ttl = options.ttl || MODULE_DEFAULTS.TTL;
```

### 4.2 导出常量

在模块的 `index.ts` 中导出常量：

```typescript
// 常量定义导出
export * from './lib/constants';
```

### 4.3 避免的做法

#### ❌ 硬编码字符串

```typescript
// ❌ 错误
@Inject('MODULE_OPTIONS')
private readonly options: ModuleOptions;

// ✅ 正确
@Inject(DI_TOKENS.MODULE_OPTIONS)
private readonly options: ModuleOptions;
```

#### ❌ 魔法数字

```typescript
// ❌ 错误
setTimeout(() => {}, 3000);
if (retryCount > 3) {}

// ✅ 正确
setTimeout(() => {}, MODULE_DEFAULTS.RETRY_DELAY);
if (retryCount > MODULE_DEFAULTS.MAX_RETRIES) {}
```

#### ❌ 扁平导出（已弃用）

```typescript
// ❌ 旧方式（不要使用）
export const MODULE_OPTIONS = 'MODULE_OPTIONS';
export const CACHEABLE_METADATA = 'cacheable';

// ✅ 新方式（使用命名空间）
export const DI_TOKENS = {
  MODULE_OPTIONS: 'MODULE_OPTIONS',
} as const;

export const DECORATOR_METADATA = {
  CACHEABLE: 'cacheable',
} as const;
```

---

## 5. 类型安全

### 5.1 类型提取

从常量对象中提取类型：

```typescript
export const DI_TOKENS = {
  MODULE_OPTIONS: 'MODULE_OPTIONS',
  CONFIG_OPTIONS: 'CONFIG_OPTIONS',
} as const;

// 提取值类型
export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];
// DITokenType = 'MODULE_OPTIONS' | 'CONFIG_OPTIONS'

// 使用类型
function inject(token: DITokenType) {
  // token 只能是 'MODULE_OPTIONS' 或 'CONFIG_OPTIONS'
}
```

### 5.2 类型约束

```typescript
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type StatusType = (typeof STATUS)[keyof typeof STATUS];

// 使用类型约束
function updateStatus(status: StatusType) {
  // status 只能是 'active' 或 'inactive'
}

// ✅ 正确
updateStatus(STATUS.ACTIVE);

// ❌ 编译错误
updateStatus('unknown'); // Type error!
```

### 5.3 常量对象类型

```typescript
// 定义常量对象
export const MODULE_DEFAULTS = {
  TTL: 3600,
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
} as const;

// 提取常量对象的类型
export type ModuleDefaultsType = typeof MODULE_DEFAULTS;

// 提取单个属性的类型
export type TTLType = typeof MODULE_DEFAULTS.TTL; // number (literal 3600)
```

---

## 6. 最佳实践

### 6.1 分组原则

按功能将常量分组：

```typescript
// ============================================================================
// 依赖注入令牌
// ============================================================================
export const DI_TOKENS = { ... } as const;

// ============================================================================
// 装饰器元数据键
// ============================================================================
export const DECORATOR_METADATA = { ... } as const;

// ============================================================================
// 业务常量
// ============================================================================
export const STATUS = { ... } as const;
export const TYPES = { ... } as const;

// ============================================================================
// 配置默认值
// ============================================================================
export const MODULE_DEFAULTS = { ... } as const;

// ============================================================================
// 类型导出
// ============================================================================
export type DITokenType = ...;
```

### 6.2 命名约定

#### 常量对象命名

- 复数形式，描述性名称
- 全大写+下划线

```typescript
export const DI_TOKENS = { ... };           // ✅
export const DECORATOR_METADATA = { ... };  // ✅
export const MODULE_DEFAULTS = { ... };     // ✅
export const TENANT_STATUS = { ... };       // ✅
```

#### 常量值命名

- 全大写+下划线
- 有意义的名称

```typescript
export const DI_TOKENS = {
  MODULE_OPTIONS: 'MODULE_OPTIONS',      // ✅
  CONFIG_OPTIONS: 'CONFIG_OPTIONS',      // ✅
} as const;
```

### 6.3 文档注释

为每个常量对象和重要常量添加注释：

```typescript
/**
 * 依赖注入令牌常量
 *
 * @description 用于 NestJS 依赖注入系统的令牌集合
 */
export const DI_TOKENS = {
  /**
   * 模块配置选项令牌
   *
   * @description 用于注入模块的配置参数
   *
   * @example
   * ```typescript
   * @Inject(DI_TOKENS.MODULE_OPTIONS)
   * private readonly options: ModuleOptions
   * ```
   */
  MODULE_OPTIONS: 'MODULE_OPTIONS',
} as const;
```

### 6.4 环境相关常量

对于不同环境需要不同值的常量，使用配置文件：

```typescript
// ✅ 正确：使用配置
export const MODULE_DEFAULTS = {
  // 从环境变量或配置文件加载
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
} as const;

// 或者在配置模块中定义
```

---

## 快速参考

### 完整示例

```typescript
/**
 * Cache 模块常量定义
 *
 * @fileoverview 缓存模块常量定义文件
 */

// ============================================================================
// 依赖注入令牌
// ============================================================================

export const DI_TOKENS = {
  MODULE_OPTIONS: 'CACHE_MODULE_OPTIONS',
} as const;

// ============================================================================
// 装饰器元数据键
// ============================================================================

export const DECORATOR_METADATA = {
  CACHEABLE: 'cacheable',
  CACHE_PUT: 'cache_put',
  CACHE_EVICT: 'cache_evict',
} as const;

// ============================================================================
// 配置默认值
// ============================================================================

export const CACHE_DEFAULTS = {
  TTL: 3600,
  KEY_PREFIX: 'cache',
  REDIS_PORT: 6379,
  RETRY_DELAY: 3000,
  MAX_RETRIES: 3,
} as const;

// ============================================================================
// 类型导出
// ============================================================================

export type DITokenType = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];
export type DecoratorMetadataType =
  (typeof DECORATOR_METADATA)[keyof typeof DECORATOR_METADATA];
```

### 检查清单

创建常量文件时，确保：

- [ ] 使用 `as const` 断言
- [ ] 按功能分类组织
- [ ] 添加详细的 TSDoc 注释
- [ ] 导出类型定义
- [ ] 在 index.ts 中导出
- [ ] 更新所有使用位置
- [ ] 无硬编码字符串和魔法数字

---

**返回**: [开发规范文档中心](./README.md)
