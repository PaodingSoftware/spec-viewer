---
description: 收集用户手动修改的代码变更并记录到行动计划
---

## 执行流程

1. **检查 Git Staged 变更**:
   - 运行 `git diff --cached` 获取暂存区的所有变更
   - 如暂存区为空则提示"请先使用 git add 暂存您的变更"并结束命令

2. **检查项目宪法**:
   - 读取宪法文件 `specify/constitution.md`（如存在）
   - 确保后续操作符合宪法约束

3. **获取当前主题**:
   - 扫描 `specify/` 目录找到最新主题目录（按序号排序）
   - 读取最新主题目录下的 `discuss.md` 文件了解内容
   - 如无主题目录则提示运行 `/new-topic` 并结束命令

4. **读取研究基础**:
   - 读取 `specify/{当前主题目录}/research.md` 文件（如存在）
   - 如研究文件不存在则建议先运行 `/research`
   - 基于现有研究结果分析项目现状

5. **分析代码变更**:
   - 分析暂存区（Git staged）中的所有变更
   - 理解变更的目的和影响范围
   - 验证变更是否符合项目宪法约束
   - 识别潜在的风险或需要注意的事项

6. **生成变更描述**:
   - 基于代码变更自动生成简洁的描述
   - 描述应概括变更的核心目的

7. **更新行动计划**:
   - 读取 `specify/{当前主题目录}/plan.md` 文件
   - 如行动计划文件不存在则提示运行 `/plan` 并结束命令
   - 确定下一个行动编号（A01, A02, A03...）
   - 在行动清单部分添加新的行动项：
     ```markdown
     A01. [✅已完成] 变更描述
     ```

8. **生成实现记录**:
   - 在 `specify/{当前主题目录}/` 下创建 `implementation/` 目录（如不存在）
   - 读取模板文件 `.specify/templates/implementation-template.md`
   - 替换模板占位符：
     - `{{ACTION_ID}}` → 行动编号
     - `{{ACTION_DESCRIPTION}}` → 变更描述
     - `{{IMPLEMENTATION_DETAILS}}` → 详细变更内容
     - `{{CURRENT_DATE}}` → 当前日期（YYYY-MM-DD）
   - 生成目标文件 `specify/{当前主题目录}/implementation/{ACTION_ID}.md`（如文件已存在则覆盖）

## 输出结果
- Git staged 变更统计（文件数、新增行数、删除行数）
- 生成的变更描述
- 新增的行动项编号（已完成状态）
