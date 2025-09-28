/**
 * 检查值是否为普通对象
 *
 * 检查输入值是否为普通对象（非数组、非 null 或其他非对象类型）。
 * 提供类型安全的普通对象检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为普通对象。
 * 使用多重条件检查，确保对象类型的准确性和完整性。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 值必须存在（非 falsy）
 * - 类型必须为 'object'
 * - 不能是数组类型
 * - 排除 null 值
 *
 * ### 返回值规则
 * - 普通对象返回 true
 * - 数组返回 false
 * - null 返回 false
 * - 其他类型返回 false
 *
 * ### 对象识别规则
 * - 使用 typeof 检查类型
 * - 使用 Array.isArray 排除数组
 * - 使用双重否定确保真值
 * - 保持检查的准确性
 *
 * ### 性能规则
 * - 使用原生方法，性能优异
 * - 避免复杂的类型检查
 * - 支持高并发场景
 * - 内存使用最小化
 *
 * @param item - 要检查的值，支持任意类型
 * @returns 如果值为普通对象则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查普通对象
 * const obj = { name: 'John', age: 30 };
 * console.log(isPlainObject(obj)); // 输出: true
 *
 * // 检查空对象
 * const emptyObj = {};
 * console.log(isPlainObject(emptyObj)); // 输出: true
 *
 * // 检查数组
 * const arr = [1, 2, 3];
 * console.log(isPlainObject(arr)); // 输出: false
 *
 * // 检查 null
 * console.log(isPlainObject(null)); // 输出: false
 *
 * // 检查基本类型
 * console.log(isPlainObject('string')); // 输出: false
 * console.log(isPlainObject(123)); // 输出: false
 * console.log(isPlainObject(true)); // 输出: false
 * console.log(isPlainObject(undefined)); // 输出: false
 *
 * // 检查类实例
 * class Person {
 *   constructor(public name: string) {}
 * }
 * const person = new Person('John');
 * console.log(isPlainObject(person)); // 输出: true
 *
 * // 在类型守卫中使用
 * function processValue(value: unknown) {
 *   if (isPlainObject(value)) {
 *     // 这里 value 被推断为普通对象类型
 *     console.log(Object.keys(value));
 *   }
 * }
 *
 * // 在条件判断中使用
 * if (isPlainObject(input)) {
 *   console.log('输入值是普通对象:', input);
 * } else {
 *   console.log('输入值不是普通对象');
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isPlainObject(item: unknown): boolean {
	// 检查值存在、类型为对象且不是数组
	return !!item && typeof item === 'object' && !Array.isArray(item);
}
