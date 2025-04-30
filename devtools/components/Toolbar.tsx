import React from "react";

interface ToolbarProps {
  handleClearRequests: () => void;
  filterText: string;
  setFilterText: (text: string) => void;
  debugEnabled: boolean;
  isToggling: boolean;
  handleDebugToggle: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  handleClearRequests,
  filterText,
  setFilterText,
  debugEnabled,
  isToggling,
  handleDebugToggle
}) => {
  return (
    <div className="toolbar">
      <button onClick={handleClearRequests}>清除</button>
      <input
        type="text"
        className="filter-input"
        placeholder="筛选请求..."
        value={filterText}
        onChange={(e) => setFilterText(e.target.value)}
      />
      <div className="debug-toggle" style={{ marginLeft: '10px', display: 'flex', alignItems: 'center' }}>
        <label style={{ marginRight: '5px', fontSize: '14px' }}>调试模式:</label>
        <button 
          onClick={handleDebugToggle}
          disabled={isToggling}
          style={{
            padding: '5px 10px',
            backgroundColor: debugEnabled ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: isToggling ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            opacity: isToggling ? 0.7 : 1,
            position: 'relative'
          }}
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
  );
};

export default Toolbar;
