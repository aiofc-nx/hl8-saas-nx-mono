/**
 * 聚合根模块导出
 *
 * @description 导出聚合根相关的所有公共API
 * 专注于提供业务模块应有的通用功能组件
 * @since 1.0.0
 */

// 基础设施
export * from './base';

// 装饰器
export * from './decorators';

// 聚合根验证
export * from './validation';

// 注意：具体业务实现的聚合根已移除，专注于通用功能组件
// 通用验证和安全接口在对应的 domain/validation 和 domain/security 中提供
