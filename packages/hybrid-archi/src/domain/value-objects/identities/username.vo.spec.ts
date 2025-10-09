/**
 * Username值对象单元测试
 *
 * @description 测试Username值对象的创建、验证和业务逻辑
 * @since 1.0.0
 */

import { Username, InvalidUsernameException } from './username.vo';

describe('Username值对象', () => {
  describe('创建Username', () => {
    it('应该能够创建有效的用户名', () => {
      // Arrange
      const validUsername = 'testuser';

      // Act
      const username = Username.create(validUsername);

      // Assert
      expect(username).toBeDefined();
      expect(username.value).toBe(validUsername);
    });

    it('应该接受带有下划线的用户名', () => {
      // Arrange
      const validUsername = 'test_user';

      // Act
      const username = Username.create(validUsername);

      // Assert
      expect(username).toBeDefined();
      expect(username.value).toBe(validUsername);
    });

    it('应该接受带有连字符的用户名', () => {
      // Arrange
      const validUsername = 'test-user';

      // Act
      const username = Username.create(validUsername);

      // Assert
      expect(username).toBeDefined();
      expect(username.value).toBe(validUsername);
    });

    it('应该接受带有数字的用户名', () => {
      // Arrange
      const validUsername = 'test123';

      // Act
      const username = Username.create(validUsername);

      // Assert
      expect(username).toBeDefined();
      expect(username.value).toBe(validUsername);
    });

    it('应该接受20个字符的用户名', () => {
      // Arrange
      const validUsername = 'a'.repeat(20);

      // Act
      const username = Username.create(validUsername);

      // Assert
      expect(username).toBeDefined();
      expect(username.value).toBe(validUsername);
    });

    it('应该在用户名为空时抛出异常', () => {
      // Arrange
      const emptyUsername = '';

      // Act & Assert
      expect(() => Username.create(emptyUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(emptyUsername)).toThrow('用户名不能为空');
    });

    it('应该在用户名为空白字符时抛出异常', () => {
      // Arrange
      const whitespaceUsername = '   ';

      // Act & Assert
      expect(() => Username.create(whitespaceUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(whitespaceUsername)).toThrow('用户名不能为空');
    });

    it('应该在用户名少于3个字符时抛出异常', () => {
      // Arrange
      const shortUsername = 'ab';

      // Act & Assert
      expect(() => Username.create(shortUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(shortUsername)).toThrow('用户名至少3个字符');
    });

    it('应该在用户名超过20个字符时抛出异常', () => {
      // Arrange
      const longUsername = 'a'.repeat(21);

      // Act & Assert
      expect(() => Username.create(longUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(longUsername)).toThrow('用户名最多20个字符');
    });

    it('应该在用户名包含非法字符时抛出异常 - 空格', () => {
      // Arrange
      const invalidUsername = 'test user';

      // Act & Assert
      expect(() => Username.create(invalidUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(invalidUsername)).toThrow('用户名只能包含字母、数字、下划线和连字符');
    });

    it('应该在用户名包含非法字符时抛出异常 - 特殊符号', () => {
      // Arrange
      const invalidUsername = 'test@user';

      // Act & Assert
      expect(() => Username.create(invalidUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(invalidUsername)).toThrow('用户名只能包含字母、数字、下划线和连字符');
    });

    it('应该在用户名以数字开头时抛出异常', () => {
      // Arrange
      const invalidUsername = '123test';

      // Act & Assert
      expect(() => Username.create(invalidUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(invalidUsername)).toThrow('用户名不能以数字开头');
    });

    it('应该在用户名包含连续下划线时抛出异常', () => {
      // Arrange
      const invalidUsername = 'test__user';

      // Act & Assert
      expect(() => Username.create(invalidUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(invalidUsername)).toThrow('用户名不能包含连续的特殊字符');
    });

    it('应该在用户名包含连续连字符时抛出异常', () => {
      // Arrange
      const invalidUsername = 'test--user';

      // Act & Assert
      expect(() => Username.create(invalidUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(invalidUsername)).toThrow('用户名不能包含连续的特殊字符');
    });

    it('应该在用户名为保留字时抛出异常 - admin', () => {
      // Arrange
      const reservedUsername = 'admin';

      // Act & Assert
      expect(() => Username.create(reservedUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(reservedUsername)).toThrow('是系统保留字');
    });

    it('应该在用户名为保留字时抛出异常 - root', () => {
      // Arrange
      const reservedUsername = 'root';

      // Act & Assert
      expect(() => Username.create(reservedUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(reservedUsername)).toThrow('是系统保留字');
    });

    it('应该在用户名为保留字时抛出异常 - 不区分大小写', () => {
      // Arrange
      const reservedUsername = 'ADMIN';

      // Act & Assert
      expect(() => Username.create(reservedUsername)).toThrow(InvalidUsernameException);
      expect(() => Username.create(reservedUsername)).toThrow('是系统保留字');
    });
  });

  describe('equals', () => {
    it('应该能够比较两个相同的用户名', () => {
      // Arrange
      const username1 = Username.create('testuser');
      const username2 = Username.create('testuser');

      // Act
      const result = username1.equals(username2);

      // Assert
      expect(result).toBe(true);
    });

    it('应该在比较时不区分大小写', () => {
      // Arrange
      const username1 = Username.create('TestUser');
      const username2 = Username.create('testuser');

      // Act
      const result = username1.equals(username2);

      // Assert
      expect(result).toBe(true);
    });

    it('应该能够判断两个不同的用户名不相等', () => {
      // Arrange
      const username1 = Username.create('testuser1');
      const username2 = Username.create('testuser2');

      // Act
      const result = username1.equals(username2);

      // Assert
      expect(result).toBe(false);
    });

    it('应该在与null比较时返回false', () => {
      // Arrange
      const username = Username.create('testuser');

      // Act
      const result = username.equals(null);

      // Assert
      expect(result).toBe(false);
    });

    it('应该在与undefined比较时返回false', () => {
      // Arrange
      const username = Username.create('testuser');

      // Act
      const result = username.equals(undefined);

      // Assert
      expect(result).toBe(false);
    });

    it('应该在与非Username类型比较时返回false', () => {
      // Arrange
      const username = Username.create('testuser');
      const other = { value: 'testuser' } as any;

      // Act
      const result = username.equals(other);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('应该能够转换为字符串', () => {
      // Arrange
      const usernameStr = 'testuser';
      const username = Username.create(usernameStr);

      // Act
      const result = username.toString();

      // Assert
      expect(result).toBe(usernameStr);
    });

    it('应该保持原始大小写', () => {
      // Arrange
      const usernameStr = 'TestUser';
      const username = Username.create(usernameStr);

      // Act
      const result = username.toString();

      // Assert
      expect(result).toBe(usernameStr);
    });
  });
});

