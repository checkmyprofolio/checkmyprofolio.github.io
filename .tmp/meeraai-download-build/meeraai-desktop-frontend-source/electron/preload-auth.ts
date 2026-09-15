import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("meeraAuth", {
  windowControls: {
    minimize: () => ipcRenderer.send("meera:window:minimize"),
    maximize: () => ipcRenderer.send("meera:window:maximize"),
    close: () => ipcRenderer.send("meera:window:close"),
  },
});

const applyAuthChrome = async () => {
  try {
    const payload = await ipcRenderer.invoke("meera:auth:chrome");
    if (!payload) {
      return;
    }
    const { css, script } = payload as { css?: string; script?: string };
    if (css) {
      let styleEl = document.getElementById("meera-auth-style") as HTMLStyleElement | null;
      if (!styleEl) {
        styleEl = document.createElement("style");
        styleEl.id = "meera-auth-style";
        document.head.appendChild(styleEl);
      }
      if (styleEl.textContent !== css) {
        styleEl.textContent = css;
      }
    }
    if (script) {
      // Run in page context to rebuild chrome if the DOM was replaced.
      // eslint-disable-next-line no-new-func
      const fn = new Function(script);
      fn();
    }
  } catch {
    // Swallow to avoid blocking auth flows.
  }
};

const scheduleAuthChrome = () => {
  applyAuthChrome();
  if (document.readyState === "complete") {
    return;
  }
  window.addEventListener("DOMContentLoaded", () => applyAuthChrome(), { once: true });
  window.addEventListener("load", () => applyAuthChrome(), { once: true });
};

scheduleAuthChrome();
setInterval(() => applyAuthChrome(), 1500);
