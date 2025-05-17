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

import type { RequestInfo, Rule } from "~types"
import { DefaultStorage } from "~utils/storage"

import {
  ApiIcon,
  FilesIcon,
  HomeIcon,
  NetworkIcon,
  RulesIcon,
  SessionsIcon
} from "../components/icons"

const storage = DefaultStorage

// Define Context type
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

  // Methods
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

// Create Context
export const AppContext = createContext<AppContextType | undefined>(undefined)

// Create Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  // State management
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
  // Toast component reference
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

  // Initialize data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get requests for current tab
        const response = await sendToBackground({
          name: "getRequests",
          body: {
            currentTabId: chrome.devtools?.inspectedWindow?.tabId || 0
          }
        })
        console.log("response: ", response)
        // Only set request list if response is an array
        if (
          response !== undefined &&
          response !== null &&
          Array.isArray(response)
        ) {
          setRequests(response)
        } else {
          // If backend doesn't return valid data, set to empty array
          setRequests([])
        }

        // Get stored rules
        await refreshRules()

        // Get debug status
        const debugValue = await storage.get<boolean>("debugEnabled")
        setDebugEnabled(debugValue || false)
      } catch (error) {
        console.error("Failed to initialize data:", error)
      }
    }

    initializeData()

    // Listen for debugError message
    const handleDebugError = (message) => {
      if (message.name === "debugError" && message.body) {
        const { type, message: errorMessage } = message.body
        // Use Toast to display error message
        toast.current?.show({
          severity: "error",
          summary: "Error",
          detail: errorMessage,
          life: 5000
        })

        // Update debug status
        setDebugEnabled(false)
        setIsToggling(false)
      }
    }

    // Add message listener
    chrome.runtime.onMessage.addListener(handleDebugError)

    // When switching to response tab, try to get response content
    if (activeTab === "response" && selectedRequest) {
      fetchResponseContent(selectedRequest.url)
    }

    // Automatically turn off debugging when DevTools panel is closed
    const handleBeforeUnload = () => {
      console.log("DevTools panel closed, automatically turning off debug mode")
      storage.set("debugEnabled", false)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Refresh request list periodically
    const interval = setInterval(() => {
      sendToBackground({
        name: "getRequests",
        body: {
          currentTabId: chrome.devtools?.inspectedWindow?.tabId || 0
        }
      }).then((response: any) => {
        if (response) {
          setRequests(response)
        }
      })
    }, 3000)

    // Cleanup function
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      // Remove message listener
      chrome.runtime.onMessage.removeListener(handleDebugError)
      clearInterval(interval)
    }
  }, [activeTab, selectedRequest])

  // Effect to close debug mode only when component is actually unmounted
  useEffect(() => {
    return () => {
      // Turn off debugging when component is actually unmounted
      console.log("Component unmounted, turning off debugging")
      storage.set("debugEnabled", false)
    }
  }, [])

  // Handle clear requests
  const handleClearRequests = () => {
    sendToBackground({
      name: "clearRequests",
      body: {
        currentTabId: chrome.devtools?.inspectedWindow?.tabId || 0
      }
    }).then(() => {
      setRequests([])
      setSelectedRequest(null)
    })
  }

  // Handle clear rules
  const handleClearRules = async () => {
    await storage.set("rules", [])
    setRules([])
    setSelectedRule(null)
    console.log("All rules cleared")
  }

  // Handle request click
  const handleRequestClick = (request: RequestInfo) => {
    setSelectedRequest(request)
    setActiveTab("headers")

    // When selecting a request, prefill rule form
    setNewRule({
      id: Date.now().toString(),
      url: request.url,
      matchType: "exact",
      response: ""
    })
  }

  // Handle details panel close
  const handleDetailsClose = () => {
    setSelectedRequest(null)
  }

  // Get the latest rules from storage
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

  // Handle rule save
  const handleRuleSave = async () => {
    try {
      // Validate rule
      if (!newRule.url.trim()) {
        alert("URL cannot be empty")
        return
      }

      let updatedRules: Rule[] = []
      // Find existing rule with same URL and match type
      const existingRuleIndex = rules.findIndex(
        (rule) =>
          rule.url === newRule.url && rule.matchType === newRule.matchType
      )

      if (selectedRule) {
        // Clear selected rule
        updatedRules = rules.map((rule) =>
          rule.id === selectedRule.id
            ? { ...newRule, id: selectedRule.id }
            : rule
        )
      } else if (existingRuleIndex !== -1) {
        // If found rule with same URL and match type, update it
        updatedRules = rules.map((rule, index) =>
          index === existingRuleIndex ? { ...newRule, id: rule.id } : rule
        )
      } else {
        // Add new rule
        const newRuleWithId = {
          ...newRule,
          id: Date.now().toString()
        }
        updatedRules = [...rules, newRuleWithId]
      }

      // Save to storage
      await storage.set("rules", updatedRules)

      // 更新状态
      setRules(updatedRules)
      setSelectedRule(null)
      setActiveTab("")

      console.log("Rule saved:", newRule)
    } catch (error) {
      console.error("Failed to save rule:", error)
    }
  }

  // Handle debug toggle state change
  const handleDebugToggle = async () => {
    try {
      setIsToggling(true)

      const newDebugState = !debugEnabled
      console.log(`Toggle debug mode: ${newDebugState ? "On" : "Off"}`)

      // Notify background script that debug state has changed
      await sendToBackground({
        name: "setDebugEnabled",
        body: {
          targetId: chrome.devtools.inspectedWindow.tabId,
          state: newDebugState
        }
      } as any)

      // Update debug state in storage
      await storage.set("debugEnabled", newDebugState)

      // 更新状态
      setDebugEnabled(newDebugState)
      setIsToggling(false)

      console.log(`Debug mode is now ${newDebugState ? "enabled" : "disabled"}`)
    } catch (error) {
      console.error("Failed to toggle debug mode:", error)
      setIsToggling(false)
    }
  }

  // Get the domain of the request
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (error) {
      return ""
    }
  }

  // Get the path of the request
  const getPath = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    } catch (error) {
      return ""
    }
  }

  // Get response content
  const fetchResponseContent = async (url: string) => {
    try {
      setResponseContent("Getting response content...")

      // Check if there is a custom response
      if (
        selectedRequest &&
        selectedRequest.shouldIntercept &&
        selectedRequest.customResponse
      ) {
        console.log("Using custom response:", selectedRequest.customResponse)

        // Try to parse as JSON
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
          // If not JSON, use text directly
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

      // Prepare request headers
      let headers: { [key: string]: string } = {
        "X-Requested-With": "XMLHttpRequest"
      }

      // If there are original request headers, merge them into the request
      if (selectedRequest && selectedRequest.requestHeaders) {
        // Copy original request headers, but filter out some that shouldn't be copied
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

        console.log("Using original request headers:", headers)
      }

      // Try to send request to get content
      const response = await fetch(url, {
        method: selectedRequest?.method || "GET",
        headers: headers,
        // If credentials need to be sent, such as cookies
        credentials: "include"
      }).catch((error) => {
        console.error("Request failed:", error)
        throw new Error(`Request failed: ${error.message}`)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
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
        // If not JSON, get text content
        const textData = await response.text()
        setResponseContent(textData)

        // 如果选中的请求存在，更新其响应内容
        if (selectedRequest) {
          selectedRequest.responseContent = textData
          selectedRequest.responseType = "text"
        }
      }
    } catch (error) {
      console.error("Failed to get response content:", error)
      setResponseContent(
        `Failed to get response content: ${error.message}\n\nNote: Due to browser security policies, directly accessing cross-origin resources may fail.\nThis is a normal security restriction to prevent unauthorized cross-site requests.`
      )
    }
  }

  // Handle request details panel resize
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

  // Handle rule details panel resize
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

  // Toggle sidebar display state
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar)
  }

  // Define navigation items
  const navItems = [
    // { id: "home", icon: <HomeIcon />, label: "Home" },
    { id: "network", icon: <NetworkIcon />, label: "Network" },
    { id: "rules", icon: <RulesIcon />, label: "Rules" }
    // { id: "apis", icon: <ApiIcon />, label: "APIs", beta: true },
    // { id: "files", icon: <FilesIcon />, label: "Files" },
    // { id: "sessions", icon: <SessionsIcon />, label: "Sessions" }
  ]

  // Handle navigation item click
  const handleNavItemClick = (id: string) => {
    setActiveView(id)

    // Refresh rule list when switching to rules tab
    if (id === "rules") {
      refreshRules()
    }
  }

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      return request.url.toLowerCase().includes(filterText.toLowerCase())
    })
  }, [requests, filterText])

  // Filter rules
  const filteredRules = useMemo(() => {
    if (!ruleFilterText) return rules
    return rules.filter((rule) => {
      return rule.url.toLowerCase().includes(ruleFilterText.toLowerCase())
    })
  }, [rules, ruleFilterText])

  // Provide Context value
  const contextValue: AppContextType = {
    // States
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

    // State setter methods
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

    // Business logic methods
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

// Create custom Hook for easy use of Context in components
export const useAppContext = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
