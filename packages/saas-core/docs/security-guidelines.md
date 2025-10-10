# 安全加固指南

> SAAS Core 模块的安全最佳实践和加固措施

## 🛡️ 安全架构

### 多层防护体系

```
┌─────────────────────────────────────┐
│  API 层安全                          │
│  - 速率限制                          │
│  - 输入验证                          │
│  - XSS 防护                          │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│  认证授权层                          │
│  - JWT 令牌验证                      │
│  - 权限检查（CASL）                  │
│  - 租户上下文验证                    │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│  业务逻辑层                          │
│  - 业务规则验证                      │
│  - 配额检查                          │
│  - 状态机验证                        │
└──────────────┬──────────────────────┘
               │
┌──────────────┴──────────────────────┐
│  数据层安全                          │
│  - 租户数据隔离                      │
│  - SQL 注入防护                      │
│  - 审计日志                          │
└─────────────────────────────────────┘
```

## 🔐 输入验证

### 1. 使用 class-validator

所有 DTO 都应该添加验证规则：

```typescript
import { IsString, IsEmail, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9-]+$/, {
    message: '租户代码只能包含小写字母、数字和连字符',
  })
  code!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9.-]+\.[a-z]{2,}$/, {
    message: '域名格式不正确',
  })
  domain!: string;

  @IsEnum(TenantType)
  type!: TenantType;
}
```

### 2. 值对象验证

在值对象中实现严格的业务规则验证：

```typescript
export class TenantCode extends ValueObject<string> {
  protected validate(value: string): void {
    // 长度验证
    if (value.length < 3 || value.length > 20) {
      throw new DomainError('租户代码长度必须在3-20个字符之间');
    }

    // 格式验证
    if (!/^[a-z0-9-]+$/.test(value)) {
      throw new DomainError('租户代码只能包含小写字母、数字和连字符');
    }

    // 业务规则验证
    if (value.startsWith('-') || value.endsWith('-')) {
      throw new DomainError('租户代码不能以连字符开头或结尾');
    }

    // 保留词检查
    const reserved = ['admin', 'api', 'www', 'system'];
    if (reserved.includes(value)) {
      throw new DomainError('租户代码不能使用保留词');
    }
  }
}
```

### 3. SQL 注入防护

MikroORM 自动提供参数化查询，防止 SQL 注入：

```typescript
// ✅ 安全：参数化查询
const user = await this.em.findOne(UserOrmEntity, {
  username: userInput, // 自动转义
});

// ❌ 危险：原始 SQL（仅在必要时使用）
const result = await this.em.getConnection().execute(
  `SELECT * FROM users WHERE username = '${userInput}'` // SQL 注入风险
);

// ✅ 安全：使用参数化原始 SQL
const result = await this.em.getConnection().execute(
  'SELECT * FROM users WHERE username = $1',
  [userInput]
);
```

## 🚦 速率限制

### 1. 全局速率限制

```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,      // 时间窗口（秒）
      limit: 100,   // 最大请求数
    }),
  ],
})
export class SaasCoreModule {}
```

### 2. 路由级别限制

```typescript
import { Throttle } from '@nestjs/throttler';

@Controller('api/auth')
export class AuthController {
  @Post('login')
  @Throttle(5, 60) // 每分钟最多5次登录尝试
  async login(@Body() data: LoginDto) {
    return await this.authService.login(data);
  }

  @Post('register')
  @Throttle(3, 3600) // 每小时最多3次注册
  async register(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }
}
```

### 3. 基于租户的限制

```typescript
@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

    if (!tenantId) {
      return true;
    }

    // 获取租户配额
    const tenant = await this.tenantRepository.findById(tenantId);
    const quota = tenant.getQuota();

    // 检查今日 API 调用次数
    const todayCalls = await this.redis.incr(`tenant:${tenantId}:api:calls`);
    
    if (todayCalls === 1) {
      // 设置过期时间（到明天0点）
      await this.redis.expireAt(
        `tenant:${tenantId}:api:calls`,
        this.getTomorrowMidnight()
      );
    }

    if (todayCalls > quota.maxApiCallsPerDay) {
      throw new TooManyRequestsException('已达到今日API调用限制');
    }

    return true;
  }
}
```

## 🔒 认证和授权

### 1. JWT 令牌安全

```typescript
// JWT 配置
{
  secret: process.env.JWT_SECRET, // 使用强密钥
  expiresIn: '7d',                // 合理的过期时间
  algorithm: 'HS256',             // 安全的算法
}

// 刷新令牌策略
{
  accessToken: {
    expiresIn: '15m',  // 短期访问令牌
  },
  refreshToken: {
    expiresIn: '7d',   // 长期刷新令牌
  },
}
```

### 2. 密码安全

```typescript
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  async hash(password: string): Promise<string> {
    // 生成盐并哈希密码
    return await bcrypt.hash(password, this.saltRounds);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  validatePasswordStrength(password: string): boolean {
    // 至少8个字符
    if (password.length < 8) {
      throw new BadRequestException('密码长度至少8个字符');
    }

    // 包含大小写字母、数字和特殊字符
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      throw new BadRequestException(
        '密码必须包含大小写字母、数字和特殊字符'
      );
    }

    return true;
  }
}
```

### 3. 会话管理

```typescript
@Injectable()
export class SessionService {
  async createSession(userId: string, tenantId: string) {
    const sessionId = uuid();
    const session = {
      userId,
      tenantId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    // 存储到 Redis
    await this.redis.set(
      `session:${sessionId}`,
      JSON.stringify(session),
      'EX',
      7 * 24 * 60 * 60
    );

    return sessionId;
  }

  async validateSession(sessionId: string) {
    const session = await this.redis.get(`session:${sessionId}`);
    
    if (!session) {
      throw new UnauthorizedException('会话已过期');
    }

    return JSON.parse(session);
  }

  async revokeSession(sessionId: string) {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

## 🛡️ 数据安全

### 1. 租户数据隔离

```typescript
// 自动应用租户过滤器
@Injectable()
export class TenantAwareService {
  async getData(@CurrentTenant() tenantId: string) {
    // 查询自动过滤当前租户数据
    return await this.em.find(DataEntity, {});
  }

  async getCrossTenantData() {
    // 必须显式声明跨租户访问
    if (!this.currentUser.isPlatformAdmin()) {
      throw new ForbiddenException('无权跨租户访问');
    }

    return await this.em.find(
      DataEntity,
      {},
      { filters: { tenant: false } }
    );
  }
}
```

### 2. 敏感数据脱敏

```typescript
@Injectable()
export class DataMaskingService {
  maskEmail(email: string): string {
    const [name, domain] = email.split('@');
    const maskedName = name.charAt(0) + '***' + name.charAt(name.length - 1);
    return `${maskedName}@${domain}`;
  }

  maskPhone(phone: string): string {
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  maskBankCard(card: string): string {
    return card.replace(/(\d{4})\d{8}(\d{4})/, '$1 **** **** $2');
  }
}

// 在响应 DTO 中应用
export class UserResponseDto {
  @Transform(({ value, obj }) => {
    return obj.isSensitive 
      ? maskEmail(value)
      : value;
  })
  email!: string;
}
```

### 3. 审计日志

```typescript
@Injectable()
export class AuditService {
  async log(event: AuditEvent) {
    const auditLog = {
      id: uuid(),
      timestamp: new Date(),
      userId: event.userId,
      tenantId: event.tenantId,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      changes: event.changes,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    };

    // 存储到数据库
    await this.em.persistAndFlush(auditLog);

    // 敏感操作额外记录到文件
    if (this.isSensitiveAction(event.action)) {
      this.logger.warn('[Sensitive Operation]', auditLog);
    }
  }

  private isSensitiveAction(action: string): boolean {
    return [
      'CROSS_TENANT_ACCESS',
      'PRIVILEGE_ESCALATION',
      'DATA_EXPORT',
      'USER_DELETE',
      'TENANT_DELETE',
    ].includes(action);
  }
}
```

## 🔍 XSS 防护

### 1. 输出转义

```typescript
import { sanitize } from 'class-sanitizer';

export class CreateCommentDto {
  @IsString()
  @sanitize()  // 自动清理 HTML 标签
  content!: string;
}

// 或手动清理
import * as xss from 'xss';

@Injectable()
export class CommentService {
  async createComment(data: CreateCommentDto) {
    const sanitizedContent = xss(data.content);
    // 使用清理后的内容
  }
}
```

### 2. Content Security Policy

```typescript
import helmet from '@fastify/helmet';

app.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});
```

## 🚫 CSRF 防护

### 1. CSRF 令牌

```typescript
import { CsrfProtection } from '@nestjs/platform-fastify';

@Controller('api/tenants')
@UseGuards(CsrfProtection)
export class TenantController {
  @Post()
  async createTenant(@Body() data: CreateTenantDto) {
    // CSRF 令牌自动验证
  }
}
```

### 2. SameSite Cookie

```typescript
app.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {
    sameSite: 'strict',
    secure: true,
    httpOnly: true,
  },
});
```

## 🔑 访问控制

### 1. 最小权限原则

```typescript
// 默认拒绝，显式授权
const { can, cannot, build } = new AbilityBuilder<AppAbility>(Ability);

// 用户只能操作自己的数据
can('read', 'User', { id: user.id });
can('update', 'User', { id: user.id });

// 管理员可以操作本租户的数据
if (user.isAdmin()) {
  can('manage', 'User', { tenantId: user.tenantId });
}

// 平台管理员拥有所有权限
if (user.isPlatformAdmin()) {
  can('manage', 'all');
}
```

### 2. 资源所有权验证

```typescript
@Injectable()
export class ResourceOwnershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = request.params.id;

    // 获取资源
    const resource = await this.resourceRepository.findById(resourceId);

    // 验证所有权
    if (resource.tenantId !== user.tenantId) {
      throw new ForbiddenException('无权访问其他租户的资源');
    }

    if (resource.createdBy !== user.id && !user.isAdmin()) {
      throw new ForbiddenException('无权访问他人创建的资源');
    }

    return true;
  }
}
```

## 📝 安全检查清单

### API 层安全

- [X] 输入验证（class-validator）
- [X] 输出转义（防XSS）
- [X] 速率限制（防DDoS）
- [ ] CORS 配置
- [ ] CSRF 防护
- [ ] 请求体大小限制
- [ ] 响应头安全配置（helmet）

### 认证授权

- [X] JWT 令牌验证
- [X] 密码加密（bcrypt）
- [X] 会话管理
- [ ] 多因素认证（MFA）
- [ ] 设备指纹识别
- [ ] 异常登录检测

### 数据安全

- [X] 租户数据隔离
- [X] SQL 注入防护
- [X] 敏感数据脱敏
- [X] 审计日志
- [ ] 数据加密（静态加密）
- [ ] 传输加密（TLS）
- [ ] 数据备份加密

### 业务安全

- [X] 配额检查
- [X] 状态机验证
- [X] 业务规则验证
- [ ] 防刷机制
- [ ] 异常检测
- [ ] 风险评分

## ⚠️ 常见安全陷阱

### 1. 绕过租户隔离

```typescript
// ❌ 危险：允许用户指定租户ID
@Post('users')
async createUser(@Body() data: { tenantId: string, ...}) {
  // 用户可以创建其他租户的用户！
}

// ✅ 安全：从令牌中提取租户ID
@Post('users')
async createUser(
  @Body() data: CreateUserDto,
  @CurrentTenant() tenantId: string,
) {
  // 租户ID来自认证令牌，无法伪造
}
```

### 2. 权限检查不足

```typescript
// ❌ 危险：仅检查认证
@Get('admin/users')
@UseGuards(JwtAuthGuard)
async getAllUsers() {
  // 任何登录用户都可以访问！
}

// ✅ 安全：同时检查权限
@Get('admin/users')
@UseGuards(JwtAuthGuard, AbilityGuard)
@CheckAbility({ action: 'read', subject: 'User' })
async getAllUsers() {
  // 只有有权限的用户可以访问
}
```

### 3. 信息泄露

```typescript
// ❌ 危险：暴露详细错误信息
@Post('login')
async login(@Body() data: LoginDto) {
  const user = await this.userRepository.findByUsername(data.username);
  
  if (!user) {
    throw new NotFoundException('用户不存在'); // 信息泄露
  }
  
  if (!await user.verifyPassword(data.password)) {
    throw new BadRequestException('密码错误'); // 信息泄露
  }
}

// ✅ 安全：使用统一的错误消息
@Post('login')
async login(@Body() data: LoginDto) {
  const user = await this.userRepository.findByUsername(data.username);
  
  if (!user || !await user.verifyPassword(data.password)) {
    throw new UnauthorizedException('用户名或密码错误'); // 不泄露具体原因
  }
}
```

### 4. 批量操作风险

```typescript
// ❌ 危险：无限制的批量操作
@Delete('users/batch')
async batchDelete(@Body() ids: string[]) {
  // 恶意用户可以一次删除所有用户！
}

// ✅ 安全：限制批量操作数量
@Delete('users/batch')
async batchDelete(@Body() ids: string[]) {
  if (ids.length > 100) {
    throw new BadRequestException('一次最多删除100个用户');
  }
  
  // 验证所有ID的所有权
  for (const id of ids) {
    await this.verifyOwnership(id);
  }
}
```

## 🚨 安全事件响应

### 1. 异常登录检测

```typescript
@Injectable()
export class LoginAnomalyDetector {
  async detectAnomaly(loginEvent: LoginEvent): Promise<boolean> {
    const userId = loginEvent.userId;

    // 检查登录频率
    const recentLogins = await this.getRecentLogins(userId, 3600);
    if (recentLogins.length > 10) {
      return true; // 异常：1小时内登录超过10次
    }

    // 检查IP变化
    const lastLogin = await this.getLastLogin(userId);
    if (lastLogin && lastLogin.ipAddress !== loginEvent.ipAddress) {
      // IP变化，发送通知
      await this.notifyUser(userId, '检测到异常登录');
    }

    // 检查设备指纹
    if (lastLogin && lastLogin.deviceFingerprint !== loginEvent.deviceFingerprint) {
      return true; // 异常：设备变化
    }

    return false;
  }
}
```

### 2. 暴力破解防护

```typescript
@Injectable()
export class BruteForceProtection {
  async recordFailedLogin(username: string, ip: string) {
    const key = `failed:${username}:${ip}`;
    const attempts = await this.redis.incr(key);

    if (attempts === 1) {
      await this.redis.expire(key, 3600); // 1小时过期
    }

    if (attempts >= 5) {
      // 锁定账户1小时
      await this.lockAccount(username, 3600);
      throw new TooManyRequestsException('登录失败次数过多，账户已锁定1小时');
    }
  }

  async clearFailedAttempts(username: string, ip: string) {
    await this.redis.del(`failed:${username}:${ip}`);
  }
}
```

## 📊 安全监控

### 1. 关键指标

```typescript
@Injectable()
export class SecurityMetrics {
  @Cron('*/5 * * * *') // 每5分钟
  async collectMetrics() {
    const metrics = {
      // 登录失败率
      failedLoginRate: await this.getFailedLoginRate(),
      
      // 异常登录数
      anomalyCount: await this.getAnomalyCount(),
      
      // 权限拒绝数
      permissionDenials: await this.getPermissionDenials(),
      
      // API 速率限制触发数
      rateLimitHits: await this.getRateLimitHits(),
    };

    // 发送到监控系统
    await this.metricsService.report(metrics);

    // 触发告警
    if (metrics.failedLoginRate > 0.1) {
      await this.alertService.trigger('HIGH_FAILED_LOGIN_RATE');
    }
  }
}
```

### 2. 安全日志

```typescript
@Injectable()
export class SecurityLogger {
  async logSecurityEvent(event: SecurityEvent) {
    const log = {
      timestamp: new Date(),
      level: event.level, // INFO, WARNING, CRITICAL
      type: event.type,   // LOGIN, PERMISSION_DENIED, etc.
      userId: event.userId,
      tenantId: event.tenantId,
      details: event.details,
      ipAddress: event.ipAddress,
    };

    // 记录到专用的安全日志
    await this.securityLogRepository.save(log);

    // 关键事件立即告警
    if (event.level === 'CRITICAL') {
      await this.alertService.sendImmediate(log);
    }
  }
}
```

## 🔧 配置建议

### 生产环境配置

```typescript
// .env.production
NODE_ENV=production

# JWT 配置
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# 密码策略
PASSWORD_MIN_LENGTH=12
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_HISTORY_COUNT=5

# 速率限制
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT=5

# 会话配置
SESSION_TIMEOUT=1800  # 30分钟
SESSION_MAX_AGE=86400 # 24小时

# 安全策略
ENABLE_CORS=false
CORS_ALLOWED_ORIGINS=https://yourdomain.com
ENABLE_HELMET=true
ENABLE_CSRF=true
```

## 📚 参考资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS 安全最佳实践](https://docs.nestjs.com/security/authentication)
- [CASL 权限控制](https://casl.js.org/v6/en/)
- [MikroORM 安全指南](https://mikro-orm.io/docs/security)

---

**最后更新**: 2025-10-10  
**维护者**: SAAS Core Team  
**安全级别**: ⭐⭐⭐⭐⭐
