/**
 * 检查值是否为数组类型
 *
 * 使用 Array.isArray() 方法检查输入值是否为数组类型。
 * 提供类型安全的数组类型检查功能。
 *
 * @description 此函数提供了一种简单而可靠的方式来检查值是否为数组类型。
 * 使用原生 Array.isArray() 方法，确保检查的准确性和性能。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 使用 Array.isArray() 进行类型检查
 * - 返回布尔值表示检查结果
 * - 支持任意类型的输入值
 * - 不进行类型转换或修改
 *
 * ### 返回值规则
 * - 数组类型返回 true
 * - 非数组类型返回 false
 * - null 和 undefined 返回 false
 * - 类数组对象返回 false
 *
 * ### 性能规则
 * - 使用原生方法，性能优异
 * - 不进行额外的类型转换
 * - 支持所有 JavaScript 环境
 * - 内存使用最小化
 *
 * @param item - 要检查的值，支持任意类型
 * @returns 如果值为数组类型则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查数组
 * const numbers = [1, 2, 3];
 * console.log(isArray(numbers)); // 输出: true
 *
 * // 检查非数组
 * const string = 'hello';
 * console.log(isArray(string)); // 输出: false
 *
 * // 检查 null 和 undefined
 * console.log(isArray(null)); // 输出: false
 * console.log(isArray(undefined)); // 输出: false
 *
 * // 检查对象
 * const obj = { name: 'John' };
 * console.log(isArray(obj)); // 输出: false
 *
 * // 检查类数组对象
 * const arrayLike = { 0: 'a', 1: 'b', length: 2 };
 * console.log(isArray(arrayLike)); // 输出: false
 *
 * // 在条件判断中使用
 * if (isArray(data)) {
 *   data.forEach(item => console.log(item));
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isArray(item: any): boolean {
	// 使用原生 Array.isArray 方法检查类型
	return Array.isArray(item);
}
