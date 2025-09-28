/**
 * 环境变量加载器测试
 *
 * @description 测试环境变量加载器的功能
 * @author HL8 SAAS Platform Team
 * @since 1.0.0
 */

import { dotenvLoader } from '../../lib/loader/dotenv.loader';
import { createTestEnvVars, testAssertions } from '../test-utils';

describe('dotenvLoader', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('基本功能', () => {
    it('应该加载环境变量', () => {
      const envVars = createTestEnvVars();
      Object.assign(process.env, envVars);

      const loader = dotenvLoader();
      const config = loader();

      expect(config).toBeDefined();
      expect(config.APP__NAME).toBe('Test App');
      expect(config.APP__VERSION).toBe('1.0.0');
      expect(config.APP__PORT).toBe('3000');
    });

    it('应该支持自定义选项', () => {
      const envVars = createTestEnvVars();
      Object.assign(process.env, envVars);

      const loader = dotenvLoader({
        separator: '__',
        keyTransformer: (key) => key.toLowerCase(),
        enableExpandVariables: false,
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config['app__name']).toBe('Test App');
    });

    it('应该忽略环境变量文件', () => {
      const loader = dotenvLoader({
        ignoreEnvFile: true,
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(Object.keys(config).length).toBeGreaterThan(0);
    });

    it('应该忽略环境变量', () => {
      const loader = dotenvLoader({
        ignoreEnvVars: true,
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(Object.keys(config).length).toBe(0);
    });
  });

  describe('分隔符解析', () => {
    it('应该使用分隔符解析嵌套配置', () => {
      const envVars = createTestEnvVars();
      Object.assign(process.env, envVars);

      const loader = dotenvLoader({
        separator: '__',
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config.APP).toBeDefined();
      expect(config.APP.NAME).toBe('Test App');
      expect(config.APP.VERSION).toBe('1.0.0');
      expect(config.APP.PORT).toBe('3000');
      expect(config.APP.DATABASE).toBeDefined();
      expect(config.APP.DATABASE.HOST).toBe('localhost');
      expect(config.APP.DATABASE.PORT).toBe('5432');
    });

    it('应该处理不同的分隔符', () => {
      process.env['TEST_DOT_NAME'] = 'Test App';
      process.env['TEST_DOT_VERSION'] = '1.0.0';

      const loader = dotenvLoader({
        separator: '_DOT_',
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config.TEST).toBeDefined();
      expect(config.TEST.NAME).toBe('Test App');
      expect(config.TEST.VERSION).toBe('1.0.0');
    });
  });

  describe('键转换', () => {
    it('应该转换键格式', () => {
      const envVars = createTestEnvVars();
      Object.assign(process.env, envVars);

      const loader = dotenvLoader({
        keyTransformer: (key) => key.toLowerCase().replace(/_/g, '-'),
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config['app-name']).toBe('Test App');
      expect(config['app-version']).toBe('1.0.0');
    });

    it('应该处理复杂的键转换', () => {
      process.env['MY_APP_CONFIG'] = 'test';

      const loader = dotenvLoader({
        keyTransformer: (key) =>
          key
            .split('_')
            .map(
              (part) =>
                part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            )
            .join(''),
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config.MyAppConfig).toBe('test');
    });
  });

  describe('变量展开', () => {
    it('应该展开环境变量引用', () => {
      process.env['BASE_URL'] = 'https://api.example.com';
      process.env['API_URL'] = '${BASE_URL}/v1';
      process.env['DB_HOST'] = 'localhost';
      process.env['DB_PORT'] = '5432';
      process.env['DB_URL'] =
        'postgresql://user:pass@${DB_HOST}:${DB_PORT}/mydb';

      const loader = dotenvLoader({
        enableExpandVariables: true,
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config.API_URL).toBe('https://api.example.com/v1');
      expect(config.DB_URL).toBe('postgresql://user:pass@localhost:5432/mydb');
    });

    it('应该处理默认值语法', () => {
      process.env['OPTIONAL_VAR'] = '${MISSING_VAR:-default_value}';

      const loader = dotenvLoader({
        enableExpandVariables: true,
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config.OPTIONAL_VAR).toBe('default_value');
    });

    it('应该禁用变量展开', () => {
      process.env['API_URL'] = '${BASE_URL}/v1';

      const loader = dotenvLoader({
        enableExpandVariables: false,
      });
      const config = loader();

      expect(config).toBeDefined();
      expect(config.API_URL).toBe('${BASE_URL}/v1');
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的环境变量文件路径', () => {
      const loader = dotenvLoader({
        envFilePath: '/nonexistent/path/.env',
      });

      expect(() => loader()).toThrow();
    });

    it('应该处理变量展开错误', () => {
      process.env['INVALID_REF'] = '${UNCLOSED_VAR';

      const loader = dotenvLoader({
        enableExpandVariables: true,
      });

      expect(() => loader()).toThrow();
    });
  });

  describe('性能测试', () => {
    it('应该高效处理大量环境变量', () => {
      // 创建大量环境变量
      for (let i = 0; i < 1000; i++) {
        process.env[`TEST_VAR_${i}`] = `value_${i}`;
      }

      const loader = dotenvLoader();
      const startTime = Date.now();
      const config = loader();
      const endTime = Date.now();

      expect(config).toBeDefined();
      expect(Object.keys(config).length).toBeGreaterThan(1000);
      expect(endTime - startTime).toBeLessThan(100); // 应该在100ms内完成
    });
  });
});
