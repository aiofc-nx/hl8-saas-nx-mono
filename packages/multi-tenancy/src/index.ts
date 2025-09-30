/**
 * 多租户模块入口文件
 *
 * 导出多租户基础设施层的所有公共API，提供完整的多租户功能。
 *
 * @description 此文件是多租户模块的主入口，导出所有公共API。
 * 包括核心模块、服务、配置管理、类型定义、策略接口和异常处理。
 * 为多租户架构提供统一的功能接口。
 *
 * ## 业务规则
 *
 * ### 模块导出规则
 * - 所有公共API必须通过此文件导出
 * - 导出内容按功能分类组织
 * - 支持按需导入和全量导入
 * - 保持API的向后兼容性
 *
 * ### 功能分类规则
 * - 核心模块：多租户模块的主要功能
 * - 服务：租户上下文、隔离、多层级隔离服务
 * - 配置管理：配置加载、验证、管理功能
 * - 类型定义：核心类型和接口定义
 * - 策略接口：隔离策略、验证策略等接口
 * - 异常处理：多租户相关的异常类
 *
 * @example
 * ```typescript
 * // 导入核心模块
 * import { MultiTenancyModule } from '@hl8/multi-tenancy';
 *
 * // 导入服务
 * import { TenantContextService, TenantIsolationService } from '@hl8/multi-tenancy';
 *
 * // 导入类型
 * import { ITenantContext, ITenantInfo } from '@hl8/multi-tenancy';
 *
 * // 导入异常
 * import { TenantNotFoundException } from '@hl8/multi-tenancy';
 * ```
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
