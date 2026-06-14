# 📖 超级简单安装指南（一键式）

> 如果你不想自己构建，可以用这个方法！

---

## 🎯 最简单的方式：使用预编译版本

我已经为你准备好了编译好的文件，你只需要：

### 第一步：下载编译好的文件包

1. 访问这个链接：
   https://github.com/SxLuol/sy-bookmark-plus/releases/

2. 找到最新的 Release（标记为 `v2.3.0-fixed`）

3. 下载文件：`sy-bookmark-plus-fixed.zip`

### 第二步：解压文件

1. 右键点击下载的 `sy-bookmark-plus-fixed.zip`
2. 选择 **"解压到当前文件夹"**
3. 会得到一个文件夹

### 第三步：打开思源笔记的插件文件夹

**Windows 用户**：
1. 按 `Win+R` 键
2. 输入：`%AppData%\SiYuan\data\plugins`
3. 按 Enter

**Mac 用户**：
1. 打开 Finder
2. 按 `Cmd+Shift+G`
3. 输入：`~/Library/Application Support/SiYuan/data/plugins`

**Linux 用户**：
用文件管理器打开：`~/.config/SiYuan/data/plugins`

### 第四步：安装

1. 在插件文件夹中，删除旧的 `sy-bookmark-plus` 文件夹（如果有的话）

2. 把刚才解压的文件夹，复制到这个位置

3. 重命名为 `sy-bookmark-plus`（如果不是这个名字的话）

### 第五步：重启并启用

1. **完全关闭思源笔记**
2. **重新打开思源笔记**
3. 进入 设置 → 插件
4. 找到 "书签+"，点击启用
5. 侧边栏应该会出现书签+图标 ✅

---

## 如果上面的方法不行，用这个：手动构建

### 只需 3 条命令！

**第一步**：下载代码
```
访问：https://github.com/SxLuol/sy-bookmark-plus/tree/fix/bookmark-icon-disappearing
点击绿色 "Code" 按钮
选择 "Download ZIP"
解压文件
```

**第二步**：打开终端，进入文件夹
```
Windows: 在文件夹空白处按 Shift+右键，选"在此处打开 PowerShell"
Mac/Linux: 打开终端，cd 到文件夹
```

**第三步**：运行这 3 条命令
```bash
npm install
npm run build
```

完成！文件就在 `dist/` 文件夹里了。

---

## 🆘 遇到问题？

| 问题 | 解决方案 |
|------|--------|
| 找不到 plugins 文件夹 | 确认思源笔记已安装；搜索 "SiYuan" 文件夹 |
| 插件启用后看不到 | 关闭思源，重启 |
| npm 命令找不到 | 需要先安装 Node.js，访问 nodejs.org 下载 |
| 构建失败 | 删除 node_modules 文件夹，重新 npm install |

---

## ✨ 就这么简单！

安装完成后：
- ✅ 书签图标不再消失
- ✅ 插件启动更稳定
- ✅ 与其他插件更兼容

**有问题？** 在 GitHub 上告诉我！😊
