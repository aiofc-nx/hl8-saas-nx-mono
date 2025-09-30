/**
 * Fastify-Pro 企业级Fastify集成库
 *
 * 提供高性能、企业级功能的Web框架支持，基于Fastify和NestJS。
 *
 * @description 此库提供高性能、企业级功能的Web框架支持。
 * 基于Fastify和NestJS，提供完整的插件管理、中间件管理、监控系统等企业级功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 模块导出规则
 * - 所有公共API必须通过此文件导出
 * - 导出内容按功能分类组织
 * - 支持按需导入和全量导入
 * - 保持API的向后兼容性
 *
 * ### 功能分类规则
 * - 核心适配器：企业级Fastify适配器
 * - 插件系统：CORS、核心插件等
 * - 中间件系统：租户中间件、核心中间件
 * - 监控系统：健康检查服务
 * - 类型定义：Fastify类型定义
 * - NestJS模块：Fastify-Pro模块
 * - 示例：集成示例代码
 *
 * @example
 * ```typescript
 * // 导入核心适配器
 * import { CoreFastifyAdapter, EnterpriseFastifyAdapter } from '@hl8/fastify-pro';
 *
 * // 导入中间件
 * import { TenantExtractionMiddleware } from '@hl8/fastify-pro';
 *
 * // 导入监控服务
 * import { HealthCheckService } from '@hl8/fastify-pro';
 * ```
 */

// 核心适配器
export * from './lib/adapters/core-fastify.adapter';
export * from './lib/adapters/enterprise-fastify.adapter';

// 插件系统
export * from './lib/plugins/core-fastify.plugin';
export * from './lib/plugins/cors.plugin';

// 中间件系统
export * from './lib/middleware/core-fastify.middleware';
export * from './lib/middleware/tenant.middleware';

// 监控系统
export * from './lib/monitoring/health-check.service';

// 类型定义
export * from './lib/types/fastify.types';

// NestJS模块
export * from './lib/modules/fastify-pro.module';

// 示例
export * from './examples/fastify-pro-multi-tenancy-integration.example';
