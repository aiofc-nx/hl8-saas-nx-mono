# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 中文优先原则检查

- [ ] 所有代码注释和文档必须使用中文
- [ ] 错误消息和用户界面必须使用中文
- [ ] 测试描述必须使用中文

### TSDoc 文档标准检查

- [ ] 所有公共API必须添加完整的TSDoc注释
- [ ] 注释必须包含业务规则描述、前置条件、业务逻辑、异常处理
- [ ] 必须使用 @description、@param、@returns、@throws、@example 等标记

### 混合架构模式检查

- [ ] 遵循充血模型设计原则，业务逻辑在实体内
- [ ] 采用Clean Architecture + DDD + CQRS + ES + EDA混合架构
- [ ] 架构分层：Interface → Application → Domain → Infrastructure
- [ ] 依赖方向：外层依赖内层，内层不依赖外层
- [ ] CQRS：命令端处理写操作，查询端处理读操作
- [ ] 事件溯源：所有领域事件持久化，支持状态重建

### 实体与聚合根分离原则检查

- [ ] 聚合根管理一致性边界，协调内部实体操作
- [ ] 聚合根发布领域事件，验证业务规则
- [ ] 聚合根支持事件溯源和事件驱动架构
- [ ] 实体执行具体业务操作，维护自身状态
- [ ] 实体实现业务逻辑，遵循聚合根指令
- [ ] 实体包含完整的业务方法

### 测试优先原则检查

- [ ] 单元测试文件(.spec.ts)与被测试文件在同一目录
- [ ] 集成测试和端到端测试放置在 `__tests__` 目录
- [ ] 所有测试使用中文描述，遵循AAA模式

### Nx Monorepo 管理检查

- [ ] 使用Nx生成器创建项目结构
- [ ] 通过Nx项目图管理项目间依赖
- [ ] 利用Nx的智能缓存提高构建效率

### MCP 工具集成检查

- [ ] 优先使用可用的MCP工具进行项目分析
- [ ] 使用MCP工具进行代码生成、任务执行和代码检查

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
