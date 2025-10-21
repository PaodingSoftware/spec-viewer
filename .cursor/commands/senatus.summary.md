---
description: 将当前主题汇总成为一个知识点
---

## 执行流程

1. **检查项目宪法**:
   - 读取宪法文件 `specify/constitution.md`（如存在）
   - 确保后续操作符合宪法约束

2. **获取当前主题**:
   - 扫描 `specify/` 目录找到最新主题目录（按序号排序）
   - 读取最新主题目录下的 `discuss.md` 文件了解内容
   - 如无主题目录则提示运行 `/senatus.new-topic` 并结束命令

3. **检查现有研究**:
   - 检查 `specify/{当前主题目录}/research.md` 是否存在
   - 如存在则读取现有内容作为基础

4. **综合整理知识点**:
   - 基于主题、已有讨论、研究基础和项目源码分析
   - 综合整理形成结构化的知识点

5. **创建知识点总结**:
   - 读取模板文件 `.specify/summary-template.md`
   - 替换模板占位符：
     * `{{TOPIC_NAME}}` → 主题名称
     * `{{DISCUSS_FILE_PATH}}` → 关联的 discuss.md 文件路径
     * `{{SUMMARY_CONTENT}}` → 综合整理形成的结构化知识点
     * `{{CURRENT_DATE}}` → 当前日期（YYYY-MM-DD）
   - 生成目标文件 `knowledge/{当前主题目录名}.md`（如文件已存在则覆盖）

## 输出结果
- 总结的核心要点概览
