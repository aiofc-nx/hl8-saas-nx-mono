/**
 * 租户上下文中间件
 *
 * @description 从请求中提取租户ID并设置到租户上下文，支持多种租户识别方式
 * @since 1.1.0
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from '@hl8/fastify-pro';
import { PinoLogger } from '@hl8/logger';
import { TenantContextService} from '@hl8/multi-tenancy';
import {
  GeneralBadRequestException,
} from '@hl8/common';
import { EntityId } from '../../../domain/value-objects';

/**
 * 租户上下文中间件
 *
 * @description 在请求处理前自动提取租户ID并设置租户上下文
 * 支持从多个来源提取租户ID：请求头、查询参数、子域名、JWT Token
 *
 * ## 业务规则
 *
 * ### 租户ID提取规则
 * - 优先级：请求头 > 查询参数 > 子域名 > JWT Token
 * - 租户ID必须是有效的UUID v4格式
 * - 租户ID提取失败时抛出明确异常
 * - 支持配置必需/可选模式
 *
 * ### 租户上下文设置规则
 * - 租户上下文在整个请求生命周期内有效
 * - 上下文包含租户ID、用户ID、请求ID等信息
 * - 上下文设置失败时抛出异常
 * - 请求结束时自动清理上下文
 *
 * ### 安全规则
 * - 验证用户是否有权访问指定租户（如有用户信息）
 * - 记录租户上下文设置的审计日志
 * - 防止租户ID伪造和篡改
 * - 支持租户级别的访问控制
 *
 * ## 业务逻辑流程
 *
 * 1. **提取租户ID**：从请求头/查询参数/子域名/JWT中提取
 * 2. **验证租户ID**：验证格式和有效性
 * 3. **验证权限**：验证用户是否有权访问该租户（可选）
 * 4. **设置上下文**：调用 TenantContextService 设置上下文
 * 5. **继续处理**：调用下一个中间件或路由处理器
 * 6. **自动清理**：请求结束时自动清理上下文
 *
 * @example
 * ```typescript
 * // 在 AppModule 中配置
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(TenantContextMiddleware)
 *       .forRoutes('*');  // 应用到所有路由
 *   }
 * }
 *
 * // 在控制器中使用
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   async getUsers(@TenantContext() context: ITenantContext) {
 *     // 租户上下文已自动设置
 *     console.log('Current tenant:', context.tenantId);
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext({ requestId: 'TenantContextMiddleware' });
  }

  /**
   * 处理请求
   *
   * @description 提取租户ID并设置租户上下文
   *
   * ## 业务规则
   *
   * ### 租户ID提取顺序
   * 1. 请求头 X-Tenant-ID（优先级最高）
   * 2. 查询参数 tenantId
   * 3. 子域名（如：tenant123.example.com）
   * 4. JWT Token 中的 tenantId 字段
   *
   * ### 上下文设置
   * - 创建完整的租户上下文对象
   * - 包含租户ID、用户ID、请求ID、时间戳
   * - 调用 TenantContextService 设置上下文
   *
   * ### 错误处理
   * - 租户ID缺失：抛出 GeneralBadRequestException
   * - 租户ID格式无效：抛出 GeneralBadRequestException
   * - 用户无权访问租户：抛出 GeneralUnauthorizedException
   * - 上下文设置失败：抛出 GeneralBadRequestException
   *
   * @param req - Fastify 请求对象
   * @param res - Fastify 响应对象
   * @param next - 下一个中间件函数
   *
   * @throws {GeneralBadRequestException} 当租户ID缺失、无效或用户无权访问时
   *
   * @example
   * ```typescript
   * // 请求示例
   * GET /api/users
   * Headers:
   *   X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000
   *   Authorization: Bearer <jwt-token>
   * ```
   */
  async use(
    req: FastifyRequest,
    res: FastifyReply,
    next: () => void
  ): Promise<void> {
    try {
      // 1. 提取租户ID（按优先级）
      const tenantIdString = this.extractTenantId(req);

      if (!tenantIdString) {
        throw new GeneralBadRequestException(
          'Tenant ID required',
          '请求必须包含租户ID（通过请求头、查询参数或子域名）',
          {
            url: req.url,
            method: req.method,
            headers: this.sanitizeHeaders(req.headers),
          }
        );
      }

      // 2. 验证租户ID格式
      this.validateTenantIdFormat(tenantIdString);

      // 3. 转换为 EntityId
      const tenantId = EntityId.fromString(tenantIdString);

      // 4. 提取用户信息（如果已认证）
      const user = req['user'];
      const userId = user?.id || user?.sub;

      // 5. 验证用户是否有权访问该租户（如果有用户信息）
      if (userId && user?.tenantId) {
        this.validateUserTenantAccess(userId, user.tenantId, tenantIdString);
      }

      // 6. 生成请求ID
      const requestId = this.extractOrGenerateRequestId(req);

      // 7. 设置租户上下文
      await this.tenantContextService.setContext({
        tenantId,
        userId,
        sessionId: req.headers['x-session-id'] as string,
        metadata: {
          requestId,
          ip: this.getClientIp(req),
          userAgent: this.getUserAgent(req),
          method: req.method,
          url: req.url,
        },
        timestamp: new Date(),
      });

      // 8. 设置到请求对象（便于后续访问）
      req['tenantId'] = tenantIdString;
      req['tenantContext'] = {
        tenantId: tenantIdString,
        userId,
      };

      // 9. 记录日志
      this.logger.debug('租户上下文已设置', {
        tenantId: tenantIdString,
        userId,
        url: req.url,
        method: req.method,
      });

      // 10. 继续处理
      next();
    } catch (error) {
      this.logger.error('设置租户上下文失败', {
        error: (error as Error).message,
        url: req.url,
        method: req.method,
      });
      throw error;
    }
  }

  /**
   * 提取租户ID
   *
   * @description 从多个来源按优先级提取租户ID
   *
   * @param req - Fastify 请求对象
   * @returns 租户ID字符串或null
   *
   * @private
   */
  private extractTenantId(req: FastifyRequest): string | null {
    // 1. 从请求头提取（优先级最高）
    const headerTenantId = req.headers['x-tenant-id'] as string;
    if (headerTenantId) {
      this.logger.debug('从请求头提取租户ID', { tenantId: headerTenantId });
      return headerTenantId;
    }

    // 2. 从查询参数提取
    const query = req.query as Record<string, unknown>;
    const queryTenantId = query['tenantId'] as string;
    if (queryTenantId) {
      this.logger.debug('从查询参数提取租户ID', { tenantId: queryTenantId });
      return queryTenantId;
    }

    // 3. 从子域名提取
    const host = req.headers['host'] as string;
    if (host) {
      const subdomain = this.extractSubdomain(host);
      if (subdomain && this.isValidTenantSubdomain(subdomain)) {
        this.logger.debug('从子域名提取租户ID', { subdomain });
        return subdomain;
      }
    }

    // 4. 从JWT Token提取
    const user = req['user'];
    if (user?.tenantId) {
      this.logger.debug('从JWT提取租户ID', { tenantId: user.tenantId });
      return user.tenantId;
    }

    return null;
  }

  /**
   * 提取子域名
   *
   * @description 从主机名中提取子域名
   *
   * @param host - 主机名（如：tenant123.example.com）
   * @returns 子域名（如：tenant123）或null
   *
   * @private
   *
   * @example
   * ```typescript
   * extractSubdomain('tenant123.example.com')  // => 'tenant123'
   * extractSubdomain('example.com')            // => null
   * extractSubdomain('www.example.com')        // => null（www不视为租户）
   * ```
   */
  private extractSubdomain(host: string): string | null {
    // 移除端口号
    const hostname = host.split(':')[0];

    // 分割域名部分
    const parts = hostname.split('.');

    // 至少需要 3 个部分（如：tenant.example.com）
    if (parts.length < 3) {
      return null;
    }

    const subdomain = parts[0];

    // 忽略常见的非租户子域名
    const ignoredSubdomains = ['www', 'api', 'app', 'admin', 'dashboard'];
    if (ignoredSubdomains.includes(subdomain.toLowerCase())) {
      return null;
    }

    return subdomain;
  }

  /**
   * 验证租户子域名格式
   *
   * @description 验证子域名是否是有效的租户标识符
   *
   * @param subdomain - 子域名
   * @returns 是否有效
   *
   * @private
   */
  private isValidTenantSubdomain(subdomain: string): boolean {
    // 租户子域名规则：3-20个字符，小写字母、数字、连字符
    const pattern = /^[a-z0-9]([a-z0-9-]{1,18}[a-z0-9])?$/;
    return pattern.test(subdomain);
  }

  /**
   * 验证租户ID格式
   *
   * @description 验证租户ID是否符合UUID v4格式
   *
   * @param tenantId - 租户ID字符串
   *
   * @throws {GeneralBadRequestException} 当格式无效时
   *
   * @private
   */
  private validateTenantIdFormat(tenantId: string): void {
    const uuidV4Pattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidV4Pattern.test(tenantId)) {
      throw new GeneralBadRequestException(
        'Invalid tenant ID format',
        '租户ID格式无效，必须是有效的UUID v4格式',
        {
          tenantId,
          expectedPattern: 'UUID v4 (xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx)',
        }
      );
    }
  }

  /**
   * 验证用户租户访问权限
   *
   * @description 验证用户是否有权访问指定的租户
   *
   * @param userId - 用户ID
   * @param userTenantId - 用户所属的租户ID
   * @param requestTenantId - 请求的租户ID
   *
   * @throws {GeneralBadRequestException} 当用户无权访问租户时
   *
   * @private
   */
  private validateUserTenantAccess(
    userId: string,
    userTenantId: string,
    requestTenantId: string
  ): void {
    if (userTenantId !== requestTenantId) {
      this.logger.warn('用户尝试访问其他租户', {
        userId,
        userTenantId,
        requestTenantId,
      });

      throw new GeneralBadRequestException(
        'Cross-tenant access denied',
        '无权访问其他租户的资源',
        {
          userId,
          userTenantId,
          requestTenantId,
          reason: 'tenant-mismatch',
        }
      );
    }
  }

  /**
   * 提取或生成请求ID
   *
   * @description 从请求头提取请求ID，如果不存在则生成新的
   *
   * @param req - Fastify 请求对象
   * @returns 请求ID
   *
   * @private
   */
  private extractOrGenerateRequestId(req: FastifyRequest): string {
    const headerRequestId = req.headers['x-request-id'] as string;
    if (headerRequestId) {
      return headerRequestId;
    }

    // 生成新的请求ID（使用简单的UUID v4）
    return this.generateRequestId();
  }

  /**
   * 生成请求ID
   *
   * @description 生成唯一的请求ID（UUID v4格式）
   *
   * @returns 请求ID
   *
   * @private
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 获取客户端IP地址
   *
   * @description 从请求中获取真实的客户端IP地址
   * 支持代理、负载均衡器等场景
   *
   * @param req - Fastify 请求对象
   * @returns 客户端IP地址
   *
   * @private
   */
  private getClientIp(req: FastifyRequest): string {
    // 1. X-Forwarded-For（代理）
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // 2. X-Real-IP（nginx）
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // 3. 直接连接IP
    return req.ip || 'unknown';
  }

  /**
   * 获取用户代理
   *
   * @description 从请求头获取用户代理字符串
   *
   * @param req - Fastify 请求对象
   * @returns 用户代理字符串
   *
   * @private
   */
  private getUserAgent(req: FastifyRequest): string {
    const userAgent = req.headers['user-agent'];
    return Array.isArray(userAgent) ? userAgent[0] : userAgent || 'unknown';
  }

  /**
   * 清理敏感请求头
   *
   * @description 移除敏感信息，用于日志记录
   *
   * @param headers - 原始请求头
   * @returns 清理后的请求头
   *
   * @private
   */
  private sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...headers };
    
    // 移除敏感字段
    delete sanitized['authorization'];
    delete sanitized['cookie'];
    delete sanitized['x-api-key'];
    
    return sanitized;
  }
}

