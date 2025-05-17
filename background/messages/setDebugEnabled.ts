import type { PlasmoMessaging } from "@plasmohq/messaging"

// Handle the setDebugEnabled message
const setDebugEnabledHandler: PlasmoMessaging.MessageHandler<{
  targetId?: number
  state: boolean
}> = async (
  req,
  res
) => {
  const { state, targetId } = req.body
  
  res.send({ success: true })
}

export default setDebugEnabledHandler
