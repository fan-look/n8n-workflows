## 目标
- 提升代码一致性与可维护性，明确单一运行模式（Node 或 Python），完善质量保障与安全治理。
- 针对 Windows 环境优化脚本与流程，避免 Linux 指令依赖。
- 规范 n8n 工作流凭证与环境配置，降低误用与安全风险。

## 高优先级实施
1. 统一运行与包入口
- 明确“本地开发用 Node、容器用 Python”的边界，或收敛为单一栈，并在 README_ZH 补充说明。
- 在仓库根补齐或修复 `package.json`（保证 `api/server.js` 的 `require('../package.json')` 正常），统一 `npm run build`、`npm start`。
2. 质量保障与 CI
- 在根新增 `.eslintrc.json`、`.prettierrc`，配置基础规则与忽略。
- 为 Node 端引入 Jest，为 Python 端引入 PyTest，添加最小化单元测试与覆盖率输出；在 GitHub Actions 中加入 Lint/Test 步骤。
3. 凭证治理与工作流扫描
- 扫描 `workflows/**/*.json` 中敏感占位键（如 `secret`、`destinationKey`、`apiKey`），统一替换为凭证引用约定（不写真实密钥）。
- 添加导入校验脚本：检测 `credentials` 引用合规、触发/复杂度元信息存在。

## 中优先级实施
1. 环境与端口一致化
- 统一 `.env` 路径与变量命名；本地与容器端口（3000/8000）在文档与脚本中显式说明并校验。
- `scripts/one-click-deploy.js` 支持从 `config/.env.*` 加载，并在健康检查返回版本与索引状态。
2. 构建与发布
- 完善 `scripts/build.js`：输出文件校验、版本标记、资产清单。
- CI 集成 Pages/Artifact 发布与缓存，加速构建。
3. 文档索引与站点
- 自动化生成 `docs/api/*.json`，在构建时校验结构与字段；前端站点显示 `/api/stats` 的摘要信息。

## 低优先级实施
1. K8s/Helm 对齐
- 统一 Chart 与 K8s 清单的镜像、端口、环境映射，提供示例 `values.yaml`。
2. 脚本平台适配
- 为关键 `.sh` 脚本提供 `.ps1/.bat` 等效版本（尤其测试与运维）。
- 清理无用测试文档与过时脚本，避免混淆。
3. 安全扫描常态化
- 在 CI 中加入 `trivy` 与依赖审计，生成简要报告并上传。

## 交付与验证
- 验证点：
- API：`/api/stats`、`/api/workflows`、`/api/workflows/:filename` 在本地与容器均正常，参考 `api/server.js:107/121/151/204`。
- 数据库：SQLite WAL/FTS5 生效，参考 `src/database.js:46-50`、`82-88`；索引流程可重复。
- 前端：静态资源与 UI 标准文件齐全，`static/styles/ui-standards.css` 与 `i18n-ui-standards.js` 生效。
- 工作流：凭证引用合规、下载与图表生成成功。

## 风险控制
- 保持不提交任何真实密钥；在 PR 中强制敏感词扫描。
- 渐进迁移，确保 Node 与 Python 路径不会相互破坏；提供回滚脚本与版本化构建产物。

请确认以上计划优先级与范围，我将按“高优先级 → 中优先级 → 低优先级”的顺序实施，并在每一阶段提供验证结果与变更清单。