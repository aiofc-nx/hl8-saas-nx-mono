/**
 * HL8 SAAS API 应用启动文件
 *
 * 使用 Fastify-Pro 企业级 Web 框架提供高性能的 API 服务。
 * 集成企业级功能：健康检查、性能监控、多租户支持、CORS 配置等。
 *
 * @description 此文件是 API 应用的启动入口，使用 Fastify-Pro 企业级适配器。
 * 提供高性能的 Web 服务，支持企业级功能如健康检查、性能监控等。
 * 集成多租户架构和事件驱动架构支持。
 *
 * ## 业务规则
 *
 * ### 企业级功能规则
 * - 启用健康检查服务，监控应用状态
 * - 启用性能监控，收集性能指标
 * - 启用多租户支持，支持租户隔离
 * - 配置 CORS 策略，支持跨域请求
 *
 * ### 配置管理规则
 * - 从配置文件读取服务器配置
 * - 支持环境变量覆盖配置
 * - 配置验证失败时阻止应用启动
 * - 支持配置热重载和动态更新
 *
 * ### 日志记录规则
 * - 集成结构化日志记录
 * - 支持请求/响应日志记录
 * - 支持性能指标日志记录
 * - 支持错误日志记录和追踪
 *
 * ## 业务逻辑流程
 *
 * 1. **应用创建**：使用 Fastify-Pro 企业级适配器创建应用
 * 2. **配置加载**：加载应用配置和环境变量
 * 3. **企业级功能初始化**：初始化健康检查、性能监控等功能
 * 4. **中间件配置**：配置 CORS、多租户等中间件
 * 5. **服务启动**：启动企业级 Web 服务
 *
 * @example
 * ```typescript
 * // 启动企业级 API 服务
 * async function bootstrap() {
 *   const app = await NestFactory.create<NestFastifyApplication>(
 *     AppModule,
 *     new EnterpriseFastifyAdapter({
 *       enterprise: {
 *         enableHealthCheck: true,
 *         enablePerformanceMonitoring: true,
 *         enableMultiTenant: true,
 *         corsOptions: {
 *           origin: ['https://app.hl8-saas.com'],
 *           credentials: true
 *         }
 *       }
 *     })
 *   );
 * }
 * ```
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { EnterpriseFastifyAdapter } from '@hl8/fastify-pro';
import { AppModule } from './app/app.module';
import { AppConfig } from './app/config/app.config';

async function bootstrap() {
  // 使用 Fastify-Pro 企业级适配器创建应用
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new EnterpriseFastifyAdapter({
      enterprise: {
        enableHealthCheck: false, // 使用自定义 HealthController
        enablePerformanceMonitoring: true,
        enableMultiTenant: true,
        tenantHeader: 'X-Tenant-ID',
        corsOptions: {
          origin: ['http://localhost:3000', 'http://localhost:3001'],
          credentials: true,
        },
        logger: {
          level: 'info',
          prettyPrint: true,
        },
      },
    }) as any
  );

  // 获取应用配置
  const appConfig = app.get(AppConfig);

  // 从配置文件获取API前缀
  const globalPrefix = appConfig.server.globalPrefix || 'api';
  app.setGlobalPrefix(globalPrefix);

  // 处理 favicon.ico 请求，避免 404 错误
  app.useStaticAssets({
    root: process.cwd(),
    prefix: '/',
  });

  // 添加 favicon.ico 路由处理
  app.getHttpAdapter().get('/favicon.ico', (req, res) => {
    res.status(204).send();
  });

  // 从配置文件获取端口和主机
  const port = appConfig.server.port;
  const host = appConfig.server.host || '0.0.0.0';

  // 启动企业级 Web 服务
  await app.listen(port, host);

  Logger.log(
    `🚀 HL8 SAAS API is running on: http://${host}:${port}/${globalPrefix}`
  );
  Logger.log(`📊 Health Check: http://${host}:${port}/${globalPrefix}/health`);
  Logger.log(`📈 Metrics: http://${host}:${port}/${globalPrefix}/metrics`);
}

bootstrap();
