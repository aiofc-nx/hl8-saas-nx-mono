/**
 * 测试数据库配置
 *
 * @description 为集成测试提供独立的数据库配置
 *
 * ## 配置特点
 *
 * - 使用独立的测试数据库（避免污染开发数据库）
 * - 支持 Docker 容器数据库
 * - 支持测试前自动创建 Schema
 * - 支持测试后自动清理数据
 * - 使用真实的 PostgreSQL 连接
 *
 * @module __tests__/setup
 * @since 1.0.0
 */

import { Options } from '@mikro-orm/core';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { join } from 'path';

/**
 * 测试数据库配置
 *
 * @description 基于主配置，但使用独立的测试数据库
 */
export const testDatabaseConfig: Options = {
  /**
   * 数据库驱动
   */
  driver: PostgreSqlDriver,

  /**
   * 测试数据库连接配置
   * 使用 docker-compose 中的 PostgreSQL
   */
  host: process.env['TEST_DB_HOST'] || 'localhost',
  port: parseInt(process.env['TEST_DB_PORT'] || '5432', 10),
  dbName: process.env['TEST_DB_NAME'] || 'saas_core_test',
  user: process.env['TEST_DB_USER'] || 'aiofix_user',
  password: process.env['TEST_DB_PASSWORD'] || 'aiofix_password',

  /**
   * 连接池配置（测试环境使用较小的连接池）
   */
  pool: {
    min: 1,
    max: 5,
  },

  /**
   * 实体配置（直接使用 TypeScript 实体）
   */
  entities: [],
  entitiesTs: [
    join(__dirname, '../../src/infrastructure/persistence/entities/**/*.orm-entity.ts'),
  ],

  /**
   * 迁移配置
   */
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: join(__dirname, '../../src/infrastructure/persistence/migrations'),
    pathTs: join(__dirname, '../../src/infrastructure/persistence/migrations'),
    glob: '!(*.d).{js,ts}',
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    dropTables: false,
    safe: false, // 测试环境允许不安全操作
    snapshot: false,
    emit: 'ts',
  },

  /**
   * Schema 配置（测试环境自动同步）
   */
  schemaGenerator: {
    disableForeignKeys: false,
  },

  /**
   * 调试配置（可选）
   */
  debug: process.env['TEST_DB_DEBUG'] === 'true',

  /**
   * 日志配置（测试环境静默）
   */
  logger: process.env['TEST_DB_LOG'] === 'true' 
    ? (message: string) => console.log('[Test DB]', message)
    : undefined,

  /**
   * 严格模式
   */
  strict: true,

  /**
   * 验证模式（测试环境启用）
   */
  validate: true,

  /**
   * 发现模式
   */
  discovery: {
    warnWhenNoEntities: false,
    requireEntitiesArray: false,
    alwaysAnalyseProperties: true,
  },

  /**
   * 时区配置
   */
  timezone: 'UTC',
  forceUtcTimezone: true,

  /**
   * 性能优化
   */
  implicitTransactions: true,

  /**
   * 允许全局上下文（测试环境）
   */
  allowGlobalContext: true,
};

/**
 * 获取测试数据库配置
 *
 * @returns {Options} MikroORM 配置选项
 */
export function getTestDatabaseConfig(): Options {
  return testDatabaseConfig;
}

