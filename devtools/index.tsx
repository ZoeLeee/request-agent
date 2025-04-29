import { useEffect, useState } from "react"

import "./index.css"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

chrome.devtools.panels.create("Request Agent", null, "devtools.html")

const storage = new Storage()

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
  requestHeaders?: { [key: string]: string }
  // 响应相关字段
  responseStatus?: number
  responseStatusText?: string
  responseHeaders?: { [key: string]: string }
  responseContent?: string
  responseTime?: number
  responseSize?: number
  responseType?: string
  // 自定义响应字段
  shouldIntercept?: boolean
  customResponse?: string
}

interface Rule {
  id: string
  url: string
  matchType: "exact" | "contains" | "regex"
  response: string
}

function App() {
  const [requests, setRequests] = useState<RequestInfo[]>([])
  const [selectedRequest, setSelectedRequest] = useState<RequestInfo | null>(
    null
  )
  const [responseContent, setResponseContent] = useState<string>("") // 添加响应内容状态
  const [rules, setRules] = useState<Rule[]>([])
  const [newRule, setNewRule] = useState<Rule>({
    id: "",
    url: "",
    matchType: "exact",
    response: ""
  })
  const [filterText, setFilterText] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("headers")
  const [detailsHeight, setDetailsHeight] = useState<number>(300)

  useEffect(() => {
    // 获取当前标签页的请求
    sendToBackground({
      name: "getRequests"
    }).then((response) => {
      console.log("response: ", response)
      setRequests(response)
    })

    // 当切换到响应标签时，尝试获取响应内容
    if (activeTab === "response" && selectedRequest) {
      fetchResponseContent(selectedRequest.url)
    }

    // 获取存储的规则
    storage.get<Rule[]>("rules").then((storedRules = []) => {
      setRules(storedRules)
    })

    // 定时刷新请求列表
    const interval = setInterval(() => {
      sendToBackground({
        name: "getRequests"
      }).then((response) => {
        setRequests(response)
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [activeTab, selectedRequest])

  const handleClearRequests = async () => {
    await sendToBackground({ name: "clearRequests" } as any)
    setRequests([])
    setSelectedRequest(null)
  }

  const handleRequestClick = (request: RequestInfo) => {
    setSelectedRequest(request)
    setNewRule({
      id: "",
      url: request.url,
      matchType: "exact",
      response: ""
    })
    // 获取响应内容
    fetchResponseContent(request.url)
  }

  const handleRuleSave = async () => {
    const updatedRules = [...rules]

    // 首先检查是否有 ID 匹配
    let existingRuleIndex = rules.findIndex((rule) => rule.id === newRule.id)

    // 如果没有 ID 匹配，则检查 URL 和 matchType 是否相同
    if (existingRuleIndex < 0) {
      existingRuleIndex = rules.findIndex(
        (rule) =>
          rule.url === newRule.url && rule.matchType === newRule.matchType
      )
    }

    if (existingRuleIndex >= 0) {
      // 替换现有规则，但保留原来的 ID
      updatedRules[existingRuleIndex] = {
        ...newRule,
        id: rules[existingRuleIndex].id
      }
    } else {
      // 添加新规则
      updatedRules.push({ ...newRule, id: Date.now().toString() })
    }

    await storage.set("rules", updatedRules)
    setRules(updatedRules)
    setNewRule({ id: "", url: "", matchType: "exact", response: "" })
  }

  // 过滤请求列表
  const filteredRequests = requests.filter((req) => {
    if (!filterText) return true
    return (
      req.url.toLowerCase().includes(filterText.toLowerCase()) ||
      req.method.toLowerCase().includes(filterText.toLowerCase()) ||
      req.type.toLowerCase().includes(filterText.toLowerCase())
    )
  })

  // 获取请求的域名
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch (e) {
      return url
    }
  }

  // 获取请求的路径
  const getPath = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    } catch (e) {
      return url
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

  // 处理拖动改变详情面板高度
  const handleResizerMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY
    const startHeight = detailsHeight

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = startHeight - (e.clientY - startY)
      if (newHeight > 100 && newHeight < window.innerHeight - 200) {
        setDetailsHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div className="network-container">
      <div className="toolbar">
        <button onClick={handleClearRequests}>清除</button>
        <input
          type="text"
          className="filter-input"
          placeholder="筛选请求..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="network-table">
          <thead>
            <tr>
              <th style={{ width: "50px" }}>名称</th>
              <th style={{ width: "300px" }}>路径</th>
              <th style={{ width: "80px" }}>方法</th>
              <th style={{ width: "80px" }}>状态</th>
              <th style={{ width: "80px" }}>类型</th>
              <th style={{ width: "120px" }}>发起者</th>
              <th style={{ width: "100px" }}>时间</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((req) => (
              <tr
                key={req.id}
                onClick={() => handleRequestClick(req)}
                className={
                  selectedRequest && selectedRequest.id === req.id
                    ? "selected"
                    : ""
                }>
                <td title={getDomain(req.url)}>{getDomain(req.url)}</td>
                <td title={getPath(req.url)}>{getPath(req.url)}</td>
                <td className={`method method-${String(req.method)}`}>
                  {String(req.method)}
                </td>
                <td className="status-success">200</td>
                <td>
                  {typeof req.type === "string" ? req.type : String(req.type)}
                </td>
                <td title={req.initiator ? String(req.initiator) : ""}>
                  {req.initiator ? String(req.initiator) : "-"}
                </td>
                <td>{new Date(req.timeStamp).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedRequest && (
        <div className="fixed right-0 top-0 w-1/2 h-full">
          <div className="resizer" onMouseDown={handleResizerMouseDown}></div>
          <div className="details-panel h-full">
            <div className="details-tabs">
              <div
                className={`details-tab ${activeTab === "headers" ? "active" : ""}`}
                onClick={() => setActiveTab("headers")}>
                标头
              </div>
              <div
                className={`details-tab ${activeTab === "response" ? "active" : ""}`}
                onClick={() => setActiveTab("response")}>
                响应
              </div>
              <div
                className={`details-tab ${activeTab === "timing" ? "active" : ""}`}
                onClick={() => setActiveTab("timing")}>
                时间
              </div>
              <div
                className={`details-tab ${activeTab === "rule" ? "active" : ""}`}
                onClick={() => setActiveTab("rule")}>
                规则编辑
              </div>
            </div>

            <div className="details-content">
              {activeTab === "headers" && (
                <div>
                  <h3>常规</h3>
                  <table>
                    <tbody>
                      <tr>
                        <th>请求 URL</th>
                        <td>
                          {typeof selectedRequest.url === "string"
                            ? selectedRequest.url
                            : String(selectedRequest.url)}
                        </td>
                      </tr>
                      <tr>
                        <th>请求方法</th>
                        <td>
                          {typeof selectedRequest.method === "string"
                            ? selectedRequest.method
                            : String(selectedRequest.method)}
                        </td>
                      </tr>
                      <tr>
                        <th>状态码</th>
                        <td>200 OK</td>
                      </tr>
                      <tr>
                        <th>远程地址</th>
                        <td>{getDomain(String(selectedRequest.url))}</td>
                      </tr>
                      <tr>
                        <th>引用者策略</th>
                        <td>strict-origin-when-cross-origin</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3>响应标头</h3>
                  <table>
                    <tbody>
                      <tr>
                        <th>content-type</th>
                        <td>application/json</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3>请求标头</h3>
                  <table>
                    <tbody>
                      <tr>
                        <th>user-agent</th>
                        <td>
                          Mozilla/5.0 (Windows NT 10.0; Win64; x64)
                          AppleWebKit/537.36 (KHTML, like Gecko)
                          Chrome/91.0.4472.124 Safari/537.36
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "response" && (
                <div>
                  {selectedRequest && selectedRequest.responseStatus ? (
                    <div>
                      <div style={{ marginBottom: "10px" }}>
                        <strong>状态码:</strong>{" "}
                        {String(selectedRequest.responseStatus)}{" "}
                        {selectedRequest.responseStatusText
                          ? String(selectedRequest.responseStatusText)
                          : ""}
                      </div>
                      {selectedRequest.responseHeaders && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>响应头:</strong>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse"
                            }}>
                            <tbody>
                              {Object.entries(
                                selectedRequest.responseHeaders
                              ).map(([key, value]) => (
                                <tr key={key}>
                                  <td
                                    style={{
                                      padding: "2px 8px",
                                      borderBottom: "1px solid #eee",
                                      fontWeight: "bold"
                                    }}>
                                    {key}
                                  </td>
                                  <td
                                    style={{
                                      padding: "2px 8px",
                                      borderBottom: "1px solid #eee"
                                    }}>
                                    {typeof value === "string"
                                      ? value
                                      : JSON.stringify(value)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {selectedRequest.responseSize && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>响应大小:</strong>{" "}
                          {typeof selectedRequest.responseSize === "number"
                            ? (selectedRequest.responseSize / 1024).toFixed(2)
                            : "0"}{" "}
                          KB
                        </div>
                      )}
                      {selectedRequest.responseTime && (
                        <div style={{ marginBottom: "10px" }}>
                          <strong>响应时间:</strong>{" "}
                          {typeof selectedRequest.responseTime === "number"
                            ? selectedRequest.responseTime.toFixed(2)
                            : String(selectedRequest.responseTime)}{" "}
                          ms
                        </div>
                      )}
                      {selectedRequest.responseContent ? (
                        <div>
                          <strong>响应内容:</strong>
                          <pre
                            style={{
                              margin: "10px 0",
                              padding: "10px",
                              backgroundColor: "#f5f5f5",
                              borderRadius: "3px",
                              whiteSpace: "pre-wrap",
                              maxHeight: "300px",
                              overflow: "auto"
                            }}>
                            {typeof selectedRequest.responseContent === "string"
                              ? selectedRequest.responseContent
                              : JSON.stringify(
                                  selectedRequest.responseContent,
                                  null,
                                  2
                                )}
                          </pre>
                        </div>
                      ) : (
                        <div>
                          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                            {responseContent ? (
                              responseContent
                            ) : (
                              <div style={{ color: "#888" }}>
                                {selectedRequest.responseType === "image"
                                  ? "图片内容无法直接显示"
                                  : "由于浏览器安全限制，无法直接获取响应体内容。可以尝试重新获取。"}
                                <button
                                  onClick={() =>
                                    fetchResponseContent(selectedRequest.url)
                                  }
                                  style={{
                                    marginLeft: "10px",
                                    padding: "2px 8px",
                                    backgroundColor: "#4285f4",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    fontSize: "12px"
                                  }}>
                                  尝试获取内容
                                </button>
                              </div>
                            )}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                        {responseContent ? (
                          responseContent
                        ) : (
                          <div style={{ color: "#888" }}>
                            暂无响应信息。可能是请求尚未完成，或者浏览器限制了访问。
                            {selectedRequest && (
                              <button
                                onClick={() =>
                                  fetchResponseContent(selectedRequest.url)
                                }
                                style={{
                                  marginLeft: "10px",
                                  padding: "2px 8px",
                                  backgroundColor: "#4285f4",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "3px",
                                  cursor: "pointer",
                                  fontSize: "12px"
                                }}>
                                尝试获取内容
                              </button>
                            )}
                          </div>
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "timing" && (
                <div>
                  <div className="timeline-container">
                    <div
                      className="timeline-bar"
                      style={{ width: "60%", left: "10%" }}></div>
                  </div>
                  <table>
                    <tbody>
                      <tr>
                        <th>开始时间</th>
                        <td>
                          {new Date(selectedRequest.timeStamp).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "rule" && (
                <div>
                  <h3>编辑拦截规则</h3>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>
                      URL 模式:
                    </label>
                    <input
                      type="text"
                      style={{ width: "100%", padding: "5px" }}
                      value={newRule.url}
                      onChange={(e) =>
                        setNewRule({ ...newRule, url: e.target.value })
                      }
                    />
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>
                      匹配类型:
                    </label>
                    <select
                      style={{ width: "100%", padding: "5px" }}
                      value={newRule.matchType}
                      onChange={(e) =>
                        setNewRule({
                          ...newRule,
                          matchType: e.target.value as
                            | "exact"
                            | "contains"
                            | "regex"
                        })
                      }>
                      <option value="exact">精确匹配</option>
                      <option value="contains">包含</option>
                      <option value="regex">正则表达式</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>
                      自定义响应 (JSON):
                    </label>
                    <textarea
                      style={{
                        width: "100%",
                        height: "100px",
                        padding: "5px"
                      }}
                      value={newRule.response}
                      onChange={(e) =>
                        setNewRule({ ...newRule, response: e.target.value })
                      }
                    />
                  </div>
                  <button
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#4285f4",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                    onClick={handleRuleSave}>
                    保存规则
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
