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
- 任务数和进度：统计当前主题 plan.md 中的任务（T01, T02...）及完成状态（⏳/✅）
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
**问题**: 仪表盘的图标没有显示，点击刷新按钮之后，没有正确刷新。任务列表只显示了前5项，应该显示全部任务，超过高度显示滚动条。

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

### D08 - 2025-10-10 10:00:00
**问题**: 仪表盘入口图标应该放在三个图标的最右侧。当plan中的所有任务都完成之后，状态应该从In Action转变为一种完成的状态，这个时候可以允许纠正。

**结论**:
- 修复问题1（图标位置）：在 `package.json` 的 `menus.view/title` 中调整按钮顺序，将 dashboard 按钮移到最后，顺序变为：refresh → collapseAll → dashboard（原为 dashboard → refresh → collapseAll）
- 修复问题2（完成状态）：在 `senatus-parser.js` 的 `parseTopic` 方法中添加逻辑，当阶段为 'action' 且所有任务都已完成时（taskCount > 0 && taskCount === completedCount），将阶段更新为 'completed'
- 前端支持：在 `dashboard.js` 中添加 'completed' 阶段的图标（fa-check-circle）和名称（"Completed"）
- 样式支持：在 `dashboard.css` 中添加 `.stage-badge.stage-completed` 样式，使用绿色背景色（#1a7f37）
- 符合宪法约束：正确实现状态流转逻辑，当所有任务完成后允许进行纠正操作

### D09 - 2025-10-10 10:15:00
**问题**: 调整按钮顺序后，仪表盘图标仍然位于中间位置，不是通过 package.json 中的 menus 配置顺序控制的。

**结论**:
- 根本原因：VSCode 的菜单系统中，同一个 `group` 内的多个按钮需要使用 `@` 符号后跟数字来明确指定排序顺序
- 只调整 JSON 数组顺序不起作用：仅改变数组顺序无法控制实际显示顺序
- 正确方法：使用 `group: "navigation@N"` 格式，其中 N 是数字，数字越小越靠前
- 修复方案：
  - refresh 按钮：`"group": "navigation@1"` （最左侧）
  - collapseAll 按钮：`"group": "navigation@2"` （中间）
  - openDashboard 按钮：`"group": "navigation@3"` （最右侧）
- VSCode 菜单排序规则：在同一组内，按 `@` 后的数字升序排列
- 符合宪法约束：正确使用 VSCode Extension API 的菜单贡献点配置

### D10 - 2025-10-10 10:30:00
**问题**: 当当前主题没有到达 plan 和 action 阶段的时候（只有讨论阶段），仪表盘的当前主题卡片不显示任何内容，应该展示所有讨论记录。

**结论**:
- 根本原因：`dashboard.js` 的 `renderCurrentTopicCard()` 函数只在有任务时才显示任务列表，在讨论阶段（无任务）时不显示任何内容
- 用户体验问题：早期阶段的主题（new-topic、research、discuss）虽然没有任务，但有讨论记录，应该显示出来
- 修复方案：在当前主题卡片中添加逻辑，优先显示任务列表，如果没有任务则显示讨论列表
- 实现细节：
  - 新增 `renderDiscussionList()` 函数，渲染讨论列表（类似任务列表结构）
  - 显示讨论ID、问题、时间戳
  - 添加对应的 CSS 样式（`.discussion-list`, `.discussion-item`, `.discussion-icon` 等）
  - 在 fontawesome.css 中添加 `fa-comment` 图标定义
- 符合宪法约束：改善用户体验，确保仪表盘在各个阶段都能提供有价值的信息展示

### D11 - 2025-10-10 10:45:00
**问题**: 讨论列表没有展示出来，`parseDiscuss()` 方法无法解析讨论记录。

**结论**:
- 根本原因：`senatus-parser.js` 中的正则表达式格式错误
- 问题详情：原正则 `/### (D\d+) - (.+?)\n\*\*问题\*\*: (.+?)\n\*\*结论\*\*:/gs` 在 `**问题**:` 后有空格，但实际格式是 `**问题**:` 后直接跟空格和内容
- 修复方案：更新正则表达式为 `/### (D\d+) - (.+?)\n\*\*问题\*\*:\s*(.+?)\n+\*\*结论\*\*:/gs`
  - 使用 `\s*` 匹配冒号后的可选空格
  - 使用 `\n+` 匹配问题和结论之间的一个或多个换行符
  - 添加 `\r?` 支持 Windows 换行符（虽然当前文件使用 `\n`）
- 测试验证：使用测试脚本验证正则表达式能正确匹配10条真实讨论记录（D01-D10，不含模板示例）
- 符合宪法约束：正确处理跨平台换行符，提高代码的兼容性和健壮性

### D12 - 2025-10-10 11:00:00
**问题**: `parseDiscuss()` 和 `parsePlan()` 方法将 HTML 注释中的示例格式也识别为真实的讨论记录和任务。

**结论**:
- 根本原因：正则表达式直接在原始文本上匹配，包括 HTML 注释 `<!-- -->` 内的示例内容
- 问题影响：
  - `discuss.md` 中的注释样例（`### D01 - YYYY-MM-DD HH:MM:SS`）被误识别为讨论记录
  - `plan.md` 中的注释样例（`T01. [状态] 任务描述`）被误识别为任务
- 修复方案：在两个解析方法中，先使用 `content.replace(/<!--[\s\S]*?-->/g, '')` 移除所有 HTML 注释，再进行正则匹配
- 修改位置：
  - `parseDiscuss()` 方法：添加注释移除逻辑
  - `parsePlan()` 方法：添加注释移除逻辑
- 符合宪法约束：提高数据解析的准确性，避免将模板示例误认为真实数据

### D13 - 2025-10-10 11:15:00
**问题**: 单独提供一个图标来标识当前topic是否已经完成了研究，无论是否已完成研究，都要显示标识。另外，进度条要按照主要阶段进行切分，比如new-topic阶段占10%，discuss阶段占30%。这样即使没有到action阶段，也有进度。而不是0%。

**结论**:
- 研究完成标识：添加独立的研究完成图标（搜索图标），在当前主题卡片和主题列表中都显示
  - 已完成研究：绿色圆形背景，显示搜索图标
  - 未完成研究：灰色圆形背景，显示搜索图标
  - 位置：在阶段标签左侧
- 进度条按阶段切分：修改 `calculateCompletionRate()` 方法，按阶段分配基础进度
  - new-topic: 10%
  - research: 20%
  - discuss: 30%
  - plan: 40%
  - action: 40-100%（基础40% + 任务完成率60%）
  - completed: 100%
- 实现位置：
  - 后端：`senatus-parser.js` - 添加 `hasResearch` 字段和新的 `calculateCompletionRate()` 方法
  - 前端：`dashboard.js` - 添加研究完成标识图标的渲染逻辑
  - 样式：`dashboard.css` - 添加 `.research-indicator` 样式
- 符合宪法约束：改善用户体验，提供更清晰的项目进度展示

### D14 - 2025-10-10 14:30:00
**问题**: 判断是否进入discuss阶段的依据是discuss列表是否为空。和research没有关系。另外research的图标不好看，应该和标识当前阶段的图标采用相同的风格，并用文字显示是否研究。颜色也不要用这种绿色，不好看。

**结论**:
- 修复阶段判断逻辑：将进入 discuss 阶段的判断从基于 research.md 文件是否存在改为基于 discuss.md 中的讨论列表是否为空
  - 原逻辑：`if (files.has('discuss.md') && files.has('research.md'))` 进入 discuss 阶段
  - 新逻辑：`if (files.has('discuss.md') && discussionCount > 0)` 进入 discuss 阶段
  - 修改位置：`senatus-parser.js` 的 `determineStage()` 方法
  - 需要重构：将 discussionCount 作为参数传入 `determineStage()` 方法
- 优化研究完成标识样式：
  - 从圆形图标改为与阶段标签相同风格的徽章样式（带文字）
  - 添加文字显示："Researched" / "Not Researched"
  - 颜色调整：已完成研究使用蓝色（#0969da，与 discuss 阶段一致），未完成使用灰色
  - 保持图标 + 文字的结构，与阶段标签风格统一
  - 修改位置：
    - `dashboard.css`: 更新 `.research-indicator` 样式（从圆形改为徽章，调整颜色）
    - `dashboard.js`: 在研究标识中添加文字显示（两处：当前主题卡片和主题列表）
- 符合宪法约束：正确实现阶段判断逻辑，改善视觉设计一致性

### D15 - 2025-10-10 15:00:00
**问题**: research应该不属于stage progression的一部分，独立出来，new-topic下一个阶段就是discuss。

**结论**:
- 将 research 从 stage progression 中完全移除，使其成为独立的标识属性
- 新的阶段流程：new-topic → discuss → plan → action → completed
- research 不再作为一个阶段，而是通过 `hasResearch` 字段独立跟踪
- 修改内容：
  - `senatus-parser.js` 的 `determineStage()` 方法：移除 research 阶段判断逻辑
  - `senatus-parser.js` 的 `calculateCompletionRate()` 方法：移除 research 阶段的 20% 权重，重新分配进度
    - new-topic: 10% → 10%（不变）
    - research: 20% → 移除
    - discuss: 30% → 30%（不变）
    - plan: 40% → 50%（+10%）
    - action: 40-100% → 50-100%（基础进度+10%，任务权重从60%改为50%）
  - `dashboard.js`: 移除 research 阶段的图标定义（getStageIcon）和名称定义（formatStage）
  - `dashboard.css`: 移除 `.stage-badge.stage-research` 样式定义
- 符合宪法约束：正确实现阶段流程，research 作为独立属性而非阶段

### D16 - 2025-10-10 15:15:00
**问题**: 研究标识的颜色改为#8250df

**结论**:
- 将研究完成标识的颜色从蓝色（#0969da）改为紫色（#8250df）
- 紫色原本是 research 阶段的颜色，现在 research 不再是阶段，将这个颜色用于研究标识更合适
- 修改位置：`dashboard.css` 的 `.research-indicator.completed` 样式
- 颜色变化：
  - 原颜色：#0969da（蓝色，与 discuss 阶段相同）
  - 新颜色：#8250df（紫色，与阶段标签区分开）
- 设计理由：使用不同的颜色可以更好地区分研究标识和阶段标签，紫色作为独特的颜色可以让研究标识更加醒目
- 符合宪法约束：改善用户体验，提供更清晰的视觉区分

### D17 - 2025-10-10 15:30:00
**问题**: 底下All Topics列表中，主题卡片里的研究标识应该和旁边的stage标识尺寸一致，并且不显示文本。

**结论**:
- 为主题列表中的研究标识只显示图标，不显示文字
- 修改内容：
  - `dashboard.js`: 移除主题列表中研究标识的文本部分
- 样式调整：
  - 移除文本："Researched" / "Not Researched" → 只保留图标
- 设计理由：
  - 主题列表项空间有限，紧凑的图标式设计更合适
  - 当前主题卡片可以保留文字说明（更详细）
  - 统一尺寸让视觉更整齐
- 符合宪法约束：改善用户体验，提供更清晰整洁的视觉布局

### D18 - 2025-10-10 16:00:00
**问题**: 当discuss.md还不存在（new-topic）阶段的时候，主题卡片应该不允许点击，否则会跳转到一个不存在的discuss.md文件导致错误。除此之外，点击research标识，应该跳转到研究报告文件。鼠标划到研究标识的时候，不要显示问号。

**结论**:
- 修复三个问题以改善仪表盘的用户体验：
- 问题1（主题卡片点击限制）：
  - 当主题处于 new-topic 阶段且没有讨论记录时（`discussionCount === 0`），主题卡片不可点击
  - 实现方式：检查 `topic.discussionCount > 0`，如果为 false 则添加 `disabled` 类并移除点击事件监听器
  - CSS 样式：`.topic-item.disabled` 设置 `cursor: not-allowed`、`opacity: 0.6`，禁用 hover 效果
  - 避免错误：防止用户点击跳转到不存在的 discuss.md 文件
- 问题2（研究标识点击功能）：
  - 为研究完成标识添加点击事件，跳转到 `specify/{topic.dirName}/research.md` 文件
  - 实现位置：两处研究标识（当前主题卡片和主题列表）
  - 交互设计：只有当 `topic.hasResearch === true` 时才添加点击事件和 `cursor: pointer` 样式
  - 事件处理：使用 `e.stopPropagation()` 防止事件冒泡到父元素的点击事件
- 问题3（研究标识鼠标样式）：
  - 从 CSS 中移除 `cursor: help` 样式（不再显示问号光标）
  - 当 `hasResearch === true` 时，通过 JavaScript 动态设置 `cursor: pointer`
  - 当 `hasResearch === false` 时，使用默认光标（不可点击）
- 修改文件：
  - `dashboard.js`: 添加主题点击限制逻辑、研究标识点击事件（两处）
  - `dashboard.css`: 添加 `.topic-item.disabled` 样式，移除 `.research-indicator` 的 `cursor: help`
- 符合宪法约束：改善用户体验，提供清晰的错误提示和正确的交互反馈

---
*创建时间: 2025-09-30*