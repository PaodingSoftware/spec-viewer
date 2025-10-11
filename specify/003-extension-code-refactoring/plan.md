# 行动计划

## 关联主题
specify/003-extension-code-refactoring/discuss.md

## 行动清单
<!--
每个行动项格式：
A01. [状态] 行动描述
A02. [状态] 行动描述
A03. [状态] 行动描述

编号格式: A01, A02, A03...（A = Action）
状态: ⏳待执行 / ✅已完成
-->

A01. [✅已完成] 合并 webview-base.js 和 webview-utils.js 为 webview-utils.js（保留 WebviewBase 类和 WebviewUtils 类）
A02. [✅已完成] 重命名 file-filter.js 为 file-utils.js（保持 FileFilter 类名不变）
A03. [✅已完成] 在 file-utils.js 中添加 validatePath() 和 debounce() 静态方法
A04. [✅已完成] 更新所有 Provider 文件中对 webview-base 和 webview-utils 的引用路径
A05. [✅已完成] 更新 extension.js 和 sidebar-provider.js 中对 file-filter 的引用路径
A06. [✅已完成] 创建共享 CSS 变量文件 extension/webview/shared/variables.css
A07. [✅已完成] 更新 ResourceUri 类，为各视图添加 sharedVariablesUri
A08. [✅已完成] 更新 dashboard.html 和 viewer.html 引入 shared/variables.css
A09. [✅已完成] 从 dashboard.css 和 viewer.css 中移除重复的 CSS 变量定义
A10. [✅已完成] 创建共享前端工具文件 extension/webview/shared/utils.js，添加 escapeHtml() 函数
A11. [✅已完成] 更新 ResourceUri 类，为 viewer 添加 sharedUtilsUri
A12. [✅已完成] 更新 viewer.html 引入 shared/utils.js（在 viewer.js 之前）
A13. [✅已完成] 从 viewer.js 中移除 escapeHtml() 函数定义，使用共享版本
A14. [✅已完成] 创建 Dashboard 错误模板 extension/webview/dashboard/error.html
A15. [✅已完成] 修改 DashboardProvider.getErrorHtml() 方法使用模板加载而非内联 HTML
A16. [✅已完成] 优化后端代码注释（删除 JSDoc、过度详细和显而易见的注释）
A17. [✅已完成] 优化前端代码注释（dashboard.js、sidebar.js、viewer.js）
A18. [✅已完成] 修复 file-viewer-provider.js 中 marked 库的导入错误（使用命名导入）
A19. [✅已完成] 修复模板渲染缺失 URI 变量导致的样式丢失问题
A20. [✅已完成] 合并 FileFilter 和 FileUtils 为单一 FileUtils 类（保留实例方法和静态方法）
A21. [✅已完成] 合并 WebviewBase 和 WebviewUtils 为单一 WebviewUtils 类（保留实例方法和静态方法）
A22. [✅已完成] 更新所有 Provider 文件从继承 WebviewBase 改为继承 WebviewUtils
A23. [✅已完成] 更新 extension.js 和 sidebar-provider.js 中的 fileFilter 引用为 fileUtils
A24. [✅已完成] 将所有 Provider 从继承 WebviewUtils 改为组合模式（持有 webviewUtils 实例）
A25. [✅已完成] 更新所有 Provider 中的模板加载调用从 super/this 改为 this.webviewUtils

---
*创建时间: 2025-10-11*
