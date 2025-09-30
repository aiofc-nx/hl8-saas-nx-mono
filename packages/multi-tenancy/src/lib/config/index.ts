/**
 * 多租户配置模块
 *
 * @description 提供类型安全的配置管理功能
 * 集成 @hl8/config 模块，支持配置文件加载、环境变量覆盖和配置验证
 *
 * @fileoverview 多租户配置模块导出
 * @author HL8 Team
 * @since 1.0.0
 */

// 配置类导出
export * from './multi-tenancy.config';

// 配置服务导出
export * from './config.service';

// 默认配置提供者导出
export * from './default-config.provider';

// 配置验证器导出
export * from './config.validator';
