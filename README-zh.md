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

1. 在浏览器中打开开发者工具（F12），切换到「Request Agent」面板
2. 在工具栏中点击「Enable」开启调试模式（Debug Mode），以允许拦截和记录请求
3. 在左侧垂直导航选择视图：
   - Network：实时查看请求列表，支持顶部输入框筛选与「Clear Requests」清空
   - Rules：管理拦截规则，支持筛选、「New Rule」新建与「Clear Rules」清空
4. 在 Network 视图：
   - 点击任意请求查看详情（Headers、Response 等）
   - 在详情中可基于该请求一键预填创建规则（URL 将自动带入）
5. 在 Rules 视图：
   - 新建或编辑规则，设置「URL Pattern」「Match Type（exact/contains/regex）」与「Response Content（建议 JSON）」
   - 点击「Save Rule」保存；匹配到规则时，请求将被拦截并返回自定义响应
6. 调试模式说明：
   - 面板关闭或出现错误时会自动关闭调试模式
   - 若连接 DevTools 调试失败，右上角会弹出错误提示（Toast）
7. 注意事项：
   - 跨域资源在直接抓取响应内容时可能受浏览器安全策略限制
   - 为避免复制无效请求头，工具会过滤如 host、origin 等头部
