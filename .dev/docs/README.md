# Spec Docs 索引

本目录包含 sy-bookmark-plus 项目的技术规范文档，旨在帮助开发者和 AI Agent 快速理解项目架构和核心设计。

## 文档列表

### [1. 整体架构 (architecture.md)](./architecture.md)

**概述**：插件的整体架构、模块关系和数据流

**涵盖内容**：
- 整体架构图（插件入口 → Model → View → 思源 API）
- 核心模块关系（model、components、libs、utils）
- 数据流（启动流程、用户交互流程、动态规则执行流程）
- 插件生命周期（onload、onunload、openSetting）
- 数据持久化策略（Storage 文件、Debounce、快照机制）
- 关键设计决策的技术权衡

**适用场景**：
- 新接手项目，需要理解整体结构
- 规划跨模块功能
- 理解数据流和生命周期

---

### [2. SolidJS 组件系统 (solidjs-components.md)](./solidjs-components.md)

**概述**：SolidJS 组件架构、响应式数据流和状态管理

**涵盖内容**：
- 组件层级关系（Bookmark → Group → Item）
- BookmarkContext 系统
- Signal 和 Store 数据流
- solidjs-signal-ref 库的集成与使用
- 组件间通信模式（Props、Context、Store、Signal）
- 响应式数据流示例
- 性能优化策略
- 最佳实践

**适用场景**：
- 修改或新增 UI 组件
- 理解响应式更新机制
- 优化组件性能
- 排查组件通信问题

---

### [3. 数据模型与存储 (data-model.md)](./data-model.md)

**概述**：数据结构设计、Store 管理、持久化策略和思源 API 集成

**涵盖内容**：
- 核心数据结构（IBookmarkGroup、IBookmarkItem、IBookmarkSubView）
- Store 管理机制（itemInfo、groups、subViews、configs）
- 引用计数机制
- BookmarkDataModel 类的职责
- 数据持久化策略
- **思源 API 集成**：
  - API 封装和批量查询优化
  - Block 数据 → 书签数据的映射
  - 错误状态判断（BoxClosed vs BlockDeleted）
- 数据一致性保证（快照机制、引用计数）

**适用场景**：
- 修改数据结构
- 添加新的书签组类型
- 优化数据持久化
- 理解思源数据如何映射到书签
- 排查数据一致性问题

---

### [4. Dock 视图系统 (dock-views.md)](./dock-views.md)

**概述**：Dock 视图注册、多视图管理和 Disposer 模式

**涵盖内容**：
- Dock 视图类型（DEFAULT vs Sub Views）
- Dock 注册流程
- Disposer 模式（防止内存泄漏）
- 多视图协调机制
- 懒加载更新机制
- 视图生命周期
- 动态创建/销毁视图
- 移动端适配

**适用场景**：
- 添加新的视图功能
- 理解视图生命周期
- 排查内存泄漏问题
- 实现多视图协调

---

## 阅读建议

1. **architecture.md** - 理解整体架构
2. **solidjs-components.md** - 理解 UI 层
3. **data-model.md** - 理解数据层
4. **dock-views.md** - 理解视图管理

### 按需查阅（根据任务选择）

| 任务类型 | 推荐文档 |
|---------|---------|
| 修改 UI 组件 | solidjs-components.md |
| 修改数据结构 | data-model.md |
| 添加新的书签组类型 | data-model.md + architecture.md |
| 优化性能 | solidjs-components.md + architecture.md |
| 添加新视图 | dock-views.md |
| 理解思源 API 集成 | data-model.md |
| 排查 Bug | 根据问题领域选择对应文档 |

---

## 文档更新记录

| 日期 | 文档 | 变更说明 |
|------|------|---------|
| 2026-02-10 | 所有文档 | 初始版本创建 |
| 2026-02-10 | architecture.md | 修正快照机制描述（区分笔记本关闭 vs 块删除） |

---

## 相关资源

- **项目 README**：[/README.md](../../README.md)
- **AGENTS.md**：[/AGENTS.md](../../AGENTS.md)
- **项目配置**：[/.sspec/project.md](../project.md)

---

## SPEC DOC 规范

请参考 `.github/skills/write-spec-doc/SKILL.md` 了解如何编写和维护 spec docs。
