import React from "react";
import type { Rule } from "./types";
import { RulesIcon } from "./icons";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { Tag } from "primereact/tag";

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
  // Match type template for displaying match type as tag
  const matchTypeTemplate = (rule: Rule) => {
    const matchTypeMap: Record<string, { label: string, severity: "success" | "info" | "warning" | "danger" }> = {
      "exact": { label: chrome.i18n.getMessage("match_exact"), severity: "success" },
      "contains": { label: chrome.i18n.getMessage("match_contains"), severity: "info" },
      "regex": { label: chrome.i18n.getMessage("match_regex"), severity: "warning" }
    };
    
    const { label, severity } = matchTypeMap[rule.matchType] || { label: rule.matchType, severity: "info" };
    
    return <Tag value={label} severity={severity} />
  };
  
  // Response preview template
  const responsePreviewTemplate = (rule: Rule) => {
    return <div className="text-gray-600 max-w-md truncate">
      {rule.response.substring(0, 50)}{rule.response.length > 50 ? '...' : ''}
    </div>
  };
  
  // URL template
  const urlTemplate = (rule: Rule) => {
    return <div className="text-gray-800 font-medium truncate" title={rule.url}>
      {rule.url}
    </div>
  };
  
  // Empty template for when no rules exist
  const emptyTemplate = () => {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="text-gray-400 w-16 h-16 mb-4">
          <RulesIcon />
        </div>
        <p className="text-xl font-medium mb-2">{chrome.i18n.getMessage("no_rules")}</p>
        <p className="text-gray-500">{chrome.i18n.getMessage("no_rules_hint")}</p>
      </div>
    );
  };

  return (
    <div className="rule-list-container">
      <DataTable 
        value={rules} 
        selectionMode="single"
        selection={selectedRule}
        onSelectionChange={(e) => onRuleSelect(e.value)}
        emptyMessage={emptyTemplate}
        scrollable 
        scrollHeight="flex"
        stripedRows
        className="w-full"
        dataKey="id"
        rowClassName={() => 'cursor-pointer'}
      >
        <Column field="url" header={chrome.i18n.getMessage("col_url")} body={urlTemplate} style={{ minWidth: '250px' }} />
        <Column field="matchType" header={chrome.i18n.getMessage("col_match_type")} body={matchTypeTemplate} style={{ width: '120px' }} />
        <Column field="response" header={chrome.i18n.getMessage("col_response_preview")} body={responsePreviewTemplate} style={{ minWidth: '200px' }} />
      </DataTable>
    </div>
  );
};

export default RuleList;
