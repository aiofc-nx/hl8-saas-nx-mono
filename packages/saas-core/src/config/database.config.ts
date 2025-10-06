/**
 * 数据库配置
 * 
 * @description 配置PostgreSQL数据库连接参数和MikroORM设置
 * 支持开发、测试、生产环境的不同配置
 * 
 * @since 1.0.0
 */

export interface DatabaseConfig {
  type: 'postgresql';
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
  entities: string[];
  migrations: {
    path: string;
    pattern: RegExp;
  };
  debug: boolean;
  pool: {
    min: number;
    max: number;
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
    type: 'postgresql',
    host: process.env['DB_HOST'] || 'localhost',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    user: process.env['DB_USERNAME'] || 'postgres',
    password: process.env['DB_PASSWORD'] || 'password',
    dbName: process.env['DB_DATABASE'] || 'saas_core_dev',
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: {
      path: __dirname + '/../migrations',
      pattern: /^[\w-]+\d+\.(ts|js)$/,
    },
    debug: process.env['NODE_ENV'] === 'development',
    pool: {
      min: 5,  // 最小连接数
      max: 20, // 最大连接数
    },
  };
};
