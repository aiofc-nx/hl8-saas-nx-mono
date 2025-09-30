/**
 * 序列化工具测试
 *
 * @description 测试序列化工具的基本功能
 *
 * @since 1.0.0
 */

import {
  JsonSerializer,
  SafeJsonSerializer,
  SerializerUtils,
} from './serializer.util';

describe('Serializer Utils', () => {
  describe('JsonSerializer', () => {
    const serializer = new JsonSerializer();

    it('should be defined', () => {
      expect(serializer).toBeDefined();
    });

    it('should serialize objects to JSON strings', () => {
      const obj = { id: 1, name: 'test' };
      const result = serializer.serialize(obj);

      expect(typeof result).toBe('string');
      expect(result).toContain('"id":1');
      expect(result).toContain('"name":"test"');
    });

    it('should deserialize JSON strings to objects', () => {
      const jsonString = '{"id":1,"name":"test"}';
      const result = serializer.deserialize(jsonString);

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should handle null values', () => {
      const obj = { value: null };
      const serialized = serializer.serialize(obj);
      const deserialized = serializer.deserialize(serialized);

      expect(deserialized).toEqual(obj);
    });
  });

  describe('SafeJsonSerializer', () => {
    const serializer = new SafeJsonSerializer();

    it('should be defined', () => {
      expect(serializer).toBeDefined();
    });

    it('should serialize objects to JSON strings safely', () => {
      const obj = { id: 1, name: 'test' };
      const result = serializer.serialize(obj);

      expect(typeof result).toBe('string');
      expect(result).toContain('"id":1');
    });

    it('should deserialize JSON strings to objects safely', () => {
      const jsonString = '{"id":1,"name":"test"}';
      const result = serializer.deserialize(jsonString);

      expect(result).toEqual({ id: 1, name: 'test' });
    });

    it('should throw error for invalid JSON during deserialization', () => {
      const invalidJson = '{ invalid json }';

      expect(() => serializer.deserialize(invalidJson)).toThrow(
        '安全JSON反序列化失败'
      );
    });

    it('should throw error for undefined input', () => {
      expect(() => serializer.deserialize(undefined as any)).toThrow(
        '安全JSON反序列化失败'
      );
    });

    it('should handle null input', () => {
      const result = serializer.deserialize('null');
      expect(result).toBeNull();
    });
  });

  describe('SerializerUtils', () => {
    it('should be defined', () => {
      expect(SerializerUtils).toBeDefined();
    });

    it('should have utility functions', () => {
      expect(SerializerUtils.isSerializable).toBeDefined();
      expect(SerializerUtils.getSerializedSize).toBeDefined();
      expect(SerializerUtils.compareSerialized).toBeDefined();
    });

    it('should check if value is serializable', () => {
      expect(SerializerUtils.isSerializable({ test: 'data' })).toBe(true);
      expect(SerializerUtils.isSerializable('string')).toBe(true);
      expect(SerializerUtils.isSerializable(123)).toBe(true);
      expect(SerializerUtils.isSerializable(null)).toBe(true);
    });

    it('should get serialized size', () => {
      const size = SerializerUtils.getSerializedSize({ test: 'data' });
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });

    it('should compare serialized values', () => {
      const obj1 = { test: 'data' };
      const obj2 = { test: 'data' };
      const obj3 = { test: 'different' };

      expect(SerializerUtils.compareSerialized(obj1, obj2)).toBe(true);
      expect(SerializerUtils.compareSerialized(obj1, obj3)).toBe(false);
    });
  });
});
