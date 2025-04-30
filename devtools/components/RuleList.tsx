import React from "react";
import type { Rule } from "./types";

interface RuleListProps {
  rules: Rule[];
  selectedRule: Rule | null;
  setSelectedRule: (rule: Rule | null) => void;
  setNewRule: (rule: Rule) => void;
  setActiveTab: (tab: string) => void;
}

const RuleList: React.FC<RuleListProps> = ({
  rules,
  selectedRule,
  setSelectedRule,
  setNewRule,
  setActiveTab
}) => {
  return (
    <div className="rule-list">
      {rules.map((rule) => (
        <div 
          key={rule.id} 
          className={`rule-item ${selectedRule?.id === rule.id ? 'selected' : ''}`}
          onClick={() => {
            setSelectedRule(rule);
            setNewRule(rule);
            setActiveTab("rule");
          }}
        >
          <div className="rule-url">{rule.url}</div>
          <div className="rule-match-type">匹配类型: {rule.matchType}</div>
          <div className="rule-response-preview">
            {rule.response.substring(0, 50)}{rule.response.length > 50 ? '...' : ''}
          </div>
        </div>
      ))}
      {rules.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
          暂无规则
        </div>
      )}
      <button 
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: '#4285f4',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
        onClick={() => {
          setSelectedRule(null);
          setNewRule({ id: "", url: "", matchType: "exact", response: "" });
          setActiveTab("rule");
        }}
      >
        添加新规则
      </button>
    </div>
  );
};

export default RuleList;
