import React from "react";
import type { Rule } from "./types";
import { Sidebar } from "primereact/sidebar";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { InputNumber } from "primereact/inputnumber";

interface RuleDetailsProps {
  selectedRule: Rule;
  newRule: Rule;
  setNewRule: (rule: Rule) => void;
  handleRuleSave: () => void;
  onClose: () => void;
  // No longer needed with Sidebar component
  // handleResizerMouseDown: (e: React.MouseEvent) => void;
  // detailsWidth: number;
}

const RuleDetails: React.FC<RuleDetailsProps> = ({
  selectedRule,
  newRule,
  setNewRule,
  handleRuleSave,
  onClose,
}) => {
  // Match type options for dropdown
  const matchTypeOptions = [
  { label: 'Exact Match', value: 'exact' },
    { label: 'Contains', value: 'contains' },
    { label: 'Regular Expression', value: 'regex' }
  ];
  return (
    <Sidebar 
      visible={true} 
      position="right" 
      onHide={onClose}
      header="Rule Details"
      className="w-1/2 md:w-30rem"
      blockScroll
    >
      <div className="p-fluid">
        <div className="field mb-4">
          <label htmlFor="rule-url" className="block text-sm font-medium mb-2">URL Pattern</label>
          <InputText
            id="rule-url"
            value={newRule.url}
            onChange={(e) => setNewRule({ ...newRule, url: e.target.value })}
            placeholder="Enter URL pattern"
            className="w-full"
          />
        </div>
        
        <div className="field mb-4">
          <label htmlFor="match-type" className="block text-sm font-medium mb-2">Match Type</label>
          <Dropdown
            id="match-type"
            value={newRule.matchType}
            options={matchTypeOptions}
            onChange={(e) => setNewRule({ ...newRule, matchType: e.value })}
            className="w-full"
            placeholder="Select match type"
          />
        </div>
        
        <div className="field mb-4">
          <label htmlFor="response-status" className="block text-sm font-medium mb-2">Response Status</label>
          <div className="flex flex-column gap-2">
            <InputNumber
              id="response-status"
              value={newRule.status ?? 200}
              onValueChange={(e) => setNewRule({ ...newRule, status: e.value ?? 200 })}
              placeholder="HTTP Status Code"
              className="w-full"
              min={100}
              max={599}
              showButtons={false}
            />
            <div className="flex gap-2 flex-wrap">
              {[200, 201, 204, 400, 401, 403, 404, 500, 502, 503].map((code) => (
                <Button
                  key={code}
                  label={String(code)}
                  size="small"
                  severity={
                    code < 300 ? "success" :
                    code < 400 ? "info" :
                    code < 500 ? "warning" : "danger"
                  }
                  outlined={(newRule.status ?? 200) !== code}
                  onClick={() => setNewRule({ ...newRule, status: code })}
                  className="p-button-sm"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="field mb-4">
          <label htmlFor="response-content" className="block text-sm font-medium mb-2">Response Content</label>
          <InputTextarea
            id="response-content"
            value={newRule.response}
            onChange={(e) => setNewRule({ ...newRule, response: e.target.value })}
            placeholder="Enter response content (JSON format)"
            rows={10}
            className="w-full"
            autoResize
          />
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            label="Save Rule" 
            onClick={handleRuleSave} 
            className="p-button-success" 
            icon="pi pi-save"
          />
        </div>
      </div>
    </Sidebar>
  );
};

export default RuleDetails;
