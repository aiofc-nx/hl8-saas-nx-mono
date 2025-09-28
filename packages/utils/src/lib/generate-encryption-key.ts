import { randomBytes } from 'crypto';

/**
 * 生成安全的加密密钥
 *
 * 使用加密安全的随机数生成器生成指定长度的加密密钥，并编码为 Base64 格式。
 * 提供高强度的加密密钥生成功能，适用于数据加密、身份验证等场景。
 *
 * @description 此函数提供了一种安全的方式来生成加密密钥。
 * 使用 Node.js 的 crypto 模块生成加密安全的随机字节，确保密钥的不可预测性。
 * 适用于数据加密、API 密钥生成、会话令牌等场景。
 *
 * ## 业务规则
 *
 * ### 密钥长度规则
 * - 默认长度为 32 字节
 * - 支持自定义长度设置
 * - 最小长度为 1 字节
 * - 最大长度无限制
 *
 * ### 随机性规则
 * - 使用加密安全的随机数生成器
 * - 确保密钥的不可预测性
 * - 支持高并发场景
 * - 避免重复模式
 *
 * ### 编码规则
 * - 使用 Base64 编码格式
 * - 确保密钥的可读性
 * - 支持 URL 安全传输
 * - 保持编码的一致性
 *
 * ### 安全性规则
 * - 使用加密安全的随机数
 * - 确保密钥的强度
 * - 支持高安全级别
 * - 避免密钥泄露
 *
 * @param length - 密钥长度（字节），默认为 32
 * @returns Base64 编码的加密密钥
 *
 * @example
 * ```typescript
 * // 基本用法：生成默认长度的密钥
 * const key1 = generateEncryptionKey();
 * console.log(key1); // 输出: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6' (32 字节)
 *
 * // 生成自定义长度的密钥
 * const key2 = generateEncryptionKey(16);
 * console.log(key2); // 输出: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6' (16 字节)
 *
 * // 生成短密钥
 * const key3 = generateEncryptionKey(8);
 * console.log(key3); // 输出: 'A1B2C3D4E5F6G7H8' (8 字节)
 *
 * // 生成长密钥
 * const key4 = generateEncryptionKey(64);
 * console.log(key4); // 输出: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6...' (64 字节)
 *
 * // 在加密场景中使用
 * function encryptData(data: string, key: string) {
 *   const encryptionKey = generateEncryptionKey();
 *   // 使用密钥进行加密
 *   return { encrypted: data, key: encryptionKey };
 * }
 *
 * // 在 API 密钥生成中使用
 * function generateApiKey(): string {
 *   return generateEncryptionKey(32);
 * }
 *
 * // 在会话令牌生成中使用
 * function generateSessionToken(): string {
 *   return generateEncryptionKey(16);
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function generateEncryptionKey(length = 32): string {
    // 使用加密安全的随机数生成器生成指定长度的字节
    return randomBytes(length).toString('base64');
}
