# Changelog

本文件记录 Bookmark+ 所有值得注意的变更。
格式基于 [Keep a Changelog](https://keepachangelog.com/en/2.0.0/)，版本号遵循 [Semantic Versioning](https://semver.org/spec/v2.0.0.html)。

## [Unreleased]

### Added

- 书签组图标支持思源的动态图标（7 种日期图标、自定义文字图标）与自定义图片 [#41](https://github.com/frostime/sy-bookmark-plus/issues/41)

### Changed

- 开发与构建工具链升级至 vite 8、TypeScript 6、SolidJS 1.9，构建环境要求 Node >= 24 与 pnpm 11；发布流程新增版本一致性校验与类型检查。

### Fixed

- 修复页面刚加载、尚未打开文档时 `{{CurDocId}}` 被替换成 `undefined` 导致查询失效的问题 [#62](https://github.com/frostime/sy-bookmark-plus/issues/62)
- 修复启动时插件偶尔完全不加载、需关闭再开启才恢复的问题（默认 Dock 改为在异步加载之前注册）[#67](https://github.com/frostime/sy-bookmark-plus/issues/67)
- 修复思源 3.8.2 及以上版本无法从编辑器块图标拖入书签的问题：新版拖块会额外登记一个排在前面的拖拽类型，插件原先只检查第一个类型，导致拖放被浏览器直接拒绝 [#71](https://github.com/frostime/sy-bookmark-plus/issues/71)
- 修复多选块拖入时把逗号分隔的块 id 当成单个 id、导致全部失败的问题

## [2.1.1] - 2025-05-14

### Fixed

- 修复设置快捷键后刷新思源会被重置的问题 [#53](https://github.com/frostime/sy-bookmark-plus/issues/53)
- 修复新建工作空间后安装插件无法使用的问题，处理快捷键初始化错误 [#57](https://github.com/frostime/sy-bookmark-plus/issues/57)

## [1.4.1] - 2024-12-16

### Added

- 支持 JavaScript 查询规则
- 在 `globalThis` 上挂载 `BookmarkPlusSDK` 对象，便于外部脚本查询书签

## [1.3.3] - 2024-09-14

### Changed

- 数据库块以其数据库标题显示
- 调整任务列表项的图标样式

## [1.3.2] - 2024-09-08

### Added

- 动态书签组头部新增「刷新」按钮

## [1.3.1] - 2024-09-08

### Fixed

- 修复删除条目所在笔记本后插件崩溃、面板无法显示的问题 [#28](https://github.com/frostime/sy-bookmark-plus/issues/28)

## [1.3.0] - 2024-08-26

### Added

- 查询规则支持传入变量（如当前文档 id），用法见 README [#14](https://github.com/frostime/sy-bookmark-plus/issues/14)
- 支持从文档树直接拖入文档加入书签 [#16](https://github.com/frostime/sy-bookmark-plus/issues/16)

## [1.2.3] - 2024-08-15

### Added

- 移动端支持点击跳转

### Fixed

- 修复移动端异常显示的空元素
- 优化移动端设置对话框的显示

## [1.2.2] - 2024-07-30

### Added

- 反查询支持后处理：显示上层父块与所在文档
- SQL 模板新增「TODO」查询

### Changed

- 新建分组时切换分组类型会清空已输入的内容

## [1.2.1] - 2024-07-21

### Added

- 鼠标悬浮时显示书签条目的完整信息

### Fixed

- 修复模式选择下拉框未显示当前状态的问题

## [1.2.0] - 2024-07-15

### Added

- 新建书签组时提供现成模板可选
- 动态组折叠与展开时刷新查询结果

### Changed

- 优化内部实现，提高性能

### Fixed

- 修复动态组条目过多时全局刷新导致条目丢失的问题

## [1.1.0] - 2024-07-09

### Added

- 显示/隐藏书签组时加入过渡动画
- 展示失效条目的详细信息

### Fixed

- 修复重复设置失效条目 `title` 属性导致的问题

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
