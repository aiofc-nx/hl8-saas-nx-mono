/**
 * 将字符串转换为短横线命名格式
 *
 * 将输入字符串转换为短横线命名格式（kebab-case），处理各种分隔符和格式。
 * 支持驼峰命名、下划线命名、空格分隔等多种输入格式。
 *
 * @description 此函数提供了一种标准化的方式来生成短横线命名格式的字符串。
 * 自动处理各种分隔符（空格、下划线、驼峰命名等），确保输出符合短横线命名规范。
 * 适用于 CSS 类名、HTML 属性、文件名等场景。
 *
 * ## 业务规则
 *
 * ### 驼峰命名处理规则
 * - 检测小写字母后跟大写字母的模式
 * - 在小写字母和大写字母之间插入短横线
 * - 保持原始字符不变
 * - 处理连续的大写字母
 *
 * ### 分隔符处理规则
 * - 空格替换为短横线
 * - 下划线替换为短横线
 * - 处理连续的分隔符
 * - 去除首尾空白字符
 *
 * ### 输出格式规则
 * - 全部转换为小写字母
 * - 使用短横线作为分隔符
 * - 不包含空格或下划线
 * - 保持数字字符不变
 *
 * @param str - 要转换的字符串
 * @returns 转换后的短横线格式字符串
 *
 * @example
 * ```typescript
 * // 基本用法：转换驼峰命名
 * const camelCase = 'helloWorld';
 * const kebab = kebabCase(camelCase);
 * console.log(kebab); // 输出: 'hello-world'
 *
 * // 转换下划线格式
 * const snakeCase = 'hello_world';
 * const kebab2 = kebabCase(snakeCase);
 * console.log(kebab2); // 输出: 'hello-world'
 *
 * // 转换空格分隔格式
 * const spaceCase = 'hello world';
 * const kebab3 = kebabCase(spaceCase);
 * console.log(kebab3); // 输出: 'hello-world'
 *
 * // 处理复杂格式
 * const complex = 'helloWorld_test case';
 * const kebab4 = kebabCase(complex);
 * console.log(kebab4); // 输出: 'hello-world-test-case'
 *
 * // 处理连续大写字母
 * const consecutive = 'XMLHttpRequest';
 * const kebab5 = kebabCase(consecutive);
 * console.log(kebab5); // 输出: 'xml-http-request'
 *
 * // 处理数字
 * const withNumbers = 'helloWorld123';
 * const kebab6 = kebabCase(withNumbers);
 * console.log(kebab6); // 输出: 'hello-world123'
 *
 * // 处理混合格式
 * const mixed = 'hello_world-test case';
 * const kebab7 = kebabCase(mixed);
 * console.log(kebab7); // 输出: 'hello-world-test-case'
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const kebabCase = (str: string): string =>
	str
		.replace(/([a-z])([A-Z])/g, '$1-$2') // 在小写字母和大写字母之间插入短横线
		.replace(/[\s_]+/g, '-') // 将空格和下划线替换为短横线
		.toLowerCase(); // 转换为小写字母
