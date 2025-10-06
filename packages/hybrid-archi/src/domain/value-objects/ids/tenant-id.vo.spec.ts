/**
 * 租户ID值对象单元测试
 * 
 * @description 测试租户ID值对象的创建、验证和比较逻辑
 * 
 * @since 1.0.0
 */

import { TenantId, InvalidTenantIdException } from './tenant-id.vo';

describe('TenantId', () => {
  describe('构造函数', () => {
    it('should create TenantId with valid format', () => {
      // Arrange
      const validId = 'my-tenant-123';

      // Act
      const tenantId = new TenantId(validId);

      // Assert
      expect(tenantId.value).toBe(validId);
    });

    it('should throw exception for invalid format - too short', () => {
      // Arrange
      const invalidId = 'ab'; // 少于3个字符

      // Act & Assert
      expect(() => new TenantId(invalidId)).toThrow(InvalidTenantIdException);
    });

    it('should throw exception for invalid format - too long', () => {
      // Arrange
      const invalidId = 'a'.repeat(21); // 超过20个字符

      // Act & Assert
      expect(() => new TenantId(invalidId)).toThrow(InvalidTenantIdException);
    });

    it('should throw exception for invalid format - starts with number', () => {
      // Arrange
      const invalidId = '123-tenant';

      // Act & Assert
      expect(() => new TenantId(invalidId)).toThrow(InvalidTenantIdException);
    });

    it('should throw exception for invalid format - contains invalid characters', () => {
      // Arrange
      const invalidId = 'my@tenant';

      // Act & Assert
      expect(() => new TenantId(invalidId)).toThrow(InvalidTenantIdException);
    });
  });

  describe('generate', () => {
    it('should generate valid TenantId', () => {
      // Act
      const tenantId = TenantId.generate();

      // Assert
      expect(tenantId).toBeInstanceOf(TenantId);
      expect(tenantId.value).toMatch(/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/);
    });

    it('should generate unique TenantIds', () => {
      // Act
      const tenantId1 = TenantId.generate();
      const tenantId2 = TenantId.generate();

      // Assert
      expect(tenantId1.value).not.toBe(tenantId2.value);
    });
  });

  describe('create', () => {
    it('should create TenantId from valid string', () => {
      // Arrange
      const validId = 'test-tenant_123';

      // Act
      const tenantId = TenantId.create(validId);

      // Assert
      expect(tenantId.value).toBe(validId);
    });

    it('should throw exception for invalid string', () => {
      // Arrange
      const invalidId = 'invalid@tenant';

      // Act & Assert
      expect(() => TenantId.create(invalidId)).toThrow(InvalidTenantIdException);
    });
  });

  describe('equals', () => {
    it('should return true for equal TenantIds', () => {
      // Arrange
      const tenantId1 = TenantId.create('same-tenant');
      const tenantId2 = TenantId.create('same-tenant');

      // Act & Assert
      expect(tenantId1.equals(tenantId2)).toBe(true);
    });

    it('should return false for different TenantIds', () => {
      // Arrange
      const tenantId1 = TenantId.create('tenant-1');
      const tenantId2 = TenantId.create('tenant-2');

      // Act & Assert
      expect(tenantId1.equals(tenantId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const tenantId = TenantId.create('test-tenant');

      // Act & Assert
      expect(tenantId.toString()).toBe('test-tenant');
    });
  });

  describe('getEntityId', () => {
    it('should return EntityId instance', () => {
      // Arrange
      const tenantId = TenantId.create('test-tenant');

      // Act
      const entityId = tenantId.getEntityId();

      // Assert
      expect(entityId).toBeDefined();
      expect(entityId.toString()).toBe('test-tenant');
    });
  });

  describe('valid format examples', () => {
    const validFormats = [
      'abc',
      'my-tenant',
      'tenant_123',
      'my-tenant_123',
      'CompanyName',
      'company-name-2024',
      'tenant_123_abc',
      'a'.repeat(20) // 最大长度
    ];

    validFormats.forEach(format => {
      it(`should accept valid format: ${format}`, () => {
        // Act & Assert
        expect(() => TenantId.create(format)).not.toThrow();
        const tenantId = TenantId.create(format);
        expect(tenantId.value).toBe(format);
      });
    });
  });

  describe('invalid format examples', () => {
    const invalidFormats = [
      'ab', // 太短
      '123-tenant', // 数字开头
      'my@tenant', // 无效字符
      'my tenant', // 空格
      'my.tenant', // 点号
      'my/tenant', // 斜杠
      'my+tenant', // 加号
      'a'.repeat(21), // 太长
      '', // 空字符串
      'a', // 单字符
      'ab' // 两字符
    ];

    invalidFormats.forEach(format => {
      it(`should reject invalid format: "${format}"`, () => {
        // Act & Assert
        expect(() => TenantId.create(format)).toThrow(InvalidTenantIdException);
      });
    });
  });
});
