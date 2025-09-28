const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');
const webpack = require('webpack');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/websockets\/socket-module$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/microservices\/microservices-module$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/microservices$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@grpc\/grpc-js$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@grpc\/proto-loader$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^kafkajs$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^mqtt$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^nats$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^ioredis$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^amqplib$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^amqp-connection-manager$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@nestjs\/platform-socket\.io$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@fastify\/static$/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^@fastify\/view$/,
    }),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
};
