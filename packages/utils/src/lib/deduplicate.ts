/**
 * 从数组中移除重复元素
 *
 * 使用 Set 数据结构从数组中移除重复元素，返回包含唯一元素的新数组。
 * 支持泛型类型，确保类型安全和代码提示。
 *
 * @description 此函数提供了一种高效的方式来移除数组中的重复元素。
 * 使用 Set 数据结构的特性来确保唯一性，适用于数据清洗、去重处理等场景。
 * 函数会保持原始数组中元素的顺序（基于 Set 的插入顺序）。
 *
 * ## 业务规则
 *
 * ### 输入处理规则
 * - 支持任意类型的数组元素
 * - 空数组返回空数组
 * - 支持泛型类型，保持类型安全
 * - 不修改原始数组
 *
 * ### 去重规则
 * - 使用 Set 数据结构进行去重
 * - 基于严格相等性比较（===）
 * - 保持元素的插入顺序
 * - 返回新的数组实例
 *
 * ### 类型安全规则
 * - 支持泛型类型约束
 * - 返回类型与输入类型一致
 * - 保持类型推断的准确性
 * - 支持复杂对象类型的去重
 *
 * @template T - 数组元素的类型，默认为 any
 *
 * @param collection - 要去重的数组
 * @returns 包含唯一元素的新数组
 *
 * @example
 * ```typescript
 * // 基本用法：移除数字数组中的重复元素
 * const numbers = [1, 2, 2, 3, 3, 4, 5];
 * const uniqueNumbers = deduplicate(numbers);
 * console.log(uniqueNumbers); // 输出: [1, 2, 3, 4, 5]
 *
 * // 处理字符串数组
 * const words = ['apple', 'banana', 'apple', 'orange', 'banana'];
 * const uniqueWords = deduplicate(words);
 * console.log(uniqueWords); // 输出: ['apple', 'banana', 'orange']
 *
 * // 处理空数组
 * const emptyArray: number[] = [];
 * const emptyResult = deduplicate(emptyArray);
 * console.log(emptyResult); // 输出: []
 *
 * // 处理对象数组（基于引用比较）
 * const objects = [{ id: 1 }, { id: 2 }, { id: 1 }];
 * const uniqueObjects = deduplicate(objects);
 * console.log(uniqueObjects); // 输出: [{ id: 1 }, { id: 2 }, { id: 1 }] (对象引用不同)
 *
 * // 处理混合类型数组
 * const mixed = [1, 'hello', 1, 'world', 'hello'];
 * const uniqueMixed = deduplicate(mixed);
 * console.log(uniqueMixed); // 输出: [1, 'hello', 'world']
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function deduplicate<T = any>(collection: T[]): T[] {
	// 使用 Set 数据结构去重，然后展开为数组
	return [...new Set(collection)];
}
