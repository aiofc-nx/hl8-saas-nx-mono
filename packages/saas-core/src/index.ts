/**
 * SAAS-CORE 模块入口
 * 
 * @description 导出SAAS-CORE模块的所有公共API
 * 
 * @since 1.0.0
 */

// 导出主模块
export * from './saas-core.module';

// 导出领域层
export * from './domain/tenant/entities/tenant.entity';
export * from './domain/tenant/aggregates/tenant.aggregate';
export * from './domain/user/entities/user.entity';
export * from './domain/user/aggregates/user.aggregate';
export * from './domain/value-objects';
export * from './domain/events';
export * from './domain/services';
export * from './domain/rules';

// 导出配置
export * from './config/database.config';
export * from './config/cache.config';

// 导出常量
export * from './constants/business.constants';
export * from './constants/technical.constants';
