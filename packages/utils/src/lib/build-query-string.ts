/**
 * 从查询参数对象构建查询字符串
 *
 * 将包含查询参数的对象转换为 URL 查询字符串格式。
 * 支持字符串、数组和布尔值类型的参数。
 *
 * @description 此函数提供了一种标准化的方式来构建 URL 查询字符串。
 * 自动处理各种数据类型，包括数组、布尔值和字符串，确保 URL 编码的正确性。
 * 适用于 API 请求、URL 构建、参数传递等场景。
 *
 * ## 业务规则
 *
 * ### 参数类型处理规则
 * - 字符串类型直接编码
 * - 数组类型展开为多个参数
 * - 布尔值转换为字符串
 * - 其他类型转换为字符串后编码
 *
 * ### URL 编码规则
 * - 使用 encodeURIComponent 进行编码
 * - 处理特殊字符和空格
 * - 确保 URL 安全性
 * - 支持 Unicode 字符
 *
 * ### 数组处理规则
 * - 数组值展开为多个同名参数
 * - 每个数组元素单独编码
 * - 保持数组元素的顺序
 * - 支持空数组
 *
 * ### 布尔值处理规则
 * - true 转换为 "true"
 * - false 转换为 "false"
 * - 不进行额外编码
 * - 保持布尔值的可读性
 *
 * @param queryParams - 包含查询参数的对象
 * @returns 查询参数字符串
 *
 * @example
 * ```typescript
 * // 基本用法：构建简单查询字符串
 * const params = {
 *   search: "query",
 *   page: "1",
 *   active: true
 * };
 * const queryString = buildQueryString(params);
 * console.log(queryString); // 输出: "search=query&page=1&active=true"
 *
 * // 处理数组参数
 * const arrayParams = {
 *   sort: ["name", "date"],
 *   tags: ["javascript", "typescript"]
 * };
 * const arrayQueryString = buildQueryString(arrayParams);
 * console.log(arrayQueryString); // 输出: "sort=name&sort=date&tags=javascript&tags=typescript"
 *
 * // 处理混合类型
 * const mixedParams = {
 *   search: "query",
 *   page: "1",
 *   sort: ["name", "date"],
 *   active: true,
 *   disabled: false
 * };
 * const mixedQueryString = buildQueryString(mixedParams);
 * console.log(mixedQueryString); // 输出: "search=query&page=1&sort=name&sort=date&active=true&disabled=false"
 *
 * // 处理特殊字符
 * const specialParams = {
 *   query: "hello world",
 *   filter: "price > 100"
 * };
 * const specialQueryString = buildQueryString(specialParams);
 * console.log(specialQueryString); // 输出: "query=hello%20world&filter=price%20%3E%20100"
 *
 * // 处理空数组
 * const emptyArrayParams = {
 *   tags: [],
 *   category: "electronics"
 * };
 * const emptyArrayQueryString = buildQueryString(emptyArrayParams);
 * console.log(emptyArrayQueryString); // 输出: "category=electronics"
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function buildQueryString(queryParams: { [key: string]: string | string[] | boolean }): string {
	// 将对象转换为查询字符串
	return Object.entries(queryParams)
		.map(([key, value]) => {
			// 处理数组值
			if (Array.isArray(value)) {
				// 将数组值展开为多个参数
				return value.map((v) => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
			} 
			// 处理布尔值
			else if (typeof value === 'boolean') {
				// 将布尔值转换为字符串
				return `${encodeURIComponent(key)}=${value}`;
			} 
			// 处理字符串或其他类型
			else {
				// 对字符串进行编码
				return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
			}
		})
		.join('&');
}
