# 测试规范

> **版本**: 1.0.0  
> **更新日期**: 2025-10-01

## 📖 相关文档

- 📋 [编码规范总览](./01-coding-standards.md) - 整体编码规范
- 💡 [充血模型实践](./02-rich-domain-model-practice.md) - 实体测试示例
- 📋 [命名规范](./05-naming-conventions.md) - 测试文件命名

---

## 测试文件命名

```
{name}.spec.ts          # 单元测试
{name}.e2e-spec.ts      # 端到端测试
{name}.integration-spec.ts  # 集成测试
```

---

## 测试结构

### AAA 模式

使用 Arrange-Act-Assert 模式：

```typescript
describe('UserService', () => {
  let service: UserService;
  let repository: MockType<UserRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get(UserService);
    repository = module.get(UserRepository);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange - 准备测试数据
      const dto = {
        email: 'test@example.com',
        password: 'password123'
      };
      const expectedUser = new User(dto.email);

      repository.save.mockResolvedValue(expectedUser);

      // Act - 执行测试
      const result = await service.createUser(dto);

      // Assert - 验证结果
      expect(result).toEqual(expectedUser);
      expect(repository.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: dto.email })
      );
    });
  });
});
```

---

## 测试覆盖率要求

| 类型 | 覆盖率要求 |
|------|-----------|
| 单元测试覆盖率 | ≥ 80% |
| 业务逻辑覆盖率 | 100% |
| 分支覆盖率 | ≥ 70% |

---

## 实体测试

充血模型实体的测试无需mock：

```typescript
describe('User Entity', () => {
  describe('activate', () => {
    it('should activate pending user', () => {
      // Arrange
      const user = User.create(
        UserId.generate(),
        new Email('test@example.com'),
        HashedPassword.fromPlainText('password123')
      );
      
      // Act
      user.activate();
      
      // Assert
      expect(user.isActive()).toBe(true);
      expect(user.getDomainEvents()).toHaveLength(1);
      expect(user.getDomainEvents()[0]).toBeInstanceOf(UserActivatedEvent);
    });
    
    it('should throw error when user is not pending', () => {
      // Arrange
      const user = User.create(...);
      user.activate(); // 先激活
      
      // Act & Assert
      expect(() => user.activate()).toThrow(UserNotPendingException);
    });
  });
});
```

---

## Mock 使用

### Mock 仓储

```typescript
const mockRepository = (): MockType<UserRepository> => ({
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findByEmail: jest.fn(),
});

type MockType<T> = {
  [P in keyof T]?: jest.Mock<any>;
};
```

---

## 快速参考

### 测试清单

- [ ] 所有公共方法都有测试
- [ ] 业务规则都有测试覆盖
- [ ] 异常情况都有测试
- [ ] 边界条件都有测试
- [ ] 测试覆盖率达标
- [ ] 测试命名清晰描述行为
- [ ] 使用 AAA 模式组织测试

---

**返回**: [开发规范文档中心](./README.md)
