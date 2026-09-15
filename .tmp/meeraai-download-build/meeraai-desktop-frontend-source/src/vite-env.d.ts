/// <reference types="vite/client" />

declare global {
  type DesktopAppBridgeItem = {
    key: string;
    name: string;
    processName: string;
    windowTitle: string;
    path: string;
    lastSeenAt: number;
  };

  type DesktopAppBridgeEvent = {
    key: string;
    name: string;
    processName: string;
    state: "opened" | "closed";
    timestamp: number;
  };

  type DesktopAppsBridgePayload = {
    apps: DesktopAppBridgeItem[];
    events: DesktopAppBridgeEvent[];
    refreshedAt: number;
  };

  interface Window {
    meera?: {
      platform: string;
      getDesktopApps?: () => Promise<DesktopAppsBridgePayload>;
      startBackend?: () => Promise<{ ok: boolean; status?: string; error?: string }>;
      stopBackend?: () => Promise<{ ok: boolean; status?: string; error?: string }>;
      scanModels?: () => Promise<{
        ok: boolean;
        root?: string;
        models?: Array<{
          id: string;
          present: boolean;
          size_bytes: number;
          local_bytes?: number;
          path: string;
          params?: string;
          precision?: string;
          repo_id?: string | null;
          label?: string;
          folder?: string;
          quant_bits?: number | null;
        }>;
      }>;
      notify?: (payload: {
        title: string;
        body?: string;
        icon?: string;
        silent?: boolean;
      }) => Promise<{ ok: boolean; error?: string }>;
      getInstallerConfig?: () => Promise<{ ok: boolean; selectedModel?: string; autoDownload?: boolean; error?: string }>;
      consumeInstallerConfig?: () => Promise<{ ok: boolean }>;
      getFirebaseConfig?: () => Promise<{
        ok: boolean;
        config?: {
          apiKey: string;
          authDomain: string;
          projectId: string;
          appId: string;
          messagingSenderId: string;
          storageBucket?: string;
          measurementId?: string;
        };
        error?: string;
      }>;
      saveFirebaseConfig?: (config: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        appId: string;
        messagingSenderId: string;
        storageBucket?: string;
        measurementId?: string;
      }) => Promise<{ ok: boolean; error?: string }>;
      resetFirebaseConfig?: () => Promise<{ ok: boolean; error?: string }>;
      restartApp?: () => void;
      windowControls?: {
        minimize: () => void;
        maximize: () => void;
        close: () => void;
      };
    };
  }
}

export {};
