/**
 * 数据转换器
 *
 * @description 为接口层提供数据转换功能
 * 支持DTO转换、类型转换、格式转换等
 *
 * @since 1.0.0
 */
export class DataTransformer {
  /**
   * 转换为DTO
   *
   * @description 将领域对象转换为DTO对象
   *
   * @param domainObject - 领域对象
   * @param dtoClass - DTO类
   * @returns DTO对象
   */
  static toDTO<TDomain, TDTO extends object>(
    domainObject: TDomain,
    dtoClass: new () => TDTO
  ): TDTO {
    const dto = new dtoClass();

    // 复制属性
    Object.keys(domainObject as any).forEach((key) => {
      if (key in dto) {
        (dto as any)[key] = (domainObject as any)[key];
      }
    });

    return dto;
  }

  /**
   * 转换为领域对象
   *
   * @description 将DTO对象转换为领域对象
   *
   * @param dto - DTO对象
   * @param domainClass - 领域类
   * @returns 领域对象
   */
  static toDomain<TDTO, TDomain>(
    dto: TDTO,
    domainClass: new (...args: any[]) => TDomain
  ): TDomain {
    // 这里应该根据具体的领域类构造函数进行转换
    // 实际实现中会调用领域类的工厂方法
    return new domainClass();
  }

  /**
   * 转换为JSON
   *
   * @description 将对象转换为JSON字符串
   *
   * @param obj - 要转换的对象
   * @param pretty - 是否格式化
   * @returns JSON字符串
   */
  static toJSON(obj: any, pretty = false): string {
    return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  }

  /**
   * 从JSON转换
   *
   * @description 将JSON字符串转换为对象
   *
   * @param json - JSON字符串
   * @param targetClass - 目标类
   * @returns 转换后的对象
   */
  static fromJSON<T extends object>(
    json: string,
    targetClass?: new () => T
  ): T | any {
    const obj = JSON.parse(json);

    if (targetClass) {
      return Object.assign(new targetClass(), obj);
    }

    return obj;
  }

  /**
   * 转换为查询参数
   *
   * @description 将对象转换为URL查询参数
   *
   * @param obj - 要转换的对象
   * @returns 查询参数字符串
   */
  static toQueryString(obj: Record<string, any>): string {
    const params = new URLSearchParams();

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value !== null && value !== undefined) {
        params.append(key, String(value));
      }
    });

    return params.toString();
  }

  /**
   * 从查询参数转换
   *
   * @description 将URL查询参数转换为对象
   *
   * @param queryString - 查询参数字符串
   * @returns 转换后的对象
   */
  static fromQueryString(queryString: string): Record<string, string> {
    const params = new URLSearchParams(queryString);
    const obj: Record<string, string> = {};

    params.forEach((value, key) => {
      obj[key] = value;
    });

    return obj;
  }

  /**
   * 转换为表单数据
   *
   * @description 将对象转换为FormData
   *
   * @param obj - 要转换的对象
   * @returns FormData对象
   */
  static toFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    return formData;
  }

  /**
   * 从表单数据转换
   *
   * @description 将FormData转换为对象
   *
   * @param formData - FormData对象
   * @returns 转换后的对象
   */
  static fromFormData(formData: FormData): Record<string, string> {
    const obj: Record<string, string> = {};

    formData.forEach((value, key) => {
      obj[key] = String(value);
    });

    return obj;
  }
}
