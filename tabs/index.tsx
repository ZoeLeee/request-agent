import { useEffect, useState } from "react"

import "./index.css"

import { sendToBackground } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"

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
  }, [])

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
  }

  const handleRuleSave = async () => {
    const updatedRules = [...rules]
    const existingRuleIndex = rules.findIndex((rule) => rule.id === newRule.id)
    if (existingRuleIndex >= 0) {
      updatedRules[existingRuleIndex] = newRule
    } else {
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
                <td className={`method method-${req.method}`}>{req.method}</td>
                <td className="status-success">200</td>
                <td>{req.type}</td>
                <td title={req.initiator || ""}>{req.initiator || "-"}</td>
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
                        <td>{selectedRequest.url}</td>
                      </tr>
                      <tr>
                        <th>请求方法</th>
                        <td>{selectedRequest.method}</td>
                      </tr>
                      <tr>
                        <th>状态码</th>
                        <td>200 OK</td>
                      </tr>
                      <tr>
                        <th>远程地址</th>
                        <td>{getDomain(selectedRequest.url)}</td>
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
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                    {/* 这里可以显示响应内容，目前使用占位符 */}
                    {"响应内容将显示在这里"}
                  </pre>
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
