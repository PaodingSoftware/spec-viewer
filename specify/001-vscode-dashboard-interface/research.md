# 项目研究报告

## 关联主题
[specify/001-vscode-dashboard-interface/discuss.md](specify/001-vscode-dashboard-interface/discuss.md)

## 技术栈现状

### 编程语言
- **JavaScript (Node.js)** - 主要开发语言，用于扩展后端和前端逻辑

### 框架和库
- **VSCode Extension API** (^1.104.0) - 扩展开发核心框架
- **Express.js** (^4.18.2) - Web 服务器框架（CLI 模式）
- **Socket.IO** (^4.7.2) - 实时双向通信
- **Marked** (^9.1.2) - Markdown 渲染
- **Chokidar** (^3.5.3) - 文件系统监控
- **Commander** (^11.0.0) - CLI 参数解析
- **ignore** (^5.2.4) - .specinclude 白名单处理

### 前端资源
- **Font Awesome** - 图标库（webfonts 自托管）
- **Highlight.js** - 代码语法高亮
- **原生 JavaScript** - 无前端框架依赖

### 开发工具
- **@vscode/vsce** (^3.6.2) - 扩展打包工具
- **@types/vscode** (^1.104.0) - TypeScript 类型定义

## 代码风格

### 模块组织
```
extension/
├── src/                    # 后端逻辑
│   ├── providers/          # Webview 提供者
│   │   ├── sidebar-provider.js
│   │   └── file-viewer-provider.js
│   ├── utils/              # 工具类
│   │   ├── file-filter.js
│   │   ├── resource-uri.js
│   │   ├── senatus-installer.js
│   │   ├── webview-base.js
│   │   └── webview-utils.js
│   └── extension.js        # 扩展入口
├── webview/                # 前端代码
│   ├── sidebar/            # 侧边栏视图
│   │   ├── sidebar.html
│   │   ├── sidebar.css
│   │   └── sidebar.js
│   ├── viewer/             # 文件查看器
│   │   ├── viewer.html
│   │   ├── viewer.css
│   │   ├── viewer.js
│   │   ├── text.html
│   │   └── error.html
│   └── shared/             # 共享资源
│       └── file-icons.js
└── assets/                 # 静态资源
    ├── fontawesome/
    ├── highlight.js/
    └── webfonts/
```

### 命名规范
- **驼峰命名** (camelCase) - 变量和函数
- **帕斯卡命名** (PascalCase) - 类名
- **kebab-case** - HTML/CSS 文件和 CSS 类名
- **模块导出** - CommonJS 格式 (`module.exports`)

### 架构模式
- **Provider 模式** - 扩展视图提供者（SidebarProvider, FileViewerProvider）
- **模板渲染** - HTML 模板 + 占位符替换
- **继承复用** - WebviewBase 基类提供模板加载功能
- **状态管理** - vscode.getState() / setState() 持久化视图状态
- **消息通信** - postMessage 实现前后端通信

## 相关目录结构

### 当前 Webview 实现
```
extension/
├── src/
│   ├── providers/
│   │   ├── sidebar-provider.js       # 侧边栏文件树
│   │   └── file-viewer-provider.js   # 文件查看器
│   └── utils/
│       ├── webview-base.js           # Webview 基类
│       ├── webview-utils.js          # 模板渲染工具
│       └── resource-uri.js           # 资源 URI 生成
├── webview/
│   ├── sidebar/                      # 现有侧边栏
│   │   ├── sidebar.html
│   │   ├── sidebar.css
│   │   └── sidebar.js
│   └── viewer/                       # 现有文件查看器
│       ├── viewer.html
│       ├── viewer.css
│       └── viewer.js
└── assets/                           # 自包含资源
    ├── fontawesome/
    ├── highlight.js/
    └── webfonts/
```

### 仪表盘相关潜在位置
```
extension/
├── src/
│   └── providers/
│       └── dashboard-provider.js     # 新增仪表盘提供者
├── webview/
│   └── dashboard/                    # 新增仪表盘视图
│       ├── dashboard.html
│       ├── dashboard.css
│       └── dashboard.js
└── package.json                      # 需注册新视图
```

## 相关业务逻辑

### 现有 Webview 视图类型

#### 1. Sidebar Webview View (侧边栏)
- **类型**: `WebviewViewProvider`
- **注册位置**: `package.json` -> `contributes.views`
- **视图容器**: `spec-viewer-sidebar` (Activity Bar)
- **视图 ID**: `specViewerExplorer`
- **功能**:
  - 显示文件树导航
  - 支持搜索过滤
  - 文件/目录交互
  - 状态持久化（展开/折叠）

#### 2. Editor Webview Panel (文件查看器)
- **类型**: `WebviewPanel`
- **创建方式**: `vscode.window.createWebviewPanel()`
- **功能**:
  - Markdown 渲染
  - 代码高亮
  - 预览/源码切换
  - 大纲导航
  - 多标签页管理

### 关键业务流程

#### 视图注册流程
1. **extension.js** `activate()` - 扩展激活
2. 创建 Provider 实例
3. `vscode.window.registerWebviewViewProvider()` - 注册视图
4. 订阅到 `context.subscriptions`

#### Webview 通信流程
```
前端 (sidebar.js)
  └─> vscode.postMessage({ command: 'getTree' })
       └─> 后端 (sidebar-provider.js)
            └─> webview.onDidReceiveMessage()
                 └─> 处理命令
                      └─> webview.postMessage({ command: 'treeData', tree })
                           └─> 前端 (sidebar.js)
                                └─> window.addEventListener('message')
```

#### 资源加载流程
1. **ResourceUri.getSidebarUris()** - 生成资源 URI
2. **webview.asWebviewUri()** - 转换为 Webview 可访问 URI
3. **模板渲染** - 将 URI 插入 HTML 模板
4. **设置 localResourceRoots** - 允许访问特定目录

## 相关技术实现

### Webview 创建方式对比

#### WebviewViewProvider (侧边栏固定视图)
```javascript
class SidebarProvider extends WebviewBase {
    async resolveWebviewView(webviewView) {
        this.view = webviewView;
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [...]
        };
        webviewView.webview.html = await this.getHtmlContent(webviewView.webview);
    }
}

// 注册
vscode.window.registerWebviewViewProvider('viewId', provider);
```

**特点**:
- 固定在 Activity Bar 或 Panel 区域
- 需要在 `package.json` 中预先声明
- 视图生命周期由 VSCode 管理
- 适合常驻侧边栏、面板

#### WebviewPanel (独立编辑器面板)
```javascript
const panel = vscode.window.createWebviewPanel(
    'panelType',
    'Panel Title',
    vscode.ViewColumn.One,
    {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [...]
    }
);
panel.webview.html = htmlContent;
```

**特点**:
- 动态创建，显示在编辑器区域
- 无需预先声明
- 支持多实例（多标签页）
- 可设置自定义图标
- 适合文件查看器、临时面板

### 模板渲染机制

#### WebviewBase 基类
- **模板缓存**: `Map<templatePath, content>`
- **loadTemplate()**: 从磁盘加载 HTML 模板
- **缓存优化**: 避免重复读取文件

#### WebviewUtils 工具
```javascript
WebviewUtils.renderTemplate(template, {
    fontAwesomeUri: uri1,
    styleUri: uri2,
    scriptUri: uri3
});
```
- **占位符替换**: `{{variableName}}` -> 实际值
- **HTML 转义**: `escapeHtml()` 防止 XSS

### 状态持久化

#### 侧边栏状态
```javascript
// 保存
vscode.setState({
    expandedDirs: Array.from(expandedDirs),
    selectedFile: selectedFile
});

// 恢复
const previousState = vscode.getState();
if (previousState) {
    expandedDirs = new Set(previousState.expandedDirs || []);
}
```

#### 文件查看器状态
```javascript
// 后端存储
this.panelStates.set(filePath, { viewMode: 'preview' });

// 前端通知状态变化
vscode.postMessage({ command: 'viewModeChanged', viewMode: 'source' });
```

### 主题适配

#### CSS 自定义属性
```css
body {
    color: var(--vscode-foreground);
    background-color: var(--vscode-sideBar-background);
}
```

#### 主题检测
```javascript
const themeKind = vscode.window.activeColorTheme.kind;
// ColorThemeKind: Light=1, Dark=2, HighContrast=3, HighContrastLight=4
```

#### 主题变化监听
```javascript
vscode.window.onDidChangeActiveColorTheme(() => {
    // 刷新所有打开的面板
    this.onThemeChanged();
});
```

### 防抖优化

#### 文件监控防抖 (300ms)
```javascript
let refreshTimeout = null;
const debouncedRefresh = () => {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
        refreshFileTree();
    }, 300);
};
```

### 资源管理

#### 资源清理
```javascript
panel.onDidDispose(() => {
    this.panels.delete(filePath);
    this.panelStates.delete(filePath);
    changeListener.dispose();
    watcher.dispose();
});
```

#### 订阅管理
```javascript
context.subscriptions.push(
    watcher,
    changeListener,
    commandRegistration
);
```

---
*创建时间: 2025-09-30*