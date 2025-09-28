/**
 * 检查值是否为 null 或 undefined
 *
 * 检查输入值是否为 null 或 undefined，提供类型安全的空值检查功能。
 * 使用类型守卫模式，确保类型检查的准确性。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为 null 或 undefined。
 * 使用类型守卫模式，确保类型检查的准确性和 TypeScript 类型推断。
 * 适用于类型守卫、数据验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 类型检查规则
 * - 检查值是否为 undefined
 * - 检查值是否为 null
 * - 返回类型守卫，支持类型推断
 * - 不进行类型转换或修改
 *
 * ### 返回值规则
 * - null 或 undefined 返回 true
 * - 其他类型返回 false
 * - 保持类型安全
 * - 支持类型推断
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
 * @returns 如果值为 null 或 undefined 则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查 null
 * const nullValue = null;
 * console.log(isNullOrUndefined(nullValue)); // 输出: true
 *
 * // 检查 undefined
 * let undefinedValue: string | undefined;
 * console.log(isNullOrUndefined(undefinedValue)); // 输出: true
 *
 * // 检查已定义的值
 * const defined = 'hello';
 * console.log(isNullOrUndefined(defined)); // 输出: false
 *
 * // 检查基本类型
 * console.log(isNullOrUndefined(123)); // 输出: false
 * console.log(isNullOrUndefined('hello')); // 输出: false
 * console.log(isNullOrUndefined(true)); // 输出: false
 * console.log(isNullOrUndefined({})); // 输出: false
 *
 * // 在类型守卫中使用
 * function processValue(value: string | null | undefined) {
 *   if (isNullOrUndefined(value)) {
 *     console.log('值为 null 或 undefined');
 *   } else {
 *     // 这里 value 被推断为 string 类型
 *     console.log(value.toUpperCase());
 *   }
 * }
 *
 * // 在条件判断中使用
 * if (isNullOrUndefined(input)) {
 *   console.log('输入值为 null 或 undefined');
 * } else {
 *   console.log('输入值已定义:', input);
 * }
 *
 * // 在数据验证中使用
 * function validateData(data: unknown) {
 *   if (isNullOrUndefined(data)) {
 *     return { valid: false, error: '数据不能为 null 或 undefined' };
 *   }
 *   return { valid: true, data };
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isNullOrUndefined<T>(value: T | null | undefined): value is null | undefined {
	// 检查值是否为 undefined 或 null
	return value === undefined || value === null;
}
