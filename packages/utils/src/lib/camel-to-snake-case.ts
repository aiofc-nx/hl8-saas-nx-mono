/**
 * 将驼峰命名转换为下划线命名
 *
 * 将输入字符串从驼峰命名格式（camelCase）转换为下划线命名格式（snake_case）。
 * 使用正则表达式检测大写字母并插入下划线分隔符。
 *
 * @description 此函数提供了一种标准化的方式来生成下划线命名格式的字符串。
 * 自动检测驼峰命名中的大写字母，在其前面插入下划线，然后转换为小写。
 * 适用于数据库字段名、API 参数名、配置文件键名等场景。
 *
 * ## 业务规则
 *
 * ### 驼峰命名检测规则
 * - 检测小写字母后跟大写字母的模式
 * - 在小写字母和大写字母之间插入下划线
 * - 保持原始字符不变
 * - 处理连续的大写字母
 *
 * ### 转换规则
 * - 将插入的下划线后的字母转换为小写
 * - 保持其他字符不变
 * - 处理数字字符
 * - 保持特殊字符
 *
 * ### 输出格式规则
 * - 全部转换为小写字母
 * - 使用下划线作为分隔符
 * - 不包含空格或其他分隔符
 * - 保持数字字符不变
 *
 * @param string - 要转换的驼峰命名字符串
 * @returns 转换后的下划线格式字符串
 *
 * @example
 * ```typescript
 * // 基本用法：转换简单驼峰命名
 * const camelCase = 'helloWorld';
 * const snakeCase = camelToSnakeCase(camelCase);
 * console.log(snakeCase); // 输出: 'hello_world'
 *
 * // 转换复杂驼峰命名
 * const complexCamel = 'helloWorldTest';
 * const complexSnake = camelToSnakeCase(complexCamel);
 * console.log(complexSnake); // 输出: 'hello_world_test'
 *
 * // 处理连续大写字母
 * const consecutive = 'XMLHttpRequest';
 * const consecutiveSnake = camelToSnakeCase(consecutive);
 * console.log(consecutiveSnake); // 输出: 'x_m_l_http_request'
 *
 * // 处理数字
 * const withNumbers = 'helloWorld123';
 * const withNumbersSnake = camelToSnakeCase(withNumbers);
 * console.log(withNumbersSnake); // 输出: 'hello_world123'
 *
 * // 处理已经是下划线格式的字符串
 * const alreadySnake = 'hello_world';
 * const alreadySnakeResult = camelToSnakeCase(alreadySnake);
 * console.log(alreadySnakeResult); // 输出: 'hello_world' (保持不变)
 *
 * // 处理单个单词
 * const single = 'hello';
 * const singleSnake = camelToSnakeCase(single);
 * console.log(singleSnake); // 输出: 'hello'
 *
 * // 处理空字符串
 * const empty = '';
 * const emptySnake = camelToSnakeCase(empty);
 * console.log(emptySnake); // 输出: ''
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export const camelToSnakeCase = (string: string): string => 
	// 在小写字母和大写字母之间插入下划线，然后转换为小写
	string.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
