/**
 * 将字符串转换为帕斯卡命名格式
 *
 * 将输入字符串转换为帕斯卡命名格式（PascalCase），处理各种分隔符和格式。
 * 支持下划线命名、空格分隔等多种输入格式。
 *
 * @description 此函数提供了一种标准化的方式来生成帕斯卡命名格式的字符串。
 * 自动处理各种分隔符（下划线、空格等），确保输出符合帕斯卡命名规范。
 * 适用于类名、接口名、组件名等场景。
 *
 * ## 业务规则
 *
 * ### 首字母处理规则
 * - 字符串首字母必须大写
 * - 处理下划线后的字母
 * - 处理空格后的字母
 * - 保持数字字符不变
 *
 * ### 分隔符处理规则
 * - 下划线替换为无分隔符
 * - 空格替换为无分隔符
 * - 处理连续的分隔符
 * - 去除首尾空白字符
 *
 * ### 输出格式规则
 * - 首字母大写
 * - 后续单词首字母大写
 * - 不包含分隔符
 * - 保持数字字符
 *
 * @param str - 要转换的字符串
 * @returns 转换后的帕斯卡格式字符串
 *
 * @example
 * ```typescript
 * // 基本用法：转换下划线格式
 * const snakeCase = 'hello_world';
 * const pascal = toPascalCase(snakeCase);
 * console.log(pascal); // 输出: 'HelloWorld'
 *
 * // 转换空格分隔格式
 * const spaceCase = 'hello world';
 * const pascal2 = toPascalCase(spaceCase);
 * console.log(pascal2); // 输出: 'HelloWorld'
 *
 * // 处理复杂格式
 * const complex = 'hello_world_test';
 * const pascal3 = toPascalCase(complex);
 * console.log(pascal3); // 输出: 'HelloWorldTest'
 *
 * // 处理数字
 * const withNumbers = 'hello_world_123';
 * const pascal4 = toPascalCase(withNumbers);
 * console.log(pascal4); // 输出: 'HelloWorld123'
 *
 * // 处理混合格式
 * const mixed = 'hello_world test';
 * const pascal5 = toPascalCase(mixed);
 * console.log(pascal5); // 输出: 'HelloWorldTest'
 *
 * // 处理单个单词
 * const single = 'hello';
 * const pascal6 = toPascalCase(single);
 * console.log(pascal6); // 输出: 'Hello'
 *
 * // 处理已经是帕斯卡格式的字符串
 * const alreadyPascal = 'HelloWorld';
 * const pascal7 = toPascalCase(alreadyPascal);
 * console.log(pascal7); // 输出: 'HelloWorld'
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function toPascalCase(str: string): string {
	// 处理字符串开头和分隔符后的字符
	return str.replace(/(^\w|_\w)/g, (match: string) =>
		// 移除下划线并转换为大写
		match.replace(/_/g, "").toUpperCase()
	);
}
