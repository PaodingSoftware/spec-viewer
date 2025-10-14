# 项目研究报告

## 关联主题
[specify/002-dashboard-rollback-functionality/discuss.md](specify/002-dashboard-rollback-functionality/discuss.md)

## 技术栈现状

### 核心技术
- **JavaScript (Node.js)**: 主要开发语言
- **VSCode Extension API** (^1.104.0): 扩展开发框架
- **文件系统操作**: 使用 `fs.promises` 进行异步文件操作
- **路径处理**: 使用 `path` 模块处理跨平台路径

### 前端技术
- **纯 JavaScript**: Webview 内的前端逻辑（无框架）
- **Font Awesome**: 图标系统
- **CSS Variables**: VSCode 主题适配

### 数据解析
- **Marked**: Markdown 解析库
- **正则表达式**: 提取结构化数据（讨论记录、任务列表）

### 文件监控
- **VSCode FileSystemWatcher**: 监听文件变化
- **防抖机制**: 1000ms 延迟，优化性能

## 代码风格

### 模块组织
```
extension/
├── src/
│   ├── providers/
│   │   ├── dashboard-provider.js    # 仪表盘提供者
│   │   ├── sidebar-provider.js      # 侧边栏提供者
│   │   └── file-viewer-provider.js  # 文件查看器提供者
│   ├── utils/
│   │   ├── senatus-parser.js        # Senatus 数据解析器
│   │   ├── senatus-installer.js     # Senatus 框架安装器
│   │   ├── file-filter.js           # 文件过滤器
│   │   ├── webview-base.js          # Webview 基类
│   │   ├── webview-utils.js         # Webview 工具
│   │   └── resource-uri.js          # 资源 URI 生成器
│   └── extension.js                 # 扩展入口
├── webview/
│   ├── dashboard/
│   │   ├── dashboard.html           # 仪表盘模板
│   │   ├── dashboard.css            # 仪表盘样式
│   │   └── dashboard.js             # 仪表盘前端逻辑
│   ├── sidebar/                     # 侧边栏视图
│   ├── viewer/                      # 文件查看器
│   └── shared/
│       └── file-icons.js            # 共享图标映射
└── assets/                          # 静态资源（Font Awesome、Highlight.js）
```

### 命名规范
- **类名**: PascalCase（如 `DashboardProvider`、`SenatusParser`）
- **方法名**: camelCase（如 `parseAll()`、`updatePanelContent()`）
- **文件名**: kebab-case（如 `dashboard-provider.js`、`senatus-parser.js`）
- **常量**: UPPER_SNAKE_CASE（在需要时使用）

### 编程模式
- **类模块导出**: `module.exports = { ClassName }`
- **异步操作**: 使用 `async/await` 而非回调
- **错误处理**: try-catch 包裹文件操作，输出控制台日志
- **资源清理**: 在 dispose 事件中清理 watcher、subscriptions、timeout

### 架构风格
- **Provider 模式**: 每个 Webview 对应一个 Provider 类
- **单例模式**: Dashboard 使用单例（`this.panel` 引用）
- **继承**: 所有 Provider 继承 `WebviewBase` 基类
- **消息传递**: 使用 `postMessage` 在 Webview 和扩展之间通信

## 相关目录结构

### Senatus 主题结构
```
specify/
├── constitution.md                           # 项目宪法
├── 001-vscode-dashboard-interface/           # 主题目录（三位数序号-主题名）
│   ├── discuss.md                            # 讨论记录
│   ├── research.md                           # 研究报告
│   ├── plan.md                               # 任务计划
│   └── implementation/                       # 实现记录目录
│       ├── T01.md
│       ├── T02.md
│       └── ...
└── 002-dashboard-rollback-functionality/     # 当前主题
    └── discuss.md
```

### 模板文件结构
```
.specify/
├── constitution-template.md
├── discuss-template.md
├── research-template.md
├── plan-template.md
└── implementation-template.md
```

### 仪表盘相关文件
```
extension/
├── src/
│   ├── providers/
│   │   └── dashboard-provider.js            # 仪表盘核心逻辑
│   └── utils/
│       └── senatus-parser.js                # 数据解析（扫描主题、解析文件）
├── webview/
│   └── dashboard/
│       ├── dashboard.html                   # HTML 模板
│       ├── dashboard.css                    # 样式文件
│       └── dashboard.js                     # 前端逻辑（渲染、事件处理）
└── assets/
    └── fontawesome/
        ├── fontawesome.css                  # 图标样式（自包含）
        └── webfonts/                        # 字体文件
```

## 相关业务逻辑

### Senatus 主题阶段流程
1. **new-topic**: 主题刚创建，只有 `discuss.md` 文件，无讨论记录
2. **discuss**: 开始讨论，`discuss.md` 中有讨论记录（D01, D02...）
3. **plan**: 完成讨论，创建 `plan.md` 文件，规划任务任务（T01, T02...）
4. **action**: 开始执行，创建 `implementation/` 目录，包含实现记录
5. **completed**: 所有任务完成（`taskCount === completedCount`）

**Research 独立性**: `research.md` 不影响阶段流程，仅作为独立标识（`hasResearch` 字段）

### 仪表盘数据流
```
DashboardProvider.openDashboard()
  ↓
SenatusParser.parseAll()
  ↓
scanTopics() → 扫描 specify/ 目录，找到所有 NNN-* 格式目录
  ↓
parseTopic() → 对每个主题：
  ├── 提取序号和名称
  ├── 获取文件列表（discuss.md, research.md, plan.md, implementation/）
  ├── parseDiscuss() → 解析讨论记录（正则匹配）
  ├── parsePlan() → 解析任务列表（正则匹配）
  ├── determineStage() → 根据文件和讨论数判断阶段
  ├── calculateCompletionRate() → 计算完成率（阶段基础分 + 任务权重）
  └── 返回主题数据对象
  ↓
返回 { topics: [], currentTopic: null, hasTopics: false }
  ↓
DashboardProvider.getDashboardHtml() → 渲染模板
  ↓
Webview 显示仪表盘
```

### 文件监控和实时更新
```
setupFileWatcher()
  ↓
createFileSystemWatcher('specify/**/*')
  ↓
监听事件: onDidCreate / onDidChange / onDidDelete
  ↓
防抖刷新（1000ms）
  ↓
updatePanelContent() → 重新解析数据并 postMessage 更新
```

### 前端交互逻辑
```
用户操作:
├── 点击主题列表项 → postMessage('openFile', discuss.md)
├── 点击研究标识 → postMessage('openFile', research.md)
├── 点击刷新按钮 → postMessage('refresh')
└── 接收消息 → window.addEventListener('message', { command: 'update', data })
  ↓
Extension 处理:
├── openFile → FileViewerProvider.openFile()
└── refresh → DashboardProvider.updatePanelContent()
```

### 回滚功能需求分析（基于主题描述）

#### 需要支持的回滚操作
1. **回滚到 discuss 阶段**: 删除 `plan.md` 和 `implementation/` 目录
2. **删除指定的讨论记录**: 从 `discuss.md` 中删除特定的 D01、D02 等记录
3. **重新研究**: 删除 `research.md` 文件
4. **删除 topic**: 删除整个主题目录（如 `001-vscode-dashboard-interface/`）
5. **回滚 action**: 删除 `implementation/` 目录，回到 plan 阶段
6. **删除指定的任务**: 从 `plan.md` 中删除特定的 T01、T02 等任务

#### 当前系统的数据流向
- **只读操作**: 当前系统只有读取和解析功能（`fs.readFile`, `fs.readdir`）
- **无写入操作**: 没有任何文件删除、修改功能
- **无确认机制**: 没有操作确认对话框

#### 需要新增的能力
- **文件删除**: `fs.unlink()` 删除文件
- **目录删除**: `fs.rmdir()` / `fs.rm(..., { recursive: true })` 删除目录
- **文件修改**: `fs.writeFile()` 修改文件内容（删除讨论/任务）
- **确认对话框**: `vscode.window.showWarningMessage()` 带确认选项
- **操作按钮**: 在仪表盘 UI 中添加回滚操作按钮
- **权限验证**: 确保操作安全性（防止误删）

## 相关技术实现

### 文件系统操作（当前使用）

#### 读取文件
```javascript
// senatus-parser.js
const content = await fs.readFile(filePath, 'utf8');
```

#### 读取目录
```javascript
// senatus-parser.js
const entries = await fs.readdir(this.specifyPath, { withFileTypes: true });
```

#### 递归复制目录（安装器中使用）
```javascript
// senatus-installer.js
async copyDirectory(source, target) {
    const entries = await fs.readdir(source, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.isDirectory()) {
            await fs.mkdir(targetPath, { recursive: true });
            await this.copyDirectory(sourcePath, targetPath);
        } else {
            await fs.copyFile(sourcePath, targetPath);
        }
    }
}
```

### 需要实现的文件操作

#### 删除文件
```javascript
const fs = require('fs').promises;

// 删除单个文件
await fs.unlink(filePath);

// 示例：删除 research.md
await fs.unlink(path.join(topicPath, 'research.md'));
```

#### 删除目录（递归）
```javascript
// Node.js 14.14.0+ 支持 recursive 选项
await fs.rm(dirPath, { recursive: true, force: true });

// 示例：删除 implementation 目录
await fs.rm(path.join(topicPath, 'implementation'), { recursive: true, force: true });

// 示例：删除整个主题目录
await fs.rm(path.join(specifyPath, topicDirName), { recursive: true, force: true });
```

#### 修改文件内容（删除指定记录）
```javascript
// 读取内容
let content = await fs.readFile(filePath, 'utf8');

// 删除讨论记录（正则替换）
// 匹配从 ### D02 开始到下一个 ### 或文件末尾
const recordRegex = new RegExp(
    `### ${recordId} - .+?\\n\\*\\*问题\\*\\*:[\\s\\S]*?(?=(### D\\d+|---\\n\\*创建时间:|$))`,
    'g'
);
content = content.replace(recordRegex, '');

// 写回文件
await fs.writeFile(filePath, content, 'utf8');
```

### VSCode 确认对话框

#### 警告确认框
```javascript
const choice = await vscode.window.showWarningMessage(
    '确定要删除此主题吗？此操作无法撤销。',
    { modal: true },
    '确认删除',
    '取消'
);

if (choice === '确认删除') {
    // 执行删除操作
}
```

#### 信息提示框
```javascript
vscode.window.showInformationMessage('主题已成功删除');
```

#### 错误提示框
```javascript
vscode.window.showErrorMessage('删除失败：' + error.message);
```

### Webview 消息传递模式

#### 前端发送消息
```javascript
// dashboard.js
vscode.postMessage({
    command: 'rollbackToDiscuss',
    topicDirName: '001-vscode-dashboard-interface'
});

vscode.postMessage({
    command: 'deleteDiscussion',
    topicDirName: '001-vscode-dashboard-interface',
    discussionId: 'D03'
});

vscode.postMessage({
    command: 'deleteTopic',
    topicDirName: '001-vscode-dashboard-interface'
});
```

#### 后端处理消息
```javascript
// dashboard-provider.js
panel.webview.onDidReceiveMessage(
    async (message) => {
        switch (message.command) {
            case 'rollbackToDiscuss':
                await this.rollbackToDiscuss(message.topicDirName);
                break;
            case 'deleteDiscussion':
                await this.deleteDiscussion(message.topicDirName, message.discussionId);
                break;
            case 'deleteTopic':
                await this.deleteTopic(message.topicDirName);
                break;
        }
    },
    null,
    this.context.subscriptions
);
```

### 数据解析相关（正则表达式）

#### 讨论记录正则
```javascript
// senatus-parser.js:parseDiscuss()
const discussionRegex = /### (D\d+) - (.+?)\n\*\*问题\*\*:\s*(.+?)\n+\*\*结论\*\*:/gs;
```

#### 任务正则
```javascript
// senatus-parser.js:parsePlan()
const taskRegex = /^(A\d+)\. \[(⏳|✅)[^\]]*\] (.+?)$/gm;
```

#### HTML 注释移除
```javascript
// 移除模板注释，避免匹配示例
content = content.replace(/<!--[\s\S]*?-->/g, '');
```

### UI 按钮设计建议

#### 当前主题卡片操作按钮
```html
<!-- 在 current-topic-card 中添加操作按钮组 -->
<div class="topic-actions">
    <button class="action-btn danger" data-action="rollback-to-discuss">
        <i class="fas fa-undo"></i> 回滚到讨论
    </button>
    <button class="action-btn warning" data-action="delete-research">
        <i class="fas fa-trash"></i> 删除研究
    </button>
    <button class="action-btn danger" data-action="delete-topic">
        <i class="fas fa-times-circle"></i> 删除主题
    </button>
</div>
```

#### 讨论/任务列表项操作按钮
```html
<!-- 每个讨论/任务项添加删除按钮 -->
<div class="discussion-item">
    <i class="fas fa-comment discussion-icon"></i>
    <div class="discussion-info">...</div>
    <button class="delete-item-btn" data-id="D01">
        <i class="fas fa-trash"></i>
    </button>
</div>
```

### 错误处理策略

#### 文件操作错误处理
```javascript
try {
    await fs.unlink(filePath);
    vscode.window.showInformationMessage('文件删除成功');
    await this.updatePanelContent(); // 刷新仪表盘
} catch (error) {
    console.error('Error deleting file:', error);
    vscode.window.showErrorMessage(`删除失败：${error.message}`);
}
```

#### 操作前验证
```javascript
// 检查文件是否存在
const exists = await fs.access(filePath).then(() => true).catch(() => false);
if (!exists) {
    vscode.window.showWarningMessage('文件不存在');
    return;
}

// 检查阶段是否允许回滚
if (topic.stage === 'new-topic') {
    vscode.window.showWarningMessage('当前主题处于初始阶段，无法回滚');
    return;
}
```

### 自动刷新机制

#### 操作完成后触发刷新
```javascript
async rollbackToDiscuss(topicDirName) {
    // 执行回滚操作
    await this.deleteFiles([...]);
    
    // 自动刷新仪表盘（重新解析数据）
    await this.updatePanelContent();
}
```

#### FileSystemWatcher 自动捕获变化
由于已有文件监控机制，删除操作会自动触发 `onDidDelete` 事件，触发防抖刷新。

### 安全性考虑

#### 操作限制
- **只能操作 specify/ 目录**：严格限制路径，防止删除其他文件
- **路径验证**：使用 `path.join()` 和 `path.resolve()` 防止路径遍历攻击
- **宪法文件保护**：禁止删除 `constitution.md`

#### 确认机制
- **模态对话框**：使用 `{ modal: true }` 强制用户确认
- **操作描述清晰**：明确告知用户操作后果
- **不可撤销警告**：提示用户操作无法撤销

#### 备份建议（可选）
虽然不在当前需求范围，但可考虑：
- 使用 Git 作为版本控制（项目已在 Git 仓库中）
- 在删除前提示用户确保已提交更改

---
*创建时间: 2025-10-11*
