/**
 * 租户ID值对象单元测试
 * 
 * @description 测试租户ID值对象的创建、验证和比较逻辑
 * 
 * @since 1.0.0
 */

import { TenantId, InvalidTenantIdException } from './tenant-id.vo';
import { EntityId } from '../entity-id';

describe('TenantId', () => {
  describe('构造函数', () => {
    it('should create TenantId with valid format', () => {
      // Arrange
      const validId = '123e4567-e89b-4d3a-a456-426614174000';

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
      expect(tenantId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
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
      const validId = '123e4567-e89b-4d3a-a456-426614174000';

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
      const tenantId1 = TenantId.create('123e4567-e89b-4d3a-a456-426614174000');
      const tenantId2 = TenantId.create('123e4567-e89b-4d3a-a456-426614174000');

      // Act & Assert
      expect(tenantId1.equals(tenantId2)).toBe(true);
    });

    it('should return false for different TenantIds', () => {
      // Arrange
      const tenantId1 = TenantId.create('123e4567-e89b-4d3a-a456-426614174000');
      const tenantId2 = TenantId.create('987fcdeb-51a2-4c3d-8e9f-123456789abc');

      // Act & Assert
      expect(tenantId1.equals(tenantId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const tenantId = TenantId.create('123e4567-e89b-4d3a-a456-426614174000');

      // Act & Assert
      expect(tenantId.toString()).toBe('123e4567-e89b-4d3a-a456-426614174000');
    });
  });

  describe('getEntityId', () => {
    it('should return EntityId instance', () => {
      // Arrange
      const tenantId = TenantId.create('123e4567-e89b-4d3a-a456-426614174000');

      // Act
      const entityId = tenantId.getEntityId();

      // Assert
      expect(entityId).toBeDefined();
      expect(entityId).toBeInstanceOf(EntityId);
    });
  });

  describe('valid UUID v4 examples', () => {
    const validUuids = [
      '123e4567-e89b-4d3a-a456-426614174000',
      '987fcdeb-51a2-4c3d-8e9f-123456789abc',
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-4d1a-80b4-00c04fd430c8',
      '6ba7b811-9dad-4d1a-80b4-00c04fd430c8'
    ];

    validUuids.forEach(uuid => {
      it(`should accept valid UUID v4: ${uuid}`, () => {
        // Act & Assert
        expect(() => TenantId.create(uuid)).not.toThrow();
        const tenantId = TenantId.create(uuid);
        expect(tenantId.value).toBe(uuid);
      });
    });
  });

  describe('invalid UUID format examples', () => {
    const invalidUuids = [
      '123e4567-e89b-12d3-a456-426614174000', // 无效的UUID版本（不是v4）
      '123e4567-e89b-4d3a-a456-42661417400', // 太短
      '123e4567-e89b-4d3a-a456-4266141740000', // 太长
      '123e4567-e89b-4d3a-a456-42661417400g', // 无效字符
      '123e4567-e89b-4d3a-a456-42661417400-', // 无效字符
      '123e4567-e89b-4d3a-a456-42661417400 ', // 空格
      '123e4567-e89b-4d3a-a456-42661417400.', // 点号
      '', // 空字符串
      'not-a-uuid', // 完全不是UUID
      '123e4567-e89b-4d3a-a456' // 不完整的UUID
    ];

    invalidUuids.forEach(uuid => {
      it(`should reject invalid UUID: "${uuid}"`, () => {
        // Act & Assert
        expect(() => TenantId.create(uuid)).toThrow();
      });
    });
  });
});
