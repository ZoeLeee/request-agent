import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

// 存储拦截到的请求
// 定义 ResourceType 类型，与 Chrome 网络请求 API 一致
type ResourceType = 
  | "main_frame" 
  | "sub_frame" 
  | "stylesheet" 
  | "script" 
  | "image" 
  | "font" 
  | "object" 
  | "xmlhttprequest" 
  | "ping" 
  | "csp_report" 
  | "media" 
  | "websocket" 
  | "webbundle" 
  | "other"

interface RequestInfo {
  id: string
  url: string
  method: string
  timeStamp: number
  type: ResourceType
  tabId: number
  frameId: number
  parentFrameId: number
  initiator?: string
}

// 存储规则的接口
interface Rule {
    id: string
    url: string
    matchType: "exact" | "contains" | "regex"
    response: string
  }
  
  

export let requests: RequestInfo[] = []
const storage = new Storage()

let rules: Rule[] = []

storage.watch({
  rules: (c) => {
    rules = c.newValue
  }
})

// 拦截网络请求
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
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
    // 检查是否有自定义规则匹配

    const matchedRule = rules.find(
      (rule) =>
        (rule.matchType === "exact" && rule.url === details.url) ||
        (rule.matchType === "contains" && details.url.includes(rule.url)) ||
        (rule.matchType === "regex" && new RegExp(rule.url).test(details.url))
    )
  },
  { urls: ["<all_urls>"] }
)

// 监听扩展图标点击事件，打开新窗口
chrome.action.onClicked.addListener(() => {
  // 创建全屏窗口
  chrome.windows.create({
    url: chrome.runtime.getURL("tabs/index.html"),
    type: "popup",
    state: "maximized"  // 设置窗口为最大化状态
  });
})


