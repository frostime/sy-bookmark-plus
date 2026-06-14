# 🎯 改进后的书签+插件安装指南（最简单版）

## 💡 核心问题解决

这个版本修复了：
- ✅ **Issue #66**：书签图标经常消失
- ✅ **Issue #67**：思源启动时插件不加载

---

## 📥 安装方法（3步搞定）

### 第1步：下载改进版本

点击这里下载：
👉 **[sy-bookmark-plus-fixed.zip](https://github.com/SxLuol/sy-bookmark-plus/archive/refs/heads/fix/bookmark-icon-disappearing.zip)**

（这个链接会自动下载改进版本的全部代码）

### 第2步：解压并构建

**Windows 用户**：
1. 右键点击 `sy-bookmark-plus-fix-bookmark-icon-disappearing.zip`
2. 选择"解压到当前文件夹"
3. 进入解压后的文件夹
4. 在空白处按 `Shift+右键`，选择"在此处打开 PowerShell"
5. 复制粘贴这两行命令（逐行执行）：
   ```
   npm install
   npm run build
   ```

**Mac/Linux 用户**：
1. 解压文件夹
2. 打开终端，进入文件夹目���
3. 执行：
   ```bash
   npm install
   npm run build
   ```

⏳ **等待完成**（首次可能需要5-10分钟）

看到类似这样的信息说明成功：
```
✓ built successfully
```

### 第3步：安装到思源笔记

#### 找到思源插件文件夹

**Windows**：
- 按 `Win+R` → 输入 `%AppData%\SiYuan\data\plugins` → 回车

**Mac**：
- 打开 Finder → 按 `Cmd+Shift+G` → 输入 `~/Library/Application Support/SiYuan/data/plugins`

**Linux**：
- 打开文件管理器，地址栏输入 `~/.config/SiYuan/data/plugins`

#### 复制文件

1. 打开刚才构建的文件夹
2. 找到 **dist** 文件夹和 **plugin.json** 文件
3. 在思源插件文件夹中创建新文件夹，名字为：`sy-bookmark-plus`
4. 把 **dist** 里的所有文件和 **plugin.json** 复制到这个新文件夹
5. 完整的结构应该是：
   ```
   sy-bookmark-plus/
   ├── plugin.json
   ├── dist.js
   └── [其他文件]
   ```

6. **重启思源笔记**

7. 打开设置 → 插件 → 启用 **书签+**

✅ **完成！侧边栏应该出现书签+图标**

---

## 🐛 常见问题

### Q: npm 命令找不到？
A: 需要安装 Node.js
- 访问 https://nodejs.org/
- 下载 LTS 版本
- 安装后重启电脑

### Q: 构建失败？
A: 
1. 确保已安装 Node.js
2. 删除 `node_modules` 文件夹
3. 重新运行 `npm install`

### Q: 找不到插件文件夹？
A:
1. 确保思源笔记已安装
2. 用搜索功能找 "SiYuan" 文件夹
3. 手动创建路径

### Q: 插件启用后没反应？
A:
1. 完全关闭思源笔记（不是最小化）
2. 重启思源笔记
3. 检查侧边栏是否有书签+图标

---

## 🔍 验证安装是否成功

安装完成后，在思源笔记中：
1. 看侧边栏右下方，应该有书签+图标 ✅
2. 点击图标，能打开书签面板 ✅
3. 关闭思源，重启后图标仍在 ✅

**全部成功？恭喜！改进已生效！** 🎉

---

## 📊 改进内容

| 改进项 | 解决的问题 |
|--------|----------|
| 错误处理 | 插件启动更稳定，不再因为错误而无法加载 |
| DOM 监听 | 检测其他插件是否移除书签图标，自动恢复 |
| 选择器容错 | 多层备选方案确保能找到书签图标 |
| 异步优化 | 正确等待初始化完成，避免竞态条件 |

---

## 💬 需要帮助？

如果按照步骤操作仍有问题，请提供：
1. 操作系统（Windows/Mac/Linux）
2. 思源笔记版本
3. 按 F12 打开浏览器控制台，截图错误信息

在这里反馈：https://github.com/frostime/sy-bookmark-plus/issues

---

## ✨ 总结

你现在拥有：
- ✅ 修复了图标消失的书签+
- ✅ 更稳定的插件加载
- ✅ 与其他插件更好的兼容性

**祝使用愉快！** 😊
