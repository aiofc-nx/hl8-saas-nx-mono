/**
 * 基础测试
 *
 * @description 测试配置模块的基本功能
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import { TypedConfigModule } from '../lib/typed-config.module';

describe('配置模块基础测试', () => {
  describe('基本功能', () => {
    it('应该创建配置模块', () => {
      const configModule = TypedConfigModule.forRoot({
        schema: Object,
        load: () => ({ name: 'Test App', version: '1.0.0' }),
      });

      expect(configModule).toBeDefined();
      expect(configModule.module).toBe(TypedConfigModule);
      expect(configModule.global).toBe(true);
      expect(configModule.providers).toBeDefined();
      expect(configModule.exports).toBeDefined();
    });

    it('应该支持自定义配置加载器', () => {
      const customLoader = jest.fn().mockReturnValue({ name: 'Test App' });

      const configModule = TypedConfigModule.forRoot({
        schema: Object,
        load: customLoader,
      });

      expect(configModule).toBeDefined();
      expect(customLoader).toHaveBeenCalled();
    });

    it('应该支持配置标准化', () => {
      const normalize = jest.fn().mockImplementation((config) => ({
        ...config,
        normalized: true,
      }));

      const configModule = TypedConfigModule.forRoot({
        schema: Object,
        load: () => ({ name: 'Test App' }),
        normalize,
      });

      expect(configModule).toBeDefined();
    });

    it('应该支持缓存选项', () => {
      const configModule = TypedConfigModule.forRoot({
        schema: Object,
        load: () => ({ name: 'Test App' }),
        cacheOptions: {
          strategy: 'memory' as any,
          ttl: 300000,
          enabled: true,
        },
      });

      expect(configModule).toBeDefined();
      expect(configModule.providers).toHaveLength(2); // Config + CacheManager
    });
  });

  describe('错误处理', () => {
    it('应该处理无效配置', () => {
      expect(() => {
        TypedConfigModule.forRoot({
          schema: Object,
          load: () => 'invalid config' as any,
        });
      }).toThrow();
    });
  });
});
