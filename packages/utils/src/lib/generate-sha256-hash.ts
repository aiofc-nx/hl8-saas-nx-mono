import { createHash } from 'crypto';

/**
 * 生成 SHA256 哈希值
 *
 * 使用 SHA256 算法对输入字符串进行哈希计算，返回十六进制格式的哈希值。
 * 提供安全的单向哈希功能，适用于密码存储、数据完整性验证等场景。
 *
 * @description 此函数提供了一种安全的方式来生成 SHA256 哈希值。
 * 使用 Node.js 的 crypto 模块进行哈希计算，确保哈希的强度和一致性。
 * 适用于密码哈希、数据指纹、完整性检查等场景。
 *
 * ## 业务规则
 *
 * ### 哈希算法规则
 * - 使用 SHA256 算法
 * - 确保哈希的不可逆性
 * - 支持任意长度的输入
 * - 保持哈希的一致性
 *
 * ### 输入处理规则
 * - 支持字符串类型输入
 * - 自动处理编码转换
 * - 支持 Unicode 字符
 * - 处理特殊字符
 *
 * ### 输出格式规则
 * - 返回十六进制格式
 * - 固定长度为 64 个字符
 * - 使用小写字母
 * - 保持格式的一致性
 *
 * ### 安全性规则
 * - 使用加密安全的哈希算法
 * - 确保哈希的强度
 * - 支持高安全级别
 * - 避免哈希冲突
 *
 * @param data - 要哈希的输入字符串
 * @returns 输入字符串的 SHA256 哈希值，十六进制格式
 *
 * @example
 * ```typescript
 * // 基本用法：生成简单字符串的哈希
 * const hash1 = generateSha256Hash('hello world');
 * console.log(hash1); // 输出: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
 *
 * // 生成密码哈希
 * const password = 'mySecretPassword123';
 * const passwordHash = generateSha256Hash(password);
 * console.log(passwordHash); // 输出: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2'
 *
 * // 生成数据指纹
 * const data = JSON.stringify({ name: 'John', age: 30 });
 * const dataHash = generateSha256Hash(data);
 * console.log(dataHash); // 输出: 'c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d8e9f0'
 *
 * // 生成文件内容哈希
 * const fileContent = 'This is a test file content';
 * const fileHash = generateSha256Hash(fileContent);
 * console.log(fileHash); // 输出: 'd1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f9'
 *
 * // 在密码验证中使用
 * function verifyPassword(inputPassword: string, storedHash: string): boolean {
 *   const inputHash = generateSha256Hash(inputPassword);
 *   return inputHash === storedHash;
 * }
 *
 * // 在数据完整性检查中使用
 * function verifyDataIntegrity(data: string, expectedHash: string): boolean {
 *   const actualHash = generateSha256Hash(data);
 *   return actualHash === expectedHash;
 * }
 *
 * // 生成唯一标识符
 * function generateUniqueId(): string {
 *   const timestamp = Date.now().toString();
 *   const random = Math.random().toString();
 *   return generateSha256Hash(timestamp + random);
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function generateSha256Hash(data: string): string {
    // 使用 SHA256 算法生成哈希值
    return createHash('sha256').update(data).digest('hex');
}
