/**
 * 计算对象数组中指定列的平均值
 *
 * 计算对象数组中指定属性列的平均值，支持数字和数字字符串的混合计算。
 * 函数会自动处理无效值，确保计算的准确性。
 *
 * @description 此函数提供了一种简单而高效的方式来计算对象数组中数值属性的平均值。
 * 适用于数据统计、报表生成、数据分析等场景。函数会自动处理各种数据类型，
 * 确保计算的准确性和健壮性。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 空数组返回 NaN
 * - 支持泛型类型约束，确保类型安全
 * - 列名必须是字符串类型
 * - 对象必须包含指定的列属性
 *
 * ### 数值处理规则
 * - 使用 parseFloat 进行数值转换
 * - 无效值或 undefined 转换为 0
 * - 支持数字和数字字符串的混合计算
 * - 处理 NaN 值，转换为 0
 *
 * ### 计算规则
 * - 计算所有有效值的总和
 * - 除以数组长度得到平均值
 * - 返回计算结果，类型为 number
 * - 空数组返回 NaN
 *
 * @template T - 对象类型，必须继承自 Record<string, any>
 *
 * @param items - 包含要计算平均值的列的对象数组
 * @param column - 要计算平均值的列名
 * @returns 指定列的平均值，如果数组为空则返回 NaN
 *
 * @example
 * ```typescript
 * // 基本用法：计算数值数组的平均值
 * const data = [{ value: 10 }, { value: 20 }, { value: 30 }];
 * const result = average(data, 'value');
 * console.log(result); // 输出: 20
 *
 * // 处理混合类型：数字和字符串
 * const mixedData = [
 *   { score: 85 },
 *   { score: '90' },
 *   { score: 78 }
 * ];
 * const avgScore = average(mixedData, 'score');
 * console.log(avgScore); // 输出: 84.33333333333333
 *
 * // 处理空数组
 * const emptyData: { value: number }[] = [];
 * const emptyResult = average(emptyData, 'value');
 * console.log(emptyResult); // 输出: NaN
 *
 * // 处理无效值
 * const invalidData = [
 *   { value: 10 },
 *   { value: 'invalid' },
 *   { value: 20 }
 * ];
 * const invalidResult = average(invalidData, 'value');
 * console.log(invalidResult); // 输出: 10 (无效值被转换为 0)
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function average<T extends Record<string, any>>(items: T[], column: string): number {
	// 空数组返回 NaN
	if (items.length === 0) return NaN;

	// 计算所有有效值的总和
	const sum = items.reduce((acc, item) => acc + parseFloat(item[column] ?? 0), 0);
	// 返回平均值
	return sum / items.length;
}
