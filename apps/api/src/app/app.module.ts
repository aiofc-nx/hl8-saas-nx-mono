/**
 * API应用主模块
 *
 * 定义API应用的主要模块结构，集成配置管理、日志记录等功能。
 * 提供完整的应用配置和依赖注入支持。
 *
 * @description 此模块是API应用的根模块，负责整合所有功能模块。
 * 集成配置管理、日志记录、异常处理等基础设施模块。
 * 为整个API应用提供统一的配置和日志服务。
 *
 * ## 业务规则
 *
 * ### 模块导入规则
 * - 优先导入配置模块，确保配置优先加载
 * - 导入日志模块，提供日志记录服务
 * - 导入异常处理模块，提供统一异常处理
 * - 按依赖关系顺序导入模块
 *
 * ### 配置管理规则
 * - 使用 TypedConfigModule 进行类型安全的配置管理
 * - 支持 YAML 配置文件和环境变量
 * - 配置验证失败时阻止应用启动
 * - 支持配置热重载和动态更新
 *
 * ### 日志记录规则
 * - 集成 LoggerModule 提供高性能日志记录
 * - 支持请求/响应日志记录
 * - 支持结构化日志输出
 * - 支持日志级别配置和过滤
 *
 * ## 业务逻辑流程
 *
 * 1. **配置加载**：加载应用配置文件和环境变量
 * 2. **配置验证**：验证配置的完整性和有效性
 * 3. **模块初始化**：初始化各个功能模块
 * 4. **依赖注入**：配置依赖注入容器
 * 5. **服务启动**：启动应用服务
 *
 * @example
 * ```typescript
 * // 在其他模块中注入配置
 * @Injectable()
 * export class DatabaseService {
 *   constructor(
 *     private readonly config: AppConfig,
 *     private readonly logger: PinoLogger
 *   ) {
 *     this.logger.info('Database service initialized', {
 *       host: this.config.database.host,
 *       port: this.config.database.port
 *     });
 *   }
 * }
 * ```
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypedConfigModule, fileLoader } from '@hl8/config';
import { LoggerModule } from '@hl8/logger';
import { ExceptionModule } from '@hl8/common';
import { FastifyProModule } from '@hl8/fastify-pro';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfig } from './config/app.config';
import { HealthModule } from './health/health.module';
import { TenantModule } from './tenant/tenant.module';
import { MetricsModule } from './metrics/metrics.module';
import { RequestLoggingInterceptor } from './interceptors/request-logging.interceptor';
import { join } from 'path';

@Module({
  imports: [
    // 配置模块 - 优先导入，确保配置优先加载
    TypedConfigModule.forRoot({
      schema: AppConfig,
      load: fileLoader({
        path: join(__dirname, 'config/app.yml'),
        ignoreEnvironmentVariableSubstitution: false,
      }),
      // 全局模块，可在整个应用中直接使用
      isGlobal: true,
    }),

    // 日志模块 - 提供高性能日志记录
    LoggerModule.forRootAsync({
      useFactory: (appConfig: AppConfig) => {
        const loggingConfig = appConfig.logging;

        return {
          config: {
            level: loggingConfig.level,
            // 不设置 destination，让日志同时输出到控制台和文件
            format: {
              timestamp: loggingConfig.format?.timestamp ?? true,
              colorize: loggingConfig.format?.colorize ?? true,
              prettyPrint: loggingConfig.format?.prettyPrint ?? true,
              translateTime:
                loggingConfig.format?.translateTime ?? 'yyyy-mm-dd HH:MM:ss',
              ignore: loggingConfig.format?.ignore ?? 'pid,hostname',
            },
            // 确保 JSON 格式美化
            serializers: {
              req: (req) => ({
                method: req.method,
                url: req.url,
                headers: req.headers,
                remoteAddress: req.remoteAddress,
                remotePort: req.remotePort,
              }),
              res: (res) => ({
                statusCode: res.statusCode,
                responseTime: res.responseTime,
              }),
            },
          },
          enableRequestLogging: loggingConfig.enableRequestLogging,
          enableResponseLogging: loggingConfig.enableResponseLogging,
          global: true,
        };
      },
      inject: [AppConfig],
    }),

    // 异常处理模块 - 提供统一异常处理
    ExceptionModule.forRoot({
      documentationUrl: 'https://docs.hl8-saas.com/api/errors',
      logLevel: 'error',
      enableStackTrace: true,
      enableRequestLogging: true,
      enableResponseLogging: true,
    }),

    // Fastify-Pro 企业级 Web 框架模块 - 提供企业级功能
    FastifyProModule.forRootAsync({
      useFactory: (appConfig: AppConfig) => ({
        enterprise: {
          enableHealthCheck: false, // 禁用自动健康检查，使用自定义 HealthController
          enablePerformanceMonitoring: true,
          enableMultiTenant: true,
          tenantHeader: 'X-Tenant-ID',
          corsOptions: {
            origin: appConfig.server.corsOrigins || ['http://localhost:3000'],
            credentials: true,
          },
          logger: {
            level: appConfig.logging.level,
            prettyPrint: appConfig.logging.format?.prettyPrint ?? true,
          },
        },
      }),
      inject: [AppConfig as any],
    }) as any,

    // 健康检查模块 - 提供应用健康状态检查
    HealthModule,

    // 租户模块 - 提供多租户管理功能
    TenantModule,

    // 性能指标模块 - 提供性能监控和指标收集功能
    MetricsModule,

  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 请求日志拦截器 - 记录所有HTTP请求的详细信息
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule {}
