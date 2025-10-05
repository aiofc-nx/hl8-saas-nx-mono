/**
 * 数据库配置
 * 
 * @description 配置PostgreSQL数据库连接参数和TypeORM设置
 * 支持开发、测试、生产环境的不同配置
 * 
 * @since 1.0.0
 */

export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  entities: string[];
  synchronize: boolean;
  logging: boolean;
  extra: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
}

/**
 * 获取数据库配置
 * 
 * @description 根据环境变量获取数据库配置
 * 
 * @returns 数据库配置对象
 * @since 1.0.0
 */
export const getDatabaseConfig = (): DatabaseConfig => {
  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'saas_core_dev',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
    extra: {
      max: 20, // 最大连接数
      min: 5,  // 最小连接数
      acquire: 30000, // 获取连接超时时间
      idle: 10000,    // 连接空闲时间
    },
  };
};
