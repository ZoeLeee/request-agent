// 定义 ResourceType 类型，与 Chrome 网络请求 API 一致
export type ResourceType =
  | "main_frame"
  | "sub_frame"
  | "stylesheet"
  | "script"
  | "image"
  | "font"
  | "object"
  | "xmlhttprequest"
  | "ping"
  | "csp_report"
  | "media"
  | "websocket"
  | "webbundle"
  | "other"

export interface RequestInfo {
  id: string
  url: string
  method: string
  timeStamp: number
  type: ResourceType
  tabId: number
  frameId: number
  parentFrameId: number
  initiator?: string
  // 请求头字段
  requestHeaders?: { [key: string]: string }
  // 响应相关字段
  responseStatus?: number
  responseStatusText?: string
  responseHeaders?: { [key: string]: string }
  responseContent?: string
  responseTime?: number
  responseSize?: number
  responseType?: string
  // 自定义响应字段
  shouldIntercept?: boolean
  customResponse?: string
}

export interface Rule {
  id: string
  url: string
  matchType: "exact" | "contains" | "regex"
  response: string
}
