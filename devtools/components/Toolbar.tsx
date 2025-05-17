import { Button } from "primereact/button"
import React from "react"

interface ToolbarProps {
  handleClearRequests: () => void
  handleClearRules?: () => void
  filterText: string
  setFilterText: (text: string) => void
  debugEnabled: boolean
  isToggling: boolean
  handleDebugToggle: () => void
  showRulesClear?: boolean
  onNewRule?: () => void
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
              label="Clear Rules"
              severity="danger"
              size="small"
              onClick={handleClearRules}
            />
            {onNewRule && (
              <Button
                label="New Rule"
                severity="success"
                size="small"
                icon="pi pi-plus"
                onClick={onNewRule}
              />
            )}
          </>
        ) : (
          <Button
            label="Clear Requests"
            severity="danger"
            size="small"
            onClick={handleClearRequests}
          />
        )}
      </div>
      <div className="toolbar-center">
        <input
          type="text"
          className="filter-input"
          placeholder={showRulesClear ? "Filter rules..." : "Filter requests..."}
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
      </div>
      <div className="toolbar-right">
        <div className="debug-toggle">
          <label className="debug-label">Debug Mode:</label>
          <Button
            onClick={handleDebugToggle}
            disabled={isToggling}
            severity={debugEnabled ? "success" : "danger"}>
            {isToggling ? (
              <>
                <span style={{ visibility: isToggling ? "hidden" : "visible" }}>
                  {debugEnabled ? "Enabled" : "Disabled"}
                </span>
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                  Switching...
                </span>
              </>
            ) : debugEnabled ? (
              "Enabled"
            ) : (
              "Disabled"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Toolbar
