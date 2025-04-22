import type { PlasmoMessaging } from "@plasmohq/messaging"
import { requests } from "~background"

// 消息处理：获取请求列表
const getRequestsHandler: PlasmoMessaging.MessageHandler = async (req, res) => {
  res.send(requests)
}

export default getRequestsHandler