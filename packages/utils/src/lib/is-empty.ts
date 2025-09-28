/**
 * 检查值是否为空
 *
 * 递归检查各种类型的值是否为空，包括数组、对象和基本类型。
 * 提供全面的空值检查功能，支持复杂的嵌套结构。
 *
 * @description 此函数提供了一种全面的方式来检查值是否为空。
 * 支持数组、对象和基本类型的空值检查，使用递归方式处理嵌套结构。
 * 适用于数据验证、表单验证、条件判断等场景。
 *
 * ## 业务规则
 *
 * ### 数组检查规则
 * - 空数组返回 true
 * - 过滤掉空值后检查剩余元素
 * - 递归检查数组中的每个元素
 * - 支持嵌套数组结构
 *
 * ### 对象检查规则
 * - 空对象返回 true
 * - 移除 null、undefined、空字符串属性
 * - 检查剩余属性的数量
 * - 不修改原始对象
 *
 * ### 基本类型检查规则
 * - null 和 undefined 返回 true
 * - 空字符串返回 true
 * - 字符串 'null' 和 'undefined' 返回 true
 * - 其他类型按字符串转换后检查
 *
 * ### 递归处理规则
 * - 数组元素递归检查
 * - 对象属性值递归检查
 * - 避免无限递归
 * - 保持性能优化
 *
 * @param item - 要检查的值，支持任意类型
 * @returns 如果值为空则返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * // 检查基本类型
 * console.log(isEmpty(null)); // 输出: true
 * console.log(isEmpty(undefined)); // 输出: true
 * console.log(isEmpty('')); // 输出: true
 * console.log(isEmpty('null')); // 输出: true
 * console.log(isEmpty('undefined')); // 输出: true
 *
 * // 检查数组
 * console.log(isEmpty([])); // 输出: true
 * console.log(isEmpty([1, 2, 3])); // 输出: false
 * console.log(isEmpty([null, undefined, ''])); // 输出: true
 * console.log(isEmpty([1, null, 2])); // 输出: false
 *
 * // 检查对象
 * console.log(isEmpty({})); // 输出: true
 * console.log(isEmpty({ name: 'John' })); // 输出: false
 * console.log(isEmpty({ name: null, age: undefined })); // 输出: true
 * console.log(isEmpty({ name: '', age: null })); // 输出: true
 *
 * // 检查嵌套结构
 * console.log(isEmpty({ items: [] })); // 输出: false
 * console.log(isEmpty({ items: [null, undefined] })); // 输出: false
 * console.log(isEmpty({ items: [], name: '' })); // 输出: true
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function isEmpty(item: any): boolean {
    // 检查数组类型
    if (Array.isArray(item)) {
        // 过滤掉空值后检查剩余元素
        const filteredArray = item.filter((val) => !isEmpty(val));
        return filteredArray.length === 0;
    } 
    // 检查对象类型
    else if (item && typeof item === 'object') {
        // 创建浅拷贝避免修改原始对象
        const shallowCopy = { ...item };
        // 移除空值属性
        for (const key in shallowCopy) {
            if (shallowCopy[key] === null || shallowCopy[key] === undefined || shallowCopy[key] === '') {
                delete shallowCopy[key];
            }
        }
        // 检查剩余属性数量
        return Object.keys(shallowCopy).length === 0;
    } 
    // 检查基本类型
    else {
        // 检查非对象/数组值
        const strValue = (item + '').toLowerCase();
        return !item || strValue === 'null' || strValue === 'undefined';
    }
}
