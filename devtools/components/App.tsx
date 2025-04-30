import React, { useEffect, useState } from "react";
import { sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";

import type { RequestInfo, Rule } from "./types";
import Toolbar from "./Toolbar";
import RequestList from "./RequestList";
import RequestDetails from "./RequestDetails";
import VerticalNavbar from "./VerticalNavbar";
import { HomeIcon, NetworkIcon, RulesIcon, ApiIcon, FilesIcon, SessionsIcon } from "./icons";


// 创建存储实例
const storage = new Storage();

const App: React.FC = () => {
  // 状态管理
  const [requests, setRequests] = useState<RequestInfo[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<RequestInfo | null>(null);
  const [responseContent, setResponseContent] = useState<string>("");
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRule, setNewRule] = useState<Rule>({
    id: "",
    url: "",
    matchType: "exact",
    response: ""
  });
  const [filterText, setFilterText] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("headers");
  const [detailsHeight, setDetailsHeight] = useState<number>(300);
  const [debugEnabled, setDebugEnabled] = useState<boolean>(false);
  const [isToggling, setIsToggling] = useState<boolean>(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("network");
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  useEffect(() => {
    // 获取当前标签页的请求
    sendToBackground({
      name: "getRequests"
    }).then((response) => {
      console.log("response: ", response);
      setRequests(response);
    });

    // 当切换到响应标签时，尝试获取响应内容
    if (activeTab === "response" && selectedRequest) {
      fetchResponseContent(selectedRequest.url);
    }

    // 获取存储的规则
    storage.get<Rule[]>("rules").then((storedRules = []) => {
      setRules(storedRules);
    });
    
    // 获取调试状态
    storage.get<boolean>("debugEnabled").then((value) => {
      setDebugEnabled(value || false);
    });
    
    // 将当前标签页 ID 保存到存储中，使当前标签页成为调试目标
    if (chrome.devtools?.inspectedWindow?.tabId) {
      const currentTabId = chrome.devtools.inspectedWindow.tabId;
      console.log(`当前标签页 ID: ${currentTabId}`);
      storage.set("inspectedTabId", currentTabId);
    }
    
    // 当 DevTools 面板关闭时自动关闭调试功能
    const handleBeforeUnload = () => {
      console.log('开发者工具面板关闭，自动关闭调试功能');
      storage.set("debugEnabled", false);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 定时刷新请求列表
    const interval = setInterval(() => {
      sendToBackground({
        name: "getRequests"
      }).then((response) => {
        setRequests(response);
      });
    }, 5000);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 组件卸载时也关闭调试功能
      storage.set("debugEnabled", false);
      clearInterval(interval);
    };
  }, [activeTab, selectedRequest]);

  // 清除请求列表
  const handleClearRequests = async () => {
    await sendToBackground({ name: "clearRequests" });
    setRequests([]);
    setSelectedRequest(null);
  };

  // 处理请求点击
  const handleRequestClick = (request: RequestInfo) => {
    setSelectedRequest(request);
    setActiveTab("headers"); // 默认显示标头标签
    
    // 预设规则数据
    setNewRule({
      id: "",
      url: request.url,
      matchType: "exact",
      response: ""
    });
  };
  
  // 处理详情面板关闭
  const handleDetailsClose = () => {
    setSelectedRequest(null);
  };

  // 处理规则保存
  const handleRuleSave = async () => {
    if (!newRule.url || !newRule.response) {
      alert("URL 和响应内容不能为空");
      return;
    }

    // 获取现有规则
    const updatedRules = [...rules];
    
    // 检查是否存在相同 URL 和匹配类型的规则
    const existingRuleIndex = updatedRules.findIndex(
      (rule) => rule.id === newRule.id
    );

    if (existingRuleIndex >= 0) {
      // 替换现有规则，但保留原来的 ID
      updatedRules[existingRuleIndex] = {
        ...newRule,
        id: rules[existingRuleIndex].id
      };
    } else {
      // 添加新规则
      updatedRules.push({ ...newRule, id: Date.now().toString() });
    }

    await storage.set("rules", updatedRules);
    setRules(updatedRules);
    setNewRule({ id: "", url: "", matchType: "exact", response: "" });
    setSelectedRule(null);
  };
  
  // 处理调试开关状态变化
  const handleDebugToggle = async () => {
    // 如果正在切换中，则不允许再次切换
    if (isToggling) return;
    
    try {
      setIsToggling(true); // 设置切换状态为正在切换
      
      const newState = !debugEnabled;
      await storage.set("debugEnabled", newState);
      setDebugEnabled(newState);
      console.log(`调试模式已${newState ? '开启' : '关闭'}`);
      
      // 如果开启调试模式，确保当前标签页 ID 已设置
      if (newState && chrome.devtools?.inspectedWindow?.tabId) {
        const currentTabId = chrome.devtools.inspectedWindow.tabId;
        await storage.set("inspectedTabId", currentTabId);
        console.log(`已设置调试标签页 ID: ${currentTabId}`);
      }
    } catch (error) {
      console.error('切换调试模式失败:', error);
    } finally {
      // 添加延迟，确保切换有足够的时间完成
      setTimeout(() => {
        setIsToggling(false); // 切换完成，重置状态
      }, 1000); // 1秒的延迟
    }
  };

  // 过滤请求列表
  const filteredRequests = requests.filter((req) => {
    if (!filterText) return true;
    return (
      req.url.toLowerCase().includes(filterText.toLowerCase()) ||
      req.method.toLowerCase().includes(filterText.toLowerCase()) ||
      req.type.toLowerCase().includes(filterText.toLowerCase())
    );
  });

  // 获取请求的域名
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (e) {
      return url;
    }
  };

  // 获取请求的路径
  const getPath = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch (e) {
      return url;
    }
  };

  // 获取响应内容
  const fetchResponseContent = async (url: string) => {
    try {
      setResponseContent("正在获取响应内容...");

      // 检查是否有自定义响应
      if (
        selectedRequest &&
        selectedRequest.shouldIntercept &&
        selectedRequest.customResponse
      ) {
        console.log("使用自定义响应:", selectedRequest.customResponse);

        // 尝试解析为 JSON
        try {
          const jsonData = JSON.parse(selectedRequest.customResponse);
          const jsonString = JSON.stringify(jsonData, null, 2);
          setResponseContent(jsonString);

          // 更新请求信息
          if (selectedRequest) {
            selectedRequest.responseContent = jsonString;
            selectedRequest.responseType = "json";
            selectedRequest.responseStatus = 200;
            selectedRequest.responseStatusText = "OK";
            selectedRequest.responseTime = 0;
          }

          return; // 使用自定义响应后直接返回
        } catch (e) {
          // 如果不是 JSON，则直接使用文本
          setResponseContent(selectedRequest.customResponse);

          // 更新请求信息
          if (selectedRequest) {
            selectedRequest.responseContent = selectedRequest.customResponse;
            selectedRequest.responseType = "text";
            selectedRequest.responseStatus = 200;
            selectedRequest.responseStatusText = "OK";
            selectedRequest.responseTime = 0;
          }

          return; // 使用自定义响应后直接返回
        }
      }

      // 准备请求头
      let headers: { [key: string]: string } = {
        "X-Requested-With": "XMLHttpRequest"
      };

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
        ];

        Object.entries(selectedRequest.requestHeaders).forEach(
          ([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (!skipHeaders.includes(lowerKey)) {
              headers[key] = value;
            }
          }
        );

        console.log("使用原始请求头:", headers);
      }

      // 尝试发送请求获取内容
      const response = await fetch(url, {
        method: selectedRequest?.method || "GET",
        headers: headers,
        // 如果需要发送凭证，比如 cookies
        credentials: "include"
      }).catch((error) => {
        console.error("请求失败:", error);
        throw new Error(`请求失败: ${error.message}`);
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态: ${response.status}`);
      }

      // 尝试解析为 JSON
      try {
        const jsonData = await response.json();
        const jsonString = JSON.stringify(jsonData, null, 2);
        setResponseContent(jsonString);

        // 如果选中的请求存在，更新其响应内容
        if (selectedRequest) {
          selectedRequest.responseContent = jsonString;
          selectedRequest.responseType = "json";
        }
      } catch (e) {
        // 如果不是 JSON，则获取文本内容
        const textData = await response.text();
        setResponseContent(textData);

        // 如果选中的请求存在，更新其响应内容
        if (selectedRequest) {
          selectedRequest.responseContent = textData;
          selectedRequest.responseType = "text";
        }
      }
    } catch (error) {
      console.error("获取响应内容失败:", error);
      setResponseContent(
        `获取响应内容失败: ${error.message}\n\n请注意：由于浏览器的安全策略，直接获取跨域资源可能会失败。\n这是正常的安全限制，防止未经授权的跨站请求。`
      );
    }
  };

  // 处理拖动改变详情面板高度
  const handleResizerMouseDown = (e: React.MouseEvent) => {
    const startY = e.clientY;
    const startHeight = detailsHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = startHeight - (e.clientY - startY);
      if (newHeight > 100 && newHeight < window.innerHeight - 200) {
        setDetailsHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // 切换侧边栏显示状态
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // 定义导航项
  const navItems = [
    // { id: "home", icon: <HomeIcon />, label: "首页" },
    { id: "network", icon: <NetworkIcon />, label: "网络" },
    { id: "rules", icon: <RulesIcon />, label: "规则" },
    // { id: "apis", icon: <ApiIcon />, label: "APIs", beta: true },
    // { id: "files", icon: <FilesIcon />, label: "文件" },
    // { id: "sessions", icon: <SessionsIcon />, label: "会话" }
  ];

  // 处理导航项点击
  const handleNavItemClick = (id: string) => {
    setActiveSidebarTab(id);
  };

  return (
    <div className="app-container">
      {/* 垂直导航栏 */}
      <VerticalNavbar 
        items={navItems}
        activeItem={activeSidebarTab}
        onItemClick={handleNavItemClick}
      />
      
      {/* 内容区域 */}
      <div className="content-area">
        {/* 标题栏 */}
        <div className="content-header">
          <h1 className="content-title">
            {activeSidebarTab === "network" ? "网络" : 
             activeSidebarTab === "rules" ? "规则" : 
             activeSidebarTab === "home" ? "首页" : 
             activeSidebarTab === "apis" ? "APIs" : 
             activeSidebarTab === "files" ? "文件" : "会话"}
          </h1>
        </div>

        {/* 主内容 */}
        <div className="content-main">
          {activeSidebarTab === "network" && (
            <div className="network-view">
              <Toolbar 
                handleClearRequests={handleClearRequests}
                filterText={filterText}
                setFilterText={setFilterText}
                debugEnabled={debugEnabled}
                isToggling={isToggling}
                handleDebugToggle={handleDebugToggle}
              />
              
              <div className="network-container">
                <RequestList 
                  filteredRequests={filteredRequests}
                  selectedRequest={selectedRequest}
                  handleRequestClick={handleRequestClick}
                  getDomain={getDomain}
                  getPath={getPath}
                />
                
                {selectedRequest && (
                  <RequestDetails 
                    selectedRequest={selectedRequest}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    responseContent={responseContent}
                    fetchResponseContent={fetchResponseContent}
                    newRule={newRule}
                    setNewRule={setNewRule}
                    handleRuleSave={handleRuleSave}
                    getDomain={getDomain}
                    handleResizerMouseDown={handleResizerMouseDown}
                    detailsHeight={detailsHeight}
                    onClose={handleDetailsClose}
                  />
                )}
              </div>
            </div>
          )}

          {activeSidebarTab === "rules" && (
            <div className="rules-view">
              <div className="rules-container">
                <div className="rules-empty-state">
                  <div className="rules-icon-container">
                    <RulesIcon />
                  </div>
                  <p className="rules-empty-text">暂无规则</p>
                  <button className="new-rule-button" onClick={() => {
                    setNewRule({ id: "", url: "", matchType: "exact", response: "" });
                    setActiveTab("rule");
                  }}>
                    新建规则
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSidebarTab === "home" && (
            <div className="home-view">
              <div className="welcome-container">
                <h2>欢迎使用 Request Agent</h2>
                <p>这是一个用于拦截和修改网络请求的工具</p>
              </div>
            </div>
          )}

          {(activeSidebarTab === "apis" || activeSidebarTab === "files" || activeSidebarTab === "sessions") && (
            <div className="coming-soon-view">
              <div className="coming-soon-container">
                <h2>即将推出</h2>
                <p>此功能正在开发中，敬请期待</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
