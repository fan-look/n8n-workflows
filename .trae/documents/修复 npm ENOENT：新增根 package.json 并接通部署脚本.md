## 问题定位
- 终端报错：`npm run deploy:dev` 在项目根找不到 `package.json` → ENOENT。
- 代码引用根 `package.json`（`api/server.js:350` 读取 `version`），当前不存在会导致服务端 `/health` 等端点读取版本时报错。

## 修复方案
- 在项目根新增 `package.json`，统一管理 Node 依赖与脚本：
  - `version`: 对齐 `docs/api/metadata.json` 的 `2.0.1`
  - `scripts`：
    - `build`: `node scripts/build.js`
    - `start`: `node api/server.js`
    - `deploy:dev`: `node scripts/one-click-deploy.js --env development`
    - `deploy:prod`: `node scripts/one-click-deploy.js --env production`
  - `dependencies`（覆盖当前代码用到的库）：`express`、`cors`、`compression`、`helmet`、`express-rate-limit`、`dotenv`、`fs-extra`、`sqlite3`、`commander`
  - `type`: `commonjs`

## 执行步骤
1. 新增 `package.json` 于项目根目录（不改动其他文件）。
2. 运行 `npm install` 安装依赖。
3. 执行 `npm run deploy:dev` 验证：
   - 构建前端 → `dist/static` 生成
   - 初始化数据库与索引
   - 生成中文文档与检索索引
   - 启动 Node 服务并通过 `/health` 检查

## 风险与处理
- `sqlite3` 在 Windows 需下载预构建二进制；如网络失败，重试或改用国内镜像。
- 若 `npm install` 失败，可回退使用 `node scripts/build.js` 和 `node api/server.js`（但仍需安装依赖）。

## 预期结果
- `npm run deploy:dev` 正常运行，无 ENOENT；`/health` 返回包含版本信息；前端与 API正常服务。