# 行动计划

## 关联主题
[specify/001-vscode-dashboard-interface/discuss.md](specify/001-vscode-dashboard-interface/discuss.md)

## 行动清单
<!--
每个行动项格式：
A01. [状态] 行动描述
A02. [状态] 行动描述
A03. [状态] 行动描述

编号格式: A01, A02, A03...（A = Action）
状态: ⏳待执行 / ✅已完成
-->

### 后端实现

A01. [✅已完成] 创建 Senatus 数据解析工具类 `extension/src/utils/senatus-parser.js`
- 扫描 `specify/` 目录获取所有主题
- 解析 discuss.md 提取讨论记录（使用 Marked + 正则）
- 解析 plan.md 提取任务列表和状态
- 判断主题进度阶段（根据文件存在性）
- 错误处理：格式不符则忽略文件
- 返回结构化数据对象

A02. [✅已完成] 创建仪表盘提供者 `extension/src/providers/dashboard-provider.js`
- 继承 WebviewBase 基类
- 实现单例模式（存储 panel 引用，已存在则 reveal）
- 使用 SenatusParser 解析 specify 目录数据
- 创建 WebviewPanel，配置 enableScripts 和 localResourceRoots
- 设置自定义图标（复用或新增）
- 处理前端消息（openFile、refresh 等命令）
- 实现 `updatePanelContent()` 方法更新数据

A03. [✅已完成] 在 DashboardProvider 中实现文件监控机制
- 使用 `vscode.workspace.createFileSystemWatcher('specify/**/*')` 监听文件变化
- 实现 1000ms 防抖机制
- 文件变化时调用 `updatePanelContent()` 重新解析和渲染
- 在 panel.onDidDispose 时清理 watcher 和 timeout
- 订阅 watcher 到 context.subscriptions

A04. [✅已完成] 在 ResourceUri 工具类中添加仪表盘资源 URI 方法
- 添加 `getDashboardUris()` 静态方法
- 返回 fontAwesome、style、script 的 webview URI
- 参考 getSidebarUris 和 getViewerUris 实现

### 前端实现

A05. [✅已完成] 创建仪表盘 HTML 模板 `extension/webview/dashboard/dashboard.html`
- 基础结构：header + content-wrapper
- 顶部区域：当前主题卡片（名称、进度条、阶段标签）
- 中部区域：统计卡片（讨论数、任务数、完成率）
- 底部区域：所有主题列表（可折叠）
- 引入 Font Awesome、dashboard.css、dashboard.js
- 使用占位符：{{fontAwesomeUri}}、{{styleUri}}、{{scriptUri}}

A06. [✅已完成] 创建仪表盘样式文件 `extension/webview/dashboard/dashboard.css`
- 复用 viewer.css 的配色变量（`:root` 和 `[data-vscode-theme-kind]`）
- 卡片样式：border、padding、background、shadow
- 进度条样式：高度、颜色、动画
- 统计卡片布局：flex、gap、对齐
- 主题列表样式：hover、active、indent
- 阶段标签样式：背景色、圆角、字体
- 响应式处理

A07. [✅已完成] 创建仪表盘前端脚本 `extension/webview/dashboard/dashboard.js`
- 获取 vscode API：`acquireVsCodeApi()`
- 监听后端消息：`window.addEventListener('message')`
- 接收并渲染数据：解析 JSON，更新 DOM
- 实现交互：点击主题列表项发送 `openFile` 命令
- 实现刷新按钮：发送 `refresh` 命令
- 实现主题列表折叠/展开
- 渲染进度条、统计数字、任务列表

### 命令和视图注册

A08. [✅已完成] 在 package.json 中注册仪表盘命令
- 在 `contributes.commands` 中添加 `spec-viewer.openDashboard`
- 配置 title: "Open Dashboard"
- 配置 category: "Spec Viewer"
- 配置 icon: "$(dashboard)" 或自定义图标

A09. [✅已完成] 在 package.json 的 menus 中添加仪表盘按钮
- 在 `contributes.menus.view/title` 中添加配置
- command: "spec-viewer.openDashboard"
- when: "view == specViewerExplorer"
- group: "navigation"
- 确保按钮顺序：dashboard → refresh → collapseAll

A10. [✅已完成] 在 extension.js 中注册仪表盘提供者和命令
- 导入 DashboardProvider
- 在 activate 函数中创建 dashboardProvider 实例
- 使用 `vscode.commands.registerCommand()` 注册 openDashboard 命令
- 命令处理函数调用 `dashboardProvider.openDashboard()`
- 订阅到 context.subscriptions

### 交互功能实现

A11. [✅已完成] 实现点击主题打开 discuss.md 功能
- 前端：主题列表项点击事件，发送 `{ command: 'openFile', path: 'specify/NNN-topic/discuss.md' }`
- 后端：DashboardProvider 接收消息，调用 `vscode.commands.executeCommand('spec-viewer.openFile', filePath)`
- 复用现有的 FileViewerProvider 打开文件
- **实现位置**: `dashboard.js:102-112` (已在 A07 中实现)

A12. [✅已完成] 实现仪表盘手动刷新功能
- 前端：添加刷新按钮，点击发送 `{ command: 'refresh' }` 消息
- 后端：接收消息后调用 `updatePanelContent()` 重新解析数据
- 显示加载状态（可选）
- **实现位置**: `dashboard-provider.js:70-75`, `dashboard.js:145-149` (已在 A02、A07 中实现)

### 测试和优化

A13. [✅已完成] 测试单例模式和资源清理
- 测试多次点击按钮是否正确 reveal 已存在的面板
- 测试关闭面板时 watcher 是否正确清理
- 测试防抖机制是否生效（1秒内多次文件变化）
- 检查 context.subscriptions 是否正确订阅
- **测试方案**: 见 `implementation/A13.md`

A14. [✅已完成] 测试数据解析的容错性
- 测试空 specify 目录的处理
- 测试格式错误的 Markdown 文件
- 测试缺少某些文件的主题目录
- 验证错误处理是否正确忽略异常文件
- **测试方案**: 见 `implementation/A14.md`

A15. [✅已完成] 测试主题适配和跨平台兼容性
- 切换 VSCode 浅色/深色主题，验证样式正确
- 在 Windows、macOS、Linux 上测试路径处理
- 验证 Font Awesome 图标正确显示
- 验证进度条、卡片样式在不同主题下的可读性
- **测试方案**: 见 `implementation/A15.md`

A16. [✅已完成] 修复仪表盘图标不显示、刷新失效和任务列表限制问题
- 修复刷新机制：使用 postMessage 更新数据而非重新加载 HTML
- 添加 isHtmlLoaded 标志位跟踪 HTML 加载状态
- 移除任务列表的 5 项限制，显示全部任务
- 为任务列表添加滚动条支持（max-height: 400px）
- **实现文件**: `dashboard-provider.js`, `dashboard.js`, `dashboard.css`

A17. [✅已完成] 修复仪表盘图标缺失问题（补充 Font Awesome 图标定义）
- 诊断根本原因：fontawesome.css 缺少仪表盘使用的图标定义
- 添加缺失的 11 个图标定义：chart-line, sync-alt, comments, tasks, check-circle, layer-group, circle, plus-circle, search, clipboard-list, bolt
- 使用 Font Awesome 6 Free 标准 unicode 码点
- **实现文件**: `extension/assets/fontawesome/fontawesome.css`

A18. [✅已完成] 修复阶段标签图标不显示问题（添加 fas 基础类）
- 诊断根本原因：stage badge 图标元素缺少 `fas` 基础类
- 修复两处图标渲染代码，添加 `fas` 类应用 Font Awesome 字体系列
- 位置1：当前主题卡片的阶段标签（dashboard.js:103）
- 位置2：主题列表中的阶段标签（dashboard.js:255）
- **实现文件**: `extension/webview/dashboard/dashboard.js`

---
*创建时间: 2025-09-30*