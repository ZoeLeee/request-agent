import { Storage } from "@plasmohq/storage"
import { DefaultStorage } from "./storage"
import type { RequestInfo, ResourceType, Rule } from "~types"

// 存储 debugger 连接状态的对象
interface DebuggerConnection {
  attached: boolean
  requestMap: Map<string, any>
}

// 使用默认存储
const storage = DefaultStorage

// 存储 debugger 连接状态
const debuggerConnections: Record<number, DebuggerConnection> = {}

// 请求映射，用于跟踪请求
const requestMap = new Map<string, RequestInfo>()

// 外部引用的请求数组
let requests: RequestInfo[] = []
let rules: Rule[] = []

// 设置外部引用的请求数组
export function setRequestsRef(requestsRef: RequestInfo[]) {
  requests = requestsRef
}

// 连接到 debugger
export async function attachDebugger(tabId: number, debugEnabled: boolean) {
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
    // 连接失败时向用户端发送错误信息，并结束 loading 状态
    // 确保在错误情况下更新存储并通知界面
    try {
      await storage.set("debugEnabled", false)
      console.log('已关闭调试模式，由于连接失败')
    } catch (storageError) {
      console.error('无法更新存储状态:', storageError)
    }

    // 使用 messaging 发送错误信息
    chrome.runtime.sendMessage({
      name: "debugError",
      body: {
        type: "connect",
        message: `连接 debugger 失败: ${error.message || '未知错误'}`
      }
    })
  }
}

// 断开与 debugger 的连接
export async function detachDebugger(tabId: number) {
  if (debuggerConnections[tabId] && debuggerConnections[tabId].attached) {
    try {
      await chrome.debugger.detach({ tabId })
      console.log(`断开与 debugger 的连接: tabId=${tabId}`)
      delete debuggerConnections[tabId]
    } catch (error) {
      console.error(`断开 debugger 连接失败: tabId=${tabId}`, error)
      // 断开连接失败时也向 devtool 页面发送消息，结束 loading 状态
      await storage.set("debugEnabled", false)
      
      // 使用 messaging 发送错误信息
      chrome.runtime.sendMessage({
        name: "debugError",
        body: {
          type: "detach",
          message: `断开 debugger 连接失败: ${error.message || '未知错误'}`
        }
      })
    }
  }
}

// 处理 debugger 事件
export async function handleDebuggerEvent(
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

    // 获取最新规则
    rules = await storage.get<Rule[]>("rules")

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
          {
            name: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS"
          },
          {
            name: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization"
          },
          {
            name: "Cache-Control",
            value: "no-cache, no-store, must-revalidate"
          }
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
          initiator: request.headers["Origin"] || "",
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
        await chrome.debugger.sendCommand({ tabId }, "Fetch.fulfillRequest", {
          requestId,
          responseCode: 200,
          responseHeaders: responseHeaders,
          body: btoa(matchedRule.response) // 简单的 Base64 编码
        })

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
        await chrome.debugger.sendCommand({ tabId }, "Fetch.continueRequest", {
          requestId
        })
      } catch (err) {
        console.error(`继续请求失败: ${requestId}`, err)
      }
    }
  }

  // 处理网络请求事件，用于记录请求
  if (method === "Network.requestWillBeSent" && params) {
    const { requestId, request, type } = params

    // 检查是否已经存在该请求（可能已经被 Fetch 拦截处理过）
    const existingRequest = requests.find(
      (req) => req.url === request.url && req.timeStamp > Date.now() - 5000
    )

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
        initiator: params.initiator || ""
      }

      // 将请求信息添加到请求数组中
      requests.push(requestInfo)
      // 将请求信息存储到 Map 中，以便后续更新
      requestMap.set(requestId, requestInfo)
    }
  }
}
