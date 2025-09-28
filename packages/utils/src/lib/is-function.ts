/**
 * 检查值是否为函数类型
 *
 * 检查输入值是否为函数类型，同时排除数组（数组在 JavaScript 中也是对象）。
 * 提供类型安全的函数类型检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为函数类型。
 * 使用 typeof 操作符检查类型，同时排除数组，确保检查的准确性。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 使用 typeof 操作符检查类型
 * - 类型必须为 'function'
 * - 排除数组类型（数组也是对象）
 * - 不进行类型转换或修改
 *
 * ### 返回值规则
 * - 函数类型返回 true
 * - 非函数类型返回 false
 * - 数组返回 false
 * - null 和 undefined 返回 false
 *
 * ### 性能规则
 * - 使用原生 typeof 操作符，性能优异
 * - 不进行额外的类型转换
 * - 支持所有 JavaScript 环境
 * - 内存使用最小化
 *
 * @param item - 要检查的值，支持任意类型
 * @returns 如果值为函数类型则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查函数
 * const func = () => 'hello';
 * console.log(isFunction(func)); // 输出: true
 *
 * // 检查箭头函数
 * const arrowFunc = (x: number) => x * 2;
 * console.log(isFunction(arrowFunc)); // 输出: true
 *
 * // 检查普通函数
 * function regularFunc() { return 'hello'; }
 * console.log(isFunction(regularFunc)); // 输出: true
 *
 * // 检查非函数类型
 * console.log(isFunction('hello')); // 输出: false
 * console.log(isFunction(123)); // 输出: false
 * console.log(isFunction({})); // 输出: false
 * console.log(isFunction([])); // 输出: false (数组不是函数)
 *
 * // 检查 null 和 undefined
 * console.log(isFunction(null)); // 输出: false
 * console.log(isFunction(undefined)); // 输出: false
 *
 * // 在条件判断中使用
 * if (isFunction(callback)) {
 *   callback();
 * }
 *
 * // 在类型守卫中使用
 * function processValue(value: unknown) {
 *   if (isFunction(value)) {
 *     // 这里 value 被推断为函数类型
 *     value();
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isFunction(item: any): boolean {
	// 检查类型为 function 且不是数组
	return typeof item === 'function' && !Array.isArray(item);
}
