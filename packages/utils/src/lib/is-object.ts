/**
 * 检查值是否为对象类型
 *
 * 使用类型守卫检查输入值是否为对象类型，正确排除 null 和 undefined。
 * 提供类型安全的对象类型检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为对象类型。
 * 与 instanceof Object 不同，此方法避免了跨上下文问题。
 * 与 typeof 不同，此方法正确排除了 null 和 undefined，它们被错误地分类为对象。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 使用 typeof 操作符检查类型
 * - 排除 null 和 undefined 值
 * - 返回类型守卫，支持类型推断
 * - 不进行类型转换或修改
 *
 * ### 返回值规则
 * - 对象类型返回 true
 * - 非对象类型返回 false
 * - null 和 undefined 返回 false
 * - 数组返回 true（数组也是对象）
 * - 函数返回 false
 *
 * ### 类型安全规则
 * - 使用类型守卫模式
 * - 支持 TypeScript 类型推断
 * - 确保类型检查的准确性
 * - 提供编译时类型安全
 *
 * @param val - 要检查的值，支持任意类型
 * @returns 如果值为对象类型则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查普通对象
 * const obj = { name: 'John', age: 30 };
 * console.log(isObject(obj)); // 输出: true
 *
 * // 检查空对象
 * const empty = {};
 * console.log(isObject(empty)); // 输出: true
 *
 * // 检查数组（数组也是对象）
 * const arr = [1, 2, 3];
 * console.log(isObject(arr)); // 输出: true
 *
 * // 检查 Date 对象
 * const date = new Date();
 * console.log(isObject(date)); // 输出: true
 *
 * // 检查 null 和 undefined
 * console.log(isObject(null)); // 输出: false
 * console.log(isObject(undefined)); // 输出: false
 *
 * // 检查非对象类型
 * console.log(isObject('hello')); // 输出: false
 * console.log(isObject(123)); // 输出: false
 * console.log(isObject(true)); // 输出: false
 *
 * // 在类型守卫中使用
 * function processValue(value: unknown) {
 *   if (isObject(value)) {
 *     // 这里 value 被推断为 object 类型
 *     console.log(Object.keys(value));
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isObject(val: unknown): val is object {
	// 检查值不为 null/undefined 且类型为 object
	return val !== null && val !== undefined && typeof val === 'object';
}
