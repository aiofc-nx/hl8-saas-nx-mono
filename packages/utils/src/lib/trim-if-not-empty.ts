import { isNotEmpty } from './is-not-empty';

/**
 * 如果字符串不为空则去除首尾空白字符
 *
 * 检查字符串是否不为空，如果不为空则去除首尾空白字符并返回，否则返回 undefined。
 * 提供智能的字符串处理功能，适用于数据清洗、表单处理等场景。
 *
 * @description 此函数提供了一种智能的方式来处理字符串的空白字符。
 * 使用 isNotEmpty 函数检查字符串是否不为空，确保处理的准确性。
 * 适用于数据清洗、表单处理、输入验证等场景。
 *
 * ## 业务规则
 *
 * ### 空值检查规则
 * - 使用 isNotEmpty 函数检查
 * - 空字符串返回 undefined
 * - undefined 返回 undefined
 * - null 返回 undefined
 * - 保持检查的一致性
 *
 * ### 空白字符处理规则
 * - 去除首尾空白字符
 * - 保持中间空白字符
 * - 处理各种空白字符类型
 * - 包括空格、制表符、换行符
 *
 * ### 返回值规则
 * - 非空字符串返回去除空白后的字符串
 * - 空字符串返回 undefined
 * - 保持类型安全
 * - 支持可选参数
 *
 * ### 性能规则
 * - 使用 isNotEmpty 函数的优化逻辑
 * - 避免不必要的字符串操作
 * - 保持性能效率
 * - 支持高并发场景
 *
 * @param value - 要处理的字符串值，可选参数
 * @returns 如果字符串不为空则返回去除空白后的字符串，否则返回 undefined
 *
 * @example
 * ```typescript
 * // 基本用法：处理有内容的字符串
 * const result1 = trimIfNotEmpty('  hello world  ');
 * console.log(result1); // 输出: 'hello world'
 *
 * // 处理空字符串
 * const result2 = trimIfNotEmpty('');
 * console.log(result2); // 输出: undefined
 *
 * // 处理只有空白字符的字符串
 * const result3 = trimIfNotEmpty('   ');
 * console.log(result3); // 输出: undefined
 *
 * // 处理 undefined
 * const result4 = trimIfNotEmpty(undefined);
 * console.log(result4); // 输出: undefined
 *
 * // 处理正常字符串
 * const result5 = trimIfNotEmpty('hello');
 * console.log(result5); // 输出: 'hello'
 *
 * // 处理包含制表符和换行符的字符串
 * const result6 = trimIfNotEmpty('\t\n  hello world  \n\t');
 * console.log(result6); // 输出: 'hello world'
 *
 * // 在数据清洗中使用
 * function cleanData(data: Record<string, any>): Record<string, string> {
 *   const cleaned: Record<string, string> = {};
 *   for (const [key, value] of Object.entries(data)) {
 *     const trimmed = trimIfNotEmpty(value);
 *     if (trimmed !== undefined) {
 *       cleaned[key] = trimmed;
 *     }
 *   }
 *   return cleaned;
 * }
 *
 * // 在表单处理中使用
 * function processFormField(field: string | undefined): string | undefined {
 *   return trimIfNotEmpty(field);
 * }
 *
 * // 在输入验证中使用
 * function validateInput(input: string | undefined): boolean {
 *   const trimmed = trimIfNotEmpty(input);
 *   return trimmed !== undefined && trimmed.length > 0;
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const trimIfNotEmpty = (value?: string): string | undefined => {
	// 检查字符串是否不为空，如果不为空则去除首尾空白字符
	return isNotEmpty(value) ? value!.trim() : undefined;
};
