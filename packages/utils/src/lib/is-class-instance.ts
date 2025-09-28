import { isPlainObject } from './is-plain-object';

/**
 * 检查值是否为类实例
 *
 * 检查输入值是否为类实例（非普通对象），通过构造函数名称进行判断。
 * 提供类型安全的类实例检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为类实例。
 * 通过检查构造函数名称来区分类实例和普通对象，确保检查的准确性。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 必须是普通对象类型
 * - 构造函数名称不能为 'Object'
 * - 排除 null 和 undefined 值
 * - 不检查原型链
 *
 * ### 类实例识别规则
 * - 类实例的构造函数名称通常为类名
 * - 普通对象的构造函数名称为 'Object'
 * - 数组的构造函数名称为 'Array'
 * - 函数的构造函数名称为 'Function'
 *
 * ### 返回值规则
 * - 类实例返回 true
 * - 普通对象返回 false
 * - null 和 undefined 返回 false
 * - 基本类型返回 false
 *
 * @param item - 要检查的值，支持任意类型
 * @returns 如果值为类实例则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查类实例
 * class Person {
 *   constructor(public name: string) {}
 * }
 * const person = new Person('John');
 * console.log(isClassInstance(person)); // 输出: true
 *
 * // 检查普通对象
 * const obj = { name: 'John' };
 * console.log(isClassInstance(obj)); // 输出: false
 *
 * // 检查数组
 * const arr = [1, 2, 3];
 * console.log(isClassInstance(arr)); // 输出: true (数组也是类实例)
 *
 * // 检查基本类型
 * console.log(isClassInstance('hello')); // 输出: false
 * console.log(isClassInstance(123)); // 输出: false
 * console.log(isClassInstance(null)); // 输出: false
 * console.log(isClassInstance(undefined)); // 输出: false
 *
 * // 在类型守卫中使用
 * function processValue(value: unknown) {
 *   if (isClassInstance(value)) {
 *     // 这里 value 被推断为类实例类型
 *     console.log(value.constructor.name);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isClassInstance(item: any): boolean {
	// 检查是否为普通对象且构造函数名称不为 'Object'
	return isPlainObject(item) && item.constructor.name !== 'Object';
}
