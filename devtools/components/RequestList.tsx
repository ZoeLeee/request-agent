import React from "react";
import type { RequestInfo } from "./types";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Tag } from "primereact/tag";

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
  // Method template for displaying request method with tag
  const methodBodyTemplate = (req: RequestInfo) => {
    const method = String(req.method);
    const severityMap: Record<string, "success" | "info" | "warning" | "danger"> = {
      GET: "info",
      POST: "success",
      PUT: "warning",
      DELETE: "danger",
      PATCH: "warning",
      OPTIONS: "info",
      HEAD: "info"
    };
    
    const severity = severityMap[method] || "info";
    
    return <Tag value={method} severity={severity} />
  };
  
  // Status template for displaying status code
  const statusBodyTemplate = (req: RequestInfo) => {
    const status = req.responseStatus || 200;
    let severity: "success" | "info" | "warning" | "danger" = "success";
    
    if (status >= 400 && status < 500) severity = "warning";
    if (status >= 500) severity = "danger";
    if (status >= 300 && status < 400) severity = "info";
    
    return <Tag value={status} severity={severity} />
  };
  
  // Domain template for displaying host name
  const domainBodyTemplate = (req: RequestInfo) => {
    return <span title={getDomain(req.url)}>{getDomain(req.url)}</span>;
  };
  
  // Path template for displaying URL path
  const pathBodyTemplate = (req: RequestInfo) => {
    return <span title={getPath(req.url)}>{getPath(req.url)}</span>;
  };
  
  // Type template for displaying request type
  const typeBodyTemplate = (req: RequestInfo) => {
    return <span>{typeof req.type === "string" ? req.type : String(req.type)}</span>;
  };
  
  // Initiator template for displaying initiator
  const initiatorBodyTemplate = (req: RequestInfo) => {
    return <span title={req.initiator ? String(req.initiator) : ""}>
      {req.initiator ? String(req.initiator) : "-"}
    </span>;
  };
  
  // Time template for displaying timestamp
  const timeBodyTemplate = (req: RequestInfo) => {
    return <span>{new Date(req.timeStamp).toLocaleTimeString()}</span>;
  };

  return (
    <div className="table-container">
      <DataTable 
        value={filteredRequests} 
        selectionMode="single"
        selection={selectedRequest}
        onSelectionChange={(e) => handleRequestClick(e.value)}
        emptyMessage="No request records"
        scrollable 
        scrollHeight="flex"
        stripedRows
        className="w-full"
        dataKey="id"
        tableStyle={{ minWidth: '50rem' }}
        rowClassName={() => 'cursor-pointer'}
      >
        <Column field="domain" header="Name" body={domainBodyTemplate} style={{ width: '150px' }} />
        <Column field="path" header="Path" body={pathBodyTemplate} style={{ width: '300px' }} />
        <Column field="method" header="Method" body={methodBodyTemplate} style={{ width: '100px' }} />
        <Column field="status" header="Status" body={statusBodyTemplate} style={{ width: '100px' }} />
        <Column field="type" header="Type" body={typeBodyTemplate} style={{ width: '100px' }} />
        <Column field="initiator" header="Initiator" body={initiatorBodyTemplate} style={{ width: '150px' }} />
        <Column field="time" header="Time" body={timeBodyTemplate} style={{ width: '120px' }} />
      </DataTable>
    </div>
  );
};

export default RequestList;
