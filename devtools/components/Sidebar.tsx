import React from "react";
import type { RequestInfo, Rule } from "./types";
import RuleList from "./RuleList";

interface SidebarProps {
  activeSidebarTab: string;
  setActiveSidebarTab: (tab: string) => void;
  filteredRequests: RequestInfo[];
  selectedRequest: RequestInfo | null;
  handleRequestClick: (request: RequestInfo) => void;
  rules: Rule[];
  selectedRule: Rule | null;
  setSelectedRule: (rule: Rule | null) => void;
  setNewRule: (rule: Rule) => void;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeSidebarTab,
  setActiveSidebarTab,
  filteredRequests,
  selectedRequest,
  handleRequestClick,
  rules,
  selectedRule,
  setSelectedRule,
  setNewRule,
  setActiveTab
}) => {
  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`sidebar-tab ${activeSidebarTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab('network')}
        >
          网络
        </button>
        <button 
          className={`sidebar-tab ${activeSidebarTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveSidebarTab('rules')}
        >
          规则
        </button>
      </div>
      
      <div className="sidebar-content">
        {activeSidebarTab === 'network' && (
          <div>
            {filteredRequests.map((req) => (
              <div 
                key={req.id} 
                className={`rule-item ${selectedRequest?.id === req.id ? 'selected' : ''}`}
                onClick={() => handleRequestClick(req)}
              >
                <div className="rule-url">{req.url}</div>
                <div className="rule-match-type">
                  <span className={`method method-${req.method}`}>{req.method}</span>
                  <span style={{ marginLeft: '10px' }} className={req.responseStatus && req.responseStatus >= 200 && req.responseStatus < 400 ? "status-success" : "status-error"}>
                    {req.responseStatus || '-'}
                  </span>
                </div>
                <div className="rule-response-preview">
                  {new Date(req.timeStamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                暂无请求记录
              </div>
            )}
          </div>
        )}
        
        {activeSidebarTab === 'rules' && (
          <RuleList 
            rules={rules}
            selectedRule={selectedRule}
            setSelectedRule={setSelectedRule}
            setNewRule={setNewRule}
            setActiveTab={setActiveTab}
          />
        )}
      </div>
    </div>
  );
};

export default Sidebar;
