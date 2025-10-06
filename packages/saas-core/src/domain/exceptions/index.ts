/**
 * SAAS领域异常模块导出
 *
 * @description 导出SAAS平台领域异常相关的所有公共API
 * 提供统一的异常管理、创建、验证和处理功能
 *
 * ## 导出内容
 *
 * ### 异常类
 * - UserExceptions: 用户相关异常
 * - TenantExceptions: 租户相关异常
 * - AuthorizationExceptions: 授权相关异常
 * - OrganizationExceptions: 组织相关异常
 * - DepartmentExceptions: 部门相关异常
 * - ValueObjectExceptions: 值对象相关异常
 * - MultiTenancyExceptions: 多租户相关异常
 * - EventExceptions: 事件相关异常
 *
 * ### 异常代码
 * - 所有异常代码常量定义
 * - 异常代码映射关系
 * - 异常代码类型定义
 *
 * ### 异常处理工具
 * - DomainExceptionHandler: 异常处理器
 * - 异常创建、验证、处理功能
 * - 异常统计和分析功能
 *
 * @since 1.0.0
 */

// 异常类导出
export * from './saas-domain-exceptions';

// 异常代码导出
export * from './exception-codes';

// 异常处理器导出
export * from './exception-handler';

// 租户上下文异常导出
export * from './tenant-context.exception';

// 重新导出hybrid-archi的基础异常类
export {
  BaseDomainException,
  DomainExceptionType,
  DomainExceptionSeverity,
  BusinessRuleViolationException,
  DomainValidationException,
  DomainStateException,
  DomainPermissionException
} from '@hl8/hybrid-archi/src/domain/exceptions';
