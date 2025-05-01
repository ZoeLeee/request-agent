import React from "react";

interface ToolbarProps {
  handleClearRequests: () => void;
  handleClearRules?: () => void;
  filterText: string;
  setFilterText: (text: string) => void;
  debugEnabled: boolean;
  isToggling: boolean;
  handleDebugToggle: () => void;
  showRulesClear?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  handleClearRequests,
  handleClearRules,
  filterText,
  setFilterText,
  debugEnabled,
  isToggling,
  handleDebugToggle,
  showRulesClear = false
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        {showRulesClear ? (
          <button className="toolbar-button danger" onClick={handleClearRules}>清空规则</button>
        ) : (
          <button className="toolbar-button" onClick={handleClearRequests}>清除请求</button>
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
