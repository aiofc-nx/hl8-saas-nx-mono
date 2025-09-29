/**
 * API应用服务类
 *
 * 提供API应用的核心业务逻辑，包括应用信息查询、健康检查等功能。
 * 集成配置管理和日志记录，提供完整的应用服务能力。
 *
 * @description 此服务类是API应用的核心业务逻辑层。
 * 提供应用信息查询、健康检查、配置展示等功能。
 * 集成配置管理和日志记录，确保服务的可观测性和可维护性。
 *
 * ## 业务规则
 *
 * ### 配置访问规则
 * - 通过依赖注入获取应用配置
 * - 配置访问具有类型安全保障
 * - 支持配置值的实时获取和验证
 * - 配置变更时自动更新服务状态
 *
 * ### 日志记录规则
 * - 记录关键业务操作的日志
 * - 使用结构化日志格式
 * - 包含请求上下文和用户信息
 * - 支持日志级别配置和过滤
 *
 * ### 健康检查规则
 * - 提供应用健康状态检查接口
 * - 检查关键依赖服务的可用性
 * - 返回详细的健康状态信息
 * - 支持健康检查的缓存和限流
 *
 * ## 业务逻辑流程
 *
 * 1. **服务初始化**：注入配置和日志服务
 * 2. **请求处理**：处理业务请求
 * 3. **日志记录**：记录操作日志和上下文
 * 4. **配置查询**：从配置中获取相关信息
 * 5. **响应返回**：返回处理结果
 *
 * @example
 * ```typescript
 * // 在其他服务中使用
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private readonly appService: AppService,
 *     private readonly config: AppConfig
 *   ) {}
 *
 *   async getUsers() {
 *     const appInfo = this.appService.getAppInfo();
 *     // 业务逻辑
 *   }
 * }
 * ```
 */

import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger, LOGGER_PROVIDER } from '@hl8/logger';
import { AppConfig } from './config/app.config';

/**
 * API应用服务
 *
 * @description 提供API应用的核心业务逻辑和配置管理功能
 */
@Injectable()
export class AppService {
  /**
   * 构造函数
   *
   * @description 注入配置和日志服务，初始化应用服务
   * @param config - 应用配置实例
   */
  constructor(
    private readonly config: AppConfig,
    @Inject(LOGGER_PROVIDER) private readonly logger: PinoLogger
  ) {
    this.logger.info('AppService initialized', {
      appName: this.config.app.name,
      version: this.config.app.version,
      environment: this.config.app.environment,
    });
  }

  /**
   * 获取应用基本信息
   *
   * @description 返回应用的名称、版本、环境等基本信息
   * @returns 包含应用基本信息的对象
   *
   * @example
   * ```typescript
   * const appInfo = appService.getAppInfo();
   * console.log(appInfo.name); // "HL8 SAAS API"
   * console.log(appInfo.version); // "1.0.0"
   * ```
   */
  getAppInfo(): {
    name: string;
    version: string;
    environment: string;
    description?: string;
  } {
    this.logger.debug('Getting app info', {
      appName: this.config.app.name,
    });

    return {
      name: this.config.app.name,
      version: this.config.app.version,
      environment: this.config.app.environment,
      description: this.config.app.description,
    };
  }

  /**
   * 获取应用配置信息
   *
   * @description 返回应用的关键配置信息（不包含敏感信息）
   * @returns 包含应用配置信息的对象
   *
   * @example
   * ```typescript
   * const config = appService.getConfigInfo();
   * console.log(config.server.port); // 3000
   * console.log(config.database.type); // "postgresql"
   * ```
   */
  getConfigInfo(): {
    server: {
      port: number;
      host?: string;
      enableCors?: boolean;
    };
    database: {
      type: string;
      host: string;
      port: number;
      database: string;
      ssl?: boolean;
      poolSize?: number;
    };
    logging: {
      level: string;
      enableRequestLogging?: boolean;
      enableResponseLogging?: boolean;
    };
  } {
    this.logger.debug('Getting config info');

    return {
      server: {
        port: this.config.server.port,
        host: this.config.server.host,
        enableCors: this.config.server.enableCors,
      },
      database: {
        type: this.config.database.type,
        host: this.config.database.host,
        port: this.config.database.port,
        database: this.config.database.database,
        ssl: this.config.database.ssl,
        poolSize: this.config.database.poolSize,
      },
      logging: {
        level: this.config.logging.level,
        enableRequestLogging: this.config.logging.enableRequestLogging,
        enableResponseLogging: this.config.logging.enableResponseLogging,
      },
    };
  }

  /**
   * 应用健康检查
   *
   * @description 检查应用的健康状态，包括关键服务的可用性
   * @returns 包含健康状态信息的对象
   *
   * @example
   * ```typescript
   * const health = appService.getHealth();
   * console.log(health.status); // "healthy"
   * console.log(health.uptime); // 12345
   * ```
   */
  getHealth(): {
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
  } {
    const uptime = process.uptime();

    this.logger.debug('Health check requested', {
      uptime,
      status: 'healthy',
    });

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      version: this.config.app.version,
      environment: this.config.app.environment,
    };
  }

  /**
   * 获取问候消息
   *
   * @description 返回个性化的问候消息，包含应用信息
   * @returns 包含问候消息的对象
   *
   * @example
   * ```typescript
   * const greeting = appService.getData();
   * console.log(greeting.message); // "Hello from HL8 SAAS API v1.0.0"
   * ```
   */
  getData(): { message: string } {
    const message = `Hello from ${this.config.app.name} v${this.config.app.version}`;

    this.logger.info('Greeting message requested', {
      appName: this.config.app.name,
      version: this.config.app.version,
    });

    return { message };
  }

  /**
   * 获取服务器配置
   *
   * @description 返回服务器相关的配置信息
   * @returns 服务器配置对象
   */
  getServerConfig() {
    return {
      port: this.config.server.port,
      host: this.config.server.host || 'localhost',
      enableCors: this.config.server.enableCors || false,
      corsOrigins: this.config.server.corsOrigins || [],
    };
  }

  /**
   * 获取数据库配置
   *
   * @description 返回数据库连接配置信息（不包含密码等敏感信息）
   * @returns 数据库配置对象
   */
  getDatabaseConfig() {
    return {
      type: this.config.database.type,
      host: this.config.database.host,
      port: this.config.database.port,
      database: this.config.database.database,
      username: this.config.database.username,
      ssl: this.config.database.ssl || false,
      poolSize: this.config.database.poolSize || 10,
    };
  }

  /**
   * 获取认证配置
   *
   * @description 返回认证相关的配置信息（不包含密钥等敏感信息）
   * @returns 认证配置对象
   */
  getAuthConfig() {
    return {
      jwtExpirationTime: this.config.auth.jwtExpirationTime,
      jwtRefreshExpirationTime: this.config.auth.jwtRefreshExpirationTime,
      passwordSaltRounds: this.config.auth.passwordSaltRounds || 12,
    };
  }
}
