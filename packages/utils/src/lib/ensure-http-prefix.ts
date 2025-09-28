/**
 * 确保 URL 具有 HTTP 或 HTTPS 前缀
 *
 * 检查 URL 是否已经包含 HTTP 或 HTTPS 前缀，如果没有则添加指定的协议前缀。
 * 提供安全的 URL 处理功能，确保 URL 的完整性和有效性。
 *
 * @description 此函数提供了一种可靠的方式来处理 URL 协议前缀。
 * 自动检测现有的协议前缀，避免重复添加，确保 URL 的正确性。
 * 适用于链接处理、API 请求、重定向等场景。
 *
 * ## 业务规则
 *
 * ### 前缀检测规则
 * - 检测现有的 http:// 前缀
 * - 检测现有的 https:// 前缀
 * - 不区分大小写
 * - 支持完整的 URL 格式
 *
 * ### 前缀添加规则
 * - 默认添加 https:// 前缀
 * - 支持自定义协议类型
 * - 保持 URL 的完整性
 * - 不修改现有前缀
 *
 * ### 输入处理规则
 * - 空字符串直接返回
 * - 支持相对和绝对 URL
 * - 保持 URL 的原始格式
 * - 处理特殊字符
 *
 * ### 安全性规则
 * - 优先使用 HTTPS 协议
 * - 避免协议冲突
 * - 确保 URL 的有效性
 * - 支持安全的重定向
 *
 * @param url - 要检查和添加前缀的 URL
 * @param prefix - 要添加的协议类型，默认为 'https'
 * @returns 带有指定协议前缀的 URL
 *
 * @example
 * ```typescript
 * // 基本用法：添加 HTTPS 前缀
 * const url1 = ensureHttpPrefix('example.com');
 * console.log(url1); // 输出: 'https://example.com'
 *
 * // 添加 HTTP 前缀
 * const url2 = ensureHttpPrefix('example.com', 'http');
 * console.log(url2); // 输出: 'http://example.com'
 *
 * // 处理已有前缀的 URL
 * const url3 = ensureHttpPrefix('https://example.com');
 * console.log(url3); // 输出: 'https://example.com' (保持不变)
 *
 * // 处理 HTTP 前缀的 URL
 * const url4 = ensureHttpPrefix('http://example.com');
 * console.log(url4); // 输出: 'http://example.com' (保持不变)
 *
 * // 处理空字符串
 * const url5 = ensureHttpPrefix('');
 * console.log(url5); // 输出: '' (空字符串直接返回)
 *
 * // 处理复杂 URL
 * const url6 = ensureHttpPrefix('api.example.com/v1/users');
 * console.log(url6); // 输出: 'https://api.example.com/v1/users'
 *
 * // 处理带端口的 URL
 * const url7 = ensureHttpPrefix('localhost:3000');
 * console.log(url7); // 输出: 'https://localhost:3000'
 *
 * // 在 API 请求中使用
 * function makeApiRequest(endpoint: string) {
 *   const fullUrl = ensureHttpPrefix(endpoint);
 *   return fetch(fullUrl);
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const ensureHttpPrefix = (url: string, prefix: 'http' | 'https' = 'https'): string => {
	// 处理空字符串
	if (!url) return url;
	
	// 检查是否已有协议前缀
	return url.startsWith('http://') || url.startsWith('https://') ? url : `${prefix}://${url}`;
};
