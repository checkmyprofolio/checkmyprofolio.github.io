import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("meera", {
  platform: process.platform,
  getDesktopApps: () => ipcRenderer.invoke("meera:getDesktopApps"),
  startBackend: () => ipcRenderer.invoke("meera:backend:start"),
  stopBackend: () => ipcRenderer.invoke("meera:backend:stop"),
  scanModels: () => ipcRenderer.invoke("meera:models:scan"),
  notify: (payload: { title: string; body?: string; icon?: string; silent?: boolean }) =>
    ipcRenderer.invoke("meera:notify", payload),
  getInstallerConfig: () => ipcRenderer.invoke("meera:installer:read"),
  consumeInstallerConfig: () => ipcRenderer.invoke("meera:installer:consume"),
  getFirebaseConfig: () => ipcRenderer.invoke("meera:firebase:read"),
  saveFirebaseConfig: (config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    appId: string;
    messagingSenderId: string;
    storageBucket?: string;
    measurementId?: string;
  }) => ipcRenderer.invoke("meera:firebase:save", config),
  resetFirebaseConfig: () => ipcRenderer.invoke("meera:firebase:reset"),
  restartApp: () => ipcRenderer.send("meera:app:restart"),
  windowControls: {
    minimize: () => ipcRenderer.send("meera:window:minimize"),
    maximize: () => ipcRenderer.send("meera:window:maximize"),
    close: () => ipcRenderer.send("meera:window:close"),
  },
});
