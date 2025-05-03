import { PrimeReactContext, PrimeReactProvider } from "primereact/api"

import App from "./components/App"
import { AppProvider } from "./context/AppContext"

import "./index.css"

// 创建 DevTools 面板
chrome.devtools.panels.create("Request Agent", null, "devtools.html")

export default () => {
  return (
    <PrimeReactProvider value={{}}>
      <AppProvider>
        <App />
      </AppProvider>
    </PrimeReactProvider>
  )
}
