# Request Agent - 网络请求监控与拦截工具

这是一个基于 [Plasmo 框架](https://docs.plasmo.com/) 开发的浏览器扩展，用于监控、分析和拦截网络请求。该扩展使用 [`plasmo init`](https://www.npmjs.com/package/plasmo) 进行项目初始化。

## 功能特点

- 实时监控浏览器中的所有网络请求
- 详细展示请求信息，包括 URL、方法、时间戳、类型等
- 支持按 URL、方法或类型筛选请求
- 创建自定义拦截规则，支持精确匹配、包含匹配和正则表达式匹配
- 自定义响应内容，可以修改请求的返回结果
- 直观的用户界面，支持查看请求详情和编辑规则

## 开发指南

### 环境准备

首先，运行开发服务器：

```bash
pnpm dev
# 或
npm run dev
```

在浏览器中加载相应的开发版本。例如，如果你使用 Chrome 浏览器和 Manifest V3，请加载 `build/chrome-mv3-dev` 目录。

### 项目结构

- `background/index.ts`: 后台脚本，负责拦截网络请求并存储请求信息
- `tabs/index.tsx`: 主界面，显示请求列表和详情，允许创建和管理拦截规则
- `tabs/index.css`: 主界面样式

### 自定义开发

你可以通过修改以下文件来扩展功能：

- 修改 `background/index.ts` 以增强请求拦截和处理逻辑
- 修改 `tabs/index.tsx` 以改进用户界面和交互体验

更多开发指南，请[访问 Plasmo 文档](https://docs.plasmo.com/)

## 构建生产版本

运行以下命令：

```bash
pnpm build
# 或
npm run build
```

这将为你的扩展创建一个生产版本，可以打包并发布到各大应用商店。

## 发布到应用商店

部署 Plasmo 扩展的最简单方法是使用内置的 [bpp](https://bpp.browser.market) GitHub Action。在使用此 Action 之前，请确保先构建扩展并上传第一个版本到应用商店以建立基本凭据。然后，按照[这个设置指南](https://docs.plasmo.com/framework/workflows/submit)操作，你就可以实现自动提交了！

## 使用说明

1. 安装扩展后，点击扩展图标打开监控界面
2. 在左侧面板查看所有网络请求
3. 点击请求可在右侧查看详细信息
4. 切换到「规则」标签页可创建拦截规则
5. 设置 URL 匹配模式、匹配类型和自定义响应
6. 点击「保存规则」应用新规则
