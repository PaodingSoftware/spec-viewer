# 项目研究报告

## 关联主题
specify/003-extension-code-refactoring/discuss.md

## 技术栈现状

### VSCode Extension API
- **版本**: ^1.104.0
- **主要使用的 API**:
  - `vscode.window.createWebviewPanel` - 创建自定义 webview 面板
  - `vscode.window.registerWebviewViewProvider` - 注册侧边栏 webview
  - `vscode.workspace.createFileSystemWatcher` - 文件系统监控
  - `vscode.commands.registerCommand` - 注册命令
  - `vscode.ColorThemeKind` - 主题检测

### 前端技术
- **Markdown 渲染**: marked ^9.1.2
- **代码高亮**: highlight.js (bundled)
- **图标库**: Font Awesome (bundled)
- **样式**: 纯 CSS (无预处理器)
- **脚本**: 原生 JavaScript (无框架)

### Node.js 依赖
- **文件监控**: chokidar ^3.5.3
- **HTTP 服务器**: express ^4.18.2 (CLI 模式)
- **实时通信**: socket.io ^4.7.2 (CLI 模式)
- **文件类型**: mime-types ^2.1.35
- **命令行**: commander ^11.0.0 (CLI 模式)
- **文件过滤**: ignore ^5.2.4

## 代码风格

### 目录结构
```
extension/
├── assets/                    # 静态资源
│   ├── fontawesome/          # Font Awesome 图标库
│   ├── highlight.js/         # 代码高亮库
│   └── webfonts/             # 字体文件
├── icons/                     # 扩展图标
├── src/                       # 后端代码（Node.js）
│   ├── extension.js          # 扩展主入口
│   ├── providers/            # Webview 提供者
│   │   ├── dashboard-provider.js
│   │   ├── file-viewer-provider.js
│   │   └── sidebar-provider.js
│   └── utils/                # 工具类
│       ├── file-filter.js
│       ├── resource-uri.js
│       ├── senatus-installer.js
│       ├── senatus-parser.js
│       ├── webview-base.js
│       └── webview-utils.js
└── webview/                   # 前端代码（Browser）
    ├── dashboard/            # 仪表板视图
    │   ├── dashboard.css
    │   ├── dashboard.html
    │   └── dashboard.js
    ├── guide/                # 引导视图（未实现）
    ├── shared/               # 共享代码
    │   └── file-icons.js
    ├── sidebar/              # 侧边栏视图
    │   ├── sidebar.css
    │   ├── sidebar.html
    │   └── sidebar.js
    └── viewer/               # 文件查看器
        ├── error.html
        ├── text.html
        ├── viewer.css
        ├── viewer.html
        └── viewer.js
```

### 代码组织模式
- **Provider 模式**: 每个 webview 功能封装为独立的 Provider 类
- **单例模式**: Dashboard 和 File Viewer 使用单例 panel 管理
- **模板渲染**: HTML 模板通过占位符替换生成动态内容
- **事件驱动**: 使用 VSCode 的 `postMessage` 进行前后端通信
- **资源缓存**: WebviewBase 提供模板缓存机制

### 命名规范
- **文件命名**: kebab-case (如 `dashboard-provider.js`)
- **类命名**: PascalCase (如 `DashboardProvider`)
- **函数命名**: camelCase (如 `openDashboard`)
- **CSS 类命名**: kebab-case with BEM-like structure (如 `.dashboard-header`, `.topic-item`)
- **私有方法**: 使用下划线前缀 (如 `_toUri`)

### 编程模式
- **ES6 模块**: CommonJS (require/module.exports)
- **异步处理**: async/await 模式
- **错误处理**: try-catch 块包裹异步操作
- **文档注释**: JSDoc 风格注释
- **防抖机制**: 文件监控使用 300ms/1000ms 防抖

## 相关目录结构

### Provider 模块
```
extension/src/providers/
├── dashboard-provider.js      # Senatus Dashboard (420 行)
│   - 仪表板主面板管理
│   - 文件监控和自动刷新
│   - 主题删除、研究删除、回滚功能
│   - 使用 SenatusParser 解析数据
│
├── file-viewer-provider.js    # Markdown/文本查看器 (150 行)
│   - 多文件标签页管理
│   - Markdown 渲染和代码高亮
│   - 预览/源码切换
│   - 主题自适应
│
└── sidebar-provider.js        # 侧边栏文件树 (120 行)
    - 目录树递归构建
    - 文件过滤（.specinclude）
    - 展开/折叠状态管理
```

### Utils 模块
```
extension/src/utils/
├── webview-base.js            # Webview 基类 (40 行)
│   - 模板加载和缓存
│   - 批量加载模板
│
├── webview-utils.js           # Webview 工具 (25 行)
│   - HTML 转义
│   - 模板变量替换
│
├── resource-uri.js            # 资源 URI 生成 (30 行)
│   - Webview URI 转换
│   - 各视图的资源路径配置
│
├── file-filter.js             # 文件过滤 (80 行)
│   - .specinclude 解析
│   - 通配符模式匹配
│
├── senatus-parser.js          # Senatus 数据解析 (280 行)
│   - 主题目录扫描
│   - discuss.md/plan.md 解析
│   - 阶段判断和进度计算
│
└── senatus-installer.js       # Senatus 安装器 (80 行)
    - 框架文件复制
    - 目录递归创建
```

### Webview 前端
```
extension/webview/
├── dashboard/                 # 仪表板 (800+ 行 CSS + JS)
│   ├── dashboard.html        # 模板结构
│   ├── dashboard.css         # 样式（包含深色主题）
│   └── dashboard.js          # 前端逻辑（渲染、交互、右键菜单）
│
├── sidebar/                   # 侧边栏 (300+ 行 CSS + JS)
│   ├── sidebar.html          # 模板结构
│   ├── sidebar.css           # 样式（文件树样式）
│   └── sidebar.js            # 前端逻辑（树渲染、搜索、状态保存）
│
├── viewer/                    # 查看器 (600+ 行 CSS + JS)
│   ├── viewer.html           # 主模板
│   ├── viewer.css            # Markdown 样式（GitHub 风格）
│   ├── viewer.js             # 预览/源码切换、大纲生成
│   ├── text.html             # 纯文本模板
│   └── error.html            # 错误页面模板
│
└── shared/
    └── file-icons.js          # 文件图标映射（60+ 文件类型）
```

## 相关业务逻辑

### 1. 扩展激活流程
```
extension.js::activate()
  ├─ 检查工作区
  ├─ 初始化 SidebarProvider
  │   └─ FileFilter.initialize() - 加载 .specinclude
  ├─ 创建文件监控器 (防抖 300ms)
  ├─ 注册 WebviewViewProvider (sidebar)
  ├─ 初始化 FileViewerProvider
  ├─ 初始化 DashboardProvider
  └─ 注册命令
      ├─ spec-viewer.openFile
      ├─ spec-viewer.openDashboard
      ├─ spec-viewer.collapseAll
      ├─ spec-viewer.refresh
      └─ spec-viewer.installSenatus
```

### 2. Dashboard 数据流
```
DashboardProvider::openDashboard()
  ├─ 创建/显示 Webview Panel (单例)
  ├─ updatePanelContent()
  │   ├─ SenatusParser.parseAll()
  │   │   ├─ scanTopics() - 扫描 specify/ 目录
  │   │   ├─ parseTopic() - 解析每个主题
  │   │   │   ├─ parseDiscuss() - 提取讨论记录 (D01, D02...)
  │   │   │   ├─ parsePlan() - 提取任务列表 (A01, A02...)
  │   │   │   ├─ determineStage() - 判断阶段
  │   │   │   └─ calculateCompletionRate() - 计算进度
  │   │   └─ getCurrentTopic() - 获取最新主题
  │   ├─ getDashboardHtml() - 生成 HTML
  │   └─ postMessage('update') - 更新前端
  ├─ setupFileWatcher() - 监控 specify/** (防抖 1000ms)
  └─ 处理前端消息
      ├─ openFile - 打开文件
      ├─ refresh - 刷新数据
      ├─ deleteTopic - 删除主题
      ├─ deleteResearch - 删除研究报告
      └─ rollbackToDiscuss - 回滚到讨论阶段
```

### 3. File Viewer 多标签管理
```
FileViewerProvider::openFile(filePath)
  ├─ 检查 panels Map (filePath → panel)
  │   └─ 如存在则 reveal() 现有面板
  ├─ 创建新 Webview Panel
  ├─ 存储 panel 和 viewMode 状态
  ├─ updatePanelContent()
  │   ├─ 读取文件内容
  │   ├─ 检测文件扩展名
  │   ├─ .md → marked() 渲染 + getMarkdownWebviewContent()
  │   └─ 其他 → getTextWebviewContent()
  ├─ 创建文件监控器 (监控当前文件)
  └─ onDidDispose - 清理 Map 和 watcher
```

### 4. Sidebar 文件树构建
```
SidebarProvider::resolveWebviewView()
  ├─ 配置 webview options
  ├─ 生成 HTML (getHtmlContent)
  └─ 处理消息
      ├─ getTree → getDirectoryTree()
      │   ├─ 递归读取目录
      │   ├─ FileFilter.isFileIncluded() - 白名单过滤
      │   ├─ 构建树结构 (name, path, type, children)
      │   └─ 排序 (目录优先，字母序)
      └─ openFile → executeCommand('spec-viewer.openFile')
```

### 5. 主题切换支持
```
FileViewerProvider::onThemeChanged()
  └─ 遍历所有打开的 panels
      └─ updatePanelContent() - 重新生成 HTML
          └─ getHighlightTheme()
              ├─ Light/HighContrastLight → github.min.css
              └─ Dark/HighContrast → github-dark.min.css
```

## 相关技术实现

### 1. 模板渲染系统
```javascript
// WebviewBase - 模板缓存
loadTemplate(templatePath)
  ├─ 检查 templateCache Map
  ├─ 如未缓存则从磁盘读取
  └─ 返回模板内容

// WebviewUtils - 变量替换
renderTemplate(template, variables)
  └─ 使用 RegExp 替换 {{key}} 占位符
```

**模板占位符示例**:
```html
<!-- dashboard.html -->
<link rel="stylesheet" href="{{fontAwesomeUri}}">
<script id="dashboard-data">{{dataJson}}</script>

<!-- viewer.html -->
<div style="display: {{previewDisplay}};">{{htmlContent}}</div>
<script data-view-mode="{{viewMode}}">{{rawContentJson}}</script>
```

### 2. 前后端通信机制
```javascript
// 后端 → 前端 (Extension → Webview)
webview.postMessage({
  command: 'refresh',
  tree: directoryTree
});

// 前端 → 后端 (Webview → Extension)
vscode.postMessage({
  command: 'openFile',
  path: filePath
});

// 前端监听
window.addEventListener('message', (event) => {
  const { command, data } = event.data;
  // 处理消息
});
```

### 3. 资源 URI 转换
```javascript
// ResourceUri._toUri()
webview.asWebviewUri(
  vscode.Uri.file(
    path.join(context.extensionPath, 'extension', ...pathSegments)
  )
)

// 生成 VSCode webview 安全 URI
// vscode-webview-resource://[uuid]/extension/assets/...
```

### 4. 文件过滤白名单
```javascript
// .specinclude 格式
specify/           # 目录（以 / 结尾）
README.md          # 精确文件
*.md               # 通配符
demo/**            # 递归通配符

// FileFilter.matchPattern()
- 目录模式: pattern.endsWith('/')
- 通配符: pattern.includes('*') → 转换为 RegExp
- 精确匹配: 直接字符串比较
```

### 5. Senatus 数据解析
```javascript
// parseDiscuss() - 提取讨论记录
正则: /### (D\d+) - (.+?)\n\*\*问题\*\*:\s*(.+?)\n+\*\*结论\*\*:/gs
提取: D01, D02... 编号、时间戳、问题

// parsePlan() - 提取任务列表
正则: /^(A\d+)\. \[(⏳|✅)[^\]]*\] (.+?)$/gm
提取: A01, A02... 编号、状态、描述

// determineStage() - 阶段判断逻辑
implementation/ 存在 → action
plan.md 存在 → plan
discuss.md + discussionCount > 0 → discuss
discuss.md → new-topic
```

### 6. CSS 主题变量
```css
/* 使用 VSCode 主题变量 */
--vscode-foreground
--vscode-editor-background
--vscode-button-secondaryBackground
--vscode-list-hoverBackground

/* 自定义主题变量（GitHub 风格） */
[data-vscode-theme-kind="vscode-dark"] {
  --color-canvas-subtle: #161b22;
  --color-border-default: #30363d;
  --color-accent: #2f81f7;
}
```

### 7. 前端状态管理
```javascript
// Sidebar - VSCode State API
vscode.setState({
  expandedDirs: Array.from(expandedDirs),
  selectedFile: selectedFile
});

const previousState = vscode.getState();
expandedDirs = new Set(previousState.expandedDirs || []);

// Dashboard - 内存状态 + 响应式更新
let dashboardData = null;
window.addEventListener('message', (event) => {
  if (event.data.command === 'update') {
    dashboardData = event.data.data;
    renderDashboard(); // 重新渲染
  }
});
```

### 8. 错误处理模式
```javascript
// Provider 级别
try {
  const data = await this.parser.parseAll();
  // 处理数据
} catch (error) {
  console.error('Error:', error);
  panel.webview.html = await this.getErrorHtml(error.message);
}

// 用户操作确认
const choice = await vscode.window.showWarningMessage(
  'Delete topic? This cannot be undone.',
  { modal: true },
  'Delete',
  'Cancel'
);
if (choice !== 'Delete') return;
```

### 9. 性能优化
- **模板缓存**: WebviewBase 使用 Map 缓存已加载模板
- **防抖机制**: 文件监控使用 setTimeout 防抖（300ms/1000ms）
- **增量更新**: Dashboard 使用 `postMessage('update')` 而非完全重新加载 HTML
- **延迟加载**: Outline 仅在显示时生成
- **状态保持**: `retainContextWhenHidden: true` 保留 webview 状态

### 10. 安全措施
```javascript
// 路径验证 - 防止目录遍历
validateTopicPath(topicDirName) {
  const topicPath = path.resolve(specifyPath, topicDirName);
  if (!topicPath.startsWith(specifyPath)) {
    throw new Error('Invalid path');
  }
  return topicPath;
}

// HTML 转义 - 防止 XSS
escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    // ...
}

// Webview 本地资源限制
localResourceRoots: [
  vscode.Uri.file(path.join(context.extensionPath, 'extension'))
]
```

---
*创建时间: 2025-10-11*
