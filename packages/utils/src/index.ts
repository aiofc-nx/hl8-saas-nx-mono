/**
 * HL8 SAAS平台工具函数模块
 *
 * 提供平台通用的工具函数集合，包含数组处理、对象操作、类型检查、字符串处理等功能。
 * 提供纯函数式的工具方法，支持函数组合和复用，确保代码的简洁性和可维护性。
 * 遵循 Clean Architecture 的共享内核设计原则，为整个平台提供通用工具服务。
 *
 * @description 此模块是 HL8 SAAS 平台的共享内核模块，提供完整的工具函数集合。
 * 包含数组操作、对象处理、类型检查、字符串处理、加密解密、代码生成等功能。
 * 为整个平台提供一致的工具支持，确保代码复用和开发效率。
 *
 * ## 业务规则
 *
 * ### 纯函数式设计规则
 * - 所有工具函数都是纯函数，无副作用
 * - 支持函数组合和复用，提高代码复用性
 * - 输入输出明确，易于测试和调试
 * - 支持不可变数据处理，确保数据安全
 *
 * ### 类型安全规则
 * - 提供完整的 TypeScript 类型定义
 * - 支持严格的类型检查和智能提示
 * - 类型定义与运行时行为完全一致
 * - 支持泛型和高级类型特性
 *
 * ### 性能优化规则
 * - 工具函数执行效率高，避免不必要的计算
 * - 支持大数据量的处理，内存使用优化
 * - 提供异步和同步版本的工具函数
 * - 支持缓存和延迟计算机制
 *
 * ### 功能分类规则
 * - 数组操作：数组处理、查找、排序、过滤等
 * - 对象操作：对象合并、克隆、转换等
 * - 类型检查：类型判断、验证、转换等
 * - 字符串处理：格式化、转换、解析等
 * - 加密解密：哈希、加密、密码生成等
 * - 代码生成：随机码、标识符生成等
 *
 * ## 业务逻辑流程
 *
 * 1. **函数导入**：从各个功能模块导入工具函数
 * 2. **类型检查**：确保输入参数的类型正确性
 * 3. **业务处理**：执行具体的工具函数逻辑
 * 4. **结果返回**：返回处理后的结果
 * 5. **错误处理**：处理异常情况和边界条件
 *
 * @example
 * ```typescript
 * import {
 *   deepClone,
 *   isArray,
 *   slugify,
 *   generateEncryptionKey,
 *   applyMixins,
 *   sleep
 * } from '@hl8/utils';
 *
 * // 对象操作
 * const original = { name: 'John', age: 30, hobbies: ['reading', 'coding'] };
 * const cloned = deepClone(original);
 *
 * // 类型检查
 * if (isArray(cloned.hobbies)) {
 *   console.log('Hobbies is an array');
 * }
 *
 * // 字符串处理
 * const slug = slugify('Hello World!'); // 'hello-world'
 *
 * // 加密功能
 * const key = generateEncryptionKey(32);
 *
 * // 类混入
 * class UserService {
 *   name: string;
 *   constructor(name: string) { this.name = name; }
 * }
 *
 * class LoggingMixin {
 *   log(message: string) { console.log(message); }
 * }
 *
 * applyMixins(UserService, [LoggingMixin]);
 *
 * // 异步延迟
 * await sleep(1000); // 延迟1秒
 * ```
 */

// 数组操作工具函数导出
export * from './lib/array-random-element';
export * from './lib/array-sum';
export * from './lib/array-to-object';
export * from './lib/average';
export * from './lib/chunks';
export * from './lib/deduplicate';

// 对象操作工具函数导出
export * from './lib/deep-clone';
export * from './lib/deep-merge';
export * from './lib/parse-object';
export * from './lib/match';

// 类型检查工具函数导出
export * from './lib/is-array';
export * from './lib/is-class-instance';
export * from './lib/is-date';
export * from './lib/is-defined';
export * from './lib/is-empty';
export * from './lib/is-function';
export * from './lib/is-json';
export * from './lib/is-not-empty';
export * from './lib/is-not-null-or-undefined';
export * from './lib/is-null-or-undefined';
export * from './lib/is-object';
export * from './lib/is-plain-object';
export * from './lib/is-string';

// 字符串处理工具函数导出
export * from './lib/camel-to-snake-case';
export * from './lib/slugify';
export * from './lib/trim-if-not-empty';
export * from './lib/uc-first';

// 转换工具函数导出
export * from './lib/boolean-mapper';
export * from './lib/parse-to-boolean';
export * from './lib/convert-to-hex';

// 加密和安全工具函数导出
export * from './lib/generate-encryption-key';
export * from './lib/generate-sha256-hash';
export * from './lib/password-generator';

// 代码生成工具函数导出
export * from './lib/code-generator';
export * from './lib/extract-name-from-email';

// 网络和URL工具函数导出
export * from './lib/build-query-string';
export * from './lib/ensure-http-prefix';

// 类和对象扩展工具函数导出
export * from './lib/class-mixins';

// 异步工具函数导出
export * from './lib/sleep';

// 版本和标识工具函数导出
export * from './lib/version';
