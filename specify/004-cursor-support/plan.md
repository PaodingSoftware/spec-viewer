# 任务计划

> **重要说明：此文件仅用于维护任务清单，不要添加其他内容。**

## 关联主题
specify/004-cursor-support/discuss.md

## 任务清单
<!--
每个任务项格式：
T01. [状态] 任务描述
T02. [状态] 任务描述
T03. [状态] 任务描述

编号格式: T01, T02, T03...（T = Task）
状态: ⏳待执行 / 🔄进行中 / ✅已完成
-->

T01. [✅已完成] 修改 `package.json` 中的 `engines.vscode` 版本从 `^1.104.0` 降低到 `^1.85.0`
T02. [✅已完成] 修改 `package.json` 中的 `devDependencies["@types/vscode"]` 版本从 `^1.104.0` 降低到 `^1.85.0`
T03. [✅已完成] 更新项目宪法文件 `specify/constitution.md`，将 VSCode Extension API 版本约束从 `^1.104.0` 改为 `^1.85.0`
T04. [✅已完成] 在 `senatus-installer.js` 中实现 Cursor 命令文件复制逻辑：从 `.github/prompts/` 读取 prompt 文件，去掉 `.prompt` 后缀后复制到目标项目的 `.cursor/commands/` 目录
T05. [✅已完成] 在 `package.json` 的 `scripts` 中添加 Cursor 专用的安装命令 `install-extension-cursor`，使用 `cursor --install-extension` 命令
T06. [✅已完成] 更新 `EXTENSION.md` 扩展说明文档，补充 Cursor IDE 的安装方法（使用 `npm run install-extension-cursor` 命令）、兼容性说明和 Senatus 框架在 Cursor 中的使用方式
T07. [✅已完成] 移除 `EXTENSION.md` 和 `constitution.md` 中硬编码的版本号，改为通用表述以适应未来版本升级

---
*创建时间: 2025-10-16*
