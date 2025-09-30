# 讨论主题: VSCode插件仪表盘界面

## 概述
为VSCode插件创建一个仪表盘界面

## 讨论记录
<!--
每次讨论记录格式：
### D01 - YYYY-MM-DD HH:MM:SS
**问题**: [讨论的具体问题]
**结论**: [达成的结论或决策]

编号格式: D01, D02, D03...（D = Discussion）
-->

### D01 - 2025-09-30 20:40:01
**问题**: 在折叠目录和刷新按钮的左侧添加仪表盘入口按钮，确定仪表盘的实现方式和展示内容

**结论**:
- 仪表盘形式：WebviewPanel（独立编辑器面板）
- 数据源：`specify/` 目录下所有文件
- 数据解析：后端解析（Node.js）
- 展示内容：所有主题列表、当前主题、当前主题进度、讨论数、任务数、任务进度
- 按钮位置：侧边栏标题栏，刷新和折叠按钮的左侧（navigation group）
- 技术方案：新增 `spec-viewer.openDashboard` 命令和 DashboardProvider（类似 FileViewerProvider）

### D02 - 2025-09-30 20:44:47
**问题**: 确定仪表盘的实时更新机制，当 `specify/` 目录中的文件变化时如何更新仪表盘

**结论**:
- 采用混合方案：自动监控 + 手动刷新按钮
- 监控范围：整个 `specify/` 目录（`specify/**/*`）
- 防抖时间：1000ms（1秒）
- 实例模式：单例模式（同时只允许打开一个仪表盘实例）
- 实现方式：使用 `vscode.workspace.createFileSystemWatcher()` 监听文件变化
- 符合宪法约束：满足"必须在文件变化时自动更新视图"的要求

### D03 - 2025-09-30 20:49:28
**问题**: 确定 Senatus 数据结构的解析策略，如何从 Markdown 文件中提取结构化信息

**结论**:
- 解析策略：混合策略（Marked 解析结构 + 正则提取模式）
- 错误处理：格式不符合预期则忽略该文件
- 当前主题：取最新序号目录（NNN-topic-name）
- 当前主题进度：按流程阶段判断（new-topic → research → discuss/inspire → plan → action）
  - 根据存在的文件判断进度：discuss.md、research.md、plan.md 等
- 讨论数：统计当前主题的讨论记录数量（D01, D02...）
- 任务数和进度：统计当前主题 plan.md 中的任务（A01, A02...）及完成状态（⏳/✅）
- 缓存策略：不缓存解析结果，文件变化时重新解析全部
- 符合宪法约束：使用 Marked 库进行 Markdown 解析

### D04 - 2025-09-30 20:52:01
**问题**: 确定仪表盘的 UI 设计风格和布局结构

**结论**:
- 布局方案：垂直流式布局（类似 viewer 风格）
- 配色方案：复用现有页面的配色方案（`--vscode-*` 变量和 `--color-*` 自定义变量）
- 交互设计：
  - 点击主题列表项打开对应的 discuss.md 文件
  - 任务列表展示详情（任务描述、状态）
- 图标系统：使用 Font Awesome 图标（项目已集成）
  - 阶段标识：📋 discuss、🔍 research、📝 plan、⚡ action 等
- 布局结构：
  - 顶部：当前主题信息（名称、进度条、阶段）
  - 中部：统计信息（讨论数、任务数、完成率）
  - 底部：所有主题列表（可折叠展开）
- 符合宪法约束：复用现有样式，保持一致的视觉风格

### D05 - 2025-09-30 21:23:41
**问题**: 仪表盘的图标没有显示，点击刷新按钮之后，没有正确刷新。行动列表只显示了前5项，应该显示全部任务，超过高度显示滚动条。

**结论**:
- 修复问题1（图标不显示）：保持原有的 FontAwesome 资源路径配置，实际上图标路径配置正确（fontawesome.css 引用 ../webfonts/），问题可能是由于刷新机制导致 HTML 重新加载丢失图标
- 修复问题2（刷新无效）：原因是 `updatePanelContent()` 每次都重新设置 HTML，导致页面重新加载和资源重新请求。修改为使用 `postMessage` 机制更新数据，只在初次加载时设置 HTML，后续刷新通过消息传递数据。添加 `isHtmlLoaded` 标志位跟踪 HTML 加载状态。
- 修复问题3（任务列表限制）：
  - 移除 `dashboard.js:132` 中的 `.slice(0, 5)` 限制，显示全部任务
  - 在 `dashboard.css` 的 `.task-list` 样式中添加 `max-height: 400px` 和 `overflow-y: auto`，超过高度显示滚动条
- 这三个修复符合宪法约束中的用户体验约束和功能约束

### D06 - 2025-09-30 21:28:15
**问题**: 图标仍然没有显示出来，只能看到一个绿色的椭圆。

**结论**:
- 根本原因：`fontawesome.css` 文件中缺少仪表盘使用的图标定义
- 已定义的图标（正常显示）：`fa-spinner`、`fa-folder-open`
- 缺失的图标（显示为绿色椭圆）：`fa-chart-line`、`fa-sync-alt`、`fa-comments`、`fa-tasks`、`fa-check-circle`、`fa-layer-group`、`fa-circle`、`fa-plus-circle`、`fa-search`、`fa-clipboard-list`、`fa-bolt`
- 解决方案：在 `fontawesome.css` 中添加所有缺失图标的 unicode 字符定义
- 图标定义采用 Font Awesome 6 Free 标准 unicode 码点
- 符合宪法约束：保持前端资源的自包含性，避免外部 CDN 依赖

### D07 - 2025-09-30 21:38:22
**问题**: 大部分图标已经可以了，但是两个绿色圆形按钮里的icon仍然没有正常显示。

**结论**:
- 根本原因：阶段标签（stage badges）的图标元素缺少 `fas` 基础类
- 问题位置：`dashboard.js` 中两处渲染 stageBadge 的地方（第103行和第255行）
- 原代码：`<i class="${getStageIcon(topic.stage)}"></i>` 只有图标类名，缺少字体系列类
- Font Awesome 工作原理：需要 `fas` 类来应用 "Font Awesome 6 Free" 字体系列（`font-family` 和 `font-weight: 900`）
- 修复方案：添加 `fas` 基础类：`<i class="fas ${getStageIcon(topic.stage)}"></i>`
- 受影响的两处：
  1. 当前主题卡片顶部的阶段标签
  2. 所有主题列表中每个主题的阶段标签
- 符合宪法约束：正确使用 Font Awesome 图标系统

---
*创建时间: 2025-09-30*