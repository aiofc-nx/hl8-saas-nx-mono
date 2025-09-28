/**
 * 数组求和函数
 *
 * 对两个数值进行求和运算，支持数字类型和数字字符串的混合计算。
 * 此函数专门设计用于数组的 reduce 操作，能够优雅地处理各种输入类型。
 *
 * @description 此函数是专门为数组 reduce 操作设计的求和函数，能够处理数字、
 * 数字字符串和 undefined 值。函数会自动进行类型转换，确保计算的准确性。
 * 适用于数组求和、数值累加、数据统计等场景。
 *
 * ## 业务规则
 *
 * ### 输入处理规则
 * - 数字类型直接参与计算
 * - 数字字符串通过 parseFloat 转换为数字
 * - undefined 或 null 值默认为 0
 * - 无效字符串转换为 0
 * - 支持默认参数，未传参数时默认为 0
 *
 * ### 数值转换规则
 * - 使用 parseFloat 进行字符串到数字的转换
 * - 转换失败时返回 0，不抛出异常
 * - 保持数值精度，支持小数运算
 * - 处理 NaN 值，转换为 0
 *
 * ### 计算规则
 * - 执行标准的数值加法运算
 * - 返回计算结果，类型为 number
 * - 支持正数、负数、小数的混合运算
 * - 保持数值的精度和准确性
 *
 * @param a - 第一个数值，支持数字、数字字符串或 undefined
 * @param b - 第二个数值，支持数字、数字字符串或 undefined
 * @returns 两个数值的和，类型为 number
 *
 * @example
 * ```typescript
 * // 直接使用求和函数
 * const result = ArraySum("3.5", 4.5);
 * console.log(result); // 输出: 8
 *
 * // 在 reduce 中使用求和函数
 * const values = [{ duration: '3.5' }, { duration: 4.5 }, { duration: '2' }];
 * const durations = values.map(item => item.duration);
 * const totalDuration = durations.reduce(ArraySum, 0);
 * console.log(totalDuration); // 输出: 10
 *
 * // 处理混合类型
 * const mixedResult = ArraySum(10, "5.5");
 * console.log(mixedResult); // 输出: 15.5
 *
 * // 处理无效输入
 * const invalidResult = ArraySum("invalid", undefined);
 * console.log(invalidResult); // 输出: 0
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const ArraySum = (a = 0, b = 0): number => {
	// 将第一个参数转换为数字
	const numA = typeof a === 'number' ? a : parseFloat(a) || 0;
	// 将第二个参数转换为数字
	const numB = typeof b === 'number' ? b : parseFloat(b) || 0;
	// 返回两个数值的和
	return numA + numB;
};
