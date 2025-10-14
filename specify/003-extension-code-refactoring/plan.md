# 任务计划

## 关联主题
specify/003-extension-code-refactoring/discuss.md

## 任务清单
<!--
每个任务项格式：
T01. [状态] 任务描述
T02. [状态] 任务描述
T03. [状态] 任务描述

编号格式: T01, T02, T03...（T = Task）
状态: ⏳待执行 / ✅已完成
-->

T01. [✅已完成] 合并 webview-base.js 和 webview-utils.js 为 webview-utils.js（保留 WebviewBase 类和 WebviewUtils 类）
T02. [✅已完成] 重命名 file-filter.js 为 file-utils.js（保持 FileFilter 类名不变）
T03. [✅已完成] 在 file-utils.js 中添加 validatePath() 和 debounce() 静态方法
T04. [✅已完成] 更新所有 Provider 文件中对 webview-base 和 webview-utils 的引用路径
T05. [✅已完成] 更新 extension.js 和 sidebar-provider.js 中对 file-filter 的引用路径
T06. [✅已完成] 创建共享 CSS 变量文件 extension/webview/shared/variables.css
T07. [✅已完成] 更新 ResourceUri 类，为各视图添加 sharedVariablesUri
T08. [✅已完成] 更新 dashboard.html 和 viewer.html 引入 shared/variables.css
T09. [✅已完成] 从 dashboard.css 和 viewer.css 中移除重复的 CSS 变量定义
T10. [✅已完成] 创建共享前端工具文件 extension/webview/shared/utils.js，添加 escapeHtml() 函数
T11. [✅已完成] 更新 ResourceUri 类，为 viewer 添加 sharedUtilsUri
T12. [✅已完成] 更新 viewer.html 引入 shared/utils.js（在 viewer.js 之前）
T13. [✅已完成] 从 viewer.js 中移除 escapeHtml() 函数定义，使用共享版本
T14. [✅已完成] 创建 Dashboard 错误模板 extension/webview/dashboard/error.html
T15. [✅已完成] 修改 DashboardProvider.getErrorHtml() 方法使用模板加载而非内联 HTML
T16. [✅已完成] 优化后端代码注释（删除 JSDoc、过度详细和显而易见的注释）
T17. [✅已完成] 优化前端代码注释（dashboard.js、sidebar.js、viewer.js）
T18. [✅已完成] 修复 file-viewer-provider.js 中 marked 库的导入错误（使用命名导入）
T19. [✅已完成] 修复模板渲染缺失 URI 变量导致的样式丢失问题
T20. [✅已完成] 合并 FileFilter 和 FileUtils 为单一 FileUtils 类（保留实例方法和静态方法）
T21. [✅已完成] 合并 WebviewBase 和 WebviewUtils 为单一 WebviewUtils 类（保留实例方法和静态方法）
T22. [✅已完成] 更新所有 Provider 文件从继承 WebviewBase 改为继承 WebviewUtils
T23. [✅已完成] 更新 extension.js 和 sidebar-provider.js 中的 fileFilter 引用为 fileUtils
T24. [✅已完成] 将所有 Provider 从继承 WebviewUtils 改为组合模式（持有 webviewUtils 实例）
T25. [✅已完成] 更新所有 Provider 中的模板加载调用从 super/this 改为 this.webviewUtils

---
*创建时间: 2025-10-11*
