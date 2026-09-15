const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("installer", {
  getDefaultPath: () => ipcRenderer.invoke("installer:getDefaultPath"),
  detectInstall: () => ipcRenderer.invoke("installer:detect"),
  selectPath: () => ipcRenderer.invoke("installer:selectPath"),
  startInstall: (payload) => ipcRenderer.invoke("installer:start", payload),
  repairInstall: (payload) => ipcRenderer.invoke("installer:repair", payload),
  backupInstall: (payload) => ipcRenderer.invoke("installer:backup", payload),
  uninstallInstall: (payload) => ipcRenderer.invoke("installer:uninstall", payload),
  launchApp: (installDir) => ipcRenderer.invoke("installer:launch", installDir),
  minimize: () => ipcRenderer.send("installer:window:minimize"),
  close: () => ipcRenderer.send("installer:window:close"),
  onProgress: (handler) => ipcRenderer.on("installer:progress", (_event, data) => handler(data)),
});
