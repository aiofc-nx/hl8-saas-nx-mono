// 此解决方案改编自: https://github.com/typestack/class-transformer/issues/676#issuecomment-822699830

/**
 * 布尔值映射器
 *
 * 用于将字符串表示的布尔值转换为相应的布尔值、null 或 undefined 的映射表。
 * 在处理用户输入或 API 响应时，将字符串输入转换为类型化的布尔值非常有用。
 *
 * @description 此映射表提供了一种标准化的方式来转换字符串布尔值。
 * 支持多种字符串格式的布尔值转换，包括数字字符串和特殊值。
 * 适用于表单处理、API 数据转换、配置解析等场景。
 *
 * ## 业务规则
 *
 * ### 字符串映射规则
 * - "true" 和 "1" 转换为 true
 * - "false" 和 "0" 转换为 false
 * - "null" 转换为 null
 * - "undefined" 转换为 undefined
 * - 其他值返回 undefined
 *
 * ### 输入处理规则
 * - 自动转换为小写
 * - 自动去除首尾空白字符
 * - 支持大小写不敏感的输入
 * - 处理前后空格
 *
 * ### 类型安全规则
 * - 返回类型为 boolean | null | undefined
 * - 支持类型推断
 * - 确保类型安全
 * - 避免类型错误
 *
 * @example
 * ```typescript
 * // 直接使用映射表
 * console.log(BooleanMapper.get("true")); // 输出: true
 * console.log(BooleanMapper.get("false")); // 输出: false
 * console.log(BooleanMapper.get("null")); // 输出: null
 * console.log(BooleanMapper.get("undefined")); // 输出: undefined
 * console.log(BooleanMapper.get("1")); // 输出: true
 * console.log(BooleanMapper.get("0")); // 输出: false
 *
 * // 在转换函数中使用
 * function transformToBoolean(value: string): boolean | null | undefined {
 *   return BooleanMapper.get(value.toLowerCase().trim());
 * }
 *
 * console.log(transformToBoolean("true")); // 输出: true
 * console.log(transformToBoolean("0"));    // 输出: false
 * console.log(transformToBoolean("null")); // 输出: null
 * ```
 */
export const BooleanMapper = new Map<string, boolean | null | undefined>([
	["undefined", undefined],
	["null", null],
	["true", true],
	["false", false],
	["1", true],
	["0", false],
]);

/**
 * 将字符串表示的布尔值转换为对应的值
 *
 * 基于 BooleanMapper 将字符串表示的布尔值转换为相应的布尔值、null 或 undefined。
 * 提供类型安全的布尔值转换功能。
 *
 * @description 此函数提供了一种可靠的方式来转换字符串布尔值。
 * 使用 BooleanMapper 映射表进行转换，确保转换的准确性和一致性。
 * 适用于数据验证、表单处理、API 响应处理等场景。
 *
 * ## 业务规则
 *
 * ### 输入处理规则
 * - 自动转换为小写
 * - 自动去除首尾空白字符
 * - 支持大小写不敏感的输入
 * - 处理前后空格
 *
 * ### 转换规则
 * - "true" 和 "1" 转换为 true
 * - "false" 和 "0" 转换为 false
 * - "null" 转换为 null
 * - "undefined" 转换为 undefined
 * - 其他值返回 undefined
 *
 * ### 返回值规则
 * - 成功转换返回对应值
 * - 未匹配返回 undefined
 * - 返回类型为 boolean | null | undefined
 * - 保持类型安全
 *
 * @param value - 要转换的字符串值
 * @returns 映射后的布尔值、null 或 undefined
 *
 * @example
 * ```typescript
 * // 基本用法：转换字符串布尔值
 * console.log(mapToOptionalBoolean("true")); // 输出: true
 * console.log(mapToOptionalBoolean("false")); // 输出: false
 * console.log(mapToOptionalBoolean("null")); // 输出: null
 * console.log(mapToOptionalBoolean("undefined")); // 输出: undefined
 * console.log(mapToOptionalBoolean("1")); // 输出: true
 * console.log(mapToOptionalBoolean("0")); // 输出: false
 * console.log(mapToOptionalBoolean("invalid")); // 输出: undefined (未映射)
 *
 * // 处理大小写和空格
 * console.log(mapToOptionalBoolean("TRUE")); // 输出: true
 * console.log(mapToOptionalBoolean(" false ")); // 输出: false
 * console.log(mapToOptionalBoolean(" NULL ")); // 输出: null
 *
 * // 在条件判断中使用
 * const result = mapToOptionalBoolean(input);
 * if (result === true) {
 *   console.log('值为真');
 * } else if (result === false) {
 *   console.log('值为假');
 * } else if (result === null) {
 *   console.log('值为空');
 * } else {
 *   console.log('值无效');
 * }
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function mapToOptionalBoolean(value: string): boolean | null | undefined {
	// 使用 BooleanMapper 映射表进行转换
	return BooleanMapper.get(value.toLowerCase().trim());
}
