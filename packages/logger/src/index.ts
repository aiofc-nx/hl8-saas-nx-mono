/**
 * HL8 SAAS平台日志模块
 *
 * 提供高性能的日志记录功能，专为 Fastify 平台设计。
 * 基于 Pino 日志库，支持请求上下文绑定、结构化日志输出、异步日志记录等功能。
 * 遵循 Clean Architecture 的基础设施层设计原则，为整个平台提供日志服务。
 *
 * @description 此模块是 HL8 SAAS 平台的基础设施层核心模块，提供统一的日志管理接口。
 * 支持高性能日志记录、请求上下文绑定、中间件集成、装饰器支持等功能。
 * 专为 Fastify 平台优化，提供完整的请求/响应日志记录和性能监控能力。
 *
 * ## 业务规则
 *
 * ### 高性能日志记录规则
 * - 基于 Pino 日志库，提供优异的性能表现
 * - 支持异步日志记录，避免阻塞主线程
 * - 结构化 JSON 输出，便于日志分析和处理
 * - 支持多种输出目标：控制台、文件、流等
 * - 支持日志轮转和压缩，优化存储空间
 *
 * ### 请求上下文绑定规则
 * - 自动绑定请求上下文到日志记录
 * - 支持请求ID、用户ID、追踪ID等上下文信息
 * - 使用 AsyncLocalStorage 实现上下文传递
 * - 支持自定义上下文数据和元数据
 * - 上下文信息在所有异步操作中保持可用
 *
 * ### Fastify 平台优化规则
 * - 专为 Fastify 平台设计和优化
 * - 支持 Fastify 中间件和插件集成
 * - 完整的请求/响应日志记录
 * - 支持路径排除和自定义配置
 * - 自动错误处理和日志记录
 *
 * ### 装饰器支持规则
 * - 支持日志注入装饰器，简化日志器使用
 * - 支持性能监控装饰器，自动记录方法执行时间
 * - 支持错误处理装饰器，自动记录异常信息
 * - 装饰器支持上下文绑定和参数记录
 * - 支持自定义装饰器配置和选项
 *
 * ### 模块化设计规则
 * - 支持全局和局部模块配置
 * - 支持同步和异步配置方式
 * - 完整的 NestJS 依赖注入支持
 * - 支持动态配置和运行时调整
 * - 模块间松耦合，易于扩展和维护
 *
 * ## 业务逻辑流程
 *
 * 1. **模块初始化**：通过 LoggerModule.forRoot() 或 forRootAsync() 初始化
 * 2. **日志器创建**：根据配置创建 Pino 日志器实例
 * 3. **中间件注册**：注册请求/响应日志中间件（如果启用）
 * 4. **上下文管理**：初始化 AsyncLocalStorage 进行上下文管理
 * 5. **依赖注入**：将日志器注册为 NestJS 提供者
 * 6. **服务集成**：通过装饰器或直接注入使用日志服务
 * 7. **日志记录**：记录结构化日志，包含上下文信息
 *
 * @example
 * ```typescript
 * import { LoggerModule, PinoLogger, InjectLogger } from '@hl8/logger';
 * import { Module, Injectable } from '@nestjs/common';
 *
 * // 配置模块
 * @Module({
 *   imports: [LoggerModule.forRoot({
 *     config: {
 *       level: 'info',
 *       destination: { type: 'file', path: './logs/app.log' },
 *       format: { timestamp: true, colorize: true }
 *     },
 *     enableRequestLogging: true,
 *     enableResponseLogging: true
 *   })],
 * })
 * export class AppModule {}
 *
 * // 使用日志服务
 * @Injectable()
 * export class UserService {
 *   @InjectLogger('UserService')
 *   private readonly logger: PinoLogger;
 *
 *   async createUser(userData: any) {
 *     this.logger.info('Creating user', { userData });
 *     try {
 *       // 业务逻辑
 *       const user = await this.userRepository.create(userData);
 *       this.logger.info('User created successfully', { userId: user.id });
 *       return user;
 *     } catch (error) {
 *       this.logger.error('Failed to create user', { error: error.message, userData });
 *       throw error;
 *     }
 *   }
 * }
 * ```
 */

// 核心模块导出
export * from './lib/logger.module';

// 日志记录器导出
export * from './lib/pino-logger';
export * from './lib/fastify-middleware';
export * from './lib/nestjs-logger';

// 类型定义导出
export * from './lib/types';
export type { LogLevel } from './lib/types';

// 上下文管理导出
export * from './lib/context';

// 装饰器导出
export * from './lib/logger.decorator';
export { LogMethod, RequestContext } from './lib/logger.decorator';

// 高级功能导出
export * from './lib/enhanced-features';

// 示例和文档导出（仅在开发环境中使用）
// export * from './example';
