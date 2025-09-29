/**
 * 健康检查模块
 *
 * 提供应用健康状态检查功能，集成 Fastify-Pro 企业级健康检查服务。
 * 支持系统资源监控、组件状态检查、外部依赖检查等功能。
 *
 * @description 此模块提供完整的健康检查功能。
 * 集成 Fastify-Pro 企业级健康检查服务，提供标准化的健康检查接口。
 * 支持 Kubernetes 等容器编排平台的健康检查需求。
 *
 * ## 业务规则
 *
 * ### 健康检查规则
 * - 提供标准化的健康检查响应格式
 * - 支持系统资源状态监控
 * - 支持数据库连接状态检查
 * - 支持外部服务依赖检查
 *
 * ### 监控指标规则
 * - 记录健康检查请求次数和响应时间
 * - 记录系统资源使用情况
 * * - 记录错误和异常情况
 * - 支持性能指标收集
 *
 * ### 集成规则
 * - 集成 Fastify-Pro 企业级健康检查服务
 * - 支持配置化的健康检查策略
 * - 支持自定义健康检查组件
 * - 支持健康检查结果缓存
 *
 * ## 业务逻辑流程
 *
 * 1. **模块初始化**：初始化健康检查服务和相关组件
 * 2. **服务注册**：注册健康检查控制器和服务
 * 3. **配置加载**：加载健康检查相关配置
 * 4. **监控启动**：启动系统资源监控
 * 5. **接口暴露**：暴露健康检查接口
 *
 * @example
 * ```typescript
 * // 在应用模块中导入健康检查模块
 * @Module({
 *   imports: [
 *     HealthModule,
 *     // 其他模块...
 *   ],
 * })
 * export class AppModule {}
 *
 * // 健康检查接口使用示例
 * // GET /api/health - 完整健康检查
 * // GET /api/health/ready - 就绪检查
 * // GET /api/health/live - 存活检查
 * ```
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthCheckService } from '@hl8/fastify-pro';

/**
 * 健康检查模块
 *
 * @description 提供应用健康状态检查功能
 */
@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: HealthCheckService,
      useFactory: () => {
        // 创建一个模拟的 Fastify 实例
        const mockFastify = {
          addHook: () => {},
          decorate: () => {},
          hasDecorator: () => false,
          log: console,
        };
        return new HealthCheckService(mockFastify as any, {
          checkSystemResources: true,
        });
      },
    },
  ],
  exports: [HealthCheckService],
})
export class HealthModule {}
