import React from "react";
import { Button } from "primereact/button";

interface ToolbarProps {
  handleClearRequests: () => void;
  handleClearRules?: () => void;
  filterText: string;
  setFilterText: (text: string) => void;
  debugEnabled: boolean;
  isToggling: boolean;
  handleDebugToggle: () => void;
  showRulesClear?: boolean;
  onNewRule?: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  handleClearRequests,
  handleClearRules,
  filterText,
  setFilterText,
  debugEnabled,
  isToggling,
  handleDebugToggle,
  showRulesClear = false,
  onNewRule
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left flex gap-2">
        {showRulesClear ? (
          <>
            <Button 
              label="清空规则" 
              severity="danger" 
              size="small"
              onClick={handleClearRules} 
            />
            {onNewRule && (
              <Button 
                label="新建规则" 
                severity="success" 
                size="small"
                icon="pi pi-plus" 
                onClick={onNewRule} 
              />
            )}
          </>
        ) : (
          <Button 
            label="清除请求" 
            severity="secondary" 
            size="small"
            onClick={handleClearRequests} 
          />
        )}
      </div>
      <div className="toolbar-center">
        <input
          type="text"
          className="filter-input"
          placeholder={showRulesClear ? "筛选规则..." : "筛选请求..."}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      <div className="toolbar-right">
        <div className="debug-toggle">
          <label className="debug-label">调试模式:</label>
          <button 
            className={`debug-button ${debugEnabled ? 'enabled' : 'disabled'}`}
            onClick={handleDebugToggle}
            disabled={isToggling}
          >
            {isToggling ? (
              <>
                <span style={{ visibility: isToggling ? 'hidden' : 'visible' }}>
                  {debugEnabled ? '已开启' : '已关闭'}
                </span>
                <span style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  切换中...
                </span>
              </>
            ) : (
              debugEnabled ? '已开启' : '已关闭'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
