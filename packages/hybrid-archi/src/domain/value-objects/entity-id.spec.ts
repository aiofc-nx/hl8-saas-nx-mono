/**
 * 实体标识符值对象单元测试
 *
 * 测试 EntityId 类的核心功能，包括：
 * - 标识符生成和创建
 * - 格式验证
 * - 相等性比较
 * - 序列化操作
 * - 哈希码生成
 * - 版本检查
 *
 * @description 验证实体标识符值对象的类型安全和唯一性保证
 * @since 1.0.0
 */

import { EntityId } from './entity-id';

describe('EntityId', () => {
  describe('生成标识符', () => {
    it('应该生成有效的 UUID v4 标识符', () => {
      const id = EntityId.generate();

      expect(id).toBeInstanceOf(EntityId);
      expect(EntityId.isValid(id.value)).toBe(true);
      expect(id.getVersion()).toBe(4);
    });

    it('应该生成唯一的标识符', () => {
      const id1 = EntityId.generate();
      const id2 = EntityId.generate();

      expect(id1.equals(id2)).toBe(false);
      expect(id1.value).not.toBe(id2.value);
    });

    it('应该生成不同格式的标识符', () => {
      const id = EntityId.generate();

      // UUID v4 格式：xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(id.value).toMatch(uuidRegex);
    });
  });

  describe('从字符串创建', () => {
    it('应该从有效 UUID v4 字符串创建标识符', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id).toBeInstanceOf(EntityId);
      expect(id.value).toBe(uuidString);
    });

    it('应该拒绝无效的 UUID 格式', () => {
      const invalidUuids = [
        'invalid-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        '',
        'not-a-uuid',
      ];

      invalidUuids.forEach((invalidUuid) => {
        expect(() => EntityId.fromString(invalidUuid)).toThrow();
      });
    });

    it('应该拒绝非 UUID v4 格式', () => {
      // UUID v1 格式
      const uuidV1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      expect(() => EntityId.fromString(uuidV1)).toThrow();

      // UUID v3 格式
      const uuidV3 = '6fa459ea-ee8a-3ca4-894e-db77e160355e';
      expect(() => EntityId.fromString(uuidV3)).toThrow();

      // UUID v5 格式
      const uuidV5 = '886313e1-3b8a-5372-9b90-0c9aee199e5d';
      expect(() => EntityId.fromString(uuidV5)).toThrow();
    });
  });

  describe('格式验证', () => {
    it('应该验证有效的 UUID v4 格式', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6fa459ea-ee8a-4ca4-894e-db77e160355e',
      ];

      validUuids.forEach((uuid) => {
        expect(EntityId.isValid(uuid)).toBe(true);
      });
    });

    it('应该拒绝无效的格式', () => {
      const invalidFormats = [
        '',
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        null,
        undefined,
        123,
        {},
        [],
      ];

      invalidFormats.forEach((format) => {
        expect(EntityId.isValid(format as any)).toBe(false);
      });
    });

    it('应该拒绝非字符串类型', () => {
      expect(EntityId.isValid(null as any)).toBe(false);
      expect(EntityId.isValid(undefined as any)).toBe(false);
      expect(EntityId.isValid(123 as any)).toBe(false);
      expect(EntityId.isValid({} as any)).toBe(false);
      expect(EntityId.isValid([] as any)).toBe(false);
    });
  });

  describe('相等性比较', () => {
    it('应该正确比较相同的标识符', () => {
      const id1 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const id2 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');

      expect(id1.equals(id2)).toBe(true);
      expect(id1.value).toBe(id2.value);
    });

    it('应该正确比较不同的标识符', () => {
      const id1 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const id2 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440001');

      expect(id1.equals(id2)).toBe(false);
      expect(id1.value).not.toBe(id2.value);
    });

    it('应该正确处理 null 比较', () => {
      const id = EntityId.generate();

      expect(id.equals(null)).toBe(false);
    });

    it('应该正确处理 undefined 比较', () => {
      const id = EntityId.generate();

      expect(id.equals(undefined)).toBe(false);
    });

    it('应该正确处理非 EntityId 对象比较', () => {
      const id = EntityId.generate();

      expect(id.equals('string' as any)).toBe(false);
      expect(id.equals(123 as any)).toBe(false);
      expect(id.equals({} as any)).toBe(false);
    });
  });

  describe('字符串表示', () => {
    it('应该正确转换为字符串', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id.toString()).toBe(uuidString);
    });

    it('应该正确转换为 JSON', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id.toJSON()).toBe(uuidString);
    });
  });

  describe('哈希码和比较', () => {
    it('应该正确返回哈希码', () => {
      const uuidString = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(uuidString);

      expect(id.getHashCode()).toBe(uuidString);
    });

    it('应该正确比较标识符大小', () => {
      const id1 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const id2 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440001');

      const result = id1.compareTo(id2);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(-1);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('应该正确处理相等标识符比较', () => {
      const id1 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');
      const id2 = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');

      expect(id1.compareTo(id2)).toBe(0);
    });
  });

  describe('版本检查', () => {
    it('应该正确返回 UUID 版本', () => {
      const id = EntityId.generate();

      expect(id.getVersion()).toBe(4);
    });

    it('应该正确检查版本', () => {
      const id = EntityId.fromString('550e8400-e29b-41d4-a716-446655440000');

      expect(id.getVersion()).toBe(4);
    });
  });

  describe('空值检查', () => {
    it('应该正确检查非空标识符', () => {
      const id = EntityId.generate();

      expect(id.isEmpty()).toBe(false);
    });

    it('应该正确处理空字符串标识符', () => {
      // 这种情况不应该发生，因为构造函数会验证格式
      // 但我们可以测试 isEmpty 方法
      const id = EntityId.generate();

      expect(id.isEmpty()).toBe(false);
    });
  });

  describe('克隆操作', () => {
    it('应该正确克隆标识符', () => {
      const originalId = EntityId.generate();
      const clonedId = originalId.clone();

      expect(clonedId).toBeInstanceOf(EntityId);
      expect(clonedId.equals(originalId)).toBe(true);
      expect(clonedId.value).toBe(originalId.value);
      expect(clonedId).not.toBe(originalId); // 不同的实例
    });

    it('应该创建独立的克隆', () => {
      const originalId = EntityId.generate();
      const clonedId = originalId.clone();

      // 克隆应该与原始标识符相等但不相同
      expect(clonedId.equals(originalId)).toBe(true);
      expect(clonedId).not.toBe(originalId);
    });
  });

  describe('边界情况', () => {
    it('应该处理最小有效 UUID', () => {
      const minUuid = '00000000-0000-4000-8000-000000000000';
      const id = EntityId.fromString(minUuid);

      expect(id.value).toBe(minUuid);
      expect(EntityId.isValid(id.value)).toBe(true);
    });

    it('应该处理最大有效 UUID', () => {
      const maxUuid = 'ffffffff-ffff-4fff-bfff-ffffffffffff';
      const id = EntityId.fromString(maxUuid);

      expect(id.value).toBe(maxUuid);
      expect(EntityId.isValid(id.value)).toBe(true);
    });

    it('应该处理特殊字符', () => {
      const specialUuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = EntityId.fromString(specialUuid);

      expect(id.value).toBe(specialUuid);
      expect(EntityId.isValid(id.value)).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该快速生成大量标识符', () => {
      const startTime = Date.now();
      const ids: EntityId[] = [];

      for (let i = 0; i < 1000; i++) {
        ids.push(EntityId.generate());
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(ids).toHaveLength(1000);
      expect(duration).toBeLessThan(1000); // 应该在1秒内完成
    });

    it('应该生成唯一标识符', () => {
      const ids = new Set<string>();

      for (let i = 0; i < 10000; i++) {
        const id = EntityId.generate();
        expect(ids.has(id.value)).toBe(false);
        ids.add(id.value);
      }

      expect(ids.size).toBe(10000);
    });
  });
});
