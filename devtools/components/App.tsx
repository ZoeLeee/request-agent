import React from "react";
import { useAppContext } from "../context/AppContext";

import Toolbar from "./Toolbar";
import RequestList from "./RequestList";
import RequestDetails from "./RequestDetails";
import VerticalNavbar from "./VerticalNavbar";
import RuleList from "./RuleList";
import RuleDetails from "./RuleDetails";

const App: React.FC = () => {
  // Use AppContext to get all states and methods
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
      {/* Vertical Navigation Bar */}
      <VerticalNavbar 
        items={navItems}
        activeItem={activeView}
        onItemClick={handleNavItemClick}
      />
      
      {/* Content Area */}
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
                  />
                )}
              </div>
            </div>
          )}

          {activeView === "home" && (
            <div className="home-view">
              <div className="welcome-container">
                <h2>Welcome to Request Agent</h2>
                <p>This is a tool for intercepting and modifying network requests</p>
              </div>
            </div>
          )}

          {(activeView === "apis" || activeView === "files" || activeView === "sessions") && (
            <div className="coming-soon-view">
              <div className="coming-soon-container">
                <h2>Coming Soon</h2>
                <p>This feature is under development, stay tuned</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
