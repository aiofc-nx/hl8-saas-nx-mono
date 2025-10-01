# 📚 文档结构说明

> **版本**: 2.0.0  
> **更新日期**: 2025-10-01  
> **重大变更**: 文档拆分为架构设计和编码规范两个目录

---

## 🎯 文档结构重组

### 为什么重组

原有的 `DEVELOPMENT_GUIDELINES.md` 混合了两类内容：

1. **技术架构设计** - 为什么这样设计（设计层面）
2. **开发编码规范** - 如何编写代码（实践层面）

### 新的结构

将文档拆分为两个独立目录，职责更清晰：

```
docs/
├── architecture/        # 📐 技术架构设计（WHY - 为什么）
│   ├── 架构原则
│   ├── DDD理论
│   └── CQRS/事件溯源
│
└── guidelines/          # 📋 开发编码规范（HOW - 怎么做）
    ├── 编码规范
    ├── 充血模型实践
    └── 各项规范
```

---

## 📁 完整目录结构

```
docs/
├── README.md                              # ✅ 文档导航中心
│
├── architecture/                          # 📐 技术架构设计
│   ├── README.md                          # ✅ 架构文档索引
│   ├── 01-architecture-principles.md      # ✅ 架构设计原则
│   ├── 02-domain-driven-design.md         # ✅ 领域驱动设计
│   ├── 03-cqrs-event-sourcing.md          # ✅ CQRS与事件溯源
│   └── 04-event-driven-architecture.md    # ✅ 事件驱动架构
│
├── guidelines/                            # 📋 开发编码规范
│   ├── README.md                          # ✅ 规范文档索引
│   ├── 01-coding-standards.md             # ✅ 编码规范总览
│   ├── 02-rich-domain-model-practice.md   # ⏳ 待改名
│   ├── 03-constants-management.md         # ✅ 常量管理规范
│   ├── 04-code-comments.md                # ✅ 代码注释规范
│   ├── 05-naming-conventions.md           # ✅ 命名规范
│   ├── 06-type-safety.md                  # ✅ 类型安全规范
│   ├── 07-testing-standards.md            # ✅ 测试规范
│   ├── 08-git-conventions.md              # ✅ Git提交规范
│   ├── MIGRATION_GUIDE.md                  # 迁移指南
│   └── STATUS.md                           # 文档状态
│
├── TERMINOLOGY.md                         # 业务术语定义
├── saas-platform-architecture.md          # 系统架构设计
├── cache-module-cls-design.md             # 缓存模块设计
├── database-module-design.md              # 数据库模块设计
├── messaging-module-multitenancy-design.md # 消息队列设计
├── multi-tenancy-final-design.md          # 多租户设计
│
├── DEVELOPMENT_GUIDELINES.md              # ⚠️ 旧文档（可删除）
└── RICH_DOMAIN_MODEL.md                   # ⚠️ 旧文档（需改名复制）
```

---

## 📊 文档对比

### architecture/ (技术架构设计)

| 特点 | 说明 |
|------|------|
| **定位** | 技术设计要求、架构决策 |
| **内容** | 为什么采用这种架构、设计原则 |
| **受众** | 架构师、技术负责人、高级开发 |
| **示例** | "为什么用充血模型"、"为什么用CQRS" |
| **层面** | 设计决策层 |
| **变更频率** | 低（架构相对稳定） |

### guidelines/ (开发编码规范)

| 特点 | 说明 |
|------|------|
| **定位** | 日常编码规范、实践指南 |
| **内容** | 如何编写代码、具体操作步骤 |
| **受众** | 所有开发人员 |
| **示例** | "如何写充血实体"、"如何管理常量" |
| **层面** | 实践操作层 |
| **变更频率** | 中等（规范可能调整） |

---

## 🔗 文档关系

### 理论 → 实践

```
architecture/02-领域驱动设计.md
  (充血模型是什么、为什么用)
        ↓
guidelines/02-充血模型实践.md
  (如何编写充血实体代码)
```

### 架构 → 规范

```
architecture/01-架构设计原则.md
  (架构分层、依赖规则)
        ↓
guidelines/01-编码规范.md
  (如何按架构要求组织代码)
```

---

## ✅ 完成步骤

### 已完成 ✅

1. ✅ 创建 `architecture/` 目录和文档
   - README.md
   - 01-architecture-principles.md
   - 02-domain-driven-design.md
   - 03-cqrs-event-sourcing.md
   - 04-event-driven-architecture.md

2. ✅ 创建 `guidelines/` 专项规范文档
   - 01-coding-standards.md
   - 03-constants-management.md
   - 04-code-comments.md
   - 05-naming-conventions.md
   - 06-type-safety.md
   - 07-testing-standards.md
   - 08-git-conventions.md

3. ✅ 更新所有索引文档
   - README.md
   - docs/README.md
   - guidelines/README.md

### 待完成 ⏳

1. ⏳ 复制并改名充血模型实践文档

```bash
cd /home/arligle/aiofix-ai/hl8-saas-nx-mono/docs
cp RICH_DOMAIN_MODEL.md guidelines/02-rich-domain-model-practice.md
```

2. ⏳ (可选) 删除旧文档

```bash
# 确认新结构无问题后
rm docs/DEVELOPMENT_GUIDELINES.md
rm docs/RICH_DOMAIN_MODEL.md
```

---

## 📖 使用新文档结构

### 架构师查看架构设计

```bash
cd docs/architecture
cat README.md              # 查看架构文档索引
cat 01-architecture-principles.md
cat 02-domain-driven-design.md
```

### 开发人员查看编码规范

```bash
cd docs/guidelines
cat README.md              # 查看规范文档索引
cat 01-coding-standards.md
cat 03-constants-management.md
```

---

## 🎉 新结构的优势

1. **职责清晰**: 架构vs规范分离
2. **易于查找**: 按编号和功能组织
3. **便于学习**: 理论和实践分开
4. **方便维护**: 每个文档聚焦单一主题
5. **受众明确**: 不同角色查看不同文档

---

## 📞 问题反馈

如果对文档结构有疑问或建议：

1. 查看 [docs/README.md](./README.md)
2. 查看具体目录的 README
3. 提交 Issue 讨论

---

**文档维护**: HL8 开发团队  
**最后更新**: 2025-10-01
