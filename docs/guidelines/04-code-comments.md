# 代码注释规范

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

## 📖 相关文档

- 📋 [编码规范总览](./01-coding-standards.md) - 整体编码规范
- 💡 [充血模型实践](./02-rich-domain-model-practice.md) - 实体注释示例

---

## 核心原则

1. **代码即文档**: 通过完整注释实现代码自文档化
2. **中文注释**: 使用中文，确保清晰准确
3. **TSDoc规范**: 遵循 TSDoc 标准
4. **业务描述**: 必须包含业务规则和逻辑说明
5. **及时更新**: 代码变更时同步更新注释

---

## TSDoc 标记

### 必需标记

- `@description`: 详细功能描述和业务规则
- `@param`: 参数说明
- `@returns`: 返回值说明
- `@throws`: 异常情况
- `@example`: 使用示例

### 可选标记

- `@since`: 版本信息
- `@see`: 相关引用
- `@remarks`: 补充说明

### 禁用标记

❌ 不使用：

- `@created` - 使用 Git 历史
- `@author` - 使用 Git 历史
- `@version` - 使用 `@since`

---

## 注释模板

### 类注释

```typescript
/**
 * {类名称}
 *
 * @description {详细描述}
 *
 * ## 业务规则
 *
 * ### {规则分类1}
 * - {规则描述1}
 * - {规则描述2}
 *
 * ### {规则分类2}
 * - {规则描述}
 *
 * ## 业务逻辑流程
 *
 * 1. {步骤1}
 * 2. {步骤2}
 * 3. {步骤3}
 *
 * @example
 * ```typescript
 * {示例代码}
 * ```
 *
 * @since 1.0.0
 */
export class ClassName {
  // ...
}
```

### 方法注释

```typescript
/**
 * {方法功能简述}
 *
 * @description {详细描述}
 *
 * ## 业务规则
 * - {规则1}
 * - {规则2}
 *
 * @param {参数名} - {参数说明}
 * @returns {返回值说明}
 * @throws {异常类型} {异常说明}
 *
 * @example
 * ```typescript
 * {示例代码}
 * ```
 *
 * @since 1.0.0
 */
methodName(param: ParamType): ReturnType {
  // 实现
}
```

### 接口注释

```typescript
/**
 * {接口名称}
 *
 * @description {接口职责描述}
 *
 * ## 接口职责
 * - {职责1}
 * - {职责2}
 *
 * @since 1.0.0
 */
export interface IInterfaceName {
  /**
   * {方法说明}
   *
   * @param {参数名} - {参数说明}
   * @returns {返回值说明}
   */
  methodName(param: ParamType): ReturnType;
}
```

---

## 完整示例

```typescript
/**
 * 用户聚合根
 *
 * @description 管理用户及其关联实体的聚合根
 * 负责用户身份、权限、配置等的一致性管理
 *
 * ## 业务规则
 *
 * ### 用户状态规则
 * - 新用户默认为待激活状态
 * - 只有待激活用户可以被激活
 * - 只有激活用户可以被暂停
 * - 暂停用户不能登录系统
 *
 * ### 用户角色规则
 * - 用户可以拥有多个角色
 * - 只有激活用户可以分配角色
 * - 角色分配立即生效
 *
 * @example
 * ```typescript
 * const user = User.create(
 *   UserId.generate(),
 *   new Email('user@example.com'),
 *   HashedPassword.fromPlainText('password123')
 * );
 *
 * user.activate();
 * user.assignRole(Role.Admin);
 * ```
 *
 * @since 1.0.0
 */
export class User extends BaseAggregateRoot {
  private id: UserId;
  private email: Email;
  private status: UserStatus;
  private roles: Role[];
  
  /**
   * 激活用户
   *
   * @description 将用户从待激活状态转为激活状态
   *
   * ## 业务规则
   * - 只有待激活状态的用户才能被激活
   * - 激活后用户可以登录系统
   * - 激活后发布 UserActivatedEvent 事件
   *
   * @throws {UserNotPendingException} 用户不是待激活状态
   *
   * @example
   * ```typescript
   * const user = await userRepository.findById(userId);
   * user.activate(); // 激活用户
   * await userRepository.save(user);
   * ```
   *
   * @since 1.0.0
   */
  activate(): void {
    if (this.status !== UserStatus.Pending) {
      throw new UserNotPendingException(this.id);
    }
    
    this.status = UserStatus.Active;
    this.addDomainEvent(new UserActivatedEvent(this.id));
  }
}
```

---

**返回**: [开发规范文档中心](./README.md)
