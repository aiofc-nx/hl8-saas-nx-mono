/**
 * Fastify-Pro 企业级Fastify集成库
 *
 * @description 提供高性能、企业级功能的Web框架支持
 * 基于Fastify和NestJS，提供完整的插件管理、中间件管理、监控系统等企业级功能
 *
 * @since 1.0.0
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
