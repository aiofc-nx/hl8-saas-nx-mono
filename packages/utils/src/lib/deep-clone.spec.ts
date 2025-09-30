/**
 * deepClone 单元测试
 *
 * @description 测试深度克隆函数的正确性
 *
 * @since 1.0.0
 */

import { deepClone } from './deep-clone';

describe('deepClone', () => {
  describe('基本类型处理', () => {
    it('应该直接返回字符串', () => {
      const input = 'hello world';
      const result = deepClone(input);
      expect(result).toBe(input);
    });

    it('应该直接返回数字', () => {
      const input = 42;
      const result = deepClone(input);
      expect(result).toBe(input);
    });

    it('应该直接返回布尔值', () => {
      expect(deepClone(true)).toBe(true);
      expect(deepClone(false)).toBe(false);
    });

    it('应该直接返回null', () => {
      expect(deepClone(null)).toBe(null);
    });

    it('应该直接返回undefined', () => {
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('应该直接返回函数', () => {
      const input = () => 'test';
      const result = deepClone(input);
      expect(result).toBe(input);
    });

    it('应该直接返回Symbol', () => {
      const input = Symbol('test');
      const result = deepClone(input);
      expect(result).toBe(input);
    });
  });

  describe('数组处理', () => {
    it('应该深度克隆简单数组', () => {
      const input = [1, 2, 3, 'test', true];
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it('应该深度克隆嵌套数组', () => {
      const input = [
        [1, 2],
        [3, 4],
        ['a', 'b'],
      ];
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
      expect(result[0]).not.toBe(input[0]);
      expect(result[1]).not.toBe(input[1]);
    });

    it('应该深度克隆包含对象的数组', () => {
      const input = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
      expect(result[0]).not.toBe(input[0]);
      expect(result[1]).not.toBe(input[1]);
    });

    it('应该处理空数组', () => {
      const input: any[] = [];
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it('应该保持数组的原始顺序', () => {
      const input = ['first', 'second', 'third'];
      const result = deepClone(input);

      expect(result[0]).toBe('first');
      expect(result[1]).toBe('second');
      expect(result[2]).toBe('third');
    });
  });

  describe('对象处理', () => {
    it('应该深度克隆简单对象', () => {
      const input = { name: 'John', age: 30, active: true };
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it('应该深度克隆嵌套对象', () => {
      const input = {
        user: {
          profile: {
            name: 'John',
            settings: {
              theme: 'dark',
              notifications: true,
            },
          },
        },
      };
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
      expect(result.user).not.toBe(input.user);
      expect(result.user.profile).not.toBe(input.user.profile);
      expect(result.user.profile.settings).not.toBe(
        input.user.profile.settings
      );
    });

    it('应该深度克隆包含数组的对象', () => {
      const input = {
        users: [
          { name: 'John', roles: ['admin', 'user'] },
          { name: 'Jane', roles: ['user'] },
        ],
        settings: {
          theme: 'light',
          features: ['feature1', 'feature2'],
        },
      };
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
      expect(result.users).not.toBe(input.users);
      expect(result.users[0]).not.toBe(input.users[0]);
      expect(result.users[0].roles).not.toBe(input.users[0].roles);
    });

    it('应该处理空对象', () => {
      const input = {};
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it('应该只克隆自有属性', () => {
      const input = Object.create({ inherited: 'property' });
      input.own = 'property';

      const result = deepClone(input);

      expect(result).toEqual({ own: 'property' });
      expect(result).not.toHaveProperty('inherited');
    });
  });

  describe('类实例处理', () => {
    it('应该直接返回类实例', () => {
      class TestClass {
        constructor(public value: string) {}
        getValue() {
          return this.value;
        }
      }

      const input = new TestClass('test');
      const result = deepClone(input);

      expect(result).toBe(input);
      expect(result.getValue()).toBe('test');
    });

    it('应该直接返回Date实例', () => {
      const input = new Date('2023-01-01');
      const result = deepClone(input);

      expect(result).toBe(input);
    });

    it('应该直接返回RegExp实例', () => {
      const input = /test/gi;
      const result = deepClone(input);

      expect(result).toBe(input);
    });

    it('应该直接返回Map实例', () => {
      const input = new Map([['key', 'value']]);
      const result = deepClone(input);

      expect(result).toBe(input);
    });

    it('应该直接返回Set实例', () => {
      const input = new Set([1, 2, 3]);
      const result = deepClone(input);

      expect(result).toBe(input);
    });
  });

  describe('复杂数据结构', () => {
    it('应该处理复杂的嵌套结构', () => {
      const input = {
        users: [
          {
            id: 1,
            profile: {
              name: 'John',
              preferences: {
                theme: 'dark',
                language: 'en',
                notifications: {
                  email: true,
                  push: false,
                  sms: true,
                },
              },
            },
            posts: [
              { title: 'Post 1', content: 'Content 1' },
              { title: 'Post 2', content: 'Content 2' },
            ],
          },
        ],
        settings: {
          global: {
            maintenance: false,
            features: ['feature1', 'feature2'],
          },
        },
      };

      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
      expect(result.users[0].profile.preferences.notifications).not.toBe(
        input.users[0].profile.preferences.notifications
      );
      expect(result.users[0].posts[0]).not.toBe(input.users[0].posts[0]);
    });

    it('应该处理循环引用', () => {
      const input: any = { name: 'test' };
      input.self = input;

      const result = deepClone(input);

      expect(result.name).toBe('test');
      expect(result.self).toBe(result);
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大型数据结构', () => {
      const largeObject = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          data: {
            value: Math.random(),
            nested: {
              deep: Math.random(),
            },
          },
        })),
      };

      const startTime = performance.now();
      const result = deepClone(largeObject);
      const endTime = performance.now();

      expect(result).toEqual(largeObject);
      expect(result).not.toBe(largeObject);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });
  });

  describe('边界条件', () => {
    it('应该处理undefined值', () => {
      const input = { a: undefined, b: 'test' };
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it('应该处理null值', () => {
      const input = { a: null, b: 'test' };
      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
    });

    it('应该处理混合类型', () => {
      const input = {
        string: 'test',
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
        array: [1, 'test', true],
        object: { nested: 'value' },
        function: () => 'test',
      };

      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result).not.toBe(input);
      expect(result.function).toBe(input.function); // 函数应该直接返回
    });
  });

  describe('类型安全性', () => {
    it('应该保持原始类型', () => {
      const input = {
        string: 'test',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
      };

      const result = deepClone(input);

      expect(typeof result.string).toBe('string');
      expect(typeof result.number).toBe('number');
      expect(typeof result.boolean).toBe('boolean');
      expect(Array.isArray(result.array)).toBe(true);
      expect(typeof result.object).toBe('object');
    });

    it('应该支持泛型类型推断', () => {
      interface TestInterface {
        name: string;
        value: number;
        nested: {
          data: string;
        };
      }

      const input: TestInterface = {
        name: 'test',
        value: 42,
        nested: { data: 'nested' },
      };

      const result = deepClone(input);

      expect(result).toEqual(input);
      expect(result.name).toBe('test');
      expect(result.nested.data).toBe('nested');
    });
  });

  describe('实际使用场景', () => {
    it('应该用于状态管理', () => {
      const state = {
        user: { name: 'John', age: 30 },
        settings: { theme: 'dark' },
        data: [1, 2, 3],
      };

      const newState = deepClone(state);
      newState.user.age = 31;
      newState.settings.theme = 'light';
      newState.data.push(4);

      expect(state.user.age).toBe(30);
      expect(state.settings.theme).toBe('dark');
      expect(state.data).toEqual([1, 2, 3]);
      expect(newState.user.age).toBe(31);
      expect(newState.settings.theme).toBe('light');
      expect(newState.data).toEqual([1, 2, 3, 4]);
    });

    it('应该用于数据备份', () => {
      const originalData = {
        config: { version: '1.0.0' },
        users: [{ id: 1, name: 'John' }],
      };

      const backup = deepClone(originalData);

      // 修改原始数据
      originalData.config.version = '2.0.0';
      originalData.users[0].name = 'Jane';

      expect(backup.config.version).toBe('1.0.0');
      expect(backup.users[0].name).toBe('John');
    });
  });
});
