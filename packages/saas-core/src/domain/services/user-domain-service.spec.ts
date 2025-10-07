/**
 * 用户领域服务单元测试
 * 
 * @description 测试用户领域服务的业务逻辑和跨聚合操作
 * 包括用户邮箱唯一性验证、用户名唯一性验证、密码强度验证、默认角色生成等功能
 * 
 * @since 1.0.0
 */

import { EntityId } from '@hl8/hybrid-archi';
import { UserDomainService, IUserDomainService } from './user-domain-service';

describe('UserDomainService', () => {
  let userDomainService: IUserDomainService;

  beforeEach(() => {
    userDomainService = new UserDomainService();
  });

  describe('constructor', () => {
    it('should create user domain service instance', () => {
      // Assert
      expect(userDomainService).toBeInstanceOf(UserDomainService);
      expect(userDomainService.getServiceName()).toBe('UserDomainService');
    });

    it('should implement IUserDomainService interface', () => {
      // Assert
      expect(userDomainService).toBeDefined();
      expect(typeof userDomainService.isUserEmailUnique).toBe('function');
      expect(typeof userDomainService.isUsernameUnique).toBe('function');
      expect(typeof userDomainService.validatePasswordStrength).toBe('function');
      expect(typeof userDomainService.generateDefaultRole).toBe('function');
      expect(typeof userDomainService.getServiceName).toBe('function');
    });
  });

  describe('isUserEmailUnique', () => {
    it('should return true for unique user email', async () => {
      // Arrange
      const uniqueEmail = 'unique@example.com';

      // Act
      const result = await userDomainService.isUserEmailUnique(uniqueEmail);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for unique user email with exclude user ID', async () => {
      // Arrange
      const email = 'existing@example.com';
      const excludeUserId = EntityId.generate().toString();

      // Act
      const result = await userDomainService.isUserEmailUnique(email, excludeUserId);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle empty email', async () => {
      // Arrange
      const emptyEmail = '';

      // Act
      const result = await userDomainService.isUserEmailUnique(emptyEmail);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle special characters in email', async () => {
      // Arrange
      const specialEmail = 'user+tag@example-domain.co.uk';

      // Act
      const result = await userDomainService.isUserEmailUnique(specialEmail);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle long email', async () => {
      // Arrange
      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';

      // Act
      const result = await userDomainService.isUserEmailUnique(longEmail);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isUsernameUnique', () => {
    it('should return true for unique username', async () => {
      // Arrange
      const uniqueUsername = 'unique_username';

      // Act
      const result = await userDomainService.isUsernameUnique(uniqueUsername);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for unique username with exclude user ID', async () => {
      // Arrange
      const username = 'existing_username';
      const excludeUserId = EntityId.generate().toString();

      // Act
      const result = await userDomainService.isUsernameUnique(username, excludeUserId);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle empty username', async () => {
      // Arrange
      const emptyUsername = '';

      // Act
      const result = await userDomainService.isUsernameUnique(emptyUsername);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle special characters in username', async () => {
      // Arrange
      const specialUsername = 'user_name-123.test';

      // Act
      const result = await userDomainService.isUsernameUnique(specialUsername);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle long username', async () => {
      // Arrange
      const longUsername = 'a'.repeat(100);

      // Act
      const result = await userDomainService.isUsernameUnique(longUsername);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return true for strong password', () => {
      // Arrange
      const strongPassword = 'StrongPassword123!';

      // Act
      const result = userDomainService.validatePasswordStrength(strongPassword);

      // Assert
      expect(result).toBe(true);
    });

    it('should return true for password with minimum length', () => {
      // Arrange
      const minLengthPassword = '12345678';

      // Act
      const result = userDomainService.validatePasswordStrength(minLengthPassword);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for short password', () => {
      // Arrange
      const shortPassword = '1234567';

      // Act
      const result = userDomainService.validatePasswordStrength(shortPassword);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false for empty password', () => {
      // Arrange
      const emptyPassword = '';

      // Act
      const result = userDomainService.validatePasswordStrength(emptyPassword);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle special characters in password', () => {
      // Arrange
      const specialPassword = 'Pass@#$%^&*()_+-=[]{}|;:,.<>?';

      // Act
      const result = userDomainService.validatePasswordStrength(specialPassword);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle unicode characters in password', () => {
      // Arrange
      const unicodePassword = '密码12345678';

      // Act
      const result = userDomainService.validatePasswordStrength(unicodePassword);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('generateDefaultRole', () => {
    it('should return default role for valid tenant ID', async () => {
      // Arrange
      const tenantId = EntityId.generate().toString();

      // Act
      const result = await userDomainService.generateDefaultRole(tenantId);

      // Assert
      expect(result).toBe('REGULAR_USER');
    });

    it('should return default role for empty tenant ID', async () => {
      // Arrange
      const emptyTenantId = '';

      // Act
      const result = await userDomainService.generateDefaultRole(emptyTenantId);

      // Assert
      expect(result).toBe('REGULAR_USER');
    });

    it('should return default role for special characters in tenant ID', async () => {
      // Arrange
      const specialTenantId = 'tenant@#$%^&*()_+-=[]{}|;:,.<>?';

      // Act
      const result = await userDomainService.generateDefaultRole(specialTenantId);

      // Assert
      expect(result).toBe('REGULAR_USER');
    });

    it('should return default role for long tenant ID', async () => {
      // Arrange
      const longTenantId = 'tenant_' + 'A'.repeat(100);

      // Act
      const result = await userDomainService.generateDefaultRole(longTenantId);

      // Assert
      expect(result).toBe('REGULAR_USER');
    });

    it('should return consistent default role', async () => {
      // Arrange
      const tenantId1 = EntityId.generate().toString();
      const tenantId2 = EntityId.generate().toString();

      // Act
      const result1 = await userDomainService.generateDefaultRole(tenantId1);
      const result2 = await userDomainService.generateDefaultRole(tenantId2);

      // Assert
      expect(result1).toBe(result2);
      expect(result1).toBe('REGULAR_USER');
    });
  });

  describe('getServiceName', () => {
    it('should return correct service name', () => {
      // Act
      const serviceName = userDomainService.getServiceName();

      // Assert
      expect(serviceName).toBe('UserDomainService');
    });

    it('should return consistent service name', () => {
      // Act
      const serviceName1 = userDomainService.getServiceName();
      const serviceName2 = userDomainService.getServiceName();

      // Assert
      expect(serviceName1).toBe(serviceName2);
      expect(serviceName1).toBe('UserDomainService');
    });
  });

  describe('service lifecycle', () => {
    it('should maintain service state across method calls', async () => {
      // Arrange
      const tenantId = EntityId.generate().toString();
      const email = 'test@example.com';
      const username = 'testuser';
      const password = 'StrongPassword123!';

      // Act
      const emailResult = await userDomainService.isUserEmailUnique(email);
      const usernameResult = await userDomainService.isUsernameUnique(username);
      const passwordResult = userDomainService.validatePasswordStrength(password);
      const roleResult = await userDomainService.generateDefaultRole(tenantId);
      const serviceName = userDomainService.getServiceName();

      // Assert
      expect(emailResult).toBe(true);
      expect(usernameResult).toBe(true);
      expect(passwordResult).toBe(true);
      expect(roleResult).toBe('REGULAR_USER');
      expect(serviceName).toBe('UserDomainService');
    });

    it('should handle concurrent method calls', async () => {
      // Arrange
      const tenantId = EntityId.generate().toString();
      const email = 'concurrent@example.com';
      const username = 'concurrentuser';
      const password = 'ConcurrentPassword123!';

      // Act
      const promises = [
        userDomainService.isUserEmailUnique(email),
        userDomainService.isUsernameUnique(username),
        Promise.resolve(userDomainService.validatePasswordStrength(password)),
        userDomainService.generateDefaultRole(tenantId)
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(4);
      expect(results[0]).toBe(true); // isUserEmailUnique
      expect(results[1]).toBe(true); // isUsernameUnique
      expect(results[2]).toBe(true); // validatePasswordStrength
      expect(results[3]).toBe('REGULAR_USER'); // generateDefaultRole
    });
  });

  describe('error handling', () => {
    it('should handle null and undefined inputs gracefully', async () => {
      // Act & Assert
      await expect(userDomainService.isUserEmailUnique(null as unknown as string)).resolves.toBe(true);
      await expect(userDomainService.isUsernameUnique(null as unknown as string)).resolves.toBe(true);
      expect(userDomainService.validatePasswordStrength(null as unknown as string)).toBe(false);
      await expect(userDomainService.generateDefaultRole(null as unknown as string)).resolves.toBe('REGULAR_USER');
    });

    it('should handle undefined inputs gracefully', async () => {
      // Act & Assert
      await expect(userDomainService.isUserEmailUnique(undefined as unknown as string)).resolves.toBe(true);
      await expect(userDomainService.isUsernameUnique(undefined as unknown as string)).resolves.toBe(true);
      expect(userDomainService.validatePasswordStrength(undefined as unknown as string)).toBe(false);
      await expect(userDomainService.generateDefaultRole(undefined as unknown as string)).resolves.toBe('REGULAR_USER');
    });
  });

  describe('service interface compliance', () => {
    it('should implement all required interface methods', () => {
      // Assert
      expect(typeof userDomainService.isUserEmailUnique).toBe('function');
      expect(typeof userDomainService.isUsernameUnique).toBe('function');
      expect(typeof userDomainService.validatePasswordStrength).toBe('function');
      expect(typeof userDomainService.generateDefaultRole).toBe('function');
      expect(typeof userDomainService.getServiceName).toBe('function');
    });

    it('should have correct method signatures', () => {
      // Assert - Check that methods exist and are functions
      expect(userDomainService.isUserEmailUnique).toBeInstanceOf(Function);
      expect(userDomainService.isUsernameUnique).toBeInstanceOf(Function);
      expect(userDomainService.validatePasswordStrength).toBeInstanceOf(Function);
      expect(userDomainService.generateDefaultRole).toBeInstanceOf(Function);
      expect(userDomainService.getServiceName).toBeInstanceOf(Function);
    });
  });

  describe('business rules', () => {
    it('should support user email uniqueness validation', async () => {
      // Arrange
      const emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

      // Act
      const results = await Promise.all(
        emails.map(email => userDomainService.isUserEmailUnique(email))
      );

      // Assert
      expect(results.every(result => result === true)).toBe(true);
    });

    it('should support username uniqueness validation', async () => {
      // Arrange
      const usernames = ['user1', 'user2', 'user3'];

      // Act
      const results = await Promise.all(
        usernames.map(username => userDomainService.isUsernameUnique(username))
      );

      // Assert
      expect(results.every(result => result === true)).toBe(true);
    });

    it('should support password strength validation', () => {
      // Arrange
      const passwords = [
        'StrongPassword123!',
        'AnotherStrongPassword456@',
        'YetAnotherStrongPassword789#'
      ];

      // Act
      const results = passwords.map(password => 
        userDomainService.validatePasswordStrength(password)
      );

      // Assert
      expect(results.every(result => result === true)).toBe(true);
    });

    it('should support default role generation', async () => {
      // Arrange
      const tenantIds = [
        EntityId.generate().toString(),
        EntityId.generate().toString(),
        EntityId.generate().toString()
      ];

      // Act
      const results = await Promise.all(
        tenantIds.map(tenantId => userDomainService.generateDefaultRole(tenantId))
      );

      // Assert
      expect(results.every(result => result === 'REGULAR_USER')).toBe(true);
    });
  });

  describe('performance', () => {
    it('should handle multiple rapid calls efficiently', async () => {
      // Arrange
      const startTime = Date.now();
      const calls = Array.from({ length: 100 }, (_, index) => 
        userDomainService.isUserEmailUnique(`user${index}@example.com`)
      );

      // Act
      await Promise.all(calls);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle password strength validation efficiently', () => {
      // Arrange
      const startTime = Date.now();
      const passwords = Array.from({ length: 1000 }, (_, index) => 
        `Password${index}123!`
      );

      // Act
      const results = passwords.map(password => 
        userDomainService.validatePasswordStrength(password)
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Assert
      expect(duration).toBeLessThan(100); // Should complete within 100ms
      expect(results.every(result => result === true)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very long inputs', async () => {
      // Arrange
      const veryLongEmail = 'a'.repeat(1000) + '@example.com';
      const veryLongUsername = 'a'.repeat(1000);
      const veryLongPassword = 'a'.repeat(1000);
      const veryLongTenantId = 'a'.repeat(1000);

      // Act
      const emailResult = await userDomainService.isUserEmailUnique(veryLongEmail);
      const usernameResult = await userDomainService.isUsernameUnique(veryLongUsername);
      const passwordResult = userDomainService.validatePasswordStrength(veryLongPassword);
      const roleResult = await userDomainService.generateDefaultRole(veryLongTenantId);

      // Assert
      expect(emailResult).toBe(true);
      expect(usernameResult).toBe(true);
      expect(passwordResult).toBe(true);
      expect(roleResult).toBe('REGULAR_USER');
    });

    it('should handle mixed case inputs', async () => {
      // Arrange
      const mixedCaseEmail = 'User@Example.COM';
      const mixedCaseUsername = 'User_Name-123';

      // Act
      const emailResult = await userDomainService.isUserEmailUnique(mixedCaseEmail);
      const usernameResult = await userDomainService.isUsernameUnique(mixedCaseUsername);

      // Assert
      expect(emailResult).toBe(true);
      expect(usernameResult).toBe(true);
    });
  });
});
