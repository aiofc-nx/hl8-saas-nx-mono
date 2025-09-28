# 创建一个符合NestJS要求的Monorepo

## 初始化

这是Nx官方提供的一个模板：

```bash
git clone https://github.com/nrwl/empty-template hl8-saas-nx-mono --depth=1
```

首先，修改根目录的`tsconfig`配置：

### `tsconfig.base.json`

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["es2020", "dom", "es2018", "esnext.array", "ES2022"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "baseUrl": ".",
    "paths": {

    }
  },
  "exclude": ["coverage/**/*", "dist/**/*", "node_modules", "tmp"]
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "resolveJsonModule": true,
    "typeRoots": ["node_modules/@types"],
    "preserveConstEnums": true,
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": false,
    "noImplicitAny": false,
    "esModuleInterop": false,
    "useDefineForClassFields": false
  },
  "extends": "./tsconfig.base.json"
}
```

**很重要的一项修改是**："module": "commonjs",它会影响到后续的项目创建，Nx会参考它来确定相关配置的格式以及编译的路径，**切记！！！**

**Nx这鬼东西版本变化很快，不同的版本有些规矩会有很大变化，而且，官方不会提醒你！**

## 创建lib项目

```bash
pnpm exec nx generate @nx/js:library --directory=packages/config --importPath=@hl8/config --linter=eslint --name=config --unitTestRunner=jest --tags=scope:lib,type:lib --useProjectJson=true --no-interactive 
```

注意观察ts配置文件是否符合以下示例：

### 子项目的`tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "importHelpers": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ]
}
```

### 子项目的`tsconfig.lib.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
```

### 子项目的`project.json`

```json
{
  "name": "utils",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/utils/src",
  "projectType": "library",
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/utils",
        "main": "packages/utils/src/index.ts",
        "tsConfig": "packages/utils/tsconfig.lib.json",
        "assets": ["packages/utils/*.md"]
      }
    }
  }
}
```
