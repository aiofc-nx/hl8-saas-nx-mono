/**
 * HL8 SAAS平台日志模块
 *
 * @description 提供高性能的日志记录功能，专为 Fastify 平台设计
 * 基于 Pino 日志库，支持请求上下文绑定、结构化日志输出、异步日志记录等功能
 *
 * ## 主要功能
 *
 * ### 高性能日志记录
 * - 基于 Pino 日志库，性能优异
 * - 支持异步日志记录，进一步提升性能
 * - 结构化 JSON 输出，便于日志分析
 *
 * ### 请求上下文绑定
 * - 自动绑定请求上下文到日志
 * - 支持请求ID、用户ID、追踪ID等上下文信息
 * - 使用 AsyncLocalStorage 实现上下文传递
 *
 * ### Fastify 专用优化
 * - 专为 Fastify 平台设计
 * - 支持 Fastify 中间件和插件
 * - 完整的请求/响应日志记录
 *
 * ### 装饰器支持
 * - 支持日志注入装饰器
 * - 支持性能监控装饰器
 * - 支持错误处理装饰器
 *
 * ### 模块化设计
 * - 支持全局和局部模块配置
 * - 支持同步和异步配置方式
 * - 完整的依赖注入支持
 *
 * @fileoverview 日志模块入口文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { LoggerModule, PinoLogger, InjectLogger } from '@hl8/logger';
 *
 * // 配置模块
 * @Module({
 *   imports: [LoggerModule.forRoot({
 *     config: {
 *       level: 'info',
 *       destination: { type: 'file', path: './logs/app.log' }
 *     }
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