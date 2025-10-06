# 值对象移动总结

## 概述

本次重构将具有全局通用性的值对象从 `saas-core` 项目移动到 `hybrid-archi` 包中，以便其他项目可以复用这些通用的值对象。

## 移动的值对象

### 1. 安全相关值对象 (`security/`)

这些值对象具有全局通用性，适用于任何需要安全功能的项目：

- **`mfa-type.vo.ts`** - 多因素认证类型枚举
  - 定义了6种MFA类型：TOTP、SMS、EMAIL、BACKUP_CODES、BIOMETRIC、HARDWARE_TOKEN
  - 包含完整的工具类 `MfaTypeUtils`
  - 支持安全级别评估、配置验证等功能

- **`mfa-status.vo.ts`** - 多因素认证状态枚举
  - 定义了6种状态：DISABLED、PENDING_SETUP、ACTIVE、SUSPENDED、EXPIRED、FAILED
  - 包含完整的工具类 `MfaStatusUtils`
  - 支持状态转换、状态验证等功能

- **`password-policy.vo.ts`** - 密码策略值对象
  - 完整的密码策略定义和验证逻辑
  - 支持默认、宽松、严格三种预设策略
  - 包含密码强度计算和验证功能

### 2. 审计相关值对象 (`audit/`)

- **`audit-event-type.vo.ts`** - 审计事件类型枚举
  - 定义了80+种审计事件类型
  - 支持认证、授权、数据、系统、安全、业务等6大分类
  - 包含完整的工具类 `AuditEventTypeUtils`
  - 符合SOX、GDPR、HIPAA等合规标准

### 3. 权限相关值对象 (`types/`)

- **`permission-definitions.vo.ts`** - 细粒度权限定义
  - 定义了100+种细粒度权限
  - 支持平台级、租户级、组织级、部门级、个人级、系统功能等6大分类
  - 包含完整的权限层级管理和继承关系
  - 包含完整的工具类 `PermissionDefinitionsUtils`

## 保留在saas-core的值对象

以下值对象保留在 `saas-core` 中，因为它们是特定于多租户SAAS平台的：

- **`DataIsolationStrategy`** - 数据隔离策略
  - 特定于多租户SAAS平台的数据隔离需求
  - 包含4种隔离策略：行级、数据库级、模式级、应用级

## 目录结构

```
packages/hybrid-archi/src/domain/value-objects/
├── security/
│   ├── index.ts
│   ├── mfa-type.vo.ts
│   ├── mfa-status.vo.ts
│   └── password-policy.vo.ts
├── audit/
│   ├── index.ts
│   └── audit-event-type.vo.ts
├── types/
│   ├── index.ts
│   ├── tenant-type.vo.ts
│   ├── user-role.vo.ts
│   └── permission-definitions.vo.ts
└── index.ts (已更新导出)
```

## 导入方式

### 从hybrid-archi导入

```typescript
// 导入安全相关值对象
import { MfaType, MfaTypeUtils, MfaStatus, MfaStatusUtils, PasswordPolicy } from '@hl8/hybrid-archi';

// 导入审计相关值对象
import { AuditEventType, AuditEventTypeUtils } from '@hl8/hybrid-archi';

// 导入权限相关值对象
import { PermissionDefinitions, PermissionDefinitionsUtils } from '@hl8/hybrid-archi';
```

### 从saas-core导入

```typescript
// 导入多租户特定值对象
import { DataIsolationStrategy, IsolationStrategyUtils } from '@hl8/saas-core';
```

## 优势

1. **代码复用**：其他项目可以直接使用这些通用的值对象
2. **一致性**：确保所有项目使用相同的安全、审计、权限标准
3. **维护性**：集中管理通用值对象，便于维护和更新
4. **扩展性**：新项目可以快速集成这些成熟的值对象

## 注意事项

1. 所有移动的值对象都保持了原有的API接口
2. 更新了相关的导入路径
3. 删除了saas-core中的原始文件
4. 保持了完整的TSDoc注释和业务规则描述

## 后续建议

1. 考虑为移动的值对象添加单元测试
2. 考虑创建使用示例和文档
3. 考虑版本管理和向后兼容性
4. 考虑为其他项目创建集成指南
