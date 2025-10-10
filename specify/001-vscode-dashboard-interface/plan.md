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

A19. [✅已完成] 修复仪表盘图标位置和任务完成状态显示
- 调整 `package.json` 中的按钮顺序，将 dashboard 图标移到最右侧（refresh → collapseAll → dashboard）
- 在 `senatus-parser.js` 中添加逻辑，当 action 阶段的所有任务完成时，将阶段更新为 'completed'
- 在 `dashboard.js` 中添加 'completed' 阶段的图标和名称支持
- 在 `dashboard.css` 中添加 'completed' 阶段的样式（绿色背景）
- **实现文件**: `package.json`, `senatus-parser.js`, `dashboard.js`, `dashboard.css`

A20. [✅已完成] 修复仪表盘按钮位置不生效问题（使用 navigation@N 排序）
- 诊断问题：VSCode 菜单系统中，同一 group 内的按钮顺序不是由 JSON 数组顺序决定的
- 根本原因：需要使用 `group: "navigation@N"` 格式明确指定排序，N 为数字，越小越靠前
- 修复方案：将三个按钮的 group 分别设置为 `navigation@1`、`navigation@2`、`navigation@3`
- refresh 按钮使用 `@1`（最左），collapseAll 使用 `@2`（中间），openDashboard 使用 `@3`（最右）
- **实现文件**: `package.json`

A21. [✅已完成] 修复仪表盘在讨论阶段不显示内容的问题
- 诊断问题：当主题没有到达 plan/action 阶段时（只有讨论阶段），当前主题卡片不显示任何内容
- 根本原因：`renderCurrentTopicCard()` 函数只在有任务时才渲染列表，忽略了早期阶段的讨论记录
- 修复方案：
  - 优先显示任务列表（如果存在）
  - 如果没有任务，则显示讨论列表作为替代
  - 新增 `renderDiscussionList()` 函数渲染讨论记录
  - 添加讨论列表的 CSS 样式
  - 在 fontawesome.css 中添加 `fa-comment` 图标
- **实现文件**: `dashboard.js`, `dashboard.css`, `fontawesome.css`

A22. [✅已完成] 修复讨论记录解析失败的问题（正则表达式格式错误）
- 诊断问题：虽然添加了讨论列表显示功能，但讨论列表仍然不显示，`parseDiscuss()` 返回空数组
- 根本原因：正则表达式格式错误，无法匹配实际的讨论记录格式
- 问题详情：
  - 原正则：`/### (D\d+) - (.+?)\n\*\*问题\*\*: (.+?)\n\*\*结论\*\*:/gs`（问题后有空格）
  - 实际格式：`**问题**:` 冒号后直接是空格和内容，不是 `: `（冒号空格）
- 修复方案：
  - 更新正则为：`/### (D\d+) - (.+?)\n\*\*问题\*\*:\s*(.+?)\n+\*\*结论\*\*:/gs`
  - 使用 `\s*` 匹配冒号后的可选空白字符
  - 使用 `\n+` 匹配一个或多个换行符
  - 保留 `\r?` 支持 Windows 换行符（虽然当前使用 `\n`）
  - 添加注释说明实际格式
- 测试验证：创建测试脚本验证正则能正确匹配10条真实讨论记录
- **实现文件**: `senatus-parser.js`

A23. [✅已完成] 修复 HTML 注释样例被误识别为真实数据的问题
- 问题背景：在 `discuss.md` 和 `plan.md` 文件中，有 HTML 注释样例展示格式示例，被正则表达式误匹配为真实的讨论记录和任务
- 根本原因：正则表达式直接在原始文本上匹配，包括 HTML 注释 `<!-- -->` 内的内容
- 问题影响：
  - `discuss.md` 中的注释样例（`### D01 - YYYY-MM-DD HH:MM:SS`）被误识别为讨论记录
  - `plan.md` 中的注释样例（`A01. [状态] 行动描述`）被误识别为任务
- 修复方案：
  - 在 `parseDiscuss()` 和 `parsePlan()` 方法中，先使用 `content.replace(/<!--[\s\S]*?-->/g, '')` 移除所有 HTML 注释
  - 然后再进行正则表达式匹配
  - 使用非贪婪匹配 `[\s\S]*?` 确保正确匹配多行注释
- 修改位置：
  - `senatus-parser.js` 的 `parseDiscuss()` 方法
  - `senatus-parser.js` 的 `parsePlan()` 方法
- **实现文件**: `senatus-parser.js`

A24. [✅已完成] 添加研究完成标识和优化进度条计算
- 需求背景：用户要求单独提供图标标识topic是否完成研究，并且进度条应按主要阶段切分，即使没到action阶段也有进度
- 实现内容：
  - 添加研究完成标识：在当前主题卡片和主题列表中添加独立的研究完成图标（搜索图标）
    - 已完成研究：绿色圆形背景
    - 未完成研究：灰色圆形背景
    - 位置：在阶段标签左侧
  - 优化进度条计算：按阶段分配基础进度
    - new-topic: 10%
    - research: 20%
    - discuss: 30%
    - plan: 40%
    - action: 40-100%（基础40% + 任务完成率60%）
    - completed: 100%
- 修改位置：
  - `senatus-parser.js`: 添加 `hasResearch` 字段和新的 `calculateCompletionRate()` 方法
  - `dashboard.js`: 添加研究完成标识图标的渲染逻辑（在当前主题卡片和主题列表中）
  - `dashboard.css`: 添加 `.research-indicator` 样式
- **实现文件**: `senatus-parser.js`, `dashboard.js`, `dashboard.css`

A25. [✅已完成] 修复阶段判断逻辑和优化研究标识样式
- 问题背景：进入discuss阶段的判断应基于讨论列表是否为空，而不是research.md文件是否存在；研究标识图标应与阶段标签采用相同风格
- 实现内容：
  - 修复阶段判断逻辑：
    - 将 `determineStage()` 方法的判断从基于 research.md 文件存在改为基于 discussionCount > 0
    - 重构方法签名，将 discussionCount 作为参数传入
    - 调整 `parseTopic()` 方法中的调用顺序，先解析 discuss.md 再判断阶段
  - 优化研究标识样式：
    - 从圆形图标改为与阶段标签相同的徽章样式（带文字）
    - 添加文字显示："Researched" / "Not Researched"
    - 颜色调整：已完成使用蓝色（#0969da），未完成使用灰色
    - 保持与阶段标签一致的视觉风格
- 修改位置：
  - `senatus-parser.js`: 修改 `determineStage()` 方法和 `parseTopic()` 调用顺序
  - `dashboard.css`: 更新 `.research-indicator` 样式
  - `dashboard.js`: 在两处添加研究标识的文字显示
- **实现文件**: `senatus-parser.js`, `dashboard.css`, `dashboard.js`

A26. [✅已完成] 将 research 从 stage progression 中移除，使其成为独立属性
- 问题背景：research 不应该作为阶段流程的一部分，而应该是一个独立的标识属性
- 实现内容：
  - 修改阶段流程：从 new-topic → research → discuss → plan → action 改为 new-topic → discuss → plan → action → completed
  - research 通过 `hasResearch` 字段独立跟踪，不再作为阶段
  - 移除 research 阶段判断逻辑：在 `determineStage()` 方法中删除 research 阶段的判断
  - 重新分配进度权重：
    - new-topic: 10%（不变）
    - discuss: 30%（不变）
    - plan: 40% → 50%（+10%）
    - action: 40-100% → 50-100%（基础进度+10%，任务完成权重从60%改为50%）
    - completed: 100%（不变）
  - 移除前端 research 阶段支持：
    - 删除 `getStageIcon()` 中的 research 图标定义
    - 删除 `formatStage()` 中的 research 名称定义
    - 删除 CSS 中的 `.stage-badge.stage-research` 样式
- 修改位置：
  - `senatus-parser.js`: 修改 `determineStage()` 和 `calculateCompletionRate()` 方法
  - `dashboard.js`: 移除 research 阶段的图标和名称定义
  - `dashboard.css`: 移除 research 阶段样式
- **实现文件**: `senatus-parser.js`, `dashboard.js`, `dashboard.css`

A27. [✅已完成] 修改研究标识颜色为紫色
- 问题背景：用户要求将研究标识的颜色改为 #8250df（紫色）
- 实现内容：
  - 将研究完成标识的背景颜色从蓝色（#0969da）改为紫色（#8250df）
  - 紫色原本是 research 阶段使用的颜色，现在 research 不再是阶段，这个颜色可以用于研究标识
  - 使用独特的紫色可以更好地区分研究标识和阶段标签（阶段标签使用蓝色、绿色、黄色等）
- 修改位置：
  - `dashboard.css`: 修改 `.research-indicator.completed` 的 `background-color` 从 #0969da 改为 #8250df
- **实现文件**: `dashboard.css`

A28. [✅已完成] 调整主题列表中研究标识样式，使其与阶段标签尺寸一致
- 问题背景：All Topics 列表中，主题卡片里的研究标识应该和旁边的 stage 标识尺寸一致，并且不显示文本
- 实现内容：
  - 为主题列表中的研究标识只显示图标（只显示图标）
  - JavaScript 修改：
    - 在 `renderTopicItem()` 函数中，移除研究标识的文本部分（"Researched" / "Not Researched"）
    - 只保留图标 `<i class="fas fa-search"></i>`
- 设计理由：
  - 主题列表项空间有限，图标式设计更简洁
  - 与 stage badge 尺寸统一，视觉更整齐
  - 当前主题卡片保留详细文字说明
  - 鼠标悬停时仍有 title 提示
- 修改位置：
  - `dashboard.js`: 修改 `renderTopicItem()` 函数中的研究标识渲染逻辑
- **实现文件**: `dashboard.js`

A29. [✅已完成] 修复仪表盘交互问题（主题卡片点击限制、研究标识点击、鼠标样式）
- 问题背景：
  - 当 discuss.md 还不存在（new-topic 阶段）时，点击主题卡片会跳转到不存在的文件导致错误
  - 点击研究标识应该跳转到研究报告文件（research.md）
  - 鼠标划到研究标识时不应显示问号（cursor: help）
- 实现内容：
  - 修复1（主题卡片点击限制）：
    - 当主题 `discussionCount === 0` 时，主题卡片不可点击
    - 添加 `disabled` 类，设置 `cursor: not-allowed`、`opacity: 0.6`
    - 移除点击事件监听器，禁用 hover 效果
  - 修复2（研究标识点击功能）：
    - 为研究标识添加点击事件，跳转到 `specify/{topic.dirName}/research.md`
    - 两处实现：当前主题卡片和主题列表
    - 只有 `hasResearch === true` 时才可点击
    - 使用 `e.stopPropagation()` 防止事件冒泡
  - 修复3（鼠标样式修复）：
    - 从 CSS 移除 `cursor: help`
    - 当 `hasResearch === true` 时动态设置 `cursor: pointer`
    - 否则使用默认光标
- 修改位置：
  - `dashboard.js`: 
    - `renderTopicItem()`: 添加点击限制逻辑和研究标识点击事件
    - `renderCurrentTopicCard()`: 添加研究标识点击事件
  - `dashboard.css`: 
    - 添加 `.topic-item.disabled` 样式
    - 移除 `.research-indicator` 的 `cursor: help`
- **实现文件**: `dashboard.js`, `dashboard.css`

---
*创建时间: 2025-09-30*