/**
 * 用户ID值对象单元测试
 * 
 * @description 测试用户ID值对象的创建、验证和比较逻辑
 * 
 * @since 1.0.0
 */

import { UserId, InvalidUserIdException } from './user-id.vo';

describe('UserId', () => {
  describe('构造函数', () => {
    it('should create UserId with valid UUID format', () => {
      // Arrange
      const validUuid = '123e4567-e89b-4d3a-a456-426614174000';

      // Act
      const userId = new UserId(validUuid);

      // Assert
      expect(userId.value).toBe(validUuid);
    });

    it('should throw exception for invalid UUID format', () => {
      // Arrange
      const invalidUuid = 'invalid-uuid';

      // Act & Assert
      expect(() => new UserId(invalidUuid)).toThrow(InvalidUserIdException);
    });

    it('should throw exception for non-UUID v4 format', () => {
      // Arrange
      const invalidUuid = '123e4567-e89b-1d3a-a456-426614174000'; // 不是v4格式（第13位不是4）

      // Act & Assert
      expect(() => new UserId(invalidUuid)).toThrow(InvalidUserIdException);
    });

    it('should throw exception for empty string', () => {
      // Arrange
      const emptyString = '';

      // Act & Assert
      expect(() => new UserId(emptyString)).toThrow(InvalidUserIdException);
    });
  });

  describe('generate', () => {
    it('should generate valid UserId', () => {
      // Act
      const userId = UserId.generate();

      // Assert
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UserIds', () => {
      // Act
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();

      // Assert
      expect(userId1.value).not.toBe(userId2.value);
    });
  });

  describe('create', () => {
    it('should create UserId from valid UUID string', () => {
      // Arrange
      const validUuid = '123e4567-e89b-4d3a-a456-426614174000';

      // Act
      const userId = UserId.create(validUuid);

      // Assert
      expect(userId.value).toBe(validUuid);
    });

    it('should throw exception for invalid UUID string', () => {
      // Arrange
      const invalidUuid = 'not-a-uuid';

      // Act & Assert
      expect(() => UserId.create(invalidUuid)).toThrow(InvalidUserIdException);
    });
  });

  describe('equals', () => {
    it('should return true for equal UserIds', () => {
      // Arrange
      const userId1 = UserId.create('123e4567-e89b-4d3a-a456-426614174000');
      const userId2 = UserId.create('123e4567-e89b-4d3a-a456-426614174000');

      // Act & Assert
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for different UserIds', () => {
      // Arrange
      const userId1 = UserId.generate();
      const userId2 = UserId.generate();

      // Act & Assert
      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return string representation', () => {
      // Arrange
      const userId = UserId.create('123e4567-e89b-4d3a-a456-426614174000');

      // Act & Assert
      expect(userId.toString()).toBe('123e4567-e89b-4d3a-a456-426614174000');
    });
  });

  describe('getEntityId', () => {
    it('should return EntityId instance', () => {
      // Arrange
      const userId = UserId.create('123e4567-e89b-4d3a-a456-426614174000');

      // Act
      const entityId = userId.getEntityId();

      // Assert
      expect(entityId).toBeDefined();
      expect(entityId.toString()).toBe('123e4567-e89b-4d3a-a456-426614174000');
    });
  });

  describe('valid UUID v4 examples', () => {
    const validUuids = [
      '123e4567-e89b-4d3a-a456-426614174000',
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-4d1a-80b4-00c04fd430c8',
      '6ba7b811-9dad-4d1a-80b4-00c04fd430c8'
    ];

    validUuids.forEach(uuid => {
      it(`should accept valid UUID v4: ${uuid}`, () => {
        // Act & Assert
        expect(() => UserId.create(uuid)).not.toThrow();
        const userId = UserId.create(uuid);
        expect(userId.value).toBe(uuid);
      });
    });
  });

  describe('invalid UUID examples', () => {
    const invalidUuids = [
      'invalid-uuid',
      '123e4567-e89b-12d3-a456-42661417400', // 太短
      '123e4567-e89b-4d3a-a456-4266141740000', // 太长
      '123e4567-e89b-12d3-a456-42661417400g', // 无效字符
      '123e4567-e89b-12d3-a456', // 不完整
      'not-a-uuid-at-all',
      '',
      '123'
    ];

    invalidUuids.forEach(uuid => {
      it(`should reject invalid UUID: "${uuid}"`, () => {
        // Act & Assert
        expect(() => UserId.create(uuid)).toThrow(InvalidUserIdException);
      });
    });
  });
});
