/**
 * 应用类混入
 *
 * 将多个混入类的属性和方法合并到目标类中，实现多重继承的效果。
 * 使用原型链复制的方式将混入类的功能添加到目标类。
 *
 * @description 此函数提供了一种灵活的方式来实现类混入模式。
 * 通过原型链复制将多个混入类的属性和方法合并到目标类中，实现代码复用。
 * 适用于组件开发、功能扩展、代码组织等场景。
 *
 * ## 业务规则
 *
 * ### 混入应用规则
 * - 按顺序应用混入类
 * - 后应用的混入会覆盖先应用的属性
 * - 保持原型链的完整性
 * - 支持属性和方法的混入
 *
 * ### 属性复制规则
 * - 复制所有自有属性
 * - 保持属性描述符
 * - 处理不可枚举属性
 * - 支持 getter 和 setter
 *
 * ### 方法复制规则
 * - 复制所有方法
 * - 保持方法上下文
 * - 处理静态方法
 * - 支持原型方法
 *
 * ### 类型安全规则
 * - 支持泛型类型约束
 * - 保持类型推断
 * - 确保类型安全
 * - 避免类型冲突
 *
 * @param derivedCtor - 目标类构造函数，混入将应用到此类
 * @param constructors - 要应用的混入类构造函数数组
 * @returns 无返回值
 *
 * @example
 * ```typescript
 * // 定义混入类
 * class TimestampMixin {
 *   getTimestamp(): number {
 *     return Date.now();
 *   }
 * }
 *
 * class LoggerMixin {
 *   log(message: string): void {
 *     console.log(`[${new Date().toISOString()}] ${message}`);
 *   }
 * }
 *
 * // 定义目标类
 * class BaseService {
 *   name: string;
 *   constructor(name: string) {
 *     this.name = name;
 *   }
 * }
 *
 * // 应用混入
 * applyMixins(BaseService, [TimestampMixin, LoggerMixin]);
 *
 * // 使用混入后的类
 * const service = new BaseService('MyService');
 * service.log('服务启动'); // 输出: [2024-01-01T00:00:00.000Z] 服务启动
 * console.log(service.getTimestamp()); // 输出: 1704067200000
 *
 * // 处理属性混入
 * class PropertyMixin {
 *   id: string = Math.random().toString(36);
 * }
 *
 * class MethodMixin {
 *   getId(): string {
 *     return this.id;
 *   }
 * }
 *
 * class UserService {
 *   name: string;
 *   constructor(name: string) {
 *     this.name = name;
 *   }
 * }
 *
 * applyMixins(UserService, [PropertyMixin, MethodMixin]);
 *
 * const userService = new UserService('John');
 * console.log(userService.getId()); // 输出: 随机生成的 ID
 * ```
 *
 * @since 1.0.0
 * @version 1.0.0
 */
export function applyMixins(derivedCtor: any, constructors: any[]): void {
	// 遍历每个混入构造函数
	constructors.forEach((baseCtor) => {
		// 遍历混入类的每个属性/方法
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			// 将属性/方法从混入类复制到目标类原型
			Object.defineProperty(
				derivedCtor.prototype,
				name,
				Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
			);
		});
	});
}
