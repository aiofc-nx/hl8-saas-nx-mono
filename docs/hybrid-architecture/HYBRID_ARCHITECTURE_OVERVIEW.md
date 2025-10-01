# 🏗️ 混合架构总览

## 基于 packages/hybrid-archi 模块的混合架构设计

### 📖 文档概述

本文档基于 `packages/hybrid-archi` 模块的实际代码实现，以图示方式展示整个混合架构的各功能组件及机制。该模块作为通用功能组件，为业务模块的开发提供统一的混合架构设计模式。

---

## 🎯 第一部分：整体架构图

### 1.1 混合架构分层结构

```mermaid
graph TB
    subgraph "混合架构分层结构"
        subgraph "通用功能层 (Common Layer)"
            COMMON["通用功能组件<br/>📋 横切关注点"]
            CONSTANTS["常量管理<br/>🔧 统一常量"]
            CONTEXT["上下文管理<br/>🌐 租户上下文"]
            DECORATORS["装饰器<br/>🎨 元数据装饰"]
            ERROR["错误处理<br/>⚠️ 异常管理"]
            TESTING["测试工具<br/>🧪 测试支持"]
            UTILS["工具函数<br/>🛠️ 通用工具"]
        end
        
        subgraph "领域层 (Domain Layer)"
            ENTITIES["实体系统<br/>🏛️ 业务实体"]
            AGGREGATES["聚合根系统<br/>📦 聚合管理"]
            VALUE_OBJECTS["值对象系统<br/>💎 值对象"]
            DOMAIN_SERVICES["领域服务<br/>🔧 领域逻辑"]
            DOMAIN_EVENTS["领域事件<br/>📢 事件发布"]
            REPOSITORIES["仓储接口<br/>🗄️ 数据访问"]
            RULES["业务规则<br/>📋 规则引擎"]
            SECURITY["安全系统<br/>🔒 权限管理"]
            VALIDATION["验证系统<br/>✅ 数据验证"]
        end
        
        subgraph "应用层 (Application Layer)"
            USE_CASES["用例系统<br/>📋 业务用例"]
            CQRS["CQRS系统<br/>⚡ 命令查询分离"]
            PORTS["端口系统<br/>🔌 接口抽象"]
            HANDLERS["处理器系统<br/>⚙️ 业务处理"]
            SERVICES["应用服务<br/>🛠️ 应用逻辑"]
            EXPLORERS["探索器<br/>🔍 模块发现"]
        end
        
        subgraph "基础设施层 (Infrastructure Layer)"
            ADAPTERS["适配器系统<br/>🔌 技术适配"]
            FACTORIES["工厂系统<br/>🏭 服务创建"]
            MAPPERS["映射器系统<br/>🔄 对象映射"]
            COMMON_INFRA["通用基础设施<br/>🛠️ 基础组件"]
        end
        
        subgraph "类型定义层 (Types Layer)"
            TYPES["类型定义<br/>📝 接口类型"]
        end
    end
    
    subgraph "外部依赖"
        HL8_MODULES["HL8模块<br/>📦 基础设施模块"]
    end
    
    COMMON --> ENTITIES
    COMMON --> USE_CASES
    COMMON --> ADAPTERS
    
    ENTITIES --> AGGREGATES
    AGGREGATES --> DOMAIN_EVENTS
    DOMAIN_SERVICES --> AGGREGATES
    
    USE_CASES --> CQRS
    USE_CASES --> PORTS
    CQRS --> HANDLERS
    
    ADAPTERS --> HL8_MODULES
    FACTORIES --> ADAPTERS
    MAPPERS --> ADAPTERS
    
    style COMMON fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style ENTITIES fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style USE_CASES fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style ADAPTERS fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style HL8_MODULES fill:#ffebee,stroke:#d32f2f,stroke-width:2px
```

### 1.2 架构依赖关系

```mermaid
graph LR
    subgraph "依赖方向"
        DOMAIN["领域层<br/>🏛️ 无外部依赖"]
        APPLICATION["应用层<br/>📋 依赖领域层"]
        INFRASTRUCTURE["基础设施层<br/>🔌 实现应用层接口"]
        COMMON["通用功能层<br/>📋 横切关注点"]
    end
    
    APPLICATION --> DOMAIN
    INFRASTRUCTURE --> APPLICATION
    INFRASTRUCTURE --> DOMAIN
    COMMON --> DOMAIN
    COMMON --> APPLICATION
    COMMON --> INFRASTRUCTURE
    
    style DOMAIN fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style APPLICATION fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style INFRASTRUCTURE fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style COMMON fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
```

---

## 🏛️ 第二部分：领域层详细架构

### 2.1 领域层组件结构

```mermaid
graph TB
    subgraph "领域层 (Domain Layer)"
        subgraph "实体系统 (Entities)"
            BASE_ENTITY["BaseEntity<br/>🏛️ 基础实体类"]
            ENTITY_ID["EntityId<br/>🆔 实体标识符"]
            AUDIT_INFO["AuditInfo<br/>📝 审计信息"]
        end
        
        subgraph "聚合根系统 (Aggregates)"
            BASE_AGGREGATE["BaseAggregateRoot<br/>📦 基础聚合根"]
            AGGREGATE_DECORATORS["聚合根装饰器<br/>🎨 元数据装饰"]
            AGGREGATE_EXAMPLES["聚合根示例<br/>📚 学习参考"]
        end
        
        subgraph "值对象系统 (Value Objects)"
            VALUE_OBJECTS["值对象基类<br/>💎 值对象基础"]
            VALUE_OBJECT_TYPES["值对象类型<br/>📋 具体值对象"]
        end
        
        subgraph "领域服务系统 (Domain Services)"
            DOMAIN_SERVICE["领域服务基类<br/>🔧 领域服务基础"]
            DOMAIN_SERVICE_INTERFACES["领域服务接口<br/>📋 服务契约"]
        end
        
        subgraph "领域事件系统 (Domain Events)"
            BASE_DOMAIN_EVENT["BaseDomainEvent<br/>📢 基础领域事件"]
            DOMAIN_EVENT_TYPES["领域事件类型<br/>📋 具体事件"]
        end
        
        subgraph "仓储接口系统 (Repositories)"
            REPOSITORY_INTERFACES["仓储接口<br/>🗄️ 数据访问契约"]
            REPOSITORY_TYPES["仓储类型<br/>📋 具体仓储"]
        end
        
        subgraph "业务规则系统 (Business Rules)"
            BUSINESS_RULE_INTERFACES["业务规则接口<br/>📋 规则契约"]
            RULE_MANAGER["规则管理器<br/>🔧 规则管理"]
        end
        
        subgraph "安全系统 (Security)"
            SECURITY_INTERFACES["安全接口<br/>🔒 安全契约"]
            PERMISSION_MANAGER["权限管理器<br/>🔧 权限管理"]
        end
        
        subgraph "验证系统 (Validation)"
            VALIDATION_INTERFACES["验证接口<br/>✅ 验证契约"]
            VALIDATION_MANAGER["验证管理器<br/>🔧 验证管理"]
        end
    end
    
    BASE_ENTITY --> BASE_AGGREGATE
    ENTITY_ID --> BASE_ENTITY
    AUDIT_INFO --> BASE_ENTITY
    
    BASE_AGGREGATE --> BASE_DOMAIN_EVENT
    BASE_DOMAIN_EVENT --> DOMAIN_EVENT_TYPES
    
    DOMAIN_SERVICE --> DOMAIN_SERVICE_INTERFACES
    REPOSITORY_INTERFACES --> REPOSITORY_TYPES
    
    style BASE_ENTITY fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style BASE_AGGREGATE fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style BASE_DOMAIN_EVENT fill:#fff3e0,stroke:#f57c00,stroke-width:2px
```

### 2.2 领域层数据流

```mermaid
sequenceDiagram
    participant VO as 值对象
    participant E as 实体
    participant AR as 聚合根
    participant DS as 领域服务
    participant DE as 领域事件
    participant RI as 仓储接口
    
    Note over VO, RI: 领域层内部协作流程
    
    VO->>E: 1. 值对象被实体使用
    E->>AR: 2. 实体被聚合根管理
    AR->>DS: 3. 聚合根调用领域服务
    DS->>AR: 4. 领域服务返回结果
    AR->>DE: 5. 聚合根发布领域事件
    AR->>RI: 6. 聚合根通过仓储接口访问数据
    
    Note over VO, RI: 事件驱动流程
    DE->>DS: 7. 领域事件触发领域服务
    DS->>AR: 8. 领域服务更新聚合根
```

---

## 📋 第三部分：应用层详细架构

### 3.1 应用层组件结构

```mermaid
graph TB
    subgraph "应用层 (Application Layer)"
        subgraph "用例系统 (Use Cases)"
            BASE_USE_CASE["BaseUseCase<br/>📋 基础用例类"]
            TENANT_AWARE_USE_CASE["TenantAwareUseCase<br/>🏢 租户感知用例"]
            USE_CASE_INTERFACES["用例接口<br/>📋 用例契约"]
        end
        
        subgraph "CQRS系统 (CQRS)"
            COMMANDS["命令系统<br/>📝 写操作"]
            QUERIES["查询系统<br/>🔍 读操作"]
            EVENTS["事件系统<br/>📢 事件处理"]
            SAGAS["Saga系统<br/>🔄 长事务"]
            EVENT_STORE["事件存储<br/>📚 事件持久化"]
            BUS["CQRS总线<br/>🚌 消息路由"]
        end
        
        subgraph "端口系统 (Ports)"
            SHARED_PORTS["共享端口<br/>🔌 通用端口"]
            DOMAIN_PORTS["领域端口<br/>🏛️ 领域接口"]
            APPLICATION_PORTS["应用端口<br/>📋 应用接口"]
        end
        
        subgraph "处理器系统 (Handlers)"
            COMMAND_HANDLERS["命令处理器<br/>⚙️ 命令执行"]
            QUERY_HANDLERS["查询处理器<br/>📊 查询执行"]
            EVENT_HANDLERS["事件处理器<br/>📢 事件处理"]
        end
        
        subgraph "应用服务 (Application Services)"
            APPLICATION_SERVICES["应用服务<br/>🛠️ 应用逻辑"]
            SERVICE_INTERFACES["服务接口<br/>📋 服务契约"]
        end
        
        subgraph "探索器 (Explorers)"
            MODULE_EXPLORERS["模块探索器<br/>🔍 模块发现"]
            METADATA_EXPLORERS["元数据探索器<br/>📋 元数据发现"]
        end
    end
    
    BASE_USE_CASE --> TENANT_AWARE_USE_CASE
    BASE_USE_CASE --> USE_CASE_INTERFACES
    
    COMMANDS --> COMMAND_HANDLERS
    QUERIES --> QUERY_HANDLERS
    EVENTS --> EVENT_HANDLERS
    
    BUS --> COMMAND_HANDLERS
    BUS --> QUERY_HANDLERS
    BUS --> EVENT_HANDLERS
    
    SHARED_PORTS --> DOMAIN_PORTS
    SHARED_PORTS --> APPLICATION_PORTS
    
    style BASE_USE_CASE fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style COMMANDS fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style QUERIES fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style EVENTS fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style BUS fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

### 3.2 CQRS 数据流

```mermaid
sequenceDiagram
    participant UC as 用例
    participant CMD as 命令
    participant QRY as 查询
    participant BUS as CQRS总线
    participant CH as 命令处理器
    participant QH as 查询处理器
    participant ES as 事件存储
    participant MQ as 消息队列
    
    Note over UC, MQ: CQRS 执行流程
    
    UC->>QRY: 1. 创建查询
    UC->>BUS: 2. 执行查询
    BUS->>QH: 3. 路由到查询处理器
    QH-->>BUS: 4. 返回查询结果
    BUS-->>UC: 5. 返回查询结果
    
    UC->>CMD: 6. 创建命令
    UC->>BUS: 7. 执行命令
    BUS->>CH: 8. 路由到命令处理器
    CH->>ES: 9. 存储事件
    CH->>MQ: 10. 发布消息
    CH-->>BUS: 11. 返回命令结果
    BUS-->>UC: 12. 返回命令结果
```

---

## 🔌 第四部分：基础设施层详细架构

### 4.1 基础设施层组件结构

```mermaid
graph TB
    subgraph "基础设施层 (Infrastructure Layer)"
        subgraph "适配器系统 (Adapters)"
            PORT_ADAPTERS["端口适配器<br/>🔌 应用层端口适配"]
            REPOSITORY_ADAPTERS["仓储适配器<br/>🗄️ 领域层仓储适配"]
            SERVICE_ADAPTERS["服务适配器<br/>🔧 领域层服务适配"]
            EVENT_STORE_ADAPTERS["事件存储适配器<br/>📚 事件溯源适配"]
            MESSAGE_QUEUE_ADAPTERS["消息队列适配器<br/>📨 消息发布订阅适配"]
            CACHE_ADAPTERS["缓存适配器<br/>💾 多级缓存适配"]
            DATABASE_ADAPTERS["数据库适配器<br/>🗄️ 多数据库适配"]
        end
        
        subgraph "工厂系统 (Factories)"
            INFRASTRUCTURE_FACTORY["基础设施工厂<br/>🏭 基础设施服务管理"]
            PORT_ADAPTERS_FACTORY["端口适配器工厂<br/>🔌 端口适配器创建"]
            SERVICE_ADAPTERS_FACTORY["服务适配器工厂<br/>🔧 服务适配器创建"]
            EVENT_STORE_FACTORY["事件存储工厂<br/>📚 事件存储创建"]
            MESSAGE_QUEUE_FACTORY["消息队列工厂<br/>📨 消息队列创建"]
            CACHE_FACTORY["缓存工厂<br/>💾 缓存服务创建"]
            DATABASE_FACTORY["数据库工厂<br/>🗄️ 数据库服务创建"]
        end
        
        subgraph "映射器系统 (Mappers)"
            BASE_MAPPERS["基础映射器<br/>🔄 对象关系映射"]
            DTO_MAPPERS["DTO映射器<br/>📋 数据传输映射"]
            DOMAIN_MAPPERS["领域映射器<br/>🏛️ 领域对象映射"]
        end
        
        subgraph "通用基础设施 (Common Infrastructure)"
            BASE_INFRASTRUCTURE["基础基础设施<br/>🛠️ 基础设施基类"]
            INFRASTRUCTURE_MODULE["基础设施模块<br/>📦 模块管理"]
        end
    end
    
    subgraph "外部依赖"
        HL8_CACHE["@hl8/cache<br/>💾 缓存服务"]
        HL8_LOGGER["@hl8/logger<br/>📝 日志服务"]
        HL8_CONFIG["@hl8/config<br/>⚙️ 配置服务"]
        HL8_MESSAGING["@hl8/messaging<br/>📨 消息服务"]
        HL8_MULTI_TENANCY["@hl8/multi-tenancy<br/>🏢 多租户服务"]
        HL8_DATABASE["@hl8/database<br/>🗄️ 数据库服务"]
        HL8_FASTIFY_PRO["@hl8/fastify-pro<br/>🚀 Web框架"]
        HL8_COMMON["@hl8/common<br/>📦 通用服务"]
    end
    
    PORT_ADAPTERS --> HL8_LOGGER
    PORT_ADAPTERS --> HL8_CONFIG
    PORT_ADAPTERS --> HL8_MESSAGING
    
    REPOSITORY_ADAPTERS --> HL8_DATABASE
    SERVICE_ADAPTERS --> HL8_MULTI_TENANCY
    
    EVENT_STORE_ADAPTERS --> HL8_DATABASE
    MESSAGE_QUEUE_ADAPTERS --> HL8_MESSAGING
    CACHE_ADAPTERS --> HL8_CACHE
    DATABASE_ADAPTERS --> HL8_DATABASE
    
    INFRASTRUCTURE_FACTORY --> PORT_ADAPTERS_FACTORY
    INFRASTRUCTURE_FACTORY --> SERVICE_ADAPTERS_FACTORY
    INFRASTRUCTURE_FACTORY --> EVENT_STORE_FACTORY
    INFRASTRUCTURE_FACTORY --> MESSAGE_QUEUE_FACTORY
    INFRASTRUCTURE_FACTORY --> CACHE_FACTORY
    INFRASTRUCTURE_FACTORY --> DATABASE_FACTORY
    
    style PORT_ADAPTERS fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style REPOSITORY_ADAPTERS fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style SERVICE_ADAPTERS fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style EVENT_STORE_ADAPTERS fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style MESSAGE_QUEUE_ADAPTERS fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    style CACHE_ADAPTERS fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style DATABASE_ADAPTERS fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
```

### 4.2 基础设施层数据流

```mermaid
sequenceDiagram
    participant APP as 应用层
    participant PORT as 端口适配器
    participant REPO as 仓储适配器
    participant CACHE as 缓存适配器
    participant DB as 数据库适配器
    participant MQ as 消息队列适配器
    participant ES as 事件存储适配器
    
    Note over APP, ES: 基础设施层数据流
    
    APP->>PORT: 1. 调用端口适配器
    PORT->>CACHE: 2. 检查缓存
    CACHE-->>PORT: 3. 缓存结果
    
    alt 缓存未命中
        PORT->>REPO: 4. 调用仓储适配器
        REPO->>DB: 5. 查询数据库
        DB-->>REPO: 6. 返回数据
        REPO-->>PORT: 7. 返回结果
        PORT->>CACHE: 8. 更新缓存
    end
    
    PORT-->>APP: 9. 返回结果
    
    Note over APP, ES: 事件处理流程
    APP->>ES: 10. 存储事件
    ES->>MQ: 11. 发布消息
    MQ-->>ES: 12. 确认发布
    ES-->>APP: 13. 确认存储
```

---

## 🔧 第五部分：通用功能层详细架构

### 5.1 通用功能层组件结构

```mermaid
graph TB
    subgraph "通用功能层 (Common Layer)"
        subgraph "常量管理 (Constants)"
            ENTITY_CONSTANTS["实体常量<br/>🏛️ 实体操作常量"]
            USE_CASE_CONSTANTS["用例常量<br/>📋 用例错误常量"]
            TENANT_CONSTANTS["租户常量<br/>🏢 租户错误常量"]
            SAGA_CONSTANTS["Saga常量<br/>🔄 Saga状态常量"]
            METADATA_CONSTANTS["元数据常量<br/>📋 元数据键常量"]
        end
        
        subgraph "上下文管理 (Context)"
            CONTEXT_MANAGER["上下文管理器<br/>🌐 上下文管理"]
            CONTEXT_TYPES["上下文类型<br/>📋 上下文定义"]
        end
        
        subgraph "装饰器系统 (Decorators)"
            METADATA_DECORATORS["元数据装饰器<br/>🎨 元数据装饰"]
            VALIDATION_DECORATORS["验证装饰器<br/>✅ 验证装饰"]
            CACHE_DECORATORS["缓存装饰器<br/>💾 缓存装饰"]
        end
        
        subgraph "错误处理 (Error Handling)"
            ERROR_TYPES["错误类型<br/>⚠️ 错误分类"]
            ERROR_BUS["错误总线<br/>🚌 错误分发"]
            EXCEPTION_FILTER["异常过滤器<br/>🔍 异常处理"]
        end
        
        subgraph "测试工具 (Testing)"
            TEST_UTILITIES["测试工具<br/>🧪 测试支持"]
            MOCK_SERVICES["模拟服务<br/>🎭 服务模拟"]
            TEST_FIXTURES["测试夹具<br/>🔧 测试数据"]
        end
        
        subgraph "工具函数 (Utils)"
            UTILITY_FUNCTIONS["工具函数<br/>🛠️ 通用工具"]
            HELPER_FUNCTIONS["辅助函数<br/>🔧 辅助工具"]
        end
    end
    
    ENTITY_CONSTANTS --> USE_CASE_CONSTANTS
    USE_CASE_CONSTANTS --> TENANT_CONSTANTS
    TENANT_CONSTANTS --> SAGA_CONSTANTS
    SAGA_CONSTANTS --> METADATA_CONSTANTS
    
    CONTEXT_MANAGER --> CONTEXT_TYPES
    METADATA_DECORATORS --> VALIDATION_DECORATORS
    VALIDATION_DECORATORS --> CACHE_DECORATORS
    
    ERROR_TYPES --> ERROR_BUS
    ERROR_BUS --> EXCEPTION_FILTER
    
    style ENTITY_CONSTANTS fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style CONTEXT_MANAGER fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style METADATA_DECORATORS fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style ERROR_TYPES fill:#ffebee,stroke:#d32f2f,stroke-width:2px
    style TEST_UTILITIES fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style UTILITY_FUNCTIONS fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
```

---

## 🔄 第六部分：混合架构数据流

### 6.1 完整的数据流图

```mermaid
sequenceDiagram
    participant CLIENT as 客户端
    participant INTERFACE as 接口层
    participant USE_CASE as 用例
    participant COMMAND as 命令
    participant QUERY as 查询
    participant AGGREGATE as 聚合根
    participant ENTITY as 实体
    participant DOMAIN_EVENT as 领域事件
    participant REPOSITORY as 仓储
    participant EVENT_STORE as 事件存储
    participant MESSAGE_QUEUE as 消息队列
    participant CACHE as 缓存
    participant DATABASE as 数据库
    
    Note over CLIENT, DATABASE: 混合架构完整数据流
    
    CLIENT->>INTERFACE: 1. 发送请求
    INTERFACE->>USE_CASE: 2. 调用用例
    
    alt 查询操作
        USE_CASE->>QUERY: 3a. 创建查询
        QUERY->>CACHE: 4a. 检查缓存
        alt 缓存命中
            CACHE-->>QUERY: 5a. 返回缓存数据
        else 缓存未命中
            QUERY->>REPOSITORY: 6a. 调用仓储
            REPOSITORY->>DATABASE: 7a. 查询数据库
            DATABASE-->>REPOSITORY: 8a. 返回数据
            REPOSITORY-->>QUERY: 9a. 返回结果
            QUERY->>CACHE: 10a. 更新缓存
        end
        QUERY-->>USE_CASE: 11a. 返回查询结果
    else 命令操作
        USE_CASE->>COMMAND: 3b. 创建命令
        COMMAND->>AGGREGATE: 4b. 调用聚合根
        AGGREGATE->>ENTITY: 5b. 更新实体
        ENTITY-->>AGGREGATE: 6b. 返回结果
        AGGREGATE->>DOMAIN_EVENT: 7b. 发布领域事件
        AGGREGATE-->>COMMAND: 8b. 返回结果
        COMMAND->>EVENT_STORE: 9b. 存储事件
        EVENT_STORE->>MESSAGE_QUEUE: 10b. 发布消息
        EVENT_STORE-->>COMMAND: 11b. 确认存储
        COMMAND-->>USE_CASE: 12b. 返回命令结果
    end
    
    USE_CASE-->>INTERFACE: 13. 返回用例结果
    INTERFACE-->>CLIENT: 14. 返回响应
    
    Note over CLIENT, DATABASE: 事件驱动处理
    MESSAGE_QUEUE->>USE_CASE: 15. 触发事件处理
    USE_CASE->>AGGREGATE: 16. 更新聚合根
    AGGREGATE->>REPOSITORY: 17. 持久化数据
    REPOSITORY->>DATABASE: 18. 存储数据
```

### 6.2 架构模式集成

```mermaid
graph TB
    subgraph "混合架构模式集成"
        subgraph "Clean Architecture"
            CA_DOMAIN["领域层<br/>🏛️ 业务逻辑"]
            CA_APPLICATION["应用层<br/>📋 用例编排"]
            CA_INFRASTRUCTURE["基础设施层<br/>🔌 技术实现"]
        end
        
        subgraph "DDD (Domain-Driven Design)"
            DDD_ENTITIES["实体<br/>🏛️ 业务实体"]
            DDD_AGGREGATES["聚合根<br/>📦 聚合管理"]
            DDD_DOMAIN_SERVICES["领域服务<br/>🔧 领域逻辑"]
            DDD_DOMAIN_EVENTS["领域事件<br/>📢 事件发布"]
        end
        
        subgraph "CQRS (Command Query Responsibility Segregation)"
            CQRS_COMMANDS["命令端<br/>📝 写操作"]
            CQRS_QUERIES["查询端<br/>🔍 读操作"]
            CQRS_BUS["CQRS总线<br/>🚌 消息路由"]
        end
        
        subgraph "ES (Event Sourcing)"
            ES_EVENT_STORE["事件存储<br/>📚 事件持久化"]
            ES_EVENT_REPLAY["事件重放<br/>🔄 状态重建"]
            ES_SNAPSHOTS["快照<br/>📸 性能优化"]
        end
        
        subgraph "EDA (Event-Driven Architecture)"
            EDA_EVENTS["事件<br/>📢 事件驱动"]
            EDA_MESSAGE_QUEUE["消息队列<br/>📨 异步处理"]
            EDA_EVENT_HANDLERS["事件处理器<br/>⚙️ 事件处理"]
        end
    end
    
    CA_DOMAIN --> DDD_ENTITIES
    CA_DOMAIN --> DDD_AGGREGATES
    CA_DOMAIN --> DDD_DOMAIN_SERVICES
    CA_DOMAIN --> DDD_DOMAIN_EVENTS
    
    CA_APPLICATION --> CQRS_COMMANDS
    CA_APPLICATION --> CQRS_QUERIES
    CA_APPLICATION --> CQRS_BUS
    
    CA_INFRASTRUCTURE --> ES_EVENT_STORE
    CA_INFRASTRUCTURE --> ES_EVENT_REPLAY
    CA_INFRASTRUCTURE --> ES_SNAPSHOTS
    
    CA_INFRASTRUCTURE --> EDA_MESSAGE_QUEUE
    CA_INFRASTRUCTURE --> EDA_EVENT_HANDLERS
    
    DDD_DOMAIN_EVENTS --> EDA_EVENTS
    EDA_EVENTS --> EDA_MESSAGE_QUEUE
    EDA_MESSAGE_QUEUE --> EDA_EVENT_HANDLERS
    
    CQRS_BUS --> ES_EVENT_STORE
    ES_EVENT_STORE --> EDA_MESSAGE_QUEUE
    
    style CA_DOMAIN fill:#e3f2fd,stroke:#1976d2,stroke-width:3px
    style CA_APPLICATION fill:#fff3e0,stroke:#f57c00,stroke-width:3px
    style CA_INFRASTRUCTURE fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px
    style DDD_ENTITIES fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style CQRS_COMMANDS fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
    style ES_EVENT_STORE fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    style EDA_EVENTS fill:#f1f8e9,stroke:#558b2f,stroke-width:2px
```

---

## 🎯 第七部分：架构优势

### 7.1 架构优势总结

```mermaid
graph TB
    subgraph "混合架构优势"
        subgraph "Clean Architecture 优势"
            CA_MAINTAINABILITY["可维护性<br/>🔧 清晰的依赖关系"]
            CA_TESTABILITY["可测试性<br/>🧪 易于单元测试"]
            CA_FLEXIBILITY["灵活性<br/>🔄 易于扩展和修改"]
        end
        
        subgraph "DDD 优势"
            DDD_BUSINESS_FOCUS["业务聚焦<br/>🎯 以业务为中心"]
            DDD_UBIQUITOUS_LANGUAGE["通用语言<br/>💬 业务与技术统一"]
            DDD_DOMAIN_EXPERTISE["领域专家<br/>👥 业务专家参与"]
        end
        
        subgraph "CQRS 优势"
            CQRS_SCALABILITY["可扩展性<br/>📈 读写分离优化"]
            CQRS_PERFORMANCE["性能优化<br/>⚡ 独立优化读写"]
            CQRS_FLEXIBILITY["灵活性<br/>🔄 独立演化读写模型"]
        end
        
        subgraph "ES 优势"
            ES_AUDIT_TRAIL["审计跟踪<br/>📝 完整的事件历史"]
            ES_TEMPORAL_QUERIES["时间查询<br/>⏰ 历史状态查询"]
            ES_DEBUGGING["调试能力<br/>🔍 事件重放调试"]
        end
        
        subgraph "EDA 优势"
            EDA_LOOSE_COUPLING["松耦合<br/>🔗 组件间松耦合"]
            EDA_ASYNC_PROCESSING["异步处理<br/>⚡ 异步事件处理"]
            EDA_SCALABILITY["可扩展性<br/>📈 水平扩展能力"]
        end
    end
    
    style CA_MAINTAINABILITY fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style DDD_BUSINESS_FOCUS fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style CQRS_SCALABILITY fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style ES_AUDIT_TRAIL fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style EDA_LOOSE_COUPLING fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
```

### 7.2 技术栈集成

```mermaid
graph TB
    subgraph "技术栈集成"
        subgraph "核心框架"
            NESTJS["NestJS<br/>🚀 Node.js框架"]
            TYPESCRIPT["TypeScript<br/>📝 类型安全"]
            PNPM["pnpm<br/>📦 包管理"]
        end
        
        subgraph "数据存储"
            POSTGRESQL["PostgreSQL<br/>🐘 关系型数据库"]
            MONGODB["MongoDB<br/>🍃 文档型数据库"]
            REDIS["Redis<br/>💾 缓存数据库"]
        end
        
        subgraph "消息队列"
            RABBITMQ["RabbitMQ<br/>🐰 消息队列"]
            KAFKA["Kafka<br/>📨 流处理"]
        end
        
        subgraph "监控和日志"
            PINO["Pino<br/>📝 日志记录"]
            PROMETHEUS["Prometheus<br/>📊 监控指标"]
            GRAFANA["Grafana<br/>📈 可视化"]
        end
        
        subgraph "测试框架"
            JEST["Jest<br/>🧪 测试框架"]
            CYPRESS["Cypress<br/>🌐 E2E测试"]
        end
    end
    
    NESTJS --> TYPESCRIPT
    TYPESCRIPT --> PNPM
    
    POSTGRESQL --> MONGODB
    MONGODB --> REDIS
    
    RABBITMQ --> KAFKA
    
    PINO --> PROMETHEUS
    PROMETHEUS --> GRAFANA
    
    JEST --> CYPRESS
    
    style NESTJS fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style POSTGRESQL fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    style RABBITMQ fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    style PINO fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style JEST fill:#e1f5fe,stroke:#0277bd,stroke-width:2px
```

---

## 📚 第八部分：使用指南

### 8.1 模块导入指南

```typescript
// 导入领域层组件
import { 
  BaseEntity, 
  BaseAggregateRoot, 
  BaseDomainEvent,
  EntityId 
} from '@hl8/hybrid-archi/domain';

// 导入应用层组件
import { 
  BaseUseCase, 
  TenantAwareUseCase 
} from '@hl8/hybrid-archi/application';

// 导入基础设施层组件
import { 
  CacheAdapter, 
  DatabaseAdapter, 
  EventStoreAdapter,
  MessageQueueAdapter 
} from '@hl8/hybrid-archi/infrastructure';

// 导入通用功能组件
import { 
  ENTITY_OPERATIONS, 
  USE_CASE_ERROR_CODES 
} from '@hl8/hybrid-archi/common';
```

### 8.2 基础使用示例

```typescript
// 创建实体
class User extends BaseEntity {
  constructor(
    id: EntityId,
    private name: string,
    private email: string,
    auditInfo: Partial<IAuditInfo>
  ) {
    super(id, auditInfo);
  }
  
  updateName(newName: string): void {
    this.name = newName;
    this.updateTimestamp();
  }
}

// 创建用例
class CreateUserUseCase extends BaseUseCase<CreateUserRequest, CreateUserResponse> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IDomainEventBus
  ) {
    super('CreateUser', '创建用户用例');
  }
  
  protected async executeUseCase(
    request: CreateUserRequest,
    context: IUseCaseContext
  ): Promise<CreateUserResponse> {
    const user = new User(
      EntityId.generate(),
      request.name,
      request.email,
      { createdBy: context.userId, tenantId: context.tenantId }
    );
    
    await this.userRepository.save(user);
    return new CreateUserResponse(user.id);
  }
}

// 使用基础设施适配器
const cacheAdapter = new CacheAdapter(cacheService, logger);
const databaseAdapter = new DatabaseAdapter(databaseService, logger);
const eventStoreAdapter = new EventStoreAdapter(databaseService, cacheService, logger);
```

---

## 🎯 总结

### 架构特点

1. **分层清晰**: Clean Architecture 分层明确，依赖方向正确
2. **职责分离**: CQRS 命令查询分离，职责清晰
3. **事件驱动**: 完整的事件驱动架构，支持异步处理
4. **充血模型**: DDD 充血模型实现，业务逻辑内聚
5. **事件溯源**: 完整的事件溯源支持，审计跟踪
6. **通用组件**: 提供通用的架构模式和基础组件
7. **模块集成**: 与现有 `@hl8/*` 模块深度集成

### 技术优势

- ✅ **可维护性**: 清晰的架构分层和依赖关系
- ✅ **可扩展性**: 支持水平扩展和垂直扩展
- ✅ **可测试性**: 完整的测试支持和模拟能力
- ✅ **性能优化**: 多级缓存和异步处理
- ✅ **业务聚焦**: 以业务为中心的架构设计
- ✅ **技术无关**: 技术实现与业务逻辑分离

### 适用场景

- 🏢 **企业级应用**: 复杂业务逻辑的企业应用
- 🔄 **微服务架构**: 分布式微服务系统
- 📈 **高并发系统**: 需要高性能和高并发的系统
- 🎯 **业务复杂系统**: 业务逻辑复杂的领域系统
- 🔍 **审计要求系统**: 需要完整审计跟踪的系统

`packages/hybrid-archi` 模块为业务模块的开发提供了完整的混合架构支持，是构建高质量、可维护、可扩展业务系统的理想选择。
