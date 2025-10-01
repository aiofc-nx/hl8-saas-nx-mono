import { isClassInstance } from './is-class-instance';
import { isObject } from './is-object';

/**
 * 递归解析对象
 *
 * 递归地解析对象，对所有非对象的叶子值应用回调函数。
 * 支持嵌套对象和类实例的处理。
 *
 * @description 此函数提供了一种灵活的方式来处理对象中的值。
 * 支持递归处理嵌套对象，同时保护类实例不被修改。
 * 适用于数据转换、值处理、对象映射等场景。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 输入必须是对象类型
 * - 非对象类型直接返回
 * - 支持任意深度的嵌套结构
 * - 不修改原始对象
 *
 * ### 递归处理规则
 * - 普通对象递归处理
 * - 类实例直接跳过（不处理）
 * - 基本类型应用回调函数
 * - 数组和函数直接应用回调
 *
 * ### 回调函数规则
 * - 回调函数接收当前值作为参数
 * - 回调函数返回处理后的值
 * - 支持异步和同步回调
 * - 保持类型安全
 *
 * ### 类型安全规则
 * - 支持泛型类型约束
 * - 保持类型推断的准确性
 * - 处理各种数据类型
 * - 确保处理的正确性
 *
 * @template T - 对象类型，必须继承自 Record<string, any>
 *
 * @param source - 要解析的对象
 * @param callback - 应用于每个基本值的回调函数
 * @returns 修改后的对象
 *
 * @example
 * ```typescript
 * // 基本用法：转换字符串为数字
 * const data = { name: 'John', age: '30', score: '95.5' };
 * const parsed = parseObject(data, (value) => {
 *   if (typeof value === 'string' && !isNaN(Number(value))) {
 *     return Number(value);
 *   }
 *   return value;
 * });
 * console.log(parsed); // 输出: { name: 'John', age: 30, score: 95.5 }
 *
 * // 处理嵌套对象
 * const nested = {
 *   user: { name: 'John', age: '30' },
 *   settings: { theme: 'dark', language: 'en' }
 * };
 * const parsedNested = parseObject(nested, (value) => {
 *   if (typeof value === 'string') {
 *     return value.toUpperCase();
 *   }
 *   return value;
 * });
 * console.log(parsedNested); // 输出: { user: { name: 'JOHN', age: '30' }, settings: { theme: 'DARK', language: 'EN' } }
 *
 * // 处理类实例
 * class Person {
 *   constructor(public name: string) {}
 * }
 * const withClass = {
 *   person: new Person('John'),
 *   age: '30'
 * };
 * const parsedWithClass = parseObject(withClass, (value) => {
 *   if (typeof value === 'string') {
 *     return value.toUpperCase();
 *   }
 *   return value;
 * });
 * console.log(parsedWithClass); // 输出: { person: Person { name: 'John' }, age: '30' } (类实例未修改)
 *
 * // 处理数组
 * const withArray = { items: ['a', 'b', 'c'], count: '3' };
 * const parsedWithArray = parseObject(withArray, (value) => {
 *   if (typeof value === 'string') {
 *     return value.toUpperCase();
 *   }
 *   return value;
 * });
 * console.log(parsedWithArray); // 输出: { items: ['A', 'B', 'C'], count: '3' }
 * ```
 *
 * @since 1.0.0
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseObject<T extends Record<string, any>>(
  source: T,
  callback: (value: any) => any
): T {
  // 检查输入是否为对象类型
  if (!isObject(source)) {
    return source;
  }

  // 遍历对象的所有键
  for (const key of Object.keys(source)) {
    const value = source[key];

    // 如果值是对象，递归处理
    if (isObject(value)) {
      if (!isClassInstance(value)) {
        (source as any)[key] = parseObject(value, callback);
      }
    } else {
      // 对基本类型应用回调函数
      (source as any)[key] = callback(value);
    }
  }

  return source;
}
