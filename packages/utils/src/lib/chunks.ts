/**
 * 将数组分割成指定大小的块
 *
 * 将输入数组分割成多个较小的数组块，每个块包含指定数量的元素。
 * 支持泛型类型，确保类型安全和代码提示。
 *
 * @description 此函数提供了一种高效的方式来处理大数据集，将数组分割成
 * 更小的块进行处理。适用于分页、批处理、并行处理等场景。
 * 函数会验证输入参数的有效性，确保分割的正确性。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 块大小必须是正整数
 * - 块大小不能为 0 或负数
 * - 支持泛型类型，保持类型安全
 * - 空数组返回空数组
 *
 * ### 分割规则
 * - 使用 slice 方法进行数组分割
 * - 每个块包含最多指定数量的元素
 * - 最后一个块可能包含少于指定数量的元素
 * - 保持原始数组元素的顺序
 *
 * ### 异常处理规则
 * - 块大小不是正整数时抛出错误
 * - 错误信息清晰明确
 * - 不处理其他类型的输入错误
 *
 * @template T - 数组元素的类型
 *
 * @param items - 要分割的数组
 * @param size - 每个块的大小，必须是正整数
 * @returns 分割后的数组块数组
 *
 * @throws {Error} 当块大小不是正整数时抛出错误
 *
 * @example
 * ```typescript
 * // 基本用法：将数组分割成大小为 2 的块
 * const numbers = [1, 2, 3, 4, 5, 6];
 * const result = chunks(numbers, 2);
 * console.log(result); // 输出: [[1, 2], [3, 4], [5, 6]]
 *
 * // 处理奇数长度数组
 * const oddNumbers = [1, 2, 3, 4, 5];
 * const oddResult = chunks(oddNumbers, 2);
 * console.log(oddResult); // 输出: [[1, 2], [3, 4], [5]]
 *
 * // 处理空数组
 * const emptyArray: number[] = [];
 * const emptyResult = chunks(emptyArray, 3);
 * console.log(emptyResult); // 输出: []
 *
 * // 处理字符串数组
 * const words = ['hello', 'world', 'typescript', 'javascript'];
 * const wordChunks = chunks(words, 2);
 * console.log(wordChunks); // 输出: [['hello', 'world'], ['typescript', 'javascript']]
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function chunks<T>(items: T[], size: number): T[][] {
	// 验证块大小的有效性
	if (size <= 0) {
		throw new Error("Size must be a positive integer.");
	}

	// 初始化结果数组
	const result: T[][] = [];
	// 使用循环和 slice 方法分割数组
	for (let i = 0; i < items.length; i += size) {
		result.push(items.slice(i, i + size));
	}
	return result;
}
