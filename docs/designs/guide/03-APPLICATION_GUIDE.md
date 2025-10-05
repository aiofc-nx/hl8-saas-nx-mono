# Hybrid Architecture 应用指南

> **版本**: 1.0.0 | **创建日期**: 2025-01-27 | **模块**: packages/hybrid-archi

---

## 📋 目录

- [1. 快速开始](#1-快速开始)
- [2. 项目结构指南](#2-项目结构指南)
- [3. 开发流程指南](#3-开发流程指南)
- [4. 代码生成指南](#4-代码生成指南)
- [5. 测试指南](#5-测试指南)
- [6. 部署指南](#6-部署指南)

---

## 1. 快速开始

### 1.1 安装依赖

```bash
# 安装 hybrid-archi 模块
pnpm add @hl8/hybrid-archi

# 安装相关依赖
pnpm add @nestjs/common @nestjs/core @nestjs/jwt
pnpm add class-transformer class-validator
pnpm add uuid @types/uuid
```

### 1.2 基础配置

#### 1.2.1 模块配置

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { HybridArchitectureModule } from '@hl8/hybrid-archi';

@Module({
  imports: [
    HybridArchitectureModule.forRoot({
      // 缓存配置
      cache: {
        enabled: true,
        level: 'multi',
        defaultTtl: 3600,
        maxSize: 10000,
        preload: true,
        monitoring: true,
        statistics: true,
        compression: true,
        encryption: false,
        partitioning: true,
        partitionCount: 4
      },
      // 连接池配置
      connectionPool: {
        minConnections: 5,
        maxConnections: 50,
        connectionTimeout: 30000,
        idleTimeout: 300000,
        validationInterval: 60000,
        retryCount: 3,
        retryInterval: 1000,
        monitoring: true,
        statistics: true,
        healthCheck: true,
        healthCheckInterval: 30000
      },
      // 异步处理器配置
      asyncProcessor: {
        enabled: true,
        maxConcurrency: 10,
        taskTimeout: 30000,
        maxRetries: 3,
        retryInterval: 1000,
        queueSize: 1000,
        monitoring: true,
        statistics: true,
        persistence: true,
        priority: true
      }
    })
  ]
})
export class AppModule {}
```

#### 1.2.2 环境配置

```typescript
// config/environment.ts
export const environment = {
  // 数据库配置
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'hl8_saas',
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development'
  },
  
  // Redis配置
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0')
  },
  
  // JWT配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  }
};
```

### 1.3 基础使用

#### 1.3.1 创建实体

```typescript
// user.entity.ts
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';

export class User extends BaseEntity {
  constructor(
    id: EntityId,
    private name: string,
    private email: string,
    private status: UserStatus = UserStatus.ACTIVE
  ) {
    super(id);
  }

  getName(): string {
    return this.name;
  }

  getEmail(): string {
    return this.email;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.name = newName.trim();
    this.updateTimestamp();
  }

  activate(): void {
    if (this.status === UserStatus.ACTIVE) {
      throw new Error('User is already active');
    }
    this.status = UserStatus.ACTIVE;
    this.updateTimestamp();
  }
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}
```

#### 1.3.2 创建用例

```typescript
// create-user.use-case.ts
import { BaseUseCase, IUseCase } from '@hl8/hybrid-archi';

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreateUserResponse {
  userId: string;
  name: string;
  email: string;
  status: UserStatus;
}

export class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {
    super();
  }

  async executeUseCase(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 1. 创建用户实体
    const user = new User(
      EntityId.generate(),
      request.name,
      request.email,
      UserStatus.PENDING
    );

    // 2. 保存用户
    await this.userRepository.save(user);

    // 3. 发布领域事件
    await this.eventBus.publish(new UserCreatedEvent(user.getId(), user.getName()));

    return {
      userId: user.getId().toString(),
      name: user.getName(),
      email: user.getEmail(),
      status: user.getStatus()
    };
  }
}
```

---

## 2. 项目结构指南

### 2.1 标准项目结构

```
packages/{module-name}/src/
├── domain/                    # 领域层
│   ├── entities/             # 实体
│   │   ├── user.entity.ts
│   │   └── user.aggregate.ts
│   ├── value-objects/        # 值对象
│   │   ├── email.vo.ts
│   │   └── password.vo.ts
│   ├── services/             # 领域服务
│   │   └── user-domain.service.ts
│   ├── events/               # 领域事件
│   │   ├── user-created.event.ts
│   │   └── user-updated.event.ts
│   └── enums/                # 枚举
│       └── user-status.enum.ts
├── application/              # 应用层
│   ├── commands/             # 命令
│   │   ├── create-user.command.ts
│   │   └── update-user.command.ts
│   ├── queries/              # 查询
│   │   ├── get-user.query.ts
│   │   └── get-users.query.ts
│   ├── handlers/             # 处理器
│   │   ├── create-user.handler.ts
│   │   └── get-user.handler.ts
│   ├── use-cases/            # 用例
│   │   ├── create-user.use-case.ts
│   │   └── update-user.use-case.ts
│   └── interfaces/            # 接口
│       └── user-repository.interface.ts
├── infrastructure/           # 基础设施层
│   ├── adapters/            # 适配器
│   │   ├── user.repository.ts
│   │   └── user-cache.adapter.ts
│   ├── entities/            # 数据库实体
│   │   └── user.entity.ts
│   └── mappers/             # 映射器
│       └── user.mapper.ts
├── interface/                # 接口层
│   ├── controllers/         # 控制器
│   │   └── user.controller.ts
│   ├── resolvers/           # GraphQL解析器
│   │   └── user.resolver.ts
│   ├── dto/                 # 数据传输对象
│   │   ├── create-user.dto.ts
│   │   └── user.dto.ts
│   └── guards/              # 守卫
│       └── user-permission.guard.ts
└── constants.ts             # 常量定义
```

### 2.2 文件命名规范

#### 2.2.1 实体文件

- **实体**: `{name}.entity.ts`
- **聚合根**: `{name}.aggregate.ts`
- **值对象**: `{name}.vo.ts`
- **领域服务**: `{name}-domain.service.ts`

#### 2.2.2 应用层文件

- **命令**: `{action}-{entity}.command.ts`
- **查询**: `get-{entity}.query.ts`
- **处理器**: `{action}-{entity}.handler.ts`
- **用例**: `{action}-{entity}.use-case.ts`

#### 2.2.3 基础设施层文件

- **仓储**: `{entity}.repository.ts`
- **适配器**: `{entity}-{type}.adapter.ts`
- **映射器**: `{entity}.mapper.ts`

#### 2.2.4 接口层文件

- **控制器**: `{entity}.controller.ts`
- **解析器**: `{entity}.resolver.ts`
- **DTO**: `{action}-{entity}.dto.ts`

### 2.3 导入顺序规范

```typescript
// 1. Node.js内置模块
import { readFileSync } from 'fs';
import { join } from 'path';

// 2. 外部依赖
import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';

// 3. 跨包依赖
import { BaseEntity, EntityId } from '@hl8/hybrid-archi';
import { User } from '@hl8/user-management';

// 4. 相对导入
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
```

---

## 3. 开发流程指南

### 3.1 领域建模流程

#### 3.1.1 识别聚合

1. **识别业务实体**: 确定核心业务对象
2. **定义聚合边界**: 确定聚合的一致性边界
3. **识别值对象**: 确定不可变的值对象
4. **定义领域服务**: 确定复杂的业务逻辑

#### 3.1.2 设计聚合根

```typescript
// 1. 定义聚合根
export class UserAggregate extends BaseAggregateRoot {
  // 聚合根业务方法
  public createUser(email: Email, username: Username): void {
    // 业务逻辑
  }
}

// 2. 定义值对象
export class Email extends BaseValueObject {
  // 值对象逻辑
}

// 3. 定义领域事件
export class UserCreatedEvent extends BaseDomainEvent {
  // 事件数据
}
```

### 3.2 应用层开发流程

#### 3.2.1 定义用例

```typescript
// 1. 定义用例接口
export interface ICreateUserUseCase {
  execute(request: CreateUserRequest): Promise<CreateUserResponse>;
}

// 2. 实现用例
export class CreateUserUseCase implements ICreateUserUseCase {
  async execute(request: CreateUserRequest): Promise<CreateUserResponse> {
    // 用例逻辑
  }
}
```

#### 3.2.2 实现CQRS

```typescript
// 1. 定义命令
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly name: string,
    public readonly email: string
  ) {
    super();
  }
}

// 2. 实现命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async handle(command: CreateUserCommand): Promise<void> {
    // 命令处理逻辑
  }
}

// 3. 定义查询
export class GetUserQuery extends BaseQuery {
  constructor(public readonly userId: string) {
    super();
  }
}

// 4. 实现查询处理器
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery, UserDto> {
  async handle(query: GetUserQuery): Promise<UserDto> {
    // 查询处理逻辑
  }
}
```

### 3.3 基础设施层开发流程

#### 3.3.1 实现仓储

```typescript
// 1. 实现仓储接口
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userEntityRepository: EntityRepository<UserEntity>,
    private readonly mapper: UserMapper
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.userEntityRepository.findOne({ id: id.value });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async save(user: User): Promise<void> {
    const entity = this.mapper.toEntity(user);
    await this.userEntityRepository.persistAndFlush(entity);
  }
}
```

#### 3.3.2 实现适配器

```typescript
// 1. 实现缓存适配器
@Injectable()
export class UserCacheAdapter extends CacheAdapter {
  async getUser(userId: string): Promise<User | null> {
    return await this.get<User>(`user:${userId}`);
  }

  async setUser(userId: string, user: User): Promise<void> {
    await this.set(`user:${userId}`, user, 3600);
  }
}
```

### 3.4 接口层开发流程

#### 3.4.1 实现控制器

```typescript
// 1. 实现REST控制器
@Controller('users')
export class UserController extends BaseController {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus
  ) {
    super();
  }

  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserDto> {
    const command = new CreateUserCommand(dto.name, dto.email);
    await this.commandBus.execute(command);
    
    const query = new GetUserQuery(dto.email);
    return await this.queryBus.execute(query);
  }
}
```

#### 3.4.2 实现GraphQL解析器

```typescript
// 1. 实现GraphQL解析器
@Resolver(() => User)
export class UserResolver extends BaseResolver {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus
  ) {
    super();
  }

  @Mutation(() => User)
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    const command = new CreateUserCommand(input.name, input.email);
    await this.commandBus.execute(command);
    
    const query = new GetUserQuery(input.email);
    return await this.queryBus.execute(query);
  }
}
```

---

## 4. 代码生成指南

### 4.1 使用Nx生成器

#### 4.1.1 生成新模块

```bash
# 生成新的业务模块
nx generate @hl8/hybrid-archi:module user-management

# 生成新的实体
nx generate @hl8/hybrid-archi:entity user

# 生成新的用例
nx generate @hl8/hybrid-archi:use-case create-user

# 生成新的控制器
nx generate @hl8/hybrid-archi:controller user
```

#### 4.1.2 生成完整功能

```bash
# 生成完整的CRUD功能
nx generate @hl8/hybrid-archi:crud user

# 生成带认证的功能
nx generate @hl8/hybrid-archi:crud user --auth

# 生成带缓存的功能
nx generate @hl8/hybrid-archi:crud user --cache
```

### 4.2 代码模板

#### 4.2.1 实体模板

```typescript
// 实体模板
export class {EntityName} extends BaseEntity {
  constructor(
    id: EntityId,
    // 属性定义
  ) {
    super(id);
  }

  // 业务方法
  public {businessMethod}(): void {
    // 业务逻辑
  }
}
```

#### 4.2.2 用例模板

```typescript
// 用例模板
export class {ActionName}{EntityName}UseCase extends BaseUseCase<{ActionName}{EntityName}Request, {ActionName}{EntityName}Response> {
  constructor(
    private readonly {entityName}Repository: I{EntityName}Repository,
    private readonly eventBus: IEventBus
  ) {
    super();
  }

  async executeUseCase(request: {ActionName}{EntityName}Request): Promise<{ActionName}{EntityName}Response> {
    // 用例逻辑
  }
}
```

---

## 5. 测试指南

### 5.1 单元测试

#### 5.1.1 实体测试

```typescript
// user.entity.spec.ts
describe('User Entity', () => {
  let user: User;

  beforeEach(() => {
    user = new User(
      EntityId.generate(),
      'John Doe',
      'john@example.com',
      UserStatus.ACTIVE
    );
  });

  it('should create user with correct properties', () => {
    expect(user.getName()).toBe('John Doe');
    expect(user.getEmail()).toBe('john@example.com');
    expect(user.getStatus()).toBe(UserStatus.ACTIVE);
  });

  it('should update name correctly', () => {
    user.updateName('Jane Doe');
    expect(user.getName()).toBe('Jane Doe');
  });

  it('should throw error when updating with empty name', () => {
    expect(() => user.updateName('')).toThrow('Name cannot be empty');
  });
});
```

#### 5.1.2 用例测试

```typescript
// create-user.use-case.spec.ts
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findById: jest.fn()
    };
    eventBus = {
      publish: jest.fn()
    };
    useCase = new CreateUserUseCase(userRepository, eventBus);
  });

  it('should create user successfully', async () => {
    const request: CreateUserRequest = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const result = await useCase.execute(request);

    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(userRepository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
  });
});
```

### 5.2 集成测试

#### 5.2.1 控制器测试

```typescript
// user.controller.spec.ts
describe('UserController', () => {
  let app: INestApplication;
  let commandBus: jest.Mocked<ICommandBus>;
  let queryBus: jest.Mocked<IQueryBus>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: ICommandBus,
          useValue: { execute: jest.fn() }
        },
        {
          provide: IQueryBus,
          useValue: { execute: jest.fn() }
        }
      ]
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should create user', async () => {
    const createUserDto = {
      name: 'John Doe',
      email: 'john@example.com'
    };

    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201);

    expect(response.body.name).toBe('John Doe');
  });
});
```

### 5.3 端到端测试

#### 5.3.1 完整流程测试

```typescript
// user.e2e-spec.ts
describe('User Management (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should create and retrieve user', async () => {
    // 1. 创建用户
    const createResponse = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'John Doe',
        email: 'john@example.com'
      })
      .expect(201);

    const userId = createResponse.body.id;

    // 2. 获取用户
    const getResponse = await request(app.getHttpServer())
      .get(`/users/${userId}`)
      .expect(200);

    expect(getResponse.body.name).toBe('John Doe');
    expect(getResponse.body.email).toBe('john@example.com');
  });
});
```

---

## 6. 部署指南

### 6.1 环境配置

#### 6.1.1 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run start:dev

# 运行测试
pnpm run test

# 运行lint
pnpm run lint
```

#### 6.1.2 生产环境

```bash
# 构建应用
pnpm run build

# 启动生产服务器
pnpm run start:prod

# 运行健康检查
pnpm run health:check
```

### 6.2 Docker部署

#### 6.2.1 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "run", "start:prod"]
```

#### 6.2.2 Docker Compose

```yaml
version: '3.8'
services:
  app:
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

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: hl8_saas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 6.3 监控和日志

#### 6.3.1 健康检查

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    return await this.healthService.check();
  }
}
```

#### 6.3.2 监控指标

```typescript
// metrics.service.ts
@Injectable()
export class MetricsService {
  private readonly requestCounter = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
  });

  private readonly responseTime = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route']
  });

  recordRequest(method: string, route: string, status: number, duration: number): void {
    this.requestCounter.inc({ method, route, status: status.toString() });
    this.responseTime.observe({ method, route }, duration);
  }
}
```

---

## 🎯 总结

Hybrid Architecture 应用指南提供了：

1. **快速开始**: 快速搭建项目基础
2. **项目结构**: 标准化的项目结构
3. **开发流程**: 完整的开发流程指导
4. **代码生成**: 自动化的代码生成
5. **测试指南**: 全面的测试策略
6. **部署指南**: 生产环境部署

通过遵循这些指南，可以确保项目的一致性和可维护性。

---

**下一步**: 查看 [用户管理模块应用示例](./04-USER_MANAGEMENT_EXAMPLE.md) 了解具体的应用实践。
