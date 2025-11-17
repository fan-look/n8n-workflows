## 问题定位
- 报错发生在安装 `pydantic-core==2.14.6` 的构建依赖阶段，需要下载 `maturin` 并进行本地构建，网络读超时导致失败
- 原因一：当前使用 `Python 3.13`，而 `requirements.txt:2` 明确标注兼容 `Python 3.9-3.12`，`pydantic==2.5.3` 对 3.13 轮子支持不足，触发源码构建
- 原因二：访问 PyPI 下载超时（`files.pythonhosted.org` 读超时），受网络或超时设置影响

## 修复策略（二选一，推荐优先按 A）
### A. 切回 Python 3.12（零改动依赖，最稳妥）
1. 创建 3.12 虚拟环境：`py -3.12 -m venv venv`
2. 激活 venv（PowerShell）：`./venv/Scripts/Activate.ps1`
3. 升级 pip：`python -m pip install --upgrade pip`
4. 安装依赖并增加超时/重试（临时）：`pip install -r requirements.txt --default-timeout=120 --retries=5`
5. 如网络不稳定，使用镜像：`pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --default-timeout=120 --retries=5`
6. 验证：`python -c "import fastapi,pydantic;print(fastapi.__version__,pydantic.__version__)"`

### B. 保持 Python 3.13，升级包版本以获得轮子
1. 调整依赖：
   - `pydantic>=2.7,<3`（为 3.13 提供二进制轮子，避免本地构建）
   - 可选：`fastapi>=0.111,<1`、`uvicorn>=0.29,<1` 与其依赖 `starlette>=0.36`（随 pydantic 升级保持兼容）
   - 将 `requirements.txt` 按 Python 版本加条件：
     - `pydantic==2.5.3; python_version < "3.13"`
     - `pydantic>=2.7,<3; python_version >= "3.13"`
2. 升级 pip：`python -m pip install --upgrade pip`
3. 安装依赖（带镜像与超时可选）：`pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --default-timeout=120 --retries=5`
4. 验证版本与启动 API

## 网络与环境优化（两方案通用）
- 临时参数：`--default-timeout=120 --retries=5`
- 全局 pip 配置（Windows）：在 `%APPDATA%\pip\pip.ini` 写入：
  - `[global]` `index-url=https://pypi.tuna.tsinghua.edu.cn/simple` `timeout=120` `retries=5`
- 如需源码构建：安装 Rust 工具链（`rustup`）与 `maturin`，但优先避免构建（使用轮子或换 3.12）

## 仓库关联信息
- 依赖定义：`requirements.txt:2-5`（标注兼容 3.9-3.12，`pydantic==2.5.3`）
- 后端脚本与部署不会依赖 gunicorn 在 Windows，安装其不会影响本地启动

## 执行与验证
- 我将按你选择的策略执行：
  - A：创建 3.12 venv 并安装，确保终端安装通过
  - B：更新 `requirements.txt` 增加条件依赖，然后安装
- 完成后运行最小验证与后端健康检查，确保无后续依赖冲突