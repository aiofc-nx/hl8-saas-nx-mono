/**
 * 检查字符串是否匹配指定的正则表达式模式
 *
 * 使用正则表达式测试字符串是否匹配指定的模式。
 * 提供灵活的模式匹配功能，适用于数据验证、格式检查等场景。
 *
 * @description 此函数提供了一种简单而有效的方式来检查字符串模式匹配。
 * 使用正则表达式的 test 方法进行模式匹配，确保检查的准确性和性能。
 * 适用于数据验证、格式检查、模式识别等场景。
 *
 * ## 业务规则
 *
 * ### 模式匹配规则
 * - 使用正则表达式的 test 方法
 * - 支持所有正则表达式特性
 * - 包括标志位（如 i、g、m）
 * - 保持模式的一致性
 *
 * ### 输入验证规则
 * - 输入必须是字符串类型
 * - 模式必须是正则表达式
 * - 支持 Unicode 字符
 * - 处理特殊字符
 *
 * ### 返回值规则
 * - 匹配成功返回 true
 * - 匹配失败返回 false
 * - 保持布尔值的一致性
 * - 不进行类型转换
 *
 * ### 性能规则
 * - 使用原生正则表达式方法
 * - 避免重复编译正则表达式
 * - 支持高并发场景
 * - 保持性能效率
 *
 * @param value - 要测试的字符串
 * @param pattern - 要匹配的正则表达式模式
 * @returns 如果字符串匹配模式则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 基本用法：检查邮箱格式
 * const isEmail = matchPattern("test@example.com", /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
 * console.log(isEmail); // 输出: true
 *
 * // 检查无效邮箱
 * const isInvalidEmail = matchPattern("invalid-email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
 * console.log(isInvalidEmail); // 输出: false
 *
 * // 检查手机号码格式
 * const isPhone = matchPattern("13812345678", /^1[3-9]\d{9}$/);
 * console.log(isPhone); // 输出: true
 *
 * // 检查身份证号码格式
 * const isIdCard = matchPattern("110101199001011234", /^\d{17}[\dXx]$/);
 * console.log(isIdCard); // 输出: true
 *
 * // 检查密码强度
 * const isStrongPassword = matchPattern("MyPass123!", /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
 * console.log(isStrongPassword); // 输出: true
 *
 * // 检查 URL 格式
 * const isUrl = matchPattern("https://www.example.com", /^https?:\/\/.+/);
 * console.log(isUrl); // 输出: true
 *
 * // 在数据验证中使用
 * function validateEmail(email: string): boolean {
 *   const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *   return matchPattern(email, emailPattern);
 * }
 *
 * // 在表单验证中使用
 * function validatePhone(phone: string): boolean {
 *   const phonePattern = /^1[3-9]\d{9}$/;
 *   return matchPattern(phone, phonePattern);
 * }
 *
 * // 检查多个模式
 * function validateInput(input: string): boolean {
 *   const patterns = [
 *     /^[a-zA-Z0-9]+$/, // 只包含字母和数字
 *     /^.{6,}$/, // 至少 6 个字符
 *     /^[A-Z]/, // 以大写字母开头
 *   ];
 *   return patterns.every(pattern => matchPattern(input, pattern));
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function matchPattern(value: string, pattern: RegExp): boolean {
	// 使用正则表达式的 test 方法进行模式匹配
	return pattern.test(value);
}
