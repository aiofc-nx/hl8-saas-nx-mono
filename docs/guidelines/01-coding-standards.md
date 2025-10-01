# 编码规范总览

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01  
> **适用范围**: 所有代码文件

---

## 📋 快速导航

| 规范 | 文档链接 |
|------|---------|
| 常量管理 | [03-constants-management.md](./03-constants-management.md) |
| 代码注释 | [04-code-comments.md](./04-code-comments.md) |
| 命名规范 | [05-naming-conventions.md](./05-naming-conventions.md) |
| 类型安全 | [06-type-safety.md](./06-type-safety.md) |
| 测试规范 | [07-testing-standards.md](./07-testing-standards.md) |
| Git规范 | [08-git-conventions.md](./08-git-conventions.md) |

---

## 1. TypeScript 严格模式

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

## 2. 代码格式化

### Prettier 配置

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

---

## 3. ESLint 规则

### 继承根配置

每个子项目的 `eslint.config.mjs` 应继承根配置：

```typescript
// packages/{module}/eslint.config.mjs
import rootConfig from '../../eslint.config.mjs';

export default [
  ...rootConfig,
  // 项目特定规则（如有需要）
];
```

---

## 4. 导入顺序

按以下顺序组织导入语句：

```typescript
// 1. Node.js 内置模块
import { readFile } from 'fs/promises';

// 2. 外部依赖
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

// 3. 内部跨包依赖
import { CacheService } from '@hl8/cache';
import { PinoLogger } from '@hl8/logger';

// 4. 当前包的相对导入
import { UserEntity } from './entities/user.entity';
import { CreateUserDto } from './dtos/create-user.dto';
import { DI_TOKENS } from './constants';
```

---

## 5. 文件组织

### 项目结构

```
packages/{module}/
├── src/
│   ├── lib/
│   │   ├── constants.ts          # 常量定义
│   │   ├── {module}.module.ts    # 模块定义
│   │   ├── {module}.service.ts   # 服务实现
│   │   ├── {module}.service.spec.ts  # 服务测试
│   │   ├── types/                # 类型定义
│   │   ├── entities/             # 实体定义
│   │   ├── decorators/           # 装饰器
│   │   ├── exceptions/           # 异常定义
│   │   └── utils/                # 工具函数
│   └── index.ts                  # 导出文件
├── README.md
├── package.json
└── tsconfig.json
```

---

## 6. 导出规范

### index.ts 导出顺序

```typescript
// 核心模块
export * from './lib/{module}.module';

// 服务
export * from './lib/{module}.service';

// 常量定义
export * from './lib/constants';

// 类型定义
export * from './lib/types/{module}.types';

// 装饰器
export * from './lib/decorators';

// 异常
export * from './lib/exceptions';
```

### 优先使用具名导出

```typescript
// ✅ 推荐：具名导出
export class UserService {}
export const DI_TOKENS = {};

// ❌ 避免：默认导出
export default class UserService {}
```

---

## 7. 代码审查清单

开发完成后，检查以下项目：

- [ ] 符合 TypeScript 严格模式
- [ ] 添加完整的 TSDoc 注释
- [ ] 常量使用命名空间方式
- [ ] 无硬编码字符串和魔法数字
- [ ] 导入语句按规范排序
- [ ] 文件命名符合 kebab-case
- [ ] 测试覆盖率达标
- [ ] 无 ESLint 错误
- [ ] 无 TypeScript 错误

---

## 快速参考

### 常量定义

```typescript
import { DI_TOKENS } from './constants';

@Inject(DI_TOKENS.MODULE_OPTIONS)
private readonly options: ModuleOptions;
```

### TSDoc 注释

```typescript
/**
 * {简短描述}
 *
 * @description {详细描述}
 * @param {参数} - {说明}
 * @returns {返回值说明}
 * @since 1.0.0
 */
```

### 文件命名

```
user.service.ts
user.entity.ts
user.spec.ts
```

---

**返回**: [开发规范文档中心](./README.md)
