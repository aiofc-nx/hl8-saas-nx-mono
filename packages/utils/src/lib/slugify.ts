const slugify = require('slugify');

/**
 * 将字符串转换为 URL 友好的 slug
 *
 * 使用 slugify 库将输入字符串转换为 URL 友好的 slug 格式。
 * 支持自定义替换字符和特殊字符处理。
 *
 * @description 此函数提供了一种标准化的方式来生成 URL 友好的 slug。
 * 自动处理特殊字符、空格、大小写转换等，确保生成的 slug 符合 URL 规范。
 * 适用于 SEO 优化、URL 生成、文件名处理等场景。
 *
 * ## 业务规则
 *
 * ### 字符处理规则
 * - 空格替换为指定字符（默认为 '-'）
 * - 移除特殊字符：*+~()'"!:@,.
 * - 下划线替换为指定字符
 * - 转换为小写字母
 * - 去除首尾的替换字符
 *
 * ### 替换字符规则
 * - 默认使用 '-' 作为替换字符
 * - 支持自定义替换字符
 * - 替换字符必须是字符串类型
 * - 替换字符会替换所有空格和下划线
 *
 * ### 输出格式规则
 * - 返回小写字符串
 * - 不包含特殊字符
 * - 不包含连续替换字符
 * - 去除首尾空白字符
 *
 * @param string - 要转换的输入字符串
 * @param replacement - 替换空格的字符，默认为 '-'
 * @returns 转换后的 slug 字符串
 *
 * @example
 * ```typescript
 * // 基本用法：转换普通字符串
 * const title = 'Hello World';
 * const slug = sluggable(title);
 * console.log(slug); // 输出: 'hello-world'
 *
 * // 自定义替换字符
 * const title2 = 'My Blog Post';
 * const slug2 = sluggable(title2, '_');
 * console.log(slug2); // 输出: 'my_blog_post'
 *
 * // 处理特殊字符
 * const title3 = 'Hello, World! How are you?';
 * const slug3 = sluggable(title3);
 * console.log(slug3); // 输出: 'hello-world-how-are-you'
 *
 * // 处理中文和特殊字符
 * const title4 = '你好，世界！@#$%';
 * const slug4 = sluggable(title4);
 * console.log(slug4); // 输出: '你好世界'
 *
 * // 处理连续空格
 * const title5 = 'Hello    World';
 * const slug5 = sluggable(title5);
 * console.log(slug5); // 输出: 'hello-world'
 *
 * // 处理下划线
 * const title6 = 'hello_world_test';
 * const slug6 = sluggable(title6);
 * console.log(slug6); // 输出: 'hello-world-test'
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function sluggable(string: string, replacement = '-'): string {
	// 使用 slugify 库转换字符串为 slug
	return slugify(string, {
		replacement: replacement, // 替换空格为指定字符，默认为 '-'
		remove: /[*+~()'"!:@,.]/g, // 移除匹配正则表达式的字符
		lower: true, // 转换为小写，默认为 false
		trim: true // 去除首尾替换字符，默认为 true
	}).replace(/[_]/g, replacement); // 将下划线替换为指定字符
}
