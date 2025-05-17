import type { PlasmoMessaging } from "@plasmohq/messaging"

import { requests } from "~background"

// 消息处理：获取请求列表
const getRequestsHandler: PlasmoMessaging.MessageHandler<{
  currentTabId?: number
}> = async (req, res) => {
  const tabId = req.body.currentTabId

  res.send(tabId ? requests.filter((r) => r.tabId === tabId) : requests)
}

export default getRequestsHandler
