/**
 * 检查值是否不为 null 或 undefined
 *
 * 检查输入值是否不为 null 或 undefined，提供类型安全的非空值检查功能。
 * 使用类型守卫模式，确保类型检查的准确性。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否不为 null 或 undefined。
 * 使用类型守卫模式，确保类型检查的准确性和 TypeScript 类型推断。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 检查值是否不为 undefined
 * - 检查值是否不为 null
 * - 返回类型守卫，支持类型推断
 * - 不进行类型转换或修改
 *
 * ### 返回值规则
 * - 非 null 且非 undefined 的值返回 true
 * - null 或 undefined 返回 false
 * - 其他类型返回 true
 * - 保持类型安全
 *
 * ### 类型安全规则
 * - 使用类型守卫模式
 * - 支持 TypeScript 类型推断
 * - 确保类型检查的准确性
 * - 提供编译时类型安全
 *
 * @template T - 输入值的类型
 *
 * @param value - 要检查的值，支持任意类型
 * @returns 如果值不为 null 或 undefined 则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查已定义的值
 * const defined = 'hello';
 * console.log(isNotNullOrUndefined(defined)); // 输出: true
 *
 * // 检查 null
 * const nullValue = null;
 * console.log(isNotNullOrUndefined(nullValue)); // 输出: false
 *
 * // 检查 undefined
 * let undefinedValue: string | undefined;
 * console.log(isNotNullOrUndefined(undefinedValue)); // 输出: false
 *
 * // 检查基本类型
 * console.log(isNotNullOrUndefined(123)); // 输出: true
 * console.log(isNotNullOrUndefined('hello')); // 输出: true
 * console.log(isNotNullOrUndefined(true)); // 输出: true
 * console.log(isNotNullOrUndefined({})); // 输出: true
 *
 * // 在类型守卫中使用
 * function processValue(value: string | null | undefined) {
 *   if (isNotNullOrUndefined(value)) {
 *     // 这里 value 被推断为 string 类型
 *     console.log(value.toUpperCase());
 *   }
 * }
 *
 * // 在条件判断中使用
 * if (isNotNullOrUndefined(input)) {
 *   console.log('输入值已定义:', input);
 * } else {
 *   console.log('输入值为 null 或 undefined');
 * }
 *
 * // 在数据验证中使用
 * function validateData(data: unknown) {
 *   if (isNotNullOrUndefined(data)) {
 *     return { valid: true, data };
 *   }
 *   return { valid: false, error: '数据不能为 null 或 undefined' };
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isNotNullOrUndefined<T>(value: T | undefined | null): value is T {
	// 检查值是否不为 undefined 且不为 null
	return value !== undefined && value !== null;
}
