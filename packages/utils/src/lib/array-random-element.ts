/**
 * 从数组中获取随机元素
 *
 * 从给定的数组中随机选择一个元素并返回。如果数组为空或无效，则返回 null。
 * 使用 Math.random() 生成随机索引，确保每个元素被选中的概率相等。
 *
 * @description 此函数提供了一种简单而高效的方式来从数组中随机选择元素。
 * 适用于需要随机化数据、随机抽样、游戏逻辑等场景。
 * 函数会验证输入数组的有效性，确保类型安全。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 输入必须是有效的数组类型
 * - 空数组返回 null，不抛出异常
 * - 非数组类型输入返回 null
 * - 支持泛型类型，保持类型安全
 *
 * ### 随机选择规则
 * - 使用 Math.random() 生成 0 到 1 之间的随机数
 * - 通过 Math.floor() 向下取整确保索引为整数
 * - 每个元素被选中的概率相等
 * - 随机性基于系统时间种子
 *
 * ### 返回值规则
 * - 非空数组返回随机选择的元素
 * - 空数组或无效输入返回 null
 * - 返回类型与输入数组元素类型一致
 *
 * @param array - 要从中选择元素的数组，支持泛型类型
 * @returns 随机选择的数组元素，如果数组为空则返回 null
 *
 * @example
 * ```typescript
 * // 从字符串数组中随机选择
 * const colors = ['red', 'green', 'blue', 'yellow'];
 * const randomColor = getRandomElement(colors);
 * console.log(randomColor); // 输出: 'red' 或 'green' 等随机颜色
 *
 * // 从数字数组中随机选择
 * const numbers = [1, 2, 3, 4, 5];
 * const randomNumber = getRandomElement(numbers);
 * console.log(randomNumber); // 输出: 1-5 之间的随机数字
 *
 * // 处理空数组
 * const emptyArray: string[] = [];
 * const result = getRandomElement(emptyArray);
 * console.log(result); // 输出: null
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function getRandomElement<T>(array: T[]): T | null {
    // 验证输入数组的有效性
    if (!Array.isArray(array) || array.length === 0) {
        return null; // 空数组或无效输入返回 null
    }

    // 生成随机索引并返回对应元素
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}
