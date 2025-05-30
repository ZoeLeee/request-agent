import { useEffect, useState } from "react"

import { sendToBackground } from "@plasmohq/messaging"
import { DefaultStorage } from "~utils/storage"

const storage = DefaultStorage

interface RequestInfo {
  id: string
  url: string
  method: string
  timeStamp: number
}

interface Rule {
  id: string
  url: string
  matchType: "exact" | "contains" | "regex"
  response: string
}

function Popup() {
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

  useEffect(() => {
    // 获取当前标签页的请求
    chrome.runtime.sendMessage({ name: "getRequests" }, (response) => {
      setRequests(response)
    })

    // 获取存储的规则
    storage.get<Rule[]>("rules").then((storedRules = []) => {
      setRules(storedRules)
    })

    // 打开新窗口
    chrome.windows.create({
      url: chrome.runtime.getURL("tabs/index.html"),
      type: "popup",
      width: 800,
      height: 600
    })
  }, [])

  const handleClearRequests = async () => {
    await sendToBackground({ name: "clearRequests" } as any)
    setRequests([])
  }

  const handleRequestClick = (request: RequestInfo) => {
    setSelectedRequest(request)
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

  return (
    <div style={{ padding: 16, width: 400 }}>
      <h1>Request Interceptor</h1>
      <button onClick={handleClearRequests}>Clear Requests</button>
      <h2>Requests</h2>
      <ul>
        {requests.map((req) => (
          <li
            key={req.id}
            onClick={() => handleRequestClick(req)}
            style={{ cursor: "pointer" }}>
            {req.method} {req.url}
          </li>
        ))}
      </ul>
      {selectedRequest && (
        <div>
          <h2>Request Details</h2>
          <p>URL: {selectedRequest.url}</p>
          <p>Method: {selectedRequest.method}</p>
          <p>
            Timestamp: {new Date(selectedRequest.timeStamp).toLocaleString()}
          </p>
          <h3>Edit Rule</h3>
          <div>
            <label>URL Pattern:</label>
            <input
              type="text"
              value={newRule.url}
              onChange={(e) => setNewRule({ ...newRule, url: e.target.value })}
            />
          </div>
          <div>
            <label>Match Type:</label>
            <select
              value={newRule.matchType}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  matchType: e.target.value as "exact" | "contains" | "regex"
                })
              }>
              <option value="exact">Exact</option>
              <option value="contains">Contains</option>
              <option value="regex">Regex</option>
            </select>
          </div>
          <div>
            <label>Custom Response (JSON):</label>
            <textarea
              value={newRule.response}
              onChange={(e) =>
                setNewRule({ ...newRule, response: e.target.value })
              }
            />
          </div>
          <button onClick={handleRuleSave}>Save Rule</button>
        </div>
      )}
    </div>
  )
}


export default Popup