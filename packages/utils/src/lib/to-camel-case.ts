/**
 * 将字符串转换为驼峰命名格式
 *
 * 将输入字符串转换为驼峰命名格式（camelCase），处理各种分隔符和格式。
 * 支持检测已经是驼峰格式的字符串，避免重复转换。
 *
 * @description 此函数提供了一种标准化的方式来生成驼峰命名格式的字符串。
 * 自动处理各种分隔符（空格、下划线、连字符等），确保输出符合驼峰命名规范。
 * 适用于变量命名、属性命名、函数命名等场景。
 *
 * ## 业务规则
 *
 * ### 格式检测规则
 * - 检测字符串是否已经是驼峰格式
 * - 使用正则表达式验证驼峰格式
 * - 避免对已经是驼峰格式的字符串进行转换
 * - 保持原始格式的完整性
 *
 * ### 转换规则
 * - 转换为小写字母
 * - 移除非字母数字字符
 * - 将分隔符后的字符转换为大写
 * - 保持数字字符不变
 * - 处理连续分隔符
 *
 * ### 输出格式规则
 * - 首字母小写
 * - 后续单词首字母大写
 * - 不包含分隔符
 * - 保持数字字符
 *
 * @param str - 要转换的字符串
 * @returns 转换后的驼峰格式字符串
 *
 * @example
 * ```typescript
 * // 基本用法：转换下划线格式
 * const snakeCase = 'hello_world';
 * const camelCase = toCamelCase(snakeCase);
 * console.log(camelCase); // 输出: 'helloWorld'
 *
 * // 转换连字符格式
 * const kebabCase = 'hello-world';
 * const camelCase2 = toCamelCase(kebabCase);
 * console.log(camelCase2); // 输出: 'helloWorld'
 *
 * // 转换空格分隔格式
 * const spaceCase = 'hello world';
 * const camelCase3 = toCamelCase(spaceCase);
 * console.log(camelCase3); // 输出: 'helloWorld'
 *
 * // 处理已经是驼峰格式的字符串
 * const alreadyCamel = 'helloWorld';
 * const camelCase4 = toCamelCase(alreadyCamel);
 * console.log(camelCase4); // 输出: 'helloWorld' (保持不变)
 *
 * // 处理复杂格式
 * const complex = 'hello_world-test case';
 * const camelCase5 = toCamelCase(complex);
 * console.log(camelCase5); // 输出: 'helloWorldTestCase'
 *
 * // 处理数字
 * const withNumbers = 'hello_world_123';
 * const camelCase6 = toCamelCase(withNumbers);
 * console.log(camelCase6); // 输出: 'helloWorld123'
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function toCamelCase(str: string): string {
	// 检测是否已经是驼峰格式
	return /^([a-z]+)(([A-Z]([a-z]+))+)$/.test(str)
		? str // 如果已经是驼峰格式，直接返回
		: str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()); // 否则进行转换
}
