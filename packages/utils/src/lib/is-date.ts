/**
 * 检查值是否为有效的日期
 *
 * 检查输入值是否为有效的 Date 对象或可解析为有效日期的字符串/数字。
 * 提供全面的日期验证功能，支持多种输入格式。
 *
 * @description 此函数提供了一种可靠的方式来检查值是否为有效的日期。
 * 支持 Date 对象、日期字符串和数字时间戳的验证，确保日期检查的准确性。
 * 适用于数据验证、表单验证、日期处理等场景。
 *
 * ## 业务规则
 *
 * ### Date 对象检查规则
 * - 使用 instanceof Date 检查 Date 对象
 * - 使用 getTime() 方法检查日期有效性
 * - 排除 NaN 日期（无效日期）
 * - 支持所有有效的 Date 对象
 *
 * ### 字符串/数字检查规则
 * - 支持日期字符串格式
 * - 支持数字时间戳
 * - 使用 new Date() 构造函数解析
 * - 检查解析后的日期是否有效
 *
 * ### 返回值规则
 * - 有效日期返回 true
 * - 无效日期返回 false
 * - null 和 undefined 返回 false
 * - 非日期类型返回 false
 *
 * @param value - 要检查的值，支持任意类型
 * @returns 如果值为有效日期则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查 Date 对象
 * const date = new Date('2024-01-01');
 * console.log(isDate(date)); // 输出: true
 *
 * // 检查无效 Date 对象
 * const invalidDate = new Date('invalid');
 * console.log(isDate(invalidDate)); // 输出: false
 *
 * // 检查日期字符串
 * console.log(isDate('2024-01-01')); // 输出: true
 * console.log(isDate('2024-01-01T10:30:00Z')); // 输出: true
 * console.log(isDate('invalid date')); // 输出: false
 *
 * // 检查数字时间戳
 * console.log(isDate(1704067200000)); // 输出: true
 * console.log(isDate(0)); // 输出: true (1970-01-01)
 * console.log(isDate(-1)); // 输出: true (1969-12-31)
 *
 * // 检查非日期类型
 * console.log(isDate('hello')); // 输出: false
 * console.log(isDate(123)); // 输出: false (不是时间戳)
 * console.log(isDate(null)); // 输出: false
 * console.log(isDate(undefined)); // 输出: false
 *
 * // 在条件判断中使用
 * if (isDate(input)) {
 *   const date = new Date(input);
 *   console.log(date.toISOString());
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isDate(value: unknown): boolean {
    // 检查 Date 对象
    if (value instanceof Date) {
        return !Number.isNaN(value.getTime());
    }

    // 检查字符串或数字
    if (typeof value === 'string' || typeof value === 'number') {
        const parsedDate = new Date(value);
        return !Number.isNaN(parsedDate.getTime());
    }

    // 其他类型返回 false
    return false;
}
