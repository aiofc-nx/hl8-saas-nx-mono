/**
 * HL8 SAAS平台日志模块使用示例
 *
 * @description 展示如何使用新的日志模块功能
 * 包含基本用法、装饰器用法、中间件用法等示例
 *
 * @fileoverview 日志模块使用示例文件
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { LoggerModule } from './lib/logger.module';
import { InjectLogger } from './lib/logger.decorator';
import { PinoLogger } from './lib/pino-logger';
import { LogMethod } from './lib/logger.decorator';

/**
 * 用户服务示例
 *
 * @description 展示如何在服务中使用日志功能
 * 包含装饰器用法、性能监控、错误处理等示例
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   @InjectLogger('UserService')
 *   private readonly logger: PinoLogger;
 *
 *   @LogMethod({ level: 'info', message: 'User creation started' })
 *   @LogPerformance({ threshold: 1000, level: 'warn' })
 *   @LogError({ includeStack: true, level: 'error' })
 *   async createUser(userData: any) {
 *     this.logger.info('Creating user', { userData });
 *     // 业务逻辑
 *     return { id: 'user-123', ...userData };
 *   }
 * }
 * ```
 */
export class UserService {
  @InjectLogger('UserService')
  private readonly logger!: PinoLogger;

  /**
   * 创建用户
   *
   * @description 创建新用户并记录相关日志
   * @param userData - 用户数据
   * @returns {Promise<any>} 创建的用户信息
   */
  @LogMethod({ level: 'info', message: 'User creation started' })
  async createUser(userData: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.logger.info('Creating user', { userData });
    
    // 模拟业务逻辑
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const user = { id: 'user-123', ...userData };
    this.logger.info('User created successfully', { userId: user.id });
    
    return user;
  }

  /**
   * 获取用户信息
   *
   * @description 获取用户信息并记录相关日志
   * @param userId - 用户ID
   * @returns {Promise<any>} 用户信息
   */
  @LogMethod({ level: 'debug', message: 'User retrieval started' })
  async getUser(userId: string): Promise<Record<string, unknown>> {
    this.logger.debug('Getting user', { userId });
    
    // 模拟业务逻辑
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const user = { id: userId, name: 'John Doe', email: 'john@example.com' };
    this.logger.debug('User retrieved successfully', { userId });
    
    return user;
  }
}

/**
 * 应用模块示例
 *
 * @description 展示如何配置日志模块
 * 包含同步和异步配置示例
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [
 *     LoggerModule.forRoot({
 *       config: {
 *         level: 'info',
 *         destination: { type: 'file', path: './logs/app.log' }
 *       },
 *       enableRequestLogging: true,
 *       enableResponseLogging: true
 *     })
 *   ],
 *   providers: [UserService],
 * })
 * export class AppModule {}
 * ```
 */
export class AppModule {
  /**
   * 配置日志模块
   *
   * @description 配置日志模块的基本选项
   * @returns {any} 模块配置
   */
  static forRoot() {
    return {
      imports: [
        LoggerModule.forRoot({
          config: {
            level: 'info',
            destination: { type: 'file', path: './logs/app.log' },
            format: { timestamp: true, colorize: true }
          },
          enableRequestLogging: true,
          enableResponseLogging: true,
          global: true
        })
      ],
      providers: [UserService],
      exports: [UserService]
    };
  }

  /**
   * 异步配置日志模块
   *
   * @description 使用异步方式配置日志模块
   * @returns {any} 模块配置
   */
  static forRootAsync() {
    return {
      imports: [
        LoggerModule.forRootAsync({
          imports: [], // 可以导入 ConfigModule 等
          inject: [], // 可以注入 ConfigService 等
          useFactory: () => ({
            config: {
              level: 'info',
              destination: { type: 'file', path: './logs/app.log' }
            },
            enableRequestLogging: true,
            enableResponseLogging: true
          })
        })
      ],
      providers: [UserService],
      exports: [UserService]
    };
  }
}

/**
 * Fastify 应用配置示例
 *
 * @description 展示如何在 Fastify 应用中配置日志中间件
 * 包含中间件注册、日志配置等示例
 *
 * @example
 * ```typescript
 * import { registerPinoLogger } from '@hl8/logger';
 *
 * const app = fastify();
 * await registerPinoLogger(app, {
 *   enableRequestLogging: true,
 *   enableResponseLogging: true,
 *   excludePaths: ['/health', '/metrics']
 * });
 * ```
 */
export class FastifyAppConfig {
  /**
   * 配置 Fastify 应用
   *
   * @description 配置 Fastify 应用的日志功能
   * @param app - Fastify 应用实例
   * @returns {Promise<void>} 配置完成
   */
  static async configureApp(app: FastifyInstance): Promise<void> {
    // 注册日志中间件
    await app.register(require('./fastify-middleware').registerPinoLogger, {
      enableRequestLogging: true,
      enableResponseLogging: true,
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      requestIdGenerator: (req: FastifyRequest) => req.headers['x-request-id'] as string || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    });

    // 注册路由
    app.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    app.get('/users/:id', async (request) => {
      const userService = new UserService();
      const user = await userService.getUser((request.params as { id: string }).id);
      return user;
    });

    app.post('/users', async (request) => {
      const userService = new UserService();
      const user = await userService.createUser(request.body as Record<string, unknown>);
      return user;
    });
  }
}

/**
 * 日志配置示例
 *
 * @description 展示不同的日志配置选项
 * 包含文件输出、控制台输出、日志轮转等配置
 *
 * @example
 * ```typescript
 * const configs = {
 *   development: {
 *     level: 'debug',
 *     destination: { type: 'console' },
 *     format: { timestamp: true, colorize: true }
 *   },
 *   production: {
 *     level: 'info',
 *     destination: { 
 *       type: 'file', 
 *       path: './logs/app.log',
 *       rotation: { maxSize: '10MB', maxFiles: 5 }
 *     }
 *   }
 * };
 * ```
 */
export const LogConfigs = {
  /**
   * 开发环境配置
   */
  development: {
    level: 'debug' as const,
    destination: { type: 'console' as const },
    format: { timestamp: true, colorize: true }
  },

  /**
   * 生产环境配置
   */
  production: {
    level: 'info' as const,
    destination: { 
      type: 'file' as const, 
      path: './logs/app.log',
      rotation: { maxSize: '10MB', maxFiles: 5 }
    }
  },

  /**
   * 测试环境配置
   */
  test: {
    level: 'error' as const,
    destination: { type: 'console' as const }
  }
};
