import React from "react";
import type { RequestInfo, Rule } from "./types";

interface RequestDetailsProps {
  selectedRequest: RequestInfo;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  responseContent: string;
  fetchResponseContent: (url: string) => void;
  newRule: Rule;
  setNewRule: (rule: Rule) => void;
  handleRuleSave: () => void;
  getDomain: (url: string) => string;
  handleResizerMouseDown: (e: React.MouseEvent) => void;
  detailsHeight: number;
  onClose: () => void;
}

const RequestDetails: React.FC<RequestDetailsProps> = ({
  selectedRequest,
  activeTab,
  setActiveTab,
  responseContent,
  fetchResponseContent,
  newRule,
  setNewRule,
  handleRuleSave,
  getDomain,
  handleResizerMouseDown,
  detailsHeight,
  onClose
}) => {
  return (
    <div className="fixed right-0 top-0 w-1/2 h-full z-10">
      <div className="details-panel h-full">
        <div className="details-header">
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
          <button className="close-button" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className="details-content">
          {activeTab === "headers" && <HeadersTab selectedRequest={selectedRequest} getDomain={getDomain} />}
          {activeTab === "response" && <ResponseTab selectedRequest={selectedRequest} responseContent={responseContent} fetchResponseContent={fetchResponseContent} />}
          {activeTab === "timing" && <TimingTab selectedRequest={selectedRequest} />}
          {activeTab === "rule" && <RuleTab newRule={newRule} setNewRule={setNewRule} handleRuleSave={handleRuleSave} />}
        </div>
      </div>
    </div>
  );
};

// 标头标签页组件
const HeadersTab: React.FC<{ selectedRequest: RequestInfo; getDomain: (url: string) => string }> = ({ selectedRequest, getDomain }) => {
  return (
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
            <td>{selectedRequest.responseStatus || "200"} {selectedRequest.responseStatusText || "OK"}</td>
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
          {selectedRequest.responseHeaders ? (
            Object.entries(selectedRequest.responseHeaders).map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{typeof value === "string" ? value : JSON.stringify(value)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <th>content-type</th>
              <td>application/json</td>
            </tr>
          )}
        </tbody>
      </table>

      <h3>请求标头</h3>
      <table>
        <tbody>
          {selectedRequest.requestHeaders ? (
            Object.entries(selectedRequest.requestHeaders).map(([key, value]) => (
              <tr key={key}>
                <th>{key}</th>
                <td>{typeof value === "string" ? value : JSON.stringify(value)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <th>user-agent</th>
              <td>
                Mozilla/5.0 (Windows NT 10.0; Win64; x64)
                AppleWebKit/537.36 (KHTML, like Gecko)
                Chrome/91.0.4472.124 Safari/537.36
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

// 响应标签页组件
const ResponseTab: React.FC<{ 
  selectedRequest: RequestInfo; 
  responseContent: string; 
  fetchResponseContent: (url: string) => void 
}> = ({ 
  selectedRequest, 
  responseContent, 
  fetchResponseContent 
}) => {
  return (
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
  );
};

// 时间标签页组件
const TimingTab: React.FC<{ selectedRequest: RequestInfo }> = ({ selectedRequest }) => {
  return (
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
  );
};

// 规则标签页组件
const RuleTab: React.FC<{ 
  newRule: Rule; 
  setNewRule: (rule: Rule) => void; 
  handleRuleSave: () => void 
}> = ({ 
  newRule, 
  setNewRule, 
  handleRuleSave 
}) => {
  return (
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
  );
};

export default RequestDetails;
