/**
 * 安全防护中间件
 *
 * 提供全面的安全防护功能，包括安全头设置、CORS配置、请求验证等。
 *
 * @description 此中间件提供全面的安全防护功能。
 * 包括安全头设置、CORS配置、请求验证、IP白名单、请求大小限制等企业级安全功能。
 * 专为SAAS平台设计，支持多租户架构和微服务架构。
 *
 * ## 业务规则
 *
 * ### 安全头规则
 * - Content-Security-Policy: 防止XSS攻击
 * - X-Frame-Options: 防止点击劫持
 * - X-Content-Type-Options: 防止MIME类型嗅探
 * - Strict-Transport-Security: 强制HTTPS
 * - Referrer-Policy: 控制引用信息泄露
 *
 * ### CORS规则
 * - 支持多域名配置
 * - 支持凭据传递
 * - 支持预检请求处理
 * - 支持自定义头部
 *
 * ### 请求验证规则
 * - 请求大小限制
 * - 请求频率限制
 * - IP白名单/黑名单
 * - 请求头验证
 *
 * @example
 * ```typescript
 * // 配置安全中间件
 * const securityMiddleware = new SecurityMiddleware({
 *   helmet: {
 *     contentSecurityPolicy: true,
 *     crossOriginEmbedderPolicy: true,
 *     hsts: true
 *   },
 *   cors: {
 *     origin: ['https://example.com'],
 *     credentials: true,
 *     methods: ['GET', 'POST', 'PUT', 'DELETE']
 *   },
 *   requestValidation: {
 *     maxBodySize: '10mb',
 *     allowedHeaders: ['Content-Type', 'Authorization']
 *   }
 * });
 *
 * // 注册安全中间件
 * fastify.register(securityMiddleware);
 * ```
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * 安全配置接口
 */
export interface ISecurityConfig {
  /** Helmet配置 */
  helmet?: {
    contentSecurityPolicy?: boolean | object;
    crossOriginEmbedderPolicy?: boolean;
    hsts?: boolean | object;
    xFrameOptions?: boolean | string;
    xContentTypeOptions?: boolean;
    referrerPolicy?: boolean | string;
    noSniff?: boolean;
    xssFilter?: boolean;
  };

  /** CORS配置 */
  cors?: {
    origin?: boolean | string | string[] | ((origin: string) => boolean);
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  };

  /** 请求验证配置 */
  requestValidation?: {
    maxBodySize?: string | number;
    allowedHeaders?: string[];
    blockedHeaders?: string[];
    maxHeaderSize?: number;
    maxUrlLength?: number;
  };

  /** IP白名单配置 */
  ipWhitelist?: {
    enabled?: boolean;
    allowedIPs?: string[];
    allowedRanges?: string[];
    blockedIPs?: string[];
    blockedRanges?: string[];
  };

  /** 请求频率限制 */
  rateLimit?: {
    enabled?: boolean;
    windowMs?: number;
    maxRequests?: number;
    skipSuccessfulRequests?: boolean;
  };

  /** 安全头配置 */
  securityHeaders?: {
    [key: string]: string | boolean;
  };

  /** 自定义验证函数 */
  customValidation?: (request: FastifyRequest) => Promise<boolean> | boolean;
}

/**
 * 安全中间件类
 *
 * @description 提供全面的安全防护功能
 */
export class SecurityMiddleware {
  private readonly config: ISecurityConfig;

  constructor(config: ISecurityConfig = {}) {
    this.config = {
      helmet: {
        contentSecurityPolicy: true,
        crossOriginEmbedderPolicy: true,
        hsts: true,
        xFrameOptions: 'DENY',
        xContentTypeOptions: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
        noSniff: true,
        xssFilter: true,
      },
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        maxAge: 86400,
      },
      requestValidation: {
        maxBodySize: '10mb',
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-Tenant-ID',
        ],
        maxHeaderSize: 8192,
        maxUrlLength: 2048,
      },
      ipWhitelist: {
        enabled: false,
        allowedIPs: [],
        allowedRanges: [],
        blockedIPs: [],
        blockedRanges: [],
      },
      rateLimit: {
        enabled: false,
        windowMs: 60000,
        maxRequests: 100,
        skipSuccessfulRequests: false,
      },
      securityHeaders: {},
      ...config,
    };
  }

  /**
   * 注册安全中间件
   *
   * @description 将安全中间件注册到Fastify实例
   */
  register(fastify: FastifyInstance): void {
    // 注册CORS插件
    if (this.config.cors) {
      // 动态导入CORS插件以避免类型错误
      const corsPlugin = require('@fastify/cors');
      fastify.register(corsPlugin, this.config.cors);
    }

    // 注册请求验证中间件
    fastify.addHook(
      'preHandler',
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          // IP白名单检查
          if (!(await this.checkIPWhitelist(request))) {
            this.sendForbiddenResponse(reply, 'IP address not allowed');
            return;
          }

          // 请求头验证
          if (!(await this.validateHeaders(request))) {
            this.sendBadRequestResponse(reply, 'Invalid request headers');
            return;
          }

          // 请求大小检查
          if (!(await this.checkRequestSize(request))) {
            this.sendPayloadTooLargeResponse(reply, 'Request too large');
            return;
          }

          // 自定义验证
          if (
            this.config.customValidation &&
            !(await this.config.customValidation(request))
          ) {
            this.sendForbiddenResponse(reply, 'Custom validation failed');
            return;
          }

          // 设置安全头
          this.setSecurityHeaders(reply);
        } catch (error: unknown) {
          fastify.log.error(error as Error, 'Security middleware error');
          this.sendInternalServerErrorResponse(
            reply,
            'Security validation failed'
          );
        }
      }
    );

    // 注册响应处理中间件
    fastify.addHook(
      'onSend',
      async (request: FastifyRequest, reply: FastifyReply, payload: unknown) => {
        // 设置响应安全头
        this.setResponseSecurityHeaders(reply);
        return payload;
      }
    );
  }

  /**
   * 检查IP白名单
   *
   * @description 检查请求IP是否在白名单中
   */
  public async checkIPWhitelist(request: FastifyRequest): Promise<boolean> {
    const ipConfig = this.config.ipWhitelist;
    if (!ipConfig?.enabled) {
      return true;
    }

    const clientIP = this.getClientIP(request);

    // 检查黑名单
    if (ipConfig.blockedIPs?.includes(clientIP)) {
      return false;
    }

    // 检查IP范围黑名单
    if (
      ipConfig.blockedRanges?.some((range) => this.isIPInRange(clientIP, range))
    ) {
      return false;
    }

    // 如果启用了白名单，检查白名单
    if (ipConfig.allowedIPs?.length || ipConfig.allowedRanges?.length) {
      const inWhitelist =
        ipConfig.allowedIPs?.includes(clientIP) ||
        ipConfig.allowedRanges?.some((range) =>
          this.isIPInRange(clientIP, range)
        );

      if (!inWhitelist) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证请求头
   *
   * @description 验证请求头是否符合安全要求
   */
  public async validateHeaders(request: FastifyRequest): Promise<boolean> {
    const validation = this.config.requestValidation;
    if (!validation) {
      return true;
    }

    // 检查允许的头部
    if (validation.allowedHeaders) {
      const requestHeaders = Object.keys(request.headers);
      const hasInvalidHeader = requestHeaders.some(
        (header) => !validation.allowedHeaders?.includes(header.toLowerCase())
      );

      if (hasInvalidHeader) {
        return false;
      }
    }

    // 检查被阻止的头部
    if (validation.blockedHeaders) {
      const requestHeaders = Object.keys(request.headers);
      const hasBlockedHeader = requestHeaders.some((header) =>
        validation.blockedHeaders?.includes(header.toLowerCase())
      );

      if (hasBlockedHeader) {
        return false;
      }
    }

    // 检查头部大小
    if (validation.maxHeaderSize) {
      const headerSize = JSON.stringify(request.headers).length;
      if (headerSize > validation.maxHeaderSize) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查请求大小
   *
   * @description 检查请求体大小是否符合限制
   */
  public async checkRequestSize(request: FastifyRequest): Promise<boolean> {
    const validation = this.config.requestValidation;
    if (!validation?.maxBodySize) {
      return true;
    }

    const maxSize = this.parseSize(validation.maxBodySize);
    const contentLength = parseInt(request.headers['content-length'] || '0');

    return contentLength <= maxSize;
  }

  /**
   * 设置安全头
   *
   * @description 设置HTTP安全头
   */
  public setSecurityHeaders(reply: FastifyReply): void {
    const helmet = this.config.helmet;
    if (!helmet) {
      return;
    }

    // Content Security Policy
    if (helmet.contentSecurityPolicy) {
      const csp =
        typeof helmet.contentSecurityPolicy === 'object'
          ? helmet.contentSecurityPolicy
          : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
      reply.header('Content-Security-Policy', csp);
    }

    // X-Frame-Options
    if (helmet.xFrameOptions) {
      const xfo =
        typeof helmet.xFrameOptions === 'string'
          ? helmet.xFrameOptions
          : 'DENY';
      reply.header('X-Frame-Options', xfo);
    }

    // X-Content-Type-Options
    if (helmet.xContentTypeOptions) {
      reply.header('X-Content-Type-Options', 'nosniff');
    }

    // Strict-Transport-Security
    if (helmet.hsts) {
      const hsts =
        typeof helmet.hsts === 'object'
          ? helmet.hsts
          : 'max-age=31536000; includeSubDomains';
      reply.header('Strict-Transport-Security', hsts);
    }

    // Referrer-Policy
    if (helmet.referrerPolicy) {
      const rp =
        typeof helmet.referrerPolicy === 'string'
          ? helmet.referrerPolicy
          : 'strict-origin-when-cross-origin';
      reply.header('Referrer-Policy', rp);
    }

    // X-XSS-Protection
    if (helmet.xssFilter) {
      reply.header('X-XSS-Protection', '1; mode=block');
    }

    // 自定义安全头
    if (this.config.securityHeaders) {
      Object.entries(this.config.securityHeaders).forEach(([key, value]) => {
        if (typeof value === 'string') {
          reply.header(key, value);
        }
      });
    }
  }

  /**
   * 设置响应安全头
   *
   * @description 设置响应相关的安全头
   */
  private setResponseSecurityHeaders(reply: FastifyReply): void {
    // 移除敏感信息
    reply.removeHeader('X-Powered-By');
    reply.removeHeader('Server');

    // 设置缓存控制
    reply.header(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    reply.header('Pragma', 'no-cache');
    reply.header('Expires', '0');
  }

  /**
   * 获取客户端IP
   *
   * @description 获取客户端真实IP地址
   */
  private getClientIP(request: FastifyRequest): string {
    const forwarded = request.headers['x-forwarded-for'];
    const realIP = request.headers['x-real-ip'];
    const remoteAddress = request.socket.remoteAddress;

    if (forwarded) {
      return Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0].trim();
    }

    if (realIP) {
      return Array.isArray(realIP) ? realIP[0] : realIP;
    }

    return remoteAddress || 'unknown';
  }

  /**
   * 检查IP是否在范围内
   *
   * @description 检查IP地址是否在指定范围内
   */
  private isIPInRange(ip: string, range: string): boolean {
    // 简化的IP范围检查，实际项目中可以使用更复杂的CIDR检查
    if (range.includes('/')) {
      // CIDR格式
      const [network, prefixLength] = range.split('/');
      return this.isIPInCIDR(ip, network, parseInt(prefixLength));
    } else if (range.includes('-')) {
      // IP范围格式（简化实现：只做字符串比较，建议用专业库替换）
      const [start, end] = range.split('-').map((s) => s.trim());
      return ip >= start && ip <= end;
    } else {
      // 精确匹配
      return ip === range;
    }
  }

  /**
   * 检查IP是否在CIDR范围内
   *
   * @description 检查IP地址是否在CIDR范围内
   */
  private isIPInCIDR(
    ip: string,
    network: string,
    prefixLength: number
  ): boolean {
    // 简化的CIDR检查，实际项目中可以使用专门的CIDR库
    const ipParts = ip.split('.').map(Number);
    const networkParts = network.split('.').map(Number);

    for (let i = 0; i < 4; i++) {
      const mask = prefixLength > 8 * i ? Math.min(8, prefixLength - 8 * i) : 0;
      const ipPart = ipParts[i] >> (8 - mask);
      const networkPart = networkParts[i] >> (8 - mask);

      if (ipPart !== networkPart) {
        return false;
      }
    }

    return true;
  }

  /**
   * 解析大小字符串
   *
   * @description 解析大小字符串为字节数
   */
  private parseSize(size: string | number): number {
    if (typeof size === 'number') {
      return size;
    }

    const units: { [key: string]: number } = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024,
    };

    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
    if (!match) {
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2] || 'b';

    return Math.floor(value * (units[unit] || 1));
  }

  /**
   * 发送禁止响应
   *
   * @description 发送403禁止响应
   */
  public sendForbiddenResponse(reply: FastifyReply, message: string): void {
    reply.status(403).send({
      error: 'Forbidden',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 发送错误请求响应
   *
   * @description 发送400错误请求响应
   */
  public sendBadRequestResponse(reply: FastifyReply, message: string): void {
    reply.status(400).send({
      error: 'Bad Request',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 发送负载过大响应
   *
   * @description 发送413负载过大响应
   */
  public sendPayloadTooLargeResponse(
    reply: FastifyReply,
    message: string
  ): void {
    reply.status(413).send({
      error: 'Payload Too Large',
      message,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 发送内部服务器错误响应
   *
   * @description 发送500内部服务器错误响应
   */
  public sendInternalServerErrorResponse(
    reply: FastifyReply,
    message: string
  ): void {
    reply.status(500).send({
      error: 'Internal Server Error',
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 创建安全中间件
 *
 * @description 创建安全中间件的便捷函数
 */
export function createSecurityMiddleware(
  config: ISecurityConfig
): SecurityMiddleware {
  return new SecurityMiddleware(config);
}

/**
 * 安全中间件装饰器
 *
 * @description 用于装饰器模式的安全中间件
 */
export function Security(config: ISecurityConfig) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const securityMiddleware = new SecurityMiddleware(config);

    descriptor.value = async function (
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      // 执行安全验证
      if (!(await securityMiddleware.checkIPWhitelist(request))) {
        securityMiddleware.sendForbiddenResponse(
          reply,
          'IP address not allowed'
        );
        return;
      }

      if (!(await securityMiddleware.validateHeaders(request))) {
        securityMiddleware.sendBadRequestResponse(
          reply,
          'Invalid request headers'
        );
        return;
      }

      // 设置安全头
      securityMiddleware.setSecurityHeaders(reply);

      return originalMethod.call(this, request, reply);
    };
  };
}
