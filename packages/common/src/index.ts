/**
 * HL8 SAAS平台通用模块
 *
 * 提供平台通用的工具类、类型定义、装饰器、异常处理等功能。
 * 包含共享的类型定义、工具函数、装饰器等基础设施组件。
 * 遵循 Clean Architecture 的共享内核设计原则，为整个平台提供通用服务。
 *
 * @description 此模块是 HL8 SAAS 平台的共享内核模块，提供通用的基础设施组件。
 * 包含类型定义、工具函数、装饰器、异常处理等通用功能。
 * 为整个平台提供一致的工具和类型支持，确保代码复用和类型安全。
 *
 * ## 业务规则
 *
 * ### 类型安全规则
 * - 提供完整的 TypeScript 类型定义
 * - 支持严格的类型检查和智能提示
 * - 类型定义与运行时行为完全一致
 * - 支持泛型和高级类型特性
 *
 * ### 工具函数规则
 * - 提供纯函数式的工具方法
 * - 支持函数组合和复用
 * - 工具函数无副作用，易于测试
 * - 支持多种数据类型和场景
 *
 * ### 装饰器支持规则
 * - 提供声明式的功能增强装饰器
 * - 支持元数据注入和反射
 * - 装饰器可组合和复用
 * - 支持 NestJS 生态系统集成
 *
 * ### 异常处理规则
 * - 提供标准化的异常处理机制
 * - 遵循 RFC7807 标准的错误响应格式
 * - 支持国际化和多语言错误消息
 * - 集成日志记录和错误追踪
 *
 * ## 业务逻辑流程
 *
 * 1. **类型定义**：定义平台通用的类型和接口
 * 2. **工具函数**：提供通用的工具方法和函数
 * 3. **装饰器**：提供功能增强的装饰器
 * 4. **异常处理**：提供统一的异常处理机制
 * 5. **模块导出**：导出所有通用组件供其他模块使用
 *
 * @example
 * ```typescript
 * import {
 *   DeepPartial,
 *   Type,
 *   ApplicationPluginConfig,
 *   applyMixins,
 *   ExceptionModule,
 *   GeneralNotFoundException
 * } from '@hl8/common';
 * import { Module } from '@nestjs/common';
 *
 * // 使用类型定义
 * interface UserConfig {
 *   name: string;
 *   email: string;
 *   settings: {
 *     theme: string;
 *     notifications: boolean;
 *   };
 * }
 *
 * type PartialUserConfig = DeepPartial<UserConfig>;
 *
 * // 使用工具函数
 * class UserService {
 *   // 服务方法
 * }
 *
 * class LoggingMixin {
 *   log(message: string) {
 *     console.log(message);
 *   }
 * }
 *
 * // 应用 mixins
 * applyMixins(UserService, [LoggingMixin]);
 *
 * // 配置异常处理
 * @Module({
 *   imports: [
 *     ExceptionModule.forRoot({
 *       documentationUrl: 'https://docs.example.com/errors',
 *       logLevel: 'error',
 *       enableStackTrace: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // 使用异常
 * throw new GeneralNotFoundException(
 *   'User not found',
 *   'The user with ID "user-123" does not exist',
 *   { userId: 'user-123' }
 * );
 * ```
 */

// 常量导出
export * from './constants';

// 类型定义导出
export * from './types/shared-types';

// 装饰器导出
export * from './decorators/index';

// 异常处理模块导出
export * from './exceptions/index';
