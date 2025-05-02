import React from "react";
import { useAppContext } from "../context/AppContext";

import Toolbar from "./Toolbar";
import RequestList from "./RequestList";
import RequestDetails from "./RequestDetails";
import VerticalNavbar from "./VerticalNavbar";
import RuleList from "./RuleList";
import RuleDetails from "./RuleDetails";

const App: React.FC = () => {
  // 使用 AppContext 获取所有状态和方法
  const {
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
    
    setNewRule,
    setActiveTab,
    setSelectedRule,
    
    handleClearRequests,
    handleClearRules,
    handleRequestClick,
    handleDetailsClose,
    handleRuleSave,
    handleDebugToggle,
    getDomain,
    getPath,
    fetchResponseContent,
    handleResizerMouseDown,
    handleRuleResizerMouseDown,
    handleNavItemClick,
    setFilterText,
    setRuleFilterText
  } = useAppContext();



  return (
    <div className="app-container">
      {/* 垂直导航栏 */}
      <VerticalNavbar 
        items={navItems}
        activeItem={activeView}
        onItemClick={handleNavItemClick}
      />
      
      {/* 内容区域 */}
      <div className="content-area">
        <div className="content-main">
          {activeView === "network" && (
            <div className="network-view">
              <Toolbar
                handleClearRequests={handleClearRequests}
                handleClearRules={handleClearRules}
                filterText={filterText}
                setFilterText={setFilterText}
                debugEnabled={debugEnabled}
                isToggling={isToggling}
                handleDebugToggle={handleDebugToggle}
                showRulesClear={false}
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

          {activeView === "rules" && (
            <div className="rules-view">
              <Toolbar
                handleClearRequests={handleClearRequests}
                handleClearRules={handleClearRules}
                filterText={ruleFilterText}
                setFilterText={setRuleFilterText}
                debugEnabled={debugEnabled}
                isToggling={isToggling}
                handleDebugToggle={handleDebugToggle}
                showRulesClear={true}
                onNewRule={() => {
                  setNewRule({ id: "", url: "", matchType: "exact", response: "" });
                  setActiveTab("rule");
                }}
              />
              
              <div className="rules-container">
                <RuleList 
                  rules={filteredRules}
                  selectedRule={selectedRule}
                  onRuleSelect={(rule) => {
                    setSelectedRule(rule);
                    setNewRule(rule);
                    setActiveTab("rule");
                  }}
                  onNewRule={() => {
                    setNewRule({ id: "", url: "", matchType: "exact", response: "" });
                    setActiveTab("rule");
                  }}
                />
                
                {selectedRule && activeTab === "rule" && (
                  <RuleDetails
                    selectedRule={selectedRule}
                    newRule={newRule}
                    setNewRule={setNewRule}
                    handleRuleSave={handleRuleSave}
                    onClose={() => {
                      setSelectedRule(null);
                      setActiveTab("");
                    }}
                    handleResizerMouseDown={handleRuleResizerMouseDown}
                    detailsWidth={ruleDetailsWidth}
                  />
                )}
              </div>
            </div>
          )}

          {activeView === "home" && (
            <div className="home-view">
              <div className="welcome-container">
                <h2>欢迎使用 Request Agent</h2>
                <p>这是一个用于拦截和修改网络请求的工具</p>
              </div>
            </div>
          )}

          {(activeView === "apis" || activeView === "files" || activeView === "sessions") && (
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
