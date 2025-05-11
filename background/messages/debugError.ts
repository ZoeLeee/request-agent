import type { PlasmoMessaging } from "@plasmohq/messaging"

// 处理debugError消息，可以用于前端向后台查询当前的错误信息
const debugErrorHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  // 此处是空实现，因为我们主要是从后台向前端发送错误信息
  // 但保留这个消息处理器，以便未来可以在此基础上扩展功能
  res.send({ success: true })
}

export default debugErrorHandler
