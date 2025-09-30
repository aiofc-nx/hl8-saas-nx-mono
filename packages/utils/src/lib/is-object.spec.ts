/**
 * isObject 单元测试
 *
 * @description 测试对象类型检查函数的正确性
 *
 * @since 1.0.0
 */

import { isObject } from './is-object';

describe('isObject', () => {
  describe('应该正确识别对象类型', () => {
    it('应该识别普通对象', () => {
      const obj = { name: 'John', age: 30 };
      expect(isObject(obj)).toBe(true);
    });

    it('应该识别空对象', () => {
      const empty = {};
      expect(isObject(empty)).toBe(true);
    });

    it('应该识别数组（数组也是对象）', () => {
      const arr = [1, 2, 3];
      expect(isObject(arr)).toBe(true);
    });

    it('应该识别空数组', () => {
      const emptyArr: any[] = [];
      expect(isObject(emptyArr)).toBe(true);
    });

    it('应该识别Date对象', () => {
      const date = new Date();
      expect(isObject(date)).toBe(true);
    });

    it('应该识别RegExp对象', () => {
      const regex = /test/;
      expect(isObject(regex)).toBe(true);
    });

    it('应该识别Map对象', () => {
      const map = new Map();
      expect(isObject(map)).toBe(true);
    });

    it('应该识别Set对象', () => {
      const set = new Set();
      expect(isObject(set)).toBe(true);
    });

    it('应该识别类实例', () => {
      class TestClass {
        constructor(public value: string) {}
      }
      const instance = new TestClass('test');
      expect(isObject(instance)).toBe(true);
    });

    it('应该识别嵌套对象', () => {
      const nested = {
        level1: {
          level2: {
            level3: 'deep',
          },
        },
      };
      expect(isObject(nested)).toBe(true);
    });
  });

  describe('应该正确排除非对象类型', () => {
    it('应该排除null', () => {
      expect(isObject(null)).toBe(false);
    });

    it('应该排除undefined', () => {
      expect(isObject(undefined)).toBe(false);
    });

    it('应该排除字符串', () => {
      expect(isObject('hello')).toBe(false);
      expect(isObject('')).toBe(false);
      expect(isObject('123')).toBe(false);
    });

    it('应该排除数字', () => {
      expect(isObject(123)).toBe(false);
      expect(isObject(0)).toBe(false);
      expect(isObject(-1)).toBe(false);
      expect(isObject(3.14)).toBe(false);
      expect(isObject(Infinity)).toBe(false);
      expect(isObject(NaN)).toBe(false);
    });

    it('应该排除布尔值', () => {
      expect(isObject(true)).toBe(false);
      expect(isObject(false)).toBe(false);
    });

    it('应该排除函数', () => {
      expect(isObject(() => {})).toBe(false);
      expect(isObject(function () {})).toBe(false);
      expect(isObject(async () => {})).toBe(false);
    });

    it('应该排除Symbol', () => {
      expect(isObject(Symbol())).toBe(false);
      expect(isObject(Symbol('test'))).toBe(false);
    });

    it('应该排除BigInt', () => {
      expect(isObject(BigInt(123))).toBe(false);
      expect(isObject(BigInt('456'))).toBe(false);
    });
  });

  describe('类型守卫功能测试', () => {
    it('应该提供正确的类型推断', () => {
      function processValue(value: unknown) {
        if (isObject(value)) {
          // 这里 value 应该被推断为 object 类型
          expect(typeof value).toBe('object');
          // 应该能够访问对象的方法
          expect(Object.keys(value)).toBeDefined();
        } else {
          // 这里 value 应该被推断为非对象类型
          expect([
            'string',
            'number',
            'boolean',
            'function',
            'symbol',
            'bigint',
            'undefined',
          ]).toContain(typeof value);
        }
      }

      processValue({ name: 'test' });
      processValue('string');
      processValue(123);
      processValue(null);
      processValue(undefined);
    });

    it('应该在条件语句中正确工作', () => {
      const testCases = [
        { value: { a: 1 }, expected: true },
        { value: [], expected: true },
        { value: null, expected: false },
        { value: undefined, expected: false },
        { value: 'string', expected: false },
        { value: 123, expected: false },
        { value: true, expected: false },
      ];

      testCases.forEach(({ value, expected }) => {
        if (isObject(value)) {
          expect(expected).toBe(true);
        } else {
          expect(expected).toBe(false);
        }
      });
    });
  });

  describe('边界条件测试', () => {
    it('应该处理原型链', () => {
      const obj = Object.create({ inherited: 'property' });
      obj.own = 'property';
      expect(isObject(obj)).toBe(true);
    });

    it('应该处理冻结对象', () => {
      const frozen = Object.freeze({ value: 'test' });
      expect(isObject(frozen)).toBe(true);
    });

    it('应该处理密封对象', () => {
      const sealed = Object.seal({ value: 'test' });
      expect(isObject(sealed)).toBe(true);
    });

    it('应该处理不可扩展对象', () => {
      const nonExtensible = Object.preventExtensions({ value: 'test' });
      expect(isObject(nonExtensible)).toBe(true);
    });

    it('应该处理Proxy对象', () => {
      const target = { value: 'test' };
      const proxy = new Proxy(target, {});
      expect(isObject(proxy)).toBe(true);
    });

    it('应该处理WeakMap和WeakSet', () => {
      const weakMap = new WeakMap();
      const weakSet = new WeakSet();
      expect(isObject(weakMap)).toBe(true);
      expect(isObject(weakSet)).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该快速处理大量调用', () => {
      const testValues = [
        { value: 'test' },
        [1, 2, 3],
        null,
        undefined,
        'string',
        123,
        true,
        () => {},
        new Date(),
        /regex/,
      ];

      const iterations = 10000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        testValues.forEach((value) => {
          isObject(value);
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 应该在合理时间内完成（小于100ms）
      expect(duration).toBeLessThan(100);
    });
  });

  describe('集成测试', () => {
    it('应该与其他工具函数配合工作', () => {
      function processData(data: unknown) {
        if (isObject(data)) {
          if (Array.isArray(data)) {
            return `Array with ${data.length} items`;
          } else if (data instanceof Date) {
            return `Date: ${data.toISOString()}`;
          } else {
            return `Object with ${Object.keys(data).length} properties`;
          }
        } else {
          return `Primitive: ${data}`;
        }
      }

      expect(processData({ name: 'John', age: 30 })).toBe(
        'Object with 2 properties'
      );
      expect(processData([1, 2, 3])).toBe('Array with 3 items');
      expect(processData(new Date('2023-01-01'))).toMatch(/^Date:/);
      expect(processData('hello')).toBe('Primitive: hello');
      expect(processData(123)).toBe('Primitive: 123');
      expect(processData(null)).toBe('Primitive: null');
      expect(processData(undefined)).toBe('Primitive: undefined');
    });
  });
});
