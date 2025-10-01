# Git 提交规范

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

## 📖 相关文档

- 📋 [编码规范总览](./01-coding-standards.md) - 整体编码规范

---

## 提交消息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## 提交类型 (type)

| 类型 | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat(cache): 添加Redis连接池支持` |
| `fix` | 修复bug | `fix(auth): 修复登录超时问题` |
| `docs` | 文档更新 | `docs: 更新开发规范文档` |
| `style` | 代码格式 | `style: 格式化代码` |
| `refactor` | 重构 | `refactor(user): 重构用户服务` |
| `perf` | 性能优化 | `perf(cache): 优化缓存查询性能` |
| `test` | 测试 | `test(user): 添加用户服务测试` |
| `chore` | 构建工具 | `chore: 更新依赖包` |

---

## 作用域 (scope)

使用包名或模块名：

```
feat(cache): ...
fix(logger): ...
docs(multi-tenancy): ...
refactor(messaging): ...
```

---

## 主题 (subject)

- 使用中文
- 简洁描述（≤50字符）
- 使用祈使句
- 不以句号结尾

### ✅ 正确

```
feat(cache): 添加常量统一管理功能
fix(auth): 修复令牌过期验证逻辑
```

### ❌ 错误

```
feat(cache): 添加了常量统一管理功能。  # ❌ 过去式，有句号
fix: bug修复  # ❌ 不够具体
```

---

## 提交消息体 (body)

说明：

- 修改的动机
- 与之前的对比

```
feat(cache): 添加常量统一管理功能

- 创建 constants.ts 文件
- 使用命名空间组织常量
- 移除所有向后兼容代码
- 更新所有引用位置

旧方式使用扁平导出，容易产生命名冲突。
新方式使用命名空间，提供更好的类型安全。
```

---

## 页脚 (footer)

关联 Issue：

```
Closes #123
Fixes #456
Refs #789
```

---

## 完整示例

```
feat(cache): 添加常量统一管理功能

## 变更内容
- 创建 constants.ts 文件
- 使用 DI_TOKENS 和 DECORATOR_METADATA 命名空间
- 移除向后兼容的旧导出
- 更新所有使用位置

## 改进
- 提供更好的类型推断
- IDE 自动补全支持
- 避免硬编码字符串

Closes #123
```

---

**返回**: [开发规范文档中心](./README.md)
