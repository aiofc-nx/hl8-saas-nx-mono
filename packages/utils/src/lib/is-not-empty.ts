import { isEmpty } from './is-empty';

/**
 * 检查值是否不为空
 *
 * 检查输入值是否不为空，使用 isEmpty 函数的相反逻辑进行判断。
 * 提供类型安全的非空值检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否不为空。
 * 使用 isEmpty 函数的相反逻辑，确保检查的准确性和一致性。
 * 适用于数据验证、条件判断、表单验证等场景。
 *
 * ## 业务规则
 *
 * ### 非空检查规则
 * - 使用 isEmpty 函数的相反逻辑
 * - 返回与 isEmpty 相反的结果
 * - 保持检查的一致性
 * - 支持所有数据类型
 *
 * ### 输入处理规则
 * - 支持任意类型的输入值
 * - 递归检查嵌套结构
 * - 处理数组、对象和基本类型
 * - 保持类型安全
 *
 * ### 返回值规则
 * - 非空值返回 true
 * - 空值返回 false
 * - 与 isEmpty 函数结果相反
 * - 保持逻辑的一致性
 *
 * ### 性能规则
 * - 使用 isEmpty 函数的优化逻辑
 * - 避免重复计算
 * - 保持性能效率
 * - 支持高并发场景
 *
 * @param item - 要检查的值，支持任意类型
 * @returns 如果值不为空则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查基本类型
 * console.log(isNotEmpty('hello')); // 输出: true
 * console.log(isNotEmpty('')); // 输出: false
 * console.log(isNotEmpty(123)); // 输出: true
 * console.log(isNotEmpty(0)); // 输出: true
 * console.log(isNotEmpty(null)); // 输出: false
 * console.log(isNotEmpty(undefined)); // 输出: false
 *
 * // 检查数组
 * console.log(isNotEmpty([1, 2, 3])); // 输出: true
 * console.log(isNotEmpty([])); // 输出: false
 * console.log(isNotEmpty([null, undefined, ''])); // 输出: false
 * console.log(isNotEmpty([1, null, 2])); // 输出: true
 *
 * // 检查对象
 * console.log(isNotEmpty({ name: 'John' })); // 输出: true
 * console.log(isNotEmpty({})); // 输出: false
 * console.log(isNotEmpty({ name: null, age: undefined })); // 输出: false
 * console.log(isNotEmpty({ name: '', age: null })); // 输出: false
 *
 * // 在条件判断中使用
 * if (isNotEmpty(input)) {
 *   console.log('输入值不为空:', input);
 * } else {
 *   console.log('输入值为空');
 * }
 *
 * // 在数据验证中使用
 * function validateInput(data: unknown) {
 *   if (isNotEmpty(data)) {
 *     return { valid: true, data };
 *   }
 *   return { valid: false, error: '数据不能为空' };
 * }
 *
 * // 在表单验证中使用
 * function validateForm(field: unknown) {
 *   if (isNotEmpty(field)) {
 *     return { valid: true };
 *   }
 *   return { valid: false, message: '此字段不能为空' };
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isNotEmpty(item: any): boolean {
	// 使用 isEmpty 函数的相反逻辑
	return !isEmpty(item);
}
