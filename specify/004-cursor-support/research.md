# 项目研究报告

## 关联主题
specify/004-cursor-support/discuss.md

## 技术栈现状

### VSCode Extension 基础
- **Engine 版本**: `^1.104.0` (定义在 `package.json` 中)
- **开发语言**: JavaScript (Node.js)
- **扩展入口**: `extension/src/extension.js`
- **主要依赖**:
  - `@types/vscode`: ^1.104.0 (开发依赖，提供类型定义)
  - `@vscode/vsce`: ^3.6.2 (扩展打包工具)

### 核心 VSCode API 使用
- `vscode.window.registerWebviewViewProvider` - 注册侧边栏 Webview 视图
- `vscode.window.createWebviewPanel` - 创建独立编辑器面板
- `vscode.workspace.workspaceFolders` - 获取工作区路径
- `vscode.workspace.createFileSystemWatcher` - 文件系统监控
- `vscode.commands.registerCommand` - 注册扩展命令
- `vscode.window.onDidChangeActiveColorTheme` - 主题变化监听
- `vscode.ColorThemeKind` - 主题类型检测

### 其他核心依赖
- **Chokidar**: ^3.5.3 (CLI 模式文件监控)
- **Commander**: ^11.0.0 (CLI 参数解析)
- **Express**: ^4.18.2 (CLI 模式 Web 服务器)
- **Marked**: ^9.1.2 (Markdown 渲染)
- **Socket.IO**: ^4.7.2 (CLI 模式实时通信)
- **ignore**: ^5.2.4 (`.specinclude` 白名单处理)
- **mime-types**: ^2.1.35 (MIME 类型处理)

### 双模式架构
项目支持两种运行模式：
1. **CLI 模式**: 通过 `bin/spec-viewer.js` 启动独立 Web 服务器
2. **VSCode Extension 模式**: 作为 VSCode 扩展运行

## 代码风格

### 模块组织结构
```
extension/
├── src/
│   ├── extension.js              # 扩展入口，激活/停用逻辑
│   ├── providers/                # Webview 提供者
│   │   ├── sidebar-provider.js   # 侧边栏文件树
│   │   ├── file-viewer-provider.js   # 文件查看器
│   │   └── dashboard-provider.js # 仪表盘
│   └── utils/                    # 工具类
│       ├── file-utils.js         # 文件操作工具
│       ├── resource-uri.js       # 资源 URI 生成
│       ├── webview-utils.js      # Webview 工具类
│       ├── senatus-parser.js     # Senatus 数据解析
│       └── senatus-installer.js  # Senatus 框架安装
├── webview/                      # 前端代码
│   ├── sidebar/                  # 侧边栏视图前端
│   ├── viewer/                   # 文件查看器前端
│   ├── dashboard/                # 仪表盘前端
│   └── shared/                   # 共享前端资源
└── assets/                       # 静态资源
    ├── fontawesome/              # Font Awesome 图标
    ├── highlight.js/             # 代码高亮
    └── webfonts/                 # 字体文件
```

### 命名规范
- **类名**: PascalCase (如 `SidebarProvider`, `FileUtils`)
- **文件名**: kebab-case (如 `sidebar-provider.js`, `file-utils.js`)
- **变量和函数**: camelCase (如 `workspaceFolder`, `refreshFileTree`)
- **常量**: 大写 SNAKE_CASE (如约定但较少使用)

### 编程模式
- **类组织**: ES6 Class 模式
- **模块导出**: CommonJS (`module.exports`)
- **异步处理**: async/await
- **错误处理**: try-catch 包裹异步操作
- **资源管理**: 通过 `context.subscriptions` 管理生命周期

## 相关目录结构

### Extension 注册配置 (package.json)
```json
{
  "engines": {
    "vscode": "^1.104.0"
  },
  "main": "extension/src/extension.js",
  "categories": ["Other"],
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "spec-viewer-sidebar",
          "title": "Spec Viewer",
          "icon": "$(book)"
        }
      ]
    },
    "views": {
      "spec-viewer-sidebar": [
        {
          "id": "specViewerExplorer",
          "name": "Files",
          "type": "webview"
        }
      ]
    },
    "commands": [
      "spec-viewer.openFile",
      "spec-viewer.openDashboard",
      "spec-viewer.collapseAll",
      "spec-viewer.refresh",
      "spec-viewer.installSenatus"
    ]
  }
}
```

### 扩展入口 (extension/src/extension.js)
- `activate(context)`: 扩展激活入口
- `deactivate()`: 扩展停用清理
- 初始化三个主要 Provider:
  - `SidebarProvider` - 侧边栏文件树
  - `FileViewerProvider` - 文件查看器
  - `DashboardProvider` - 仪表盘
- 注册命令和文件监控

### Webview 架构
- **侧边栏**: 使用 `registerWebviewViewProvider` 注册持久化侧边栏视图
- **文件查看器**: 使用 `createWebviewPanel` 创建独立编辑器面板
- **仪表盘**: 使用 `createWebviewPanel` 创建独立编辑器面板

## 相关业务逻辑

### VSCode Extension 激活流程
1. VSCode 调用 `activate(context)` 函数
2. 检查是否存在工作区 (`vscode.workspace.workspaceFolders`)
3. 初始化 `SidebarProvider`, `FileViewerProvider`, `DashboardProvider`
4. 注册 Webview 提供者和命令
5. 设置文件系统监控 (debounce 300ms)
6. 将所有订阅添加到 `context.subscriptions` 用于自动清理

### 扩展与 Cursor 的关系
**Cursor IDE 本质**:
- Cursor 是 VSCode 的 fork，基于相同的 Electron + Monaco Editor 架构
- **完全兼容 VSCode Extension API**
- 支持 VSCode Extension Marketplace 中的大部分扩展
- 使用相同的 `vscode` npm 模块和类型定义

**当前项目状态**:
- 项目使用标准 VSCode Extension API
- 没有使用 VSCode 专有的、不兼容的特性
- 理论上应该能直接在 Cursor 中运行

## 相关技术实现

### VSCode Extension 打包和安装
```bash
# 打包扩展
npm run package
# 执行: vsce package

# 安装到 VSCode
npm run install-extension
# 执行: vsce package && code --install-extension spec-viewer-1.0.0.vsix
```

### 扩展打包配置
- **工具**: `@vscode/vsce` (VSCode Extension 官方打包工具)
- **输出**: `spec-viewer-1.0.0.vsix` 文件
- **安装方式**: 
  - 命令行: `code --install-extension spec-viewer-1.0.0.vsix`
  - VSCode UI: Extensions → Install from VSIX

### Cursor 安装扩展的方式
Cursor 支持以下几种扩展安装方式：
1. **从 VSCode Marketplace 安装**: Cursor 内置扩展市场可搜索安装
2. **从 VSIX 文件安装**: 
   - 命令面板: "Extensions: Install from VSIX..."
   - 命令行: `cursor --install-extension <path-to-vsix>`
3. **手动复制**: 将扩展文件夹复制到 Cursor 扩展目录

### 潜在兼容性问题
1. **安装脚本问题**:
   - `package.json` 中的 `install-extension` 脚本使用 `code` 命令
   - Cursor 的命令行工具是 `cursor` 而非 `code`
   
2. **扩展路径差异**:
   - VSCode 扩展目录: `~/.vscode/extensions/`
   - Cursor 扩展目录: `~/.cursor/extensions/` 或类似路径

3. **发布方式**:
   - 当前仅支持本地 VSIX 安装
   - 未发布到 VSCode Marketplace（`publisher: "local"`）

### 需要适配的地方
1. **安装脚本**: 添加 Cursor 专用安装命令
2. **文档说明**: 补充 Cursor IDE 的安装和使用说明
3. **测试验证**: 在 Cursor 中实际测试扩展功能
4. **发布配置**: 考虑是否需要调整 publisher 配置以支持两种 IDE

---
*创建时间: 2025-10-16*
