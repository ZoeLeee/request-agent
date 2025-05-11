import type { PlasmoMessaging } from "@plasmohq/messaging"

// Handle the setDebugEnabled message
const setDebugEnabledHandler: PlasmoMessaging.MessageHandler = async (
  req,
  res
) => {
  // Just send a success response, the actual state change is handled by storage.watch
  res.send({ success: true })
}

export default setDebugEnabledHandler
