/**
 * 租户模块
 *
 * 提供多租户管理功能，支持租户隔离、权限控制、配置管理等功能。
 * 集成 Fastify-Pro 多租户中间件，提供完整的多租户架构支持。
 *
 * @description 此模块提供完整的多租户管理功能。
 * 支持租户信息管理、租户隔离、权限控制、配置管理等功能。
 * 集成 Fastify-Pro 多租户中间件，提供企业级多租户架构支持。
 *
 * ## 业务规则
 *
 * ### 租户管理规则
 * - 支持租户信息查询和状态管理
 * - 支持租户配置管理和更新
 * - 支持租户权限和资源隔离
 * - 支持租户数据统计和监控
 *
 * ### 租户隔离规则
 * - 每个租户拥有独立的数据空间
 * - 租户间数据完全隔离
 * - 支持租户级别的权限控制
 * - 支持租户级别的配置管理
 *
 * ### 租户标识规则
 * - 支持通过请求头传递租户ID
 * - 支持通过子域名识别租户
 * - 支持通过URL路径识别租户
 * - 支持租户ID格式验证
 *
 * ## 业务逻辑流程
 *
 * 1. **模块初始化**：初始化租户管理服务和相关组件
 * 2. **服务注册**：注册租户控制器和服务
 * 3. **中间件配置**：配置多租户中间件
 * 4. **权限控制**：设置租户级别的权限控制
 * 5. **接口暴露**：暴露租户管理接口
 *
 * @example
 * ```typescript
 * // 在应用模块中导入租户模块
 * @Module({
 *   imports: [
 *     TenantModule,
 *     // 其他模块...
 *   ],
 * })
 * export class AppModule {}
 *
 * // 租户管理接口使用示例
 * // GET /api/tenant/info - 获取租户信息
 * // GET /api/tenant/stats - 获取租户统计
 * // GET /api/tenant/status - 检查租户状态
 * // POST /api/tenant/config - 更新租户配置
 * ```
 */

import { Module } from '@nestjs/common';
import { TenantController } from './tenant.controller';

/**
 * 租户模块
 *
 * @description 提供多租户管理功能
 */
@Module({
  controllers: [TenantController],
  providers: [],
  exports: [],
})
export class TenantModule {}
