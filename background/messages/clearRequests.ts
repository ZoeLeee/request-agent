import { requests } from "~background"
import type { PlasmoMessaging } from "@plasmohq/messaging"

// 消息处理：清除请求列表
const clearRequestsHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  requests.length = 0
  res.send({ success: true })
}

export default clearRequestsHandler
