# HL8 SAAS 平台测试规范

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **用途**: 测试开发指导

---

## 📋 目录

- [1. 测试架构概述](#1-测试架构概述)
- [2. 测试文件组织规范](#2-测试文件组织规范)
- [3. 测试类型分类](#3-测试类型分类)
- [4. 测试命名规范](#4-测试命名规范)
- [5. 测试编写规范](#5-测试编写规范)
- [6. 测试最佳实践](#6-测试最佳实践)
- [7. 测试工具和配置](#7-测试工具和配置)

---

## 1. 测试架构概述

### 1.1 测试架构原则

**核心原则**:

```text
本项目采用分层测试架构，遵循以下原则：

1. **就近原则**: 单元测试文件与被测试文件在同一目录
2. **集中管理**: 集成测试、端到端测试统一放置在 __tests__ 目录
3. **类型分离**: 不同类型的测试使用不同的目录结构
4. **依赖隔离**: 测试之间相互独立，不依赖执行顺序
5. **快速反馈**: 单元测试快速执行，集成测试覆盖关键路径
```

### 1.2 测试金字塔

```text
                    ┌─────────────────┐
                    │   E2E Tests     │  ← 少量，覆盖关键用户流程
                    │   (端到端测试)    │
                    └─────────────────┘
                 ┌─────────────────────┐
                 │  Integration Tests  │  ← 适量，测试模块间交互
                 │   (集成测试)         │
                 └─────────────────────┘
              ┌─────────────────────────┐
              │     Unit Tests          │  ← 大量，测试单个组件
              │     (单元测试)           │
              └─────────────────────────┘
```

---

## 2. 测试文件组织规范

### 2.1 目录结构

**标准目录结构(示例)**:

```text
packages/hybrid-archi/src/
├── domain/                          # 领域层
│   ├── entities/
│   │   ├── base/
│   │   │   ├── base-entity.ts       # 被测试文件
│   │   │   └── base-entity.spec.ts  # 单元测试（同目录）
│   │   └── user/
│   │       ├── user.entity.ts       # 被测试文件
│   │       └── user.entity.spec.ts  # 单元测试（同目录）
│   └── value-objects/
│       ├── entity-id.vo.ts          # 被测试文件
│       └── entity-id.vo.spec.ts     # 单元测试（同目录）
├── application/                     # 应用层
│   ├── cqrs/
│   │   ├── bus/
│   │   │   ├── core-cqrs-bus.ts     # 被测试文件
│   │   │   └── core-cqrs-bus.spec.ts # 单元测试（同目录）
│   └── use-cases/
│       ├── user/
│       │   ├── create-user.use-case.ts    # 被测试文件
│       │   └── create-user.use-case.spec.ts # 单元测试（同目录）
├── infrastructure/                  # 基础设施层
│   ├── adapters/
│   │   ├── cache/
│   │   │   ├── cache.adapter.ts     # 被测试文件
│   │   │   └── cache.adapter.spec.ts # 单元测试（同目录）
│   │   └── database/
│   │       ├── database.adapter.ts  # 被测试文件
│   │       └── database.adapter.spec.ts # 单元测试（同目录）
└── __tests__/                      # 集中测试目录
    ├── domain/                     # 领域层集成测试
    │   ├── entities/
    │   └── value-objects/
    ├── application/                 # 应用层集成测试
    │   ├── cqrs/
    │   └── use-cases/
    ├── infrastructure/              # 基础设施层集成测试
    │   ├── unit/                   # 单元测试（从原位置移动）
    │   │   ├── adapters/
    │   │   │   ├── cache/
    │   │   │   ├── database/
    │   │   │   └── ports/
    │   ├── integration/            # 集成测试
    │   │   ├── adapters/
    │   │   │   ├── cache/
    │   │   │   ├── database/
    │   │   │   └── ports/
    │   └── e2e/                    # 端到端测试
    └── integration/                # 跨层集成测试
        └── user-management.integration.spec.ts
```

### 2.2 文件命名规范

**测试文件命名规则**:

```text
1. 单元测试: {被测试文件名}.spec.ts
   - 示例: base-entity.spec.ts
   - 位置: 与被测试文件同目录

2. 集成测试: {模块名}.integration.spec.ts
   - 示例: user-management.integration.spec.ts
   - 位置: __tests__/integration/

3. 端到端测试: {功能名}.e2e.spec.ts
   - 示例: infrastructure.e2e.spec.ts
   - 位置: __tests__/infrastructure/e2e/
```

---

## 3. 测试类型分类

### 3.1 单元测试 (Unit Tests)

**定义**: 测试单个组件或函数的功能

**特点**:

- 快速执行（毫秒级）
- 完全隔离，不依赖外部资源
- 使用 Mock 对象模拟依赖
- 覆盖所有代码路径

**示例**:

```typescript
// base-entity.spec.ts
describe('BaseEntity', () => {
  describe('构造函数', () => {
    it('应该正确初始化实体', () => {
      const id = EntityId.generate();
      const entity = new TestEntity(id, 'test');
      
      expect(entity.id).toBe(id);
      expect(entity.createdAt).toBeInstanceOf(Date);
    });
  });
});
```

### 3.2 集成测试 (Integration Tests)

**定义**: 测试多个组件之间的交互

**特点**:

- 中等执行速度（秒级）
- 使用真实的依赖关系
- 测试模块间的接口
- 覆盖关键业务流程

**示例**:

```typescript
// user-management.integration.spec.ts
describe('用户管理集成测试', () => {
  it('应该成功创建用户', async () => {
    const userData = { name: '张三', email: 'zhangsan@example.com' };
    const result = await userController.createUser(userData);
    
    expect(result).toBeDefined();
    expect(result.name).toBe('张三');
  });
});
```

### 3.3 端到端测试 (E2E Tests)

**定义**: 测试完整的用户流程

**特点**:

- 较慢执行速度（分钟级）
- 使用真实的环境和数据库
- 测试完整的用户场景
- 覆盖关键用户路径

**示例**:

```typescript
// infrastructure.e2e.spec.ts
describe('基础设施层端到端测试', () => {
  it('应该完整初始化基础设施服务', async () => {
    const module = await Test.createTestingModule({
      imports: [InfrastructureFactoriesModule],
    }).compile();
    
    const factory = module.get<InfrastructureFactory>(InfrastructureFactory);
    const services = await factory.createAllServices();
    
    expect(services).toBeDefined();
    expect(services.cache).toBeDefined();
    expect(services.database).toBeDefined();
  });
});
```

---

## 4. 测试命名规范

### 4.1 测试套件命名

**规范**:

```text
1. 使用被测试的类名或模块名
2. 使用中文描述，清晰表达测试意图
3. 使用 describe 嵌套组织相关测试

示例:
describe('BaseEntity', () => {
  describe('构造函数', () => {
    // 测试用例
  });
  
  describe('业务方法', () => {
    // 测试用例
  });
});
```

### 4.2 测试用例命名

**规范**:

```text
1. 使用 "应该" 开头，描述预期行为
2. 使用中文描述，清晰表达测试场景
3. 包含前置条件和预期结果

示例:
it('应该正确初始化实体标识符', () => {
  // 测试实现
});

it('应该在无效输入时抛出异常', () => {
  // 测试实现
});

it('应该支持软删除功能', () => {
  // 测试实现
});
```

---

## 5. 测试编写规范

### 5.1 测试结构 (AAA 模式)

**标准结构**:

```typescript
describe('被测试组件', () => {
  describe('方法名或功能', () => {
    it('应该描述预期行为', () => {
      // Arrange (准备)
      const input = 'test input';
      const expected = 'expected output';
      
      // Act (执行)
      const result = component.method(input);
      
      // Assert (断言)
      expect(result).toBe(expected);
    });
  });
});
```

### 5.2 Mock 使用规范

**Mock 原则**:

```typescript
// 1. 使用 jest.fn() 创建 Mock 函数
const mockService = {
  getData: jest.fn().mockResolvedValue('mock data'),
  saveData: jest.fn().mockResolvedValue(true),
};

// 2. 在 beforeEach 中重置 Mock
beforeEach(() => {
  jest.clearAllMocks();
});

// 3. 验证 Mock 调用
expect(mockService.getData).toHaveBeenCalledWith('test-id');
expect(mockService.getData).toHaveBeenCalledTimes(1);
```

### 5.3 异步测试规范

**异步测试模式**:

```typescript
// 1. 使用 async/await
it('应该异步处理数据', async () => {
  const result = await service.processAsync('data');
  expect(result).toBeDefined();
});

// 2. 测试 Promise 拒绝
it('应该在错误时抛出异常', async () => {
  await expect(service.processAsync('invalid')).rejects.toThrow('Invalid input');
});

// 3. 使用 done 回调（不推荐，仅在必要时使用）
it('应该处理回调', (done) => {
  service.processCallback('data', (error, result) => {
    expect(error).toBeNull();
    expect(result).toBeDefined();
    done();
  });
});
```

---

## 6. 测试最佳实践

### 6.1 测试隔离

**隔离原则**:

```text
1. 每个测试用例独立运行
2. 不依赖其他测试的执行结果
3. 使用 beforeEach/afterEach 清理状态
4. 避免共享可变状态
```

### 6.2 测试数据管理

**数据管理规范**:

```typescript
// 1. 使用工厂函数创建测试数据
const createTestUser = (overrides = {}) => ({
  id: EntityId.generate(),
  name: '测试用户',
  email: 'test@example.com',
  ...overrides,
});

// 2. 使用常量定义测试数据
const TEST_CONSTANTS = {
  VALID_USER_ID: 'user-123',
  VALID_EMAIL: 'test@example.com',
  INVALID_EMAIL: 'invalid-email',
} as const;

// 3. 使用 describe.each 测试多个数据
describe.each([
  ['valid@email.com', true],
  ['invalid-email', false],
  ['', false],
])('邮箱验证: %s', (email, expected) => {
  it(`应该返回 ${expected}`, () => {
    expect(isValidEmail(email)).toBe(expected);
  });
});
```

### 6.3 错误测试

**错误测试规范**:

```typescript
// 1. 测试异常抛出
it('应该在无效输入时抛出异常', () => {
  expect(() => {
    new User('', 'invalid-email');
  }).toThrow('Invalid user data');
});

// 2. 测试特定异常类型
it('应该抛出业务异常', () => {
  expect(() => {
    user.activate();
  }).toThrow(BusinessRuleViolationException);
});

// 3. 测试异常消息
it('应该包含正确的错误消息', () => {
  expect(() => {
    user.activate();
  }).toThrow('User is already active');
});
```

---

## 7. 测试工具和配置

### 7.1 测试框架

**主要工具**:

```text
1. Jest: 测试框架和断言库
2. @nestjs/testing: NestJS 测试工具
3. Supertest: HTTP 测试工具
4. TypeScript: 类型安全的测试代码
```

### 7.2 Jest 配置

**关键配置**:

```json
{
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": [
      "**/__tests__/**/*.spec.ts",
      "**/?(*.)+(spec|test).ts"
    ],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.spec.ts",
      "!src/**/*.d.ts"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html"]
  }
}
```

### 7.3 测试命令

**常用命令**:

```bash
# 运行所有测试
pnpm test

# 运行特定测试文件
pnpm test user.entity.spec.ts

# 运行测试并生成覆盖率报告
pnpm test --coverage

# 监听模式运行测试
pnpm test --watch

# 运行集成测试
pnpm test --testPathPattern=integration

# 运行端到端测试
pnpm test --testPathPattern=e2e
```

---

**文档维护**: HL8 开发团队  
**最后更新**: 2025-01-27  
**版本**: 1.0.0
