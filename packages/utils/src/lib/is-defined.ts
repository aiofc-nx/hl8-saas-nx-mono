/**
 * 检查值是否已定义
 *
 * 检查输入值是否已定义（非 undefined），提供类型安全的定义检查功能。
 * 使用类型守卫模式，确保类型检查的准确性。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否已定义。
 * 使用类型守卫模式，确保类型检查的准确性和 TypeScript 类型推断。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 使用 typeof 操作符检查类型
 * - 排除 undefined 值
 * - 返回类型守卫，支持类型推断
 * - 不进行类型转换或修改
 *
 * ### 返回值规则
 * - 已定义的值返回 true
 * - undefined 返回 false
 * - null 返回 true（null 是已定义的）
 * - 其他类型返回 true
 *
 * ### 类型安全规则
 * - 使用类型守卫模式
 * - 支持 TypeScript 类型推断
 * - 确保类型检查的准确性
 * - 提供编译时类型安全
 *
 * @template T - 输入值的类型，默认为 undefined | unknown
 *
 * @param val - 要检查的值，支持任意类型
 * @returns 如果值已定义则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查已定义的值
 * const defined = 'hello';
 * console.log(isDefined(defined)); // 输出: true
 *
 * // 检查 undefined
 * let undefinedValue: string | undefined;
 * console.log(isDefined(undefinedValue)); // 输出: false
 *
 * // 检查 null
 * const nullValue = null;
 * console.log(isDefined(nullValue)); // 输出: true (null 是已定义的)
 *
 * // 检查基本类型
 * console.log(isDefined(123)); // 输出: true
 * console.log(isDefined('hello')); // 输出: true
 * console.log(isDefined(true)); // 输出: true
 * console.log(isDefined({})); // 输出: true
 *
 * // 在类型守卫中使用
 * function processValue(value: string | undefined) {
 *   if (isDefined(value)) {
 *     // 这里 value 被推断为 string 类型
 *     console.log(value.toUpperCase());
 *   }
 * }
 *
 * // 在条件判断中使用
 * if (isDefined(input)) {
 *   console.log('输入值已定义:', input);
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isDefined<T = undefined | unknown>(val: T): val is T extends undefined ? never : T {
	// 检查值是否不为 undefined
	return typeof val !== 'undefined';
}
