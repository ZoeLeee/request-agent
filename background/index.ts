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
  // 请求头字段
  requestHeaders?: {[key: string]: string}
  // 响应相关字段
  responseStatus?: number
  responseStatusText?: string
  responseHeaders?: {[key: string]: string}
  responseContent?: string
  responseTime?: number
  responseSize?: number
  responseType?: string
  // 自定义响应���段
  shouldIntercept?: boolean
  customResponse?: string
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
let debugEnabled = false
let inspectedTabId: number | null = null

// 检查是否是当前正在调试的标签页
function isInspectedTab(tabId: number): boolean {
  return inspectedTabId === tabId
}

storage.watch({
  rules: (c) => {
    rules = c.newValue
  },
  debugEnabled: (c) => {
    debugEnabled = c.newValue || false
    console.log(`调试模式已${debugEnabled ? '开启' : '关闭'}`)
    
    // 当调试模式状态变化时，更新调试器连接
    if (debugEnabled) {
      // 如果有已设置的检查标签页，则连接到该标签页
      if (inspectedTabId) {
        attachDebugger(inspectedTabId)
      }
    } else {
      // 断开所有 debugger 连接
      Object.keys(debuggerConnections).forEach(tabId => {
        detachDebugger(parseInt(tabId))
      })
    }
  },
  // 记录当前正在调试的标签页 ID
  inspectedTabId: (c) => {
    const tabId = c.newValue
    if (tabId && debugEnabled) {
      // 如果调试模式已开启，则连接到该标签页
      attachDebugger(tabId)
    }
  }
})

// 初始化调试状态
storage.get<boolean>("debugEnabled").then((value) => {
  debugEnabled = value || false
  console.log(`初始化调试模式: ${debugEnabled ? '开启' : '关闭'}`)
})

// 初始化当前正在调试的标签页 ID
storage.get<number>("inspectedTabId").then((value) => {
  inspectedTabId = value
  console.log(`初始化调试标签页 ID: ${inspectedTabId}`)
})

// 创建一个Map来存储请求信息，以便后续更新响应信息
const requestMap = new Map<string, RequestInfo>()

// 拦截请求头信息
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    const requestInfo = requestMap.get(details.requestId)
    if (requestInfo) {
      // 提取请求头信息
      const headers: {[key: string]: string} = {}
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

// 使用 Chrome Debugger API 拦截和修改网络请求

// 存储当前活跃的 debugger 连接
// 格式： { tabId: { attached: boolean, requestMap: Map<string, RequestInfo> } }
const debuggerConnections: { [tabId: number]: { attached: boolean, requestMap: Map<string, string> } } = {}

// 监听标签页创建事件
chrome.tabs.onCreated.addListener((tab) => {
  // 只对当前正在调试的标签页进行连接
  if (tab.id && debugEnabled && isInspectedTab(tab.id)) {
    attachDebugger(tab.id)
  }
})

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 只对当前正在调试的标签页进行连接
  if (changeInfo.status === "complete" && tab.id && debugEnabled && isInspectedTab(tab.id)) {
    // 等待一小段时间再连接，确保页面已完全加载
    setTimeout(() => {
      attachDebugger(tab.id)
    }, 1000) // 增加延迟时间，确保页面完全加载
  }
})

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener((tabId) => {
  detachDebugger(tabId)
})

// 连接到 debugger
async function attachDebugger(tabId: number) {
  if (!tabId || !debugEnabled) {
    return
  }
  if (debuggerConnections[tabId] && debuggerConnections[tabId].attached) {
    return
  }
  
  try {
    // 先尝试断开现有连接，防止冲突
    try {
      await chrome.debugger.detach({ tabId })
    } catch (e) {
      // 忽略错误，可能本来就没有连接
    }
    
    // 连接到 debugger
    await chrome.debugger.attach({ tabId }, "1.3")
    console.log(`成功连接到 debugger: tabId=${tabId}`)
    
    // 初始化连接状态
    debuggerConnections[tabId] = {
      attached: true,
      requestMap: new Map()
    }
    
    // 启用网络事件
    await chrome.debugger.sendCommand({ tabId }, "Network.enable")
    console.log(`已启用 Network 域: tabId=${tabId}`)
    
    // 启用 Fetch 域，允许拦截请求
    await chrome.debugger.sendCommand({ tabId }, "Fetch.enable", {
      patterns: [{ urlPattern: "*" }]
    })
    console.log(`已启用 Fetch 域: tabId=${tabId}`)
    
    // 监听请求发送事件
    chrome.debugger.onEvent.addListener(handleDebuggerEvent)
  } catch (error) {
    console.error(`连接 debugger 失败: tabId=${tabId}`, error)
  }
}

// 断开与 debugger 的连接
async function detachDebugger(tabId: number) {
  if (debuggerConnections[tabId] && debuggerConnections[tabId].attached) {
    try {
      await chrome.debugger.detach({ tabId })
      console.log(`断开与 debugger 的连接: tabId=${tabId}`)
      delete debuggerConnections[tabId]
    } catch (error) {
      console.error(`断开 debugger 连接失败: tabId=${tabId}`, error)
    }
  }
}

// 处理 debugger 事件
async function handleDebuggerEvent(
  debuggeeId: chrome.debugger.Debuggee,
  method: string,
  params?: any
) {
  const { tabId } = debuggeeId
  
  if (!tabId || !debuggerConnections[tabId]) {
    return
  }
  
  // 处理 Fetch 请求拦截事件
  if (method === "Fetch.requestPaused" && params) {
    const { requestId, request, resourceType } = params
    
    // 检查是否有匹配的规则
    const matchedRule = rules.find(
      (rule) =>
        (rule.matchType === "exact" && rule.url === request.url) ||
        (rule.matchType === "contains" && request.url.includes(rule.url)) ||
        (rule.matchType === "regex" && new RegExp(rule.url).test(request.url))
    )
    
    if (matchedRule && matchedRule.response) {
      try {
        console.log(`找到匹配的规则，拦截请求: ${request.url}`)
        
        // 准备响应头
        const responseHeaders = [
          { name: "Content-Type", value: "application/json" },
          { name: "Access-Control-Allow-Origin", value: "*" },
          { name: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { name: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
          { name: "Cache-Control", value: "no-cache, no-store, must-revalidate" }
        ]
        
        // 记录请求信息
        const requestInfo: RequestInfo = {
          id: requestId,
          url: request.url,
          method: request.method,
          timeStamp: Date.now(),
          type: resourceType as ResourceType,
          tabId: tabId,
          frameId: 0,
          parentFrameId: 0,
          initiator: request.headers['Origin'] || '',
          requestHeaders: {},
          responseContent: matchedRule.response,
          responseStatus: 200,
          responseStatusText: "OK",
          responseType: "json",
          responseTime: 0,
          shouldIntercept: true,
          customResponse: matchedRule.response
        }
        
        // 将请求信息添加到请求数组中
        requests.push(requestInfo)
        
        // 使用简单的纯文本响应
        await chrome.debugger.sendCommand(
          { tabId },
          "Fetch.fulfillRequest",
          {
            requestId,
            responseCode: 200,
            responseHeaders: responseHeaders,
            body: btoa(matchedRule.response) // 简单的 Base64 编码
          }
        )
        
        console.log(`成功拦截并修改响应: ${requestId}`)
        return
      } catch (error) {
        console.error(`拦截响应失败: ${requestId}`, error)
        
        // 如果拦截失败，继续请求
        try {
          await chrome.debugger.sendCommand(
            { tabId },
            "Fetch.continueRequest",
            { requestId }
          )
        } catch (continueError) {
          console.error(`继续请求失败: ${requestId}`, continueError)
        }
      }
    } else {
      // 如果没有匹配的规则，继续请求
      try {
        await chrome.debugger.sendCommand(
          { tabId },
          "Fetch.continueRequest",
          { requestId }
        )
      } catch (err) {
        console.error(`继续请求失败: ${requestId}`, err)
      }
    }
  }
  
  // 处理网络请求事件，用于记录请求
  if (method === "Network.requestWillBeSent" && params) {
    const { requestId, request, type } = params
    
    // 检查是否已经存在该请求（可能已经被 Fetch 拦截处理过）
    const existingRequest = requests.find(req => req.url === request.url && req.timeStamp > Date.now() - 5000)
    
    if (!existingRequest) {
      // 将请求信息存储到请求数组中
      const requestInfo: RequestInfo = {
        id: requestId,
        url: request.url,
        method: request.method,
        timeStamp: Date.now(),
        type: type.toLowerCase() as ResourceType,
        tabId: tabId,
        frameId: 0,
        parentFrameId: 0,
        initiator: params.initiator || ''
      }
      
      // 将请求信息添加到请求数组中
      requests.push(requestInfo)
      // 将请求信息存储到 Map 中，以便后续更新
      requestMap.set(requestId, requestInfo)
    }
  }
}

// 拦截响应头信息
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const requestInfo = requestMap.get(details.requestId)
    if (requestInfo) {
      // 提取状态码和状态文本
      requestInfo.responseStatus = details.statusCode
      requestInfo.responseStatusText = details.statusLine ? details.statusLine.split(' ')[1] : ''
      
      // 提取响应头信息
      const headers: {[key: string]: string} = {}
      if (details.responseHeaders) {
        for (const header of details.responseHeaders) {
          if (header.name && header.value) {
            headers[header.name.toLowerCase()] = header.value
          }
        }
      }
      requestInfo.responseHeaders = headers
      
      // 尝试确定响应类型
      const contentType = headers['content-type'] || ''
      if (contentType.includes('application/json')) {
        requestInfo.responseType = 'json'
      } else if (contentType.includes('text/')) {
        requestInfo.responseType = 'text'
      } else if (contentType.includes('image/')) {
        requestInfo.responseType = 'image'
      } else {
        requestInfo.responseType = contentType || 'unknown'
      }
      
      // 尝试确定响应大小
      if (headers['content-length']) {
        requestInfo.responseSize = parseInt(headers['content-length'], 10)
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

// 监听扩展图标点击事件，打开新窗口或聚焦到已打开的窗口
// chrome.action.onClicked.addListener(() => {
//   const targetUrl = chrome.runtime.getURL("tabs/index.html");
  
//   // 查找是否已经有打开的窗口
//   chrome.windows.getAll({ populate: true }, (windows) => {
//     // 查找包含目标URL的窗口
//     const existingWindow = windows.find(window => 
//       window.tabs && window.tabs.some(tab => tab.url === targetUrl)
//     );
    
//     if (existingWindow && existingWindow.id) {
//       // 如果找到已打开的窗口，则聚焦并激活该窗口
//       chrome.windows.update(existingWindow.id, { focused: true }, () => {
//         // 找到并激活对应的标签页
//         if (existingWindow.tabs) {
//           const targetTab = existingWindow.tabs.find(tab => tab.url === targetUrl);
//           if (targetTab && targetTab.id) {
//             chrome.tabs.update(targetTab.id, { active: true });
//           }
//         }
//       });
//     } else {
//       // 如果没有找到已打开的窗口，则创建新窗口
//       chrome.windows.create({
//         url: targetUrl,
//         type: "popup",
//         state: "maximized"  // 设置窗口为最大化状态
//       });
//     }
//   });
// })


