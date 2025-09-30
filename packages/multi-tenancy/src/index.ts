/**
 * 多租户模块入口文件
 *
 * 导出多租户基础设施层的所有公共API
 *
 * @fileoverview 多租户模块公共API导出
 * @author HL8 Team
 * @since 1.0.0
 */

// 核心模块
export * from './lib/multi-tenancy';

// 服务
export * from './lib/services/tenant-context.service';
export * from './lib/services/tenant-isolation.service';
export * from './lib/services/multi-level-isolation.service';

// 配置管理
export * from './lib/config';

// 类型定义
export * from './lib/types/tenant-core.types';

// 策略接口
export * from './lib/strategies/isolation-strategy.interface';
export * from './lib/strategies/validation-strategy.interface';
export * from './lib/strategies/multi-level-isolation-strategy.interface';

// 异常处理
export * from './lib/exceptions';
