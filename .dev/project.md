# Project Context

**Name**: sy-bookmark-plus
**Description**: 思源笔记的增强书签插件，支持静态/动态书签组、拖拽添加、多视图管理、动态查询等功能
**Repo**: frostime/sy-bookmark-plus

## Tech Stack
- **前端框架**: SolidJS ^1.8.17
- **语言**: TypeScript ^5.4.2
- **构建工具**: Vite ^5.2.13
- **状态管理**: solid-js/store + @frostime/solid-signal-ref ^2.2.0
- **API 集成**: 思源插件 API (siyuan 1.1.7)
- **工具库**: @frostime/siyuan-plugin-kits ^1.6.0

## Key Paths
<!-- @RULE: Most important directories/files for quick navigation.
Keep ≤10 entries. Agent uses this to orient in the codebase. -->

| Path | Purpose |
|------|---------|
| `src/index.ts` | 插件入口，生命周期管理 |
| `src/dock-views.ts` | Dock 视图注册和 Disposer 管理 |
| `src/model/index.ts` | BookmarkDataModel 核心业务逻辑 |
| `src/model/stores.ts` | SolidJS Store 定义（itemInfo、groups、subViews、configs） |
| `src/components/bookmark.tsx` | 根组件，提供 Context |
| `src/components/group.tsx` | 书签组组件 |
| `src/components/item.tsx` | 书签项组件 |
| `src/types/bookmark.d.ts` | 核心类型定义 |
| `.sspec/spec-docs/` | 技术规范文档 |

## Conventions
<!-- @RULE: Coding rules that apply across ALL work in this project.
One-liners only. If a convention needs multi-paragraph explanation → write a spec-doc. -->

- 所有文件使用 UTF-8 编码，LF 换行符
- TypeScript 严格模式，禁止 `any`（除非标注 `@ts-ignore`）
- 组件文件使用 `.tsx` 后缀，工具文件使用 `.ts`
- Store 只能在 Model 层修改，组件层只读
- 所有 `render()` 必须注册 Disposer，防止内存泄漏
- Debounce 保存：bookmarks (2000ms), configs (750ms), subViews (1000ms)
- 使用 Mermaid 图表可视化架构和流程
- 快照机制用于区分笔记本关闭 vs 块删除，不得移除
- 推荐使用 `@frostime/solid-signal-ref` lib 来管理 SolidJS 状态
  - 参考 [solidjs-signal-ref](.sspec/spec-docs/solidjs-components.md#solidjs-signal-ref-集成)

## Notes
<!-- @RULE: Project-level memory. Append-only log of learnings, gotchas, preferences.
Agent appends here during @handover when a discovery is project-wide (not change-specific).
Format each entry as: `- YYYY-MM-DD: <learning>`
Prune entries that become outdated or graduate to Conventions/spec-docs. -->

- 2026-02-10: 初始化 SSPEC 项目配置，创建 project.md、spec-docs 目录
- 2026-02-10: 创建 4 个核心 spec docs（architecture、solidjs-components、data-model、dock-views），覆盖整体架构、SolidJS 组件系统、数据模型与思源 API 集成、Dock 视图系统
- 2026-02-10: 快照机制的正确理解 - 用于区分笔记本关闭（BoxClosed，临时不可访问）vs 块删除（BlockDeleted，永久删除），而非简单的"防止误删"
