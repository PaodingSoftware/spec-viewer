---
description: 创建项目的全局约束宪法文件
---

## 执行流程

1. **检查宪法文件**:
   - 检查 `specify/constitution.md` 是否存在
   - 如存在则警告将被重写

2. **分析项目现状**:
   - 分析项目结构和技术栈
   - 识别现有代码规范和开发模式

3. **生成约束条款**:
   - 按分类标题和项目列表格式组织约束
   - 常见分类：技术约束、质量约束、安全约束、业务约束

4. **创建宪法文件**:
   - 读取模板文件 `.specify/templates/constitution-template.md`
   - 替换模板占位符：
     * `{{PROJECT_NAME}}` → 项目名称
     * `{{CONSTITUTION_VERSION}}` → v1.0.0
     * `{{LAST_AMENDED_DATE}}` → 创建日期（YYYY-MM-DD）
     * `{{CONSTRAINTS_CONTENT}}` → 生成的约束条款
     * `{{VERSION_HISTORY}}` → 初始版本历史记录
   - 生成目标文件 `specify/constitution.md`（如文件已存在则覆盖）

## 输出结果
- 宪法文件路径
- 主要约束条款概要