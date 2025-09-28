import { isClassInstance } from './is-class-instance';
import { isEmpty } from './is-empty';
import { isPlainObject } from './is-plain-object';

/**
 * 深度克隆输入值
 *
 * 递归地深度克隆输入值，支持基本类型、数组、对象和类实例。
 * 使用递归算法确保所有嵌套结构都被正确克隆。
 *
 * @description 此函数提供了一种全面的深度克隆解决方案。
 * 支持各种数据类型的深度克隆，包括基本类型、数组、对象和类实例。
 * 适用于数据备份、状态管理、对象复制等场景。
 *
 * ## 业务规则
 *
 * ### 基本类型处理规则
 * - 基本类型直接返回（字符串、数字、布尔值等）
 * - null 和 undefined 直接返回
 * - 函数直接返回（不进行克隆）
 * - Symbol 直接返回
 *
 * ### 数组处理规则
 * - 递归克隆数组中的每个元素
 * - 保持数组的原始顺序
 * - 支持嵌套数组结构
 * - 返回新的数组实例
 *
 * ### 对象处理规则
 * - 递归克隆对象的所有属性
 * - 只克隆自有属性（使用 hasOwnProperty 检查）
 * - 支持嵌套对象结构
 * - 返回新的对象实例
 *
 * ### 类实例处理规则
 * - 类实例直接返回（不进行克隆）
 * - 避免破坏类的内部状态
 * - 保持类的原型链
 * - 不克隆类的方法和属性
 *
 * ### 空值处理规则
 * - 空对象返回原值
 * - 空数组返回原值
 * - 避免不必要的克隆操作
 * - 保持性能优化
 *
 * @template T - 输入值的类型
 *
 * @param input - 要深度克隆的值，支持任意类型
 * @returns 深度克隆后的值，类型与输入值一致
 *
 * @example
 * ```typescript
 * // 克隆基本类型
 * const number = 42;
 * const clonedNumber = deepClone(number);
 * console.log(clonedNumber); // 输出: 42
 *
 * // 克隆数组
 * const array = [1, 2, [3, 4]];
 * const clonedArray = deepClone(array);
 * console.log(clonedArray); // 输出: [1, 2, [3, 4]]
 * console.log(clonedArray === array); // 输出: false
 *
 * // 克隆对象
 * const obj = { name: 'John', age: 30, address: { city: 'New York' } };
 * const clonedObj = deepClone(obj);
 * console.log(clonedObj); // 输出: { name: 'John', age: 30, address: { city: 'New York' } }
 * console.log(clonedObj === obj); // 输出: false
 * console.log(clonedObj.address === obj.address); // 输出: false
 *
 * // 克隆嵌套结构
 * const nested = {
 *   users: [
 *     { id: 1, name: 'Alice' },
 *     { id: 2, name: 'Bob' }
 *   ],
 *   settings: { theme: 'dark', language: 'en' }
 * };
 * const clonedNested = deepClone(nested);
 * console.log(clonedNested.users[0] === nested.users[0]); // 输出: false
 *
 * // 处理类实例
 * class Person {
 *   constructor(public name: string) {}
 * }
 * const person = new Person('John');
 * const clonedPerson = deepClone(person);
 * console.log(clonedPerson === person); // 输出: true (类实例直接返回)
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function deepClone<T>(input: T): T {
	// 如果不是普通对象或为空，直接返回
	if (!isPlainObject(input) || isEmpty(input)) {
		return input;
	}

	// 初始化输出变量
	let output: any;

	// 递归克隆数组类型
	if (Array.isArray(input)) {
		output = input.map((item) => deepClone(item));
		return output as T;
	}

	// 类实例直接返回
	if (isClassInstance(input)) {
		return input;
	}

	// 递归克隆对象
	output = {} as Record<string, any>;
	for (const key in input) {
		if (Object.prototype.hasOwnProperty.call(input, key)) {
			output[key] = deepClone(input[key]);
		}
	}
	return output as T;
}
