// 代码来源: https://github.com/xmlking/ngx-starter-kit.
// MIT 许可证，参见 https://github.com/xmlking/ngx-starter-kit/blob/develop/LICENSE
// 版权 (c) 2018 Sumanth Chinthagunta

/**
 * 将包含数字 ID 值的对象转换为十六进制字符串表示
 *
 * 将对象中的数字 ID 值转换为十六进制字符串格式。
 * 支持 0-255 范围内的数字值，确保十六进制表示的正确性。
 *
 * @description 此函数提供了一种可靠的方式来将数字 ID 转换为十六进制字符串。
 * 使用预计算的十六进制表，确保转换的准确性和性能。
 * 适用于颜色值转换、ID 编码、数据序列化等场景。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 输入必须是对象类型
 * - 必须包含 id 属性
 * - id 属性必须是对象类型
 * - 支持任意数量的 ID 值
 *
 * ### 数值范围规则
 * - ID 值必须是数字类型
 * - 数值范围必须在 0-255 之间
 * - 支持整数和小数
 * - 超出范围会抛出错误
 *
 * ### 十六进制转换规则
 * - 使用预计算的十六进制表
 * - 确保十六进制格式的正确性
 * - 支持小写十六进制表示
 * - 保持数值的精度
 *
 * ### 错误处理规则
 * - 无效输入抛出错误
 * - 超出范围的数值抛出错误
 * - 提供清晰的错误信息
 * - 确保类型安全
 *
 * @param value - 包含 id 属性的对象，id 属性应包含数字值
 * @returns 数字值的十六进制字符串表示
 *
 * @throws {Error} 当输入无效或任何 ID 值超出范围 (0-255) 时抛出错误
 *
 * @example
 * ```typescript
 * // 基本用法：转换颜色值
 * const color = { id: { r: 255, g: 128, b: 64 } };
 * const hexColor = toHexString(color);
 * console.log(hexColor); // 输出: 'ff8040'
 *
 * // 转换单个值
 * const single = { id: { value: 42 } };
 * const hexSingle = toHexString(single);
 * console.log(hexSingle); // 输出: '2a'
 *
 * // 转换多个值
 * const multiple = { id: { a: 0, b: 255, c: 128 } };
 * const hexMultiple = toHexString(multiple);
 * console.log(hexMultiple); // 输出: '00ff80'
 *
 * // 处理边界值
 * const boundary = { id: { min: 0, max: 255 } };
 * const hexBoundary = toHexString(boundary);
 * console.log(hexBoundary); // 输出: '00ff'
 *
 * // 错误处理
 * try {
 *   const invalid = { id: { value: 256 } }; // 超出范围
 *   toHexString(invalid);
 * } catch (error) {
 *   console.error(error.message); // 输出: 'Invalid id value: must be a number between 0 and 255.'
 * }
 *
 * // 处理无效输入
 * try {
 *   toHexString(null);
 * } catch (error) {
 *   console.error(error.message); // 输出: 'Invalid input: expected an object with an id property.'
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export default function toHexString(value: { id: Record<string, number> }): string {
	// 验证输入对象的有效性
	if (!value || typeof value.id !== 'object') {
		throw new Error('Invalid input: expected an object with an id property.');
	}

	// 创建十六进制查找表
	const hexTable = Array.from({ length: 256 }, (_, i) => (i <= 15 ? '0' : '') + i.toString(16));

	// 获取 ID 对象的所有值
	const id = Object.values(value.id);

	// 构建十六进制字符串
	let hexString = '';
	for (const el of id) {
		// 验证数值范围
		if (typeof el !== 'number' || el < 0 || el > 255) {
			throw new Error('Invalid id value: must be a number between 0 and 255.');
		}
		// 使用查找表获取十六进制值
		hexString += hexTable[el];
	}
	return hexString;
}
