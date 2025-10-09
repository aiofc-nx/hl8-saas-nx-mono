/**
 * MikroORM 配置
 *
 * @description SAAS Core 模块的 MikroORM 配置文件
 *
 * ## 配置说明
 *
 * ### 数据库连接
 * - 使用 PostgreSQL 16+
 * - 支持连接池配置
 * - 支持读写分离（可选）
 *
 * ### 实体管理
 * - ORM 实体位于 infrastructure/persistence/entities/
 * - 自动发现实体（通过文件匹配）
 * - 支持多租户数据隔离
 *
 * ### 迁移管理
 * - 迁移文件位于 infrastructure/persistence/migrations/
 * - 支持自动生成迁移
 * - 生产环境禁用自动同步
 *
 * ### 全局过滤器
 * - 租户过滤器（自动注入 tenantId）
 * - 软删除过滤器（默认过滤已删除数据）
 *
 * @module infrastructure/persistence
 * @since 1.0.0
 */

import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { Migrator } from '@mikro-orm/migrations';
import { join } from 'path';

/**
 * MikroORM 基础配置
 *
 * @description 根据环境变量和运行环境动态配置 MikroORM
 *
 * @constant
 */
const config: Options = {
  /**
   * 数据库驱动
   */
  driver: PostgreSqlDriver,

  /**
   * 数据库连接配置
   */
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dbName: process.env.DB_NAME || 'saas_core',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',

  /**
   * 连接池配置
   */
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },

  /**
   * 实体配置
   */
  entities: ['./dist/packages/saas-core/src/infrastructure/persistence/entities/**/*.js'],
  entitiesTs: ['./packages/saas-core/src/infrastructure/persistence/entities/**/*.ts'],

  /**
   * 元数据提供器
   * 使用 TsMorphMetadataProvider 支持 TypeScript 反射
   */
  metadataProvider: TsMorphMetadataProvider,

  /**
   * 迁移配置
   */
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: join(__dirname, './migrations'),
    pathTs: join(__dirname, './migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: false,
    safe: true,
    snapshot: true,
    emit: 'ts',
    generator: Migrator,
  },

  /**
   * Schema 配置
   */
  schemaGenerator: {
    /**
     * 禁用外键约束（生产环境）
     * 多租户场景下使用应用层约束
     */
    disableForeignKeys: process.env.NODE_ENV === 'production',

    /**
     * 创建数据库（仅开发环境）
     */
    createDatabase: process.env.NODE_ENV === 'development',
  },

  /**
   * 调试配置
   */
  debug: process.env.NODE_ENV === 'development',

  /**
   * 日志配置
   */
  logger: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[MikroORM]', message);
    }
  },

  /**
   * 严格模式
   * 确保所有实体都被正确映射
   */
  strict: true,

  /**
   * 验证模式
   * 开发环境启用，确保实体定义正确
   */
  validate: process.env.NODE_ENV === 'development',

  /**
   * 发现模式
   * 自动发现实体之间的关系
   */
  discovery: {
    warnWhenNoEntities: true,
    requireEntitiesArray: false,
    alwaysAnalyseProperties: true,
  },

  /**
   * 缓存配置
   */
  cache: {
    enabled: process.env.NODE_ENV === 'production',
    pretty: process.env.NODE_ENV === 'development',
    adapter: undefined, // 使用默认内存缓存，生产环境可配置 Redis
  },

  /**
   * 全局过滤器
   * 注意：具体的过滤器实现在运行时注册
   */
  filters: {
    // 租户过滤器将在模块初始化时注册
    // 软删除过滤器将在模块初始化时注册
  },

  /**
   * 时区配置
   */
  timezone: process.env.TZ || 'UTC',

  /**
   * 类型安全
   */
  forceUtcTimezone: true,
  ensureIndexes: process.env.NODE_ENV === 'development',

  /**
   * 性能优化
   */
  implicitTransactions: true,
  propagateToOneOwner: true,
};

/**
 * 导出配置
 */
export default config;

/**
 * 命名导出（用于 NestJS 模块）
 */
export const mikroOrmConfig = config;

