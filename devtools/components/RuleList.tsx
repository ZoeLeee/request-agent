import React from "react";
import type { Rule } from "./types";
import { RulesIcon } from "./icons";

interface RuleListProps {
  rules: Rule[];
  selectedRule: Rule | null;
  onRuleSelect: (rule: Rule) => void;
  onNewRule: () => void;
}

const RuleList: React.FC<RuleListProps> = ({
  rules,
  selectedRule,
  onRuleSelect,
  onNewRule
}) => {
  return (
    <div className="rule-list-container">
      <div className="rules-header">
        <h2 className="rules-title">规则列表</h2>
        <button className="new-rule-button" onClick={onNewRule}>
          新建规则
        </button>
      </div>
      <div className="rules-content">
        {rules.length > 0 ? (
          <div className="rules-list">
            {rules.map((rule) => (
              <div 
                key={rule.id} 
                className={`rule-item ${selectedRule?.id === rule.id ? 'selected' : ''}`}
                onClick={() => onRuleSelect(rule)}
              >
                <div className="rule-url">{rule.url}</div>
                <div className="rule-match-type">匹配类型: {rule.matchType === "exact" ? "精确匹配" : 
                                            rule.matchType === "contains" ? "包含" : "正则表达式"}</div>
                <div className="rule-response-preview">
                  {rule.response.substring(0, 50)}{rule.response.length > 50 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rules-empty-state">
            <div className="rules-icon-container">
              <RulesIcon />
            </div>
            <p className="rules-empty-text">暂无规则</p>
            <p className="rules-empty-desc">点击上方的新建规则按钮添加你的第一条规则</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleList;
