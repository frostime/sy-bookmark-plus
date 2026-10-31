---
title: 数据同步维护规范
description: 修改存档读写、onDataChanged、异步查询或 Dock/弹窗生命周期前阅读；定义单端刷新责任与同步复杂度边界。
scope:
  - src/storage-refresh.ts
  - src/model/**
  - src/index.ts
  - src/dock-views.ts
  - src/libs/dialog.ts
  - src/components/**
updated: 2026-10-29
---

# 数据同步维护规范

## 责任边界：刷新存档，不实现多端协作

思源负责传输并写入插件存档，Bookmark+ 负责收到 `onDataChanged` 后刷新内存、书签、Dock 和设置。通知也可能来自同机其他窗口的存档覆盖，不能把它等同于“云端有一个新版本”。

支持的使用方式是轮流使用设备：在一台设备完成编辑，等待思源同步完成后，再切换设备。“一分钟内只操作一台”是使用习惯，不是插件要实现的锁或同步完成判据。

| 情况 | Bookmark+ 的责任 |
| --- | --- |
| 本机没有待保存修改或在途写入，也没有打开的编辑窗口 | 自动刷新数据、主/子视图及设置，不要求重启或重新进入 Dock |
| 通知到达时，本机有待保存修改、已发写请求或登记中的编辑/确认窗口 | 明确弹出 Dialog，说明没有多端细粒度合并机制、不要同时操作；取消待保存并关闭自有编辑窗口，采用思源当前落盘结果，允许丢弃未保存编辑 |
| 存档读取失败 | 保留旧画面、暂停保存并提供重试；首次加载失败也显示错误。人工重试和下次通知都走同一路径，不无限后台重试 |

警告依据的是本窗口可观察到的交叠，**不是完整的跨设备冲突检测**。采用落盘结果也不等于“远端总能获胜”：宿主已经发出的写请求无法撤回。插件不保证并发编辑无损、不合并双机修改、不实现跨设备锁或四文件内核事务，也不回滚任意用户 JS 副作用。

已启动的组件 Promise、旧菜单或确认回调可能跨过刷新边界；模型查询排空不证明这些工作全部结束。这类交叠不能反向成为无损并发支持的隐含需求。若要增加该保障，应先重新确认产品责任和成本，不能直接推进全局数据实例隔离或向每个组件补保护。

## 复杂度归属

**同步复杂度及其引出的取消、等待、失败恢复等次级复杂度，集中在 `onDataChanged` 专用刷新路径。普通模块不共同维护一套同步协议。**

| 位置 | 可以拥有的职责 |
| --- | --- |
| `src/storage-refresh.ts`：`StorageRefresh` | 通知合并、刷新编排、本机交叠警告、暂停/恢复顺序、模型查询等待、失败重试和卸载停止 |
| `src/model/storage.ts`：`bookmarkStorage` | 存档 I/O、保存门、取消待保存、跟踪已发写请求；普通调用者只使用读、写和延迟保存 |
| `src/model/index.ts`：`readStorage()`；`src/model/stores.ts` | 完整组装待替换数据、提供批量提交与替换能力；维护分组成员、快照、引用计数和配置默认值 |
| `src/dock-views.ts` | 宿主 Dock 适配、Solid 根释放/重建、内容区暂停和错误/重试展示 |
| `src/libs/dialog.ts` | 自有弹窗登记与释放；区分正常关闭提交和刷新丢弃 |
| `src/index.ts`：`applySettings()`；`src/model/auto-refresh.ts` | 本地设置与刷新共用的设置应用、幂等命令/监听管理 |

资源拥有者可以提供确需的取消、释放、替换能力，但不能自行决定同步轮次或恢复策略。普通组件和普通模型查询方法不得散布 `canEdit`、revision、active、对象存活检查或逐 `await` 的同步有效性判断。组件接入统一弹窗入口和提供 render disposer 属于资源所有权，不是同步协议。

存储 I/O 不得反向依赖刷新编排模块。否则模型/Store 会经刷新模块、Dock 和组件形成初始化环。集中责任不等于强行合并成一个文件，也不以触及文件数量单独判断设计好坏。

## 跨模块必须保持的约束

### 读入与提交

- 四份存档都要参与读入：`bookmarks.json`、`bookmark-configs.json`、`bookmark-sub-views.json`、`bookmark-items-snapshot.json`。快照保留关闭笔记本中条目的标题、box 等信息，不能用空缓存冒充等价刷新。
- 完整读取并组装成功后才能提交或释放旧画面。不得先清空 Store 再逐步读取；读取失败不能迁移并写回空档。
- 替换必须反映删除与缺省值：移除的子视图、可选字段和配置不能因浅合并残留；重复通知不能累积组或 ref。缺失文件不等于存在一份需要迁移保存的空存档。
- 存档刷新必须绕过 `Plugin.loadData` 的失败缓存回退。严格读取以 `bookmarkStorage.read()` 为入口；不能把异常或任意 HTTP 202 都解释成文件不存在。

### 旧工作、视图与保存

- 刷新暂停期间不启动新保存，待保存应可取消；已发写请求应结算后再读取。超时只表示等待失败，不能假装请求已取消并恢复保存。
- 模型自有查询在专用路径集中登记与等待，普通查询方法内部不检查轮次。取消 debounce 定时器不等于结束已经运行的查询；不得因提前捕获旧方法的 `bind` 而绕过集中登记。
- 数据替换后重建挂载的 Bookmark 根，清除局部的一次性展开/收起指令。仅替换响应式数据，可能让旧指令对新组件再次执行并触发保存。
- 已挂载及本轮新挂载的 Dock 都应得到元数据刷新；从未打开 Dock 时仍保持按需查询。读取失败时，重试按钮必须位于被禁用的内容区之外；没有挂载 Dock 的窗口也要有可操作的错误提示。
- 刷新丢弃弹窗只清理资源，不执行正常关闭的保存回调。只读信息窗口不必为了“登记全部窗口”而扩大到编辑冲突协议。
- 本机 Dock identity/布局优先；远端位置仅作首次出现的默认值。名称、symbol 图标仍应更新，不能为了保留布局而保留旧标题。宿主合法拒绝注册 Dock 时直接跳过，不模拟创建。
- 设置重放与本地设置共用应用入口，不能重复添加命令、覆盖用户最新快捷键或累积事件监听。卸载后，正在读取的刷新不能再提交数据或创建视图。

具体执行顺序以 `StorageRefresh` 为准；以上是修改顺序或更换实现时仍必须满足的约束，不是要求复制一套固定函数体。

## 宿主适配的依据

当前适配参考 SiYuan 3.8.0 与 3.8.8 固定源码，升级宿主支持时应复核，不能以本地 `siyuan` 类型包代替运行期行为：

- 两版本的 `onDataChanged` 默认实现不同；调用 `super.onDataChanged()` 不是通用的“完整重载插件”接口，宿主也不在所有版本等待自定义回调。刷新任务必须自行协调，不能把整插件重载当作已经验证的简化。
- 文件读取成功为 HTTP 200；已知缺失是 HTTP 202 且 `code: 404`。其他错误不能当成缺失。
- 3.8.0 没有公共 `removeDock`，恢复 Dock 时可能恢复旧 title/icon；3.8.8 有公共移除能力，但 `addDock` 在独立设置窗口可以合法 no-op。私有适配留在 Dock 拥有者，不扩散到组件。

核验入口：[3.8.0 Plugin][host-380-plugin]、[3.8.0 loader][host-380-loader]、[3.8.8 Plugin][host-388-plugin]、[3.8.8 loader][host-388-loader]、[3.8.0 文件 API][host-380-file]。这些是源码依据，不是实际双机或手机验收结论。

## 修改与验证清单

按本次改动选择检查项，不要求每个普通功能都扩展同步机制：

| 修改内容 | 必须检查 |
| --- | --- |
| 新增存档、字段或保存入口 | 读入/替换/缺省/删除语义是否完整；保存是否经过 `bookmarkStorage`；延迟保存是否可被专用路径取消，而不是另建不受控的 timer 或直接调 `Plugin.saveData` |
| 新增会异步写 Store 的模型查询 | 是否通过专用路径的查询登记入口；私有子任务是否包含在外层 Promise 中；验证在途查询完成前不会提交替换，不能往每个方法追加轮次判断 |
| 新增编辑弹窗或独立 Solid 根 | 是否走 `src/libs/dialog.ts` 的自有弹窗入口；正常关闭与 discard 是否区分；render disposer 是否在两条路径都执行 |
| 修改 Dock/设置应用 | 本机布局、增删/隐藏/改名、addDock no-op、命令与监听幂等、首次挂载和重试后的查询是否仍正确 |
| 扩大并发保障 | 先确认新的责任边界与永久维护成本；源码证明“可能发生”不自动意味着插件必须内部解决 |

自动验证使用 `pnpm test`、`pnpm check`、`pnpm build`。测试脚本的 browser condition 用于选择 Solid 浏览器响应式运行时；不要把 Node 默认服务端实现的结果当成生产响应式行为。`tests/storage-refresh.test.cjs` 覆盖跨模块刷新，`tests/storage-refresh-environment.cjs` 使用真实模型/Store/弹窗实现，但替换了宿主、I/O 与 JSX。

涉及根重建或交互时，还需验证真实编译产物与 Solid JSX，检查旧指令是否重放、警告是否真是 Dialog、失败旧画面和重试是否可用。替身宿主下的浏览器测试不等于真实思源验收。改变宿主适配时，应在对应版本验证桌面/设置窗口/手机及实际快捷键；改变同步行为时，应准备隔离存档与恢复方式，再经授权做真实跨设备验证。

维护本文与相关测试时，只记录责任或跨模块约束的变化；执行日志、测试数量和未完成工作的交接留在变更目录，不写进长期规范。

[host-380-plugin]: https://github.com/siyuan-note/siyuan/blob/251596fc0de2f9528c00c224252fd073a99973f4/app/src/plugin/index.ts
[host-380-loader]: https://github.com/siyuan-note/siyuan/blob/251596fc0de2f9528c00c224252fd073a99973f4/app/src/plugin/loader.ts
[host-388-plugin]: https://github.com/siyuan-note/siyuan/blob/bfe36100477b7bbd66db1a8b8cff5547b2ccdb59/app/src/plugin/index.ts
[host-388-loader]: https://github.com/siyuan-note/siyuan/blob/bfe36100477b7bbd66db1a8b8cff5547b2ccdb59/app/src/plugin/loader.ts
[host-380-file]: https://github.com/siyuan-note/siyuan/blob/251596fc0de2f9528c00c224252fd073a99973f4/kernel/api/file.go
