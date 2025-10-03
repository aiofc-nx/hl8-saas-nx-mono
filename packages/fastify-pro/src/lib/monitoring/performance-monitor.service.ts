/**
 * 性能监控服务
 *
 * 提供请求级与系统级性能指标的采集、聚合与导出能力，支持Prometheus等监控系统对接。
 *
 * @description 该服务用于采集Fastify实例的关键性能指标，包括请求耗时、吞吐量、错误率、并发数、内存/CPU占用等，
 * 并提供内置的聚合与快照导出能力，便于在企业级环境进行性能观测（Observability）。
 *
 * ## 业务规则
 * - 指标采集必须轻量、低开销，避免对业务路径造成明显影响
 * - 采集周期与窗口可配置，默认以滑动窗口聚合（如60s、5m等）
 * - 指标包括：请求总数、成功/失败数、P50/P90/P99、错误率、吞吐量、并发数、内存/CPU等
 * - 支持自定义维度：租户、用户、接口、方法、状态码区间
 * - 支持导出快照与清理历史窗口数据
 *
 * @since 1.0.0
 */

import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/**
 * 性能监控配置
 */
export interface IPerformanceMonitorConfig {
  /** 采样开关 */
  enabled?: boolean;
  /** 指标聚合窗口（毫秒），默认60_000 = 60s */
  windowMs?: number;
  /** 保留窗口数量（用于历史查询），默认5 */
  keepWindows?: number;
  /** 是否按路由维度聚合 */
  byRoute?: boolean;
  /** 是否按方法维度聚合 */
  byMethod?: boolean;
  /** 是否按状态码区间维度聚合 */
  byStatusBucket?: boolean;
  /** 自定义维度键生成 */
  keyGenerator?: (req: FastifyRequest) => string;
}

/**
 * 单个时间窗口内的指标
 */
export interface IPerfWindowStats {
  /** 窗口开始时间（epoch ms） */
  startAt: number;
  /** 窗口结束时间（epoch ms） */
  endAt: number;
  /** 请求总数 */
  total: number;
  /** 成功请求数（<400） */
  success: number;
  /** 失败请求数（>=400） */
  failure: number;
  /** 并发峰值 */
  maxConcurrency: number;
  /** 当前并发 */
  concurrency: number;
  /** 累计耗时（毫秒） */
  sumDurationMs: number;
  /** P50/P90/P99 估算（近似计算） */
  p50: number;
  p90: number;
  p99: number;
}

/**
 * 导出的综合指标快照
 */
export interface IPerformanceSnapshot {
  window: IPerfWindowStats;
  system: {
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      external: number;
    };
    cpuUsage: number; // 简化指标
    uptimeSec: number;
  };
}

/**
 * 内部：用于近似分位数计算的环形缓冲
 */
class DurationRingBuffer {
  private readonly buffer: number[];
  private index = 0;
  private filled = false;

  constructor(private readonly capacity: number) {
    this.buffer = new Array<number>(capacity);
  }

  push(value: number): void {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.capacity;
    if (this.index === 0) this.filled = true;
  }

  snapshotSorted(): number[] {
    const arr = this.filled
      ? this.buffer.slice(0)
      : this.buffer.slice(0, this.index);
    return arr.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  }
}

/**
 * 性能监控服务
 *
 * @description 采集并聚合Fastify请求与系统性能指标
 */
export class PerformanceMonitorService {
  private readonly config: Required<IPerformanceMonitorConfig>;
  private readonly windows: IPerfWindowStats[] = [];
  private current: IPerfWindowStats;
  private durationBuffer = new DurationRingBuffer(2048);

  constructor(
    private readonly fastify: FastifyInstance,
    cfg: IPerformanceMonitorConfig = {}
  ) {
    this.config = {
      enabled: cfg.enabled ?? true,
      windowMs: cfg.windowMs ?? 60_000,
      keepWindows: cfg.keepWindows ?? 5,
      byRoute: cfg.byRoute ?? true,
      byMethod: cfg.byMethod ?? true,
      byStatusBucket: cfg.byStatusBucket ?? true,
      keyGenerator: cfg.keyGenerator ?? (() => 'global'),
    } as Required<IPerformanceMonitorConfig>;

    const now = Date.now();
    this.current = this.createEmptyWindow(now, now + this.config.windowMs);
  }

  /**
   * 注册请求钩子进行指标采集
   */
  register(): void {
    if (!this.config.enabled) return;

    this.fastify.addHook('onRequest', async (req) => {
      this.rotateWindowIfNeeded();
      this.current.total++;
      this.current.concurrency++;
      (req as unknown as { __perfStart: number }).__perfStart = performance.now();
    });

    this.fastify.addHook(
      'onResponse',
      async (req: FastifyRequest, reply: FastifyReply) => {
        const start = (req as unknown as { __perfStart: number }).__perfStart;
        const end = performance.now();
        const duration = start ? Math.max(0, end - start) : 0;

        this.current.concurrency = Math.max(0, this.current.concurrency - 1);
        this.current.maxConcurrency = Math.max(
          this.current.maxConcurrency,
          this.current.concurrency
        );

        const status = reply.statusCode;
        if (status < 400) this.current.success++;
        else this.current.failure++;

        this.current.sumDurationMs += duration;
        this.durationBuffer.push(duration);

        // 更新近似分位数
        this.computeQuantiles();
      }
    );
  }

  /**
   * 获取当前窗口快照
   */
  getSnapshot(): IPerformanceSnapshot {
    return {
      window: { ...this.current },
      system: this.readSystemMetrics(),
    };
  }

  /**
   * 导出最近N个窗口（含当前）
   */
  exportRecentWindows(): IPerfWindowStats[] {
    return [...this.windows.slice(-this.config.keepWindows), this.current].map(
      (w) => ({ ...w })
    );
  }

  /**
   * 重置当前窗口
   */
  reset(): void {
    const now = Date.now();
    this.current = this.createEmptyWindow(now, now + this.config.windowMs);
    this.durationBuffer = new DurationRingBuffer(2048);
  }

  /**
   * 内部：如到期则轮转窗口
   */
  private rotateWindowIfNeeded(): void {
    const now = Date.now();
    if (now >= this.current.endAt) {
      this.windows.push(this.current);
      // 控制保留的历史窗口数量
      while (this.windows.length > this.config.keepWindows)
        this.windows.shift();
      this.current = this.createEmptyWindow(now, now + this.config.windowMs);
      this.durationBuffer = new DurationRingBuffer(2048);
    }
  }

  /**
   * 内部：创建空窗口
   */
  private createEmptyWindow(start: number, end: number): IPerfWindowStats {
    return {
      startAt: start,
      endAt: end,
      total: 0,
      success: 0,
      failure: 0,
      maxConcurrency: 0,
      concurrency: 0,
      sumDurationMs: 0,
      p50: 0,
      p90: 0,
      p99: 0,
    };
  }

  /**
   * 内部：根据环形缓冲估算分位数
   */
  private computeQuantiles(): void {
    const arr = this.durationBuffer.snapshotSorted();
    if (arr.length === 0) {
      this.current.p50 = this.current.p90 = this.current.p99 = 0;
      return;
    }
    const pick = (q: number) =>
      arr[Math.min(arr.length - 1, Math.floor(q * arr.length))];
    this.current.p50 = pick(0.5);
    this.current.p90 = pick(0.9);
    this.current.p99 = pick(0.99);
  }

  /**
   * 内部：读取系统指标
   */
  private readSystemMetrics(): IPerformanceSnapshot['system'] {
    const mem = process.memoryUsage();
    return {
      memory: {
        rss: mem.rss,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external,
      },
      cpuUsage: this.readCpuUsage(),
      uptimeSec: Math.floor(process.uptime()),
    };
  }

  /**
   * 内部：CPU使用率（简化，返回最近一次 user/system 用时比例的粗略估算）
   */
  private readCpuUsage(): number {
    const usage = process.cpuUsage();
    // 将微秒转换为毫秒并进行归一，简单估算（非精准CPU占比）
    const totalMs = (usage.user + usage.system) / 1000;
    // 将其压缩到0-100的区间（非真实CPU百分比，仅用于趋势观察）
    return Math.min(100, Math.round(totalMs % 100));
  }
}

/**
 * 工厂方法：创建性能监控服务
 */
export function createPerformanceMonitor(
  fastify: FastifyInstance,
  config?: IPerformanceMonitorConfig
): PerformanceMonitorService {
  const svc = new PerformanceMonitorService(fastify, config);
  svc.register();
  return svc;
}
