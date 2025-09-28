import { isFunction } from './is-function'; // 确保导入路径正确
import { isPlainObject } from './is-plain-object';

/**
 * 检查值是否为对象或函数
 *
 * 检查输入值是否为对象或函数类型，结合 isFunction 和 isPlainObject 函数的判断结果。
 * 提供类型安全的对象或函数检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为对象或函数。
 * 使用 isFunction 和 isPlainObject 函数的组合逻辑，确保检查的准确性。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 使用 isFunction 检查函数类型
 * - 使用 isPlainObject 检查普通对象类型
 * - 返回两个检查结果的逻辑或
 * - 不进行类型转换或修改
 *
 * ### 返回值规则
 * - 函数类型返回 true
 * - 普通对象类型返回 true
 * - 其他类型返回 false
 * - 保持类型安全
 *
 * ### 组合逻辑规则
 * - 使用逻辑或操作符
 * - 任一条件满足即返回 true
 * - 两个条件都不满足返回 false
 * - 保持逻辑的一致性
 *
 * ### 性能规则
 * - 使用优化的检查函数
 * - 避免重复计算
 * - 保持性能效率
 * - 支持高并发场景
 *
 * @param item - 要检查的值，支持任意类型
 * @returns 如果值为对象或函数则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查函数
 * const func = () => 'hello';
 * console.log(isObjectOrFunction(func)); // 输出: true
 *
 * // 检查普通对象
 * const obj = { name: 'John' };
 * console.log(isObjectOrFunction(obj)); // 输出: true
 *
 * // 检查基本类型
 * console.log(isObjectOrFunction('hello')); // 输出: false
 * console.log(isObjectOrFunction(123)); // 输出: false
 * console.log(isObjectOrFunction(true)); // 输出: false
 * console.log(isObjectOrFunction(null)); // 输出: false
 * console.log(isObjectOrFunction(undefined)); // 输出: false
 *
 * // 检查数组
 * const arr = [1, 2, 3];
 * console.log(isObjectOrFunction(arr)); // 输出: true (数组也是对象)
 *
 * // 检查类实例
 * class Person {
 *   constructor(public name: string) {}
 * }
 * const person = new Person('John');
 * console.log(isObjectOrFunction(person)); // 输出: true
 *
 * // 在类型守卫中使用
 * function processValue(value: unknown) {
 *   if (isObjectOrFunction(value)) {
 *     // 这里 value 被推断为对象或函数类型
 *     if (typeof value === 'function') {
 *       value();
 *     } else {
 *       console.log(Object.keys(value));
 *     }
 *   }
 * }
 *
 * // 在条件判断中使用
 * if (isObjectOrFunction(input)) {
 *   console.log('输入值是对象或函数:', input);
 * } else {
 *   console.log('输入值不是对象或函数');
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isObjectOrFunction(item: any): boolean {
	// 检查是否为函数或普通对象
	return isFunction(item) || isPlainObject(item);
}
