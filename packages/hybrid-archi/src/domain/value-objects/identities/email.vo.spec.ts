/**
 * Email值对象单元测试
 *
 * @description 测试Email值对象的创建、验证和业务逻辑
 * @since 1.0.0
 */

import { Email, InvalidEmailException } from './email.vo';

describe('Email值对象', () => {
  describe('创建Email', () => {
    it('应该能够创建有效的邮箱', () => {
      // Arrange
      const validEmail = 'test@example.com';

      // Act
      const email = Email.create(validEmail);

      // Assert
      expect(email).toBeDefined();
      expect(email.value).toBe(validEmail);
    });

    it('应该接受带有多个子域名的邮箱', () => {
      // Arrange
      const validEmail = 'user@mail.example.com';

      // Act
      const email = Email.create(validEmail);

      // Assert
      expect(email).toBeDefined();
      expect(email.value).toBe(validEmail);
    });

    it('应该接受带有加号的邮箱', () => {
      // Arrange
      const validEmail = 'user+tag@example.com';

      // Act
      const email = Email.create(validEmail);

      // Assert
      expect(email).toBeDefined();
      expect(email.value).toBe(validEmail);
    });

    it('应该接受带有数字的邮箱', () => {
      // Arrange
      const validEmail = 'user123@example456.com';

      // Act
      const email = Email.create(validEmail);

      // Assert
      expect(email).toBeDefined();
      expect(email.value).toBe(validEmail);
    });

    it('应该在邮箱为空时抛出异常', () => {
      // Arrange
      const emptyEmail = '';

      // Act & Assert
      expect(() => Email.create(emptyEmail)).toThrow(InvalidEmailException);
      expect(() => Email.create(emptyEmail)).toThrow('邮箱不能为空');
    });

    it('应该在邮箱为空白字符时抛出异常', () => {
      // Arrange
      const whitespaceEmail = '   ';

      // Act & Assert
      expect(() => Email.create(whitespaceEmail)).toThrow(InvalidEmailException);
      expect(() => Email.create(whitespaceEmail)).toThrow('邮箱不能为空');
    });

    it('应该在邮箱超过254个字符时抛出异常', () => {
      // Arrange
      const longEmail = 'a'.repeat(245) + '@example.com'; // 总共超过254个字符

      // Act & Assert
      expect(() => Email.create(longEmail)).toThrow(InvalidEmailException);
      expect(() => Email.create(longEmail)).toThrow('邮箱长度不能超过254个字符');
    });

    it('应该在邮箱格式无效时抛出异常 - 缺少@符号', () => {
      // Arrange
      const invalidEmail = 'testexample.com';

      // Act & Assert
      expect(() => Email.create(invalidEmail)).toThrow(InvalidEmailException);
      expect(() => Email.create(invalidEmail)).toThrow('邮箱格式无效');
    });

    it('应该在邮箱格式无效时抛出异常 - 缺少域名', () => {
      // Arrange
      const invalidEmail = 'test@';

      // Act & Assert
      expect(() => Email.create(invalidEmail)).toThrow(InvalidEmailException);
      expect(() => Email.create(invalidEmail)).toThrow('邮箱格式无效');
    });

    it('应该在邮箱格式无效时抛出异常 - 缺少本地部分', () => {
      // Arrange
      const invalidEmail = '@example.com';

      // Act & Assert
      expect(() => Email.create(invalidEmail)).toThrow(InvalidEmailException);
      expect(() => Email.create(invalidEmail)).toThrow('邮箱格式无效');
    });

    it('应该在邮箱本地部分超过64个字符时抛出异常', () => {
      // Arrange
      const longLocalPart = 'a'.repeat(65) + '@example.com';

      // Act & Assert
      expect(() => Email.create(longLocalPart)).toThrow(InvalidEmailException);
      expect(() => Email.create(longLocalPart)).toThrow('邮箱本地部分长度不能超过64个字符');
    });
  });

  describe('getDomain', () => {
    it('应该能够获取邮箱域名', () => {
      // Arrange
      const email = Email.create('test@example.com');

      // Act
      const domain = email.getDomain();

      // Assert
      expect(domain).toBe('example.com');
    });

    it('应该能够获取多级域名', () => {
      // Arrange
      const email = Email.create('test@mail.example.com');

      // Act
      const domain = email.getDomain();

      // Assert
      expect(domain).toBe('mail.example.com');
    });
  });

  describe('getLocalPart', () => {
    it('应该能够获取邮箱本地部分', () => {
      // Arrange
      const email = Email.create('test@example.com');

      // Act
      const localPart = email.getLocalPart();

      // Assert
      expect(localPart).toBe('test');
    });

    it('应该能够获取带有特殊字符的本地部分', () => {
      // Arrange
      const email = Email.create('user+tag@example.com');

      // Act
      const localPart = email.getLocalPart();

      // Assert
      expect(localPart).toBe('user+tag');
    });
  });

  describe('equals', () => {
    it('应该能够比较两个相同的邮箱', () => {
      // Arrange
      const email1 = Email.create('test@example.com');
      const email2 = Email.create('test@example.com');

      // Act
      const result = email1.equals(email2);

      // Assert
      expect(result).toBe(true);
    });

    it('应该在比较时不区分大小写', () => {
      // Arrange
      const email1 = Email.create('Test@Example.com');
      const email2 = Email.create('test@example.com');

      // Act
      const result = email1.equals(email2);

      // Assert
      expect(result).toBe(true);
    });

    it('应该能够判断两个不同的邮箱不相等', () => {
      // Arrange
      const email1 = Email.create('test1@example.com');
      const email2 = Email.create('test2@example.com');

      // Act
      const result = email1.equals(email2);

      // Assert
      expect(result).toBe(false);
    });

    it('应该在与null比较时返回false', () => {
      // Arrange
      const email = Email.create('test@example.com');

      // Act
      const result = email.equals(null);

      // Assert
      expect(result).toBe(false);
    });

    it('应该在与undefined比较时返回false', () => {
      // Arrange
      const email = Email.create('test@example.com');

      // Act
      const result = email.equals(undefined);

      // Assert
      expect(result).toBe(false);
    });

    it('应该在与非Email类型比较时返回false', () => {
      // Arrange
      const email = Email.create('test@example.com');
      const other = { value: 'test@example.com' } as any;

      // Act
      const result = email.equals(other);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('toString', () => {
    it('应该能够转换为字符串', () => {
      // Arrange
      const emailStr = 'test@example.com';
      const email = Email.create(emailStr);

      // Act
      const result = email.toString();

      // Assert
      expect(result).toBe(emailStr);
    });

    it('应该保持原始大小写', () => {
      // Arrange
      const emailStr = 'Test@Example.com';
      const email = Email.create(emailStr);

      // Act
      const result = email.toString();

      // Assert
      expect(result).toBe(emailStr);
    });
  });
});

