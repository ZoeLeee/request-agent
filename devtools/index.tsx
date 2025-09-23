import { PrimeReactContext, PrimeReactProvider } from "primereact/api"

import App from "./components/App"
import { AppProvider } from "./context/AppContext"

import "./index.css"

// 创建 DevTools 面板（标题使用 i18n）
chrome.devtools.panels.create(chrome.i18n.getMessage("ext_name"), null, "devtools.html")

export default () => {
  return (
    <PrimeReactProvider value={{}}>
      <AppProvider>
        <App />
      </AppProvider>
    </PrimeReactProvider>
  )
}
