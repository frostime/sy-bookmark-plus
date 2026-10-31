# Changelog

本文件记录 Bookmark+ 所有值得注意的变更。
格式基于 [Keep a Changelog](https://keepachangelog.com/en/2.0.0/)，版本号遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [Unreleased]

## [2.3.1] - 2026-10-31

### Added

- 书签组列表图标支持思源的动态图标（7 种日期图标、自定义文字图标）、图片地址和本地图片（最大 128 KB，随书签配置保存）；Dock 图标尚未包含在内 [#41](https://github.com/frostime/sy-bookmark-plus/issues/41)

### Changed

- 收到存档变更通知后自动刷新书签数据、Dock 和设置，无需重启或重新打开面板
- 通知到达时本机有未保存修改或打开的编辑窗口，会警告并丢弃本机未保存编辑。不支持多设备同时编辑

### Fixed

- 关闭再开启「接管原生书签入口」后，不再恢复用户主动清空的快捷键
- 无活动文档时，依赖 `{{CurDocId}}` / `{{CurRootId}}` 的动态组暂不查询 [#62](https://github.com/frostime/sy-bookmark-plus/issues/62)
- 修复思源 3.8.2 及以上版本无法从编辑器拖入块加入书签的问题 [#71](https://github.com/frostime/sy-bookmark-plus/issues/71)
- 修复多选块拖入书签组时添加失败的问题

## [2.1.1] - 2025-05-14

### Fixed

- 一些稳定性问题

## [1.4.1] - 2024-12-16

### Added

- 添加 javascritp 查询规则
- 在 globalThis 上挂载一个 BookmarkPlusSDK 对象

## [1.3.3] - 2024-09-14

### Changed

- 数据库显示为其标题
- 优化任务列表项的图标

## [1.3.2] - 2024-09-08

### Added

- 在动态书签组的头部添加了一个「刷新」按钮

## [1.3.1] - 2024-09-08

### Fixed

- 修复删除项目所在笔记本后，导致插件崩溃无法显示面板的问题 [#28](https://github.com/frostime/sy-bookmark-plus/issues/28)

## [1.3.0] - 2024-08-26

### Added

- 支持传入变量如当前文档id [#14](https://github.com/frostime/sy-bookmark-plus/issues/14)
  - 相关用法已更新 README
- 支持从文档树中直接拖入文档加入书签中 [#16](https://github.com/frostime/sy-bookmark-plus/issues/16)

## [1.2.3] - 2024-08-15

### Changed

- 适配优化移动端 [#13](https://github.com/frostime/sy-bookmark-plus/issues/13)
  - 允许移动端点击跳转
  - 去掉异常显示的 empty element
  - 优化 setting 对话框显示

## [1.2.2] - 2024-07-30

### Added

- 优化反查询功能，允许添加后处理
  - 显示上层父块
  - 显示所在的文档
- 在 SQL 模板中新增「TODO」查询

### Changed

- 新建分组中，如果切换了分组类型就清空原本的输入

## [1.2.1] - 2024-07-21

### Added

- 鼠标悬浮，显示书签项目完整信息

### Fixed

- 模式选择下拉框没有显示正确的当前状态

## [1.2.0] - 2024-07-15

### Added

- 创建书签组的时候，提供一些现成的模板以供选择
- 允许动态组在折叠展开的时候刷新查询项目

### Changed

- 优化代码实现，提高性能

### Fixed

- 解决动态组数量太大时，刷新全局会出现项目丢失的错误

## [1.1.0] - 2024-07-09

### Added

- 显示隐藏书签组的时候加入过渡动画
- 显示失效项目的内部细节

### Fixed

- 修复重复设置 err item 的 title 属性的恶性 bug

[Unreleased]: https://github.com/frostime/sy-bookmark-plus/compare/v2.3.1...HEAD
[2.3.1]: https://github.com/frostime/sy-bookmark-plus/compare/v2.3.0...v2.3.1
[2.1.1]: https://github.com/frostime/sy-bookmark-plus/compare/v2.1.0...v2.1.1
[1.4.1]: https://github.com/frostime/sy-bookmark-plus/compare/v1.4.0...v1.4.1
[1.3.3]: https://github.com/frostime/sy-bookmark-plus/compare/v1.3.2...v1.3.3
[1.3.2]: https://github.com/frostime/sy-bookmark-plus/compare/v1.3.1...v1.3.2
[1.3.1]: https://github.com/frostime/sy-bookmark-plus/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/frostime/sy-bookmark-plus/compare/v1.2.3...v1.3.0
[1.2.3]: https://github.com/frostime/sy-bookmark-plus/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/frostime/sy-bookmark-plus/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/frostime/sy-bookmark-plus/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/frostime/sy-bookmark-plus/compare/v1.1.2...v1.2.0
[1.1.0]: https://github.com/frostime/sy-bookmark-plus/compare/v1.0.1...v1.1.0
