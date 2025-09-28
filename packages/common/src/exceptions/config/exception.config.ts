import { ExceptionMessageProvider } from './exception-message.provider';

/**
 * 异常处理配置
 *
 * @description 异常处理模块的配置选项
 * 支持文档链接、消息提供者、日志级别等配置
 *
 * ## 业务规则
 *
 * ### 配置规则
 * - 支持文档链接配置
 * - 支持消息提供者配置
 * - 支持日志级别配置
 * - 支持环境特定配置
 *
 * ### 默认值规则
 * - 提供合理的默认配置
 * - 支持环境变量覆盖
 * - 支持运行时配置更新
 *
 * @example
 * ```typescript
 * // 基本配置
 * const config: ExceptionConfig = {
 *   documentationUrl: 'https://docs.example.com/errors',
 *   logLevel: 'error',
 *   enableStackTrace: true,
 * };
 *
 * // 完整配置
 * const fullConfig: ExceptionConfig = {
 *   documentationUrl: 'https://docs.example.com/errors',
 *   messageProvider: new CustomMessageProvider(),
 *   logLevel: 'error',
 *   enableStackTrace: true,
 *   enableRequestLogging: true,
 *   enableResponseLogging: true,
 * };
 * ```
 *
 * @since 1.0.0
 */
export interface ExceptionConfig {
  /**
   * 文档链接URL
   *
   * @description 指向错误文档的链接，用于客户端了解错误详情
   * 遵循RFC7807标准，通常指向API文档中的错误说明页面
   */
  documentationUrl?: string;

  /**
   * 消息提供者
   *
   * @description 用于获取错误消息的提供者
   * 支持自定义消息提供者实现
   */
  messageProvider?: ExceptionMessageProvider;

  /**
   * 日志级别
   *
   * @description 异常日志的记录级别
   * 支持 'error', 'warn', 'info', 'debug' 等级别
   */
  logLevel?: 'error' | 'warn' | 'info' | 'debug';

  /**
   * 是否启用堆栈跟踪
   *
   * @description 是否在日志中记录异常的堆栈跟踪信息
   * 生产环境建议关闭以提高性能
   */
  enableStackTrace?: boolean;

  /**
   * 是否启用请求日志记录
   *
   * @description 是否在异常日志中记录请求信息
   * 包括请求方法、URL、头部等信息
   */
  enableRequestLogging?: boolean;

  /**
   * 是否启用响应日志记录
   *
   * @description 是否在异常日志中记录响应信息
   * 包括响应状态码、错误码等信息
   */
  enableResponseLogging?: boolean;

  /**
   * 是否启用性能监控
   *
   * @description 是否记录异常处理的性能指标
   * 包括处理时间、内存使用等信息
   */
  enablePerformanceMonitoring?: boolean;
}

/**
 * 默认异常配置
 *
 * @description 提供合理的默认配置选项
 * 适用于大多数应用场景
 */
export const DEFAULT_EXCEPTION_CONFIG: ExceptionConfig = {
  documentationUrl: 'about:blank',
  logLevel: 'error',
  enableStackTrace: true,
  enableRequestLogging: true,
  enableResponseLogging: true,
  enablePerformanceMonitoring: false,
};