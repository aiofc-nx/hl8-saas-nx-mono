/**
 * 将字符串首字母大写
 *
 * 将输入字符串的首字母转换为大写，支持强制转换其余字母为小写。
 * 提供灵活的字符串首字母大写功能。
 *
 * @description 此函数提供了一种简单而有效的方式来处理字符串首字母大写。
 * 支持强制转换模式，确保输出格式的一致性。
 * 适用于标题格式化、名称处理、文本标准化等场景。
 *
 * ## 业务规则
 *
 * ### 首字母处理规则
 * - 检测字符串开头的字母字符
 * - 将首字母转换为大写
 * - 保持非字母字符不变
 * - 处理空字符串和特殊字符
 *
 * ### 强制转换规则
 * - force 为 true 时，其余字母转换为小写
 * - force 为 false 时，保持其余字母不变
 * - 默认值为 true，确保格式一致性
 * - 不影响非字母字符
 *
 * ### 输出格式规则
 * - 首字母大写
 * - 其余字母根据 force 参数处理
 * - 保持非字母字符不变
 * - 返回新的字符串实例
 *
 * @param str - 要处理的输入字符串
 * @param force - 是否强制转换其余字母为小写，默认为 true
 * @returns 首字母大写的字符串
 *
 * @example
 * ```typescript
 * // 基本用法：首字母大写
 * const text = 'hello world';
 * const capitalized = ucFirst(text);
 * console.log(capitalized); // 输出: 'Hello world'
 *
 * // 强制转换模式
 * const mixed = 'HELLO WORLD';
 * const capitalized2 = ucFirst(mixed);
 * console.log(capitalized2); // 输出: 'Hello world'
 *
 * // 非强制转换模式
 * const mixed2 = 'HELLO WORLD';
 * const capitalized3 = ucFirst(mixed2, false);
 * console.log(capitalized3); // 输出: 'HELLO WORLD'
 *
 * // 处理已经是首字母大写的字符串
 * const alreadyCapitalized = 'Hello World';
 * const capitalized4 = ucFirst(alreadyCapitalized);
 * console.log(capitalized4); // 输出: 'Hello world'
 *
 * // 处理特殊字符
 * const special = '123hello world';
 * const capitalized5 = ucFirst(special);
 * console.log(capitalized5); // 输出: '123hello world' (数字开头不变)
 *
 * // 处理空字符串
 * const empty = '';
 * const capitalized6 = ucFirst(empty);
 * console.log(capitalized6); // 输出: ''
 *
 * // 处理单个字符
 * const single = 'a';
 * const capitalized7 = ucFirst(single);
 * console.log(capitalized7); // 输出: 'A'
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function ucFirst(str: string, force = true): string {
	// 根据 force 参数决定是否转换为小写
	str = force ? str.toLowerCase() : str;
	// 将首字母转换为大写
	return str.replace(/^([a-zA-Z])/, function (firstLetter: string) {
		return firstLetter.toUpperCase();
	});
}
