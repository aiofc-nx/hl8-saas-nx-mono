# hybrid-archi 测试覆盖率计划

> **创建日期**: 2025-01-27  
> **目标覆盖率**: 80%+  
> **当前状态**: 待评估  

---

## 📊 测试覆盖率目标

### 总体目标

| 指标 | 目标 | 当前 | 状态 |
|------|------|------|------|
| 语句覆盖率 (Statements) | ≥ 80% | TBD | ⏳ |
| 分支覆盖率 (Branches) | ≥ 75% | TBD | ⏳ |
| 函数覆盖率 (Functions) | ≥ 80% | TBD | ⏳ |
| 行覆盖率 (Lines) | ≥ 80% | TBD | ⏳ |

### 分层目标

| 层次 | 语句覆盖率 | 优先级 |
|------|-----------|--------|
| 领域层 (Domain) | ≥ 90% | 🔴 最高 |
| 应用层 (Application) | ≥ 85% | 🔴 最高 |
| 基础设施层 (Infrastructure) | ≥ 75% | 🟡 中 |
| 接口层 (Interface) | ≥ 70% | 🟢 低 |

---

## 🔍 当前测试状态分析

### 已有测试文件统计

基于代码库扫描，已发现以下测试文件：

#### 领域层测试

```
✅ domain/entities/base/base-entity.spec.ts
✅ domain/aggregates/base/base-aggregate-root.spec.ts
✅ domain/value-objects/base-value-object.spec.ts
✅ domain/value-objects/entity-id.spec.ts
✅ domain/value-objects/ids/tenant-id.vo.spec.ts
✅ domain/value-objects/ids/user-id.vo.spec.ts
```

#### 应用层测试

```
✅ application/cqrs/bus/command-bus.spec.ts
✅ application/cqrs/bus/query-bus.spec.ts
✅ application/cqrs/bus/event-bus.spec.ts
✅ application/cqrs/bus/cqrs-bus.spec.ts
✅ application/cqrs/commands/base/base-command.spec.ts
✅ application/cqrs/queries/base/base-query-result.spec.ts
✅ application/cqrs/sagas/core-saga-manager.spec.ts
```

#### 基础设施层测试

```
✅ infrastructure/adapters/cache/cache.adapter.spec.ts
✅ infrastructure/adapters/database/database.adapter.spec.ts
✅ infrastructure/adapters/ports/logger-port.adapter.spec.ts
✅ infrastructure/performance/cache-strategy.spec.ts
```

#### 集成测试

```
✅ __tests__/integration/user-management.integration.spec.ts
✅ __tests__/infrastructure/e2e/infrastructure.e2e.spec.ts
✅ __tests__/infrastructure/integration/adapters/cache/
✅ __tests__/infrastructure/integration/adapters/ports/
```

---

## 📋 测试覆盖率改进计划

### 阶段 1: 评估现状（1周）

**目标**: 生成详细的覆盖率报告，识别测试缺口

#### 任务清单

- [ ] 运行完整测试套件

  ```bash
  nx test hybrid-archi --coverage
  ```

- [ ] 生成详细覆盖率报告

  ```bash
  nx test hybrid-archi --coverage --coverageReporters=html --coverageReporters=text --coverageReporters=json-summary
  ```

- [ ] 分析覆盖率报告
  - 查看 `coverage/index.html`
  - 识别覆盖率低于 80% 的文件
  - 列出未测试的函数和分支

- [ ] 创建测试缺口清单
  - 按优先级排序
  - 估算测试工作量
  - 分配责任人

#### 预期输出

```
coverage/
├── index.html          # HTML 覆盖率报告
├── lcov.info           # LCOV 格式报告
├── coverage-summary.json  # JSON 摘要
└── TEST-GAPS.md        # 测试缺口清单
```

### 阶段 2: 补充核心测试（2周）

**目标**: 补充领域层和应用层的核心测试

#### 优先级 🔴 最高

**领域层核心组件**

- [ ] 值对象测试补充
  - [ ] 所有值对象的验证逻辑
  - [ ] 相等性比较边界情况
  - [ ] 序列化/反序列化

- [ ] 实体测试补充
  - [ ] 实体生命周期
  - [ ] 业务方法测试
  - [ ] 审计信息测试

- [ ] 聚合根测试补充
  - [ ] 一致性边界验证
  - [ ] 领域事件发布
  - [ ] 版本控制

**应用层核心组件**

- [ ] CQRS 总线测试补充
  - [ ] 命令处理流程
  - [ ] 查询处理流程
  - [ ] 事件发布流程
  - [ ] 错误处理

- [ ] 用例测试补充
  - [ ] 用例注册
  - [ ] 用例执行
  - [ ] 权限验证

#### 测试模板

```typescript
// 领域实体测试模板
describe('EntityName', () => {
  describe('创建', () => {
    it('应该能够创建有效实体', () => {
      // Arrange
      const validData = {...};
      
      // Act
      const entity = EntityName.create(validData);
      
      // Assert
      expect(entity).toBeDefined();
      expect(entity.id).toBeDefined();
    });

    it('应该在无效数据时抛出异常', () => {
      // Arrange
      const invalidData = {...};
      
      // Act & Assert
      expect(() => EntityName.create(invalidData)).toThrow();
    });
  });

  describe('业务方法', () => {
    it('应该正确执行业务逻辑', () => {
      // ... 测试实现
    });
  });
});
```

### 阶段 3: 集成测试（1周）

**目标**: 补充跨层集成测试

#### 任务清单

- [ ] CQRS 完整流程测试
  - [ ] 命令 → 聚合根 → 事件
  - [ ] 查询 → 读模型 → 结果
  - [ ] 事件 → 投影器 → 读模型

- [ ] 事件溯源测试
  - [ ] 事件存储 → 事件读取
  - [ ] 聚合根状态重建
  - [ ] 快照机制

- [ ] 多租户隔离测试
  - [ ] 数据隔离
  - [ ] 上下文注入
  - [ ] 权限验证

### 阶段 4: 性能测试（1周）

**目标**: 添加性能和压力测试

#### 任务清单

- [ ] 性能基准测试
  - [ ] 命令处理吞吐量
  - [ ] 查询响应时间
  - [ ] 事件处理延迟

- [ ] 压力测试
  - [ ] 并发命令处理
  - [ ] 高频查询
  - [ ] 大量事件发布

- [ ] 内存泄漏测试
  - [ ] 长时间运行测试
  - [ ] 内存使用监控

---

## 🛠️ 测试工具和配置

### Jest 配置

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
      "!src/**/*.d.ts",
      "!src/**/index.ts",
      "!src/examples/**"
    ],
    "coverageDirectory": "coverage",
    "coverageReporters": ["text", "lcov", "html", "json-summary"],
    "coverageThresholds": {
      "global": {
        "branches": 75,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### 运行测试的命令

```bash
# 运行所有测试
nx test hybrid-archi

# 运行测试并生成覆盖率报告
nx test hybrid-archi --coverage

# 运行特定测试文件
nx test hybrid-archi --testFile=base-entity.spec.ts

# 监听模式运行测试
nx test hybrid-archi --watch

# 运行集成测试
nx test hybrid-archi --testPathPattern=integration

# 运行 E2E 测试
nx test hybrid-archi --testPathPattern=e2e
```

### CI/CD 集成

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run tests with coverage
        run: nx test hybrid-archi --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: hybrid-archi
      
      - name: Check coverage thresholds
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80%"
            exit 1
          fi
```

---

## 📈 测试指标监控

### 定期报告

每周生成测试报告，包含：

1. **覆盖率趋势**
   - 各层覆盖率变化
   - 新增代码覆盖率
   - 未覆盖代码清单

2. **测试质量**
   - 测试数量
   - 测试执行时间
   - 测试稳定性（失败率）

3. **问题追踪**
   - 未修复的测试失败
   - 跳过的测试（skip/todo）
   - 测试技术债务

### 覆盖率看板

```
┌─────────────────────────────────────────────────────────┐
│                  测试覆盖率看板                          │
├─────────────────────────────────────────────────────────┤
│  总体覆盖率:        █████████░░  85%  ✅                │
│  领域层:            ██████████░  90%  ✅                │
│  应用层:            ████████░░░  80%  ✅                │
│  基础设施层:        ███████░░░░  70%  ⚠️                │
│  接口层:            ██████░░░░░  60%  ❌                │
├─────────────────────────────────────────────────────────┤
│  测试数量:          397 个                               │
│  通过率:            98.5%                                │
│  平均执行时间:      2.5 秒                               │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ 成功标准

### 最低要求（必须达到）

- ✅ 总体语句覆盖率 ≥ 80%
- ✅ 领域层覆盖率 ≥ 90%
- ✅ 所有关键业务逻辑有测试
- ✅ 所有公共 API 有测试
- ✅ CI/CD 集成测试自动运行

### 优秀标准（努力方向）

- 🌟 总体语句覆盖率 ≥ 90%
- 🌟 分支覆盖率 ≥ 85%
- 🌟  所有边界情况有测试
- 🌟 性能测试覆盖关键路径
- 🌟 测试执行时间 < 30 秒

---

## 📞 负责人和时间表

| 阶段 | 负责人 | 预计完成时间 | 状态 |
|------|--------|-------------|------|
| 阶段 1: 评估现状 | 测试团队 | 第 1 周 | ⏳ 待开始 |
| 阶段 2: 补充核心测试 | 开发团队 | 第 2-3 周 | ⏳ 待开始 |
| 阶段 3: 集成测试 | QA 团队 | 第 4 周 | ⏳ 待开始 |
| 阶段 4: 性能测试 | 性能团队 | 第 5 周 | ⏳ 待开始 |

---

**文档维护**: HL8 测试团队  
**最后更新**: 2025-01-27  
**版本**: 1.0.0
