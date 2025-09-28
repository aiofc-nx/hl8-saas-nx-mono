/**
 * 将输入值转换为布尔值
 *
 * 将各种类型的输入值转换为布尔值，支持字符串、数字、布尔值等多种类型。
 * 提供灵活的类型转换功能，适用于数据解析、配置处理等场景。
 *
 * @description 此函数提供了一种全面的方式来将各种类型的值转换为布尔值。
 * 支持字符串、数字、布尔值、null、undefined 等多种类型的转换。
 * 适用于数据解析、配置处理、表单处理等场景。
 *
 * ## 业务规则
 *
 * ### 空值处理规则
 * - undefined 转换为 false
 * - null 转换为 false
 * - 保持空值的逻辑一致性
 * - 避免类型错误
 *
 * ### 布尔值处理规则
 * - 布尔值直接返回
 * - 不进行类型转换
 * - 保持原始值
 * - 确保类型安全
 *
 * ### 数字处理规则
 * - 0 转换为 false
 * - 非 0 数字转换为 true
 * - 包括负数和小数
 * - 保持数值逻辑
 *
 * ### 字符串处理规则
 * - 'true' 和 '1' 转换为 true
 * - 'false' 和 '0' 转换为 false
 * - 不区分大小写
 * - 去除首尾空白字符
 * - 其他字符串转换为 false
 *
 * ### 默认处理规则
 * - 不支持的类型返回 false
 * - 保持函数稳定性
 * - 避免异常抛出
 * - 确保类型安全
 *
 * @param value - 要转换为布尔值的输入值
 * @returns 转换后的布尔值
 *
 * @example
 * ```typescript
 * // 基本用法：转换字符串
 * console.log(parseToBoolean('true')); // 输出: true
 * console.log(parseToBoolean('false')); // 输出: false
 * console.log(parseToBoolean('1')); // 输出: true
 * console.log(parseToBoolean('0')); // 输出: false
 *
 * // 处理大小写
 * console.log(parseToBoolean('TRUE')); // 输出: true
 * console.log(parseToBoolean('False')); // 输出: false
 *
 * // 处理空白字符
 * console.log(parseToBoolean(' true ')); // 输出: true
 * console.log(parseToBoolean(' false ')); // 输出: false
 *
 * // 处理数字
 * console.log(parseToBoolean(1)); // 输出: true
 * console.log(parseToBoolean(0)); // 输出: false
 * console.log(parseToBoolean(-1)); // 输出: true
 * console.log(parseToBoolean(3.14)); // 输出: true
 *
 * // 处理布尔值
 * console.log(parseToBoolean(true)); // 输出: true
 * console.log(parseToBoolean(false)); // 输出: false
 *
 * // 处理空值
 * console.log(parseToBoolean(null)); // 输出: false
 * console.log(parseToBoolean(undefined)); // 输出: false
 *
 * // 处理其他类型
 * console.log(parseToBoolean('hello')); // 输出: false
 * console.log(parseToBoolean({})); // 输出: false
 * console.log(parseToBoolean([])); // 输出: false
 *
 * // 在配置处理中使用
 * function getConfigValue(key: string, defaultValue: any): boolean {
 *   const value = process.env[key] || defaultValue;
 *   return parseToBoolean(value);
 * }
 *
 * // 在表单处理中使用
 * function processFormData(data: Record<string, any>): Record<string, boolean> {
 *   const result: Record<string, boolean> = {};
 *   for (const [key, value] of Object.entries(data)) {
 *     result[key] = parseToBoolean(value);
 *   }
 *   return result;
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const parseToBoolean = (value: any): boolean => {
	// 处理空值
	if (value === undefined || value === null) {
		return false;
	}

	// 处理布尔值
	if (typeof value === 'boolean') {
		return value;
	}

	// 处理数字
	if (typeof value === 'number') {
		return value !== 0;
	}

	// 处理字符串
	if (typeof value === 'string') {
		const normalized = value.toLowerCase().trim();
		if (normalized === 'true' || normalized === '1') {
			return true;
		}
		if (normalized === 'false' || normalized === '0') {
			return false;
		}
	}

	// 默认返回 false
	return false;
};
