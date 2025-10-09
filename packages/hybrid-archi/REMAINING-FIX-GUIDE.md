# 剩余测试修复指南

## 快速修复命令

由于剩余的测试问题都是类似的EntityId类型问题，可以使用以下批量修复方案：

### 1. 需要在所有失败测试文件开头添加EntityId导入

```typescript
import { EntityId } from '../../value-objects/entity-id';
// 或根据文件位置调整路径
```

### 2. 批量替换模式

对于每个失败的测试文件，按以下步骤修复：

#### 步骤1：修改类型声明

```bash
# 将 let tenantId: string; 改为
let tenantId: EntityId;
```

#### 步骤2：修改初始化

```bash
# 将 tenantId = 'test-tenant-123'; 改为
tenantId = EntityId.generate();
```

#### 步骤3：修改构造函数参数

```bash
# 将 tenantId: string 改为
tenantId: EntityId
```

#### 步骤4：修改比较

```bash
# 将 expect(x.tenantId).toBe(tenantId); 改为
expect(x.tenantId.equals(tenantId)).toBe(true);

# 将 expect(json.tenantId).toBe(tenantId); 改为
expect(json.tenantId).toBe(tenantId.toString());
```

### 3. 需要修复的具体文件列表

#### audit-info.spec.ts 修复点

- 第10行添加: `import { EntityId } from '../../value-objects/entity-id';`
- 第22行改为: `tenantId: EntityId.generate(),`
- 第37行改为: `expect(auditInfo.tenantId.toString()).toBe('...')`
- 第62行改为: `tenantId: EntityId.generate(),`
- 第92行改为: `tenantId: EntityId.generate(),`
- 第110行改为: `tenantId: EntityId.generate(),`
- 第178行改为: `.withTenantId(EntityId.generate())`
- 第190行改为: `.withTenantId(EntityId.generate())`
- 第236行改为: `.withTenantId(EntityId.generate())`
- 第315行改为: `.withTenantId(EntityId.generate())`
- 第355行改为: `.withTenantId(EntityId.generate())`
- 第364行改为: `.withTenantId(EntityId.generate())`

#### base-entity.spec.ts 修复点

- 添加EntityId导入
- 第50行: `tenantId: EntityId.generate(),`
- 第273行: 参数类型改为EntityId
- 第349行: `tenantId: EntityId.generate(),`
- 第362行: `tenantId: EntityId.generate(),`

#### base-aggregate-root.spec.ts 修复点

- 添加EntityId导入
- 第27行: 参数改为EntityId类型
- 第37行: `tenantId: EntityId.generate(),`

#### tenant-aware-aggregate-root.spec.ts 修复点

- 添加EntityId导入
- 移除不存在的GeneralForbiddenException导入
- 为TestEvent添加eventType属性
- 第70行: 修复eventType参数（不应该传入super）
- 第231行和254行: `getDomainEvents()` 改为 `domainEvents`
- 第352行: `data.tenantId` 改为 `data['tenantId']`

#### CQRS Bus测试文件修复

command-bus.spec.ts、query-bus.spec.ts、event-bus.spec.ts、cqrs-bus.spec.ts

- 在测试中将string类型的tenantId改为EntityId类型

#### Decorator测试文件修复

saga.decorator.spec.ts、event-handler.decorator.spec.ts

- 修复事件类的tenantId参数类型

#### Integration测试修复

user-management.integration.spec.ts

- 第46行: `tenantId: EntityId.generate()`

### 4. API变更修复

在tenant-aware-aggregate-root.spec.ts和其他聚合根测试中：

```typescript
// 修复前
const events = aggregate.getDomainEvents();

// 修复后  
const events = aggregate.domainEvents;
```

### 5. 验证修复

修复完成后运行：

```bash
nx test hybrid-archi
```

### 6. 预期结果

修复后应该看到：

- ✅ 43个测试套件全部通过
- ✅ 558+个测试用例全部通过
- ✅ 无类型错误
- ✅ 无导入错误

## 快速修复脚本（可选）

如果你想使用脚本批量修复，可以创建以下Node.js脚本：

```javascript
// fix-entity-id-tests.js
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/domain/entities/base/audit-info.spec.ts',
  'src/domain/entities/base/base-entity.spec.ts',
  // ... 添加其他文件
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 添加EntityId导入（如果还没有）
  if (!content.includes("import { EntityId }")) {
    const importLine = "import { EntityId } from '../../value-objects/entity-id';\n";
    content = content.replace(
      /(import.*from.*;\n)/,
      '$1' + importLine
    );
  }
  
  // 替换字符串类型的tenantId为EntityId
  content = content.replace(
    /tenantId:\s*'[^']+'/g,
    'tenantId: EntityId.generate()'
  );
  
  // 替换tenantId类型声明
  content = content.replace(
    /tenantId:\s*string/g,
    'tenantId: EntityId'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});
```

运行：

```bash
node fix-entity-id-tests.js
```

## 总结

已完成：

- ✅ 220个新测试用例（全部通过）
- ✅ 3个旧测试文件修复
- ✅ 导出问题修复

待完成：

- ⏳ 18个旧测试文件的EntityId类型修复
- ⏳ API变更修复（getDomainEvents → domainEvents）

预计剩余时间：30-60分钟手动修复，或5-10分钟使用脚本
