import { ucFirst } from './uc-first';

/**
 * 从电子邮件地址中提取名称部分并首字母大写
 *
 * 从电子邮件地址中提取 @ 符号前的名称部分，并将首字母转换为大写。
 * 提供简单的用户名称提取功能，适用于用户界面显示。
 *
 * @description 此函数提供了一种简单的方式来从电子邮件地址中提取用户名称。
 * 使用 lastIndexOf 方法查找最后一个 @ 符号，确保处理复杂邮件格式。
 * 适用于用户界面、个人资料、显示名称等场景。
 *
 * ## 业务规则
 *
 * ### 邮件格式处理规则
 * - 查找最后一个 @ 符号
 * - 提取 @ 符号前的所有字符
 * - 支持复杂的邮件格式
 * - 处理多个 @ 符号的情况
 *
 * ### 名称提取规则
 * - 提取完整的用户名部分
 * - 保持原始字符不变
 * - 支持数字和特殊字符
 * - 处理空字符串
 *
 * ### 首字母大写规则
 * - 使用 ucFirst 函数处理
 * - 保持其他字符不变
 * - 处理特殊字符开头
 * - 确保可读性
 *
 * ### 错误处理规则
 * - 空字符串返回空字符串
 * - 无效邮件格式返回空字符串
 * - 不抛出异常
 * - 保持函数稳定性
 *
 * @param email - 要提取名称的电子邮件地址
 * @returns 提取的名称，首字母大写，如果未找到有效名称则返回空字符串
 *
 * @example
 * ```typescript
 * // 基本用法：提取简单邮件名称
 * const name1 = extractNameFromEmail('johndoe@example.com');
 * console.log(name1); // 输出: 'Johndoe'
 *
 * // 提取包含数字的名称
 * const name2 = extractNameFromEmail('user123@domain.com');
 * console.log(name2); // 输出: 'User123'
 *
 * // 处理空字符串
 * const name3 = extractNameFromEmail('');
 * console.log(name3); // 输出: ''
 *
 * // 处理复杂邮件格式
 * const name4 = extractNameFromEmail('john.doe+tag@example.com');
 * console.log(name4); // 输出: 'John.doe+tag'
 *
 * // 处理多个 @ 符号
 * const name5 = extractNameFromEmail('user@domain@example.com');
 * console.log(name5); // 输出: 'User@domain'
 *
 * // 处理特殊字符
 * const name6 = extractNameFromEmail('user_name-123@example.com');
 * console.log(name6); // 输出: 'User_name-123'
 *
 * // 在用户界面中使用
 * function displayUserName(email: string) {
 *   const name = extractNameFromEmail(email);
 *   return name || 'Unknown User';
 * }
 *
 * // 处理无效邮件格式
 * const name7 = extractNameFromEmail('invalid-email');
 * console.log(name7); // 输出: 'Invalid-email'
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function extractNameFromEmail(email: string): string {
	// 检查邮件地址是否有效
	if (email) {
		// 提取 @ 符号前的名称部分
		const namePart = email.substring(0, email.lastIndexOf('@'));
		// 将首字母转换为大写
		return ucFirst(namePart);
	}
	// 空字符串返回空字符串
	return '';
}
