import { deepClone } from './deep-clone';
import { isClassInstance } from './is-class-instance';
import { isPlainObject } from './is-plain-object';

/**
 * 深度合并两个对象
 *
 * 递归地深度合并两个对象，支持嵌套对象、数组和类实例的处理。
 * 使用深度克隆确保不修改原始对象。
 *
 * @description 此函数提供了一种全面的深度合并解决方案。
 * 支持各种数据类型的深度合并，包括基本类型、数组、对象和类实例。
 * 适用于配置合并、状态管理、对象更新等场景。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 源对象必须存在且为对象类型
 * - 非对象类型直接返回目标对象
 * - 支持任意深度的嵌套结构
 * - 不修改原始目标对象
 *
 * ### 合并规则
 * - 普通对象递归合并
 * - 类实例直接赋值（不合并）
 * - 基本类型直接覆盖
 * - 数组直接覆盖（不合并）
 *
 * ### 深度控制规则
 * - 深度为 0 时克隆目标对象
 * - 递归合并嵌套对象
 * - 避免无限递归
 * - 保持性能优化
 *
 * ### 类型安全规则
 * - 支持泛型类型约束
 * - 保持类型推断的准确性
 * - 处理各种数据类型
 * - 确保合并的正确性
 *
 * @param target - 目标对象，要合并到的对象
 * @param source - 源对象，要合并的对象
 * @param depth - 递归合并的深度级别，默认为 0
 * @returns 合并后的对象
 *
 * @example
 * ```typescript
 * // 基本用法：合并简单对象
 * const target = { name: 'John', age: 30 };
 * const source = { age: 31, city: 'New York' };
 * const merged = deepMerge(target, source);
 * console.log(merged); // 输出: { name: 'John', age: 31, city: 'New York' }
 *
 * // 深度合并嵌套对象
 * const target2 = {
 *   user: { name: 'John', age: 30 },
 *   settings: { theme: 'light' }
 * };
 * const source2 = {
 *   user: { age: 31, city: 'New York' },
 *   settings: { language: 'en' }
 * };
 * const merged2 = deepMerge(target2, source2);
 * console.log(merged2); // 输出: { user: { name: 'John', age: 31, city: 'New York' }, settings: { theme: 'light', language: 'en' } }
 *
 * // 处理类实例
 * class Person {
 *   constructor(public name: string) {}
 * }
 * const target3 = { person: new Person('John') };
 * const source3 = { person: new Person('Jane') };
 * const merged3 = deepMerge(target3, source3);
 * console.log(merged3.person.name); // 输出: 'Jane' (类实例直接覆盖)
 *
 * // 处理数组
 * const target4 = { items: [1, 2, 3] };
 * const source4 = { items: [4, 5, 6] };
 * const merged4 = deepMerge(target4, source4);
 * console.log(merged4); // 输出: { items: [4, 5, 6] } (数组直接覆盖)
 *
 * // 处理基本类型
 * const target5 = { value: 'old' };
 * const source5 = { value: 'new' };
 * const merged5 = deepMerge(target5, source5);
 * console.log(merged5); // 输出: { value: 'new' }
 * ```
 *
 * @since 1.0.0
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepMerge(target: any, source: any, depth = 0): any {
  // 如果源对象不存在或不是对象类型，返回目标对象
  if (!source || typeof source !== 'object') {
    return target;
  }

  // 在深度为 0 时克隆目标对象，避免修改原始对象
  if (depth === 0) {
    target = deepClone(target);
  }

  // 递归合并对象
  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        // 如果源值是对象，递归合并
        if (isPlainObject(source[key])) {
          if (!target[key]) {
            target[key] = {};
          }

          if (!isClassInstance(source[key])) {
            deepMerge(target[key], source[key], depth + 1);
          } else {
            // 如果源是类实例，不合并，直接赋值
            target[key] = source[key];
          }
        } else {
          // 直接从源对象赋值到目标对象
          target[key] = source[key];
        }
      }
    }
  }

  return target;
}
