/**
 * Shared Types 单元测试
 *
 * @description 测试通用类型定义的正确性和类型安全性
 *
 * @since 1.0.0
 */

import { DeepPartial, Type, ApplicationPluginConfig } from './shared-types';

describe('Shared Types', () => {
  describe('DeepPartial<T>', () => {
    interface SimpleConfig {
      name: string;
      value: number;
      enabled: boolean;
    }

    interface NestedConfig {
      user: {
        id: string;
        profile: {
          name: string;
          email: string;
        };
      };
      settings: {
        theme: string;
        notifications: boolean;
      };
    }

    interface ArrayConfig {
      items: string[];
      users: {
        id: string;
        name: string;
      }[];
      metadata: {
        total: number;
        page: number;
      };
    }

    interface ReadonlyArrayConfig {
      readonly items: readonly string[];
      readonly users: readonly {
        id: string;
        name: string;
      }[];
    }

    it('应该使简单对象的所有属性可选', () => {
      const partial: DeepPartial<SimpleConfig> = {
        name: 'test',
        // value 和 enabled 是可选的
      };

      expect(partial.name).toBe('test');
      expect(partial.value).toBeUndefined();
      expect(partial.enabled).toBeUndefined();
    });

    it('应该使嵌套对象的所有属性可选', () => {
      const partial: DeepPartial<NestedConfig> = {
        user: {
          id: '123',
          // profile 是可选的
        },
        // settings 是可选的
      };

      expect(partial.user?.id).toBe('123');
      expect(partial.user?.profile).toBeUndefined();
      expect(partial.settings).toBeUndefined();
    });

    it('应该使深度嵌套对象的所有属性可选', () => {
      const partial: DeepPartial<NestedConfig> = {
        user: {
          id: '123',
          profile: {
            name: 'John Doe',
            // email 是可选的
          },
        },
      };

      expect(partial.user?.profile?.name).toBe('John Doe');
      expect(partial.user?.profile?.email).toBeUndefined();
    });

    it('应该处理数组类型', () => {
      const partial: DeepPartial<ArrayConfig> = {
        items: ['item1'],
        users: [
          {
            id: '1',
            // name 是可选的
          },
        ],
        // metadata 是可选的
      };

      expect(partial.items?.[0]).toBe('item1');
      expect(partial.users?.[0]?.id).toBe('1');
      expect(partial.users?.[0]?.name).toBeUndefined();
      expect(partial.metadata).toBeUndefined();
    });

    it('应该处理只读数组类型', () => {
      const partial: DeepPartial<ReadonlyArrayConfig> = {
        items: ['item1'] as readonly string[],
        users: [
          {
            id: '1',
            // name 是可选的
          },
        ] as readonly { id: string; name?: string }[],
      };

      expect(partial.items?.[0]).toBe('item1');
      expect(partial.users?.[0]?.id).toBe('1');
      expect(partial.users?.[0]?.name).toBeUndefined();
    });

    it('应该允许完全空的对象', () => {
      const partial: DeepPartial<SimpleConfig> = {};

      expect(partial.name).toBeUndefined();
      expect(partial.value).toBeUndefined();
      expect(partial.enabled).toBeUndefined();
    });

    it('应该支持部分更新场景', () => {
      const original: SimpleConfig = {
        name: 'original',
        value: 100,
        enabled: true,
      };

      const update: DeepPartial<SimpleConfig> = {
        value: 200,
        // 只更新部分属性
      };

      const merged = { ...original, ...update };

      expect(merged.name).toBe('original');
      expect(merged.value).toBe(200);
      expect(merged.enabled).toBe(true);
    });
  });

  describe('Type<T>', () => {
    class TestService {
      constructor(public config: any) {}

      getValue(): string {
        return 'test value';
      }
    }

    class UserService {
      constructor(public name: string, public age: number) {}

      getUserInfo(): string {
        return `${this.name} (${this.age})`;
      }
    }

    it('应该正确表示构造函数类型', () => {
      const ServiceType: Type<TestService> = TestService;
      const service = new ServiceType({ database: 'postgres' });

      expect(service).toBeInstanceOf(TestService);
      expect(service.getValue()).toBe('test value');
      expect(service.config).toEqual({ database: 'postgres' });
    });

    it('应该支持泛型类型参数', () => {
      const UserServiceType: Type<UserService> = UserService;
      const userService = new UserServiceType('John Doe', 30);

      expect(userService).toBeInstanceOf(UserService);
      expect(userService.getUserInfo()).toBe('John Doe (30)');
      expect(userService.name).toBe('John Doe');
      expect(userService.age).toBe(30);
    });

    it('应该支持依赖注入容器模式', () => {
      class Container {
        private instances = new Map<Type<any>, any>();

        register<T>(type: Type<T>, factory: () => T): void {
          this.instances.set(type, factory());
        }

        get<T>(type: Type<T>): T {
          return this.instances.get(type);
        }
      }

      const container = new Container();
      const ServiceType: Type<TestService> = TestService;

      container.register(
        ServiceType,
        () => new ServiceType({ config: 'test' })
      );
      const service = container.get(ServiceType);

      expect(service).toBeInstanceOf(TestService);
      expect(service.config).toEqual({ config: 'test' });
    });

    it('应该支持工厂模式', () => {
      function createService<T>(ServiceClass: Type<T>, ...args: any[]): T {
        return new ServiceClass(...args);
      }

      const service1 = createService(TestService, { database: 'mysql' });
      const service2 = createService(UserService, 'Jane Doe', 25);

      expect(service1).toBeInstanceOf(TestService);
      expect(service2).toBeInstanceOf(UserService);
      expect(service2.getUserInfo()).toBe('Jane Doe (25)');
    });

    it('应该支持类型推断', () => {
      function getServiceType(): Type<TestService> {
        return TestService;
      }

      const ServiceType = getServiceType();
      const service = new ServiceType({ redis: true });

      expect(service).toBeInstanceOf(TestService);
      expect(service.config).toEqual({ redis: true });
    });
  });

  describe('ApplicationPluginConfig', () => {
    it('应该支持完整的配置对象', () => {
      const config: ApplicationPluginConfig = {
        api: {
          port: 3000,
          host: 'localhost',
          baseUrl: 'http://localhost:3000',
          clientBaseUrl: 'http://localhost:3001',
          production: false,
          envName: 'development',
        },
        database: {
          mikroOrm: {
            type: 'postgresql',
            host: 'localhost',
            port: 5432,
            database: 'hl8_saas',
            username: 'postgres',
            password: 'password',
          },
        },
        auth: {
          jwtSecret: 'your-jwt-secret',
          jwtExpirationTime: 3600,
          jwtRefreshSecret: 'your-refresh-secret',
          jwtRefreshExpirationTime: 86400,
          passwordSaltRounds: 12,
        },
        assets: {
          assetPath: './assets',
          assetPublicPath: '/assets',
        },
        logging: {
          level: 'info',
          enableRequestLogging: true,
          enableResponseLogging: true,
        },
        features: {
          multiTenant: true,
          userRegistration: true,
          emailPasswordLogin: true,
          magicLogin: false,
        },
      };

      expect(config.api?.port).toBe(3000);
      expect(config.database?.mikroOrm?.type).toBe('postgresql');
      expect(config.auth?.jwtSecret).toBe('your-jwt-secret');
      expect(config.assets?.assetPath).toBe('./assets');
      expect(config.logging?.level).toBe('info');
      expect(config.features?.multiTenant).toBe(true);
    });

    it('应该支持最小配置对象', () => {
      const config: ApplicationPluginConfig = {};

      expect(config.api).toBeUndefined();
      expect(config.database).toBeUndefined();
      expect(config.auth).toBeUndefined();
      expect(config.assets).toBeUndefined();
      expect(config.logging).toBeUndefined();
      expect(config.features).toBeUndefined();
    });

    it('应该支持部分配置对象', () => {
      const config: ApplicationPluginConfig = {
        api: {
          port: 8080,
          production: true,
        },
        features: {
          multiTenant: false,
        },
      };

      expect(config.api?.port).toBe(8080);
      expect(config.api?.production).toBe(true);
      expect(config.api?.host).toBeUndefined();
      expect(config.features?.multiTenant).toBe(false);
      expect(config.features?.userRegistration).toBeUndefined();
    });

    it('应该支持API配置', () => {
      const apiConfig: ApplicationPluginConfig['api'] = {
        port: 3000,
        host: '0.0.0.0',
        baseUrl: 'https://api.example.com',
        clientBaseUrl: 'https://app.example.com',
        production: true,
        envName: 'production',
      };

      expect(apiConfig.port).toBe(3000);
      expect(apiConfig.host).toBe('0.0.0.0');
      expect(apiConfig.baseUrl).toBe('https://api.example.com');
      expect(apiConfig.clientBaseUrl).toBe('https://app.example.com');
      expect(apiConfig.production).toBe(true);
      expect(apiConfig.envName).toBe('production');
    });

    it('应该支持数据库配置', () => {
      const dbConfig: ApplicationPluginConfig['database'] = {
        mikroOrm: {
          type: 'mysql',
          host: 'db.example.com',
          port: 3306,
          database: 'production_db',
          username: 'admin',
          password: 'secure_password',
        },
      };

      expect(dbConfig.mikroOrm?.type).toBe('mysql');
      expect(dbConfig.mikroOrm?.host).toBe('db.example.com');
      expect(dbConfig.mikroOrm?.port).toBe(3306);
      expect(dbConfig.mikroOrm?.database).toBe('production_db');
      expect(dbConfig.mikroOrm?.username).toBe('admin');
      expect(dbConfig.mikroOrm?.password).toBe('secure_password');
    });

    it('应该支持认证配置', () => {
      const authConfig: ApplicationPluginConfig['auth'] = {
        jwtSecret: 'super-secret-key',
        jwtExpirationTime: 7200,
        jwtRefreshSecret: 'refresh-secret-key',
        jwtRefreshExpirationTime: 172800,
        passwordSaltRounds: 14,
      };

      expect(authConfig.jwtSecret).toBe('super-secret-key');
      expect(authConfig.jwtExpirationTime).toBe(7200);
      expect(authConfig.jwtRefreshSecret).toBe('refresh-secret-key');
      expect(authConfig.jwtRefreshExpirationTime).toBe(172800);
      expect(authConfig.passwordSaltRounds).toBe(14);
    });

    it('应该支持资源文件配置', () => {
      const assetsConfig: ApplicationPluginConfig['assets'] = {
        assetPath: '/var/www/assets',
        assetPublicPath: '/static',
      };

      expect(assetsConfig.assetPath).toBe('/var/www/assets');
      expect(assetsConfig.assetPublicPath).toBe('/static');
    });

    it('应该支持日志配置', () => {
      const loggingConfig: ApplicationPluginConfig['logging'] = {
        level: 'debug',
        enableRequestLogging: true,
        enableResponseLogging: false,
      };

      expect(loggingConfig.level).toBe('debug');
      expect(loggingConfig.enableRequestLogging).toBe(true);
      expect(loggingConfig.enableResponseLogging).toBe(false);
    });

    it('应该支持功能开关配置', () => {
      const featuresConfig: ApplicationPluginConfig['features'] = {
        multiTenant: true,
        userRegistration: false,
        emailPasswordLogin: true,
        magicLogin: true,
      };

      expect(featuresConfig.multiTenant).toBe(true);
      expect(featuresConfig.userRegistration).toBe(false);
      expect(featuresConfig.emailPasswordLogin).toBe(true);
      expect(featuresConfig.magicLogin).toBe(true);
    });

    it('应该支持配置合并场景', () => {
      const defaultConfig: ApplicationPluginConfig = {
        api: {
          port: 3000,
          host: 'localhost',
          production: false,
        },
        features: {
          multiTenant: false,
          userRegistration: true,
        },
      };

      const overrideConfig: ApplicationPluginConfig = {
        api: {
          port: 8080,
          production: true,
        },
        features: {
          multiTenant: true,
        },
      };

      const mergedConfig: ApplicationPluginConfig = {
        api: {
          ...defaultConfig.api,
          ...overrideConfig.api,
        },
        features: {
          ...defaultConfig.features,
          ...overrideConfig.features,
        },
      };

      expect(mergedConfig.api?.port).toBe(8080);
      expect(mergedConfig.api?.host).toBe('localhost');
      expect(mergedConfig.api?.production).toBe(true);
      expect(mergedConfig.features?.multiTenant).toBe(true);
      expect(mergedConfig.features?.userRegistration).toBe(true);
    });
  });

  describe('类型安全性测试', () => {
    it('应该确保DeepPartial类型安全', () => {
      interface StrictConfig {
        required: string;
        optional?: number;
      }

      // 这应该编译通过
      const partial: DeepPartial<StrictConfig> = {
        required: 'test',
      };

      // 这应该编译通过 - 所有属性都是可选的
      const empty: DeepPartial<StrictConfig> = {};

      expect(partial.required).toBe('test');
      expect(empty.required).toBeUndefined();
    });

    it('应该确保Type接口类型安全', () => {
      class StringService {
        constructor(public value: string) {}
      }

      class NumberService {
        constructor(public value: number) {}
      }

      const StringServiceType: Type<StringService> = StringService;
      const NumberServiceType: Type<NumberService> = NumberService;

      const stringService = new StringServiceType('hello');
      const numberService = new NumberServiceType(42);

      expect(stringService.value).toBe('hello');
      expect(numberService.value).toBe(42);
    });

    it('应该确保ApplicationPluginConfig类型安全', () => {
      const config: ApplicationPluginConfig = {
        api: {
          port: 3000,
          // 其他属性都是可选的
        },
        // 其他配置块都是可选的
      };

      expect(config.api?.port).toBe(3000);
      expect(config.database).toBeUndefined();
    });
  });
});
