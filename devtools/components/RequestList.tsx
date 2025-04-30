import React from "react";
import type { RequestInfo } from "./types";

interface RequestListProps {
  filteredRequests: RequestInfo[];
  selectedRequest: RequestInfo | null;
  handleRequestClick: (request: RequestInfo) => void;
  getDomain: (url: string) => string;
  getPath: (url: string) => string;
}

const RequestList: React.FC<RequestListProps> = ({
  filteredRequests,
  selectedRequest,
  handleRequestClick,
  getDomain,
  getPath
}) => {
  return (
    <div className="table-container">
      <table className="network-table">
        <thead>
          <tr>
            <th style={{ width: "50px" }}>名称</th>
            <th style={{ width: "300px" }}>路径</th>
            <th style={{ width: "80px" }}>方法</th>
            <th style={{ width: "80px" }}>状态</th>
            <th style={{ width: "80px" }}>类型</th>
            <th style={{ width: "120px" }}>发起者</th>
            <th style={{ width: "100px" }}>时间</th>
          </tr>
        </thead>
        <tbody>
          {filteredRequests.map((req) => (
            <tr
              key={req.id}
              onClick={() => handleRequestClick(req)}
              className={
                selectedRequest && selectedRequest.id === req.id
                  ? "selected"
                  : ""
              }>
              <td title={getDomain(req.url)}>{getDomain(req.url)}</td>
              <td title={getPath(req.url)}>{getPath(req.url)}</td>
              <td className={`method method-${String(req.method)}`}>
                {String(req.method)}
              </td>
              <td className="status-success">{req.responseStatus || 200}</td>
              <td>
                {typeof req.type === "string" ? req.type : String(req.type)}
              </td>
              <td title={req.initiator ? String(req.initiator) : ""}>
                {req.initiator ? String(req.initiator) : "-"}
              </td>
              <td>{new Date(req.timeStamp).toLocaleTimeString()}</td>
            </tr>
          ))}
          {filteredRequests.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                暂无请求记录
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default RequestList;
