/**
 * 装饰器目标类型定义
 *
 * @description 定义装饰器中使用的通用类型，避免使用any类型
 * @since 1.0.0
 */

/**
 * 装饰器目标类型
 * 表示可以被装饰器装饰的类或对象
 */
export type DecoratorTarget = Record<string, unknown>;

/**
 * 类构造函数类型
 */
export type ClassConstructor = new (...args: unknown[]) => unknown;

/**
 * 方法装饰器目标类型
 * 兼容TypeScript原生MethodDecorator的object类型
 */
export type MethodDecoratorTarget = object;
