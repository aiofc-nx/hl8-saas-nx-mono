/**
 * HL8 SAAS平台缓存模块
 *
 * 提供高性能的缓存功能，专为多租户SAAS平台设计。
 * 基于Redis和nestjs-cls，支持高性能缓存、租户隔离、上下文管理等功能。
 * 遵循Clean Architecture的基础设施层设计原则，为整个平台提供缓存服务。
 *
 * @description 此模块是HL8 SAAS平台的基础设施层核心模块，提供统一的缓存管理接口。
 * 支持高性能缓存、租户隔离、上下文绑定、装饰器支持等功能。
 * 专为多租户SAAS平台优化，提供完整的缓存管理和监控能力。
 *
 * ## 业务规则
 *
 * ### 高性能缓存规则
 * - 基于Redis的高性能缓存存储
 * - 支持异步缓存操作，避免阻塞主线程
 * - 结构化数据存储，便于数据分析和处理
 * - 支持多种缓存策略：TTL、LRU、LFU等
 * - 支持缓存预热和批量操作
 *
 * ### 租户隔离规则
 * - 自动绑定租户上下文到缓存操作
 * - 支持租户级别的缓存命名空间
 * - 使用nestjs-cls实现上下文传递
 * - 支持租户级别的缓存统计和监控
 * - 租户缓存完全隔离，确保数据安全
 *
 * ### 上下文管理规则
 * - 基于nestjs-cls的透明上下文管理
 * - 支持租户ID、用户ID、请求ID等上下文信息
 * - 上下文信息在所有异步操作中保持可用
 * - 支持自定义上下文数据和元数据
 * - 自动的上下文清理和垃圾回收
 *
 * ### 装饰器支持规则
 * - 支持缓存装饰器，简化缓存使用
 * - 支持条件缓存和缓存失效装饰器
 * - 装饰器支持租户上下文绑定和参数记录
 * - 支持自定义装饰器配置和选项
 * - 装饰器支持缓存键生成和TTL设置
 *
 * ### 监控统计规则
 * - 支持缓存命中率统计和性能监控
 * - 支持租户级别的缓存使用统计
 * - 支持缓存健康检查和错误监控
 * - 支持缓存性能指标收集和分析
 * - 支持缓存使用趋势和容量规划
 *
 * ## 业务逻辑流程
 *
 * 1. **模块初始化**：通过CacheModule.forRoot()初始化
 * 2. **Redis连接**：建立Redis连接池和健康检查
 * 3. **上下文管理**：初始化nestjs-cls进行上下文管理
 * 4. **依赖注入**：将缓存服务注册为NestJS提供者
 * 5. **装饰器注册**：注册缓存装饰器和中间件
 * 6. **服务使用**：通过装饰器或直接注入使用缓存服务
 * 7. **缓存操作**：执行缓存操作，包含租户上下文
 *
 * @example
 * ```typescript
 * import { CacheModule, CacheService, InjectCache } from '@hl8/cache';
 * import { Module, Injectable } from '@nestjs/common';
 *
 * // 配置模块
 * @Module({
 *   imports: [CacheModule.forRoot({
 *     redis: {
 *       host: 'localhost',
 *       port: 6379,
 *       password: 'password',
 *       db: 0
 *     },
 *     defaultTTL: 3600,
 *     keyPrefix: 'hl8:cache:',
 *     enableTenantIsolation: true,
 *     cls: {
 *       global: true,
 *       middleware: { mount: true, generateId: true }
 *     }
 *   })],
 * })
 * export class AppModule {}
 *
 * // 使用缓存服务
 * @Injectable()
 * export class UserService {
 *   @InjectCache()
 *   private readonly cacheService: CacheService;
 *
 *   @Cacheable('user', 3600)
 *   async getUser(userId: string): Promise<User> {
 *     // 业务逻辑
 *     const user = await this.userRepository.findById(userId);
 *     return user;
 *   }
 *
 *   @CacheEvict('user')
 *   async updateUser(userId: string, userData: any): Promise<void> {
 *     await this.userRepository.update(userId, userData);
 *   }
 * }
 * ```
 */

// 核心模块导出
export * from './lib/cache.module';

// 服务导出
export * from './lib/cache.service';
export * from './lib/redis.service';
// ContextService 已由 @hl8/multi-tenancy 的 TenantContextService 替代

// 常量定义导出
export * from './lib/constants';

// 类型定义导出
export * from './lib/types/cache.types';

// 装饰器导出
export * from './lib/decorators/cacheable.decorator';
export * from './lib/decorators/cache-evict.decorator';
export * from './lib/decorators/cache-put.decorator';

// 工具函数导出
export * from './lib/utils/key-generator.util';
export * from './lib/utils/serializer.util';

// 监控导出
export * from './lib/monitoring/cache-monitor.service';
export * from './lib/monitoring/cache-stats.service';
export * from './lib/monitoring/health-check.service';
