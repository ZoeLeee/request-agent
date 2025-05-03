import React from "react";
import type { RequestInfo, Rule } from "./types";
import { Sidebar } from "primereact/sidebar";
import { TabView, TabPanel } from "primereact/tabview";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";

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
  // No longer needed with Sidebar component
  // handleResizerMouseDown: (e: React.MouseEvent) => void;
  // detailsHeight: number;
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
  onClose
}) => {
  // Convert string tab names to numeric index for TabView
  const getActiveIndex = () => {
    switch(activeTab) {
      case "headers": return 0;
      case "response": return 1;
      case "rule": return 2;
      default: return 0;
    }
  };
  
  // Handle TabView index change and convert to string tab names
  const handleTabChange = (e: { index: number }) => {
    switch(e.index) {
      case 0: setActiveTab("headers"); break;
      case 1: setActiveTab("response"); break;
      case 2: setActiveTab("rule"); break;
    }
  };
  return (
    <Sidebar 
      visible={true} 
      position="right" 
      onHide={onClose}
      header="请求详情"
      className="w-1/2 md:w-30rem"
      blockScroll
    >
      <TabView 
        activeIndex={getActiveIndex()} 
        onTabChange={handleTabChange}
        className="request-details-tabs"
      >
        <TabPanel header="标头">
          <HeadersTab selectedRequest={selectedRequest} getDomain={getDomain} />
        </TabPanel>
        <TabPanel header="响应">
          <ResponseTab selectedRequest={selectedRequest} responseContent={responseContent} fetchResponseContent={fetchResponseContent} />
        </TabPanel>
        <TabPanel header="规则编辑">
          <RuleTab newRule={newRule} setNewRule={setNewRule} handleRuleSave={handleRuleSave} />
        </TabPanel>
      </TabView>
    </Sidebar>
  );
};

// Headers tab component
const HeadersTab: React.FC<{ selectedRequest: RequestInfo; getDomain: (url: string) => string }> = ({ selectedRequest, getDomain }) => {
  return (
    <div className="p-2">
      <h3 className="text-lg font-semibold mb-2">常规</h3>
      <div className="border rounded-md mb-4 overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b">
              <th className="p-2 bg-gray-50 text-left font-medium w-1/3">请求 URL</th>
              <td className="p-2 break-all">
                {typeof selectedRequest.url === "string"
                  ? selectedRequest.url
                  : String(selectedRequest.url)}
              </td>
            </tr>
            <tr className="border-b">
              <th className="p-2 bg-gray-50 text-left font-medium">请求方法</th>
              <td className="p-2">
                {typeof selectedRequest.method === "string"
                  ? selectedRequest.method
                  : String(selectedRequest.method)}
              </td>
            </tr>
            <tr className="border-b">
              <th className="p-2 bg-gray-50 text-left font-medium">状态码</th>
              <td className="p-2">{selectedRequest.responseStatus || "200"} {selectedRequest.responseStatusText || "OK"}</td>
            </tr>
            <tr className="border-b">
              <th className="p-2 bg-gray-50 text-left font-medium">远程地址</th>
              <td className="p-2">{getDomain(String(selectedRequest.url))}</td>
            </tr>
            <tr>
              <th className="p-2 bg-gray-50 text-left font-medium">引用者策略</th>
              <td className="p-2">strict-origin-when-cross-origin</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mb-2">响应标头</h3>
      <div className="border rounded-md mb-4 overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            {selectedRequest.responseHeaders ? (
              Object.entries(selectedRequest.responseHeaders).map(([key, value], index, array) => (
                <tr key={key} className={index < array.length - 1 ? "border-b" : ""}>
                  <th className="p-2 bg-gray-50 text-left font-medium w-1/3">{key}</th>
                  <td className="p-2 break-all">{typeof value === "string" ? value : JSON.stringify(value)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <th className="p-2 bg-gray-50 text-left font-medium w-1/3">content-type</th>
                <td className="p-2">application/json</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
    <div className="p-2">
      <h3 className="text-lg font-semibold mb-2">常规</h3>
      <div className="border rounded-md mb-4 overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b">
              <th className="p-2 bg-gray-50 text-left font-medium w-1/3">请求 URL</th>
              <td className="p-2 break-all">
                {typeof selectedRequest.url === "string"
                  ? selectedRequest.url
                  : String(selectedRequest.url)}
              </td>
            </tr>
            <tr className="border-b">
              <th className="p-2 bg-gray-50 text-left font-medium">请求方法</th>
              <td className="p-2">
                {typeof selectedRequest.method === "string"
                  ? selectedRequest.method
                  : String(selectedRequest.method)}
              </td>
            </tr>
            {selectedRequest.responseTime && (
              <tr>
                <th className="p-2 bg-gray-50 text-left font-medium">响应时间</th>
                <td className="p-2">
                  {typeof selectedRequest.responseTime === "number"
                    ? selectedRequest.responseTime.toFixed(2)
                    : String(selectedRequest.responseTime)} ms
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mb-2">响应头</h3>
      <div className="border rounded-md mb-4 overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            {selectedRequest.responseHeaders ? (
              Object.entries(selectedRequest.responseHeaders).map(([key, value], index, array) => (
                <tr key={key} className={index < array.length - 1 ? "border-b" : ""}>
                  <th className="p-2 bg-gray-50 text-left font-medium w-1/3">{key}</th>
                  <td className="p-2 break-all">{typeof value === "string" ? value : JSON.stringify(value)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <th className="p-2 bg-gray-50 text-left font-medium w-1/3">content-type</th>
                <td className="p-2">application/json</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-semibold mb-2">响应内容</h3>
      {selectedRequest.responseContent ? (
        <pre className="bg-gray-50 p-3 rounded-md overflow-auto max-h-60 text-sm">
          {typeof selectedRequest.responseContent === "string"
            ? selectedRequest.responseContent
            : JSON.stringify(selectedRequest.responseContent, null, 2)}
        </pre>
      ) : (
        <div className="border rounded-md p-4">
          {responseContent ? (
            <pre className="bg-gray-50 p-3 rounded-md overflow-auto max-h-60 text-sm">{responseContent}</pre>
          ) : (
            <div className="text-center py-4">
              <p className="mb-3 text-gray-600">
                {selectedRequest.responseType === "image"
                  ? "图片内容无法直接显示"
                  : "由于浏览器安全限制，无法直接获取响应体内容。"}
              </p>
              <Button
                label="尝试获取内容"
                onClick={() => fetchResponseContent(selectedRequest.url)}
                className="p-button-outlined"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};



// Rule tab component
const RuleTab: React.FC<{ 
  newRule: Rule; 
  setNewRule: (rule: Rule) => void; 
  handleRuleSave: () => void 
}> = ({ 
  newRule, 
  setNewRule, 
  handleRuleSave 
}) => {
  // Match type options for dropdown
  const matchTypeOptions = [
    { label: '精确匹配', value: 'exact' },
    { label: '包含', value: 'contains' },
    { label: '正则表达式', value: 'regex' }
  ];

  return (
    <div className="p-2">
      <h3 className="text-lg font-semibold mb-3">编辑拦截规则</h3>
      
      <div className="field mb-4">
        <label htmlFor="rule-url" className="block text-sm font-medium mb-2">
          URL 模式:
        </label>
        <InputText
          id="rule-url"
          className="w-full"
          value={newRule.url}
          onChange={(e) => setNewRule({ ...newRule, url: e.target.value })}
        />
      </div>
      
      <div className="field mb-4">
        <label htmlFor="match-type" className="block text-sm font-medium mb-2">
          匹配类型:
        </label>
        <Dropdown
          id="match-type"
          className="w-full"
          value={newRule.matchType}
          options={matchTypeOptions}
          onChange={(e) => setNewRule({ ...newRule, matchType: e.value })}
        />
      </div>
      
      <div className="field mb-4">
        <label htmlFor="response-content" className="block text-sm font-medium mb-2">
          自定义响应 (JSON):
        </label>
        <InputTextarea
          id="response-content"
          rows={6}
          className="w-full"
          value={newRule.response}
          onChange={(e) => setNewRule({ ...newRule, response: e.target.value })}
          autoResize
        />
      </div>
      
      <div className="flex justify-end">
        <Button
          label="保存规则"
          icon="pi pi-save"
          className="p-button-success"
          onClick={handleRuleSave}
        />
      </div>
    </div>
  );
};

export default RequestDetails;
