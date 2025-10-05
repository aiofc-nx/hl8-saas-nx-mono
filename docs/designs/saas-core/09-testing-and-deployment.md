# SAAS-CORE 测试策略与部署运维

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/saas-core

---

## 📋 目录

- [1. 测试策略](#1-测试策略)
- [2. 单元测试](#2-单元测试)
- [3. 集成测试](#3-集成测试)
- [4. 端到端测试](#4-端到端测试)
- [5. 性能测试](#5-性能测试)
- [6. 部署策略](#6-部署策略)
- [7. 监控和运维](#7-监控和运维)
- [8. 代码示例](#8-代码示例)

---

## 1. 测试策略

### 1.1 测试金字塔

```text
测试金字塔
├── E2E测试 (端到端测试) - 少量
│   ├── 关键业务流程
│   └── 用户场景
├── 集成测试 - 适中
│   ├── API集成
│   ├── 数据库集成
│   └── 外部服务集成
└── 单元测试 - 大量
    ├── 领域层测试
    ├── 应用层测试
    ├── 基础设施层测试
    └── 工具类测试
```

### 1.2 测试覆盖率目标

- **单元测试**: 90%+
- **集成测试**: 80%+
- **端到端测试**: 70%+
- **整体覆盖率**: 85%+

---

## 2. 单元测试

### 2.1 领域层测试

```typescript
// src/domain/tenant/entities/tenant.entity.spec.ts
describe('Tenant Entity', () => {
  let tenant: Tenant;
  let tenantId: TenantId;

  beforeEach(() => {
    tenantId = TenantId.generate();
    tenant = new Tenant(
      tenantId,
      'test-tenant',
      'Test Tenant',
      TENANT_TYPES.BASIC,
      TENANT_STATUS.PENDING,
      'admin-123',
      TenantConfig.create({
        features: ['basic_features'],
        theme: 'default',
        branding: {},
        settings: {}
      }),
      ResourceLimits.create({
        maxUsers: 100,
        maxStorage: 10,
        maxOrganizations: 5,
        maxDepartments: 20,
        maxApiCalls: 10000,
        maxDataTransfer: 100
      })
    );
  });

  describe('activate', () => {
    it('应该成功激活待激活状态的租户', () => {
      // Act
      tenant.activate();

      // Assert
      expect(tenant.getStatus()).toBe(TENANT_STATUS.ACTIVE);
      expect(tenant.getUpdatedAt()).toBeDefined();
    });

    it('应该抛出异常当尝试激活非待激活状态的租户', () => {
      // Arrange
      tenant.activate(); // 先激活
      
      // Act & Assert
      expect(() => tenant.activate()).toThrow(TenantNotPendingException);
    });
  });

  describe('canUseFeature', () => {
    it('应该返回true当租户有该功能权限', () => {
      // Act & Assert
      expect(tenant.canUseFeature('basic_features')).toBe(true);
    });

    it('应该返回false当租户没有该功能权限', () => {
      // Act & Assert
      expect(tenant.canUseFeature('advanced_features')).toBe(false);
    });
  });

  describe('isResourceLimitExceeded', () => {
    it('应该返回true当资源使用量超过限制', () => {
      // Act & Assert
      expect(tenant.isResourceLimitExceeded('maxUsers', 100)).toBe(true);
    });

    it('应该返回false当资源使用量未超过限制', () => {
      // Act & Assert
      expect(tenant.isResourceLimitExceeded('maxUsers', 50)).toBe(false);
    });

    it('应该返回false当资源无限制', () => {
      // Arrange
      const unlimitedTenant = new Tenant(
        tenantId,
        'unlimited-tenant',
        'Unlimited Tenant',
        TENANT_TYPES.ENTERPRISE,
        TENANT_STATUS.ACTIVE,
        'admin-456',
        TenantConfig.create({
          features: ['all_features'],
          theme: 'default',
          branding: {},
          settings: {}
        }),
        ResourceLimits.create({
          maxUsers: -1, // 无限制
          maxStorage: -1,
          maxOrganizations: -1,
          maxDepartments: -1,
          maxApiCalls: -1,
          maxDataTransfer: -1
        })
      );

      // Act & Assert
      expect(unlimitedTenant.isResourceLimitExceeded('maxUsers', 1000)).toBe(false);
    });
  });
});
```

### 2.2 应用层测试

```typescript
// src/application/use-cases/create-tenant.use-case.spec.ts
describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;
  let mockTenantRepository: jest.Mocked<ITenantRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockTenantDomainService: jest.Mocked<TenantDomainService>;

  beforeEach(() => {
    mockTenantRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCode: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn()
    };

    mockEventBus = {
      publishAll: jest.fn()
    };

    mockTenantDomainService = {
      validateTenantCodeUniqueness: jest.fn()
    };

    useCase = new CreateTenantUseCase(
      mockTenantRepository,
      mockEventBus,
      mockTenantDomainService
    );
  });

  describe('execute', () => {
    it('应该成功创建租户', async () => {
      // Arrange
      const request = new CreateTenantRequest(
        'test-tenant',
        'Test Tenant',
        TENANT_TYPES.BASIC,
        'admin-123',
        'admin@test.com',
        'Admin User'
      );

      mockTenantDomainService.validateTenantCodeUniqueness.mockResolvedValue(true);
      mockTenantRepository.save.mockResolvedValue();

      // Act
      const response = await useCase.execute(request);

      // Assert
      expect(response.tenantId).toBeDefined();
      expect(response.code).toBe('test-tenant');
      expect(response.name).toBe('Test Tenant');
      expect(mockTenantRepository.save).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('应该抛出异常当租户代码已存在', async () => {
      // Arrange
      const request = new CreateTenantRequest(
        'existing-tenant',
        'Existing Tenant',
        TENANT_TYPES.BASIC,
        'admin-123',
        'admin@test.com',
        'Admin User'
      );

      mockTenantDomainService.validateTenantCodeUniqueness.mockResolvedValue(false);

      // Act & Assert
      await expect(useCase.execute(request)).rejects.toThrow(TenantCodeAlreadyExistsException);
      expect(mockTenantRepository.save).not.toHaveBeenCalled();
      expect(mockEventBus.publishAll).not.toHaveBeenCalled();
    });
  });
});
```

---

## 3. 集成测试

### 3.1 API集成测试

```typescript
// test/integration/tenant.integration.spec.ts
describe('Tenant API Integration', () => {
  let app: INestApplication;
  let tenantRepository: ITenantRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SaasCoreModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    tenantRepository = moduleFixture.get<ITenantRepository>(ITenantRepository);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // 清理测试数据
    await tenantRepository.deleteAll();
  });

  describe('POST /tenants', () => {
    it('应该成功创建租户', async () => {
      // Arrange
      const createTenantDto = {
        code: 'test-tenant',
        name: 'Test Tenant',
        type: TENANT_TYPES.BASIC,
        adminId: 'admin-123',
        adminEmail: 'admin@test.com',
        adminName: 'Admin User'
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/tenants')
        .send(createTenantDto)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        tenantId: expect.any(String),
        code: 'test-tenant',
        name: 'Test Tenant'
      });

      // 验证数据库中的数据
      const tenant = await tenantRepository.findByCode('test-tenant');
      expect(tenant).toBeDefined();
      expect(tenant.getTenant().getCode()).toBe('test-tenant');
    });

    it('应该返回400当请求数据无效', async () => {
      // Arrange
      const invalidDto = {
        code: '', // 无效的代码
        name: 'Test Tenant',
        type: TENANT_TYPES.BASIC
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post('/tenants')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /tenants/:id', () => {
    it('应该成功获取租户信息', async () => {
      // Arrange
      const tenantId = TenantId.generate();
      const tenantAggregate = TenantAggregate.create(
        tenantId,
        'test-tenant',
        'Test Tenant',
        TENANT_TYPES.BASIC,
        'admin-123'
      );
      await tenantRepository.save(tenantAggregate);

      // Act
      const response = await request(app.getHttpServer())
        .get(`/tenants/${tenantId.getValue()}`)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        tenantId: tenantId.getValue(),
        code: 'test-tenant',
        name: 'Test Tenant',
        type: TENANT_TYPES.BASIC,
        status: TENANT_STATUS.PENDING
      });
    });

    it('应该返回404当租户不存在', async () => {
      // Arrange
      const nonExistentId = 'non-existent-id';

      // Act & Assert
      await request(app.getHttpServer())
        .get(`/tenants/${nonExistentId}`)
        .expect(404);
    });
  });
});
```

### 3.2 数据库集成测试

```typescript
// test/integration/database.integration.spec.ts
describe('Database Integration', () => {
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = new DataSource({
      type: 'postgres',
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      username: process.env.TEST_DB_USERNAME || 'test',
      password: process.env.TEST_DB_PASSWORD || 'test',
      database: process.env.TEST_DB_DATABASE || 'test_saas_core',
      entities: [TenantEntity, UserEntity, EventEntity],
      synchronize: true,
      dropSchema: true
    });

    await dataSource.initialize();
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // 清理测试数据
    await dataSource.query('TRUNCATE TABLE tenants, users, events RESTART IDENTITY CASCADE');
  });

  describe('TenantEntity', () => {
    it('应该成功保存和查询租户', async () => {
      // Arrange
      const tenantEntity = new TenantEntity({
        id: 'tenant-123',
        code: 'test-tenant',
        name: 'Test Tenant',
        type: TENANT_TYPES.BASIC,
        status: TENANT_STATUS.PENDING,
        adminId: 'admin-123',
        config: { features: ['basic_features'] },
        resourceLimits: { maxUsers: 100 },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const savedEntity = await dataSource.manager.save(TenantEntity, tenantEntity);
      const retrievedEntity = await dataSource.manager.findOne(TenantEntity, {
        where: { id: 'tenant-123' }
      });

      // Assert
      expect(savedEntity).toBeDefined();
      expect(retrievedEntity).toBeDefined();
      expect(retrievedEntity.code).toBe('test-tenant');
      expect(retrievedEntity.type).toBe(TENANT_TYPES.BASIC);
    });

    it('应该支持事务操作', async () => {
      // Arrange
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Act
        const tenant1 = new TenantEntity({
          id: 'tenant-1',
          code: 'tenant-1',
          name: 'Tenant 1',
          type: TENANT_TYPES.BASIC,
          status: TENANT_STATUS.PENDING,
          adminId: 'admin-1',
          config: {},
          resourceLimits: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });

        const tenant2 = new TenantEntity({
          id: 'tenant-2',
          code: 'tenant-2',
          name: 'Tenant 2',
          type: TENANT_TYPES.BASIC,
          status: TENANT_STATUS.PENDING,
          adminId: 'admin-2',
          config: {},
          resourceLimits: {},
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await queryRunner.manager.save(TenantEntity, [tenant1, tenant2]);
        await queryRunner.commitTransaction();

        // Assert
        const count = await dataSource.manager.count(TenantEntity);
        expect(count).toBe(2);

      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    });
  });
});
```

---

## 4. 端到端测试

### 4.1 用户注册流程测试

```typescript
// test/e2e/user-registration.e2e.spec.ts
describe('User Registration E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [SaasCoreModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('应该完成完整的用户注册流程', async () => {
    // 1. 用户注册
    const registerResponse = await request(app.getHttpServer())
      .post('/users/register')
      .send({
        email: 'test@example.com',
        username: 'testuser',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        timezone: 'UTC',
        locale: 'en'
      })
      .expect(201);

    expect(registerResponse.body).toMatchObject({
      userId: expect.any(String),
      email: 'test@example.com',
      username: 'testuser'
    });

    const userId = registerResponse.body.userId;

    // 2. 激活用户
    await request(app.getHttpServer())
      .post(`/users/${userId}/activate`)
      .expect(200);

    // 3. 用户认证
    const authResponse = await request(app.getHttpServer())
      .post('/users/authenticate')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!'
      })
      .expect(200);

    expect(authResponse.body).toMatchObject({
      userId: userId,
      email: 'test@example.com',
      username: 'testuser',
      status: 'ACTIVE'
    });

    // 4. 获取用户信息
    const userResponse = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(200);

    expect(userResponse.body).toMatchObject({
      userId: userId,
      email: 'test@example.com',
      username: 'testuser',
      status: 'ACTIVE'
    });
  });
});
```

---

## 5. 性能测试

### 5.1 负载测试配置

```typescript
// test/performance/load-test.config.ts
export const loadTestConfig = {
  scenarios: {
    tenant_creation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 }, // 2分钟内增加到100个用户
        { duration: '5m', target: 100 }, // 保持100个用户5分钟
        { duration: '2m', target: 200 }, // 2分钟内增加到200个用户
        { duration: '5m', target: 200 }, // 保持200个用户5分钟
        { duration: '2m', target: 0 },   // 2分钟内减少到0个用户
      ],
      exec: 'tenantCreationScenario'
    },
    user_registration: {
      executor: 'constant-vus',
      vus: 50,
      duration: '10m',
      exec: 'userRegistrationScenario'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95%的请求在500ms内完成
    http_req_failed: ['rate<0.1'],    // 错误率低于10%
    http_reqs: ['rate>10']            // 每秒至少10个请求
  }
};
```

---

## 6. 部署策略

### 6.1 Docker配置

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 6.2 Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  saas-core:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    networks:
      - saas-network

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=saas_core
      - POSTGRES_USER=saas_user
      - POSTGRES_PASSWORD=saas_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - saas-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - saas-network

volumes:
  postgres_data:
  redis_data:

networks:
  saas-network:
    driver: bridge
```

---

## 7. 监控和运维

### 7.1 健康检查

```typescript
// src/infrastructure/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.redis.pingCheck('redis'),
      () => this.checkCustomHealth()
    ]);
  }

  private checkCustomHealth(): Promise<HealthIndicatorResult> {
    // 自定义健康检查逻辑
    return Promise.resolve({
      status: 'up',
      info: {
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      }
    });
  }
}
```

### 7.2 监控指标

```typescript
// src/infrastructure/monitoring/metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly activeConnections: Gauge<string>;
  private readonly tenantCount: Gauge<string>;

  constructor() {
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code']
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections'
    });

    this.tenantCount = new Gauge({
      name: 'tenant_count',
      help: 'Total number of tenants'
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration
      .labels(method, route, statusCode.toString())
      .observe(duration);

    this.httpRequestTotal
      .labels(method, route, statusCode.toString())
      .inc();
  }

  setActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  setTenantCount(count: number): void {
    this.tenantCount.set(count);
  }
}
```

---

## 8. 代码示例

### 8.1 完整的测试配置

```typescript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/index.ts'
  ],
  coverageDirectory: '../coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  globalSetup: '<rootDir>/../test/global-setup.ts',
  globalTeardown: '<rootDir>/../test/global-teardown.ts'
};
```

---

## 📚 相关文档

- [项目概述与架构设计](./01-overview-and-architecture.md)
- [技术栈选择与依赖管理](./02-tech-stack-and-dependencies.md)
- [项目结构与模块职责](./03-project-structure.md)
- [领域层开发指南](./04-domain-layer-development.md)
- [应用层开发指南](./05-application-layer-development.md)
- [基础设施层开发指南](./06-infrastructure-layer-development.md)
- [接口层开发指南](./07-interface-layer-development.md)
- [业务功能模块开发](./08-business-modules.md)
- [最佳实践与常见问题](./10-best-practices-and-faq.md)
