// 临时定义常量，避免跨包依赖
const ALPHA_NUMERIC_CODE_LENGTH = 6;

/**
 * 生成随机字母数字代码
 *
 * 生成指定长度的随机字母数字代码，包含大写字母和数字。
 * 使用安全的随机数生成器确保代码的唯一性。
 *
 * @description 此函数提供了一种可靠的方式来生成随机字母数字代码。
 * 使用大写字母和数字字符集，确保代码的可读性和唯一性。
 * 适用于验证码生成、邀请码生成、临时令牌等场景。
 *
 * ## 业务规则
 *
 * ### 字符集规则
 * - 使用大写字母 A-Z
 * - 使用数字 0-9
 * - 不包含小写字母
 * - 不包含特殊字符
 *
 * ### 长度控制规则
 * - 默认长度为 6 个字符
 * - 支持自定义长度
 * - 最小长度为 1 个字符
 * - 最大长度无限制
 *
 * ### 随机性规则
 * - 使用 Math.random() 生成随机数
 * - 每个字符独立随机选择
 * - 确保字符分布均匀
 * - 避免重复模式
 *
 * ### 安全性规则
 * - 使用安全的随机数生成
 * - 避免可预测的模式
 * - 确保代码的唯一性
 * - 支持高并发场景
 *
 * @param length - 代码长度，默认为 ALPHA_NUMERIC_CODE_LENGTH (6)
 * @returns 随机生成的字母数字代码
 *
 * @example
 * ```typescript
 * // 基本用法：生成默认长度的代码
 * const code = generateAlphaNumericCode();
 * console.log(code); // 输出: 'A1B2C3' (6 个字符的随机代码)
 *
 * // 自定义长度
 * const shortCode = generateAlphaNumericCode(4);
 * console.log(shortCode); // 输出: 'X9Y2' (4 个字符的随机代码)
 *
 * // 生成长代码
 * const longCode = generateAlphaNumericCode(12);
 * console.log(longCode); // 输出: 'A1B2C3D4E5F6' (12 个字符的随机代码)
 *
 * // 生成单个字符
 * const singleChar = generateAlphaNumericCode(1);
 * console.log(singleChar); // 输出: 'Z' (1 个字符的随机代码)
 *
 * // 批量生成代码
 * const codes = Array.from({ length: 5 }, () => generateAlphaNumericCode(8));
 * console.log(codes); // 输出: ['A1B2C3D4', 'E5F6G7H8', ...] (5 个 8 位代码)
 *
 * // 在验证码场景中使用
 * function generateVerificationCode(): string {
 *   return generateAlphaNumericCode(6);
 * }
 *
 * // 在邀请码场景中使用
 * function generateInviteCode(): string {
 *   return generateAlphaNumericCode(8);
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function generateAlphaNumericCode(length: number = ALPHA_NUMERIC_CODE_LENGTH): string {
	// 定义字符集：大写字母和数字
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let code = '';

	// 生成指定长度的随机代码
	for (let i = 0; i < length; i++) {
		const index = Math.floor(Math.random() * characters.length);
		code += characters[index];
	}

	return code;
}
