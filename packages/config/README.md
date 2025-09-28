# @hl8/config

HL8 SAAS平台配置管理模块 - 完全类型安全的配置管理

## 简介

`@hl8/config` 是一个专为 HL8 SAAS 平台设计的配置管理模块，提供完全类型安全的配置管理功能。该模块参考了 `nest-typed-config` 的设计理念，并针对 HL8 平台的特殊需求进行了优化。

## 主要功能

### 🎯 完全类型安全

- 无需类型转换，直接注入配置类即可获得完整的 TypeScript 支持
- 支持嵌套配置的自动类型推断
- 编译时类型检查

### 📁 多格式支持

- 支持 `.env`、`.json`、`.yml/.yaml` 配置文件
- 支持环境变量覆盖
- 支持配置文件合并
- 支持远程配置加载

### ✅ 配置验证

- 集成 `class-validator` 进行配置验证
- 支持自定义验证规则
- 提供详细的验证错误信息

### 🔄 变量扩展

- 支持 `${VAR}` 语法进行变量替换
- 支持 `${VAR:-DEFAULT}` 默认值语法
- 支持嵌套配置引用

## 快速开始

### 安装

```bash
# 在 monorepo 中，该包已经配置为内部依赖
# 无需额外安装
```

### 基本使用

```typescript
import { TypedConfigModule, fileLoader, dotenvLoader } from '@hl8/config';
import { Type } from 'class-transformer';
import { IsString, IsNumber, ValidateNested } from 'class-validator';
import { Module } from '@nestjs/common';

// 1. 定义配置类
export class DatabaseConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;

  @IsString()
  public readonly name!: string;
}

export class RedisConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;
}

export class RootConfig {
  @ValidateNested()
  @Type(() => DatabaseConfig)
  public readonly database!: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  public readonly redis!: RedisConfig;
}

// 2. 配置模块
@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [
        fileLoader({ path: './config/app.yml' }),
        dotenvLoader({ separator: '__' })
      ]
    })
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

// 3. 使用配置 - 完全类型安全
@Injectable()
export class DatabaseService {
  constructor(
    private readonly config: RootConfig,
    private readonly databaseConfig: DatabaseConfig,
    private readonly redisConfig: RedisConfig
  ) {}

  async connect() {
    // 完全的类型推断和自动补全
    console.log(`连接到数据库: ${this.databaseConfig.host}:${this.databaseConfig.port}`);
    console.log(`连接到Redis: ${this.redisConfig.host}:${this.redisConfig.port}`);
  }
}
```

## 配置文件示例

### .env 文件

```env
# 数据库配置
DATABASE__HOST=localhost
DATABASE__PORT=3306
DATABASE__NAME=hl8_saas

# Redis配置
REDIS__HOST=localhost
REDIS__PORT=6379

# 应用配置
APP__NAME=HL8 SAAS Platform
APP__VERSION=1.0.0
```

### config/app.yml 文件

```yaml
database:
  host: ${DATABASE_HOST:-localhost}
  port: ${DATABASE_PORT:-3306}
  name: ${DATABASE_NAME}
  options:
    charset: utf8mb4
    timezone: +08:00

redis:
  host: ${REDIS_HOST:-localhost}
  port: ${REDIS_PORT:-6379}
  password: ${REDIS_PASSWORD}

app:
  name: ${APP_NAME}
  version: ${APP_VERSION}
  environment: ${NODE_ENV:-development}
```

## 高级功能

### 多加载器配置

```typescript
import { TypedConfigModule, fileLoader, dotenvLoader, remoteLoader } from '@hl8/config';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [
        fileLoader({ path: './config/app.yml' }), // 本地配置文件
        dotenvLoader({ separator: '__' }),        // 环境变量
        remoteLoader('http://config-server/api/config', { // 远程配置
          type: 'json',
          retries: 3
        })
      ]
    })
  ],
})
export class AppModule {}
```

### 目录加载器

```typescript
import { TypedConfigModule, directoryLoader } from '@hl8/config';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: directoryLoader({
        directory: './config',
        include: /\.(json|yml)$/
      })
    })
  ],
})
export class AppModule {}
```

### 自定义验证

```typescript
import { TypedConfigModule } from '@hl8/config';
import { plainToClass, validateSync } from 'class-validator';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: fileLoader(),
      validate: (config) => {
        const validatedConfig = plainToClass(RootConfig, config);
        const errors = validateSync(validatedConfig, {
          forbidUnknownValues: true,
          whitelist: true,
        });
        
        if (errors.length > 0) {
          throw new Error(`Configuration validation failed: ${errors}`);
        }
        
        return validatedConfig;
      }
    })
  ],
})
export class AppModule {}
```

### 配置标准化

```typescript
import { TypedConfigModule } from '@hl8/config';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: dotenvLoader(),
      normalize: (config) => {
        // 自定义配置标准化逻辑
        if (config.port) {
          config.port = parseInt(config.port, 10);
        }
        return config;
      }
    })
  ],
})
export class AppModule {}
```

## API 参考

### TypedConfigModule

#### `forRoot(options: TypedConfigModuleOptions)`

同步创建类型化配置模块。

#### `forRootAsync(options: TypedConfigModuleAsyncOptions)`

异步创建类型化配置模块。

### 加载器

#### `fileLoader(options?: FileLoaderOptions)`

文件加载器，支持 JSON、YAML 格式。

#### `dotenvLoader(options?: DotenvLoaderOptions)`

环境变量加载器，支持键转换和变量展开。

#### `remoteLoader(url: string, options?: RemoteLoaderOptions)`

远程配置加载器，支持重试和自定义响应映射。

#### `directoryLoader(options: DirectoryLoaderOptions)`

目录加载器，从目录加载多个配置文件。

### 类型定义

- `TypedConfigModuleOptions` - 配置模块选项
- `TypedConfigModuleAsyncOptions` - 异步配置模块选项
- `FileLoaderOptions` - 文件加载器选项
- `DotenvLoaderOptions` - 环境变量加载器选项
- `RemoteLoaderOptions` - 远程加载器选项
- `DirectoryLoaderOptions` - 目录加载器选项

## 构建和测试

### 构建

```bash
nx build config
```

### 运行测试

```bash
nx test config
```

### 类型检查

```bash
nx typecheck config
```

### 代码检查

```bash
nx lint config
```

## 贡献指南

1. 遵循项目的代码规范
2. 添加适当的测试用例
3. 更新相关文档
4. 确保所有测试通过

## 许可证

MIT License
