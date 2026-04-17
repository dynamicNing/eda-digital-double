# E大数字分身

> 一键提取且慢(qieman.com)登录态access_token，用于数据抓取与分析

## 功能

- 🔐 检测且慢网站登录状态
- 🔑 提取 `access_token`
- 📋 一键复制token到剪贴板
- 🔄 实时刷新登录态

## 安装

1. 打开 Chrome，进入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目文件夹

## 使用

1. 登录 [且慢](https://qieman.com)
2. 点击浏览器工具栏的插件图标
3. 查看登录状态和 access_token
4. 点击「复制Token」按钮

## 技术细节

- Manifest V3
- 仅请求 `qieman.com` 域名权限
- 通过 `chrome.scripting.executeScript` 读取目标页面的 localStorage
- Token 存储在 `localStorage.access_token`

## 项目结构

```
eda-digital-double/
├── manifest.json   # 插件配置
├── content.js      # 内容脚本（注入页面）
├── popup.html      # 弹窗UI
├── popup.js       # 弹窗逻辑
└── README.md
```

## 免责声明

本工具仅供个人学习研究使用，请勿用于商业目的或违规爬取。
