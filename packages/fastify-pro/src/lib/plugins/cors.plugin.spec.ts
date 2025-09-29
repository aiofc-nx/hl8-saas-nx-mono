/**
 * CorsPlugin 单元测试
 *
 * @description 测试CORS插件的功能
 *
 * @since 1.0.0
 */

import {
  CorsPlugin,
  createCorsPlugin,
  DefaultCorsConfigs,
} from './cors.plugin';
import { ICorsPluginConfig } from './cors.plugin';

// Mock Fastify
jest.mock('fastify', () => {
  return jest.fn(() => ({
    register: jest.fn().mockResolvedValue(undefined),
  }));
});

describe('CorsPlugin', () => {
  let plugin: CorsPlugin;
  let mockConfig: ICorsPluginConfig;

  beforeEach(() => {
    mockConfig = {
      name: 'cors',
      priority: 1,
      enabled: true,
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    };
  });

  afterEach(() => {
    if (plugin) {
      plugin = null as any;
    }
  });

  describe('构造函数', () => {
    it('应该正确初始化插件', () => {
      plugin = new CorsPlugin(mockConfig);
      expect(plugin).toBeDefined();
      expect(plugin.name).toBe('cors');
      expect(plugin.enabled).toBe(true);
      expect(plugin.priority).toBe(1);
    });

    it('应该使用默认配置', () => {
      const minimalConfig = {
        name: 'cors',
        origin: true,
      };
      plugin = new CorsPlugin(minimalConfig);
      expect(plugin).toBeDefined();
    });
  });

  describe('插件注册', () => {
    beforeEach(() => {
      plugin = new CorsPlugin(mockConfig);
    });

    it('应该能够注册插件', async () => {
      const mockFastify = {
        register: jest.fn().mockResolvedValue(undefined),
      };

      await expect(plugin.register(mockFastify as any)).resolves.not.toThrow();
      expect(mockFastify.register).toHaveBeenCalled();
    });

    it('应该处理注册错误', async () => {
      const mockFastify = {
        register: jest.fn().mockRejectedValue(new Error('Registration failed')),
      };

      await expect(plugin.register(mockFastify as any)).rejects.toThrow(
        'Registration failed'
      );
    });
  });

  describe('插件卸载', () => {
    beforeEach(() => {
      plugin = new CorsPlugin(mockConfig);
    });

    it('应该能够卸载插件', async () => {
      const mockFastify = {
        register: jest.fn().mockResolvedValue(undefined),
      };

      await expect(
        plugin.unregister(mockFastify as any)
      ).resolves.not.toThrow();
    });
  });

  describe('健康检查', () => {
    beforeEach(() => {
      plugin = new CorsPlugin(mockConfig);
    });

    it('应该返回健康状态', async () => {
      const status = await plugin.getStatus();

      expect(status).toBeDefined();
      expect(status.name).toBe('cors');
      expect(status.isRegistered).toBeDefined();
      expect(status.isHealthy).toBeDefined();
    });

    it('应该执行健康检查', async () => {
      const isHealthy = await plugin.healthCheck();
      expect(typeof isHealthy).toBe('boolean');
    });
  });

  describe('CORS配置验证', () => {
    beforeEach(() => {
      plugin = new CorsPlugin(mockConfig);
    });

    it('应该验证源域名', () => {
      expect(plugin.isOriginAllowed('https://example.com')).toBe(true);
      expect(plugin.isOriginAllowed('https://test.com')).toBe(true);
    });

    it('应该验证HTTP方法', () => {
      expect(plugin.isMethodAllowed('GET')).toBe(true);
      expect(plugin.isMethodAllowed('POST')).toBe(true);
      expect(plugin.isMethodAllowed('PUT')).toBe(true);
      expect(plugin.isMethodAllowed('DELETE')).toBe(true);
      expect(plugin.isMethodAllowed('OPTIONS')).toBe(true);
    });

    it('应该验证请求头', () => {
      expect(plugin.isHeaderAllowed('Content-Type')).toBe(true);
      expect(plugin.isHeaderAllowed('Authorization')).toBe(true);
    });
  });

  describe('配置获取', () => {
    beforeEach(() => {
      plugin = new CorsPlugin(mockConfig);
    });

    it('应该返回CORS配置', () => {
      const config = plugin.getCorsConfig();

      expect(config).toBeDefined();
      expect(config.name).toBe('cors');
      expect(config.origin).toBe(true);
      expect(config.methods).toEqual([
        'GET',
        'POST',
        'PUT',
        'DELETE',
        'OPTIONS',
      ]);
    });
  });
});

describe('createCorsPlugin', () => {
  it('应该创建CORS插件', () => {
    const plugin = createCorsPlugin({
      origin: true,
      credentials: true,
    });

    expect(plugin).toBeInstanceOf(CorsPlugin);
    expect(plugin.name).toBe('cors');
  });

  it('应该使用默认配置', () => {
    const plugin = createCorsPlugin();

    expect(plugin).toBeInstanceOf(CorsPlugin);
    expect(plugin.name).toBe('cors');
  });
});

describe('DefaultCorsConfigs', () => {
  it('应该包含开发环境配置', () => {
    expect(DefaultCorsConfigs.development).toBeDefined();
    expect(DefaultCorsConfigs.development.origin).toBe(true);
    expect(DefaultCorsConfigs.development.credentials).toBe(true);
  });

  it('应该包含生产环境配置', () => {
    expect(DefaultCorsConfigs.production).toBeDefined();
    expect(Array.isArray(DefaultCorsConfigs.production.origin)).toBe(true);
    expect(DefaultCorsConfigs.production.credentials).toBe(true);
  });

  it('应该包含API服务配置', () => {
    expect(DefaultCorsConfigs.apiService).toBeDefined();
    expect(typeof DefaultCorsConfigs.apiService.origin).toBe('function');
    expect(DefaultCorsConfigs.apiService.credentials).toBe(true);
  });
});
