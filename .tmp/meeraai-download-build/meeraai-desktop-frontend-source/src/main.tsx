import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element #root not found");
}

let uiBooted = false;

const renderBootError = (error: unknown) => {
  if (uiBooted) {
    if (import.meta.env.DEV) {
      console.error("Renderer error after boot:", error);
    }
    return;
  }
  const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  rootEl.innerHTML = `
    <div style="height:100%;display:grid;place-items:center;background:#060b14;color:#eaf6ff;font-family:Segoe UI,system-ui,Arial,sans-serif;padding:24px;">
      <div style="max-width:680px;border:1px solid rgba(255,255,255,0.12);border-radius:16px;background:rgba(8,18,33,0.85);padding:20px;">
        <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:rgba(234,246,255,0.7);">Renderer Error</div>
        <h2 style="margin:8px 0 12px;font-size:20px;">UI failed to initialize</h2>
        <pre style="white-space:pre-wrap;background:rgba(6,14,26,0.8);padding:12px;border-radius:10px;margin:0;">${message}</pre>
        <p style="margin:12px 0 0;color:rgba(234,246,255,0.75);font-size:13px;">Close and reopen MeeraAI.</p>
      </div>
    </div>
  `;
};

window.addEventListener("error", (event) => {
  renderBootError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  renderBootError(event.reason ?? "Unhandled promise rejection");
});

(async () => {
  try {
    const { default: App } = await import("./App");
    createRoot(rootEl).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
    uiBooted = true;
  } catch (error) {
    renderBootError(error);
  }
})();
