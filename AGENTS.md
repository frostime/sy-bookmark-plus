思源笔记社区插件：Bookmark+（书签+）。用 SolidJS 写的 Dock 面板插件，支持静态组与动态组（规则/查询）。

## 开发

- 包管理 `pnpm`，Node >= 24（`packageManager: pnpm@11.4.0`）
- `pnpm check` — 类型检查（tsc 两份配置）；`pnpm build` — 产出 `dist/` 与 `package.zip`
- `pnpm dev` — 构建到 `dev/` 并开 live-reload，改动自动重载插件
- `pnpm make-link` — 把 `dev/` 链接为思源工作空间的插件（Windows 需管理员，用 `pnpm make-link-win`）
- `pnpm make-install` / `pnpm make-test-install` — 打包并安装到工作空间（后者带 inline sourcemap）
- `pnpm update-version` — 同步 `package.json` 与 `plugin.json` 版本

发布：推 `v*` tag 触发 [.github/workflows/release.yml](.github/workflows/release.yml)，会校验 tag 与两处版本号一致、跑类型检查后发布 `package.zip`。

## 代码结构

| 路径 | 职责 |
|------|------|
| [src/index.ts](src/index.ts) | 插件入口：生命周期、设置面板、keymap 接管思源原生书签入口 |
| [src/dock-views.ts](src/dock-views.ts) | Dock 视图注册与释放（含子视图渲染器的 dispose 管理） |
| [src/model/](src/model/) | 数据模型：`stores.ts` 响应式 store 与持久化，`index.ts` 模型门面，`rules.ts` 动态组规则，`data.ts` 批量取块信息，`migration.ts` 数据迁移 |
| [src/components/](src/components/) | SolidJS 组件：`bookmark.tsx` 主视图、`group.tsx` 组（含拖放）、`item.tsx` 条目、`setting/` 设置面板 |
| [src/api.ts](src/api.ts) | 思源内核 API 封装 |
| [src/sdk.ts](src/sdk.ts) | 在 `globalThis.BookmarkPlusSDK` 暴露给外部脚本的查询接口 |
| [src/utils/](src/utils/) | i18n、样式、通用工具 |
| [public/i18n/](public/i18n/) | YAML 源，构建时转成 `i18n/*.json` |

## 约定

- `siyuan` 在构建时是 external，运行期由思源提供；因此 `Constants` 等取值跟随**用户实际运行的思源版本**，不要假设与 `siyuan` 类型包一致。
- 组件用 SolidJS，弹窗/设置面板通过 [src/libs/dialog.ts](src/libs/dialog.ts) 的 `solidDialog` 挂载。
- 数据持久化走 `plugin.saveData/loadData`，存储在 `data/storage/petal/sy-bookmark-plus/`。
