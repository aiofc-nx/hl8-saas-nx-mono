/**
 * 检查值是否为有效的 JSON 字符串
 *
 * 检查输入值是否为有效的 JSON 字符串，使用 JSON.parse() 进行验证。
 * 提供类型安全的 JSON 字符串检查功能。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为有效的 JSON 字符串。
 * 使用 JSON.parse() 方法进行验证，确保 JSON 格式的正确性。
 * 适用于数据验证、API 响应处理、配置文件解析等场景。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 输入必须是字符串类型
 * - 非字符串类型直接返回 false
 * - 不进行类型转换
 * - 支持任意长度的字符串
 *
 * ### JSON 验证规则
 * - 使用 JSON.parse() 进行验证
 * - 捕获解析异常
 * - 支持所有有效的 JSON 格式
 * - 包括对象、数组、基本类型
 *
 * ### 返回值规则
 * - 有效 JSON 字符串返回 true
 * - 无效 JSON 字符串返回 false
 * - 非字符串类型返回 false
 * - 空字符串返回 false
 *
 * @param input - 要检查的值，支持任意类型
 * @returns 如果值为有效的 JSON 字符串则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查有效 JSON 字符串
 * const validJson = '{"name": "John", "age": 30}';
 * console.log(isJSON(validJson)); // 输出: true
 *
 * // 检查数组 JSON
 * const arrayJson = '[1, 2, 3, 4, 5]';
 * console.log(isJSON(arrayJson)); // 输出: true
 *
 * // 检查基本类型 JSON
 * const stringJson = '"hello world"';
 * console.log(isJSON(stringJson)); // 输出: true
 *
 * // 检查无效 JSON 字符串
 * const invalidJson = '{name: John, age: 30}'; // 缺少引号
 * console.log(isJSON(invalidJson)); // 输出: false
 *
 * // 检查非字符串类型
 * console.log(isJSON(123)); // 输出: false
 * console.log(isJSON({})); // 输出: false
 * console.log(isJSON(null)); // 输出: false
 * console.log(isJSON(undefined)); // 输出: false
 *
 * // 检查空字符串
 * console.log(isJSON('')); // 输出: false
 *
 * // 在条件判断中使用
 * if (isJSON(input)) {
 *   const data = JSON.parse(input);
 *   console.log('解析后的数据:', data);
 * }
 *
 * // 在数据验证中使用
 * function validateJsonInput(input: unknown) {
 *   if (isJSON(input)) {
 *     return JSON.parse(input);
 *   }
 *   throw new Error('输入不是有效的 JSON 字符串');
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isJSON(input: unknown): boolean {
	// 检查输入是否为字符串类型
	if (typeof input !== 'string') return false;
	
	// 尝试解析 JSON 字符串
	try {
		JSON.parse(input);
		return true;
	} catch {
		// 解析失败返回 false
		return false;
	}
}
