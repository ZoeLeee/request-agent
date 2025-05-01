import React from "react";
import type { Rule } from "./types";

interface RuleDetailsProps {
  selectedRule: Rule;
  newRule: Rule;
  setNewRule: (rule: Rule) => void;
  handleRuleSave: () => void;
  onClose: () => void;
  handleResizerMouseDown: (e: React.MouseEvent) => void;
  detailsWidth: number;
}

const RuleDetails: React.FC<RuleDetailsProps> = ({
  selectedRule,
  newRule,
  setNewRule,
  handleRuleSave,
  onClose,
  handleResizerMouseDown,
  detailsWidth
}) => {
  return (
    <div className="details-panel rule-details" style={{ width: `${detailsWidth}px` }}>
      <div className="resizer" onMouseDown={handleResizerMouseDown}></div>
      
      <div className="details-header">
        <h2>规则详情</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="details-content">
        <div className="form-group">
          <label>URL 匹配模式</label>
          <input
            type="text"
            value={newRule.url}
            onChange={(e) => setNewRule({ ...newRule, url: e.target.value })}
            placeholder="输入 URL 匹配模式"
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label>匹配类型</label>
          <select
            value={newRule.matchType}
            onChange={(e) => setNewRule({ ...newRule, matchType: e.target.value as "exact" | "contains" | "regex" })}
            className="form-control"
          >
            <option value="exact">精确匹配</option>
            <option value="contains">包含</option>
            <option value="regex">正则表达式</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>响应内容</label>
          <textarea
            value={newRule.response}
            onChange={(e) => setNewRule({ ...newRule, response: e.target.value })}
            placeholder="输入响应内容（JSON 格式）"
            rows={10}
            className="form-control"
          />
        </div>
        
        <div className="form-actions">
          <button className="save-button" onClick={handleRuleSave}>保存规则</button>
        </div>
      </div>
    </div>
  );
};

export default RuleDetails;
