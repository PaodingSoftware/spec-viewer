# 行动计划

## 关联主题
[specify/002-dashboard-rollback-functionality/discuss.md](specify/002-dashboard-rollback-functionality/discuss.md)

## 行动清单
<!--
每个行动项格式：
A01. [状态] 行动描述
A02. [状态] 行动描述
A03. [状态] 行动描述

编号格式: A01, A02, A03...（A = Action）
状态: ⏳待执行 / ✅已完成
-->

A01. [✅已完成] 在 DashboardProvider 中实现删除当前主题功能（deleteTopic），使用 fs.rm() 递归删除整个主题目录，添加模态确认对话框，操作后自动刷新仪表盘

A02. [✅已完成] 在 DashboardProvider 中实现删除研究报告功能（deleteResearch），使用 fs.unlink() 删除 research.md 文件，仅允许删除当前主题的研究报告

A03. [✅已完成] 在 DashboardProvider 中实现删除讨论记录功能（deleteDiscussion），解析 discuss.md 内容删除指定记录，重新编号后续讨论（保持 D01, D02... 连续），使用 fs.writeFile() 写回文件

A04. [✅已完成] 在 DashboardProvider 中实现回滚到讨论阶段功能（rollbackToDiscuss），删除 plan.md 和 implementation/ 目录，仅在当前主题处于 plan、action 或 completed 阶段时允许回滚

A05. [✅已完成] 在 dashboard.js 中实现自定义右键菜单，在当前主题卡片上右键时显示"删除研究报告"和"回滚到讨论阶段"选项（根据阶段和文件存在性动态显示）

A06. [✅已完成] 在 dashboard.html 和 dashboard.css 中为当前主题卡片添加删除主题按钮，使用红色系颜色和 fa-trash-alt 图标，添加相应样式和 hover 效果

A07. [✅已完成] 在 dashboard.js 中为讨论列表项添加删除按钮（鼠标悬停显示），绑定点击事件发送 deleteDiscussion 消息，传递 topicDirName 和 discussionId 参数

A08. [✅已完成] 在 dashboard.css 中实现删除按钮和右键菜单的样式，包括小按钮尺寸（12-14px）、灰色默认状态、红色 hover 状态、菜单背景和边框效果

A09. [✅已完成] 在 dashboard-provider.js 的消息处理器中添加四个新命令的路由（deleteTopic、deleteResearch、deleteDiscussion、rollbackToDiscuss），并进行错误处理和成功提示

A10. [✅已完成] 实现路径验证机制，确保所有文件操作严格限制在 specify/ 目录内，使用 path.join() 和 path.resolve() 防止路径遍历攻击，禁止删除 constitution.md

A11. [✅已完成] 修复 UI 显示问题：将删除主题功能移到右键菜单中，修复菜单图标显示问题，使用 DOM 元素创建而非 innerHTML，新增 createContextMenuItem 辅助函数

A12. [✅已完成] 修复图标显示和删除按钮交互问题：在 fontawesome.css 中添加 fa-trash-alt 和 fa-undo 图标定义，优化讨论删除按钮的 hover 显示区域和样式

A13. [✅已完成] 修复讨论删除按钮点击无反应问题：移除前端 confirm() 调用，将确认逻辑移到后端使用 vscode.window.showWarningMessage()，保持与其他删除操作一致的交互体验

A14. [✅已完成] 修复删除讨论后重新编号错误问题：改进重新编号逻辑，遍历所有剩余讨论按顺序重新编号为 D01, D02, D03...，从后往前处理避免替换冲突

A15. [✅已完成] 修复讨论重新编号的替换冲突问题：采用两阶段替换策略，先将所有旧ID替换为临时占位符，再将占位符替换为新ID，按文件位置排序而非编号排序，完全避免替换冲突

A16. [✅已完成] 简化讨论重新编号逻辑：移除复杂的两阶段替换策略，改为简单的从上到下顺序替换，利用 String.replace() 只替换第一个匹配项的特性，从上到下处理时每次替换的正好是目标讨论标题，代码更简洁易懂

A17. [✅已完成] 修复讨论重新编号的根本问题：使用正则全局替换（/g 标志）配合回调函数，确保所有讨论标题都被替换，利用计数器递增自动生成连续编号（D01, D02, D03...），彻底解决了之前所有方案的遗漏问题

A18. [✅已完成] 移除删除讨论后的重新编号功能：删除所有重新编号相关代码，保留原有编号允许不连续，简化确认对话框和成功提示文本，避免重新编号带来的技术问题和复杂性，提高讨论引用的可靠性

A19. [✅已完成] 修复删除讨论时可能误删注释的问题：在删除操作前提取并保存所有 HTML 注释块，在无注释的内容上执行删除，最后恢复注释到原位置，确保 discuss.md 顶部的示例注释和其他注释内容不会被误删

A20. [✅已完成] 修复删除讨论时只删除部分内容的问题：在正则表达式中使用 `^` 锚点配合多行模式（`gm` 标志）确保只匹配行首的讨论标题，避免讨论内容中包含的类似格式文本（如 `"### D07 -"`）被误判为下一个讨论的开始

A21. [✅已完成] 修复删除最后一个讨论时提示找不到的问题：将正则表达式的分隔线匹配模式从 `\n---\n` 改为 `\n*---\n`，允许最后一个讨论和分隔线之间有任意数量的换行符（0 个或多个）

A22. [✅已完成] 移除删除讨论功能：完全移除 deleteDiscussion 相关代码（后端方法、消息处理器、前端按钮、CSS样式），简化代码避免复杂的文件解析和替换逻辑，保留其他回滚功能（删除主题、删除研究报告、回滚到讨论阶段）

---
*创建时间: 2025-10-11*

