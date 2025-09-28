/**
 * 将对象数组转换为键值对对象
 *
 * 根据指定的属性将对象数组转换为键值对映射对象。
 * 支持泛型类型约束，确保类型安全和代码提示。
 *
 * @description 此函数提供了一种高效的方式来将对象数组转换为查找表或映射对象。
 * 适用于数据转换、快速查找、索引构建等场景。函数使用 reduce 方法
 * 进行转换，确保性能和内存效率。
 *
 * ## 业务规则
 *
 * ### 输入验证规则
 * - 输入必须是对象数组
 * - 键属性必须存在于对象中
 * - 值属性必须存在于对象中
 * - 支持泛型类型约束，确保类型安全
 *
 * ### 转换规则
 * - 使用 reduce 方法遍历数组
 * - 将键属性值转换为字符串作为对象键
 * - 将值属性值作为对象值
 * - 重复键值会被覆盖，保留最后一个
 *
 * ### 类型安全规则
 * - 键属性类型必须继承自 keyof T
 * - 值属性类型必须继承自 keyof T
 * - 返回类型为 Record<string, any>
 * - 支持泛型类型推断
 *
 * @template T - 数组中对象的类型
 * @template K - 键属性的类型，必须继承自 keyof T
 * @template V - 值属性的类型，必须继承自 keyof T
 *
 * @param array - 要转换的对象数组
 * @param key - 用作对象键的属性名
 * @param value - 用作对象值的属性名
 * @returns 转换后的键值对对象
 *
 * @example
 * ```typescript
 * // 基本用法：将用户数组转换为 ID 到姓名的映射
 * const users = [
 *   { id: 1, name: 'John', age: 30 },
 *   { id: 2, name: 'Jane', age: 25 }
 * ];
 * const userMap = arrayToObject(users, 'id', 'name');
 * console.log(userMap); // 输出: { "1": "John", "2": "Jane" }
 *
 * // 复杂用法：将产品数组转换为 SKU 到价格的映射
 * const products = [
 *   { sku: 'ABC123', name: 'Product A', price: 99.99 },
 *   { sku: 'DEF456', name: 'Product B', price: 149.99 }
 * ];
 * const priceMap = arrayToObject(products, 'sku', 'price');
 * console.log(priceMap); // 输出: { "ABC123": 99.99, "DEF456": 149.99 }
 *
 * // 处理重复键值
 * const items = [
 *   { id: 1, status: 'active' },
 *   { id: 1, status: 'inactive' } // 重复的 ID
 * ];
 * const statusMap = arrayToObject(items, 'id', 'status');
 * console.log(statusMap); // 输出: { "1": "inactive" } (最后一个覆盖前面的)
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function arrayToObject<T, K extends keyof T, V extends keyof T>(
	array: T[],
	key: K,
	value: V
): Record<string, any> {
	// 使用 reduce 方法将数组转换为对象
	return array.reduce((acc: Record<string, any>, item: T) => {
		// 将键属性值转换为字符串作为对象键
		acc[String(item[key])] = item[value];
		return acc;
	}, {});
}
