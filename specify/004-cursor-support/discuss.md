# 讨论主题: 支持Cursor

> **重要说明：此文件仅用于维护讨论记录，不要添加其他内容。**

## 概述
支持cursor

## 讨论记录
<!--
每次讨论记录格式：
### D01 - YYYY-MM-DD HH:MM:SS
**问题**: [讨论的具体问题]
**结论**: [达成的结论或决策]

编号格式: D01, D02, D03...（D = Discussion）
-->

### D01 - 2025-10-16 14:30:00
**问题**: 将 VSIX 文件拖入 Cursor 1.99.3 时提示版本不匹配，无法安装扩展
**结论**: 采用方案 1 - 降低 VSCode Engine 版本要求。将 `package.json` 中的 `engines.vscode` 从 `^1.104.0` 降低到 `^1.85.0`，同时将 `@types/vscode` 的版本也降低到 `^1.85.0` 以保持类型定义与运行时版本一致。选择 1.85.0 版本的理由：该版本（2023年11月发布）足够稳定，扩展使用的所有 API 在此版本中已完全稳定，可兼容 Cursor 1.99.3 及近两年的 VSCode 版本，符合项目宪法中关于 API 兼容性的要求。

### D02 - 2025-10-16 15:00:00
**问题**: Senatus 框架需要支持 Cursor IDE 的自定义命令功能，让 Cursor 用户也能使用 Senatus 工作流
**结论**: 采用以下方案实现 Cursor 自定义命令支持：使用 `.cursor/commands/` 目录存放命令文件（Cursor 官方指定位置）；在 `senatus-installer.js` 运行时，动态地从 `.github/prompts/` 目录读取 prompt 文件，去掉 `.prompt` 后缀（如 `senatus.discuss.prompt.md` 改为 `senatus.discuss.md`）后复制到目标项目的 `.cursor/commands/` 目录。这样做的好处是：维护单一数据源（只需维护 `.github/prompts/`），避免在 Senatus 子模块中存储重复文件，prompt 更新后安装时自动生成最新命令。最终效果是安装后项目将同时支持三种 AI 编程助手：Claude AI（`.claude/commands/`）、GitHub Copilot（`.github/prompts/`）和 Cursor（`.cursor/commands/`）。

### D03 - 2025-10-16 15:15:00
**问题**: D02 结论中提到"在 Senatus 子模块中预先创建 `.cursor/commands/` 目录"的表述不准确，需要澄清 Cursor 命令文件的生成时机
**结论**: Cursor 命令文件是在运行时动态生成的，而不是预先存储在 Senatus 子模块中。具体实现是：在 `senatus-installer.js` 执行时，从 `.github/prompts/` 目录读取 prompt 文件，自动重命名（去掉 `.prompt` 后缀）并复制到目标项目的 `.cursor/commands/` 目录。Senatus 子模块本身不需要也不应该包含 `.cursor/commands/` 目录，以保持单一数据源原则。

### D04 - 2025-10-16 15:45:00
**问题**: 任务计划中包含更新 `README.md` 的任务，但 README.md 应该保持专注于 CLI 工具说明，不涉及扩展相关内容
**结论**: `README.md` 定位为 CLI 工具的使用文档，应保持不涉及 VSCode/Cursor 扩展的内容。所有关于 Cursor IDE 的安装和使用说明应统一添加到 `EXTENSION.md` 文件中。因此更新 README.md 的任务应该被取消，只需要更新 EXTENSION.md 即可。

### D05 - 2025-10-16 16:30:00
**问题**: 文档中硬编码了 VSCode 和 Cursor 的具体版本号（如 1.85.0、0.40.0），未来版本升级后文档需要频繁更新
**结论**: 移除 `EXTENSION.md` 和 `constitution.md` 中的硬编码版本号。在 EXTENSION.md 的兼容性说明中改为"Modern versions with Webview API support"等通用表述；在 constitution.md 的技术约束中改为"必须保持 VSCode Extension API 的兼容性（使用稳定的标准 API）"。这样可以避免文档因版本升级而过时，同时强调使用标准 API 的核心原则。

---
*创建时间: 2025-10-16*
