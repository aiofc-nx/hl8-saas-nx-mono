/**
 * 资源限制值对象单元测试
 * 
 * @description 测试资源限制值对象的业务逻辑和验证规则
 * 包括限制创建、验证、检查、更新等功能
 * 
 * @since 1.0.0
 */

import { ResourceLimits, ResourceLimitsProps } from './resource-limits.vo';

describe('ResourceLimits', () => {
  let defaultLimits: ResourceLimitsProps;

  beforeEach(() => {
    defaultLimits = {
      maxUsers: 100,
      maxStorage: 10,
      maxOrganizations: 5,
      maxDepartments: 20,
      maxApiCalls: 10000,
      maxDataTransfer: 50
    };
  });

  describe('create', () => {
    it('should create resource limits with valid data', () => {
      // Act
      const limits = ResourceLimits.create(defaultLimits);

      // Assert
      expect(limits).toBeInstanceOf(ResourceLimits);
      expect(limits.maxUsers).toBe(100);
      expect(limits.maxStorage).toBe(10);
      expect(limits.maxOrganizations).toBe(5);
      expect(limits.maxDepartments).toBe(20);
      expect(limits.maxApiCalls).toBe(10000);
      expect(limits.maxDataTransfer).toBe(50);
    });

    it('should create resource limits with unlimited values', () => {
      // Arrange
      const unlimitedProps: ResourceLimitsProps = {
        maxUsers: -1,
        maxStorage: -1,
        maxOrganizations: -1,
        maxDepartments: -1,
        maxApiCalls: -1,
        maxDataTransfer: -1
      };

      // Act
      const limits = ResourceLimits.create(unlimitedProps);

      // Assert
      expect(limits).toBeInstanceOf(ResourceLimits);
      expect(limits.maxUsers).toBe(-1);
      expect(limits.maxStorage).toBe(-1);
      expect(limits.maxOrganizations).toBe(-1);
      expect(limits.maxDepartments).toBe(-1);
      expect(limits.maxApiCalls).toBe(-1);
      expect(limits.maxDataTransfer).toBe(-1);
    });

    it('should create resource limits with zero values', () => {
      // Arrange
      const zeroProps: ResourceLimitsProps = {
        maxUsers: 0,
        maxStorage: 0,
        maxOrganizations: 0,
        maxDepartments: 0,
        maxApiCalls: 0,
        maxDataTransfer: 0
      };

      // Act
      const limits = ResourceLimits.create(zeroProps);

      // Assert
      expect(limits).toBeInstanceOf(ResourceLimits);
      expect(limits.maxUsers).toBe(0);
      expect(limits.maxStorage).toBe(0);
      expect(limits.maxOrganizations).toBe(0);
      expect(limits.maxDepartments).toBe(0);
      expect(limits.maxApiCalls).toBe(0);
      expect(limits.maxDataTransfer).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate valid resource limits', () => {
      // Act
      const isValid = ResourceLimits.validate(defaultLimits);

      // Assert
      expect(isValid).toBe(true);
    });

    it('should reject negative values except -1', () => {
      // Arrange
      const invalidLimits = {
        ...defaultLimits,
        maxUsers: -5
      };

      // Act & Assert
      expect(() => ResourceLimits.validate(invalidLimits))
        .toThrow('资源限制值不能为负数（除了-1表示无限制）: maxUsers = -5');
    });

    it('should reject invalid resource type', () => {
      // Arrange
      const invalidLimits = {
        ...defaultLimits,
        invalidResource: 100
      };

      // Act & Assert
      expect(() => ResourceLimits.validate(invalidLimits as unknown as ResourceLimitsProps))
        .toThrow('无效的资源类型: invalidResource');
    });

    it('should validate all required resources are present', () => {
      // Arrange
      const incompleteLimits = {
        maxUsers: 100,
        maxStorage: 10
        // 缺少其他必需资源
      };

      // Act & Assert
      expect(() => ResourceLimits.validate(incompleteLimits as unknown as ResourceLimitsProps))
        .toThrow('缺少必需的资源限制: maxOrganizations, maxDepartments, maxApiCalls, maxDataTransfer');
    });
  });

  describe('limit checking', () => {
    let limits: ResourceLimits;

    beforeEach(() => {
      limits = ResourceLimits.create(defaultLimits);
    });

    it('should check if resource has limit', () => {
      // Act & Assert
      expect(limits.hasLimit('maxUsers')).toBe(true);
      expect(limits.hasLimit('maxStorage')).toBe(true);
      expect(limits.hasLimit('maxOrganizations')).toBe(true);
    });

    it('should return false for unlimited resources', () => {
      // Arrange
      const unlimitedLimits = ResourceLimits.create({
        maxUsers: -1,
        maxStorage: 10,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 10000,
        maxDataTransfer: 50
      });

      // Act & Assert
      expect(unlimitedLimits.hasLimit('maxUsers')).toBe(false);
      expect(unlimitedLimits.hasLimit('maxStorage')).toBe(true);
    });

    it('should check if resource usage is exceeded', () => {
      // Act & Assert
      expect(limits.isExceeded('maxUsers', 50)).toBe(false);
      expect(limits.isExceeded('maxUsers', 100)).toBe(true);
      expect(limits.isExceeded('maxUsers', 150)).toBe(true);
    });

    it('should never exceed unlimited resources', () => {
      // Arrange
      const unlimitedLimits = ResourceLimits.create({
        maxUsers: -1,
        maxStorage: 10,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 10000,
        maxDataTransfer: 50
      });

      // Act & Assert
      expect(unlimitedLimits.isExceeded('maxUsers', 999999)).toBe(false);
      expect(unlimitedLimits.isExceeded('maxUsers', 0)).toBe(false);
    });

    it('should check remaining capacity', () => {
      // Act & Assert
      expect(limits.getRemainingCapacity('maxUsers', 30)).toBe(70);
      expect(limits.getRemainingCapacity('maxUsers', 100)).toBe(0);
      expect(limits.getRemainingCapacity('maxUsers', 150)).toBe(-50);
    });

    it('should return unlimited capacity for unlimited resources', () => {
      // Arrange
      const unlimitedLimits = ResourceLimits.create({
        maxUsers: -1,
        maxStorage: 10,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 10000,
        maxDataTransfer: 50
      });

      // Act & Assert
      expect(unlimitedLimits.getRemainingCapacity('maxUsers', 999999)).toBe(-1);
    });

    it('should calculate usage percentage', () => {
      // Act & Assert
      expect(limits.getUsagePercentage('maxUsers', 50)).toBe(50);
      expect(limits.getUsagePercentage('maxUsers', 100)).toBe(100);
      expect(limits.getUsagePercentage('maxUsers', 150)).toBe(150);
    });

    it('should return 0 for unlimited resources usage percentage', () => {
      // Arrange
      const unlimitedLimits = ResourceLimits.create({
        maxUsers: -1,
        maxStorage: 10,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 10000,
        maxDataTransfer: 50
      });

      // Act & Assert
      expect(unlimitedLimits.getUsagePercentage('maxUsers', 999999)).toBe(0);
    });
  });

  describe('update operations', () => {
    let limits: ResourceLimits;

    beforeEach(() => {
      limits = ResourceLimits.create(defaultLimits);
    });

    it('should update specific resource limit', () => {
      // Act
      const updatedLimits = limits.updateLimit('maxUsers', 200);

      // Assert
      expect(updatedLimits).not.toBe(limits);
      expect(updatedLimits.maxUsers).toBe(200);
      expect(updatedLimits.maxStorage).toBe(10); // 其他值保持不变
    });

    it('should update multiple resource limits', () => {
      // Act
      const updatedLimits = limits.updateLimits({
        maxUsers: 200,
        maxStorage: 20,
        maxOrganizations: 10
      });

      // Assert
      expect(updatedLimits).not.toBe(limits);
      expect(updatedLimits.maxUsers).toBe(200);
      expect(updatedLimits.maxStorage).toBe(20);
      expect(updatedLimits.maxOrganizations).toBe(10);
      expect(updatedLimits.maxDepartments).toBe(20); // 未更新的值保持不变
    });

    it('should set resource as unlimited', () => {
      // Act
      const updatedLimits = limits.setUnlimited('maxUsers');

      // Assert
      expect(updatedLimits).not.toBe(limits);
      expect(updatedLimits.maxUsers).toBe(-1);
      expect(updatedLimits.hasLimit('maxUsers')).toBe(false);
    });

    it('should set multiple resources as unlimited', () => {
      // Act
      const updatedLimits = limits.setUnlimited(['maxUsers', 'maxStorage']);

      // Assert
      expect(updatedLimits).not.toBe(limits);
      expect(updatedLimits.maxUsers).toBe(-1);
      expect(updatedLimits.maxStorage).toBe(-1);
      expect(updatedLimits.hasLimit('maxUsers')).toBe(false);
      expect(updatedLimits.hasLimit('maxStorage')).toBe(false);
    });

    it('should set resource as limited', () => {
      // Arrange
      const unlimitedLimits = ResourceLimits.create({
        maxUsers: -1,
        maxStorage: 10,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 10000,
        maxDataTransfer: 50
      });

      // Act
      const updatedLimits = unlimitedLimits.setLimited('maxUsers', 100);

      // Assert
      expect(updatedLimits).not.toBe(unlimitedLimits);
      expect(updatedLimits.maxUsers).toBe(100);
      expect(updatedLimits.hasLimit('maxUsers')).toBe(true);
    });
  });

  describe('utility methods', () => {
    let limits: ResourceLimits;

    beforeEach(() => {
      limits = ResourceLimits.create(defaultLimits);
    });

    it('should clone resource limits', () => {
      // Act
      const clonedLimits = limits.clone();

      // Assert
      expect(clonedLimits).not.toBe(limits);
      expect(clonedLimits).toBeInstanceOf(ResourceLimits);
      expect(clonedLimits.maxUsers).toBe(limits.maxUsers);
      expect(clonedLimits.maxStorage).toBe(limits.maxStorage);
      expect(clonedLimits.maxOrganizations).toBe(limits.maxOrganizations);
      expect(clonedLimits.maxDepartments).toBe(limits.maxDepartments);
      expect(clonedLimits.maxApiCalls).toBe(limits.maxApiCalls);
      expect(clonedLimits.maxDataTransfer).toBe(limits.maxDataTransfer);
    });

    it('should merge with another resource limits', () => {
      // Arrange
      const otherLimits = ResourceLimits.create({
        maxUsers: 200,
        maxStorage: 20,
        maxOrganizations: 10,
        maxDepartments: 40,
        maxApiCalls: 20000,
        maxDataTransfer: 100
      });

      // Act
      const mergedLimits = limits.merge(otherLimits);

      // Assert
      expect(mergedLimits).not.toBe(limits);
      expect(mergedLimits).not.toBe(otherLimits);
      expect(mergedLimits.maxUsers).toBe(200);
      expect(mergedLimits.maxStorage).toBe(20);
      expect(mergedLimits.maxOrganizations).toBe(10);
      expect(mergedLimits.maxDepartments).toBe(40);
      expect(mergedLimits.maxApiCalls).toBe(20000);
      expect(mergedLimits.maxDataTransfer).toBe(100);
    });

    it('should convert to JSON', () => {
      // Act
      const json = limits.toJSON();

      // Assert
      expect(json).toEqual({
        maxUsers: 100,
        maxStorage: 10,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 10000,
        maxDataTransfer: 50
      });
    });

    it('should create from JSON', () => {
      // Arrange
      const jsonData = {
        maxUsers: 150,
        maxStorage: 15,
        maxOrganizations: 8,
        maxDepartments: 30,
        maxApiCalls: 15000,
        maxDataTransfer: 75
      };

      // Act
      const limitsFromJson = ResourceLimits.fromJSON(jsonData);

      // Assert
      expect(limitsFromJson).toBeInstanceOf(ResourceLimits);
      expect(limitsFromJson.maxUsers).toBe(150);
      expect(limitsFromJson.maxStorage).toBe(15);
      expect(limitsFromJson.maxOrganizations).toBe(8);
      expect(limitsFromJson.maxDepartments).toBe(30);
      expect(limitsFromJson.maxApiCalls).toBe(15000);
      expect(limitsFromJson.maxDataTransfer).toBe(75);
    });
  });

  describe('factory methods', () => {
    it('should create unlimited limits', () => {
      // Act
      const unlimitedLimits = ResourceLimits.createUnlimited();

      // Assert
      expect(unlimitedLimits).toBeInstanceOf(ResourceLimits);
      expect(unlimitedLimits.maxUsers).toBe(-1);
      expect(unlimitedLimits.maxStorage).toBe(-1);
      expect(unlimitedLimits.maxOrganizations).toBe(-1);
      expect(unlimitedLimits.maxDepartments).toBe(-1);
      expect(unlimitedLimits.maxApiCalls).toBe(-1);
      expect(unlimitedLimits.maxDataTransfer).toBe(-1);
    });

    it('should create limited limits', () => {
      // Act
      const limitedLimits = ResourceLimits.createLimited();

      // Assert
      expect(limitedLimits).toBeInstanceOf(ResourceLimits);
      expect(limitedLimits.maxUsers).toBe(0);
      expect(limitedLimits.maxStorage).toBe(0);
      expect(limitedLimits.maxOrganizations).toBe(0);
      expect(limitedLimits.maxDepartments).toBe(0);
      expect(limitedLimits.maxApiCalls).toBe(0);
      expect(limitedLimits.maxDataTransfer).toBe(0);
    });

    it('should create default limits', () => {
      // Act
      const defaultLimits = ResourceLimits.createDefault();

      // Assert
      expect(defaultLimits).toBeInstanceOf(ResourceLimits);
      expect(defaultLimits.maxUsers).toBe(10);
      expect(defaultLimits.maxStorage).toBe(1);
      expect(defaultLimits.maxOrganizations).toBe(1);
      expect(defaultLimits.maxDepartments).toBe(5);
      expect(defaultLimits.maxApiCalls).toBe(1000);
      expect(defaultLimits.maxDataTransfer).toBe(5);
    });
  });

  describe('immutability', () => {
    it('should maintain immutability when updating', () => {
      // Arrange
      const originalLimits = ResourceLimits.create(defaultLimits);

      // Act
      const updatedLimits = originalLimits.updateLimit('maxUsers', 200);

      // Assert
      expect(updatedLimits).not.toBe(originalLimits);
      expect(originalLimits.maxUsers).toBe(100);
      expect(updatedLimits.maxUsers).toBe(200);
    });

    it('should maintain immutability when merging', () => {
      // Arrange
      const originalLimits = ResourceLimits.create(defaultLimits);
      const otherLimits = ResourceLimits.create({
        ...defaultLimits,
        maxUsers: 200
      });

      // Act
      const mergedLimits = originalLimits.merge(otherLimits);

      // Assert
      expect(mergedLimits).not.toBe(originalLimits);
      expect(mergedLimits).not.toBe(otherLimits);
      expect(originalLimits.maxUsers).toBe(100);
      expect(mergedLimits.maxUsers).toBe(200);
    });
  });

  describe('equality', () => {
    it('should be equal to limits with same values', () => {
      // Arrange
      const limits1 = ResourceLimits.create(defaultLimits);
      const limits2 = ResourceLimits.create(defaultLimits);

      // Act & Assert
      expect(limits1.equals(limits2)).toBe(true);
    });

    it('should not be equal to limits with different values', () => {
      // Arrange
      const limits1 = ResourceLimits.create(defaultLimits);
      const limits2 = ResourceLimits.create({
        ...defaultLimits,
        maxUsers: 200
      });

      // Act & Assert
      expect(limits1.equals(limits2)).toBe(false);
    });

    it('should not be equal to different object type', () => {
      // Arrange
      const limits = ResourceLimits.create(defaultLimits);
      const otherObject = { maxUsers: 100 };

      // Act & Assert
      expect(limits.equals(otherObject as unknown)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should throw error when creating with invalid values', () => {
      // Arrange
      const invalidLimits = {
        ...defaultLimits,
        maxUsers: -5
      };

      // Act & Assert
      expect(() => ResourceLimits.create(invalidLimits))
        .toThrow('资源限制值不能为负数（除了-1表示无限制）: maxUsers = -5');
    });

    it('should throw error when updating with invalid value', () => {
      // Arrange
      const limits = ResourceLimits.create(defaultLimits);

      // Act & Assert
      expect(() => limits.updateLimit('maxUsers', -5))
        .toThrow('资源限制值不能为负数（除了-1表示无限制）: maxUsers = -5');
    });

    it('should throw error when checking invalid resource type', () => {
      // Arrange
      const limits = ResourceLimits.create(defaultLimits);

      // Act & Assert
      expect(() => limits.hasLimit('invalidResource' as never))
        .toThrow('无效的资源类型: invalidResource');
    });

    it('should throw error when checking exceeded with invalid resource type', () => {
      // Arrange
      const limits = ResourceLimits.create(defaultLimits);

      // Act & Assert
      expect(() => limits.isExceeded('invalidResource' as never, 100))
        .toThrow('无效的资源类型: invalidResource');
    });
  });
});
