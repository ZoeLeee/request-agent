import type { RequestInfo, ResourceType, Rule } from "~types"
import {
  attachDebugger,
  debuggerConnections,
  DebuugerTabIdSet,
  detachDebugger,
  setRequestsRef
} from "~utils/debugger"
import { DefaultStorage } from "~utils/storage"

export let requests: RequestInfo[] = []
const storage = DefaultStorage

let rules: Rule[] = []
let debugEnabled = false

storage.watch({
  rules: (c) => {
    rules = c.newValue
  },
  debugEnabled: (c) => {
    debugEnabled = c.newValue || false
    console.log(`调试模式已${debugEnabled ? "开启" : "关闭"}`)

    // 当调试模式状态变化时，更新调试器连接
    if (!debugEnabled) {
      // 断开所有 debugger 连接
      Object.keys(debuggerConnections).forEach((tabId) => {
        detachDebugger(parseInt(tabId))
      })
    } else {
      console.log('DebuugerTabIdSet: ', DebuugerTabIdSet);
      DebuugerTabIdSet.forEach((id) => {
        attachDebugger(id, true)
      })
    }
  }
})

// 初始化调试状态
storage.get<boolean>("debugEnabled").then((value) => {
  debugEnabled = value || false
  console.log(`初始化调试模式: ${debugEnabled ? "开启" : "关闭"}`)
})

// 创建一个Map来存储请求信息，以便后续更新响应信息
const requestMap = new Map<string, RequestInfo>()

// 拦截请求头信息
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    const requestInfo = requestMap.get(details.requestId)
    if (requestInfo) {
      // 提取请求头信息
      const headers: { [key: string]: string } = {}
      if (details.requestHeaders) {
        for (const header of details.requestHeaders) {
          if (header.name && header.value) {
            headers[header.name.toLowerCase()] = header.value
          }
        }
      }
      requestInfo.requestHeaders = headers
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
)

// 拦截网络请求并记录信息
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type !== "xmlhttprequest") return

    const requestInfo: RequestInfo = {
      id: details.requestId,
      url: details.url,
      method: details.method,
      timeStamp: details.timeStamp,
      type: details.type,
      tabId: details.tabId,
      frameId: details.frameId,
      parentFrameId: details.parentFrameId,
      initiator: details.initiator
    }

    requests.push(requestInfo)
    // 将请求信息存储到Map中，以便后续更新
    requestMap.set(details.requestId, requestInfo)

    // 检查是否有自定义规则匹配
    const matchedRule = rules.find(
      (rule) =>
        (rule.matchType === "exact" && rule.url === details.url) ||
        (rule.matchType === "contains" && details.url.includes(rule.url)) ||
        (rule.matchType === "regex" && new RegExp(rule.url).test(details.url))
    )

    // 如果找到匹配的规则，标记该请求为“应被拦截”
    if (matchedRule && matchedRule.response) {
      console.log(`找到匹配的规则: ${details.url}, 将在响应阶段处理`)

      // 将自定义响应存储到请求信息中
      requestInfo.shouldIntercept = true
      requestInfo.customResponse = matchedRule.response
    }
  },
  { urls: ["<all_urls>"] }
)

// 监听标签页创建事件
chrome.tabs.onCreated.addListener((tab) => {
  // 如果调试模式开启，连接到新创建的标签页
  if (tab.id && debugEnabled) {
    console.log(`新标签页创建: tabId=${tab.id}`)
    attachDebugger(tab.id, debugEnabled)
  }
})

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // 只对调试模式开启的情况处理
  if (changeInfo.status === "complete" && tab.id && debugEnabled) {
    console.log(`标签页更新完成: tabId=${tab.id}`)
    // 等待一小段时间再连接，确保页面已完全加载
    setTimeout(() => {
      attachDebugger(tab.id, debugEnabled)
    }, 1000) // 增加延迟时间，确保页面完全加载
  }
})

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener((tabId) => {
  detachDebugger(tabId)
})

// debugger 相关的功能移到了 utils/debugger.ts 中

// 拦截响应头信息
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const requestInfo = requestMap.get(details.requestId)
    if (requestInfo) {
      // 提取状态码和状态文本
      requestInfo.responseStatus = details.statusCode
      requestInfo.responseStatusText = details.statusLine
        ? details.statusLine.split(" ")[1]
        : ""

      // 提取响应头信息
      const headers: { [key: string]: string } = {}
      if (details.responseHeaders) {
        for (const header of details.responseHeaders) {
          if (header.name && header.value) {
            headers[header.name.toLowerCase()] = header.value
          }
        }
      }
      requestInfo.responseHeaders = headers

      // 尝试确定响应类型
      const contentType = headers["content-type"] || ""
      if (contentType.includes("application/json")) {
        requestInfo.responseType = "json"
      } else if (contentType.includes("text/")) {
        requestInfo.responseType = "text"
      } else if (contentType.includes("image/")) {
        requestInfo.responseType = "image"
      } else {
        requestInfo.responseType = contentType || "unknown"
      }

      // 尝试确定响应大小
      if (headers["content-length"]) {
        requestInfo.responseSize = parseInt(headers["content-length"], 10)
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
)

// 请求完成时的处理
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const requestInfo = requestMap.get(details.requestId)
    if (requestInfo) {
      // 记录响应完成时间
      requestInfo.responseTime = details.timeStamp - requestInfo.timeStamp

      // 注意：由于浏览器安全限制，我们无法直接获取响应体内容
      // 如果需要获取响应体内容，可以考虑使用 chrome.debugger API
      // 或者在前端页面中通过 fetch API 重新请求
    }
  },
  { urls: ["<all_urls>"] }
)
