# 讨论主题: Extension 代码重构

## 概述
重构 extension 目录中的代码、样式和 HTML 文件，提升代码质量、可维护性和用户体验。

## 讨论记录
<!--
每次讨论记录格式：
### D01 - YYYY-MM-DD HH:MM:SS
**问题**: [讨论的具体问题]
**结论**: [达成的结论或决策]

编号格式: D01, D02, D03...（D = Discussion）
-->

### D01 - 2025-10-11 10:30:00
**问题**: DashboardProvider 中的 getErrorHtml 方法内联了整个 HTML 字符串，不符合项目的模板化架构。应该如何重构？
**结论**: 
- 不与 viewer/error.html 复用，因为两者的语义和用户体验需求不同（Dashboard 需要更显眼的错误提示，Viewer 需要轻量级提示）
- 采用方案 A：为 Dashboard 创建独立的错误模板文件 `extension/webview/dashboard/error.html`
- 模板设计要点：
  - 使用 Font Awesome 图标保持与 Dashboard 其他部分一致
  - 采用居中布局，视觉效果更好
  - 包含独立的标题和消息占位符 {{message}}
  - 使用 VSCode CSS 变量确保主题适配
- 修改 DashboardProvider.getErrorHtml() 方法使用模板加载而非内联 HTML

### D02 - 2025-10-11 11:00:00
**问题**: CSS 变量在 `dashboard.css` 和 `viewer.css` 中完全重复（约 20-30 行），存在代码重复问题。应该如何解决？是否违反项目宪法的"自包含性"约束？
**结论**:
- **采纳方案 A 改进版**：创建共享 CSS 变量文件 `extension/webview/shared/variables.css`
- **宪法解释**："自包含性"应理解为"避免外部 CDN 依赖"，而非"内部完全隔离"
  - 项目已有 `shared/file-icons.js` 证明允许 webview 之间共享代码
  - 共享内部资源不违反宪法约束
- **共享范围**：仅共享 CSS 变量定义（约 20 行），不共享组件样式
  - `:root` 中的颜色变量（--color-*）
  - `[data-vscode-theme-kind="vscode-dark"]` 深色主题变量
  - `--font-mono` 字体定义
- **实施方式**：
  - 创建 `extension/webview/shared/variables.css`
  - 在 HTML 模板中先引入 `variables.css`，再引入组件特定的 CSS
  - 更新 `ResourceUri` 工具类，为各视图添加 `sharedVariablesUri`
  - 从 `dashboard.css` 和 `viewer.css` 中移除重复的变量定义
- **优势**：
  - 统一管理颜色变量，修改一处生效全局
  - 未来新增 webview（如 guide）可直接复用
  - 降低维护成本和同步错误风险
  - 保持最小共享原则，各视图仍然独立

### D03 - 2025-10-11 11:15:00
**问题**: 前端 JavaScript 文件（特别是 dashboard.js 有 590 行）是否需要进行模块化重构？应该使用 ES6 模块拆分文件，还是在单文件内使用对象/类组织代码？
**结论**:
- **保持现状**：继续使用单文件 IIFE 模式，不进行模块化重构
- **理由**：
  - 当前的代码结构（IIFE + 函数定义）没有根本性问题
  - 符合项目"原生 JavaScript (无框架)"的技术约束
  - 简单直接，无需引入额外的复杂性
  - 浏览器原生支持，无需构建步骤
- **重构重点**：
  - **消除冗余代码**而非改变代码组织结构
  - 确保没有重复的函数或逻辑
  - 提取可复用的工具函数到 `shared/` 目录（如已有的 `file-icons.js`）
  - 保持函数职责单一，添加清晰的注释
- **质量标准**：
  - 无冗余代码
  - 函数命名清晰
  - 适当的代码注释
  - 逻辑简洁明了

### D04 - 2025-10-11 11:30:00
**问题**: 当前的模板渲染系统（`WebviewUtils.renderTemplate()`）使用简单的字符串替换，没有变量验证。是否需要添加模板变量验证机制，防止拼写错误和遗漏变量？
**结论**:
- **保持现状**：不添加模板变量验证机制
- **理由**：
  - 当前的简单字符串替换系统已经足够可靠
  - 手动测试可以发现模板变量问题
  - 项目规模适中，不需要额外的验证复杂度
  - 保持代码简洁，符合"简单优于复杂"的原则
- **质量保证方式**：
  - 通过开发过程中的测试发现问题
  - 代码审查时检查模板变量的正确性
  - 保持模板变量命名的一致性和清晰性

### D05 - 2025-10-11 11:45:00
**问题**: `escapeHtml` 函数在前端（`viewer.js`）和后端（`webview-utils.js`）中重复定义，存在代码冗余。前端的 `escapeHtml` 是否应该提取到共享文件？
**结论**:
- **实施重构**：将前端的 `escapeHtml` 提取到共享工具文件
- **方案**：
  - 创建 `extension/webview/shared/utils.js` 作为前端共享工具函数文件
  - 将 `escapeHtml` 函数从 `viewer.js` 移至 `shared/utils.js`
  - 在 `viewer.html` 中引入共享工具文件（在 `viewer.js` 之前加载）
  - 更新 `ResourceUri` 工具类，为 viewer 添加 `sharedUtilsUri`
- **理由**：
  - 消除前端代码重复
  - 统一前端工具函数位置（与 `file-icons.js` 同在 `shared/` 目录）
  - 为未来可能的其他共享工具函数提供基础
  - 符合 D03 决策："提取可复用的工具函数到 `shared/` 目录"
- **说明**：
  - 后端的 `WebviewUtils.escapeHtml` 保持不变（Node.js 环境使用）
  - 前端和后端各有独立的 `escapeHtml` 是合理的（不同运行环境）
  - 未来如果 dashboard.js 或 sidebar.js 需要 `escapeHtml`，可直接引用共享文件

### D06 - 2025-10-11 12:00:00
**问题**: `text.html` 和 `error.html` 使用内联样式，与其他模板（使用外部 CSS 文件）不一致。是否需要提取为外部 CSS 文件？
**结论**:
- **保持现状**：`text.html` 和 `error.html` 继续使用内联样式
- **理由**：
  - 这两个文件比较特殊，是简单的工具性页面
  - 样式非常简单（10-14 行），提取意义不大
  - 保持自包含性，便于快速加载和理解
  - 不需要复杂的样式系统和共享变量
  - 避免为简单页面引入不必要的复杂性
- **适用范围**：
  - 正常的功能页面（dashboard, sidebar, viewer）使用外部 CSS
  - 简单的工具页面（text, error）可以使用内联样式
  - 这种区分是合理的架构选择

### D07 - 2025-10-11 12:10:00
**问题**: `ResourceUri` 类中 Font Awesome 的 URI 路径在三个方法（getViewerUris, getSidebarUris, getDashboardUris）中重复。是否需要提取为独立方法消除重复？
**结论**:
- **不需要重构**：保持现状，接受这种程度的重复
- **理由**：
  - 改动收益太小，只是减少了几行重复代码
  - 增加了额外的方法调用层级，降低代码直观性
  - 当前的重复是局部的、易于理解的
  - 如果 Font Awesome 路径需要修改，3 处改动也是可接受的维护成本
  - 不值得为了消除这种小规模重复而增加代码复杂度
- **重构原则**：
  - 重构应该有明显的收益（可读性、可维护性、性能）
  - 避免为了消除所有重复而过度抽象
  - 保持代码简单直观优先于绝对的 DRY 原则

### D08 - 2025-10-11 12:20:00
**问题**: 前端 JavaScript 文件的状态管理模式不一致。Sidebar 使用 VSCode State API（`vscode.setState/getState`）进行状态持久化，Dashboard 使用内存状态 + 消息响应式更新，Viewer 没有明确的状态管理。是否需要统一状态管理模式？
**结论**:
- **保持现状**：不对状态管理模式进行统一化改造
- **理由**：
  - 不同视图有不同的状态管理需求，强制统一反而会降低灵活性
  - 当前的实现方式已经能够满足各自的功能需求
  - 避免为了统一而引入不必要的复杂度
  - 符合"简单优于复杂"的原则
- **现状说明**：
  - Sidebar 需要持久化 UI 状态（展开/折叠、选中项），使用 VSCode State API 是合适的
  - Dashboard 处理动态数据（主题列表），使用内存 + 消息更新是合理的
  - Viewer 当前不需要状态管理，无需强制添加
- **未来指导**：
  - 如果未来需要添加状态管理，根据具体需求选择合适的方案
  - UI 状态优先考虑 VSCode State API
  - 动态数据优先考虑内存 + 消息更新

### D09 - 2025-10-11 12:45:00
**问题**: 后端代码中存在以下可重构的地方：1) 消息处理逻辑在不同 Provider 中的实现方式不一致；2) SenatusParser 中 HTML 注释移除逻辑重复；3) 路径验证逻辑只在 DashboardProvider 中存在；4) 文件系统监控的防抖实现重复；5) 错误提示消息的一致性问题。哪些需要重构，哪些保持现状？
**结论**:
- **问题1（消息处理）**: **保持现状**
  - 不同 Provider 的消息处理逻辑虽然形式相似，但具体业务逻辑不同
  - 强制统一反而会增加复杂度，降低代码可读性
- **问题2（正则预处理）**: **需要重构**
  - 在 `SenatusParser` 类中添加私有方法 `preprocessContent(content)` 统一处理 HTML 注释移除
  - 在 `parseDiscuss()` 和 `parsePlan()` 方法中调用此方法
  - 未来如需添加其他预处理步骤（如去除代码块）可在此方法中统一处理
- **问题3（路径验证）**: **需要重构**
  - 创建 `extension/src/utils/utils.js` 文件作为通用工具函数集合
  - 添加 `validatePath(basePath, targetPath, protectedFiles)` 静态方法
  - 支持防止目录遍历攻击和保护特定文件（如 constitution.md）
  - 提供统一的路径安全验证机制
- **问题4（防抖函数）**: **需要重构**
  - 添加到 `extension/src/utils/utils.js` 文件
  - 添加 `debounce(func, delay)` 静态方法
  - 支持自定义延迟时间和取消功能（通过 `.cancel()` 方法）
  - 替换 DashboardProvider 和 extension.js 中的防抖实现
- **问题5（错误提示）**: **保持现状**
  - 虽然验证逻辑相似，但每个操作的错误提示和确认对话框有各自的语义
  - 保持独立性使代码更清晰，易于针对具体操作调整提示文案
- **文件组织原则**：
  - `webview-utils.js` 保持专门用于 webview 相关工具（escapeHtml, renderTemplate）
  - 新建 `utils.js` 存放通用工具函数（validatePath, debounce）
  - 避免创建过多公共函数文件，保持项目结构简洁

### D10 - 2025-10-11 13:00:00
**问题**: 代码中的注释存在什么问题？应该如何优化？具体来说：1) 是否需要 JSDoc 风格的详细注释（@param、@returns）？2) 哪些类型的注释应该保留，哪些应该删除？3) 注释的详细程度应该如何把握？
**结论**:
- **JSDoc 注释**: **全部删除**
  - 不需要 JSDoc 风格的 `@param`、`@returns` 等参数文档注释
  - JSDoc 风格过于罗嗦，不符合项目简洁代码的要求
  - 函数签名和命名本身应该足够清晰
- **需要删除的注释类型**：
  - 过度详细的状态说明（如 `// Track if HTML is loaded` - 变量名已说明）
  - 显而易见的简单操作（如 `// Get workspace folder`、`// Sort by sequence number`）
  - Bug 修复和边缘场景的解释性注释（如 `// Remove HTML comments to avoid matching example patterns`）
  - 特定 API 常量说明（如 `// ColorThemeKind: Light = 1, Dark = 2...`）
  - 中间开发阶段累加的调试注释
- **保留的注释类型**：
  - 类级别的简短功能说明（1-2 行）
  - 复杂业务逻辑的高层说明（如阶段判断规则、权重计算逻辑）
  - 关键算法步骤的简要说明
- **注释风格**：
  - 采用方案 A（无注释）或方案 B（单行简短注释）
  - 如需注释，保持简洁直白，只解释代码的"做什么"而非"怎么做"
  - 避免注释重复代码已经表达的信息
- **重构原则**：
  - 优先通过清晰的命名和代码结构消除对注释的需求
  - 注释应该补充代码无法表达的业务意图，而非重述代码逻辑
  - 保持注释的最小化原则

### D11 - 2025-10-11 13:15:00
**问题**: 代码中是否存在过长的逻辑片段需要简化？具体关注：1) Dashboard Provider 中的三个删除/回滚方法（每个约 40-60 行）是否需要提取共用逻辑？2) Dashboard 前端的 `renderTopicItem()` 函数（约 80 行）是否需要拆分？3) `showContextMenu()` 函数（约 70 行）是否需要简化？4) 对于 DOM 创建相关的函数，什么长度是可接受的？
**结论**:
- **删除/回滚方法**: **不需要合并**
  - 三个方法虽有相似结构，但每个操作的业务语义不同
  - 保持独立使各操作的验证逻辑和确认消息更清晰
  - 强制提取共用逻辑可能降低代码可读性
- **renderTopicItem() 函数**: **不需要拆分**
  - 虽然有 80 行，但逻辑是线性的（创建元素→组装→返回）
  - 拆分成更小的函数可能导致函数数量过多，降低可读性
  - 当前的组织方式已经足够清晰
- **showContextMenu() 函数**: **不需要简化**
  - 逻辑清晰，包含多个条件分支是合理的
  - 将菜单项创建逻辑抽取为配置对象可能降低代码直观性
- **代码长度原则**: **重点是逻辑清晰，长度不是重点**
  - 对于 DOM 创建相关的函数，只要逻辑清晰，长度可接受
  - 避免为了减少行数而过度抽象
  - 线性逻辑流程比人为拆分的多层函数调用更易理解
- **重复逻辑处理**: 
  - SenatusParser 中的 HTML 注释移除重复（D09 中决定要重构）经讨论后决定**不需要提取**
  - 这种简单的两次重复是可以接受的
  - 避免为消除所有小规模重复而过度抽象

### D12 - 2025-10-11 13:30:00
**问题**: 确认重构范围，明确哪些讨论内容需要实际执行重构，哪些保持现状不动。
**结论**:
- **需要重构的内容**（仅这些会被修改）：
  1. **D01**: 创建 Dashboard 错误模板 `error.html`，修改 `getErrorHtml()` 使用模板
  2. **D02**: 创建共享 CSS 变量文件 `shared/variables.css`，更新相关引用
  3. **D05**: 创建共享工具文件 `shared/utils.js`，提取前端 `escapeHtml` 函数
  4. **D09 部分**: 创建 `utils.js` 添加 `validatePath()` 和 `debounce()` 方法（问题3、问题4）
  5. **D10**: 优化注释（删除 JSDoc、过度详细和显而易见的注释）
- **明确保持现状**（不做任何修改）：
  - D03: JavaScript 文件保持单文件 IIFE 模式
  - D04: 不添加模板变量验证
  - D06: `text.html` 和 `error.html` 保持内联样式
  - D07: ResourceUri 中的重复可接受
  - D08: 不统一状态管理模式
  - D09: 问题1（消息处理）、问题2（正则预处理，D11改为不需要）、问题5（错误提示）
  - D11: 不合并删除/回滚方法，不拆分长函数，SenatusParser 重复可接受
- **执行原则**：
  - 只修改讨论中明确决定"需要重构"的内容
  - 讨论中决定"保持现状"或"不需要"的内容，一律不修改
  - 未讨论到的内容,一律不擅自修改

### D13 - 2025-10-11 13:45:00
**问题**: 打开 markdown 文件时报错 "Failed to load file: marked is not a function"
**结论**: 
- 问题原因：`file-viewer-provider.js` 第 4 行使用了错误的 marked 导入方式
- 错误代码：`const marked = require('marked');`
- 正确代码：`const { marked } = require('marked');`
- marked v9.x 使用命名导出而非默认导出
- 项目其他文件（server.js、senatus-parser.js）已正确使用命名导入
- 修复：更新 file-viewer-provider.js 使用正确的导入语法

### D14 - 2025-10-11 14:00:00
**问题**: utils 目录中的文件职责是否清晰？是否存在职责不清或可以合并的情况？具体关注：1) `webview-base.js` 和 `webview-utils.js` 是否应该合并？2) D09 中计划的 `utils.js`（包含 validatePath 和 debounce）是否应该合并到其他文件？3) `utils.js` 这个名字是否太宽泛？
**结论**:
- **utils 目录文件职责评估**：
  - `file-filter.js` - 职责清晰（.specinclude 解析和文件过滤）
  - `resource-uri.js` - 职责清晰（Webview 资源 URI 生成）
  - `senatus-installer.js` - 职责清晰（框架安装）
  - `senatus-parser.js` - 职责清晰（Senatus 数据解析）
  - `webview-base.js` - 基类（模板加载）
  - `webview-utils.js` - 工具函数（仅 2 个静态方法，职责范围较窄）
- **合并决策1**：`webview-base.js` + `webview-utils.js` → **`webview-utils.js`**
  - 理由：两者紧密相关，都服务于 webview 开发
  - 所有 Provider 都同时引用这两个文件，天然耦合
  - 合并后约 65 行，不会过于臃肿
  - 保留 `webview-utils.js` 作为文件名（更常见的命名习惯）
- **合并决策2**：`utils.js`（validatePath + debounce）→ 合并到 **`file-utils.js`**
  - 理由：`validatePath()` 是文件路径相关，`debounce()` 主要用于文件监控
  - 两者都与文件操作场景相关
  - 避免创建宽泛的 `utils.js` 文件
- **重命名决策**：`file-filter.js` → **`file-utils.js`**
  - 理由：需要容纳更多文件相关功能（过滤、验证、防抖）
  - `file-utils` 比 `file-filter` 更宽泛，适合扩展
- **最终 utils 目录结构**（从 6 个文件优化为 5 个）：
  ```
  extension/src/utils/
  ├── file-utils.js              # 文件相关工具
  │   ├── FileFilter 类          # 文件过滤（原 file-filter.js）
  │   ├── validatePath()         # 路径安全验证（原计划的 utils.js）
  │   └── debounce()             # 防抖函数（原计划的 utils.js）
  ├── webview-utils.js           # Webview 开发工具
  │   ├── WebviewBase 类         # 模板加载基类（原 webview-base.js）
  │   └── WebviewUtils 类        # 工具函数（原 webview-utils.js）
  ├── resource-uri.js            # 资源 URI 生成
  ├── senatus-installer.js       # Senatus 安装
  └── senatus-parser.js          # Senatus 解析
  ```
- **修改影响**：
  - 需要更新所有 Provider 文件中对 `webview-base` 和 `webview-utils` 的引用
  - 需要更新使用 `FileFilter` 的地方（extension.js, sidebar-provider.js）
- **D09 和 D13 的调整**：
  - D09 中的 `utils.js` 改为合并到 `file-utils.js`
  - D13 第一批任务中的"创建 utils.js"改为"扩展 file-utils.js"

### D15 - 2025-10-11 14:30:00
**问题**: 重新评估这些重构项目的依赖顺序，设计一个合理的重构顺序。
**结论**:
- **依赖关系分析**：
  - D14 (utils 目录重构) - 最底层，无依赖，被 D01/D02/D05 依赖
  - D02 (共享 CSS 变量) - 依赖 D14，需要更新 ResourceUri 类
  - D05 (共享前端 utils) - 依赖 D14，需要更新 ResourceUri 类
  - D01 (Dashboard 错误模板) - 依赖 D14，需要使用合并后的 WebviewUtils
  - D10 (注释优化) - 依赖所有结构性重构完成
- **重构顺序**：
  ```
  第一批（基础设施重构 - 必须最先）:
  └─ D14: utils 目录重构
     ├─ 步骤 1: 合并 webview-base.js + webview-utils.js → webview-utils.js
     ├─ 步骤 2: 重命名 file-filter.js → file-utils.js
     ├─ 步骤 3: 添加 validatePath() 和 debounce() 到 file-utils.js
     └─ 步骤 4: 更新所有引用（Providers, extension.js）
  
  第二批（前端共享资源 - 可并行）:
  ├─ D02: 共享 CSS 变量（创建 shared/variables.css）
  └─ D05: 共享前端工具（创建 shared/utils.js，提取 escapeHtml）
  
  第三批（模板化改造）:
  └─ D01: Dashboard 错误模板（创建 dashboard/error.html）
  
  第四批（代码质量优化 - 最后）:
  └─ D10: 注释优化（删除冗余注释）
  ```
- **顺序说明**：
  - D14 是底层基础设施，影响最广，必须最先完成
  - D02 和 D05 都依赖 D14，但互不依赖，可以并行进行
  - D01 需要使用 D14 合并后的 WebviewUtils，建议在 D02/D05 后进行
  - D10 应在所有代码结构稳定后进行，避免反复修改
- **风险控制**：
  - 每批完成后进行功能测试
  - 每批作为独立 commit，便于回滚
  - D14 可分成更小的 commits（每个步骤一个）
- **测试重点**：
  - D14: 所有 Provider 的实例化和功能
  - D02: 深色/浅色主题切换
  - D05: Viewer 的特殊字符显示
  - D01: Dashboard 错误场景触发

### D16 - 2025-10-11 15:00:00
**问题**: 页面样式全都不对了,检查哪里改坏了
**结论**:
- 问题原因：T06-T09 重构时创建了共享 CSS 变量文件并在 HTML 模板中引用,但忘记在后端模板渲染时传递对应的 URI 变量
- 影响范围：所有三个视图(Dashboard、Viewer、Sidebar)
- 具体问题：
  - HTML 模板中引用了 `{{sharedVariablesUri}}` 占位符
  - viewer.html 还引用了 `{{sharedUtilsUri}}` 占位符
  - 但在 Provider 的 `renderTemplate()` 调用中没有传递这些变量
  - 导致占位符未被替换,CSS 变量文件无法加载,页面样式全部丢失
- 修复方案：
  - dashboard-provider.js: 在 `getDashboardHtml()` 中添加 `sharedVariablesUri: uris.sharedVariables`
  - file-viewer-provider.js: 在 `getMarkdownWebviewContent()` 中添加 `sharedVariablesUri` 和 `sharedUtilsUri`
  - sidebar-provider.js: 在 `getHtmlContent()` 中添加 `sharedVariablesUri: uris.sharedVariables`
- 教训：重构时修改了 HTML 模板和资源 URI 配置,但忘记同步更新使用这些模板的代码

### D17 - 2025-10-11 15:30:00
**问题**: FileFilter和FileUtils能不能合并成FileUtils类，WebviewBase和WebviewUtils类合并成WebviewUtils类？
**结论**:
- **FileFilter + FileUtils 合并方案**：
  - 将 FileFilter 类的所有实例方法合并到 FileUtils 类中
  - FileUtils 类既包含实例方法（文件过滤功能）也包含静态方法（validatePath, debounce）
  - 更新所有引用：`FileFilter` → `FileUtils`，`fileFilter` → `fileUtils`
- **WebviewBase + WebviewUtils 合并方案**：
  - 将 WebviewBase 类的模板加载功能合并到 WebviewUtils 类中
  - WebviewUtils 类既包含实例方法（loadTemplate, loadTemplates, clearTemplateCache）也包含静态方法（escapeHtml, renderTemplate）
  - 所有 Provider 从继承 `WebviewBase` 改为继承 `WebviewUtils`
  - 删除单独的 `WebviewBase` 引用
- **优势**：
  - 简化类结构，减少文件间依赖
  - 每个工具类职责更聚焦（FileUtils 专注文件操作，WebviewUtils 专注 webview 操作）
  - 减少导入语句的重复（之前很多文件同时导入 WebviewBase 和 WebviewUtils）
- **修改影响**：
  - file-utils.js: 合并 FileFilter 和 FileUtils 类
  - webview-utils.js: 合并 WebviewBase 和 WebviewUtils 类
  - extension.js: `fileFilter` → `fileUtils`
  - sidebar-provider.js: `extends WebviewBase` → `extends WebviewUtils`, `fileFilter` → `fileUtils`
  - dashboard-provider.js: `extends WebviewBase` → `extends WebviewUtils`
  - file-viewer-provider.js: `extends WebviewBase` → `extends WebviewUtils`

### D18 - 2025-10-11 16:00:00
**问题**: Provider不要继承WebviewUtils，这种设计不好
**结论**:
- **继承设计的问题**：
  - Provider 继承 WebviewUtils 只是为了使用 `loadTemplate()` 等实例方法
  - WebviewUtils 的静态方法（escapeHtml、renderTemplate）不需要继承就能使用
  - 这违反了"组合优于继承"的设计原则
  - 继承关系暴露了不必要的父类方法，增加了耦合
- **改为组合模式的方案**：
  - 所有 Provider 不再继承 WebviewUtils
  - 在 Provider 构造函数中创建 WebviewUtils 实例：`this.webviewUtils = new WebviewUtils(context)`
  - 通过实例调用模板加载方法：`this.webviewUtils.loadTemplate()`
  - 静态方法继续直接调用：`WebviewUtils.renderTemplate()`
- **优势**：
  - Provider 类更独立，职责更清晰
  - 不会暴露不需要的父类方法
  - 符合"组合优于继承"的设计原则
  - 更灵活，可以轻松替换模板加载实现
  - 降低类之间的耦合度
- **修改影响**：
  - dashboard-provider.js: 删除继承，添加 `this.webviewUtils` 组合对象
  - file-viewer-provider.js: 删除继承，添加 `this.webviewUtils` 组合对象
  - sidebar-provider.js: 删除继承，添加 `this.webviewUtils` 组合对象
  - 所有 `super.loadTemplate()` 或 `this.loadTemplate()` 改为 `this.webviewUtils.loadTemplate()`

---
*创建时间: 2025-10-11*
