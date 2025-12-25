import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { setupGlobalErrorHandling } from "./lib/error-logging";

// 设置全局错误处理
setupGlobalErrorHandling();

createRoot(document.getElementById("root")!).render(<App />);
