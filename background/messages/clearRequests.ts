import type { PlasmoMessaging } from "@plasmohq/messaging"

import { requests } from "~background"

// 消息处理：清除请求列表
const clearRequestsHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  const id = req.body.currentTabId

  if (id) {
    const newRes = requests.filter((r) => r.tabId != id)
    requests.length = 0
    requests.push(...newRes)
  } else {
    requests.length = 0
  }
  res.send({ success: true })
}

export default clearRequestsHandler
