## Changelog

## v1.3.3

- ✨ feat: 数据库显示为其标题
- 🎨 style: 优化任务列表项的图标


## v1.3.2

- ✨ feat: 在动态书签组的头部添加了一个「刷新」按钮

## v1.3.1

- 🐛 fix: 修复删除项目所在笔记本后，导致插件崩溃无法显示面板的问题 [#28](https://github.com/frostime/sy-bookmark-plus/issues/28)

## v1.3.0

- ✨ feat: 支持传入变量如当前文档id  [#14](https://github.com/frostime/sy-bookmark-plus/issues/14)
  - 相关用法已更新 README
- ✨ feat: 支持从文档树中直接拖入文档加入书签中 [#16](https://github.com/frostime/sy-bookmark-plus/issues/16)

## v1.2.3

- ⚡ perf: 适配优化移动端 [#13](https://github.com/frostime/sy-bookmark-plus/issues/13)
  - 允许移动端点击跳转
  - 去掉异常显示的 empty element
  - 优化 setting 对话框显示

## v1.2.2

- ✨ feat: 优化反查询功能，允许添加后处理
  - 显示上层父块
  - 显示所在的文档
- ✨ feat: 在 SQL 模板中新增「TODO」查询
- 🎨 misc: 新建分组中，如果切换了分组类型就清空原本的输入

### v1.2.1

- ✨ feat: 鼠标悬浮，显示书签项目完整信息
- 🐛 fix: 模式选择下拉框没有显示正确的当前状态

### v1.2.0

- ⚡ perf: 优化代码实现，提高性能
- ✨ feat: 创建书签组的时候，提供一些现成的模板以供选择
- ✨ feat: 允许动态组在折叠展开的时候刷新查询项目
- 🐛 fix: 解决动态组数量太大时，刷新全局会出现项目丢失的错误

### v1.1.0

- ✨ feat: 显示隐藏书签组的时候加入过渡动画
- 🐛 fix: 修复重复设置 err item 的 title 属性的恶性 bug
- ✨ feat: 显示失效项目的内部细节
