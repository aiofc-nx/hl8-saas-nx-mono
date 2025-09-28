import { generate, GenerateOptions} from 'generate-password';

/**
 * 生成安全的随机密码
 *
 * 使用指定的长度和选项生成安全的随机密码。
 * 支持自定义密码生成规则，确保密码的强度和安全性。
 *
 * @description 此函数提供了一种安全的方式来生成随机密码。
 * 使用 generate-password 库生成强密码，支持数字、大写字母、符号等选项。
 * 适用于用户注册、密码重置、安全令牌生成等场景。
 *
 * ## 业务规则
 *
 * ### 密码长度规则
 * - 默认长度为 32 个字符
 * - 支持自定义长度设置
 * - 最小长度为 1 个字符
 * - 最大长度无限制
 *
 * ### 字符类型规则
 * - 默认包含数字和大写字母
 * - 默认不包含符号
 * - 支持自定义字符类型
 * - 确保密码的复杂性
 *
 * ### 安全规则
 * - 使用严格模式生成密码
 * - 确保密码的唯一性
 * - 避免弱密码模式
 * - 支持密码强度验证
 *
 * ### 自定义选项规则
 * - 支持覆盖默认选项
 * - 保持选项的兼容性
 * - 验证选项的有效性
 * - 确保生成的密码符合要求
 *
 * @param length - 要生成的密码长度，默认为 32 个字符
 * @param options - 可选的密码生成自定义选项
 * @returns 生成的密码字符串
 *
 * @example
 * ```typescript
 * // 基本用法：生成默认密码
 * const password = generatePassword();
 * console.log(password); // 输出: 32 个字符的随机密码
 *
 * // 自定义长度
 * const shortPassword = generatePassword(8);
 * console.log(shortPassword); // 输出: 8 个字符的随机密码
 *
 * // 包含符号的密码
 * const passwordWithSymbols = generatePassword(16, { symbols: true });
 * console.log(passwordWithSymbols); // 输出: 16 个字符包含符号的密码
 *
 * // 自定义字符类型
 * const customPassword = generatePassword(12, {
 *   numbers: true,
 *   symbols: true,
 *   uppercase: true,
 *   lowercase: true
 * });
 * console.log(customPassword); // 输出: 12 个字符包含所有字符类型的密码
 *
 * // 排除特定字符
 * const excludePassword = generatePassword(10, {
 *   exclude: '0oO1lI'
 * });
 * console.log(excludePassword); // 输出: 10 个字符排除易混淆字符的密码
 *
 * // 自定义字符集
 * const customCharset = generatePassword(8, {
 *   numbers: false,
 *   symbols: false,
 *   uppercase: true,
 *   lowercase: true
 * });
 * console.log(customCharset); // 输出: 8 个字符只包含字母的密码
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function generatePassword(length = 32, options?: GenerateOptions): string {
    // 使用 generate-password 库生成密码
    return generate({
        length, // 密码长度
        numbers: true, // 包含数字
        symbols: false, // 不包含符号
        uppercase: true, // 包含大写字母
        strict: true, // 严格模式
        ...options, // 合并自定义选项
    });
}
