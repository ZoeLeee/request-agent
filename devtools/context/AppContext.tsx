import { Toast } from "primereact/toast"
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

import {
  ApiIcon,
  FilesIcon,
  HomeIcon,
  NetworkIcon,
  RulesIcon,
  SessionsIcon
} from "../components/icons"
import type { RequestInfo, Rule } from "../components/types"

// 创建存储实例
const storage = new Storage()

// 定义Context的类型
interface AppContextType {
  // 状态
  requests: RequestInfo[]
  selectedRequest: RequestInfo | null
  rules: Rule[]
  selectedRule: Rule | null
  newRule: Rule
  filterText: string
  ruleFilterText: string
  activeTab: string
  debugEnabled: boolean
  isToggling: boolean
  activeView: string
  responseContent: string
  detailsHeight: number
  ruleDetailsWidth: number
  showSidebar: boolean
  filteredRequests: RequestInfo[]
  filteredRules: Rule[]
  navItems: Array<{
    id: string
    icon: React.ReactNode
    label: string
    beta?: boolean
  }>
  toast: React.RefObject<any> // Toast组件引用

  // 方法
  setRequests: React.Dispatch<React.SetStateAction<RequestInfo[]>>
  setSelectedRequest: React.Dispatch<React.SetStateAction<RequestInfo | null>>
  setRules: React.Dispatch<React.SetStateAction<Rule[]>>
  setSelectedRule: React.Dispatch<React.SetStateAction<Rule | null>>
  setNewRule: React.Dispatch<React.SetStateAction<Rule>>
  setFilterText: React.Dispatch<React.SetStateAction<string>>
  setRuleFilterText: React.Dispatch<React.SetStateAction<string>>
  setActiveTab: React.Dispatch<React.SetStateAction<string>>
  setDebugEnabled: React.Dispatch<React.SetStateAction<boolean>>
  setIsToggling: React.Dispatch<React.SetStateAction<boolean>>
  setActiveView: React.Dispatch<React.SetStateAction<string>>
  setResponseContent: React.Dispatch<React.SetStateAction<string>>
  setDetailsHeight: React.Dispatch<React.SetStateAction<number>>
  setRuleDetailsWidth: React.Dispatch<React.SetStateAction<number>>
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>

  // 业务逻辑方法
  handleClearRequests: () => void
  handleClearRules: () => void
  handleRequestClick: (request: RequestInfo) => void
  handleDetailsClose: () => void
  refreshRules: () => Promise<void>
  handleRuleSave: () => Promise<void>
  handleDebugToggle: () => Promise<void>
  getDomain: (url: string) => string
  getPath: (url: string) => string
  fetchResponseContent: (url: string) => Promise<void>
  handleResizerMouseDown: (e: React.MouseEvent) => void
  handleRuleResizerMouseDown: (e: React.MouseEvent) => void
  toggleSidebar: () => void
  handleNavItemClick: (id: string) => void
}

// 创建Context
export const AppContext = createContext<AppContextType | undefined>(undefined)

// 创建Provider组件
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // 状态管理
  const [requests, setRequests] = useState<RequestInfo[]>([])
  const [selectedRequest, setSelectedRequest] = useState<RequestInfo | null>(
    null
  )
  const [rules, setRules] = useState<Rule[]>([])
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
  const [newRule, setNewRule] = useState<Rule>({
    id: "",
    url: "",
    matchType: "exact",
    response: ""
  })
  // Toast组件引用
  const toast = useRef<any>(null)
  const [filterText, setFilterText] = useState<string>("")
  const [ruleFilterText, setRuleFilterText] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("headers")
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false)
  const [isToggling, setIsToggling] = useState<boolean>(false)
  const [activeView, setActiveView] = useState<string>("network")
  const [responseContent, setResponseContent] = useState<string>("")
  const [detailsHeight, setDetailsHeight] = useState<number>(300)
  const [ruleDetailsWidth, setRuleDetailsWidth] = useState<number>(400)
  const [showSidebar, setShowSidebar] = useState<boolean>(true)

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 获取当前标签页的请求
        const response = await sendToBackground({
          name: "getRequests"
        })
        console.log("response: ", response)
        // 确保response是一个数组才设置请求列表
        if (
          response !== undefined &&
          response !== null &&
          Array.isArray(response)
        ) {
          setRequests(response)
        } else {
          // 如果后台没有返回有效数据，则设置为空数组
          setRequests([])
        }

        // 获取存储的规则
        await refreshRules()

        // 获取调试状态
        const debugValue = await storage.get<boolean>("debugEnabled")
        setDebugEnabled(debugValue || false)

        // 将当前标签页 ID 保存到存储中，使当前标签页成为调试目标
        if (chrome.devtools?.inspectedWindow?.tabId) {
          const currentTabId = chrome.devtools.inspectedWindow.tabId
          console.log(`当前标签页 ID: ${currentTabId}`)
          await storage.set("inspectedTabId", currentTabId)
        }
      } catch (error) {
        console.error("初始化数据失败:", error)
      }
    }

    initializeData()

    // 监听 debugError 消息
    const handleDebugError = (message) => {
      if (message.name === "debugError" && message.body) {
        const { type, message: errorMessage } = message.body
        // 使用 Toast 显示错误信息
        toast.current?.show({
          severity: "error",
          summary: type === "connect" ? "连接失败" : "断开连接失败",
          detail: errorMessage,
          life: 5000
        })

        // 更新调试状态
        setDebugEnabled(false)
        setIsToggling(false)
      }
    }

    // 添加消息监听器
    chrome.runtime.onMessage.addListener(handleDebugError)

    // 当切换到响应标签时，尝试获取响应内容
    if (activeTab === "response" && selectedRequest) {
      fetchResponseContent(selectedRequest.url)
    }

    // 当 DevTools 面板关闭时自动关闭调试功能
    const handleBeforeUnload = () => {
      console.log("开发者工具面板关闭，自动关闭调试功能")
      storage.set("debugEnabled", false)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // 定时刷新请求列表
    const interval = setInterval(() => {
      sendToBackground({
        name: "getRequests"
      }).then((response: any) => {
        if (response) {
          setRequests(response)
        }
      })
    }, 5000)

    // 清理函数
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      // 移除消息监听器
      chrome.runtime.onMessage.removeListener(handleDebugError)
      clearInterval(interval)
    }
  }, [activeTab, selectedRequest])
  
  // 只在组件真正卸载时关闭调试功能的Effect
  useEffect(() => {
    return () => {
      // 组件真正卸载时关闭调试功能
      console.log("组件卸载，关闭调试功能")
      storage.set("debugEnabled", false)
    }
  }, [])

  // 处理清除请求
  const handleClearRequests = () => {
    sendToBackground({
      name: "clearRequests"
    }).then(() => {
      setRequests([])
      setSelectedRequest(null)
    })
  }

  // 处理清空规则
  const handleClearRules = async () => {
    await storage.set("rules", [])
    setRules([])
    setSelectedRule(null)
    console.log("已清空所有规则")
  }

  // 处理请求点击
  const handleRequestClick = (request: RequestInfo) => {
    setSelectedRequest(request)
    setActiveTab("headers")

    // 当选择请求时，预填充规则表单
    setNewRule({
      id: Date.now().toString(),
      url: request.url,
      matchType: "exact",
      response: ""
    })
  }

  // 处理详情面板关闭
  const handleDetailsClose = () => {
    setSelectedRequest(null)
  }

  // 从存储中获取最新的规则
  const refreshRules = async () => {
    try {
      const savedRules = await storage.get<Rule[]>("rules")
      if (savedRules) {
        setRules(savedRules)
      } else {
        setRules([])
      }
    } catch (error) {
      console.error("获取规则失败:", error)
    }
  }

  // 处理规则保存
  const handleRuleSave = async () => {
    try {
      // 验证规则
      if (!newRule.url.trim()) {
        alert("URL不能为空")
        return
      }

      let updatedRules: Rule[] = []

      if (selectedRule) {
        // 更新现有规则
        updatedRules = rules.map((rule) =>
          rule.id === selectedRule.id
            ? { ...newRule, id: selectedRule.id }
            : rule
        )
      } else {
        // 添加新规则
        const newRuleWithId = {
          ...newRule,
          id: Date.now().toString()
        }
        updatedRules = [...rules, newRuleWithId]
      }

      // 保存到存储
      await storage.set("rules", updatedRules)

      // 更新状态
      setRules(updatedRules)
      setSelectedRule(null)
      setActiveTab("")

      console.log("规则已保存:", newRule)
    } catch (error) {
      console.error("保存规则失败:", error)
    }
  }

  // 处理调试开关状态变化
  const handleDebugToggle = async () => {
    try {
      setIsToggling(true)

      const newDebugState = !debugEnabled
      console.log(`切换调试模式: ${newDebugState ? "开启" : "关闭"}`)

      // 更新存储中的调试状态
      await storage.set("debugEnabled", newDebugState)

      // 通知后台脚本调试状态已更改
      await sendToBackground({
        name: "setDebugEnabled",
        body: {
          enabled: newDebugState
        }
      } as any)

      // 更新状态
      setDebugEnabled(newDebugState)
      setIsToggling(false)

      console.log(`调试模式已${newDebugState ? "开启" : "关闭"}`)
    } catch (error) {
      console.error("切换调试模式失败:", error)
      setIsToggling(false)
    }
  }

  // 获取请求的域名
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (error) {
      return ""
    }
  }

  // 获取请求的路径
  const getPath = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    } catch (error) {
      return ""
    }
  }

  // 获取响应内容
  const fetchResponseContent = async (url: string) => {
    try {
      setResponseContent("正在获取响应内容...")

      // 检查是否有自定义响应
      if (
        selectedRequest &&
        selectedRequest.shouldIntercept &&
        selectedRequest.customResponse
      ) {
        console.log("使用自定义响应:", selectedRequest.customResponse)

        // 尝试解析为 JSON
        try {
          const jsonData = JSON.parse(selectedRequest.customResponse)
          const jsonString = JSON.stringify(jsonData, null, 2)
          setResponseContent(jsonString)

          // 更新请求信息
          if (selectedRequest) {
            selectedRequest.responseContent = jsonString
            selectedRequest.responseType = "json"
            selectedRequest.responseStatus = 200
            selectedRequest.responseStatusText = "OK"
            selectedRequest.responseTime = 0
          }

          return // 使用自定义响应后直接返回
        } catch (e) {
          // 如果不是 JSON，则直接使用文本
          setResponseContent(selectedRequest.customResponse)

          // 更新请求信息
          if (selectedRequest) {
            selectedRequest.responseContent = selectedRequest.customResponse
            selectedRequest.responseType = "text"
            selectedRequest.responseStatus = 200
            selectedRequest.responseStatusText = "OK"
            selectedRequest.responseTime = 0
          }

          return // 使用自定义响应后直接返回
        }
      }

      // 准备请求头
      let headers: { [key: string]: string } = {
        "X-Requested-With": "XMLHttpRequest"
      }

      // 如果有原始请求头，将其合并到请求中
      if (selectedRequest && selectedRequest.requestHeaders) {
        // 复制原始请求头，但过滤一些不应该复制的头
        const skipHeaders = [
          "host",
          "connection",
          "content-length",
          "origin",
          "referer",
          "sec-fetch-dest",
          "sec-fetch-mode",
          "sec-fetch-site"
        ]

        Object.entries(selectedRequest.requestHeaders).forEach(
          ([key, value]) => {
            const lowerKey = key.toLowerCase()
            if (!skipHeaders.includes(lowerKey)) {
              headers[key] = value
            }
          }
        )

        console.log("使用原始请求头:", headers)
      }

      // 尝试发送请求获取内容
      const response = await fetch(url, {
        method: selectedRequest?.method || "GET",
        headers: headers,
        // 如果需要发送凭证，比如 cookies
        credentials: "include"
      }).catch((error) => {
        console.error("请求失败:", error)
        throw new Error(`请求失败: ${error.message}`)
      })

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态: ${response.status}`)
      }

      // 尝试解析为 JSON
      try {
        const jsonData = await response.json()
        const jsonString = JSON.stringify(jsonData, null, 2)
        setResponseContent(jsonString)

        // 如果选中的请求存在，更新其响应内容
        if (selectedRequest) {
          selectedRequest.responseContent = jsonString
          selectedRequest.responseType = "json"
        }
      } catch (e) {
        // 如果不是 JSON，则获取文本内容
        const textData = await response.text()
        setResponseContent(textData)

        // 如果选中的请求存在，更新其响应内容
        if (selectedRequest) {
          selectedRequest.responseContent = textData
          selectedRequest.responseType = "text"
        }
      }
    } catch (error) {
      console.error("获取响应内容失败:", error)
      setResponseContent(
        `获取响应内容失败: ${error.message}\n\n请注意：由于浏览器的安全策略，直接获取跨域资源可能会失败。\n这是正常的安全限制，防止未经授权的跨站请求。`
      )
    }
  }

  // 处理请求详情面板的调整大小
  const handleResizerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startHeight = detailsHeight

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      const newHeight = Math.max(200, startHeight - deltaY)
      setDetailsHeight(newHeight)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // 处理规则详情面板的调整大小
  const handleRuleResizerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = ruleDetailsWidth

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX
      const newWidth = Math.max(300, startWidth + deltaX)
      setRuleDetailsWidth(newWidth)
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // 切换侧边栏显示状态
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  // 定义导航项
  const navItems = [
    // { id: "home", icon: <HomeIcon />, label: "首页" },
    { id: "network", icon: <NetworkIcon />, label: "网络" },
    { id: "rules", icon: <RulesIcon />, label: "规则" }
    // { id: "apis", icon: <ApiIcon />, label: "APIs", beta: true },
    // { id: "files", icon: <FilesIcon />, label: "文件" },
    // { id: "sessions", icon: <SessionsIcon />, label: "会话" }
  ]

  // 处理导航项点击
  const handleNavItemClick = (id: string) => {
    setActiveView(id)

    // 当切换到规则标签页时，刷新规则列表
    if (id === "rules") {
      refreshRules()
    }
  }

  // 过滤请求
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      return request.url.toLowerCase().includes(filterText.toLowerCase())
    })
  }, [requests, filterText])

  // 过滤规则
  const filteredRules = useMemo(() => {
    if (!ruleFilterText) return rules
    return rules.filter((rule) => {
      return rule.url.toLowerCase().includes(ruleFilterText.toLowerCase())
    })
  }, [rules, ruleFilterText])

  // 提供Context值
  const contextValue: AppContextType = {
    // 状态
    requests,
    selectedRequest,
    rules,
    selectedRule,
    newRule,
    filterText,
    ruleFilterText,
    activeTab,
    debugEnabled,
    isToggling,
    activeView,
    responseContent,
    detailsHeight,
    ruleDetailsWidth,
    showSidebar,
    filteredRequests,
    filteredRules,
    navItems,
    toast,

    // 状态设置方法
    setRequests,
    setSelectedRequest,
    setRules,
    setSelectedRule,
    setNewRule,
    setFilterText,
    setRuleFilterText,
    setActiveTab,
    setDebugEnabled,
    setIsToggling,
    setActiveView,
    setResponseContent,
    setDetailsHeight,
    setRuleDetailsWidth,
    setShowSidebar,

    // 业务逻辑方法
    handleClearRequests,
    handleClearRules,
    handleRequestClick,
    handleDetailsClose,
    refreshRules,
    handleRuleSave,
    handleDebugToggle,
    getDomain,
    getPath,
    fetchResponseContent,
    handleResizerMouseDown,
    handleRuleResizerMouseDown,
    toggleSidebar,
    handleNavItemClick
  }

  return (
    <AppContext.Provider value={contextValue}>
      <Toast ref={toast} position="top-right" />
      {children}
    </AppContext.Provider>
  )
}

// 创建自定义Hook，方便在组件中使用Context
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
