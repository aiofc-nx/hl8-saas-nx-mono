/**
 * 获取工具包版本号
 *
 * 从 package.json 文件中获取工具包的版本号。
 * 提供安全的版本号获取功能，处理文件读取异常。
 *
 * @description 此函数提供了一种可靠的方式来获取工具包的版本号。
 * 使用 require 动态加载 package.json 文件，确保版本号获取的准确性。
 * 适用于版本检查、日志记录、调试信息等场景。
 *
 * ## 业务规则
 *
 * ### 文件读取规则
 * - 从相对路径读取 package.json 文件
 * - 使用 require 动态加载
 * - 处理文件不存在的情况
 * - 处理文件格式错误的情况
 *
 * ### 异常处理规则
 * - 捕获文件读取异常
 * - 记录错误信息到控制台
 * - 返回 undefined 表示失败
 * - 不抛出异常
 *
 * ### 返回值规则
 * - 成功时返回版本号字符串
 * - 失败时返回 undefined
 * - 版本号格式遵循语义化版本规范
 * - 支持预发布版本和构建元数据
 *
 * @returns 如果成功获取版本号则返回版本号字符串，否则返回 undefined
 *
 * @example
 * ```typescript
 * // 基本用法：获取版本号
 * const version = getUtilsVersion();
 * console.log(version); // 输出: '1.0.0' 或 undefined
 *
 * // 在条件判断中使用
 * if (getUtilsVersion()) {
 *   console.log('工具包版本:', getUtilsVersion());
 * } else {
 *   console.log('无法获取版本号');
 * }
 *
 * // 在日志记录中使用
 * function logVersion() {
 *   const version = getUtilsVersion();
 *   if (version) {
 *     console.log(`工具包版本: ${version}`);
 *   } else {
 *     console.warn('无法获取工具包版本');
 *   }
 * }
 *
 * // 在错误处理中使用
 * function handleVersionError() {
 *   try {
 *     const version = getUtilsVersion();
 *     if (!version) {
 *       throw new Error('版本号获取失败');
 *     }
 *     return version;
 *   } catch (error) {
 *     console.error('版本号处理错误:', error);
 *     return 'unknown';
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const getUtilsVersion = (): string | undefined => {
	try {
		// 从 package.json 文件获取版本号
		return require('../../package.json').version;
	} catch (error) {
		// 记录错误信息并返回 undefined
		console.error(`Error retrieving version from package.json:`, error);
		return undefined;
	}
};
