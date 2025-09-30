# @hl8/config 技术设计文档

## 🎯 设计概览

`@hl8/config` 是 HL8 SAAS 平台的核心配置管理模块，提供完全类型安全的配置管理功能。该模块基于 `class-validator` 和 `class-transformer` 实现，支持多种配置源、配置验证、变量扩展和缓存管理。

## 📋 设计目标

### **核心目标**

1. **类型安全**: 提供完整的 TypeScript 类型支持和编译时类型检查
2. **配置验证**: 基于 `class-validator` 的运行时配置验证
3. **多源支持**: 支持文件、环境变量、远程配置等多种配置源
4. **变量扩展**: 支持环境变量替换和默认值设置
5. **缓存管理**: 提供配置缓存和热重载功能
6. **易用性**: 提供简洁的 API 和丰富的配置选项

### **设计原则**

1. **通用性**: 不包含任何业务特定逻辑，可被任何模块使用
2. **独立性**: 不依赖任何业务模块，保持模块的独立性
3. **可扩展性**: 支持自定义加载器、验证器和标准化器
4. **性能优化**: 支持配置缓存和懒加载
5. **错误处理**: 提供详细的错误信息和调试支持

## 🏗️ 架构设计

### **整体架构**

```
┌─────────────────────────────────────────────────────────────┐
│                    @hl8/config 模块                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   TypedConfig   │  │   ConfigCache   │  │   ErrorHandler  │  │
│  │     Module      │  │     Manager     │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   FileLoader    │  │  DotenvLoader   │  │  RemoteLoader   │  │
│  │                 │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ DirectoryLoader │  │  ConfigValidator│  │ ConfigNormalizer│  │
│  │                 │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Config Types   │  │  Loader Types   │  │   Cache Types   │  │
│  │                 │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### **核心组件**

#### **1. TypedConfigModule**

- **职责**: 配置模块的核心实现，提供同步和异步配置加载
- **功能**: 配置加载、验证、标准化、提供者注册
- **特点**: 支持全局模块、依赖注入、缓存管理

#### **2. 配置加载器 (Loaders)**

- **FileLoader**: 文件配置加载器，支持 JSON、YAML 格式
- **DotenvLoader**: 环境变量加载器，支持键转换和变量展开
- **RemoteLoader**: 远程配置加载器，支持重试和自定义响应映射
- **DirectoryLoader**: 目录加载器，从目录加载多个配置文件

#### **3. 配置验证器 (Validators)**

- **ConfigValidator**: 基于 `class-validator` 的配置验证
- **自定义验证**: 支持自定义验证函数和验证选项
- **错误处理**: 提供详细的验证错误信息和堆栈跟踪

#### **4. 缓存管理器 (CacheManager)**

- **配置缓存**: 支持内存缓存和文件缓存
- **缓存策略**: 支持缓存键前缀、TTL、失效策略
- **缓存统计**: 提供缓存命中率、性能统计

#### **5. 错误处理器 (ErrorHandler)**

- **错误分类**: 配置加载错误、验证错误、缓存错误
- **错误信息**: 提供详细的错误信息和调试支持
- **错误恢复**: 支持错误恢复和降级策略

## 🔧 核心功能设计

### **1. 配置加载系统**

#### **加载器接口设计**

```typescript
export interface ConfigLoader {
  load(): ConfigRecord;
}

export interface AsyncConfigLoader {
  load(): Promise<ConfigRecord>;
}
```

#### **加载器实现**

```typescript
// 文件加载器
export function fileLoader(options: FileLoaderOptions): ConfigLoader {
  return {
    load(): ConfigRecord {
      const filePath = options.path;
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const fileType = path.extname(filePath);
      
      switch (fileType) {
        case '.json':
          return JSON.parse(fileContent);
        case '.yml':
        case '.yaml':
          return yaml.load(fileContent);
        default:
          throw new ConfigError(`Unsupported file type: ${fileType}`);
      }
    }
  };
}

// 环境变量加载器
export function dotenvLoader(options: DotenvLoaderOptions): ConfigLoader {
  return {
    load(): ConfigRecord {
      const config: ConfigRecord = {};
      const separator = options.separator || '__';
      
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          const configKey = key.replace(new RegExp(separator, 'g'), '.');
          setValue(config, configKey, value);
        }
      }
      
      return config;
    }
  };
}
```

#### **配置合并策略**

```typescript
export class ConfigMerger {
  static merge(configs: ConfigRecord[]): ConfigRecord {
    return configs.reduce((merged, config) => {
      return merge(merged, config);
    }, {});
  }
}
```

### **2. 配置验证系统**

#### **验证器接口设计**

```typescript
export interface ConfigValidator {
  validate<T>(config: ConfigRecord, schema: ClassConstructor<T>): T;
}
```

#### **验证器实现**

```typescript
export class DefaultConfigValidator implements ConfigValidator {
  validate<T>(
    config: ConfigRecord, 
    schema: ClassConstructor<T>,
    options?: ValidatorOptions
  ): T {
    // 转换为配置类实例
    const configInstance = plainToClass(schema, config);
    
    // 执行验证
    const errors = validateSync(configInstance, {
      forbidUnknownValues: true,
      whitelist: true,
      ...options
    });
    
    if (errors.length > 0) {
      throw new ConfigValidationError('Configuration validation failed', errors);
    }
    
    return configInstance;
  }
}
```

#### **自定义验证支持**

```typescript
export interface CustomValidator<T> {
  validate(config: T): T;
}

export function createCustomValidator<T>(
  validator: CustomValidator<T>
): ConfigValidator {
  return {
    validate(config: ConfigRecord, schema: ClassConstructor<T>): T {
      const instance = plainToClass(schema, config);
      return validator.validate(instance);
    }
  };
}
```

### **3. 变量扩展系统**

#### **变量扩展器设计**

```typescript
export interface VariableExpander {
  expand(config: ConfigRecord): ConfigRecord;
}
```

#### **变量扩展实现**

```typescript
export class DefaultVariableExpander implements VariableExpander {
  private readonly variableRegex = /\$\{([^}]+)\}/g;
  
  expand(config: ConfigRecord): ConfigRecord {
    return this.expandRecursive(config, config);
  }
  
  private expandRecursive(obj: any, rootConfig: ConfigRecord): any {
    if (typeof obj === 'string') {
      return this.expandString(obj, rootConfig);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.expandRecursive(item, rootConfig));
    }
    
    if (obj && typeof obj === 'object') {
      const expanded: any = {};
      for (const [key, value] of Object.entries(obj)) {
        expanded[key] = this.expandRecursive(value, rootConfig);
      }
      return expanded;
    }
    
    return obj;
  }
  
  private expandString(str: string, config: ConfigRecord): string {
    return str.replace(this.variableRegex, (match, variable) => {
      const [varName, defaultValue] = variable.split(':-');
      const value = this.getValueFromConfig(varName, config) || 
                   process.env[varName] || 
                   defaultValue || 
                   match;
      return String(value);
    });
  }
  
  private getValueFromConfig(path: string, config: ConfigRecord): any {
    return get(config, path);
  }
}
```

### **4. 缓存管理系统**

#### **缓存管理器设计**

```typescript
export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  getStats(): CacheStats;
}
```

#### **缓存管理器实现**

```typescript
export class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0
  };
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.value as T;
  }
  
  set<T>(key: string, value: T, ttl?: number): void {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    
    this.cache.set(key, {
      value,
      createdAt: Date.now(),
      expiresAt
    });
    
    this.stats.sets++;
  }
  
  delete(key: string): void {
    if (this.cache.delete(key)) {
      this.stats.deletes++;
    }
  }
  
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }
  
  getStats(): CacheStats {
    return { ...this.stats };
  }
}
```

## 📊 类型系统设计

### **核心类型定义**

#### **配置记录类型**

```typescript
export type ConfigRecord = Record<string, any>;

export interface ConfigEntry<T = any> {
  value: T;
  createdAt: number;
  expiresAt?: number;
}
```

#### **配置加载器类型**

```typescript
export interface ConfigLoader {
  load(): ConfigRecord;
}

export interface AsyncConfigLoader {
  load(): Promise<ConfigRecord>;
}

export type ConfigLoaderUnion = ConfigLoader | AsyncConfigLoader;
```

#### **配置验证器类型**

```typescript
export interface ConfigValidator {
  validate<T>(config: ConfigRecord, schema: ClassConstructor<T>): T;
}

export interface CustomValidator<T> {
  validate(config: T): T;
}
```

#### **缓存管理器类型**

```typescript
export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  getStats(): CacheStats;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
}
```

### **配置选项类型**

#### **模块选项类型**

```typescript
export interface TypedConfigModuleOptions {
  schema: ClassConstructor<any>;
  load: ConfigLoaderUnion[];
  validate?: ConfigValidator;
  normalize?: ConfigNormalizer;
  cache?: CacheOptions;
  isGlobal?: boolean;
}

export interface TypedConfigModuleAsyncOptions {
  schema: ClassConstructor<any>;
  load: AsyncConfigLoader[];
  validate?: ConfigValidator;
  normalize?: ConfigNormalizer;
  cache?: CacheOptions;
  isGlobal?: boolean;
}
```

#### **加载器选项类型**

```typescript
export interface FileLoaderOptions {
  path: string;
  encoding?: BufferEncoding;
  watch?: boolean;
}

export interface DotenvLoaderOptions {
  separator?: string;
  expand?: boolean;
  ignoreEnvVars?: string[];
}

export interface RemoteLoaderOptions {
  type?: 'json' | 'yaml';
  retries?: number;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface DirectoryLoaderOptions {
  directory: string;
  include?: RegExp;
  exclude?: RegExp;
  recursive?: boolean;
}
```

## 🔄 配置加载流程

### **同步配置加载流程**

```
1. 模块创建请求
   ↓
2. 配置加载器执行
   ├── FileLoader.load()
   ├── DotenvLoader.load()
   └── RemoteLoader.load()
   ↓
3. 配置合并
   ├── 深度合并多个配置源
   └── 处理配置冲突
   ↓
4. 变量扩展
   ├── 解析 ${VAR} 语法
   ├── 处理 ${VAR:-DEFAULT} 默认值
   └── 递归处理嵌套配置
   ↓
5. 配置标准化
   ├── 执行自定义标准化函数
   └── 数据类型转换
   ↓
6. 配置验证
   ├── class-validator 验证
   ├── 自定义验证函数
   └── 验证错误处理
   ↓
7. 缓存存储
   ├── 计算缓存键
   ├── 存储配置到缓存
   └── 设置缓存过期时间
   ↓
8. 提供者注册
   ├── 注册配置类提供者
   ├── 注册嵌套配置提供者
   └── 注册缓存管理器提供者
   ↓
9. 模块返回
```

### **异步配置加载流程**

```
1. 异步模块创建请求
   ↓
2. 异步配置加载器执行
   ├── RemoteLoader.load() → Promise<ConfigRecord>
   ├── DatabaseLoader.load() → Promise<ConfigRecord>
   └── 等待所有加载器完成
   ↓
3. 配置合并 (同同步流程)
   ↓
4. 变量扩展 (同同步流程)
   ↓
5. 配置标准化 (同同步流程)
   ↓
6. 配置验证 (同同步流程)
   ↓
7. 缓存存储 (同同步流程)
   ↓
8. 提供者注册 (同同步流程)
   ↓
9. 异步模块返回
```

## 🛠️ 实现细节

### **1. 配置加载器实现**

#### **文件加载器**

```typescript
export function fileLoader(options: FileLoaderOptions): ConfigLoader {
  return {
    load(): ConfigRecord {
      try {
        const filePath = resolve(options.path);
        const fileContent = fs.readFileSync(filePath, options.encoding || 'utf8');
        const fileType = path.extname(filePath).toLowerCase();
        
        switch (fileType) {
          case '.json':
            return JSON.parse(fileContent);
          case '.yml':
          case '.yaml':
            return yaml.load(fileContent) as ConfigRecord;
          case '.js':
          case '.ts':
            // 支持 JavaScript/TypeScript 配置文件
            delete require.cache[require.resolve(filePath)];
            return require(filePath);
          default:
            throw new ConfigError(`Unsupported file type: ${fileType}`);
        }
      } catch (error) {
        throw new ConfigError(`Failed to load config file: ${options.path}`, error);
      }
    }
  };
}
```

#### **环境变量加载器**

```typescript
export function dotenvLoader(options: DotenvLoaderOptions): ConfigLoader {
  return {
    load(): ConfigRecord {
      const config: ConfigRecord = {};
      const separator = options.separator || '__';
      const expand = options.expand !== false;
      const ignoreEnvVars = options.ignoreEnvVars || [];
      
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined && !ignoreEnvVars.includes(key)) {
          const configKey = key.replace(new RegExp(separator, 'g'), '.');
          setValue(config, configKey, value);
        }
      }
      
      return expand ? this.expandVariables(config) : config;
    }
  };
}
```

#### **远程加载器**

```typescript
export function remoteLoader(
  url: string, 
  options: RemoteLoaderOptions = {}
): AsyncConfigLoader {
  return {
    async load(): Promise<ConfigRecord> {
      const retries = options.retries || 3;
      const timeout = options.timeout || 5000;
      const headers = options.headers || {};
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json, application/x-yaml, text/yaml',
              ...headers
            },
            signal: AbortSignal.timeout(timeout)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const contentType = response.headers.get('content-type') || '';
          const content = await response.text();
          
          if (contentType.includes('application/json')) {
            return JSON.parse(content);
          } else if (contentType.includes('yaml')) {
            return yaml.load(content) as ConfigRecord;
          } else {
            // 尝试自动检测格式
            try {
              return JSON.parse(content);
            } catch {
              return yaml.load(content) as ConfigRecord;
            }
          }
        } catch (error) {
          if (attempt === retries) {
            throw new ConfigError(`Failed to load remote config from ${url}`, error);
          }
          
          // 指数退避重试
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
      
      throw new ConfigError(`Failed to load remote config after ${retries} attempts`);
    }
  };
}
```

### **2. 配置验证实现**

#### **默认验证器**

```typescript
export class DefaultConfigValidator implements ConfigValidator {
  constructor(private options: ValidatorOptions = {}) {}
  
  validate<T>(
    config: ConfigRecord, 
    schema: ClassConstructor<T>
  ): T {
    try {
      // 转换为配置类实例
      const configInstance = plainToClass(schema, config, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false,
        ...this.options
      });
      
      // 执行验证
      const errors = validateSync(configInstance, {
        forbidUnknownValues: true,
        whitelist: true,
        transform: true,
        ...this.options
      });
      
      if (errors.length > 0) {
        throw new ConfigValidationError('Configuration validation failed', errors);
      }
      
      return configInstance;
    } catch (error) {
      if (error instanceof ConfigValidationError) {
        throw error;
      }
      throw new ConfigError('Configuration validation failed', error);
    }
  }
}
```

#### **自定义验证器**

```typescript
export function createCustomValidator<T>(
  validator: CustomValidator<T>
): ConfigValidator {
  return {
    validate(config: ConfigRecord, schema: ClassConstructor<T>): T {
      try {
        const instance = plainToClass(schema, config);
        return validator.validate(instance);
      } catch (error) {
        throw new ConfigError('Custom validation failed', error);
      }
    }
  };
}

// 使用示例
const customValidator = createCustomValidator({
  validate(config: DatabaseConfig): DatabaseConfig {
    if (config.port < 1 || config.port > 65535) {
      throw new Error('Port must be between 1 and 65535');
    }
    
    if (!config.host || config.host.length === 0) {
      throw new Error('Host is required');
    }
    
    return config;
  }
});
```

### **3. 缓存管理实现**

#### **内存缓存管理器**

```typescript
export class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0
  };
  
  constructor(private options: CacheOptions = {}) {}
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // 检查过期时间
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.size = this.cache.size;
      return null;
    }
    
    this.stats.hits++;
    return entry.value as T;
  }
  
  set<T>(key: string, value: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = ttl ? now + ttl * 1000 : undefined;
    
    // 检查缓存大小限制
    if (this.options.maxSize && this.cache.size >= this.options.maxSize) {
      this.evictOldest();
    }
    
    this.cache.set(key, {
      value,
      createdAt: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now
    });
    
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }
  
  delete(key: string): void {
    if (this.cache.delete(key)) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
  }
  
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0, size: 0 };
  }
  
  getStats(): CacheStats {
    return { ...this.stats };
  }
  
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
```

#### **文件缓存管理器**

```typescript
export class FileCacheManager implements CacheManager {
  private cache: ConfigRecord = {};
  private stats: CacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  
  constructor(
    private cachePath: string,
    private options: CacheOptions = {}
  ) {
    this.loadCacheFromFile();
  }
  
  private loadCacheFromFile(): void {
    try {
      if (fs.existsSync(this.cachePath)) {
        const content = fs.readFileSync(this.cachePath, 'utf8');
        this.cache = JSON.parse(content);
      }
    } catch (error) {
      // 缓存文件损坏时忽略错误，使用空缓存
      this.cache = {};
    }
  }
  
  private saveCacheToFile(): void {
    try {
      const content = JSON.stringify(this.cache, null, 2);
      fs.writeFileSync(this.cachePath, content, 'utf8');
    } catch (error) {
      // 缓存保存失败时记录错误但不抛出异常
      console.warn('Failed to save cache to file:', error);
    }
  }
  
  get<T>(key: string): T | null {
    const value = this.cache[key];
    
    if (value === undefined) {
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return value as T;
  }
  
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache[key] = value;
    this.stats.sets++;
    this.saveCacheToFile();
  }
  
  delete(key: string): void {
    if (key in this.cache) {
      delete this.cache[key];
      this.stats.deletes++;
      this.saveCacheToFile();
    }
  }
  
  clear(): void {
    this.cache = {};
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    this.saveCacheToFile();
  }
  
  getStats(): CacheStats {
    return { ...this.stats };
  }
}
```

## 🔧 错误处理设计

### **错误类型定义**

#### **配置错误基类**

```typescript
export abstract class ConfigError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(
    message: string,
    public readonly cause?: Error,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      cause: this.cause?.message,
      context: this.context,
      stack: this.stack
    };
  }
}
```

#### **具体错误类型**

```typescript
export class ConfigLoadError extends ConfigError {
  readonly code = 'CONFIG_LOAD_ERROR';
  readonly statusCode = 500;
}

export class ConfigValidationError extends ConfigError {
  readonly code = 'CONFIG_VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(
    message: string,
    public readonly validationErrors: ValidationError[],
    cause?: Error
  ) {
    super(message, cause);
  }
}

export class ConfigCacheError extends ConfigError {
  readonly code = 'CONFIG_CACHE_ERROR';
  readonly statusCode = 500;
}

export class ConfigParseError extends ConfigError {
  readonly code = 'CONFIG_PARSE_ERROR';
  readonly statusCode = 400;
}
```

### **错误处理器实现**

#### **错误处理器**

```typescript
export class ErrorHandler {
  constructor(private options: ErrorHandlerOptions = {}) {}
  
  handle(error: Error, context?: Record<string, any>): never {
    const configError = this.wrapError(error, context);
    
    if (this.options.logger) {
      this.logger.error('Configuration error', {
        error: configError.toJSON(),
        context
      });
    }
    
    throw configError;
  }
  
  private wrapError(error: Error, context?: Record<string, any>): ConfigError {
    if (error instanceof ConfigError) {
      return error;
    }
    
    // 根据错误类型包装为具体的配置错误
    if (error.name === 'ValidationError') {
      return new ConfigValidationError(error.message, [], error);
    }
    
    if (error.message.includes('ENOENT') || error.message.includes('file not found')) {
      return new ConfigLoadError('Configuration file not found', error, context);
    }
    
    if (error.message.includes('JSON') || error.message.includes('YAML')) {
      return new ConfigParseError('Configuration parsing failed', error, context);
    }
    
    return new ConfigError('Unknown configuration error', error, context);
  }
}
```

## 📈 性能优化设计

### **1. 配置缓存优化**

#### **缓存策略**

```typescript
export interface CacheStrategy {
  shouldCache(config: ConfigRecord): boolean;
  getCacheKey(config: ConfigRecord): string;
  getTTL(config: ConfigRecord): number;
}
```

#### **智能缓存策略**

```typescript
export class SmartCacheStrategy implements CacheStrategy {
  shouldCache(config: ConfigRecord): boolean {
    // 只缓存非敏感配置
    return !this.containsSensitiveData(config);
  }
  
  getCacheKey(config: ConfigRecord): string {
    // 基于配置内容生成哈希键
    const content = JSON.stringify(config, Object.keys(config).sort());
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  getTTL(config: ConfigRecord): number {
    // 根据配置类型设置不同的TTL
    if (config.environment === 'production') {
      return 3600; // 1小时
    }
    return 300; // 5分钟
  }
  
  private containsSensitiveData(config: ConfigRecord): boolean {
    const sensitiveKeys = ['password', 'secret', 'key', 'token'];
    const configStr = JSON.stringify(config).toLowerCase();
    return sensitiveKeys.some(key => configStr.includes(key));
  }
}
```

### **2. 懒加载优化**

#### **懒加载配置**

```typescript
export class LazyConfigLoader implements ConfigLoader {
  private config: ConfigRecord | null = null;
  private loadingPromise: Promise<ConfigRecord> | null = null;
  
  constructor(private loader: ConfigLoader) {}
  
  load(): ConfigRecord {
    if (this.config !== null) {
      return this.config;
    }
    
    if (this.loadingPromise) {
      throw new Error('Configuration is being loaded');
    }
    
    this.loadingPromise = this.loadConfig();
    this.config = this.loadingPromise as any;
    this.loadingPromise = null;
    
    return this.config;
  }
  
  private async loadConfig(): Promise<ConfigRecord> {
    try {
      return this.loader.load();
    } catch (error) {
      this.loadingPromise = null;
      throw error;
    }
  }
}
```

### **3. 配置预加载**

#### **预加载策略**

```typescript
export class ConfigPreloader {
  private preloadedConfigs = new Map<string, ConfigRecord>();
  
  async preload(configs: Array<{ name: string; loader: ConfigLoader }>): Promise<void> {
    const loadPromises = configs.map(async ({ name, loader }) => {
      try {
        const config = loader.load();
        this.preloadedConfigs.set(name, config);
      } catch (error) {
        console.warn(`Failed to preload config ${name}:`, error);
      }
    });
    
    await Promise.all(loadPromises);
  }
  
  getPreloadedConfig(name: string): ConfigRecord | null {
    return this.preloadedConfigs.get(name) || null;
  }
}
```

## 🔒 安全设计

### **1. 配置加密**

#### **加密配置支持**

```typescript
export interface EncryptedConfig {
  encrypted: boolean;
  algorithm: string;
  data: string;
}

export class ConfigDecryptor {
  constructor(private key: string) {}
  
  decrypt(encryptedConfig: EncryptedConfig): ConfigRecord {
    if (!encryptedConfig.encrypted) {
      return encryptedConfig as any;
    }
    
    try {
      const decipher = crypto.createDecipher(encryptedConfig.algorithm, this.key);
      let decrypted = decipher.update(encryptedConfig.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new ConfigError('Failed to decrypt configuration', error);
    }
  }
}
```

### **2. 敏感信息保护**

#### **敏感信息过滤**

```typescript
export class SensitiveDataFilter {
  private sensitiveKeys = ['password', 'secret', 'key', 'token', 'apiKey'];
  
  filter(config: ConfigRecord): ConfigRecord {
    return this.filterRecursive(config);
  }
  
  private filterRecursive(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.filterRecursive(item));
    }
    
    if (obj && typeof obj === 'object') {
      const filtered: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (this.isSensitiveKey(key)) {
          filtered[key] = '[FILTERED]';
        } else {
          filtered[key] = this.filterRecursive(value);
        }
      }
      return filtered;
    }
    
    return obj;
  }
  
  private isSensitiveKey(key: string): boolean {
    return this.sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );
  }
}
```

## 🧪 测试策略

### **1. 单元测试**

#### **测试覆盖范围**

- 配置加载器功能测试
- 配置验证器功能测试
- 缓存管理器功能测试
- 错误处理器功能测试
- 变量扩展器功能测试

#### **测试示例**

```typescript
describe('FileLoader', () => {
  it('should load JSON configuration file', () => {
    const loader = fileLoader({ path: './test-config.json' });
    const config = loader.load();
    
    expect(config).toEqual({
      database: { host: 'localhost', port: 3306 },
      redis: { host: 'localhost', port: 6379 }
    });
  });
  
  it('should throw error for non-existent file', () => {
    const loader = fileLoader({ path: './non-existent.json' });
    
    expect(() => loader.load()).toThrow(ConfigLoadError);
  });
});

describe('ConfigValidator', () => {
  it('should validate configuration against schema', () => {
    const validator = new DefaultConfigValidator();
    const config = { host: 'localhost', port: 3306 };
    const schema = DatabaseConfig;
    
    const result = validator.validate(config, schema);
    
    expect(result).toBeInstanceOf(DatabaseConfig);
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(3306);
  });
  
  it('should throw validation error for invalid configuration', () => {
    const validator = new DefaultConfigValidator();
    const config = { host: '', port: -1 };
    const schema = DatabaseConfig;
    
    expect(() => validator.validate(config, schema)).toThrow(ConfigValidationError);
  });
});
```

### **2. 集成测试**

#### **集成测试示例**

```typescript
describe('TypedConfigModule Integration', () => {
  it('should create module with file and environment configs', () => {
    const module = TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [
        fileLoader({ path: './test-config.yml' }),
        dotenvLoader({ separator: '__' })
      ]
    });
    
    expect(module.module).toBe(TypedConfigModule);
    expect(module.providers).toHaveLength(3); // RootConfig, DatabaseConfig, RedisConfig
    expect(module.global).toBe(true);
  });
  
  it('should handle configuration validation errors', () => {
    expect(() => {
      TypedConfigModule.forRoot({
        schema: DatabaseConfig,
        load: [fileLoader({ path: './invalid-config.json' })]
      });
    }).toThrow(ConfigValidationError);
  });
});
```

### **3. 性能测试**

#### **性能测试示例**

```typescript
describe('Performance Tests', () => {
  it('should load configuration within acceptable time', async () => {
    const startTime = Date.now();
    
    const module = TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [fileLoader({ path: './large-config.json' })]
    });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // 应该在1秒内完成
  });
  
  it('should cache configuration effectively', () => {
    const cacheManager = new MemoryCacheManager();
    const config = { test: 'value' };
    
    // 第一次设置
    const setStart = Date.now();
    cacheManager.set('test', config);
    const setTime = Date.now() - setStart;
    
    // 第一次获取
    const getStart = Date.now();
    const result = cacheManager.get('test');
    const getTime = Date.now() - getStart;
    
    expect(result).toEqual(config);
    expect(getTime).toBeLessThan(setTime); // 获取应该比设置快
  });
});
```

## 📚 使用示例

### **1. 基本使用**

#### **配置类定义**

```typescript
export class DatabaseConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;

  @IsString()
  public readonly name!: string;

  @IsOptional()
  @IsString()
  public readonly password?: string;
}

export class RedisConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;

  @IsOptional()
  @IsString()
  public readonly password?: string;
}

export class RootConfig {
  @ValidateNested()
  @Type(() => DatabaseConfig)
  public readonly database!: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  public readonly redis!: RedisConfig;

  @IsString()
  public readonly environment!: string;
}
```

#### **模块配置**

```typescript
@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [
        fileLoader({ path: './config/app.yml' }),
        dotenvLoader({ separator: '__' })
      ],
      cache: {
        enabled: true,
        ttl: 3600,
        maxSize: 100
      }
    })
  ],
})
export class AppModule {}
```

#### **服务使用**

```typescript
@Injectable()
export class DatabaseService {
  constructor(
    private readonly config: RootConfig,
    private readonly databaseConfig: DatabaseConfig
  ) {}

  async connect() {
    const { host, port, name, password } = this.databaseConfig;
    
    console.log(`Connecting to database: ${host}:${port}/${name}`);
    
    // 使用配置连接数据库
    return this.createConnection({
      host,
      port,
      database: name,
      password
    });
  }
}
```

### **2. 高级使用**

#### **异步配置加载**

```typescript
@Module({
  imports: [
    TypedConfigModule.forRootAsync({
      schema: RootConfig,
      load: [
        remoteLoader('https://config-server/api/config', {
          retries: 3,
          timeout: 5000
        }),
        dotenvLoader({ separator: '__' })
      ]
    })
  ],
})
export class AppModule {}
```

#### **自定义验证**

```typescript
const customValidator = createCustomValidator({
  validate(config: RootConfig): RootConfig {
    if (config.environment === 'production' && !config.database.password) {
      throw new Error('Database password is required in production');
    }
    
    if (config.database.port < 1 || config.database.port > 65535) {
      throw new Error('Invalid database port');
    }
    
    return config;
  }
});

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [fileLoader({ path: './config/app.yml' })],
      validate: customValidator
    })
  ],
})
export class AppModule {}
```

#### **配置缓存**

```typescript
@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: RootConfig,
      load: [fileLoader({ path: './config/app.yml' })],
      cache: {
        enabled: true,
        type: 'memory',
        ttl: 3600,
        maxSize: 100,
        strategy: new SmartCacheStrategy()
      }
    })
  ],
})
export class AppModule {}
```

## 🎯 总结

`@hl8/config` 模块是一个功能完整、设计优秀的配置管理系统，具有以下特点：

### **核心优势**

1. **类型安全**: 完整的 TypeScript 类型支持和编译时类型检查
2. **配置验证**: 基于 `class-validator` 的运行时配置验证
3. **多源支持**: 支持文件、环境变量、远程配置等多种配置源
4. **变量扩展**: 支持环境变量替换和默认值设置
5. **缓存管理**: 提供配置缓存和性能优化
6. **错误处理**: 完善的错误处理和调试支持

### **设计亮点**

1. **模块化设计**: 清晰的模块边界和职责分离
2. **可扩展性**: 支持自定义加载器、验证器和标准化器
3. **性能优化**: 智能缓存策略和懒加载支持
4. **安全考虑**: 敏感信息保护和配置加密支持
5. **测试友好**: 完整的测试策略和测试工具

### **适用场景**

1. **微服务架构**: 支持远程配置和配置中心集成
2. **多环境部署**: 支持环境变量覆盖和配置文件管理
3. **企业级应用**: 提供配置验证、缓存和监控功能
4. **开发团队**: 提供类型安全和智能提示支持

这个配置模块为 HL8 SAAS 平台提供了强大而灵活的配置管理能力，是构建可维护、可扩展应用程序的重要基础设施！🚀
