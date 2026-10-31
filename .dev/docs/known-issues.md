---
title: 已知实现陷阱
description: 跨文件、跨模块的正确性依赖。改到相关区域时先确认，否则会以难复现的方式失效。
scope:
  - src/storage-refresh.ts
  - src/model/**
  - src/libs/dialog.ts
  - src/components/**
updated: 2026-10-31
---

# 已知实现陷阱

这里只记“改一处必须同时想到另一处”的跨模块依赖。单文件内的约束写在代码旁边的注释里；存档刷新本身的责任边界和顺序约束见[数据同步维护规范](./data-sync.md)。

## KI-1 · 刷新等待的模型查询名单是手写的

`src/storage-refresh.ts` 构造时把 `BookmarkDataModel` 的 `updateViews`、`updateDynamicGroup`、`updateGroupStaticItems` 包成可跟踪查询。名单只写在这个文件里，`src/model/index.ts` 侧看不出自己被包。

- 新增任何“异步查思源、再写回 store”的模型方法，必须同时加入这份名单。漏掉时刷新会在新查询返回前提交新数据，旧结果随后写进刚换上的数据，表现为列表混入不属于当前存档的条目、条目数量对不上。
- 跟踪只在调用时解析 `this.method(...)`。不要改回 `debounce(this.method.bind(this))` 这类提前取值，提前捕获会绕过登记，症状与上一条相同。

## KI-2 · `bookmarkStorage` 是模块单例，暂停期写入被静默丢弃

`src/model/storage.ts` 的 `bookmarkStorage` 只有一个实例。`pause()` 之后，只有 `StorageRefresh` 的成功路径会恢复写入。

- 暂停期间 `write()` 直接返回，只在控制台留一条 debug 记录；延迟保存的定时器也会被取消。调用方 `await` 正常结束，不代表数据已落盘。
- 新增保存入口一律走 `bookmarkStorage.write()` 或 `deferSave()`，不要新建 `setTimeout` 或直接调 `Plugin.saveData`。只有经过存储所有者，取消和暂停才统一生效；绕过它的写入也无法在刷新时被拦住。
