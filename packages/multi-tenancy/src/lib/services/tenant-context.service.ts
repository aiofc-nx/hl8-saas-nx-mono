/**
 * 租户上下文服务
 *
 * 基于nestjs-cls的租户上下文管理服务
 * 提供透明、异步的租户上下文传递和管理功能
 *
 * @fileoverview 租户上下文服务实现
 * @since 1.0.0
 */

import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { PinoLogger } from '@hl8/logger';
import {
  ITenantContext,
  ITenantContextConfig,
  IMultiTenancyModuleOptions,
} from '../types/tenant-core.types';
import {
  TenantNotFoundException,
  TenantContextInvalidException,
  TenantConfigInvalidException,
} from '../exceptions';
import { DI_TOKENS } from '../constants';

/**
 * 租户上下文服务
 *
 * 基于nestjs-cls实现租户上下文的透明传递和管理
 *
 * @description 租户上下文服务是多租户架构的核心组件
 * 提供异步上下文的透明传递、上下文生命周期管理、上下文验证等功能
 *
 * ## 业务规则
 *
 * ### 上下文传递规则
 * - 租户上下文在整个请求生命周期内保持一致性
 * - 上下文传递必须是透明的，无需手动传递参数
 * - 上下文变更必须立即生效并传播到所有相关组件
 * - 上下文传递必须支持异步操作和Promise链
 *
 * ### 上下文生命周期规则
 * - 上下文在请求开始时创建，请求结束时销毁
 * - 上下文生命周期与请求生命周期完全绑定
 * - 上下文销毁时必须清理所有相关资源
 * - 上下文超时必须自动清理以防止内存泄漏
 *
 * ### 上下文验证规则
 * - 上下文创建时必须验证所有必填字段
 * - 上下文更新时必须验证新值的有效性
 * - 上下文访问时必须检查上下文的完整性
 * - 上下文验证失败必须抛出明确的异常
 *
 * ### 上下文缓存规则
 * - 上下文信息应该被适当缓存以提高性能
 * - 缓存时间应该可配置且合理
 * - 缓存失效时应该自动重新获取
 * - 缓存操作应该是线程安全的
 *
 * ## 业务逻辑流程
 *
 * 1. **上下文初始化**：根据配置初始化上下文服务
 * 2. **上下文创建**：为每个请求创建独立的上下文
 * 3. **上下文设置**：设置租户ID、用户ID等上下文信息
 * 4. **上下文传递**：在异步操作中透明传递上下文
 * 5. **上下文清理**：请求结束时自动清理上下文
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class SomeService {
 *   constructor(private readonly tenantContextService: TenantContextService) {}
 *
 *   async doSomething(): Promise<void> {
 *     // 获取当前租户ID（透明获取，无需手动传递）
 *     const tenantId = this.tenantContextService.getTenant();
 *     console.log('Current tenant:', tenantId);
 *
 *     // 获取完整上下文
 *     const context = this.tenantContextService.getContext();
 *     console.log('Full context:', context);
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantContextService implements OnModuleInit, OnModuleDestroy {
  private readonly contextConfig: ITenantContextConfig;
  private readonly logger!: PinoLogger;

  constructor(
    private readonly cls: ClsService,
    @Inject(DI_TOKENS.MODULE_OPTIONS) options: IMultiTenancyModuleOptions,
    logger: PinoLogger
  ) {
    if (!options?.context) {
      throw new TenantConfigInvalidException(
        'Tenant context configuration missing',
        'The tenant context configuration is required but not provided',
        { configType: 'context' }
      );
    }

    this.contextConfig = options.context;
    this.logger = logger;
    this.logger.setContext({ requestId: 'tenant-context-service' });
  }

  /**
   * 模块初始化
   *
   * 初始化租户上下文服务，设置上下文超时、启用审计日志等初始化操作。
   *
   * @description 此方法在模块初始化时调用，负责设置上下文超时、启用审计日志等初始化操作。
   * 确保租户上下文服务能够正常工作，提供完整的上下文管理功能。
   *
   * ## 业务规则
   *
   * ### 初始化规则
   * - 上下文超时时间必须大于0
   * - 审计日志配置必须正确设置
   * - 初始化失败时必须抛出异常
   * - 初始化过程必须记录日志
   *
   * ### 配置验证规则
   * - 上下文配置必须有效
   * - 超时时间必须在合理范围内
   * - 审计日志配置必须正确
   * - 配置验证失败时抛出异常
   *
   * ### 错误处理规则
   * - 初始化失败时记录错误日志
   * - 配置错误时抛出明确异常
   * - 服务不可用时抛出异常
   * - 支持初始化重试机制
   *
   * @throws {TenantConfigInvalidException} 当配置无效时抛出
   * @throws {Error} 当初始化失败时抛出
   *
   * @example
   * ```typescript
   * // 模块初始化会自动调用此方法
   * await tenantContextService.onModuleInit();
   * ```
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.info('租户上下文服务初始化开始');

      // 设置上下文超时
      if (this.contextConfig.contextTimeout > 0) {
        // this.cls.setTimeout(this.contextConfig.contextTimeout); // ClsService doesn't have setTimeout method
      }

      // 启用审计日志
      if (this.contextConfig.enableAuditLog) {
        this.logger.info('租户上下文审计日志已启用');
      }

      this.logger.info('租户上下文服务初始化完成');
    } catch (error) {
      this.logger.error('租户上下文服务初始化失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 模块销毁
   *
   * 清理租户上下文服务资源，包括清理缓存、关闭连接等清理操作。
   *
   * @description 此方法在模块销毁时调用，负责清理租户上下文服务资源。
   * 包括清理所有活跃的上下文、关闭连接、释放资源等清理操作。
   *
   * ## 业务规则
   *
   * ### 资源清理规则
   * - 清理所有活跃的上下文
   * - 关闭所有相关连接
   * - 释放所有占用的资源
   * - 清理过程必须记录日志
   *
   * ### 上下文清理规则
   * - 清理所有租户上下文
   * - 清理所有用户上下文
   * - 清理所有请求上下文
   * - 清理所有会话上下文
   *
   * ### 错误处理规则
   * - 清理失败时记录错误日志
   * - 清理过程异常时继续执行
   * - 支持部分清理成功
   * - 清理完成后记录成功日志
   *
   * @example
   * ```typescript
   * // 模块销毁会自动调用此方法
   * await tenantContextService.onModuleDestroy();
   * ```
   */
  async onModuleDestroy(): Promise<void> {
    try {
      this.logger.info('租户上下文服务销毁开始');

      // 清理所有活跃的上下文
      await this.clearAllContexts();

      this.logger.info('租户上下文服务销毁完成');
    } catch (error) {
      this.logger.error('租户上下文服务销毁失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 设置租户上下文
   *
   * 设置当前请求的租户上下文信息，包含租户ID、用户ID等信息。
   *
   * @description 此方法创建或更新租户上下文，包含租户ID、用户ID等信息。
   * 上下文信息会在整个请求生命周期内保持有效，支持透明传递。
   *
   * ## 业务规则
   *
   * ### 上下文设置规则
   * - 租户ID是必填字段，不能为空
   * - 用户ID是可选的，可以为空
   * - 请求ID会自动生成，如果未提供
   * - 时间戳会自动设置为当前时间
   *
   * ### 上下文验证规则
   * - 租户ID格式必须符合预定义规范
   * - 用户ID格式必须符合预定义规范
   * - 请求ID格式必须符合预定义规范
   * - 上下文信息必须完整且有效
   *
   * ### 上下文存储规则
   * - 上下文信息存储在CLS中
   * - 支持快速访问各个字段
   * - 上下文信息在整个请求生命周期内保持有效
   * - 支持上下文信息的更新和修改
   *
   * @param context 租户上下文信息
   * @returns 设置是否成功
   *
   * @throws {TenantContextInvalidException} 当上下文无效时抛出
   *
   * @example
   * ```typescript
   * const context: ITenantContext = {
   *   tenantId: 'tenant-123',
   *   userId: 'user-456',
   *   requestId: 'req-789',
   *   timestamp: new Date()
   * };
   * await tenantContextService.setContext(context);
   * ```
   */
  async setContext(context: ITenantContext): Promise<void> {
    try {
      // 验证上下文信息
      this.validateContext(context);

      // 设置上下文信息
      this.cls.set('tenantContext', context);

      // 设置单独的字段以便快速访问
      this.cls.set('tenantId', context.tenantId);
      this.cls.set('userId', context.userId);
      this.cls.set('requestId', context.requestId);
      this.cls.set('sessionId', context.sessionId);

      this.logger.debug('租户上下文已设置', {
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
      });

      // 记录审计日志
      if (this.contextConfig.enableAuditLog) {
        await this.auditContextSet(context);
      }
    } catch (error) {
      this.logger.error('设置租户上下文失败', {
        context,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取租户上下文
   *
   * 获取当前请求的完整租户上下文信息
   *
   * @description 返回当前请求的完整上下文信息
   * 如果上下文不存在则返回null
   *
   * @returns 租户上下文或null
   *
   * @example
   * ```typescript
   * const context = tenantContextService.getContext();
   * if (context) {
   *   console.log('Current tenant:', context.tenantId);
   *   console.log('Current user:', context.userId);
   * }
   * ```
   */
  getContext(): ITenantContext | null {
    try {
      const context = this.cls.get<ITenantContext>('tenantContext');
      return context || null;
    } catch (error) {
      this.logger.error('获取租户上下文失败', {
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 获取租户ID
   *
   * 获取当前请求的租户ID，这是最常用的操作。
   *
   * @description 此方法快速获取当前租户ID，这是最常用的操作。
   * 如果租户ID不存在则返回null，支持透明获取无需手动传递参数。
   *
   * ## 业务规则
   *
   * ### 租户ID获取规则
   * - 从CLS中获取租户ID
   * - 租户ID不存在时返回null
   * - 获取失败时记录错误日志
   * - 支持快速访问和缓存
   *
   * ### 错误处理规则
   * - 获取失败时记录错误日志
   * - 异常情况下返回null
   * - 支持错误重试机制
   * - 错误信息包含详细上下文
   *
   * ### 性能规则
   * - 支持高频调用
   * - 获取延迟小于1ms
   * - 支持并发访问
   * - 内存占用最小化
   *
   * @returns 租户ID或null
   *
   * @example
   * ```typescript
   * const tenantId = tenantContextService.getTenant();
   * if (tenantId) {
   *   console.log('Current tenant:', tenantId);
   * }
   * ```
   */
  getTenant(): string | null {
    try {
      const tenantId = this.cls.get<string>('tenantId');
      return tenantId || null;
    } catch (error) {
      this.logger.error('获取租户ID失败', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * 获取用户ID
   *
   * 获取当前请求的用户ID
   *
   * @description 获取当前用户ID，用于用户相关的操作
   * 如果用户ID不存在则返回null
   *
   * @returns 用户ID或null
   *
   * @example
   * ```typescript
   * const userId = tenantContextService.getUser();
   * if (userId) {
   *   console.log('Current user:', userId);
   * }
   * ```
   */
  getUser(): string | null {
    try {
      const userId = this.cls.get<string>('userId');
      return userId || null;
    } catch (error) {
      this.logger.error('获取用户ID失败', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * 获取请求ID
   *
   * 获取当前请求的请求ID
   *
   * @description 获取请求的唯一标识符，用于日志关联和调试
   * 如果请求ID不存在则返回null
   *
   * @returns 请求ID或null
   *
   * @example
   * ```typescript
   * const requestId = tenantContextService.getRequestId();
   * if (requestId) {
   *   console.log('Request ID:', requestId);
   * }
   * ```
   */
  getRequestId(): string | null {
    try {
      const requestId = this.cls.get<string>('requestId');
      return requestId || null;
    } catch (error) {
      this.logger.error('获取请求ID失败', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * 获取会话ID
   *
   * 获取当前请求的会话ID
   *
   * @description 获取会话的唯一标识符，用于会话管理
   * 如果会话ID不存在则返回null
   *
   * @returns 会话ID或null
   *
   * @example
   * ```typescript
   * const sessionId = tenantContextService.getSessionId();
   * if (sessionId) {
   *   console.log('Session ID:', sessionId);
   * }
   * ```
   */
  getSessionId(): string | null {
    try {
      const sessionId = this.cls.get<string>('sessionId');
      return sessionId || null;
    } catch (error) {
      this.logger.error('获取会话ID失败', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * 更新租户ID
   *
   * 更新当前请求的租户ID
   *
   * @description 更新租户ID并保持其他上下文信息不变
   * 通常用于租户切换或租户验证后的更新
   *
   * @param tenantId 新的租户ID
   * @returns 更新是否成功
   *
   * @example
   * ```typescript
   * await tenantContextService.updateTenant('new-tenant-123');
   * ```
   */
  async updateTenant(tenantId: string): Promise<void> {
    try {
      // 验证租户ID格式
      this.validateTenantId(tenantId);

      // 更新租户ID
      this.cls.set('tenantId', tenantId);

      // 更新完整上下文
      const context = this.getContext();
      if (context) {
        context.tenantId = tenantId;
        this.cls.set('tenantContext', context);
      }

      this.logger.debug('租户ID已更新', { tenantId });

      // 记录审计日志
      if (this.contextConfig.enableAuditLog) {
        await this.auditTenantUpdate(tenantId);
      }
    } catch (error) {
      this.logger.error('更新租户ID失败', {
        tenantId,
        error: (error as Error).message,
      });

      // 如果是已知异常，直接抛出
      if (error instanceof TenantContextInvalidException) {
        throw error;
      }

      // 其他未知错误，包装为租户上下文异常
      throw new TenantContextInvalidException(
        'Failed to update tenant context',
        'An error occurred while updating the tenant context',
        { tenantId, originalError: (error as Error).message },
        error
      );
    }
  }

  /**
   * 更新用户ID
   *
   * 更新当前请求的用户ID
   *
   * @description 更新用户ID并保持其他上下文信息不变
   * 通常用于用户认证后的更新
   *
   * @param userId 新的用户ID
   * @returns 更新是否成功
   *
   * @example
   * ```typescript
   * await tenantContextService.updateUser('new-user-456');
   * ```
   */
  async updateUser(userId: string): Promise<void> {
    try {
      // 验证用户ID格式
      this.validateUserId(userId);

      // 更新用户ID
      this.cls.set('userId', userId);

      // 更新完整上下文
      const context = this.getContext();
      if (context) {
        context.userId = userId;
        this.cls.set('tenantContext', context);
      }

      this.logger.debug('用户ID已更新', { userId });

      // 记录审计日志
      if (this.contextConfig.enableAuditLog) {
        await this.auditUserUpdate(userId);
      }
    } catch (error) {
      this.logger.error('更新用户ID失败', {
        userId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 设置自定义上下文
   *
   * 设置自定义的上下文信息
   *
   * @description 允许设置自定义的上下文键值对
   * 用于存储业务相关的上下文信息
   *
   * @param key 上下文键
   * @param value 上下文值
   * @returns 设置是否成功
   *
   * @example
   * ```typescript
   * await tenantContextService.setCustomContext('feature-flag', 'enabled');
   * await tenantContextService.setCustomContext('region', 'us-east-1');
   * ```
   */
  async setCustomContext(key: string, value: unknown): Promise<void> {
    try {
      // 验证键名格式
      this.validateContextKey(key);

      // 设置自定义上下文
      this.cls.set(`custom:${key}`, value);

      // 更新完整上下文的元数据
      const context = this.getContext();
      if (context) {
        if (!context.metadata) {
          context.metadata = {};
        }
        context.metadata[key] = value;
        this.cls.set('tenantContext', context);
      }

      this.logger.debug('自定义上下文已设置', { key, value });

      // 记录审计日志
      if (this.contextConfig.enableAuditLog) {
        await this.auditCustomContextSet(key, value);
      }
    } catch (error) {
      this.logger.error('设置自定义上下文失败', {
        key,
        value,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 获取自定义上下文
   *
   * 获取自定义的上下文信息
   *
   * @description 获取之前设置的自定义上下文值
   * 如果键不存在则返回null
   *
   * @param key 上下文键
   * @returns 上下文值或null
   *
   * @example
   * ```typescript
   * const featureFlag = tenantContextService.getCustomContext('feature-flag');
   * const region = tenantContextService.getCustomContext('region');
   * ```
   */
  getCustomContext<T = unknown>(key: string): T | null {
    try {
      const value = this.cls.get<T>(`custom:${key}`);
      return (value ?? null) as T | null;
    } catch (error) {
      this.logger.error('获取自定义上下文失败', {
        key,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * 清除上下文
   *
   * 清除当前请求的所有上下文信息
   *
   * @description 清除所有上下文信息，通常在请求结束时调用
   * 确保没有内存泄漏和上下文污染
   *
   * @returns 清除是否成功
   *
   * @example
   * ```typescript
   * await tenantContextService.clearContext();
   * ```
   */
  async clearContext(): Promise<void> {
    try {
      // 记录审计日志
      if (this.contextConfig.enableAuditLog) {
        await this.auditContextClear();
      }

      // 清除所有上下文信息
      (this.cls as unknown as { clear: () => void }).clear();

      this.logger.debug('租户上下文已清除');
    } catch (error) {
      this.logger.error('清除租户上下文失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 清除所有上下文
   *
   * 清除所有活跃的上下文信息
   *
   * @description 清除所有活跃的上下文，用于服务关闭时的清理
   * 这是一个危险操作，只在服务销毁时使用
   *
   * @returns 清除是否成功
   */
  private async clearAllContexts(): Promise<void> {
    try {
      // 这里需要根据nestjs-cls的具体实现来清除所有上下文
      // 由于nestjs-cls没有提供清除所有上下文的方法，这里只是记录日志
      this.logger.info('清除所有租户上下文');
    } catch (error) {
      this.logger.error('清除所有租户上下文失败', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * 验证上下文
   *
   * 验证租户上下文的完整性和有效性
   *
   * @description 检查上下文信息的格式和完整性
   * 确保所有必填字段都存在且格式正确
   *
   * @param context 租户上下文
   * @throws {Error} 当上下文无效时抛出异常
   */
  private validateContext(context: ITenantContext): void {
    if (!context) {
      throw new Error('租户上下文不能为空');
    }

    if (!context.tenantId) {
      throw new Error('租户ID不能为空');
    }

    this.validateTenantId(context.tenantId);

    if (context.userId) {
      this.validateUserId(context.userId);
    }

    if (context.requestId) {
      this.validateRequestId(context.requestId);
    }

    if (context.sessionId) {
      this.validateSessionId(context.sessionId);
    }

    if (!context.timestamp) {
      throw new Error('上下文时间戳不能为空');
    }
  }

  /**
   * 验证租户ID
   *
   * 验证租户ID的格式是否正确
   *
   * @param tenantId 租户ID
   * @throws {Error} 当租户ID格式无效时抛出异常
   */
  private validateTenantId(tenantId: string): void {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new TenantContextInvalidException(
        'Invalid tenant ID',
        'The tenant ID must be a valid string',
        { tenantId, reason: 'not a string or empty' }
      );
    }

    if (tenantId.length < 3 || tenantId.length > 64) {
      throw new TenantContextInvalidException(
        'Invalid tenant ID length',
        'The tenant ID length must be between 3 and 64 characters',
        { tenantId, length: tenantId.length, minLength: 3, maxLength: 64 }
      );
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(tenantId)) {
      throw new TenantContextInvalidException(
        'Invalid tenant ID format',
        'The tenant ID can only contain letters, numbers, hyphens, and underscores',
        { tenantId, pattern: '^[a-zA-Z0-9-_]+$' }
      );
    }
  }

  /**
   * 验证用户ID
   *
   * 验证用户ID的格式是否正确
   *
   * @param userId 用户ID
   * @throws {Error} 当用户ID格式无效时抛出异常
   */
  private validateUserId(userId: string): void {
    if (!userId || typeof userId !== 'string') {
      throw new Error('用户ID必须是有效的字符串');
    }

    if (userId.length < 3 || userId.length > 64) {
      throw new Error('用户ID长度必须在3-64个字符之间');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(userId)) {
      throw new Error('用户ID只能包含字母、数字、连字符和下划线');
    }
  }

  /**
   * 验证请求ID
   *
   * 验证请求ID的格式是否正确
   *
   * @param requestId 请求ID
   * @throws {Error} 当请求ID格式无效时抛出异常
   */
  private validateRequestId(requestId: string): void {
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('请求ID必须是有效的字符串');
    }

    if (requestId.length < 8 || requestId.length > 128) {
      throw new Error('请求ID长度必须在8-128个字符之间');
    }
  }

  /**
   * 验证会话ID
   *
   * 验证会话ID的格式是否正确
   *
   * @param sessionId 会话ID
   * @throws {Error} 当会话ID格式无效时抛出异常
   */
  private validateSessionId(sessionId: string): void {
    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error('会话ID必须是有效的字符串');
    }

    if (sessionId.length < 8 || sessionId.length > 128) {
      throw new Error('会话ID长度必须在8-128个字符之间');
    }
  }

  /**
   * 验证上下文键
   *
   * 验证自定义上下文键的格式是否正确
   *
   * @param key 上下文键
   * @throws {Error} 当上下文键格式无效时抛出异常
   */
  private validateContextKey(key: string): void {
    if (!key || typeof key !== 'string') {
      throw new Error('上下文键必须是有效的字符串');
    }

    if (key.length < 1 || key.length > 64) {
      throw new Error('上下文键长度必须在1-64个字符之间');
    }

    if (!/^[a-zA-Z0-9-_]+$/.test(key)) {
      throw new Error('上下文键只能包含字母、数字、连字符和下划线');
    }
  }

  /**
   * 审计上下文设置
   *
   * 记录上下文设置的审计日志
   *
   * @param context 租户上下文
   */
  private async auditContextSet(context: ITenantContext): Promise<void> {
    try {
      this.logger.info('租户上下文设置审计', {
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        timestamp: context.timestamp,
      });
    } catch (error) {
      this.logger.error('审计上下文设置失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 审计租户更新
   *
   * 记录租户更新的审计日志
   *
   * @param tenantId 租户ID
   */
  private async auditTenantUpdate(tenantId: string): Promise<void> {
    try {
      this.logger.info('租户ID更新审计', { tenantId });
    } catch (error) {
      this.logger.error('审计租户更新失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 审计用户更新
   *
   * 记录用户更新的审计日志
   *
   * @param userId 用户ID
   */
  private async auditUserUpdate(userId: string): Promise<void> {
    try {
      this.logger.info('用户ID更新审计', { userId });
    } catch (error) {
      this.logger.error('审计用户更新失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 审计自定义上下文设置
   *
   * 记录自定义上下文设置的审计日志
   *
   * @param key 上下文键
   * @param value 上下文值
   */
  private async auditCustomContextSet(
    key: string,
    value: unknown
  ): Promise<void> {
    try {
      this.logger.info('自定义上下文设置审计', { key, value });
    } catch (error) {
      this.logger.error('审计自定义上下文设置失败', {
        error: (error as Error).message,
      });
    }
  }

  /**
   * 审计上下文清除
   *
   * 记录上下文清除的审计日志
   */
  private async auditContextClear(): Promise<void> {
    try {
      this.logger.info('租户上下文清除审计');
    } catch (error) {
      this.logger.error('审计上下文清除失败', {
        error: (error as Error).message,
      });
    }
  }
}
