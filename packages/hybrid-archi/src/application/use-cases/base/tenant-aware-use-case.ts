/**
 * 多租户感知的用例基类
 *
 * 提供多租户上下文感知的用例执行能力
 * 自动处理租户隔离、权限验证、上下文传递等功能
 *
 * @description 多租户感知的用例基类，继承自BaseUseCase
 * 提供完整的多租户支持，包括租户上下文管理、权限验证、数据隔离等
 *
 * ## 业务规则
 *
 * ### 租户隔离规则
 * - 用例执行时必须验证租户上下文
 * - 所有数据操作必须绑定租户ID
 * - 跨租户的数据访问必须被明确禁止
 * - 租户上下文在整个用例执行期间保持一致
 *
 * ### 权限验证规则
 * - 用例执行前必须验证用户权限
 * - 权限验证必须基于租户上下文
 * - 跨租户的权限验证必须被明确禁止
 * - 权限验证失败时必须提供清晰的错误信息
 *
 * ### 上下文传递规则
 * - 租户上下文必须在所有异步操作中保持可用
 * - 上下文信息必须传递给所有依赖服务
 * - 上下文变更必须立即生效
 * - 上下文清理必须在用例执行结束时进行
 *
 * @example
 * ```typescript
 * export class CreateUserUseCase extends TenantAwareUseCase<CreateUserRequest, CreateUserResponse> {
 *   constructor(
 *     private readonly userRepository: IUserRepository,
 *     private readonly eventBus: IDomainEventBus,
 *     tenantContextService: TenantContextService,
 *     logger: PinoLogger
 *   ) {
 *     super('CreateUser', '创建用户用例', '1.0.0', ['user:create'], tenantContextService, logger);
 *   }
 *
 *   protected async executeUseCase(
 *     request: CreateUserRequest,
 *     context: IUseCaseContext
 *   ): Promise<CreateUserResponse> {
 *     // 租户上下文已自动绑定
 *     const user = User.create(request.name, request.email, context.tenant.id);
 *     await this.userRepository.save(user);
 *     return new CreateUserResponse(user.id);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { BaseUseCase } from './base-use-case';
import { IUseCaseContext } from './use-case.interface';
import { TenantContextService, ITenantContext } from '@hl8/multi-tenancy';
import { PinoLogger } from '@hl8/logger';
import {
  GeneralBadRequestException,
  GeneralInternalServerException,
} from '@hl8/common';
import { TENANT_ERROR_CODES } from '../../../constants';

/**
 * 多租户感知的用例基类
 *
 * @template TRequest - 请求类型
 * @template TResponse - 响应类型
 */
export abstract class TenantAwareUseCase<
  TRequest,
  TResponse
> extends BaseUseCase<TRequest, TResponse> {
  protected readonly tenantContextService: TenantContextService;

  constructor(
    useCaseName: string,
    useCaseDescription: string,
    useCaseVersion = '1.0.0',
    requiredPermissions: string[] = [],
    tenantContextService: TenantContextService,
    logger?: PinoLogger
  ) {
    super(
      useCaseName,
      useCaseDescription,
      useCaseVersion,
      requiredPermissions,
      logger
    );
    this.tenantContextService = tenantContextService;
  }

  /**
   * 执行用例
   *
   * @description 多租户感知的用例执行，包含租户上下文验证和权限检查
   */
  override async execute(request: TRequest): Promise<TResponse> {
    const startTime = Date.now();
    const context = this.createContext();

    try {
      // 1. 记录开始执行日志
      this.logTenantAwareUseCaseStart(request, context);

      // 2. 验证租户上下文
      await this.validateTenantContext();

      // 3. 验证请求参数
      await this.validateRequest(request);

      // 4. 验证权限
      await this.validatePermissions(context);

      // 5. 执行具体的用例逻辑
      const response = await this.executeUseCase(request, context);

      // 6. 记录成功执行日志
      const executionTime = Date.now() - startTime;
      this.logTenantAwareUseCaseSuccess(
        request,
        response,
        context,
        executionTime
      );

      return response;
    } catch (error) {
      // 7. 记录执行失败日志
      const executionTime = Date.now() - startTime;
      this.logTenantAwareUseCaseError(request, error, context, executionTime);
      throw error;
    }
  }

  /**
   * 验证租户上下文
   *
   * @description 验证当前租户上下文的有效性
   * 确保租户上下文存在且有效
   *
   * @throws {TenantContextInvalidException} 当租户上下文无效时
   */
  protected async validateTenantContext(): Promise<void> {
    try {
      const tenantContext = await this.getTenantContextAsync();

      if (!tenantContext) {
        throw new GeneralBadRequestException(
          'Tenant context not found',
          `Tenant context does not exist for use case: ${this.useCaseName}`,
          {
            useCaseName: this.useCaseName,
            useCaseDescription: this.useCaseDescription,
            useCaseVersion: this.useCaseVersion,
            errorType: TENANT_ERROR_CODES.CONTEXT_NOT_FOUND,
          }
        );
      }

      if (!tenantContext.tenantId) {
        throw new GeneralBadRequestException(
          'Tenant ID not found',
          `Tenant ID does not exist in context for use case: ${this.useCaseName}`,
          {
            useCaseName: this.useCaseName,
            useCaseDescription: this.useCaseDescription,
            useCaseVersion: this.useCaseVersion,
            tenantContext: tenantContext,
            errorType: TENANT_ERROR_CODES.ID_NOT_FOUND,
          }
        );
      }

      // 验证租户状态
      if (tenantContext.metadata?.['tenantStatus'] === 'inactive') {
        throw new GeneralBadRequestException(
          'Tenant is inactive',
          `Tenant status is inactive for use case: ${this.useCaseName}`,
          {
            useCaseName: this.useCaseName,
            useCaseDescription: this.useCaseDescription,
            useCaseVersion: this.useCaseVersion,
            tenantId: tenantContext.tenantId,
            tenantStatus: tenantContext.metadata?.['tenantStatus'],
            errorType: TENANT_ERROR_CODES.INACTIVE,
          }
        );
      }

      this.logger.info(
        `Tenant context validation passed: ${this.useCaseName}`,
        {
          useCaseName: this.useCaseName,
          tenantId: tenantContext.tenantId,
          userId: tenantContext.userId,
          requestId: tenantContext.requestId,
        }
      );
    } catch (error) {
      this.logger.error(
        `Tenant context validation failed: ${this.useCaseName}`,
        {
          useCaseName: this.useCaseName,
          error: (error as Error).message,
          stack: (error as Error).stack,
        }
      );
      throw error;
    }
  }

  /**
   * 获取当前租户上下文
   *
   * @returns 租户上下文信息
   */
  protected getTenantContextAsync(): Promise<ITenantContext | null> {
    try {
      const context = this.tenantContextService.getContext();
      return Promise.resolve(context);
    } catch (error) {
      this.logger.warn(`Failed to get tenant context: ${this.useCaseName}`, {
        useCaseName: this.useCaseName,
        error: (error as Error).message,
      });
      return Promise.resolve(null);
    }
  }

  /**
   * 创建执行上下文
   *
   * @description 创建包含多租户信息的执行上下文
   * 自动集成租户上下文信息
   *
   * @returns 执行上下文
   */
  protected override createContext(): IUseCaseContext {
    const baseContext = super.createContext();

    // 尝试获取多租户上下文信息
    try {
      const tenantContext = this.tenantContextService.getContext();
      if (tenantContext) {
        baseContext.tenant = {
          id: tenantContext.tenantId.toString(),
          name: (tenantContext.metadata?.['tenantName'] as string) || 'Unknown',
        };

        if (tenantContext.userId) {
          baseContext.user = {
            id: tenantContext.userId,
            name: (tenantContext.metadata?.['userName'] as string) || 'Unknown',
            permissions:
              (tenantContext.metadata?.['permissions'] as string[]) || [],
          };
        }
      }
    } catch (error) {
      // 如果获取租户上下文失败，记录警告但不影响用例执行
      this.logger.warn(
        `Failed to get tenant context for use case: ${this.useCaseName}`,
        {
          useCaseName: this.useCaseName,
          error: (error as Error).message,
        }
      );
    }

    return baseContext;
  }

  /**
   * 记录用例开始执行日志
   */
  private logTenantAwareUseCaseStart(
    request: TRequest,
    context: IUseCaseContext
  ): void {
    this.logger.info(`Tenant-aware use case started: ${this.useCaseName}`, {
      useCaseName: this.useCaseName,
      useCaseDescription: this.useCaseDescription,
      useCaseVersion: this.useCaseVersion,
      request,
      context: {
        requestId: context.request?.id,
        userId: context.user?.id,
        tenantId: context.tenant?.id,
      },
    });
  }

  /**
   * 记录用例成功执行日志
   */
  private logTenantAwareUseCaseSuccess(
    request: TRequest,
    response: TResponse,
    context: IUseCaseContext,
    executionTime: number
  ): void {
    this.logger.info(
      `Tenant-aware use case completed successfully: ${this.useCaseName}`,
      {
        useCaseName: this.useCaseName,
        executionTime: `${executionTime}ms`,
        response,
        context: {
          requestId: context.request?.id,
          userId: context.user?.id,
          tenantId: context.tenant?.id,
        },
      }
    );
  }

  /**
   * 记录用例执行失败日志
   */
  private logTenantAwareUseCaseError(
    request: TRequest,
    error: any,
    context: IUseCaseContext,
    executionTime: number
  ): void {
    this.logger.error(`Tenant-aware use case failed: ${this.useCaseName}`, {
      useCaseName: this.useCaseName,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      executionTime: `${executionTime}ms`,
      request,
      context: {
        requestId: context.request?.id,
        userId: context.user?.id,
        tenantId: context.tenant?.id,
      },
    });
  }
}
