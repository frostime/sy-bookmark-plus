# Changelog

本文件记录 Bookmark+ 所有值得注意的变更。
格式基于 [Keep a Changelog](https://keepachangelog.com/en/2.0.0/)，版本号遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [Unreleased]

### Added

- 书签组列表图标支持思源的动态图标（7 种日期图标、自定义文字图标）与图片地址，新建和编辑组时可预览；Dock 图标与图片上传尚未包含在内 [#41](https://github.com/frostime/sy-bookmark-plus/issues/41)

### Changed

- 开发与构建工具链升级至 vite 8、TypeScript 6、SolidJS 1.9，构建环境要求 Node >= 24 与 pnpm 11；发布流程新增版本一致性校验与类型检查。

### Fixed

- 无活动文档时，含 `{{CurDocId}}` / `{{CurRootId}}` 的规则不再执行未解析的查询，属性值条件也不会被意外移除。此时组返回空结果，文档就绪后仍需手动刷新或使用已开启的随页签切换刷新功能；页面初始化时的恢复问题尚待验证 [#62](https://github.com/frostime/sy-bookmark-plus/issues/62)
- 修复思源 3.8.2 及以上版本无法从编辑器块图标拖入书签的问题：新版拖块会额外登记一个排在前面的拖拽类型，插件原先只检查第一个类型，导致拖放被浏览器直接拒绝 [#71](https://github.com/frostime/sy-bookmark-plus/issues/71)
- 修复多选块拖入时把逗号分隔的块 id 当成单个 id、导致全部失败的问题

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

[Unreleased]: https://github.com/frostime/sy-bookmark-plus/compare/v2.3.0...HEAD
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
