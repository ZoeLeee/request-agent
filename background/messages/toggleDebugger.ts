import type { PlasmoMessaging } from "@plasmohq/messaging"

import { requests } from "~background"
import { DebuugerTabIdSet } from "~utils/debugger"

// 消息处理：获取请求列表
const toggleDebuggerHandler: PlasmoMessaging.MessageHandler<{
  targetId?: number
  state: boolean
}> = async (req, res) => {
  const { state, targetId } = req.body

  if (state) {
    DebuugerTabIdSet.add(targetId)
  } else {
    DebuugerTabIdSet.delete(targetId)
  }

  res.send({
    success: true
  })
}

export default toggleDebuggerHandler
