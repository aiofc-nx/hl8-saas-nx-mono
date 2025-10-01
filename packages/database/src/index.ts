/**
 * HL8 SAAS平台数据库管理模块
 *
 * @description 提供完整的数据库管理功能
 * 包括MikroORM集成、多租户支持、连接管理、事务管理等
 *
 * @fileoverview 数据库模块主入口文件
 * @since 1.0.0
 */

// 常量定义导出
export * from './lib/constants';

// 类型定义导出
export * from './lib/types';

// 配置类导出
export * from './lib/config';

// 异常类导出
export * from './lib/exceptions';

// 装饰器导出
export * from './lib/decorators';

// 核心服务导出
export * from './lib/connection.manager';
export * from './lib/database.service';
export * from './lib/tenant-database.service';
export * from './lib/migration.service';

// 监控服务导出
export * from './lib/monitoring';

// 模块导出
export * from './lib/database.module';
