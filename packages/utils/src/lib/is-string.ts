/**
 * 检查值是否为字符串类型
 *
 * 使用类型守卫检查输入值是否为字符串类型，同时排除 null 和 undefined。
 * 提供类型安全的字符串类型检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为字符串类型。
 * 使用类型守卫模式，确保类型检查的准确性和 TypeScript 类型推断。
 * 适用于类型守卫、数据验证、条件判断等场景。
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
 * - 字符串类型返回 true
 * - 非字符串类型返回 false
 * - null 和 undefined 返回 false
 * - 空字符串返回 true
 *
 * ### 类型安全规则
 * - 使用类型守卫模式
 * - 支持 TypeScript 类型推断
 * - 确保类型检查的准确性
 * - 提供编译时类型安全
 *
 * @param val - 要检查的值，支持任意类型
 * @returns 如果值为字符串类型则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查字符串
 * const text = 'hello world';
 * console.log(isString(text)); // 输出: true
 *
 * // 检查空字符串
 * const empty = '';
 * console.log(isString(empty)); // 输出: true
 *
 * // 检查非字符串
 * const number = 123;
 * console.log(isString(number)); // 输出: false
 *
 * // 检查 null 和 undefined
 * console.log(isString(null)); // 输出: false
 * console.log(isString(undefined)); // 输出: false
 *
 * // 在类型守卫中使用
 * function processValue(value: unknown) {
 *   if (isString(value)) {
 *     // 这里 value 被推断为 string 类型
 *     console.log(value.toUpperCase());
 *   }
 * }
 *
 * // 在条件判断中使用
 * if (isString(input)) {
 *   const length = input.length;
 *   console.log(`字符串长度为: ${length}`);
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isString(val: any): val is string {
	// 检查值不为 null/undefined 且类型为 string
	return val != null && typeof val === 'string';
}
