/**
 * CORS插件
 *
 * @description 处理跨域资源共享（CORS）的Fastify插件
 * 支持灵活的CORS配置，包括域名白名单、HTTP方法、请求头等
 *
 * ## CORS核心概念
 *
 * ### 🌐 **跨域问题**
 * - 浏览器同源策略限制跨域请求
 * - 需要服务器明确允许跨域访问
 * - 涉及预检请求（Preflight Request）处理
 *
 * ### 🛡️ **安全考虑**
 * - 防止恶意网站访问敏感API
 * - 控制允许的域名、方法、请求头
 * - 支持凭据（Credentials）传递
 *
 * @since 1.0.0
 */

import { FastifyInstance } from 'fastify';
import { CoreFastifyPlugin } from './core-fastify.plugin';
import { IFastifyPluginConfig } from '../types/fastify.types';

/**
 * CORS插件配置
 */
export interface ICorsPluginConfig extends IFastifyPluginConfig {
  /** 允许的源域名 */
  origin?: boolean | string | string[] | ((origin: string) => boolean);

  /** 允许的HTTP方法 */
  methods?: string | string[];

  /** 允许的请求头 */
  allowedHeaders?: string | string[];

  /** 暴露的响应头 */
  exposedHeaders?: string | string[];

  /** 是否允许凭据 */
  credentials?: boolean;

  /** 预检请求缓存时间（秒） */
  maxAge?: number;

  /** 是否启用预检请求 */
  preflightContinue?: boolean;

  /** 预检请求状态码 */
  optionsSuccessStatus?: number;
}

/**
 * CORS插件
 *
 * @description 基于@fastify/cors的企业级CORS插件实现
 */
export class CorsPlugin extends CoreFastifyPlugin {
  private readonly corsConfig: ICorsPluginConfig;

  constructor(config: ICorsPluginConfig) {
    super({
      priority: 1,
      enabled: true,
      ...config,
    });

    this.corsConfig = {
      name: 'cors',
      origin: config.origin || true,
      methods: config.methods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: config.allowedHeaders || [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Tenant-ID',
        'X-User-ID',
      ],
      exposedHeaders: config.exposedHeaders || [],
      credentials: config.credentials || true,
      maxAge: config.maxAge || 86400, // 24小时
      preflightContinue: config.preflightContinue || false,
      optionsSuccessStatus: config.optionsSuccessStatus || 204,
    };
  }

  /**
   * 执行插件注册
   *
   * @description 注册@fastify/cors插件到Fastify实例
   */
  protected async doRegister(fastify: FastifyInstance): Promise<void> {
    // 动态导入@fastify/cors插件
    const corsPlugin = await import('@fastify/cors');

    // 注册CORS插件
    await fastify.register(corsPlugin.default, {
      origin: this.corsConfig.origin as any,
      methods: this.corsConfig.methods,
      allowedHeaders: this.corsConfig.allowedHeaders,
      exposedHeaders: this.corsConfig.exposedHeaders,
      credentials: this.corsConfig.credentials,
      maxAge: this.corsConfig.maxAge,
      preflightContinue: this.corsConfig.preflightContinue,
      optionsSuccessStatus: this.corsConfig.optionsSuccessStatus,
    });
  }

  /**
   * 执行插件卸载
   *
   * @description 从Fastify实例卸载CORS插件
   */
  protected async doUnregister(_fastify: FastifyInstance): Promise<void> {
    // CORS插件通常不需要特殊卸载逻辑
    // Fastify会自动处理插件的卸载
  }

  /**
   * 执行健康检查
   *
   * @description 检查CORS插件是否正常工作
   */
  protected override async doHealthCheck(): Promise<boolean> {
    try {
      // 检查CORS配置是否有效
      if (!this.corsConfig.origin) return false;
      if (!this.corsConfig.methods || this.corsConfig.methods.length === 0)
        return false;

      return true;
    } catch (error) {
      console.error('CORS插件健康检查失败:', error);
      return false;
    }
  }

  /**
   * 获取CORS配置信息
   *
   * @description 获取当前CORS插件的配置信息
   */
  getCorsConfig(): ICorsPluginConfig {
    return { ...this.corsConfig };
  }

  /**
   * 验证源域名
   *
   * @description 验证请求的源域名是否被允许
   */
  isOriginAllowed(origin: string): boolean {
    if (this.corsConfig.origin === true) return true;
    if (this.corsConfig.origin === false) return false;

    if (typeof this.corsConfig.origin === 'string') {
      return this.corsConfig.origin === origin;
    }

    if (Array.isArray(this.corsConfig.origin)) {
      return this.corsConfig.origin.includes(origin);
    }

    if (typeof this.corsConfig.origin === 'function') {
      return this.corsConfig.origin(origin);
    }

    return false;
  }

  /**
   * 验证HTTP方法
   *
   * @description 验证请求的HTTP方法是否被允许
   */
  isMethodAllowed(method: string): boolean {
    if (!this.corsConfig.methods) return true;

    if (typeof this.corsConfig.methods === 'string') {
      return this.corsConfig.methods === method;
    }

    if (Array.isArray(this.corsConfig.methods)) {
      return this.corsConfig.methods.includes(method);
    }

    return false;
  }

  /**
   * 验证请求头
   *
   * @description 验证请求头是否被允许
   */
  isHeaderAllowed(header: string): boolean {
    if (!this.corsConfig.allowedHeaders) return true;

    if (typeof this.corsConfig.allowedHeaders === 'string') {
      return this.corsConfig.allowedHeaders === header;
    }

    if (Array.isArray(this.corsConfig.allowedHeaders)) {
      return this.corsConfig.allowedHeaders.includes(header);
    }

    return false;
  }
}

/**
 * CORS插件工厂函数
 *
 * @description 创建CORS插件的便捷函数
 */
export function createCorsPlugin(
  config: Partial<ICorsPluginConfig> = {}
): CorsPlugin {
  return new CorsPlugin({
    name: 'cors',
    priority: 1,
    enabled: true,
    ...config,
  });
}

/**
 * 默认CORS配置
 *
 * @description 提供常用的CORS配置预设
 */
export const DefaultCorsConfigs = {
  /** 开发环境配置 - 允许所有源 */
  development: {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  },

  /** 生产环境配置 - 严格限制 */
  production: {
    origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  },

  /** API服务配置 - 允许特定域名 */
  apiService: {
    origin: (origin: string) => {
      const allowedOrigins = [
        'https://app.yourdomain.com',
        'https://admin.yourdomain.com',
        'http://localhost:3000', // 开发环境
      ];
      return allowedOrigins.includes(origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Tenant-ID',
      'X-User-ID',
      'X-Request-ID',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 3600, // 1小时
  },
} as const;
