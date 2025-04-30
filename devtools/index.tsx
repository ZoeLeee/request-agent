import App from "./components/App"

import "./index.css"

// 创建 DevTools 面板
chrome.devtools.panels.create("Request Agent", null, "devtools.html")

export default App
