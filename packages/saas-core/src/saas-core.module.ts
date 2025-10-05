/**
 * SAAS-CORE 主模块
 * 
 * @description SAAS-CORE模块的入口点，集成hybrid-archi架构
 * 提供租户、用户、组织、部门、认证等核心业务功能
 * 
 * ## 模块功能
 * 
 * ### 核心子领域
 * - 租户管理：租户生命周期、配置、资源限制
 * - 用户管理：用户账户、权限、状态管理
 * - 组织管理：组织架构、部门层级管理
 * - 认证授权：登录认证、权限验证、会话管理
 * 
 * ### 架构集成
 * - 集成@hl8/hybrid-archi混合架构
 * - 集成@hl8/multi-tenancy多租户支持
 * - 集成@hl8/fastify-pro企业级Fastify
 * - 支持PostgreSQL数据库和Redis缓存
 * 
 * @example
 * ```typescript
 * // 导入模块
 * import { SaasCoreModule } from '@hl8/saas-core';
 * 
 * @Module({
 *   imports: [
 *     SaasCoreModule.forRoot({
 *       database: {
 *         host: 'localhost',
 *         port: 5432,
 *         database: 'saas_core'
 *       },
 *       cache: {
 *         host: 'localhost',
 *         port: 6379
 *       }
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 * 
 * @since 1.0.0
 */

import { Module, DynamicModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// 领域层
import { TenantAggregate } from './domain/tenant/aggregates/tenant.aggregate';

// 应用层
// import { TenantService } from './application/services/tenant.service';

// 基础设施层
// import { TenantRepository } from './infrastructure/repositories/tenant/tenant.repository';

// 接口层
// import { TenantController } from './interfaces/rest/controllers/tenant.controller';

// 配置
import { getDatabaseConfig } from './config/database.config';
import { getCacheConfig } from './config/cache.config';

/**
 * SAAS-CORE模块选项
 * 
 * @description 配置SAAS-CORE模块的选项
 */
export interface SaasCoreOptions {
  /** 数据库配置 */
  database?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
  };
  /** 缓存配置 */
  cache?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  /** 消息队列配置 */
  messaging?: {
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
}

/**
 * SAAS-CORE模块类
 * 
 * @description 提供SAAS核心业务功能的主模块
 */
@Module({})
export class SaasCoreModule {
  /**
   * 创建SAAS-CORE模块
   * 
   * @description 使用提供的选项创建和配置SAAS-CORE模块
   * 
   * @param options 模块配置选项
   * @returns 配置好的动态模块
   * @since 1.0.0
   */
  static forRoot(options: SaasCoreOptions = {}): DynamicModule {
    return {
      module: SaasCoreModule,
      imports: [
        // 配置模块
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.local', '.env'],
        }),

        // 数据库模块
        TypeOrmModule.forRoot({
          ...getDatabaseConfig(),
          ...(options.database && {
            host: options.database.host,
            port: options.database.port,
            username: options.database.username,
            password: options.database.password,
            database: options.database.database,
          }),
        }),

        // 实体模块
        // TypeOrmModule.forFeature([
        //   TenantEntity,
        //   UserEntity,
        //   OrganizationEntity,
        //   DepartmentEntity,
        // ]),
      ],

      // 控制器
      controllers: [
        // TenantController,
        // UserController,
        // OrganizationController,
        // DepartmentController,
        // AuthController,
      ],

      // 提供者
      providers: [
        // 应用服务
        // TenantService,
        // UserService,
        // OrganizationService,
        // DepartmentService,
        // AuthService,

        // 仓储实现
        // {
        //   provide: 'TENANT_REPOSITORY',
        //   useClass: TenantRepository,
        // },

        // 缓存服务
        // TenantCacheService,
        // UserCacheService,

        // 事件处理器
        // TenantCreatedHandler,
        // UserCreatedHandler,
      ],

      // 导出
      exports: [
        // TenantService,
        // UserService,
        // OrganizationService,
        // DepartmentService,
        // AuthService,
      ],
    };
  }

  /**
   * 创建异步SAAS-CORE模块
   * 
   * @description 支持异步配置的SAAS-CORE模块创建方法
   * 
   * @param options 异步模块配置选项
   * @returns 配置好的动态模块
   * @since 1.0.0
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory?: (...args: any[]) => Promise<SaasCoreOptions> | SaasCoreOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: SaasCoreModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.local', '.env'],
        }),
        ...(options.imports || []),
      ],
      providers: [
        {
          provide: 'SAAS_CORE_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        // 其他提供者...
      ],
      exports: ['SAAS_CORE_OPTIONS'],
    };
  }
}

// 导出主要类型和接口
export * from './domain/shared/value-objects/tenant-id.vo';
export * from './domain/tenant/entities/tenant.entity';
export * from './domain/tenant/aggregates/tenant.aggregate';
export * from './config/database.config';
export * from './config/cache.config';
export * from './constants/business.constants';
export * from './constants/technical.constants';
