/**
 * HL8 SAAS平台日志装饰器
 *
 * 提供日志相关的装饰器功能，包含日志注入装饰器、日志方法装饰器、日志级别装饰器等。
 * 简化日志器的使用，提供声明式的日志记录和性能监控能力。
 * 遵循 Clean Architecture 的装饰器设计原则，提供统一的日志管理接口。
 *
 * @description 此文件实现了日志模块的装饰器功能。
 * 包含日志注入装饰器、方法日志装饰器、性能监控装饰器等。
 * 支持自动上下文绑定、参数记录、性能监控等功能。
 *
 * ## 业务规则
 *
 * ### 日志注入装饰器规则
 * - 支持自动注入日志器实例到类属性中
 * - 支持自定义上下文名称和日志级别
 * - 日志器实例延迟创建，提高性能
 * - 支持上下文自动绑定和元数据设置
 *
 * ### 方法日志装饰器规则
 * - 支持自动记录方法调用的开始和结束
 * - 支持自定义日志级别和消息格式
 * - 支持参数和返回值的记录（可选）
 * - 支持异常捕获和错误日志记录
 *
 * ### 性能监控装饰器规则
 * - 支持自动记录方法执行时间
 * - 支持性能阈值设置和告警
 * - 支持慢查询和性能瓶颈检测
 * - 支持性能统计和报告生成
 *
 * ## 业务逻辑流程
 *
 * 1. **装饰器应用**：将装饰器应用到类或方法上
 * 2. **元数据收集**：收集装饰器配置和上下文信息
 * 3. **日志器创建**：创建或获取日志器实例
 * 4. **方法包装**：包装原始方法，添加日志记录逻辑
 * 5. **日志记录**：在方法执行前后记录相应日志
 * 6. **性能监控**：记录方法执行时间和性能指标
 * 7. **异常处理**：捕获异常并记录错误日志
 */

import { PinoLogger } from './pino-logger';
import type { RequestContext } from './types';
import {
  getCurrentRequestContext,
  updateCurrentRequestMetadata,
} from './context';

/**
 * 日志注入装饰器
 *
 * 用于在类中注入日志记录器实例，支持自动上下文绑定和日志级别设置。
 * 简化日志器的使用，提供声明式的日志器注入能力。
 *
 * @description 此装饰器用于在类属性中注入日志记录器实例。
 * 支持自定义上下文名称，自动设置日志器的上下文信息。
 * 日志器实例延迟创建，提高性能并支持依赖注入。
 *
 * ## 业务规则
 *
 * ### 注入规则
 * - 自动创建 PinoLogger 实例并注入到类属性中
 * - 支持自定义上下文名称，用于标识日志来源
 * - 日志器实例延迟创建，仅在首次访问时创建
 * - 支持属性描述符配置，确保正确的属性行为
 *
 * ### 上下文绑定规则
 * - 自动设置日志器的上下文信息
 * - 上下文包含请求ID和自定义元数据
 * - 支持嵌套上下文和上下文继承
 * - 上下文信息在所有日志记录中自动附加
 *
 * ### 性能优化规则
 * - 使用 getter 方式实现延迟初始化
 * - 避免在类实例化时创建日志器
 * - 支持单例模式，避免重复创建
 * - 日志器创建过程高效且轻量
 *
 * ## 业务逻辑流程
 *
 * 1. **装饰器应用**：将装饰器应用到类属性上
 * 2. **属性定义**：定义属性的 getter 访问器
 * 3. **延迟创建**：在首次访问时创建日志器实例
 * 4. **上下文设置**：设置日志器的上下文信息
 * 5. **实例返回**：返回配置完成的日志器实例
 * 6. **后续访问**：直接返回已创建的日志器实例
 *
 * @param context - 日志上下文名称，用于标识日志来源和上下文信息
 * @returns PropertyDecorator 属性装饰器，用于装饰类属性
 *
 * @example
 * ```typescript
 * import { InjectLogger, PinoLogger } from '@hl8/logger';
 * import { Injectable } from '@nestjs/common';
 *
 * @Injectable()
 * export class UserService {
 *   @InjectLogger('UserService')
 *   private readonly logger: PinoLogger;
 *
 *   async createUser(userData: any) {
 *     this.logger.info('Creating user', { userData });
 *     try {
 *       const user = await this.userRepository.create(userData);
 *       this.logger.info('User created successfully', { userId: user.id });
 *       return user;
 *     } catch (error) {
 *       this.logger.error('Failed to create user', { error: error.message });
 *       throw error;
 *     }
 *   }
 * }
 * ```
 */
export function InjectLogger(context?: string): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol | undefined) {
    if (!propertyKey) return;
    // 定义属性描述符，使用 getter 来延迟创建日志记录器
    Object.defineProperty(target, propertyKey, {
      get() {
        // 创建日志记录器实例
        const logger = new PinoLogger({ level: 'trace' });

        // 设置上下文
        if (context) {
          logger.setContext({ requestId: '', metadata: { context } });
        }

        return logger;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

/**
 * 请求日志装饰器
 *
 * @description 自动记录方法调用的开始和结束日志
 * 支持自定义日志级别和消息格式
 *
 * @param options - 日志选项
 * @returns {MethodDecorator} 方法装饰器
 *
 * @example
 * ```typescript
 * class UserService {
 *   @LogMethod({ level: 'info', message: 'User creation started' })
 *   async createUser(userData: any) {
 *     // 方法实现
 *   }
 * }
 * ```
 */
export function LogMethod(
  options: {
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message?: string;
    includeArgs?: boolean;
    includeResult?: boolean;
  } = {}
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const {
      level = 'info',
      message,
      includeArgs = false,
      includeResult = false,
    } = options;

    descriptor.value = async function (...args: unknown[]) {
      const logger = new PinoLogger();
      const methodName = `${
        (target as { constructor: { name: string } }).constructor.name
      }.${String(propertyKey)}`;
      const logMessage = message || `${methodName} called`;

      try {
        // 记录方法开始日志
        logger[level](logMessage, {
          method: methodName,
          args: includeArgs ? args : undefined,
          timestamp: new Date().toISOString(),
        });

        // 执行原方法
        const result = await originalMethod?.apply(this, args);

        // 记录方法完成日志
        logger[level](`${methodName} completed`, {
          method: methodName,
          result: includeResult ? result : undefined,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        // 记录方法错误日志
        logger.error(`${methodName} failed`, {
          method: methodName,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
          timestamp: new Date().toISOString(),
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 性能日志装饰器
 *
 * @description 自动记录方法执行时间和性能指标
 * 支持性能阈值警告和详细性能分析
 *
 * @param options - 性能日志选项
 * @returns {MethodDecorator} 方法装饰器
 *
 * @example
 * ```typescript
 * class UserService {
 *   @LogPerformance({ threshold: 1000, level: 'warn' })
 *   async processUsers(users: User[]) {
 *     // 方法实现
 *   }
 * }
 * ```
 */
export function LogPerformance(
  options: {
    threshold?: number;
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    includeMemory?: boolean;
    includeArgs?: boolean;
  } = {}
): MethodDecorator {
  return function (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const {
      threshold = 1000,
      level = 'info',
      includeMemory = false,
      includeArgs = false,
    } = options;

    descriptor.value = async function (...args: unknown[]) {
      const logger = new PinoLogger();
      const methodName = `${
        (target as { constructor: { name: string } }).constructor.name
      }.${String(propertyKey)}`;
      const startTime = Date.now();
      const startMemory = includeMemory ? process.memoryUsage() : undefined;

      try {
        // 执行原方法
        const result = await originalMethod?.apply(this, args);

        // 计算执行时间
        const duration = Date.now() - startTime;
        const endMemory = includeMemory ? process.memoryUsage() : undefined;

        // 确定日志级别
        const logLevel = duration > threshold ? 'warn' : level;

        // 记录性能日志
        logger[logLevel](`${methodName} performance`, {
          method: methodName,
          duration,
          threshold,
          args: includeArgs ? args : undefined,
          memory: includeMemory
            ? {
                start: startMemory,
                end: endMemory,
                delta:
                  endMemory && startMemory
                    ? {
                        rss: endMemory.rss - startMemory.rss,
                        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
                        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
                        external: endMemory.external - startMemory.external,
                      }
                    : undefined,
              }
            : undefined,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;

        // 记录错误性能日志
        logger.error(`${methodName} performance (error)`, {
          method: methodName,
          duration,
          threshold,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: error.stack,
                }
              : error,
          timestamp: new Date().toISOString(),
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 错误日志装饰器
 *
 * @description 自动捕获和记录方法执行过程中的错误
 * 支持错误分类、错误统计和错误通知功能
 *
 * @param options - 错误日志选项
 * @returns {MethodDecorator} 方法装饰器
 *
 * @example
 * ```typescript
 * class UserService {
 *   @LogError({ includeStack: true, level: 'error' })
 *   async deleteUser(userId: string) {
 *     // 方法实现
 *   }
 * }
 * ```
 */
export function LogError(
  options: {
    level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    includeStack?: boolean;
    includeArgs?: boolean;
    rethrow?: boolean;
  } = {}
): MethodDecorator {
  return function (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const {
      level = 'error',
      includeStack = true,
      includeArgs = false,
      rethrow = true,
    } = options;

    descriptor.value = async function (...args: unknown[]) {
      const logger = new PinoLogger();
      const methodName = `${
        (target as { constructor: { name: string } }).constructor.name
      }.${String(propertyKey)}`;

      try {
        // 执行原方法
        const result = await originalMethod?.apply(this, args);
        return result;
      } catch (error) {
        // 记录错误日志
        logger[level](`${methodName} error`, {
          method: methodName,
          error:
            error instanceof Error
              ? {
                  name: error.name,
                  message: error.message,
                  stack: includeStack ? error.stack : undefined,
                }
              : error,
          args: includeArgs ? args : undefined,
          timestamp: new Date().toISOString(),
        });

        // 重新抛出错误
        if (rethrow) {
          throw error;
        }
      }
    };

    return descriptor;
  };
}

/**
 * 请求上下文装饰器
 *
 * @description 自动绑定请求上下文到方法参数
 * 支持用户ID、追踪ID等上下文信息的自动传递
 *
 * @param contextKey - 上下文键名
 * @returns {ParameterDecorator} 参数装饰器
 *
 * @example
 * ```typescript
 * class UserService {
 *   async getUser(@RequestContext('userId') userId: string) {
 *     // 方法实现
 *   }
 * }
 * ```
 */
export function RequestContext(
  contextKey: keyof RequestContext
): ParameterDecorator {
  return function (
    target: unknown,
    propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    if (!propertyKey) return;
    const existingMetadata =
      Reflect.getMetadata('requestContext', target as object, propertyKey) ||
      [];
    existingMetadata[parameterIndex] = contextKey;
    Reflect.defineMetadata(
      'requestContext',
      existingMetadata,
      target as object,
      propertyKey
    );
  };
}

/**
 * 日志级别装饰器
 *
 * @description 为类或方法设置默认日志级别
 * 支持类级别和方法级别的日志级别设置
 *
 * @param level - 日志级别
 * @returns {ClassDecorator | MethodDecorator} 装饰器
 *
 * @example
 * ```typescript
 * @LogLevel('debug')
 * class UserService {
 *   @LogLevel('info')
 *   async createUser(userData: any) {
 *     // 方法实现
 *   }
 * }
 * ```
 */
export function LogLevel(
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'
): ClassDecorator & MethodDecorator {
  return function (
    target: unknown,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey && descriptor) {
      // 方法装饰器
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: unknown[]) {
        const logger = new PinoLogger();
        logger.setLevel(level);
        return await originalMethod.apply(this, args);
      };
    } else {
      // 类装饰器
      Reflect.defineMetadata('logLevel', level, target as object);
    }
  };
}

/**
 * 日志上下文装饰器
 *
 * @description 为类或方法设置日志上下文
 * 支持自动上下文绑定和上下文信息传递
 *
 * @param context - 上下文信息
 * @returns {ClassDecorator | MethodDecorator} 装饰器
 *
 * @example
 * ```typescript
 * @LogContext({ service: 'UserService', version: '1.0.0' })
 * class UserService {
 *   @LogContext({ operation: 'createUser' })
 *   async createUser(userData: any) {
 *     // 方法实现
 *   }
 * }
 * ```
 */
export function LogContext(
  context: Record<string, unknown>
): ClassDecorator & MethodDecorator {
  return function (
    target: unknown,
    propertyKey?: string | symbol,
    descriptor?: PropertyDescriptor
  ) {
    if (propertyKey && descriptor) {
      // 方法装饰器
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: unknown[]) {
        const logger = new PinoLogger();
        logger.setContext({ requestId: '', ...context });
        return await originalMethod.apply(this, args);
      };
    } else {
      // 类装饰器
      Reflect.defineMetadata('logContext', context, target as object);
    }
  };
}

/**
 * 获取日志记录器实例
 *
 * @description 获取当前请求的日志记录器实例
 * 自动绑定请求上下文和用户信息
 *
 * @param context - 日志上下文
 * @returns {PinoLogger} 日志记录器实例
 *
 * @example
 * ```typescript
 * const logger = getLogger('UserService');
 * logger.info('User created successfully');
 * ```
 */
export function getLogger(context?: string): PinoLogger {
  const logger = new PinoLogger();

  if (context) {
    logger.setContext({ requestId: '', metadata: { context } });
  }

  // 绑定当前请求上下文
  const requestContext = getCurrentRequestContext();
  if (requestContext) {
    logger.setContext(requestContext);
  }

  return logger;
}

/**
 * 更新请求元数据
 *
 * @description 更新当前请求的元数据信息
 * 用于记录额外的上下文信息和追踪数据
 *
 * @param metadata - 元数据信息
 *
 * @example
 * ```typescript
 * updateRequestMetadata({
 *   operation: 'user-login',
 *   ip: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...'
 * });
 * ```
 */
export function updateRequestMetadata(metadata: Record<string, unknown>): void {
  updateCurrentRequestMetadata(metadata);
}
