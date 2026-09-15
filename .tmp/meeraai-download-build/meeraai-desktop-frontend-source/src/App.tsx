import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import type { IconType } from "react-icons";
import { playSound } from "../UI/SoundEffects";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaEdge, FaWindows } from "react-icons/fa";
import { PiAppWindowDuotone, PiCheck, PiChatsCircleDuotone, PiFolderOpenDuotone, PiGearSixDuotone, PiX } from "react-icons/pi";
import { RiTerminalWindowLine } from "react-icons/ri";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  SiDiscord,
  SiDocker,
  SiFigma,
  SiFirefoxbrowser,
  SiGithub,
  SiGoogle,
  SiApple,
  SiGooglechrome,
  SiNotion,
  SiObsidian,
  SiPostman,
  SiSlack,
  SiSpotify,
  SiTelegram,
  SiWhatsapp,
} from "react-icons/si";
import { VscCode } from "react-icons/vsc";
import tsxLang from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import typescriptLang from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import javascriptLang from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import {
  ConfirmationResult,
  EmailAuthProvider,
  GithubAuthProvider,
  GoogleAuthProvider,
  PhoneAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  User,
  browserLocalPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  linkWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  signOut,
  updateEmail,
  updatePassword,
  updatePhoneNumber,
  updateProfile,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

SyntaxHighlighter.registerLanguage("tsx", tsxLang);
SyntaxHighlighter.registerLanguage("typescript", typescriptLang);
SyntaxHighlighter.registerLanguage("javascript", javascriptLang);

const UiIcon = ({ name, className, alt = "" }: { name: string; className?: string; alt?: string }) => (
  <img className={["ui-icon", className].filter(Boolean).join(" ")} src={`${import.meta.env.BASE_URL}ui/${name}`} alt={alt} />
);

declare global {
  interface Window {
    grecaptcha?: any;
  }
}

type Role = "user" | "assistant";
type ChatPayloadMessage = { role: Role; content: string };
type AgentStatus = "ready" | "thinking" | "executing" | "offline";
type ViewMode = "home" | "workspace";
type ThemeMode = "dark" | "light";
type OverlayMode = "balanced" | "soft" | "dim";
type WallpaperPresetId =
  | "wallpaper-1"
  | "wallpaper-2"
  | "wallpaper-3"
  | "wallpaper-4"
  | "wallpaper-5"
  | "wallpaper-6"
  | "wallpaper-7"
  | "wallpaper-8"
  | "wallpaper-9"
  | "wallpaper-10";

type CapabilityResponse = {
  quick_actions?: string[];
  prompt_ideas?: string[];
  [key: string]: unknown;
};

type ModelDownloadState = {
  model_id: string;
  repo_id: string;
  status: "queued" | "downloading" | "paused" | "verifying" | "completed" | "cancelled" | "error";
  progress: number;
  downloaded_bytes: number;
  total_bytes: number;
  stage: string;
  error?: string | null;
  updated_at?: number;
};

type ModelStatus = {
  id: string;
  label: string;
  params: string;
  repo_id?: string | null;
  folder: string;
  path: string;
  quant_bits?: number | null;
  precision?: string;
  blurb?: string;
  requires_auth?: boolean;
  present: boolean;
  repo_mismatch?: boolean;
  size_bytes: number;
  local_bytes?: number;
  download?: ModelDownloadState | null;
};

type ModelStatusResponse = {
  models: ModelStatus[];
  active_download?: ModelDownloadState | null;
  hf_token_set?: boolean;
};

type InstallerConfig = {
  selectedModel?: string;
  autoDownload?: boolean;
  selected_model?: string;
  auto_download?: boolean;
};

type AuthUserState = Pick<User, "uid" | "displayName" | "email" | "phoneNumber" | "emailVerified" | "photoURL">;

const snapshotAuthUser = (user: User | null): AuthUserState | null => {
  if (!user) {
    return null;
  }
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL,
  };
};

type LocalModelScanItem = {
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
};

type LocalModelScanResponse = {
  ok: boolean;
  root?: string;
  models?: LocalModelScanItem[];
};

type ModelLoadStatus = {
  model_id?: string;
  status?: "idle" | "loading" | "ready" | "error";
  stage?: string;
  progress?: number;
  logs?: string[];
  error?: string | null;
  active_model?: string | null;
};

// --- TypeScript types below ---
type DesktopApp = {
  key: string;
  name: string;
  processName: string;
  windowTitle: string;
  path: string;
  lastSeenAt: number;
};

type DesktopAppEvent = {
  key: string;
  name: string;
  processName: string;
  state: "opened" | "closed";
  timestamp: number;
};

type DesktopAppsPayload = {
  apps: DesktopApp[];
  events: DesktopAppEvent[];
  refreshedAt: number;
};

type ProjectItem = {
  id: string;
  name: string;
  updatedAt?: number;
};

type ConfirmDialogState = {
  icon?: string;
  kicker: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  note?: string;
  tone?: "danger" | "primary";
};

const STORAGE_SESSIONS = "meera.sessions";
const STORAGE_ACTIVE_SESSION = "meera.activeSession";
const STORAGE_HISTORY = "meera.inputHistory";
const STORAGE_THEME = "meera.theme";
const STORAGE_STREAM = "meera.streamMode";
const STORAGE_SCROLL = "meera.autoScroll";
const STORAGE_SIDEBAR = "meera.sidebarOpen";
const STORAGE_SHORTCUTS = "meera.shortcuts";
const STORAGE_PROJECTS = "meera.projects";
const STORAGE_ACTIVE_PROJECT = "meera.activeProject";
const STORAGE_MODEL = "meera.selectedModel";
const STORAGE_INSTALLER_APPLIED = "meera.installerApplied";
const STORAGE_TERMS_ACCEPTED = "meera.termsAcceptedAt";
const STORAGE_TERMS_PENDING = "meera.termsAcceptedPending";

const termsKeyForUser = (uid?: string | null) => (uid ? `${STORAGE_TERMS_ACCEPTED}:${uid}` : STORAGE_TERMS_PENDING);

const readTermsAccepted = (uid?: string | null) => {
  if (typeof localStorage === "undefined") {
    return false;
  }
  try {
    return Boolean(localStorage.getItem(termsKeyForUser(uid)));
  } catch {
    return false;
  }
};

const persistTermsAccepted = (uid?: string | null) => {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(termsKeyForUser(uid), String(Date.now()));
  } catch {
    // ignore storage failures
  }
};

const clearTermsAccepted = (uid?: string | null) => {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    if (uid) {
      localStorage.removeItem(termsKeyForUser(uid));
    }
    localStorage.removeItem(STORAGE_TERMS_PENDING);
  } catch {
    // ignore storage failures
  }
};

function storageKeyForUser(base: string, uid?: string | null): string {
  return uid ? `${base}:${uid}` : base;
}

function loadSessionsFromStorage(uid?: string | null): Session[] {
  const raw = localStorage.getItem(storageKeyForUser(STORAGE_SESSIONS, uid));
  const parsed = raw ? parseJsonSafe<unknown[]>(raw) : null;
  if (parsed && parsed.length > 0) {
    const normalized = parsed.map((item, index) => normalizeSession(item, index)).filter(sessionHasHistory);
    if (normalized.length > 0) {
      return normalized.sort((a, b) => b.updatedAt - a.updatedAt);
    }
  }
  return [createSessionRecord()];
}

function loadActiveSessionIdFromStorage(uid?: string | null, sessions?: Session[]): string {
  const stored = localStorage.getItem(storageKeyForUser(STORAGE_ACTIVE_SESSION, uid)) ?? "";
  if (stored && sessions?.some((session) => session.id === stored)) {
    return stored;
  }
  return sessions?.[0]?.id ?? "";
}

function loadProjectsFromStorage(uid?: string | null): ProjectItem[] {
  const parsed = parseJsonSafe<ProjectItem[]>(localStorage.getItem(storageKeyForUser(STORAGE_PROJECTS, uid)));
  if (!parsed || !Array.isArray(parsed)) {
    return [];
  }
  return parsed.map((item, index) => ({
    id: typeof item?.id === "string" ? item.id : `project-${index}-${Date.now()}`,
    name: typeof item?.name === "string" ? item.name : `Project ${index + 1}`,
    updatedAt: typeof item?.updatedAt === "number" ? item.updatedAt : Date.now(),
  }));
}

function loadActiveProjectIdFromStorage(uid?: string | null, projects?: ProjectItem[]): string {
  const stored = localStorage.getItem(storageKeyForUser(STORAGE_ACTIVE_PROJECT, uid)) ?? "";
  if (stored && projects?.some((project) => project.id === stored)) {
    return stored;
  }
  return "";
}

function loadSessionState(uid?: string | null): { sessions: Session[]; activeSessionId: string } {
  const sessions = loadSessionsFromStorage(uid);
  const activeSessionId = loadActiveSessionIdFromStorage(uid, sessions);
  return { sessions, activeSessionId };
}

function loadProjectState(uid?: string | null): { projects: ProjectItem[]; activeProjectId: string } {
  const projects = loadProjectsFromStorage(uid);
  const activeProjectId = loadActiveProjectIdFromStorage(uid, projects);
  return { projects, activeProjectId };
}

const API_BASE = "http://127.0.0.1:8000";
const API_CHAT = `${API_BASE}/api/chat`;
const API_STREAM = `${API_BASE}/api/chat/stream`;
const API_HEALTH = `${API_BASE}/health`;
const API_CAPABILITIES = `${API_BASE}/api/capabilities`;
const API_MODELS_STATUS = `${API_BASE}/api/models/status`;
const API_MODELS_DOWNLOAD = `${API_BASE}/api/models/download`;
const API_MODELS_PAUSE = `${API_BASE}/api/models/pause`;
const API_MODELS_RESUME = `${API_BASE}/api/models/resume`;
const API_MODELS_CANCEL = `${API_BASE}/api/models/cancel`;
const API_MODELS_DELETE = `${API_BASE}/api/models/delete`;
const API_MODELS_LOAD = `${API_BASE}/api/models/load`;
const API_MODELS_LOAD_STATUS = `${API_BASE}/api/models/load/status`;
const API_MODELS_TOKEN = `${API_BASE}/api/models/token`;
const API_MODELS_TOKEN_CLEAR = `${API_BASE}/api/models/token/clear`;

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId: string;
  storageBucket?: string;
  measurementId?: string;
};

const FIREBASE_STORAGE_KEY = "meera.firebaseConfig";
const FIREBASE_ENV_CONFIG: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const normalizeFirebaseConfig = (input?: Partial<FirebaseConfig> | null): FirebaseConfig | null => {
  if (!input) {
    return null;
  }
  const apiKey = typeof input.apiKey === "string" ? input.apiKey.trim() : "";
  const authDomain = typeof input.authDomain === "string" ? input.authDomain.trim() : "";
  const projectId = typeof input.projectId === "string" ? input.projectId.trim() : "";
  const appId = typeof input.appId === "string" ? input.appId.trim() : "";
  const messagingSenderId = typeof input.messagingSenderId === "string" ? input.messagingSenderId.trim() : "";
  const storageBucket = typeof input.storageBucket === "string" ? input.storageBucket.trim() : "";
  const measurementId = typeof input.measurementId === "string" ? input.measurementId.trim() : "";
  const candidate: FirebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId,
    storageBucket: storageBucket || undefined,
    measurementId: measurementId || undefined,
  };
  return apiKey && authDomain && projectId && appId && messagingSenderId ? candidate : null;
};

const isSameFirebaseConfig = (left: FirebaseConfig | null, right: FirebaseConfig | null): boolean => {
  if (!left || !right) {
    return false;
  }
  return (
    left.apiKey === right.apiKey &&
    left.authDomain === right.authDomain &&
    left.projectId === right.projectId &&
    left.appId === right.appId &&
    left.messagingSenderId === right.messagingSenderId &&
    (left.storageBucket ?? "") === (right.storageBucket ?? "") &&
    (left.measurementId ?? "") === (right.measurementId ?? "")
  );
};

const loadFirebaseConfig = async (): Promise<FirebaseConfig | null> => {
  if (typeof window !== "undefined" && window.meera?.getFirebaseConfig) {
    try {
      const result = await window.meera.getFirebaseConfig();
      if (result?.ok && result.config) {
        return normalizeFirebaseConfig(result.config);
      }
    } catch {
      // ignore read errors
    }
    return null;
  }
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<FirebaseConfig>;
    return normalizeFirebaseConfig(parsed);
  } catch {
    return null;
  }
};

const saveFirebaseConfig = async (config: FirebaseConfig): Promise<boolean> => {
  if (typeof window !== "undefined" && window.meera?.saveFirebaseConfig) {
    try {
      const result = await window.meera.saveFirebaseConfig(config);
      return Boolean(result?.ok);
    } catch {
      return false;
    }
  }
  if (typeof localStorage === "undefined") {
    return false;
  }
  try {
    localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
};

const clearFirebaseConfig = async (): Promise<boolean> => {
  if (typeof window !== "undefined" && window.meera?.resetFirebaseConfig) {
    try {
      const result = await window.meera.resetFirebaseConfig();
      return Boolean(result?.ok);
    } catch {
      return false;
    }
  }
  if (typeof localStorage === "undefined") {
    return false;
  }
  try {
    localStorage.removeItem(FIREBASE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

const AUTH_PROVIDER_ICON_URLS = {
  google:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/250px-Google_%22G%22_logo.svg.png",
  github: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/GitHub_Mark.png/250px-GitHub_Mark.png",
  microsoft:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/250px-Microsoft_logo.svg.png",
} as const;
const SIDEBAR_ICON_NAMES = {
  newChat: "chat_bubble",
  search: "search",
  settings: "settings",
  pinned: "push_pin",
  project: "create_new_folder",
  session: "chat_bubble",
  edit: "edit",
  delete: "delete",
} as const;
const CHAT_RAIL_SLOTS = 8;
const DEFAULT_PROFILE_AVATAR_URL =
  "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

const MEERA_SIDEBAR_CSS = `
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap");

.copilot-surface.sidebar-open::after {
  content: "" !important;
  position: fixed !important;
  inset: 0 !important;
  opacity: 1 !important;
  background: rgba(6, 10, 20, 0.04) !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  pointer-events: none !important;
  z-index: 2 !important;
}

.app-root .wallpaper {
  transition: filter 240ms var(--sidebar-ease), transform 240ms var(--sidebar-ease);
  will-change: filter, transform;
}

.app-root.sidebar-open {
  --wallpaper-overlay-opacity: 0.1;
}

.app-root.sidebar-open .wallpaper {
  opacity: 1 !important;
  filter: blur(22px) saturate(1.08) contrast(1.02) !important;
  transform: scale(1.05);
}

.app-root.sidebar-open .wallpaper::after {
  background: rgba(6, 10, 20, 0.12) !important;
  opacity: 0.25 !important;
}

.copilot-surface.sidebar-open .copilot-home-content,
.copilot-surface.sidebar-open .copilot-workspace-content {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
  filter: none !important;
}

.copilot-surface.sidebar-open .topbar.copilot-topbar {
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  background: transparent;
  opacity: 1;
  pointer-events: auto;
  z-index: 3;
}

.copilot-sidebar.meera-sidebar {
  --sidebar-expanded: 320px;
  --sidebar-collapsed: 80px;
  --sidebar-radius: 24px;
  --sidebar-bg: #f0f3f7;
  --sidebar-border: rgba(15, 23, 42, 0.1);
  --sidebar-text: rgba(15, 23, 42, 0.96);
  --sidebar-muted: rgba(70, 78, 90, 0.72);
  --sidebar-faint: rgba(98, 105, 115, 0.6);
  --sidebar-accent: rgba(15, 23, 42, 0.7);
  --sidebar-accent-strong: rgba(15, 23, 42, 0.9);
  --sidebar-glow: rgba(15, 23, 42, 0.12);
  --sidebar-line: rgba(15, 23, 42, 0.07);
  --sidebar-panel: rgba(244, 247, 251, 0.72);
  --sidebar-card: rgba(255, 255, 255, 0.78);
  --sidebar-card-strong: rgba(255, 255, 255, 0.86);
  --sidebar-shadow: 0 26px 68px rgba(15, 23, 42, 0.22);
  --sidebar-shadow-soft: 0 10px 22px rgba(15, 23, 42, 0.08);
  --sidebar-ease: cubic-bezier(0.16, 1, 0.3, 1);
  font-family: "Manrope", "Sora", system-ui, sans-serif;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-expanded) !important;
  min-width: var(--sidebar-expanded) !important;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  background: transparent !important;
  border: none !important;
  border-right: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  pointer-events: auto;
  z-index: 5;
  transition: width 360ms var(--sidebar-ease), padding 360ms var(--sidebar-ease);
  animation: none;
  will-change: width;
}

.copilot-sidebar.meera-sidebar.is-closed {
  width: var(--sidebar-collapsed) !important;
  min-width: var(--sidebar-collapsed) !important;
  padding: 0 !important;
}

.meera-sidebar-inner {
  height: 100vh;
  border-radius: var(--sidebar-radius);
  background:
    radial-gradient(circle at 18% 0%, rgba(255, 255, 255, 0.82), rgba(241, 244, 248, 0.7) 55%),
    linear-gradient(180deg, rgba(247, 249, 252, 0.72) 0%, rgba(238, 242, 246, 0.66) 100%);
  border: 1px solid var(--sidebar-border);
  box-shadow:
    var(--sidebar-shadow),
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    inset 0 -1px 0 rgba(15, 23, 42, 0.05);
  backdrop-filter: blur(14px) saturate(1.08);
  -webkit-backdrop-filter: blur(14px) saturate(1.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  overflow: hidden;
  color: var(--sidebar-text);
}

.meera-sidebar.is-closed .meera-sidebar-inner {
  padding: 10px 8px;
}

.meera-sidebar-inner::before,
.meera-sidebar-inner::after {
  display: none;
}

.meera-sidebar-inner > * {
  position: relative;
  z-index: 1;
}

.meera-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.meera-logo-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  color: inherit;
  padding: 6px 8px;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 240ms var(--sidebar-ease);
  position: relative;
}

.meera-logo-btn:hover {
  transform: translateY(-1px) scale(1.01);
}

.meera-logo-orb {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: none;
  animation: meeraOrb 5s ease-in-out infinite;
  transition: transform 240ms var(--sidebar-ease);
}

.meera-logo-img {
  width: 18px;
  height: 18px;
  filter: none;
}

.meera-title {
  font-family: "Sora", "Manrope", system-ui, sans-serif;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.02em;
  text-shadow: none;
  animation: meeraGlow 6s ease-in-out infinite;
}

.meera-collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.16);
  background: rgba(247, 248, 250, 0.9);
  color: var(--sidebar-text);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform 200ms var(--sidebar-ease), border-color 200ms var(--sidebar-ease), box-shadow 200ms var(--sidebar-ease);
}

.meera-collapse-btn:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 23, 42, 0.25);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
}

.meera-collapse-btn .material-symbols-outlined {
  font-size: 18px;
  transition: transform 220ms var(--sidebar-ease);
}

.meera-sidebar.is-closed .meera-collapse-btn .material-symbols-outlined {
  transform: rotate(180deg);
}

.meera-primary {
  display: grid;
  gap: 8px;
  padding: 8px;
  border-radius: 16px;
  background: var(--sidebar-panel);
  border: 1px solid var(--sidebar-line);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 8px 16px rgba(15, 23, 42, 0.06);
}

.meera-action-btn {
  height: 44px;
  padding: 8px 12px;
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.05);
  background: linear-gradient(160deg, var(--sidebar-card-strong), rgba(239, 243, 248, 0.92));
  color: inherit;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  box-shadow:
    var(--sidebar-shadow-soft),
    0 2px 6px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: transform 240ms var(--sidebar-ease), box-shadow 240ms var(--sidebar-ease), border-color 240ms var(--sidebar-ease);
  position: relative;
  will-change: transform, box-shadow;
}

.meera-action-btn .meera-label {
  font-size: 12.5px;
}

.meera-action-btn:hover {
  transform: translateY(-3px) scale(1.015);
  box-shadow:
    0 18px 38px rgba(15, 23, 42, 0.16),
    0 8px 16px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  border-color: rgba(15, 23, 42, 0.1);
}

.meera-action-btn:active {
  transform: translateY(1px) scale(0.99);
  box-shadow:
    0 10px 20px rgba(15, 23, 42, 0.12),
    inset 0 2px 6px rgba(15, 23, 42, 0.1);
}

.meera-action-icon {
  width: 26px;
  height: 26px;
  border-radius: 9px;
  background: rgba(232, 236, 242, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
  display: grid;
  place-items: center;
  transition: transform 200ms var(--sidebar-ease);
}

.meera-action-icon .material-symbols-outlined {
  color: var(--sidebar-text);
  font-size: 16px;
}

.meera-action-icon .material-symbols-outlined {
  font-size: 18px;
}

.meera-action-btn:hover .meera-action-icon {
  transform: scale(1.05);
}

.meera-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meera-section + .meera-section {
  padding-top: 8px;
  border-top: 1px solid var(--sidebar-line);
}

.meera-section + .meera-conversations {
  padding-top: 0;
  border-top: none;
}

.meera-section-title {
  font-size: 10px;
  letter-spacing: 0.24em;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--sidebar-faint);
}

.meera-subtitle {
  font-size: 11px;
  color: var(--sidebar-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.meera-empty {
  font-size: 12px;
  color: var(--sidebar-muted);
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--sidebar-line);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.meera-project-list {
  display: grid;
  gap: 6px;
  padding: 6px;
  border-radius: 14px;
  background: var(--sidebar-panel);
  border: 1px solid var(--sidebar-line);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.meera-project-item {
  border: 1px solid rgba(15, 23, 42, 0.05);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  padding: 8px 10px;
  color: inherit;
  text-align: left;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  font-size: 12.5px;
  box-shadow:
    0 8px 18px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: border-color 200ms var(--sidebar-ease), transform 200ms var(--sidebar-ease), box-shadow 200ms var(--sidebar-ease);
}

.meera-project-item:hover {
  border-color: rgba(15, 23, 42, 0.1);
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 16px 30px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.meera-project-item.active {
  border-color: rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.98);
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.16),
    inset 3px 0 0 rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.96);
}

.meera-project-item.active .meera-project-meta {
  color: rgba(15, 23, 42, 0.7);
}

.meera-project-item.meera-project-create {
  border-style: dashed;
  border-color: rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.75);
}

.meera-project-meta {
  font-size: 10px;
  color: var(--sidebar-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.meera-conversations {
  flex: 1;
  min-height: 0;
  padding: 8px;
  border-radius: 16px;
  background: var(--sidebar-panel);
  border: 1px solid var(--sidebar-line);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85);
}

.meera-conv-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
  padding: 4px;
  padding-right: 6px;
  margin-right: -6px;
  scroll-behavior: smooth;
}

.meera-conv-list::-webkit-scrollbar {
  width: 8px;
}

.meera-conv-list::-webkit-scrollbar-track {
  background: transparent;
}

.meera-conv-list::-webkit-scrollbar-thumb {
  background: rgba(120, 124, 134, 0.32);
  border-radius: 999px;
}

.meera-conv-list:not(:hover)::-webkit-scrollbar-thumb {
  background: transparent;
}

.meera-conv-list {
  scrollbar-width: thin;
  scrollbar-color: rgba(120, 124, 134, 0.32) transparent;
}

.meera-conv-list:not(:hover) {
  scrollbar-color: transparent transparent;
}

.meera-sidebar .session-row.session-row-sidebar {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(241, 244, 248, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    inset 0 -2px 6px rgba(15, 23, 42, 0.08),
    0 3px 8px rgba(15, 23, 42, 0.24);
  transition: background 200ms var(--sidebar-ease), transform 200ms var(--sidebar-ease), box-shadow 200ms var(--sidebar-ease);
}

/* Neutralize global sidebar accents from styles.css */
.meera-sidebar .session-row-sidebar,
.meera-sidebar .session-row-sidebar:hover,
.meera-sidebar .session-row-sidebar:focus-within,
.meera-sidebar .session-row-sidebar.session-row-active,
.meera-sidebar .session-row-sidebar.session-row-active:hover {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.97), rgba(241, 244, 248, 0.94)) !important;
  border: 1px solid rgba(15, 23, 42, 0.06) !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    inset 0 -2px 6px rgba(15, 23, 42, 0.08),
    0 3px 8px rgba(15, 23, 42, 0.24) !important;
}

.meera-sidebar .session-row-sidebar:focus-within {
  outline: 2px solid rgba(120, 124, 134, 0.5) !important;
  outline-offset: 2px;
}

.meera-sidebar .session-row-sidebar .session-row-icon {
  background: rgba(230, 234, 240, 0.85) !important;
  border: 1px solid rgba(15, 23, 42, 0.06) !important;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.95) !important;
  color: var(--sidebar-text) !important;
}

.meera-sidebar .session-row-sidebar:hover .session-row-icon {
  transform: scale(1.03);
  box-shadow:
    0 12px 20px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.98) !important;
}

.meera-sidebar .session-row.session-row-sidebar:hover,
.meera-sidebar .session-row.session-row-sidebar:focus-within {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(238, 242, 247, 0.95));
  transform: translateY(-1px) scale(1.004);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    inset 0 -2px 8px rgba(15, 23, 42, 0.1),
    0 5px 12px rgba(15, 23, 42, 0.3);
}

.meera-sidebar .session-row-main {
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 6px 4px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  cursor: pointer;
}

.meera-sidebar .session-row-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgba(230, 234, 240, 0.85);
  border: 1px solid rgba(15, 23, 42, 0.06);
  display: grid;
  place-items: center;
  color: var(--sidebar-text);
  font-size: 16px;
}

.meera-sidebar .session-row-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.meera-sidebar .session-row-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--sidebar-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meera-sidebar .session-row-meta {
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(98, 105, 115, 0.72);
}

.meera-sidebar .session-row-active {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.99), rgba(238, 242, 247, 0.96));
  border-color: rgba(15, 23, 42, 0.08);
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.14),
    inset 3px 0 0 rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.meera-sidebar .session-row-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateX(8px);
  transition: opacity 200ms var(--sidebar-ease), transform 200ms var(--sidebar-ease);
  pointer-events: none;
}

.meera-sidebar .session-row.session-row-sidebar:hover .session-row-actions,
.meera-sidebar .session-row.session-row-sidebar:focus-within .session-row-actions {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.meera-sidebar .session-row-action {
  width: 26px;
  height: 26px;
  border-radius: 9px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: var(--sidebar-card);
  color: var(--sidebar-muted);
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow:
    0 6px 12px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: transform 160ms var(--sidebar-ease), box-shadow 160ms var(--sidebar-ease), color 160ms var(--sidebar-ease);
}

.meera-sidebar .session-row-action .material-symbols-outlined {
  font-size: 14px;
}

.meera-sidebar .session-row-action:hover {
  transform: translateY(-1px) scale(1.04);
  box-shadow:
    0 10px 18px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  color: var(--sidebar-text);
}

.meera-sidebar .session-row-edit {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-radius: 12px;
  background: var(--sidebar-card);
  border: 1px solid rgba(15, 23, 42, 0.06);
}

.meera-sidebar .session-row-input {
  flex: 1;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.16);
  background: rgba(255, 255, 255, 0.95);
  color: var(--sidebar-text);
  padding: 6px 10px;
}

.meera-profile {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meera-profile-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 16px;
  background: var(--sidebar-card);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow:
    0 12px 26px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 200ms var(--sidebar-ease), box-shadow 200ms var(--sidebar-ease);
}

.meera-profile-card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 18px 36px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.meera-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(226, 232, 240, 0.85));
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
  overflow: hidden;
}

.meera-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meera-profile-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meera-profile-name {
  font-weight: 600;
  font-size: 12.5px;
}

.meera-profile-meta {
  font-size: 10.5px;
  color: var(--sidebar-muted);
}

.meera-profile-btn {
  height: 38px;
  padding: 6px 10px;
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  background: var(--sidebar-card);
  color: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow:
    0 10px 22px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition: transform 200ms var(--sidebar-ease), box-shadow 200ms var(--sidebar-ease);
}

.meera-profile-btn .meera-label {
  font-size: 12px;
}

.meera-profile-btn:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.meera-label {
  transition: opacity 220ms var(--sidebar-ease), transform 220ms var(--sidebar-ease);
}

.meera-ripple {
  position: relative;
  overflow: hidden;
  isolation: isolate;
}

.meera-ripple-effect {
  position: absolute;
  border-radius: 999px;
  transform: scale(0);
  opacity: 0.8;
  background: rgba(15, 23, 42, 0.12);
  animation: meeraRipple 600ms ease-out;
  pointer-events: none;
  mix-blend-mode: screen;
}

.meera-sidebar.is-closed .meera-label,
.meera-sidebar.is-closed .meera-section-title,
.meera-sidebar.is-closed .meera-empty,
.meera-sidebar.is-closed .meera-profile-details,
.meera-sidebar.is-closed .meera-project-meta,
.meera-sidebar.is-closed .meera-subtitle,
.meera-sidebar.is-closed .session-row-copy,
.meera-sidebar.is-closed .session-row-meta {
  opacity: 0;
  transform: translateX(-8px);
  pointer-events: none;
}

.meera-sidebar.is-closed .meera-action-btn,
.meera-sidebar.is-closed .meera-profile-btn {
  justify-content: center;
  padding: 10px;
}

.meera-sidebar.is-closed .meera-project-item {
  justify-content: center;
}

.meera-sidebar.is-closed .meera-section:not(.meera-conversations) {
  display: none;
}

.meera-sidebar.is-closed .meera-conversations {
  margin-top: 6px;
}

.meera-sidebar.is-closed .meera-profile-card {
  justify-content: center;
  padding: 10px;
}

.meera-sidebar.is-closed .session-row-actions {
  display: none;
}

.meera-sidebar.is-closed .session-row-main {
  justify-content: center;
}

.meera-sidebar.is-closed .meera-conv-list {
  gap: 6px;
}

.meera-sidebar.is-closed .session-row.session-row-sidebar {
  padding: 4px;
}

.meera-sidebar.is-closed .session-row-main {
  padding: 6px;
}

.meera-sidebar.is-closed .has-tooltip::after {
  content: attr(data-label);
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%) translateX(-4px);
  background: rgba(14, 18, 26, 0.92);
  color: var(--sidebar-text);
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 6px 10px;
  border-radius: 10px;
  font-size: 12px;
  letter-spacing: 0.02em;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms var(--sidebar-ease), transform 180ms var(--sidebar-ease);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35);
  z-index: 10;
}

.meera-sidebar.is-closed .has-tooltip:hover::after {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.meera-sidebar .meera-logo-btn:focus-visible,
.meera-sidebar .meera-collapse-btn:focus-visible,
.meera-sidebar .meera-action-btn:focus-visible,
.meera-sidebar .meera-project-item:focus-visible,
.meera-sidebar .session-row-main:focus-visible,
.meera-sidebar .session-row-action:focus-visible,
.meera-sidebar .meera-profile-btn:focus-visible {
  outline: 2px solid rgba(148, 163, 184, 0.9);
  outline-offset: 2px;
}

@keyframes meeraRipple {
  to {
    transform: scale(1);
    opacity: 0;
  }
}

@keyframes meeraOrb {
  0%,
  100% {
    box-shadow: 0 10px 22px rgba(15, 23, 42, 0.18), 0 0 14px rgba(255, 255, 255, 0.35);
  }
  50% {
    box-shadow: 0 16px 30px rgba(15, 23, 42, 0.22), 0 0 26px rgba(255, 255, 255, 0.5);
  }
}

@keyframes meeraGlow {
  0%,
  100% {
    text-shadow: 0 0 8px rgba(15, 23, 42, 0.12);
  }
  50% {
    text-shadow: 0 0 16px rgba(15, 23, 42, 0.18);
  }
}

/* Sidebar refresh: bumped, equal-sized buttons with aligned layout (no drop shadows) */
.copilot-sidebar.meera-sidebar {
  --sidebar-btn-height: 44px;
  --sidebar-btn-radius: 14px;
  --sidebar-btn-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.72), rgba(232, 238, 245, 0.62));
  --sidebar-btn-border: rgba(15, 23, 42, 0.12);
  --sidebar-btn-inset: inset 0 1px 0 rgba(255, 255, 255, 0.95), inset 0 -1px 0 rgba(15, 23, 42, 0.08);
  --sidebar-btn-press: inset 0 2px 6px rgba(15, 23, 42, 0.12);
  --sidebar-icon-size: 30px;
  --sidebar-mini-size: 28px;
}

.meera-sidebar .meera-primary,
.meera-sidebar .meera-project-list,
.meera-sidebar .meera-conversations {
  background: rgba(255, 255, 255, 0.5) !important;
  box-shadow: none !important;
  backdrop-filter: blur(10px) saturate(1.05) !important;
  -webkit-backdrop-filter: blur(10px) saturate(1.05) !important;
}

.meera-sidebar .meera-action-btn,
.meera-sidebar .meera-project-item,
.meera-sidebar .meera-profile-btn,
.meera-sidebar .session-row.session-row-sidebar {
  min-height: var(--sidebar-btn-height);
  border-radius: var(--sidebar-btn-radius);
  background: var(--sidebar-btn-bg);
  border: 1px solid var(--sidebar-btn-border);
  box-shadow: var(--sidebar-btn-inset);
  backdrop-filter: blur(8px) saturate(1.03);
  -webkit-backdrop-filter: blur(8px) saturate(1.03);
  transform: none !important;
  transition: background 180ms var(--sidebar-ease), border-color 180ms var(--sidebar-ease), box-shadow 180ms var(--sidebar-ease), color 180ms var(--sidebar-ease);
}

.meera-sidebar .meera-action-btn,
.meera-sidebar .meera-profile-btn {
  height: var(--sidebar-btn-height);
  padding: 0 12px;
  display: grid;
  grid-template-columns: var(--sidebar-icon-size) 1fr;
  align-items: center;
  gap: 10px;
}

.meera-sidebar .meera-project-item {
  height: var(--sidebar-btn-height);
  padding: 0 12px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
}

.meera-sidebar .meera-project-item.active {
  border-color: rgba(15, 23, 42, 0.2);
  background: var(--sidebar-btn-bg);
  box-shadow:
    inset 3px 0 0 rgba(15, 23, 42, 0.2),
    var(--sidebar-btn-inset);
}

.meera-sidebar .meera-project-item.meera-project-create {
  border-style: dashed;
  border-color: rgba(15, 23, 42, 0.22);
}

.meera-sidebar .session-row.session-row-sidebar {
  height: var(--sidebar-btn-height);
  padding: 0 8px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    inset 0 -2px 6px rgba(15, 23, 42, 0.08),
    0 3px 8px rgba(15, 23, 42, 0.24) !important;
  background: var(--sidebar-btn-bg) !important;
  border: 1px solid transparent !important;
}

.meera-sidebar .session-row.session-row-sidebar:hover,
.meera-sidebar .session-row.session-row-sidebar:focus-within,
.meera-sidebar .session-row-sidebar.session-row-active,
.meera-sidebar .session-row-sidebar.session-row-active:hover {
  transform: none !important;
  background: var(--sidebar-btn-bg) !important;
  border-color: transparent !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    inset 0 -2px 8px rgba(15, 23, 42, 0.1),
    0 5px 12px rgba(15, 23, 42, 0.3) !important;
}

.meera-sidebar .meera-action-btn:hover,
.meera-sidebar .meera-project-item:hover,
.meera-sidebar .meera-profile-btn:hover {
  transform: none !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(236, 241, 248, 0.96));
  border-color: rgba(15, 23, 42, 0.18);
  box-shadow: var(--sidebar-btn-inset);
}

.meera-sidebar .meera-action-btn:active,
.meera-sidebar .meera-project-item:active,
.meera-sidebar .meera-profile-btn:active {
  box-shadow: var(--sidebar-btn-press);
}

.meera-sidebar .meera-action-icon,
.meera-sidebar .session-row-icon {
  width: var(--sidebar-icon-size);
  height: var(--sidebar-icon-size);
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(230, 236, 243, 0.94));
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: var(--sidebar-btn-inset);
  display: grid;
  place-items: center;
}

.meera-sidebar .meera-action-btn:hover .meera-action-icon,
.meera-sidebar .session-row.session-row-sidebar:hover .session-row-icon {
  transform: none;
  box-shadow: var(--sidebar-btn-inset);
}

.meera-sidebar .session-row-action {
  width: var(--sidebar-mini-size);
  height: var(--sidebar-mini-size);
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: var(--sidebar-btn-bg);
  box-shadow: var(--sidebar-btn-inset);
  transform: none !important;
}

.meera-sidebar .session-row-action:hover {
  transform: none !important;
  box-shadow: var(--sidebar-btn-inset);
  color: var(--sidebar-text);
}

.meera-sidebar .meera-profile-card {
  box-shadow: var(--sidebar-btn-inset);
  border: 1px solid var(--sidebar-btn-border);
  background: var(--sidebar-btn-bg);
  transform: none !important;
}

.meera-sidebar .meera-profile-card:hover {
  transform: none !important;
  box-shadow: var(--sidebar-btn-inset);
}

.meera-sidebar .meera-collapse-btn {
  background: var(--sidebar-btn-bg);
  border: 1px solid var(--sidebar-btn-border);
  box-shadow: var(--sidebar-btn-inset);
  transform: none !important;
}

.meera-sidebar .meera-collapse-btn:hover {
  transform: none !important;
  box-shadow: var(--sidebar-btn-inset);
}

/* Conversation block refresh */
.meera-sidebar .meera-conversations {
  padding: 12px;
  border-radius: 18px;
  background: var(--sidebar-panel);
  border: 1px solid var(--sidebar-line);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.meera-sidebar .meera-conv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.meera-sidebar .meera-conv-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meera-sidebar .meera-conv-count {
  min-width: 24px;
  height: 20px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 10px;
  color: var(--sidebar-text);
  background: rgba(15, 23, 42, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.meera-sidebar .meera-conv-search {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: rgba(255, 255, 255, 0.85);
  color: var(--sidebar-text);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.meera-sidebar .meera-conv-search:hover {
  border-color: rgba(15, 23, 42, 0.16);
}

.meera-sidebar .meera-conv-search .material-symbols-outlined {
  font-size: 16px;
}

.meera-sidebar .meera-conv-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  padding: 4px 6px;
}

.meera-sidebar .meera-conv-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meera-sidebar .meera-conv-group-title {
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--sidebar-faint);
  padding-left: 4px;
}

.meera-sidebar .meera-conv-group-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meera-sidebar .meera-conv-empty {
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  color: var(--sidebar-muted);
  border: 1px dashed rgba(15, 23, 42, 0.12);
}

.meera-sidebar .session-row.session-row-sidebar {
  height: auto;
  min-height: 44px;
  padding: 7px 10px;
  align-items: flex-start;
}

.meera-sidebar .session-row-main {
  align-items: flex-start;
  padding: 4px 0;
  gap: 0;
}

.meera-sidebar .session-row-copy {
  gap: 4px;
}

.meera-sidebar .session-row-title {
  font-size: 13px;
  font-weight: 700;
}

.meera-sidebar .session-row-preview {
  font-size: 11px;
  color: var(--sidebar-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meera-sidebar .session-row-meta {
  font-size: 9.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--sidebar-faint);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meera-sidebar .session-row-actions {
  margin-top: 2px;
}

.meera-sidebar .session-row-icon {
  display: none;
}

@media (prefers-reduced-motion: reduce) {
  .copilot-sidebar.meera-sidebar,
  .meera-sidebar * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

const isDesktopRuntime =
  typeof window !== "undefined" &&
  Boolean((window as { meera?: { windowControls?: { minimize: () => void; maximize: () => void; close: () => void } } }).meera
    ?.windowControls);
const isDesktopDevRuntime = isDesktopRuntime && import.meta.env.DEV;
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: ReturnType<typeof getAuth> | null = null;

const applyAuthPersistence = async (auth: ReturnType<typeof getAuth>) => {
  try {
    await setPersistence(auth, isDesktopRuntime && !isDesktopDevRuntime ? inMemoryPersistence : browserLocalPersistence);
  } catch {
    // ignore persistence errors
  }
  if (!isDesktopRuntime || isDesktopDevRuntime) {
    return;
  }
  try {
    await signOut(auth);
  } catch {
    // ignore sign-out errors
  }
  try {
    if (typeof localStorage !== "undefined") {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("firebase:")) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch {
    // ignore storage cleanup errors
  }
  try {
    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase("firebaseLocalStorageDb");
      indexedDB.deleteDatabase("firebaseLocalStorage");
    }
  } catch {
    // ignore indexedDB cleanup errors
  }
};

const initFirebaseAuth = (config: FirebaseConfig): ReturnType<typeof getAuth> => {
  if (!firebaseApp) {
    firebaseApp = initializeApp(config as FirebaseOptions);
    firebaseAuth = getAuth(firebaseApp);
    void applyAuthPersistence(firebaseAuth);
  }
  return firebaseAuth as ReturnType<typeof getAuth>;
};

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const microsoftProvider = new OAuthProvider("microsoft.com");

const MAX_HISTORY = 50;
const MAX_CONTEXT_MESSAGES = 12;
const MAX_SESSION_TITLE_LENGTH = 56;
const MAX_SESSION_PREVIEW_LENGTH = 120;
const DEFAULT_SESSION_NAME = "New conversation";
const DEFAULT_WALLPAPER_ID: WallpaperPresetId = "wallpaper-1";
const WALLPAPER_BASE_PATH = `${import.meta.env.BASE_URL}backgrounds/`;

const WALLPAPER_PRESETS: Array<{ id: WallpaperPresetId; label: string; blurb: string; src: string }> = Array.from(
  { length: 10 },
  (_, index) => {
    const number = index + 1;
    return {
      id: `wallpaper-${number}` as WallpaperPresetId,
      label: `Image ${number}`,
      blurb: number === 1 ? "Default background image." : `Background image ${number}.`,
      src: `${WALLPAPER_BASE_PATH}${number}.jpg`,
    };
  },
);

const OVERLAY_PRESETS: Record<OverlayMode, { label: string; opacity: number }> = {
  balanced: { label: "Balanced", opacity: 0.35 },
  soft: { label: "Soft", opacity: 0.2 },
  dim: { label: "Dim", opacity: 0.5 },
};

const SETTINGS_SECTIONS = [
  {
    id: "about",
    label: "About",
    icon: "about.svg",
    meta: "What MeeraAI is",
    description: "Platform vision, privacy, and the tech behind MeeraAI.",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: "ruler.svg",
    meta: "Glass, clarity, contrast",
    description: "Fine-tune the premium glass and visual clarity.",
  },
  {
    id: "models",
    label: "Models",
    icon: "statistics.svg",
    meta: "Choose your engine",
    description: "Select the model that matches your speed and quality needs.",
  },
  {
    id: "wallpaper",
    label: "Wallpaper",
    icon: "picture.svg",
    meta: "Backgrounds & imports",
    description: "Pick, preview, and import wallpapers.",
  },
  {
    id: "assistant",
    label: "Assistant",
    icon: "assistant.svg",
    meta: "Behavior controls",
    description: "Streaming, scrolling, and response behavior.",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "alarm_clock.svg",
    meta: "Sounds & banners",
    description: "Control alerts, sounds, and subtle cues.",
  },
  {
    id: "account",
    label: "Account",
    icon: "contacts.svg",
    meta: "Profile & sync",
    description: "Sign-in status and device sync preferences.",
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    icon: "key.svg",
    meta: "Keyboard controls",
    description: "Rebind your most-used commands.",
  },
] as const;

type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];
type SettingsSearchField = "label" | "meta";
type SettingsSearchMatch = { field: SettingsSearchField; start: number; end: number };
type SettingsSearchResult = {
  section: (typeof SETTINGS_SECTIONS)[number];
  score: number;
  index: number;
  match?: SettingsSearchMatch;
};

const SHORTCUT_ACTIONS = [
  {
    id: "open_settings",
    label: "Open settings",
    description: "Toggle the Control Center.",
    defaultKeys: "mod+,",
  },
  {
    id: "settings_search",
    label: "Search settings",
    description: "Focus the settings search field.",
    defaultKeys: "mod+f",
  },
  {
    id: "settings_models",
    label: "Jump to Models",
    description: "Open settings to the Models tab.",
    defaultKeys: "mod+shift+m",
  },
  {
    id: "settings_wallpaper",
    label: "Jump to Wallpaper",
    description: "Open settings to the Wallpaper tab.",
    defaultKeys: "mod+shift+w",
  },
  {
    id: "toggle_sidebar",
    label: "Toggle sidebar",
    description: "Show or hide the conversation list.",
    defaultKeys: "mod+b",
  },
  {
    id: "new_chat",
    label: "New chat",
    description: "Start a fresh conversation.",
    defaultKeys: "mod+n",
  },
  {
    id: "search_chats",
    label: "Search chats",
    description: "Find a conversation from anywhere.",
    defaultKeys: "mod+shift+f",
  },
  {
    id: "focus_chat",
    label: "Focus chat input",
    description: "Jump to the chat composer.",
    defaultKeys: "mod+k",
  },
  {
    id: "settings_prev",
    label: "Previous settings section",
    description: "Move up in the settings list.",
    defaultKeys: "arrowup",
  },
  {
    id: "settings_next",
    label: "Next settings section",
    description: "Move down in the settings list.",
    defaultKeys: "arrowdown",
  },
] as const;

type ShortcutActionId = (typeof SHORTCUT_ACTIONS)[number]["id"];

const DEFAULT_SHORTCUTS = SHORTCUT_ACTIONS.reduce(
  (acc, action) => {
    acc[action.id] = action.defaultKeys;
    return acc;
  },
  {} as Record<ShortcutActionId, string>,
);

const normalizeShortcutKey = (value: string) => {
  if (!value) {
    return "";
  }
  const lowered = value.toLowerCase();
  if (lowered === " ") {
    return "space";
  }
  return lowered;
};

const shortcutUsesModifier = (binding: string) => binding.includes("mod") || binding.includes("alt") || binding.includes("shift");

const formatShortcutLabel = (binding: string, isMac: boolean) => {
  if (!binding) {
    return "Unassigned";
  }
  const parts = binding.split("+").filter(Boolean);
  const formatted = parts.map((part) => {
    if (part === "mod") {
      return isMac ? "Cmd" : "Ctrl";
    }
    if (part === "alt") {
      return isMac ? "Option" : "Alt";
    }
    if (part === "shift") {
      return "Shift";
    }
    if (part === "arrowup") {
      return "↑";
    }
    if (part === "arrowdown") {
      return "↓";
    }
    if (part === "arrowleft") {
      return "←";
    }
    if (part === "arrowright") {
      return "→";
    }
    if (part === "space") {
      return "Space";
    }
    if (part.length === 1) {
      return part.toUpperCase();
    }
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
  return formatted.join(" + ");
};

const isShortcutMatch = (binding: string, event: KeyboardEvent, isMac: boolean) => {
  if (!binding) {
    return false;
  }
  const parts = binding.split("+").filter(Boolean);
  const expected = {
    mod: parts.includes("mod"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    key: normalizeShortcutKey(parts.find((part) => !["mod", "alt", "shift"].includes(part)) ?? ""),
  };
  if (!expected.key) {
    return false;
  }
  const modPressed = isMac ? event.metaKey : event.ctrlKey;
  if (expected.mod !== modPressed) {
    return false;
  }
  if (expected.alt !== event.altKey) {
    return false;
  }
  if (expected.shift !== event.shiftKey) {
    return false;
  }
  const key = normalizeShortcutKey(event.key);
  return key === expected.key;
};

const MODEL_OPTIONS = [
  {
    id: "meera-lite-1b",
    label: "Meera Lite",
    params: "1.1B",
    blurb: "TinyLlama chat tuned for speed and low memory use.",
    requiresAuth: false,
  },
  {
    id: "meera-core-3b",
    label: "Meera Core",
    params: "3B",
    blurb: "Qwen 2.5 3B tuned for balanced reasoning and everyday depth.",
    requiresAuth: false,
  },
  {
    id: "meera-pro-4b",
    label: "Meera Pro",
    params: "4B",
    blurb: "Qwen 3 4B Instruct for richer answers and stronger instruction following.",
    requiresAuth: false,
  },
  {
    id: "meera-max-6b",
    label: "Meera Max",
    params: "6B",
    blurb: "Yi 6B Chat with 4-bit quantization for strong depth.",
    requiresAuth: false,
  },
  {
    id: "meera-ultra-8b",
    label: "Meera Ultra",
    params: "8B",
    blurb: "Beagle 8B tuned for maximum reasoning depth.",
    requiresAuth: true,
  },
] as const;

type ModelOptionId = (typeof MODEL_OPTIONS)[number]["id"];

const getBundledModelIds = (id: string | null | undefined): string[] => {
  return id ? [id] : [];
};

const resolveModelLabel = (id: string): string => MODEL_OPTIONS.find((option) => option.id === id)?.label ?? id;

const formatLabelList = (labels: string[]): string => {
  if (labels.length <= 1) {
    return labels[0] ?? "";
  }
  if (labels.length === 2) {
    return `${labels[0]} and ${labels[1]}`;
  }
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
};

const HOME_SUGGESTIONS = [
  "Draft a client email",
  "Analyze a dataset",
  "Summarize a report",
  "Generate product copy",
  "Plan a sprint",
];

const QUICK_ACTIONS = [
  "Write a first draft",
  "Get advice",
  "Learn something new",
];

const WORLD_CLOCKS = [
  { label: "UTC", zone: "UTC" },
  { label: "New York", zone: "America/New_York" },
  { label: "Tokyo", zone: "Asia/Tokyo" },
];

const AUTO_SESSION_NAME_PATTERN = /^(session\s+\d+|new\s+chat|new\s+conversation)$/i;

function parseJsonSafe<T>(raw: string | null): T | null {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || Number.isNaN(bytes)) {
    return "Unknown";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[unitIndex]}`;
}

function formatModelStorage(model: Pick<ModelStatus, "size_bytes" | "local_bytes" | "download">): string {
  const downloadBytes = model.download?.total_bytes ?? 0;
  if (downloadBytes >= 1024 * 1024) {
    return formatBytes(downloadBytes);
  }
  if (model.size_bytes >= 1024 * 1024) {
    return formatBytes(model.size_bytes);
  }
  const localBytes = model.local_bytes ?? 0;
  if (localBytes >= 1024 * 1024) {
    return formatBytes(localBytes);
  }
  return "Fetched at download time";
}

function formatAuthError(err: unknown, providerId?: string): string {
  const fallback = err instanceof Error ? err.message : "Authentication failed.";
  if (!err || typeof err !== "object") {
    return fallback.replace(/Firebase/gi, "MeeraAI");
  }

  const code = (err as { code?: string }).code;
  if (!code) {
    return fallback.replace(/Firebase/gi, "MeeraAI");
  }

  if (code === "auth/configuration-not-found") {
    const providerLabel = providerId ? providerId.replace(".com", "") : "";
    const providerSuffix = providerLabel ? ` (${providerLabel})` : "";
    return `MeeraAI sign-in provider${providerSuffix} is not configured. Enable it in your Auth Console > Sign-in method and set the OAuth client ID/secret.`;
  }

  if (code === "auth/operation-not-allowed") {
    return "This sign-in method is disabled. Enable it in your Auth Console > Sign-in method.";
  }

  if (code === "auth/unauthorized-domain") {
    const origin = typeof window !== "undefined" ? window.location.origin : "this app's origin";
    return `This domain is not authorized. Add ${origin} in your Auth Console > Settings > Authorized domains.`;
  }

  if (code === "auth/invalid-credential") {
    return "Your sign-in credentials are invalid or expired. Please try again.";
  }

  if (code === "auth/email-already-in-use") {
    return "That email is already linked to another account.";
  }
  if (code === "auth/phone-number-already-exists") {
    return "That phone number is already linked to another account.";
  }
  if (code === "auth/credential-already-in-use") {
    return "That sign-in method is already linked to another account.";
  }
  if (code === "auth/invalid-phone-number") {
    return "Enter a valid phone number with country code.";
  }
  if (code === "auth/invalid-verification-code") {
    return "Invalid OTP code. Please try again.";
  }
  if (code === "auth/code-expired") {
    return "OTP expired. Request a new code.";
  }
  if (code === "auth/weak-password") {
    return "Password must be at least 6 characters.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Please wait and try again.";
  }
  if (code === "auth/requires-recent-login") {
    return "For security, please sign in again to update this setting.";
  }
  if (code === "auth/missing-phone-number") {
    return "Enter a phone number with country code to continue.";
  }

  return fallback.replace(/Firebase/gi, "MeeraAI");
}

function cleanAuthMessage(message: string): string {
  if (!message) {
    return "";
  }
  const firebaseMatch = message.match(/Firebase:\s*Error\s*\(([^)]+)\)/i);
  if (firebaseMatch) {
    return formatAuthError({ code: firebaseMatch[1] });
  }
  const authCodeMatch = message.match(/auth\/[a-z0-9-]+/i);
  if (authCodeMatch) {
    return formatAuthError({ code: authCodeMatch[0] });
  }
  return message.replace(/Firebase/gi, "MeeraAI");
}

function msgId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(16).slice(2)}`;
}

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function timestamp(): number {
  return Date.now();
}

function defaultAppearance(): AppearanceSettings {
  return {
    wallpaperId: DEFAULT_WALLPAPER_ID,
    customWallpaper: "",
    customWallpaperName: "",
    overlay: "balanced",
  };
}

function cleanTitleText(input: string): string {
  return input
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*_~]/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimSessionTitle(input: string): string {
  if (input.length <= MAX_SESSION_TITLE_LENGTH) {
    return input;
  }

  const sliced = input.slice(0, MAX_SESSION_TITLE_LENGTH + 1);
  return sliced.replace(/\s+\S*$/, "").trim();
}

function trimSessionPreview(input: string): string {
  if (input.length <= MAX_SESSION_PREVIEW_LENGTH) {
    return input;
  }

  const sliced = input.slice(0, MAX_SESSION_PREVIEW_LENGTH + 1);
  const trimmed = sliced.replace(/\s+\S*$/, "").trim();
  return trimmed ? `${trimmed}…` : trimmed;
}

function humanizeSessionTitle(input: string): string {
  const cleaned = cleanTitleText(input)
    .replace(/^(can you|could you|please|help me|i need|show me|tell me|write|create|make|give me|draft)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "");

  if (!cleaned) {
    return DEFAULT_SESSION_NAME;
  }

  const title = trimSessionTitle(cleaned);
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function deriveSessionTitle(messages: Message[]): string {
  const source =
    messages.find((message) => message.role === "user" && cleanTitleText(message.content)) ??
    messages.find((message) => cleanTitleText(message.content));

  if (!source) {
    return DEFAULT_SESSION_NAME;
  }

  const firstLine = source.content.split("\n").find((line) => cleanTitleText(line)) ?? source.content;
  return humanizeSessionTitle(firstLine);
}

const WEAK_HEADING_PATTERN =
  /^(hi|hello|hey|yo|ok|okay|thanks|thank you|test|testing|new conversation|new chat|chat|conversation)$/i;

function isWeakHeadingText(input: string): boolean {
  const cleaned = cleanTitleText(input).toLowerCase();
  if (!cleaned) {
    return true;
  }
  if (AUTO_SESSION_NAME_PATTERN.test(cleaned) || cleaned === DEFAULT_SESSION_NAME.toLowerCase()) {
    return true;
  }
  if (WEAK_HEADING_PATTERN.test(cleaned)) {
    return true;
  }
  const words = cleaned.split(" ");
  return words.length < 2 && cleaned.length < 8;
}

function pickMeaningfulHeading(messages: Message[]): string | null {
  const tryMessages = (list: Message[]) => {
    for (const message of list) {
      if (!message.content) {
        continue;
      }
      const lines = message.content.split("\n");
      for (const line of lines) {
        const cleaned = cleanTitleText(line);
        if (!cleaned) {
          continue;
        }
        const candidate = humanizeSessionTitle(cleaned);
        if (!isWeakHeadingText(candidate)) {
          return candidate;
        }
      }
    }
    return null;
  };

  const userMessages = messages.filter((message) => message.role === "user");
  return tryMessages(userMessages) ?? tryMessages(messages);
}

function deriveSessionHeading(session: Session): string {
  const rawName = session.name?.trim() ?? "";
  if (session.titleMode === "manual" && rawName) {
    return rawName;
  }

  const cleanedName = cleanTitleText(rawName);
  if (cleanedName && !isWeakHeadingText(cleanedName)) {
    return humanizeSessionTitle(cleanedName);
  }

  const fromMessages = pickMeaningfulHeading(session.messages);
  if (fromMessages) {
    return fromMessages;
  }

  return DEFAULT_SESSION_NAME;
}

function deriveSessionPreview(session: Session): string {
  const source =
    session.messages.find((message) => message.role === "user" && cleanTitleText(message.content)) ??
    session.messages.find((message) => cleanTitleText(message.content));

  if (!source) {
    return "No topic yet.";
  }

  const cleaned = cleanTitleText(source.content);
  if (!cleaned) {
    return "No topic yet.";
  }

  const normalizedTitle = cleanTitleText(deriveSessionHeading(session)).toLowerCase();
  const normalizedPreview = cleaned.toLowerCase();
  if (normalizedTitle && normalizedTitle === normalizedPreview) {
    return "";
  }

  const trimmed = trimSessionPreview(cleaned);
  if (!trimmed) {
    return "";
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function isGenericSessionName(name: string): boolean {
  return AUTO_SESSION_NAME_PATTERN.test(name.trim());
}

function createSessionRecord(sourceAppearance?: AppearanceSettings, projectId?: string | null): Session {
  const createdAt = timestamp();
  return {
    id: msgId(),
    name: DEFAULT_SESSION_NAME,
    titleMode: "auto",
    messages: [],
    actions: [],
    appearance: sourceAppearance ? { ...sourceAppearance } : defaultAppearance(),
    projectId: projectId ?? null,
    createdAt,
    updatedAt: createdAt,
  };
}

function syncAutoSessionName(session: Session): Session {
  if (session.titleMode === "manual") {
    return session;
  }

  return {
    ...session,
    name: deriveSessionTitle(session.messages),
  };
}

function sessionHasHistory(session: Session): boolean {
  return session.messages.some((message) => message.content.trim()) || session.actions.length > 0;
}

function hasSessionHistory(sessions: Session[]): boolean {
  return sessions.some(sessionHasHistory);
}

function sessionHasUserConversation(session: Session): boolean {
  return session.messages.some((message) => message.role === "user" && message.content.trim());
}

function formatRelativeTime(timeValue: number): string {
  const delta = Math.max(0, Date.now() - timeValue);
  const minutes = Math.round(delta / 60000);

  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function formatMessageCount(session: Session): string {
  const count = session.messages.filter((message) => message.content.trim()).length;
  return `${count} ${count === 1 ? "message" : "messages"}`;
}

function normalizeSession(input: unknown, index: number): Session {
  const fallback = createSessionRecord();

  if (!input || typeof input !== "object") {
    return fallback;
  }

  const record = input as Partial<Session>;
  const messages = Array.isArray(record.messages)
    ? record.messages.filter((item): item is Message => {
        if (!item || typeof item !== "object") {
          return false;
        }
        const candidate = item as { content?: unknown };
        return typeof candidate.content === "string";
      })
    : [];
  const titleMode: SessionTitleMode =
    record.titleMode === "manual" || record.titleMode === "auto"
      ? record.titleMode
      : typeof record.name === "string" && !isGenericSessionName(record.name)
        ? "manual"
        : "auto";

  const normalized: Session = {
    id: typeof record.id === "string" ? record.id : fallback.id,
    name: typeof record.name === "string" ? record.name : index === 0 ? DEFAULT_SESSION_NAME : fallback.name,
    titleMode,
    messages,
    actions: Array.isArray(record.actions) ? record.actions : [],
    appearance: record.appearance ? { ...defaultAppearance(), ...record.appearance } : fallback.appearance,
    projectId: typeof record.projectId === "string" ? record.projectId : null,
    createdAt: typeof record.createdAt === "number" ? record.createdAt : fallback.createdAt,
    updatedAt: typeof record.updatedAt === "number" ? record.updatedAt : typeof record.createdAt === "number" ? record.createdAt : fallback.updatedAt,
  };

  return syncAutoSessionName(normalized);
}

function getDesktopAppVisual(name: string, processName: string): { Icon: IconType; accent: string; bg: string; label: string } {
  const key = processName.toLowerCase();

  if (key.includes("code")) {
    return { Icon: VscCode, accent: "#53b7ff", bg: "linear-gradient(135deg, rgba(0, 120, 212, 0.34), rgba(56, 189, 248, 0.18))", label: "VS Code" };
  }
  if (key.includes("chrome")) {
    return { Icon: SiGooglechrome, accent: "#facc15", bg: "linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(234, 179, 8, 0.2))", label: "Chrome" };
  }
  if (key.includes("msedge") || key.includes("edge")) {
    return { Icon: FaEdge, accent: "#56e0d4", bg: "linear-gradient(135deg, rgba(15, 118, 110, 0.34), rgba(37, 99, 235, 0.18))", label: "Edge" };
  }
  if (key.includes("firefox")) {
    return { Icon: SiFirefoxbrowser, accent: "#fb923c", bg: "linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(99, 102, 241, 0.18))", label: "Firefox" };
  }
  if (key.includes("explorer")) {
    return { Icon: PiFolderOpenDuotone, accent: "#7dd3fc", bg: "linear-gradient(135deg, rgba(37, 99, 235, 0.26), rgba(96, 165, 250, 0.16))", label: "Explorer" };
  }
  if (key.includes("terminal") || key.includes("powershell") || key === "cmd") {
    return { Icon: RiTerminalWindowLine, accent: "#f8fafc", bg: "linear-gradient(135deg, rgba(51, 65, 85, 0.34), rgba(15, 23, 42, 0.2))", label: "Terminal" };
  }
  if (key.includes("settings") || key.includes("systemsettings")) {
    return { Icon: PiGearSixDuotone, accent: "#d8e1f8", bg: "linear-gradient(135deg, rgba(100, 116, 139, 0.34), rgba(51, 65, 85, 0.18))", label: "Settings" };
  }
  if (key.includes("discord")) {
    return { Icon: SiDiscord, accent: "#a5b4fc", bg: "linear-gradient(135deg, rgba(99, 102, 241, 0.34), rgba(79, 70, 229, 0.18))", label: "Discord" };
  }
  if (key.includes("slack")) {
    return { Icon: SiSlack, accent: "#f472b6", bg: "linear-gradient(135deg, rgba(219, 39, 119, 0.32), rgba(124, 58, 237, 0.18))", label: "Slack" };
  }
  if (key.includes("spotify")) {
    return { Icon: SiSpotify, accent: "#4ade80", bg: "linear-gradient(135deg, rgba(22, 163, 74, 0.34), rgba(5, 150, 105, 0.18))", label: "Spotify" };
  }
  if (key.includes("figma")) {
    return { Icon: SiFigma, accent: "#fb7185", bg: "linear-gradient(135deg, rgba(249, 115, 22, 0.34), rgba(236, 72, 153, 0.18))", label: "Figma" };
  }
  if (key.includes("notion")) {
    return { Icon: SiNotion, accent: "#f8fafc", bg: "linear-gradient(135deg, rgba(71, 85, 105, 0.34), rgba(15, 23, 42, 0.18))", label: "Notion" };
  }
  if (key.includes("obsidian")) {
    return { Icon: SiObsidian, accent: "#c4b5fd", bg: "linear-gradient(135deg, rgba(91, 33, 182, 0.34), rgba(59, 130, 246, 0.18))", label: "Obsidian" };
  }
  if (key.includes("telegram")) {
    return { Icon: SiTelegram, accent: "#7dd3fc", bg: "linear-gradient(135deg, rgba(14, 165, 233, 0.34), rgba(37, 99, 235, 0.18))", label: "Telegram" };
  }
  if (key.includes("whatsapp")) {
    return { Icon: SiWhatsapp, accent: "#86efac", bg: "linear-gradient(135deg, rgba(34, 197, 94, 0.34), rgba(13, 148, 136, 0.18))", label: "WhatsApp" };
  }
  if (key.includes("postman")) {
    return { Icon: SiPostman, accent: "#fdba74", bg: "linear-gradient(135deg, rgba(249, 115, 22, 0.34), rgba(234, 88, 12, 0.18))", label: "Postman" };
  }
  if (key.includes("docker")) {
    return { Icon: SiDocker, accent: "#7dd3fc", bg: "linear-gradient(135deg, rgba(14, 116, 144, 0.34), rgba(37, 99, 235, 0.18))", label: "Docker" };
  }
  if (key.includes("github")) {
    return { Icon: SiGithub, accent: "#e2e8f0", bg: "linear-gradient(135deg, rgba(71, 85, 105, 0.34), rgba(30, 41, 59, 0.18))", label: "GitHub" };
  }
  if (key.includes("windows") || key.includes("meera")) {
    return { Icon: FaWindows, accent: "#7dd3fc", bg: "linear-gradient(135deg, rgba(29, 78, 216, 0.34), rgba(14, 165, 233, 0.18))", label: name };
  }

  return {
    Icon: PiAppWindowDuotone,
    accent: "#e2e8f0",
    bg: "linear-gradient(135deg, rgba(71, 85, 105, 0.32), rgba(30, 41, 59, 0.16))",
    label: name,
  };
}

type SessionRowProps = {
  session: Session;
  active?: boolean;
  editing?: boolean;
  draftName?: string;
  preview: string;
  meta: string;
  variant: "card" | "sidebar";
  onOpen: () => void;
  onStartEdit: () => void;
  onDraftChange: (value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onRipple?: (event: React.PointerEvent<HTMLElement>) => void;
};

function SessionRow({
  session,
  active = false,
  editing = false,
  draftName = "",
  preview,
  meta,
  variant,
  onOpen,
  onStartEdit,
  onDraftChange,
  onCommitEdit,
  onCancelEdit,
  onDelete,
  onRipple,
}: SessionRowProps) {
  const showIcon = variant === "card";
  const displayTitle = variant === "sidebar" ? deriveSessionHeading(session) : session.name || DEFAULT_SESSION_NAME;
  return (
    <div className={`session-row session-row-${variant} ${active ? "session-row-active" : ""}`}>
      {editing ? (
        <div className="session-row-edit">
          <input
            className="session-row-input"
            value={draftName}
            autoFocus
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                onCommitEdit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                onCancelEdit();
              }
            }}
          />
          <button
            className="session-row-action meera-ripple"
            type="button"
            aria-label="Save title"
            onClick={onCommitEdit}
            onPointerDown={onRipple}
          >
            <PiCheck />
          </button>
          <button
            className="session-row-action meera-ripple"
            type="button"
            aria-label="Cancel rename"
            onClick={onCancelEdit}
            onPointerDown={onRipple}
          >
            <PiX />
          </button>
        </div>
      ) : (
        <>
          <button type="button" className="session-row-main meera-ripple" onClick={onOpen} onPointerDown={onRipple}>
            {showIcon && (
              <span className="session-row-icon material-symbols-outlined" aria-hidden="true">
                {SIDEBAR_ICON_NAMES.session}
              </span>
            )}
            <span className="session-row-copy">
              <span className="session-row-title">{displayTitle}</span>
              {preview ? <span className="session-row-preview">{preview}</span> : null}
              <span className="session-row-meta">{meta}</span>
            </span>
          </button>
          <div className="session-row-actions">
            <button
              className="session-row-action meera-ripple"
              type="button"
              aria-label="Rename chat"
              onClick={(event) => {
                event.stopPropagation();
                onStartEdit();
              }}
              onPointerDown={onRipple}
            >
              <span className="session-row-action-icon material-symbols-outlined" aria-hidden="true">
                {SIDEBAR_ICON_NAMES.edit}
              </span>
            </button>
            <button
              className="session-row-action meera-ripple"
              type="button"
              aria-label="Delete chat"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              onPointerDown={onRipple}
            >
              <span className="session-row-action-icon material-symbols-outlined" aria-hidden="true">
                {SIDEBAR_ICON_NAMES.delete}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Unable to read file"));
    reader.readAsDataURL(file);
  });
}

function normalizeMarkdownContent(content: string): string {
  return (content ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u200b/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function MarkdownContent({ content }: { content: string }) {
  const normalizedContent = useMemo(() => normalizeMarkdownContent(content), [content]);

  const CodeBlock = ({ language, value }: { language: string; value: string }) => {
    const [copied, setCopied] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
      return () => {
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }
      };
    }, []);

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        if (timerRef.current) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => setCopied(false), 1400);
      } catch {
        // ignore clipboard failures
      }
    };

    return (
      <div className="md-code-wrap">
        <div className="md-code-header">
          <span className="md-code-lang">{language}</span>
          <button className="md-code-copy" type="button" onClick={handleCopy} aria-label="Copy code">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="md-code-body">
          <SyntaxHighlighter style={nightOwl} language={language} PreTag="div">
            {value}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  };

  return (
    <ReactMarkdown
      className="markdown-body"
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, ...props }) => (
          <a {...props} className="md-link" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        code: ({ inline, className, children }) => {
          const match = /language-(\w+)/.exec(className ?? "");
          if (!inline && match) {
            const language = match?.[1] ? match[1].toLowerCase() : "text";
            const value = String(children).replace(/\n$/, "");
            return <CodeBlock language={language} value={value} />;
          }
          if (!inline && !match) {
            const value = String(children).replace(/\n$/, "");
            return <CodeBlock language="text" value={value} />;
          }
          return <code className="md-inline-code">{children}</code>;
        },
      }}
    >
      {normalizedContent}
    </ReactMarkdown>
  );
}

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  onComplete?: (value: string) => void;
  className?: string;
};

const normalizeOtpValue = (value: string, length: number) => value.replace(/\D/g, "").slice(0, length);

function OtpInput({ value, onChange, length = 6, disabled = false, onComplete, className }: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const normalized = normalizeOtpValue(value ?? "", length);
  const chars = Array.from({ length }, (_, index) => normalized[index] ?? "");

  const focusIndex = (index: number) => {
    const input = inputsRef.current[index];
    if (input) {
      input.focus();
      input.select();
    }
  };

  const commitValue = (nextChars: string[]) => {
    const nextValue = nextChars.join("");
    onChange(nextValue);
    if (nextChars.every((char) => char)) {
      onComplete?.(nextValue);
    }
  };

  const handleChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    const digits = event.target.value.replace(/\D/g, "");
    if (!digits) {
      const next = [...chars];
      next[index] = "";
      commitValue(next);
      return;
    }
    const next = [...chars];
    let cursor = index;
    for (const digit of digits) {
      if (cursor >= length) {
        break;
      }
      next[cursor] = digit;
      cursor += 1;
    }
    commitValue(next);
    if (cursor < length) {
      focusIndex(cursor);
    } else {
      inputsRef.current[length - 1]?.blur();
    }
  };

  const handleKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    if (event.key === "Backspace") {
      event.preventDefault();
      const next = [...chars];
      if (next[index]) {
        next[index] = "";
        commitValue(next);
        return;
      }
      if (index > 0) {
        next[index - 1] = "";
        commitValue(next);
        focusIndex(index - 1);
      }
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      if (index > 0) {
        focusIndex(index - 1);
      }
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      if (index < length - 1) {
        focusIndex(index + 1);
      }
    }
  };

  const handlePaste = (index: number) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) {
      return;
    }
    event.preventDefault();
    const next = [...chars];
    let cursor = index;
    for (const digit of digits) {
      if (cursor >= length) {
        break;
      }
      next[cursor] = digit;
      cursor += 1;
    }
    commitValue(next);
    if (cursor < length) {
      focusIndex(cursor);
    } else {
      inputsRef.current[length - 1]?.blur();
    }
  };

  return (
    <div className={`otp-inputs ${className ?? ""}`.trim()}>
      {chars.map((char, index) => (
        <input
          key={index}
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          className="otp-input"
          value={char}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste(index)}
          onFocus={(event) => event.currentTarget.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={1}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  );
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  state: { hasError: boolean; error?: Error } = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("App error:", error, info);
    }
  }

  handleRestart = () => {
    const meera = window.meera;
    if (meera?.restartApp) {
      meera.restartApp();
      return;
    }
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {
      // ignore storage failures
    }
    this.handleRestart();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="fatal">
          <div className="fatal-card">
            <div className="kicker">Error</div>
            <h2>Something went wrong</h2>
            <p>Restart the app or open a new session.</p>
            {this.state.error?.message && (
              <div className="fatal-details">
                <div className="kicker">Details</div>
                <p>{this.state.error.message}</p>
              </div>
            )}
            <div className="fatal-actions">
              <button className="fatal-button" type="button" onClick={this.handleReset}>
                Reset app data
              </button>
              <button className="fatal-button ghost" type="button" onClick={this.handleRestart}>
                Restart
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
function App() {
  const windowControls = (window as { meera?: { windowControls?: { minimize: () => void; maximize: () => void; close: () => void } } }).meera
    ?.windowControls;
  const isDesktopApp = Boolean(windowControls);
  const isMac = useMemo(() => /mac/i.test(navigator.platform), []);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(null);
  const [firebaseConfigReady, setFirebaseConfigReady] = useState(false);
  const firebaseConfigured = useMemo(() => Boolean(firebaseConfig), [firebaseConfig]);
  const auth = useMemo(() => (firebaseConfigured && firebaseConfig ? initFirebaseAuth(firebaseConfig) : null), [firebaseConfig, firebaseConfigured]);
  const [firebaseSetupError, setFirebaseSetupError] = useState("");
  const [firebaseApiKey, setFirebaseApiKey] = useState("");
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState("");
  const [firebaseProjectId, setFirebaseProjectId] = useState("");
  const [firebaseAppId, setFirebaseAppId] = useState("");
  const [firebaseMessagingSenderId, setFirebaseMessagingSenderId] = useState("");
  const [firebaseStorageBucket, setFirebaseStorageBucket] = useState("");

  useEffect(() => {
    let cancelled = false;
    const initFirebaseConfig = async () => {
      const stored = await loadFirebaseConfig();
      let resolved = stored;
      if (!resolved) {
        const envConfig = normalizeFirebaseConfig(FIREBASE_ENV_CONFIG);
        if (!isDesktopRuntime || import.meta.env.DEV) {
          resolved = envConfig;
        }
      }
      if (cancelled) {
        return;
      }
      setFirebaseConfig(resolved);
      setFirebaseConfigReady(true);
    };
    void initFirebaseConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!firebaseConfigReady) {
      return;
    }
    if (!firebaseConfig) {
      setFirebaseApiKey("");
      setFirebaseAuthDomain("");
      setFirebaseProjectId("");
      setFirebaseAppId("");
      setFirebaseMessagingSenderId("");
      setFirebaseStorageBucket("");
      return;
    }
    setFirebaseApiKey(firebaseConfig.apiKey ?? "");
    setFirebaseAuthDomain(firebaseConfig.authDomain ?? "");
    setFirebaseProjectId(firebaseConfig.projectId ?? "");
    setFirebaseAppId(firebaseConfig.appId ?? "");
    setFirebaseMessagingSenderId(firebaseConfig.messagingSenderId ?? "");
    setFirebaseStorageBucket(firebaseConfig.storageBucket ?? "");
  }, [firebaseConfig, firebaseConfigReady]);
  // State
  const [chatLoading, setChatLoading] = useState(false);
  const chatLoadingTimer = useRef<number | null>(null);
  const hfTokenSuccessTimer = useRef<number | null>(null);
  const topbarDownloadRef = useRef<HTMLDivElement | null>(null);
  const downloadStatusRef = useRef<Record<string, ModelDownloadState["status"] | null>>({});
  const downloadStatusReadyRef = useRef(false);
  const appToastTimer = useRef<number | null>(null);
  const [sessions, setSessions] = useState<Session[]>(() => loadSessionState(null).sessions);
  const [activeSessionId, setActiveSessionId] = useState<string>(() => loadSessionState(null).activeSessionId);
  const [view, setView] = useState<ViewMode>("home");
  const [displayView, setDisplayView] = useState<ViewMode>("home");
  const appRootRef = useRef<HTMLDivElement | null>(null);
  const homeScrollRef = useRef<HTMLDivElement | null>(null);
  const projectNameInputRef = useRef<HTMLInputElement | null>(null);
  const editingProjectInputRef = useRef<HTMLInputElement | null>(null);
  const lastStatusRef = useRef<AgentStatus | null>(null);
  const [chatActionFeedback, setChatActionFeedback] = useState<Record<string, boolean>>({});
  const chatActionTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    return () => {
      Object.values(chatActionTimers.current).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
  useEffect(() => {
    const handleTapSound = (event: PointerEvent) => {
      if (event.defaultPrevented) {
        return;
      }
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }
      const button = target.closest('button, [role="button"], .btn, .icon-btn');
      if (!button) {
        return;
      }
      if (button.getAttribute("aria-disabled") === "true") {
        return;
      }
      if (button instanceof HTMLButtonElement && button.disabled) {
        return;
      }
      if (button.hasAttribute("data-sound-off")) {
        return;
      }
      playSound("action");
    };
    document.addEventListener("pointerdown", handleTapSound, true);
    return () => {
      document.removeEventListener("pointerdown", handleTapSound, true);
    };
  }, []);
  useEffect(() => {
    if (displayView === view) {
      return;
    }
    const fallback = window.setTimeout(() => {
      setDisplayView(view);
    }, 450);
    return () => {
      window.clearTimeout(fallback);
    };
  }, [view, displayView]);
  const [status, setStatus] = useState<AgentStatus>("ready");
  const [error, setError] = useState("");
  const [appToast, setAppToast] = useState<{ type: "error" | "info"; message: string } | null>(null);
  const [appToastDismissed, setAppToastDismissed] = useState("");
  const [input, setInput] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSectionId>("about");
  const [settingsSearchQuery, setSettingsSearchQuery] = useState("");
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const chatSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [streamMode, setStreamMode] = useState<boolean>(() => parseJsonSafe<boolean>(localStorage.getItem(STORAGE_STREAM)) ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [syncAcrossDevices, setSyncAcrossDevices] = useState(true);
  const DEFAULT_GLASS_INTENSITY = 70;
  const DEFAULT_CONTRAST_BOOST = 100;
  const [selectedModel, setSelectedModel] = useState<ModelOptionId>(() => {
    const stored = localStorage.getItem(STORAGE_MODEL);
    if (stored && MODEL_OPTIONS.some((option) => option.id === stored)) {
      return stored as ModelOptionId;
    }
    return "meera-lite-1b";
  });
  const [installerAutoDownloadTarget, setInstallerAutoDownloadTarget] = useState<ModelOptionId | null>(null);
  const installerAutoDownloadRef = useRef(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus[]>([]);
  const [modelStatusError, setModelStatusError] = useState("");
  const [localModelStatus, setLocalModelStatus] = useState<ModelStatus[]>([]);
  const [localModelsRoot, setLocalModelsRoot] = useState("");
  const [downloadPromptOpen, setDownloadPromptOpen] = useState(false);
  const [downloadTargetId, setDownloadTargetId] = useState<ModelOptionId | null>(null);
  const [downloadPromptError, setDownloadPromptError] = useState("");
  const [downloadDetailsId, setDownloadDetailsId] = useState<ModelOptionId | null>(null);
  const [modelDeleteBusyId, setModelDeleteBusyId] = useState<ModelOptionId | null>(null);
  const [topbarDownloadOpen, setTopbarDownloadOpen] = useState(false);
  const [hfTokenPromptOpen, setHfTokenPromptOpen] = useState(false);
  const [hfTokenInfoOpen, setHfTokenInfoOpen] = useState(false);
  const [hfTokenValue, setHfTokenValue] = useState("");
  const [hfTokenError, setHfTokenError] = useState("");
  const [hfTokenSet, setHfTokenSet] = useState(false);
  const [hfTokenNotice, setHfTokenNotice] = useState("");
  const [hfTokenSaving, setHfTokenSaving] = useState(false);
  const [hfTokenSuccessOpen, setHfTokenSuccessOpen] = useState(false);
  const [hfTokenSuccessName, setHfTokenSuccessName] = useState("");
  const [hfTokenClearPromptOpen, setHfTokenClearPromptOpen] = useState(false);
  const [hfInfoOpen, setHfInfoOpen] = useState(false);
  const [backendStarting, setBackendStarting] = useState(false);
  const [backendStartError, setBackendStartError] = useState("");
  const [enginePromptOpen, setEnginePromptOpen] = useState(false);
  const [enginePromptDismissed, setEnginePromptDismissed] = useState(false);
  const [modelLoadOpen, setModelLoadOpen] = useState(false);
  const [modelLoadTargetId, setModelLoadTargetId] = useState<ModelOptionId | null>(null);
  const [modelLoadStatus, setModelLoadStatus] = useState<ModelLoadStatus | null>(null);
  const [modelLoadError, setModelLoadError] = useState("");
  const [modelLoadFailures, setModelLoadFailures] = useState<Record<string, number>>({});
  const lastModelLoadErrorRef = useRef<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem(STORAGE_THEME) as ThemeMode | null) ?? "dark");
  const [capabilities, setCapabilities] = useState<CapabilityResponse>({});
  const [inputHistory, setInputHistory] = useState<string[]>(() => parseJsonSafe<string[]>(localStorage.getItem(STORAGE_HISTORY) ?? "") ?? []);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(() => parseJsonSafe<boolean>(localStorage.getItem(STORAGE_SCROLL)) ?? true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(
    () => parseJsonSafe<boolean>(localStorage.getItem(STORAGE_SIDEBAR)) ?? true,
  );
  const [isRecording, setIsRecording] = useState(false);
  const [desktopApps, setDesktopApps] = useState<DesktopApp[]>([]);
  const [desktopEvents, setDesktopEvents] = useState<DesktopAppEvent[]>([]);
  const [desktopRefreshedAt, setDesktopRefreshedAt] = useState(0);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState("");
  const [clockNow, setClockNow] = useState(() => new Date());
  const [projects, setProjects] = useState<ProjectItem[]>(() => loadProjectState(null).projects);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => loadProjectState(null).activeProjectId);
  const [projectsError, setProjectsError] = useState("");
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [projectNameDraft, setProjectNameDraft] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUserState | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authDismissed, setAuthDismissed] = useState(false);
  const [deleteAccountPromptOpen, setDeleteAccountPromptOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const applyInstallerConfig = async () => {
      if (typeof window === "undefined" || !window.meera?.getInstallerConfig) {
        return;
      }
      if (localStorage.getItem(STORAGE_INSTALLER_APPLIED)) {
        return;
      }
      const config = await window.meera.getInstallerConfig();
      if (!config?.ok || cancelled) {
        return;
      }
      const selected = config.selectedModel;
      const validOption = MODEL_OPTIONS.find((option) => option.id === selected);
      if (validOption) {
        setSelectedModel(validOption.id as ModelOptionId);
        setDownloadTargetId(validOption.id as ModelOptionId);
        if (config.autoDownload) {
          setInstallerAutoDownloadTarget(validOption.id as ModelOptionId);
          if (isAuthenticated) {
            setSettingsSection("models");
            setSettingsOpen(true);
          }
        }
      }
      window.meera?.consumeInstallerConfig?.();
      localStorage.setItem(STORAGE_INSTALLER_APPLIED, String(Date.now()));
    };
    void applyInstallerConfig();
    return () => {
      cancelled = true;
    };
  }, []);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [authFullName, setAuthFullName] = useState("");
  const [authRole, setAuthRole] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authOtpSent, setAuthOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [authToastDismissed, setAuthToastDismissed] = useState("");
  const [emailCaptchaToken, setEmailCaptchaToken] = useState("");
  const [termsOpen, setTermsOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(() => readTermsAccepted(null));
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [termsContext, setTermsContext] = useState<"signup" | "gate" | null>(null);

  const [profileGateOpen, setProfileGateOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profilePasswordConfirm, setProfilePasswordConfirm] = useState("");
  const [profileOtp, setProfileOtp] = useState("");
  const [profileOtpSent, setProfileOtpSent] = useState(false);
  const [profileVerificationId, setProfileVerificationId] = useState<string | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [signoutPromptOpen, setSignoutPromptOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");
  const [accountPhone, setAccountPhone] = useState("");
  const [accountOtp, setAccountOtp] = useState("");
  const [accountOtpSent, setAccountOtpSent] = useState(false);
  const [accountVerificationId, setAccountVerificationId] = useState<string | null>(null);
  const [accountError, setAccountError] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountUid, setAccountUid] = useState<string | null>(null);
  const [shortcutCaptureId, setShortcutCaptureId] = useState<ShortcutActionId | null>(null);
  const [chatQuickPanelOpen, setChatQuickPanelOpen] = useState(false);
  const [chatRailHoverIndex, setChatRailHoverIndex] = useState<number | null>(null);
  const [chatRailHoverPosition, setChatRailHoverPosition] = useState<number | null>(null);
  const [chatRailHovered, setChatRailHovered] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<ShortcutActionId, string>>(() => {
    const stored = parseJsonSafe<Record<string, string>>(localStorage.getItem(STORAGE_SHORTCUTS) ?? "");
    return { ...DEFAULT_SHORTCUTS, ...(stored ?? {}) } as Record<ShortcutActionId, string>;
  });

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" && "matchMedia" in window
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : false,
    [],
  );

  const feedRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const chatQuickPanelRef = useRef<HTMLDivElement | null>(null);
  const chatRailRef = useRef<HTMLDivElement | null>(null);
  const settingsSearchRef = useRef<HTMLInputElement | null>(null);
  const settingsContentRef = useRef<HTMLDivElement | null>(null);
  const settingsNavListRef = useRef<HTMLDivElement | null>(null);
  const pendingSettingsSearchFocus = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeAbortRef = useRef<AbortController | null>(null);
  const phoneRecaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const phoneConfirmationRef = useRef<ConfirmationResult | null>(null);
  const emailRecaptchaRef = useRef<HTMLDivElement | null>(null);
  const emailRecaptchaWidgetRef = useRef<number | null>(null);
  const authDelayRef = useRef<number | null>(null);
  const profileRecaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const accountRecaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const profileCompletionRedirectRef = useRef(false);
  const confirmDialogResolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => b.updatedAt - a.updatedAt), [sessions]);
  const currentSession = useMemo(() => orderedSessions.find((session) => session.id === activeSessionId) ?? orderedSessions[0] ?? null, [orderedSessions, activeSessionId]);
  const messages = currentSession?.messages ?? [];
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const visibleMessages = useMemo(() => {
    return messages.filter((message) => {
      const trimmed = message.content.trim();
      if (!trimmed) {
        return false;
      }
      const normalized = trimmed.toLowerCase();
      const isGreeting =
        normalized.startsWith("hello there!") &&
        normalized.includes("microsoft products and services") &&
        normalized.includes("how i can help");
      return !isGreeting;
    });
  }, [messages]);
  const railMessages = useMemo(() => visibleMessages, [visibleMessages]);
  const railSlots = useMemo(() => {
    const totalSlots = Math.max(1, CHAT_RAIL_SLOTS);
    const totalMessages = railMessages.length;
    return Array.from({ length: totalSlots }, (_, slotIndex) => {
      if (totalMessages === 0) {
        return { slotIndex, message: null, headline: "", meta: "", messageId: null };
      }
      const ratio = totalSlots === 1 ? 0 : slotIndex / (totalSlots - 1);
      const msgIndex = Math.round(ratio * (totalMessages - 1));
      const message = railMessages[msgIndex] ?? null;
      if (!message) {
        return { slotIndex, message: null, headline: "", meta: "", messageId: null };
      }
      const headline = getRailHeadline(message.content);
      const roleLabel = message.role === "user" ? "You" : "MeeraAI";
      const metaText = message.ts ? `${roleLabel} · ${message.ts}` : roleLabel;
      return { slotIndex, message, headline, meta: metaText, messageId: message.id };
    });
  }, [railMessages]);
  const hasAnyMessages = useMemo(() => messages.some((message) => message.content.trim()), [messages]);
  const hasVisibleMessages = visibleMessages.length > 0;
  const showThinkingBubble = useMemo(() => {
    if (!isSending || !latestMessage) {
      return false;
    }
    if (latestMessage.role === "user") {
      return true;
    }
    return latestMessage.role === "assistant" && !latestMessage.content.trim();
  }, [isSending, latestMessage]);
  const latestUserMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message.role === "user" && message.content.trim()) {
        return message.id;
      }
    }
    return null;
  }, [messages]);
  const railActiveId = useMemo(() => {
    if (latestUserMessageId && railMessages.some((message) => message.id === latestUserMessageId)) {
      return latestUserMessageId;
    }
    const last = [...railMessages].reverse().find((message) => message.content.trim());
    return last?.id ?? null;
  }, [latestUserMessageId, railMessages]);
  const needsTermsGate = useMemo(() => Boolean(authUser) && !termsAccepted, [authUser, termsAccepted]);
  const isAuthVerified = useMemo(() => {
    if (!authUser) {
      return false;
    }
    if (needsTermsGate) {
      return false;
    }
    return true;
  }, [authUser, needsTermsGate]);

  const isAuthenticated = Boolean(authUser) && isAuthVerified;
  const authDisabled = !firebaseConfigured || !auth;
  const authErrorText = useMemo(() => cleanAuthMessage(authError), [authError]);
  const profileErrorText = useMemo(() => cleanAuthMessage(profileError), [profileError]);
  const showProfileError = useMemo(() => {
    if (!profileErrorText) {
      return false;
    }
    return !/^authentication failed\.?$/i.test(profileErrorText.trim());
  }, [profileErrorText]);
  const authToast = useMemo(() => {
    if (authDisabled) {
      return {
        type: "error" as const,
        message: cleanAuthMessage("Connect your Firebase project to enable sign-in."),
      };
    }
    if (authErrorText) {
      return { type: "error" as const, message: authErrorText };
    }
    if (authNotice) {
      return { type: "info" as const, message: authNotice };
    }
    return null;
  }, [authDisabled, authErrorText, authNotice]);
  const authToastVisible = Boolean(authToast?.message && authToastDismissed !== authToast.message);
  const appToastVisible = Boolean(appToast?.message && appToastDismissed !== appToast.message);

  useEffect(() => {
    if (!chatQuickPanelOpen) {
      return;
    }
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target || !chatQuickPanelRef.current) {
        return;
      }
      if (!chatQuickPanelRef.current.contains(target)) {
        setChatQuickPanelOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setChatQuickPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [chatQuickPanelOpen]);
  const showAuthBack = authMode !== "login" || authMethod !== "email";
  const needsProfileGate = useMemo(() => {
    if (!authUser) {
      return false;
    }
    const missingCore = !authUser.displayName || !authUser.email || !authUser.phoneNumber;
    return missingCore;
  }, [authUser]);
  const profileRequiresPassword = useMemo(() => !authUser?.email, [authUser]);
  const profileNeedsEmailVerification = useMemo(
    () => Boolean(authUser?.email) && !authUser?.emailVerified,
    [authUser],
  );
  const profilePhoneNeedsVerification = useMemo(() => {
    if (!authUser?.phoneNumber) {
      return true;
    }
    const normalized = profilePhone.trim();
    if (!normalized) {
      return true;
    }
    return authUser.phoneNumber !== normalized;
  }, [authUser, profilePhone]);
  const resolvedSettingsSection = useMemo<SettingsSectionId>(() => {
    return SETTINGS_SECTIONS.some((section) => section.id === settingsSection) ? settingsSection : "about";
  }, [settingsSection]);
  const activeSettingsSection =
    SETTINGS_SECTIONS.find((section) => section.id === resolvedSettingsSection) ?? SETTINGS_SECTIONS[0];
  const normalizedSettingsQuery = useMemo(() => settingsSearchQuery.trim().toLowerCase(), [settingsSearchQuery]);
  const settingsSearchTokens = useMemo(() => {
    if (!normalizedSettingsQuery) {
      return [];
    }
    return Array.from(new Set(normalizedSettingsQuery.split(/\s+/).filter(Boolean)));
  }, [normalizedSettingsQuery]);
  const settingsSearchRegex = useMemo(() => {
    if (settingsSearchTokens.length === 0) {
      return null;
    }
    const escaped = settingsSearchTokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    return new RegExp(`(${escaped.join("|")})`, "ig");
  }, [settingsSearchTokens]);
  const settingsSearchResults = useMemo<SettingsSearchResult[]>(() => {
    if (!normalizedSettingsQuery) {
      return SETTINGS_SECTIONS.map((section, index) => ({
        section,
        score: 0,
        index,
      }));
    }
    const tokens = normalizedSettingsQuery.split(/\s+/).filter(Boolean);
    const results = SETTINGS_SECTIONS.map((section, index) => {
      const label = section.label;
      const meta = section.meta;
      const description = section.description;
      const id = section.id;
      const labelLower = label.toLowerCase();
      const metaLower = meta.toLowerCase();
      const descriptionLower = description.toLowerCase();
      const idLower = id.toLowerCase();
      const haystack = `${labelLower} ${metaLower} ${descriptionLower} ${idLower}`;
      if (!tokens.every((token) => haystack.includes(token))) {
        return null;
      }
      let score = 6;
      let match: SettingsSearchMatch | undefined;
      const labelIndex = labelLower.indexOf(normalizedSettingsQuery);
      if (labelIndex >= 0) {
        score = labelIndex === 0 ? 0 : 1;
        match = { field: "label", start: labelIndex, end: labelIndex + normalizedSettingsQuery.length };
      } else {
        const metaIndex = metaLower.indexOf(normalizedSettingsQuery);
        if (metaIndex >= 0) {
          score = metaIndex === 0 ? 2 : 3;
          match = { field: "meta", start: metaIndex, end: metaIndex + normalizedSettingsQuery.length };
        } else if (descriptionLower.includes(normalizedSettingsQuery)) {
          score = 4;
        } else if (idLower.includes(normalizedSettingsQuery)) {
          score = 5;
        }
      }
      if (!match) {
        for (const token of tokens) {
          const tokenIndex = labelLower.indexOf(token);
          if (tokenIndex >= 0) {
            match = { field: "label", start: tokenIndex, end: tokenIndex + token.length };
            break;
          }
          const metaTokenIndex = metaLower.indexOf(token);
          if (metaTokenIndex >= 0) {
            match = { field: "meta", start: metaTokenIndex, end: metaTokenIndex + token.length };
            break;
          }
        }
      }
      return { section, score, index, match };
    })
      .filter((item): item is SettingsSearchResult => Boolean(item))
      .sort((a, b) => a.score - b.score || a.index - b.index);
    return results;
  }, [normalizedSettingsQuery]);

  const engineRunning = status !== "offline";
  const hasLocalScan = localModelStatus.length > 0;
  const statusSource = hasLocalScan ? localModelStatus : modelStatus;

  const modelStatusById = useMemo(() => {
    const map = new Map<string, ModelStatus>();
    statusSource.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [statusSource]);

  const backendStatusById = useMemo(() => {
    const map = new Map<string, ModelStatus>();
    modelStatus.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [modelStatus]);

  const localStatusById = useMemo(() => {
    const map = new Map<string, ModelStatus>();
    localModelStatus.forEach((entry) => map.set(entry.id, entry));
    return map;
  }, [localModelStatus]);

  const resolvedModels = useMemo<ModelStatus[]>(() => {
    return MODEL_OPTIONS.map((option) => {
      const local = localStatusById.get(option.id);
      const backend = backendStatusById.get(option.id);
      const status = modelStatusById.get(option.id);
      const resolvedLocalBytes = local?.local_bytes ?? backend?.local_bytes ?? status?.local_bytes ?? 0;
      const localSize = local?.size_bytes ?? 0;
      const backendSize = backend?.size_bytes ?? 0;
      const statusSize = status?.size_bytes ?? 0;
      const resolvedSize = localSize > 0 ? localSize : backendSize > 0 ? backendSize : statusSize;
      const precisionFallback =
        option.id === "meera-max-6b"
            ? "4-bit quantized"
            : option.id === "meera-ultra-8b"
              ? "4-bit quantized"
              : "Full precision";
      return {
        id: option.id,
        label: local?.label ?? backend?.label ?? status?.label ?? option.label,
        params: local?.params ?? backend?.params ?? status?.params ?? option.params,
        repo_id: local?.repo_id ?? backend?.repo_id ?? status?.repo_id ?? null,
        folder: local?.folder ?? backend?.folder ?? status?.folder ?? option.label,
        path: local?.path ?? backend?.path ?? status?.path ?? "",
        quant_bits: local?.quant_bits ?? backend?.quant_bits ?? status?.quant_bits ?? null,
        precision: local?.precision ?? backend?.precision ?? status?.precision ?? precisionFallback,
        blurb: local?.blurb ?? backend?.blurb ?? status?.blurb ?? option.blurb,
        requires_auth: local?.requires_auth ?? backend?.requires_auth ?? status?.requires_auth ?? option.requiresAuth ?? false,
        present: local?.present ?? backend?.present ?? status?.present ?? false,
        repo_mismatch: backend?.repo_mismatch ?? status?.repo_mismatch ?? false,
        size_bytes: resolvedSize,
        local_bytes: resolvedLocalBytes,
        download: backend?.download ?? status?.download ?? null,
      };
    });
  }, [modelStatusById, localStatusById, backendStatusById]);

  function getModelEntry(id: ModelOptionId) {
    return resolvedModels.find((model) => model.id === id);
  }

  const activeDownload = useMemo(() => {
    for (const entry of modelStatus) {
      if (entry.download && ["downloading", "paused", "verifying"].includes(entry.download.status)) {
        return entry.download;
      }
    }
    return null;
  }, [modelStatus]);

  const activeDownloadInfo = useMemo(() => {
    for (const model of resolvedModels) {
      if (model.download && ["downloading", "paused", "verifying"].includes(model.download.status)) {
        return { modelId: model.id as ModelOptionId, label: model.label, download: model.download };
      }
    }
    return null;
  }, [resolvedModels]);

  const installedLocalModels = useMemo(
    () => localModelStatus.filter((model) => model.present),
    [localModelStatus],
  );

  const downloadTarget = useMemo(() => {
    if (!downloadTargetId) {
      return null;
    }
    return getModelEntry(downloadTargetId);
  }, [downloadTargetId, resolvedModels]);

  const bundledDownloadIds = useMemo(() => getBundledModelIds(downloadTarget?.id), [downloadTarget?.id]);
  const bundledDownloadLabels = useMemo(
    () => bundledDownloadIds.map((modelId) => resolveModelLabel(modelId)).filter(Boolean),
    [bundledDownloadIds],
  );
  const bundledDownloadSummary = useMemo(() => {
    if (!downloadTarget || bundledDownloadIds.length <= 1) {
      return "";
    }
    return `${downloadTarget.label} will start first, and ${formatLabelList(
      bundledDownloadLabels.filter((label) => label !== downloadTarget.label),
    )} will queue right after it.`;
  }, [downloadTarget, bundledDownloadIds, bundledDownloadLabels]);

  useEffect(() => {
    if (!downloadDetailsId) {
      return;
    }
    const entry = getModelEntry(downloadDetailsId);
    if (!entry?.download || !["queued", "downloading", "paused", "verifying"].includes(entry.download.status)) {
      setDownloadDetailsId(null);
    }
  }, [downloadDetailsId, resolvedModels]);

  useEffect(() => {
    if (!activeDownloadInfo) {
      setTopbarDownloadOpen(false);
    }
  }, [activeDownloadInfo]);

  const getDownloadNotificationCopy = (
    label: string,
    prevStatus: ModelDownloadState["status"] | null,
    nextStatus: ModelDownloadState["status"] | null,
  ) => {
    if (!nextStatus || nextStatus === "verifying") {
      return null;
    }
    if (nextStatus === "queued") {
      return {
        title: "Download queued",
        body: `${label} is queued after the current model.`,
      };
    }
    if (nextStatus === "downloading") {
      return {
        title: prevStatus === "paused" ? "Download resumed" : "Download started",
        body: `${label} is downloading.`,
      };
    }
    if (nextStatus === "paused") {
      return { title: "Download paused", body: `${label} download is paused.` };
    }
    if (nextStatus === "cancelled") {
      return { title: "Download cancelled", body: `${label} download was cancelled.` };
    }
    if (nextStatus === "completed") {
      return { title: "Download complete", body: `${label} is ready to use.` };
    }
    if (nextStatus === "error") {
      return { title: "Download failed", body: `${label} couldn't be downloaded.` };
    }
    return null;
  };

  useEffect(() => {
    const snapshot: Record<string, ModelDownloadState["status"] | null> = {};
    resolvedModels.forEach((model) => {
      snapshot[model.id] = model.download?.status ?? null;
    });

    if (!notificationsEnabled) {
      downloadStatusRef.current = snapshot;
      downloadStatusReadyRef.current = false;
      return;
    }
    if (!downloadStatusReadyRef.current) {
      downloadStatusRef.current = snapshot;
      downloadStatusReadyRef.current = true;
      return;
    }

    const prev = downloadStatusRef.current;
    const next: Record<string, ModelDownloadState["status"] | null> = {};

    resolvedModels.forEach((model) => {
      const prevStatus = prev[model.id] ?? null;
      const nextStatus = model.download?.status ?? null;
      next[model.id] = nextStatus;
      if (prevStatus === nextStatus) {
        return;
      }
      const notice = getDownloadNotificationCopy(model.label, prevStatus, nextStatus);
      if (!notice) {
        return;
      }
      void sendSystemNotification(notice.title, {
        body: notice.body,
        tag: `download-${model.id}`,
        renotify: true,
      });
    });

    downloadStatusRef.current = next;
  }, [resolvedModels, notificationsEnabled]);

  useEffect(() => {
    if (!topbarDownloadOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (topbarDownloadRef.current && target && !topbarDownloadRef.current.contains(target)) {
        setTopbarDownloadOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTopbarDownloadOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [topbarDownloadOpen]);

  const modelLoadTarget = useMemo(() => {
    if (!modelLoadTargetId) {
      return null;
    }
    return getModelEntry(modelLoadTargetId);
  }, [modelLoadTargetId, resolvedModels]);

  const canStartBackend =
    typeof window !== "undefined" && typeof window.meera?.startBackend === "function";

  const getOfflineNotice = () => {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "You're offline. Check your internet connection.";
    }
    if (canStartBackend) {
      return "Backend is offline. Start it with: .\\Start_Backend.bat";
    }
    return "Backend is offline. Please start the backend and try again.";
  };

  const resolveAppErrorMessage = (raw: string) => {
    const normalized = raw.toLowerCase();
    if (
      normalized.includes("failed to fetch") ||
      normalized.includes("fetch failed") ||
      normalized.includes("networkerror") ||
      normalized.includes("load failed")
    ) {
      return getOfflineNotice();
    }
    if (normalized.includes("stream failed")) {
      return getOfflineNotice();
    }
    return raw;
  };

  const showAppToast = (type: "error" | "info", message: string) => {
    setAppToast({ type, message });
    setAppToastDismissed("");
  };
  const notificationIcon = `${import.meta.env.BASE_URL}logo.png`;
  const notificationImage = `${import.meta.env.BASE_URL}ui/notification-blur.svg`;
  const resolveNotificationUrl = (url: string) => {
    if (typeof window === "undefined") {
      return url;
    }
    try {
      return new URL(url, window.location.origin).toString();
    } catch {
      return url;
    }
  };
  const isAppInactive = () => {
    if (typeof document === "undefined") {
      return false;
    }
    if (document.hidden) {
      return true;
    }
    if (typeof document.hasFocus === "function") {
      return !document.hasFocus();
    }
    return false;
  };
  const ensureNotificationPermission = async () => {
    if (typeof window !== "undefined" && window.meera?.notify) {
      return "granted";
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      showAppToast("info", "Notifications aren't supported in this environment.");
      return "unsupported";
    }
    if (Notification.permission === "granted") {
      return "granted";
    }
    if (Notification.permission === "denied") {
      showAppToast("info", "Enable notifications in your system settings to receive alerts.");
      return "denied";
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      showAppToast("info", "Enable notifications in your system settings to receive alerts.");
    }
    return permission;
  };
  const sendSystemNotification = async (
    title: string,
    options: NotificationOptions & { onlyWhenInactive?: boolean },
  ) => {
    if (!notificationsEnabled) {
      return;
    }
    if (options.onlyWhenInactive && !isAppInactive()) {
      return;
    }
    const { onlyWhenInactive, ...notificationOptions } = options;
    if (typeof window !== "undefined" && window.meera?.notify) {
      try {
        const result = await window.meera.notify({
          title,
          body: typeof notificationOptions.body === "string" ? notificationOptions.body : "",
          silent: Boolean(notificationOptions.silent),
        });
        if (result?.ok) {
          return;
        }
      } catch {
        // fall back to browser notifications when native delivery fails
      }
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (Notification.permission !== "granted") {
      return;
    }
    try {
      const notification = new Notification(title, {
        icon: resolveNotificationUrl(notificationIcon),
        image: resolveNotificationUrl(notificationImage),
        badge: resolveNotificationUrl(notificationIcon),
        ...notificationOptions,
      });
      window.setTimeout(() => notification.close(), 6000);
    } catch {
      // ignore notification errors
    }
  };
  useEffect(() => {
    if (!installerAutoDownloadTarget || installerAutoDownloadRef.current) {
      return;
    }
    const target = resolvedModels.find((model) => model.id === installerAutoDownloadTarget);
    if (!target) {
      return;
    }
    if (target.present) {
      installerAutoDownloadRef.current = true;
      return;
    }
    const triggerDownload = async () => {
      installerAutoDownloadRef.current = true;
      if (status === "offline" && canStartBackend && !backendStarting) {
        const started = await startBackend();
        if (!started.ok) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
      setDownloadTargetId(installerAutoDownloadTarget);
      await startModelDownload(installerAutoDownloadTarget);
    };
    void triggerDownload();
  }, [installerAutoDownloadTarget, resolvedModels, status, canStartBackend, backendStarting]);
  const showModelStatusError = modelStatusError && localModelStatus.length === 0;
  const settingsSearchCountLabel = useMemo(() => {
    if (!normalizedSettingsQuery) {
      return "";
    }
    if (settingsSearchResults.length === 0) {
      return "No results";
    }
    return `${settingsSearchResults.length} result${settingsSearchResults.length === 1 ? "" : "s"}`;
  }, [normalizedSettingsQuery, settingsSearchResults.length]);
  const visibleSettingsSections = settingsSearchResults.map((result) => result.section);
  const activeSettingsIndex = Math.max(
    0,
    visibleSettingsSections.findIndex((section) => section.id === resolvedSettingsSection),
  );
  const hasActiveSettingsMatch = settingsSearchResults.some(
    (result) => result.section.id === resolvedSettingsSection,
  );
  const authProfile = useMemo(() => {
    if (!authUser) {
      return null;
    }
    const displayName = authUser.displayName || "MeeraAI member";
    const email = authUser.email || "";
    const phone = authUser.phoneNumber || "";
    const meta = email && phone ? `${email} • ${phone}` : email || phone || "Complete your profile";
    const photoUrl = authUser.photoURL || "";
    return { displayName, meta, photoUrl };
  }, [authUser]);
  const savedSessions = useMemo(() => orderedSessions.filter(sessionHasHistory), [orderedSessions]);
  const projectSessions = useMemo(() => {
    if (!activeProjectId) {
      return savedSessions.filter((session) => !session.projectId);
    }
    return savedSessions.filter((session) => session.projectId === activeProjectId);
  }, [savedSessions, activeProjectId]);
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );
  const currentSessionMatchesProject = useMemo(() => {
    if (!currentSession) {
      return false;
    }
    return activeProjectId ? currentSession.projectId === activeProjectId : !currentSession.projectId;
  }, [currentSession, activeProjectId]);
  const normalizedChatSearchQuery = chatSearchQuery.trim().toLowerCase();
  const chatSearchTokens = useMemo(
    () => normalizedChatSearchQuery.split(/\s+/).filter(Boolean),
    [normalizedChatSearchQuery],
  );
  const chatSearchResults = useMemo(() => {
    const tokens = chatSearchTokens;
    const matchesToken = (value: string) => tokens.some((token) => value.includes(token));
    const findMatchIndex = (value: string) => {
      let bestIndex = -1;
      let bestToken = "";
      for (const token of tokens) {
        const index = value.indexOf(token);
        if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
          bestIndex = index;
          bestToken = token;
        }
      }
      return { index: bestIndex, token: bestToken };
    };
    const trimSnippet = (value: string, length = 160) => {
      if (!value) {
        return "";
      }
      if (value.length <= length) {
        return value;
      }
      return `${value.slice(0, length).trim()}…`;
    };
    const buildSnippet = (value: string) => {
      if (!value) {
        return "";
      }
      if (tokens.length === 0) {
        return trimSnippet(value);
      }
      const lower = value.toLowerCase();
      const { index, token } = findMatchIndex(lower);
      if (index === -1) {
        return trimSnippet(value);
      }
      const start = Math.max(0, index - 36);
      const end = Math.min(value.length, index + token.length + 80);
      const snippet = value.slice(start, end).trim();
      return `${start > 0 ? "…" : ""}${snippet}${end < value.length ? "…" : ""}`;
    };
    const extractTopic = (session: Session, matchMessage?: { content?: string } | null) => {
      const messages = session.messages ?? [];
      const candidate =
        matchMessage?.content ??
        messages.find((message) => message.role === "user" && cleanTitleText(message.content))?.content ??
        messages.find((message) => cleanTitleText(message.content))?.content ??
        "";
      return cleanTitleText(candidate);
    };
    const buildResult = (session: Session, matchMessage: { content?: string } | null, nameMatch: boolean) => {
      const heading = deriveSessionHeading(session);
      const topic = buildSnippet(extractTopic(session, matchMessage)) || "No topic yet.";
      const meta = `${formatMessageCount(session)} · ${formatRelativeTime(session.updatedAt)}`;
      const score = (nameMatch ? 2 : 0) + (matchMessage ? 1 : 0);
      return { session, heading, topic, meta, score };
    };

    if (tokens.length === 0) {
      return savedSessions.slice(0, 8).map((session) => buildResult(session, null, false));
    }

    const results = savedSessions
      .map((session) => {
        const nameLower = (session.name ?? "").toLowerCase();
        const nameMatch = matchesToken(nameLower);
        let matchMessage: { content?: string } | null = null;
        for (const message of session.messages ?? []) {
          const contentLower = (message.content ?? "").toLowerCase();
          if (matchesToken(contentLower)) {
            matchMessage = message;
            break;
          }
        }
        if (!matchMessage) {
          for (const action of session.actions ?? []) {
            const contentLower = (action.text ?? "").toLowerCase();
            if (matchesToken(contentLower)) {
              matchMessage = { content: action.text };
              break;
            }
          }
        }
        if (!nameMatch && !matchMessage) {
          return null;
        }
        return buildResult(session, matchMessage, nameMatch);
      })
      .filter((result): result is ReturnType<typeof buildResult> => Boolean(result));

    return results.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return b.session.updatedAt - a.session.updatedAt;
    });
  }, [chatSearchTokens, savedSessions]);
  const chatSearchHasQuery = chatSearchTokens.length > 0;
  const renderChatSearchHighlight = (value: string) => {
    if (!chatSearchHasQuery || !value) {
      return value;
    }
    const escaped = chatSearchTokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "ig");
    const parts = value.split(regex);
    return parts.map((part, index) => {
      const isMatch = chatSearchTokens.some((token) => token.toLowerCase() === part.toLowerCase());
      if (!isMatch) {
        return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
      }
      return (
        <mark key={`${part}-${index}`} className="chat-search-highlight">
          {part}
        </mark>
      );
    });
  };
  const currentDesktopApps = useMemo(() => desktopApps.slice(0, 6), [desktopApps]);
  const recentDesktopEvents = useMemo(() => desktopEvents.slice(0, 6), [desktopEvents]);
  const currentAppearance = currentSession?.appearance ?? defaultAppearance();

  useEffect(() => {
    if (!chatSearchOpen) {
      return;
    }
    const focusTimer = window.setTimeout(() => {
      chatSearchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [chatSearchOpen]);

  useEffect(() => {
    if (!projectsModalOpen) {
      return;
    }
    const focusTimer = window.setTimeout(() => {
      projectNameInputRef.current?.focus();
      projectNameInputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [projectsModalOpen]);

  useEffect(() => {
    if (!editingProjectId) {
      return;
    }
    const focusTimer = window.setTimeout(() => {
      editingProjectInputRef.current?.focus();
      editingProjectInputRef.current?.select();
    }, 0);
    return () => window.clearTimeout(focusTimer);
  }, [editingProjectId]);

  useEffect(() => {
    if (authMode !== "signup") {
      setTermsOpen(false);
      setTermsScrolled(false);
      if (termsContext === "signup") {
        setTermsContext(null);
      }
    }
  }, [authMode, termsContext]);

  useEffect(() => {
    if (!authOpen) {
      if (termsContext !== "gate") {
        setTermsOpen(false);
        setTermsScrolled(false);
        setTermsContext(null);
      }
    }
  }, [authOpen, termsContext]);

  useEffect(() => {
    if (!hfTokenPromptOpen) {
      setHfTokenInfoOpen(false);
    }
  }, [hfTokenPromptOpen]);

  useEffect(() => {
    if (!hfTokenSuccessOpen) {
      if (hfTokenSuccessTimer.current) {
        window.clearTimeout(hfTokenSuccessTimer.current);
        hfTokenSuccessTimer.current = null;
      }
      return;
    }
    if (hfTokenSuccessTimer.current) {
      window.clearTimeout(hfTokenSuccessTimer.current);
    }
    hfTokenSuccessTimer.current = window.setTimeout(() => {
      setHfTokenSuccessOpen(false);
    }, 2600);
  }, [hfTokenSuccessOpen]);

  useEffect(() => {
    const uid = authUser?.uid ?? null;
    if (uid) {
      const pending = readTermsAccepted(null);
      if (pending && !readTermsAccepted(uid)) {
        persistTermsAccepted(uid);
      }
      clearTermsAccepted(null);
      setTermsAccepted(readTermsAccepted(uid));
      return;
    }
    setTermsAccepted(readTermsAccepted(null));
  }, [authUser?.uid]);

  const openTerms = (context: "signup" | "gate") => {
    setTermsContext(context);
    setTermsScrolled(false);
    setTermsOpen(true);
  };

  const handleTermsToggle = () => {
    if (termsAccepted) {
      openTerms("signup");
      return;
    }
    openTerms("signup");
  };

  const handleTermsAgree = () => {
    setTermsAccepted(true);
    setTermsOpen(false);
    persistTermsAccepted(authUser?.uid ?? null);
    setTermsContext(null);
  };

  const handleTermsDecline = () => {
    setTermsAccepted(false);
    setTermsOpen(false);
    clearTermsAccepted(authUser?.uid ?? null);
    if (termsContext === "gate" && authUser) {
      void handleSignOut();
      setAuthOpen(true);
    }
    setTermsContext(null);
  };

  const handleTermsScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const el = event.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 4) {
      setTermsScrolled(true);
    }
  };
  const activeWallpaperId = useMemo(
    () =>
      WALLPAPER_PRESETS.some((preset) => preset.id === currentAppearance.wallpaperId)
        ? currentAppearance.wallpaperId
        : DEFAULT_WALLPAPER_ID,
    [currentAppearance.wallpaperId],
  );
  const activePreset = useMemo(
    () => WALLPAPER_PRESETS.find((preset) => preset.id === activeWallpaperId) ?? WALLPAPER_PRESETS[0],
    [activeWallpaperId]
  );
  const activeWallpaper = currentAppearance.customWallpaper || activePreset.src;
  const wallpaperStyle = useMemo(() => ({ backgroundImage: `url("${activeWallpaper}")` }), [activeWallpaper]);
  const userName = localStorage.getItem("MEERA_USER") ?? "Vidit";
  const hasCustomWallpaper = Boolean(currentAppearance.customWallpaper);
  const wallpaperOverlayOpacity = OVERLAY_PRESETS[currentAppearance.overlay].opacity;
  const appRootStyle = useMemo(
    () =>
      ({
        "--wallpaper-overlay-opacity": String(wallpaperOverlayOpacity),
      }) as React.CSSProperties,
    [wallpaperOverlayOpacity],
  );
  const dashboardGreeting = useMemo(() => {
    const hour = clockNow.getHours();
    if (hour < 12) {
      return "Good morning";
    }
    if (hour < 18) {
      return "Good afternoon";
    }
    return "Good evening";
  }, [clockNow]);
  const localTime = useMemo(
    () => clockNow.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    [clockNow],
  );
  const localSeconds = useMemo(
    () => clockNow.toLocaleTimeString([], { second: "2-digit" }),
    [clockNow],
  );

  const promptIdeas = useMemo(() => {
    const ideas = capabilities.prompt_ideas;
    if (Array.isArray(ideas) && ideas.length > 0) {
      return ideas.slice(0, 6);
    }
    return HOME_SUGGESTIONS;
  }, [capabilities.prompt_ideas]);

  const [todaySessions, olderSessions] = useMemo(() => {
    const showCurrentSession =
      currentSession &&
      currentSessionMatchesProject &&
      !projectSessions.some((session) => session.id === currentSession.id) &&
      (projectSessions.length > 0 || sessionHasHistory(currentSession));
    const sidebarSessions = showCurrentSession ? [currentSession, ...projectSessions] : projectSessions;
    return [sidebarSessions.slice(0, 5), sidebarSessions.slice(5)];
  }, [currentSession, currentSessionMatchesProject, projectSessions]);
  const sidebarSessionCount = todaySessions.length + olderSessions.length;

  useEffect(() => {
    if (!activeProjectId || !projects.some((project) => project.id === activeProjectId)) {
      return;
    }
    if (currentSession && currentSession.projectId === activeProjectId) {
      return;
    }
    const matching = orderedSessions.find((session) => session.projectId === activeProjectId);
    if (matching) {
      setActiveSessionId(matching.id);
      return;
    }
    const freshSession = createSessionRecord(currentAppearance, activeProjectId);
    setSessions((prev) => [freshSession, ...prev]);
    setActiveSessionId(freshSession.id);
  }, [activeProjectId, projects, currentSession, orderedSessions, currentAppearance]);

  useEffect(() => {
    if (!activeProjectId && currentSession?.projectId) {
      setActiveProjectId(currentSession.projectId);
    }
  }, [activeProjectId, currentSession]);

  const handleRipple = (event: React.PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion) {
      return;
    }
    if (event.button !== 0) {
      return;
    }
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "meera-ripple-effect";
    const size = Math.max(rect.width, rect.height) * 1.2;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    target.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };

  const openSettingsPanel = (sectionId?: SettingsSectionId) => {
    if (!isAuthenticated) {
      if (!authOpen) {
        openAuthPanel();
      }
      setAuthNotice(authDisabled ? "Connect Firebase to enable sign-in." : "Sign in to access settings.");
      setSettingsOpen(false);
      return;
    }
    setSidebarOpen(false);
    setSettingsSection(sectionId ?? "about");
    setSettingsOpen(true);
  };

  const focusSettingsSearch = () => {
    if (!isAuthenticated) {
      if (!authOpen) {
        openAuthPanel();
      }
      setAuthNotice(authDisabled ? "Connect Firebase to enable sign-in." : "Sign in to access settings.");
      setSettingsOpen(false);
      return;
    }
    if (!settingsOpen) {
      pendingSettingsSearchFocus.current = true;
      openSettingsPanel();
      return;
    }
    window.requestAnimationFrame(() => {
      settingsSearchRef.current?.focus();
      settingsSearchRef.current?.select();
    });
  };

  const openDownloadPrompt = (id: ModelOptionId) => {
    setDownloadTargetId(id);
    setDownloadPromptError("");
    const entry = getModelEntry(id);
    if (entry && !entry.repo_id) {
      setDownloadPromptOpen(true);
      return;
    }
    setDownloadPromptOpen(true);
  };

  const handleModelSelect = (id: ModelOptionId) => {
    const entry = getModelEntry(id);
    if (!entry) {
      return;
    }
    if (statusSource.length === 0 && !modelStatusError) {
      void refreshModelStatus();
      return;
    }
    if (entry.present) {
      setSelectedModel(id);
      if (status === "offline" && canStartBackend) {
        setEnginePromptDismissed(false);
        setEnginePromptOpen(true);
        return;
      }
      void startModelLoad(id);
      return;
    }
    if (entry.download && ["queued", "downloading", "paused", "verifying"].includes(entry.download.status)) {
      if (entry.download.status === "queued") {
        showAppToast("info", `${entry.label} is queued and will start after the current model finishes.`);
        return;
      }
      setDownloadDetailsId((current) => (current === id ? null : id));
      return;
    }
    openDownloadPrompt(id);
  };

  const refreshModelStatus = async () => {
    try {
      const res = await fetch(API_MODELS_STATUS, { method: "GET" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as ModelStatusResponse;
      if (Array.isArray(data.models)) {
        setModelStatus(data.models);
        setHfTokenSet(Boolean(data.hf_token_set));
        setModelStatusError("");
        setBackendStartError("");
      }
    } catch {
      // ignore
    }
  };

  const refreshLocalModelScan = async () => {
    if (!window.meera?.scanModels) {
      return;
    }
    try {
      const data = (await window.meera.scanModels()) as LocalModelScanResponse;
      if (!data || !Array.isArray(data.models)) {
        return;
      }
      setLocalModelsRoot(typeof data.root === "string" ? data.root : "");
        const local = data.models.map((item) => {
          const fallback = MODEL_OPTIONS.find((option) => option.id === item.id);
          const precisionFallback =
            item.id === "meera-max-6b"
              ? "4-bit quantized"
              : item.id === "meera-ultra-8b"
                ? "4-bit quantized"
                : "Full precision";
        return {
          id: item.id,
          label: item.label ?? fallback?.label ?? item.id,
          params: item.params ?? fallback?.params ?? "",
          repo_id: item.repo_id ?? null,
          folder: item.folder ?? fallback?.label ?? "",
          path: item.path,
          quant_bits: item.quant_bits ?? null,
          precision: item.precision ?? precisionFallback,
          blurb: fallback?.blurb ?? "",
          requires_auth: fallback?.requiresAuth ?? false,
          present: item.present,
          size_bytes: item.size_bytes,
          local_bytes: item.local_bytes ?? item.size_bytes,
          download: null,
        };
      });
      setLocalModelStatus(local);
    } catch {
      // ignore
    }
  };

  const startBackend = async (): Promise<{ ok: boolean; error?: string }> => {
    if (!window.meera?.startBackend || backendStarting) {
      return { ok: false, error: "Backend bridge unavailable." };
    }
    setBackendStartError("");
    setBackendStarting(true);
    try {
      const result = await window.meera.startBackend();
      if (!result?.ok) {
        const error = result?.error || "Unable to start backend.";
        setBackendStartError(error);
        return { ok: false, error };
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await refreshModelStatus();
      return { ok: true };
    } catch {
      const error = "Unable to start backend.";
      setBackendStartError(error);
      return { ok: false, error };
    } finally {
      setBackendStarting(false);
    }
  };

  const stopBackend = async () => {
    if (!window.meera?.stopBackend || backendStarting) {
      return;
    }
    setBackendStartError("");
    setBackendStarting(true);
    try {
      const result = await window.meera.stopBackend();
      if (!result?.ok) {
        setBackendStartError(result?.error || "Unable to stop backend.");
        return;
      }
      setStatus("offline");
    } catch {
      setBackendStartError("Unable to stop backend.");
    } finally {
      setBackendStarting(false);
    }
  };

  const refreshModelLoadStatus = async () => {
    try {
      const res = await fetch(API_MODELS_LOAD_STATUS, { method: "GET" });
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as ModelLoadStatus;
      setModelLoadStatus(data);
    } catch {
      // ignore
    }
  };

  const startModelLoad = async (id: ModelOptionId) => {
    setModelLoadError("");
    setModelLoadTargetId(id);
    setModelLoadOpen(true);
    const canAutoStart = canStartBackend && !backendStarting;

    const attemptLoad = async (): Promise<boolean> => {
      const res = await fetch(API_MODELS_LOAD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: id }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        setModelLoadError(data.message || "Unable to load model.");
        setModelLoadStatus(null);
        return false;
      }
      setModelLoadStatus(data.status as ModelLoadStatus);
      return true;
    };

    try {
      if (status === "offline" && canAutoStart) {
        const started = await startBackend();
        if (!started.ok) {
          setModelLoadError(started.error || "Unable to start backend.");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      const ok = await attemptLoad();
      if (ok) {
        return;
      }
    } catch {
      if (canAutoStart) {
        const started = await startBackend();
        if (!started.ok) {
          setModelLoadError(started.error || "Unable to start backend.");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 900));
        try {
          await attemptLoad();
        } catch {
          setModelLoadError(started.error || "Unable to start backend.");
          setModelLoadStatus(null);
        }
        return;
      }
      setModelLoadError("Unable to start backend.");
      setModelLoadStatus(null);
    }
  };

  const dismissEnginePrompt = () => {
    setEnginePromptOpen(false);
    setEnginePromptDismissed(true);
  };

  const handleEngineStart = async () => {
    const started = await startBackend();
    if (!started.ok) {
      return;
    }
    setEnginePromptOpen(false);
    void startModelLoad(selectedModel);
  };

  const handleEngineStop = async () => {
    await stopBackend();
    setEnginePromptOpen(false);
  };


  const startModelDownload = async (id: ModelOptionId) => {
    setDownloadPromptError("");
    try {
      const res = await fetch(API_MODELS_DOWNLOAD, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: id }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        if (data.error === "auth_required" || data.error === "invalid_token") {
          if (data.error === "invalid_token") {
            setHfTokenSet(false);
            setHfTokenError("Token could not be verified. Please use a valid Hugging Face access token.");
          }
          setHfTokenPromptOpen(true);
          setDownloadPromptOpen(false);
          return;
        }
        if (data.error === "access_required") {
          setDownloadPromptError(
            data.message || "Your token is saved, but this model still needs access approved on Hugging Face.",
          );
          return;
        }
        if (data.error === "verify_failed") {
          setDownloadPromptError("Unable to verify token right now. Check your connection and try again.");
          return;
        }
        setDownloadPromptError(data.message || "Unable to start download.");
        return;
      }
      setDownloadPromptOpen(false);
      await refreshModelStatus();
      const queuedLabels = Array.isArray(data.queued_models)
        ? data.queued_models.map((modelId: string) => resolveModelLabel(modelId)).filter(Boolean)
        : [];
      if (queuedLabels.length > 1) {
        showAppToast("info", `Queued ${formatLabelList(queuedLabels)} for download.`);
      }
    } catch {
      setDownloadPromptError("Unable to reach the model service.");
    }
  };

  const pauseModelDownload = async (id: ModelOptionId) => {
    await fetch(API_MODELS_PAUSE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: id }),
    });
    await refreshModelStatus();
  };

  const resumeModelDownload = async (id: ModelOptionId) => {
    await fetch(API_MODELS_RESUME, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: id }),
    });
    await refreshModelStatus();
  };

  const cancelModelDownload = async (id: ModelOptionId) => {
    await fetch(API_MODELS_CANCEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: id }),
    });
    await refreshModelStatus();
  };

  const getFallbackModelAfterDelete = (deletedId: ModelOptionId): ModelOptionId => {
    const nextInstalled = resolvedModels.find((model) => model.id !== deletedId && model.present);
    if (nextInstalled) {
      return nextInstalled.id as ModelOptionId;
    }
    const nextOption = MODEL_OPTIONS.find((option) => option.id !== deletedId);
    return (nextOption?.id ?? MODEL_OPTIONS[0].id) as ModelOptionId;
  };

  const resolveConfirmDialog = (confirmed: boolean) => {
    const resolve = confirmDialogResolveRef.current;
    confirmDialogResolveRef.current = null;
    setConfirmDialog(null);
    resolve?.(confirmed);
  };

  const requestConfirmation = (dialog: ConfirmDialogState) =>
    new Promise<boolean>((resolve) => {
      if (confirmDialogResolveRef.current) {
        confirmDialogResolveRef.current(false);
      }
      confirmDialogResolveRef.current = resolve;
      setConfirmDialog(dialog);
    });

  const deleteModelFiles = async (id: ModelOptionId) => {
    if (modelDeleteBusyId) {
      return;
    }
    const entry = getModelEntry(id);
    if (!entry) {
      return;
    }
    const confirmed = await requestConfirmation({
      icon: "hard_drive",
      kicker: "Model cleanup",
      title: `Delete ${entry.label}?`,
      description: "This removes the model from this device and frees local disk space.",
      confirmLabel: "Delete model",
      cancelLabel: "Keep model",
      note: "You can download it again anytime.",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }

    setModelDeleteBusyId(id);
    try {
      const res = await fetch(API_MODELS_DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const message =
          data.message ||
          (data.error === "download_active"
            ? "Cancel the active download before deleting this model."
            : data.error === "model_loading"
              ? "Wait for the model to finish loading before deleting it."
              : "Unable to delete the model files.");
        showAppToast("error", message);
        return;
      }
      if (selectedModel === id) {
        setSelectedModel(getFallbackModelAfterDelete(id));
      }
      if (downloadTargetId === id) {
        setDownloadTargetId(null);
      }
      if (downloadDetailsId === id) {
        setDownloadDetailsId(null);
      }
      if (modelLoadTargetId === id) {
        setModelLoadTargetId(null);
      }
      await Promise.all([refreshModelStatus(), refreshLocalModelScan()]);
      showAppToast("info", `${entry.label} was removed from this device.`);
    } catch {
      showAppToast("error", "Unable to reach the model service.");
    } finally {
      setModelDeleteBusyId((current) => (current === id ? null : current));
    }
  };

  const formatHfTokenError = (payload: any) => {
    if (payload?.error === "invalid_token") {
      return "Token could not be verified. Please use a valid Hugging Face access token.";
    }
    if (payload?.error === "verify_failed") {
      return "Unable to verify token right now. Check your connection and try again.";
    }
    if (payload?.error === "token_required") {
      return "Token is required.";
    }
    return payload?.message || "Unable to save token.";
  };

  const saveHfToken = async () => {
    setHfTokenError("");
    setHfTokenNotice("");
    setHfTokenSuccessOpen(false);
    if (!hfTokenValue.trim()) {
      setHfTokenError("Token is required.");
      return;
    }
    if (hfTokenSaving) {
      return;
    }
    setHfTokenSaving(true);
    try {
      const res = await fetch(API_MODELS_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: hfTokenValue.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setHfTokenError(formatHfTokenError(data));
        return;
      }
      setHfTokenPromptOpen(false);
      setHfTokenValue("");
      setHfTokenSet(true);
      setHfTokenSuccessName(data?.user?.name || "");
      setHfTokenSuccessOpen(true);
      await refreshModelStatus();
      if (downloadTargetId) {
        await startModelDownload(downloadTargetId);
      }
    } catch {
      setHfTokenError("Unable to reach the model service.");
    } finally {
      setHfTokenSaving(false);
    }
  };

  const saveHfTokenFromSettings = async () => {
    setHfTokenError("");
    setHfTokenNotice("");
    setHfTokenSuccessOpen(false);
    if (!hfTokenValue.trim()) {
      setHfTokenError("Token is required.");
      return;
    }
    if (hfTokenSaving) {
      return;
    }
    setHfTokenSaving(true);
    try {
      const res = await fetch(API_MODELS_TOKEN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: hfTokenValue.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setHfTokenError(formatHfTokenError(data));
        return;
      }
      setHfTokenSet(true);
      setHfTokenNotice("Token verified.");
      setHfTokenSuccessName(data?.user?.name || "");
      setHfTokenSuccessOpen(true);
      setHfTokenValue("");
      await refreshModelStatus();
    } catch {
      setHfTokenError("Unable to reach the model service.");
    } finally {
      setHfTokenSaving(false);
    }
  };

  const clearHfToken = async () => {
    setHfTokenError("");
    setHfTokenNotice("");
    setHfTokenSuccessOpen(false);
    setHfTokenClearPromptOpen(false);
    try {
      const res = await fetch(API_MODELS_TOKEN_CLEAR, { method: "POST" });
      if (!res.ok) {
        setHfTokenError("Unable to clear token.");
        return;
      }
      setHfTokenSet(false);
      setHfTokenValue("");
      setHfTokenNotice("Token cleared.");
      await refreshModelStatus();
    } catch {
      setHfTokenError("Unable to reach the model service.");
    }
  };

  const renderSettingsHighlight = (
    text: string,
    match: SettingsSearchMatch | undefined,
    field: SettingsSearchField,
  ) => {
    if (!normalizedSettingsQuery || !match || match.field !== field) {
      return text;
    }
    const start = Math.max(0, Math.min(text.length, match.start));
    const end = Math.max(start, Math.min(text.length, match.end));
    if (start === end) {
      return text;
    }
    const key = `${normalizedSettingsQuery}-${field}-${start}-${end}`;
    return [
      text.slice(0, start),
      <span className="settings-search-hit" key={key}>
        {text.slice(start, end)}
      </span>,
      text.slice(end),
    ];
  };

  const renderSettingsQueryHighlights = (text: string) => {
    if (!settingsSearchRegex || settingsSearchTokens.length === 0) {
      return text;
    }
    const parts = text.split(settingsSearchRegex);
    return parts.map((part, index) => {
      const normalized = part.toLowerCase();
      if (settingsSearchTokens.includes(normalized)) {
        return (
          <span className="settings-search-hit" key={`${normalized}-${index}`}>
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const openProjectsModal = () => {
    setProjectsError("");
    setProjectNameDraft(`New project ${projects.length + 1}`);
    setProjectsModalOpen(true);
  };

  const closeProjectsModal = () => {
    setProjectsModalOpen(false);
    setProjectsError("");
    setEditingProjectId(null);
    setEditingProjectName("");
  };

  const createProject = () => {
    setProjectsError("");
    const name = projectNameDraft.trim();
    if (!name) {
      setProjectsError("Project name is required.");
      return;
    }
    const now = Date.now();
    const nextProject: ProjectItem = { id: msgId(), name, updatedAt: now };
    setProjects((prev) => [nextProject, ...prev]);
    setProjectsError("");
    setActiveProjectId(nextProject.id);
    const existingSession = sessions.find((session) => session.projectId === nextProject.id);
    if (!existingSession) {
      const freshSession = createSessionRecord(currentAppearance, nextProject.id);
      setSessions((prev) => [freshSession, ...prev]);
      setActiveSessionId(freshSession.id);
    }
    setProjectNameDraft(`New project ${projects.length + 2}`);
  };

  const startProjectRename = (project: ProjectItem) => {
    setProjectsError("");
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const cancelProjectRename = () => {
    setEditingProjectId(null);
    setEditingProjectName("");
  };

  const commitProjectRename = () => {
    if (!editingProjectId) {
      return;
    }
    const name = editingProjectName.trim();
    if (!name) {
      setProjectsError("Project name is required.");
      return;
    }
    setProjects((prev) =>
      prev.map((project) =>
        project.id === editingProjectId ? { ...project, name, updatedAt: Date.now() } : project,
      ),
    );
    setEditingProjectId(null);
    setEditingProjectName("");
  };

  const deleteProject = async (projectId: string) => {
    const target = projects.find((project) => project.id === projectId);
    const label = target?.name ? `Delete "${target.name}"?` : "Delete this project?";
    const confirmed = await requestConfirmation({
      icon: "folder_delete",
      kicker: "Project cleanup",
      title: label,
      description: "Chats inside this project will stay safe and move back to unassigned.",
      confirmLabel: "Delete project",
      cancelLabel: "Keep project",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setSessions((prev) =>
      prev.map((session) => (session.projectId === projectId ? { ...session, projectId: null } : session)),
    );
    if (activeProjectId === projectId) {
      setActiveProjectId("");
    }
    if (editingProjectId === projectId) {
      cancelProjectRename();
    }
  };

  const toggleProjectSelection = (projectId: string) => {
    if (activeProjectId === projectId) {
      setActiveProjectId("");
      const unassigned = orderedSessions.find((session) => !session.projectId);
      if (unassigned) {
        setActiveSessionId(unassigned.id);
      } else {
        const freshSession = createSessionRecord(currentAppearance);
        setSessions((prev) => [freshSession, ...prev]);
        setActiveSessionId(freshSession.id);
      }
      return;
    }
    setActiveProjectId(projectId);
    const matchingSession = orderedSessions.find((session) => session.projectId === projectId);
    if (matchingSession) {
      setActiveSessionId(matchingSession.id);
    } else {
      const freshSession = createSessionRecord(currentAppearance, projectId);
      setSessions((prev) => [freshSession, ...prev]);
      setActiveSessionId(freshSession.id);
    }
  };

  const triggerChatLoading = () => {
    setChatLoading(true);
    if (chatLoadingTimer.current) {
      window.clearTimeout(chatLoadingTimer.current);
    }
    chatLoadingTimer.current = window.setTimeout(() => {
      setChatLoading(false);
    }, 350);
  };

  const enterWorkspace = (withLoading = true) => {
    setSidebarOpen(false);
    if (view !== "workspace") {
      setView("workspace");
    }
    if (withLoading) {
      triggerChatLoading();
    }
  };

  useEffect(() => {
    return () => {
      if (chatLoadingTimer.current) {
        window.clearTimeout(chatLoadingTimer.current);
      }
    };
  }, []);

  const sidebar = (
    <motion.aside
      className="copilot-sidebar meera-sidebar"
      aria-label="Primary sidebar"
      initial={false}
      animate={sidebarOpen ? "open" : "closed"}
      variants={{
        open: {
          x: 0,
          y: 0,
          opacity: 1,
          scale: [0.96, 1.02, 1],
          transition: {
            x: { type: "spring", stiffness: 520, damping: 40, mass: 0.8 },
            y: { type: "spring", stiffness: 520, damping: 40, mass: 0.8 },
            scale: { duration: 0.28, ease: [0.16, 1, 0.3, 1], times: [0, 0.6, 1] },
            opacity: { duration: 0.2, ease: "linear" },
          },
        },
        closed: {
          x: -28,
          y: 6,
          opacity: 0,
          scale: 0.95,
          transition: {
            x: { duration: 0.2, ease: [0.4, 0, 0.6, 1] },
            y: { duration: 0.2, ease: [0.4, 0, 0.6, 1] },
            scale: { duration: 0.2, ease: [0.4, 0, 0.6, 1] },
            opacity: { duration: 0.14, ease: "linear" },
          },
        },
      }}
      style={{
        originX: 0,
        willChange: "transform, opacity",
        pointerEvents: sidebarOpen ? "auto" : "none",
      }}
    >
      <div className="meera-sidebar-inner">
        <header className="meera-sidebar-header">
          <button
            className="meera-logo-btn meera-ripple has-tooltip"
            type="button"
            data-label="Meera AI"
            aria-label="Meera AI"
            onPointerDown={handleRipple}
          >
            <span className="meera-logo-orb">
              <img className="meera-logo-img" src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
            </span>
            <span className="meera-title meera-label">Meera AI</span>
          </button>
          <button
            className="meera-collapse-btn meera-ripple has-tooltip"
            type="button"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
            data-label={sidebarOpen ? "Collapse" : "Expand"}
            onClick={() => setSidebarOpen((open) => !open)}
            onPointerDown={handleRipple}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              chevron_left
            </span>
          </button>
        </header>

        <section className="meera-primary" aria-label="Primary actions">
          <button
            className="meera-action-btn meera-ripple has-tooltip"
            type="button"
            onClick={() => createSession(currentAppearance)}
            onPointerDown={handleRipple}
            data-label="New Chat"
            aria-label="New chat"
          >
            <span className="meera-action-icon" aria-hidden="true">
              <span className="material-symbols-outlined">{SIDEBAR_ICON_NAMES.newChat}</span>
            </span>
            <span className="meera-label">New Chat</span>
          </button>
          <button
            className="meera-action-btn meera-ripple has-tooltip"
            type="button"
            onClick={() => setPinnedOpen((prev) => !prev)}
            onPointerDown={handleRipple}
            data-label="Pinned"
            aria-pressed={pinnedOpen}
            aria-label="Pinned"
          >
            <span className="meera-action-icon" aria-hidden="true">
              <span className="material-symbols-outlined">{SIDEBAR_ICON_NAMES.pinned}</span>
            </span>
            <span className="meera-label">Pinned</span>
          </button>
          <button
            className="meera-action-btn meera-ripple has-tooltip"
            type="button"
            onClick={openProjectsModal}
            onPointerDown={handleRipple}
            data-label="My Projects"
            aria-label="My projects"
          >
            <span className="meera-action-icon" aria-hidden="true">
              <span className="material-symbols-outlined">{SIDEBAR_ICON_NAMES.project}</span>
            </span>
            <span className="meera-label">My Projects</span>
          </button>
          {pinnedOpen && <div className="meera-empty meera-label">No pinned items yet.</div>}
        </section>

        <section className="meera-section" aria-label="Projects">
          <div className="meera-section-title meera-label">PROJECT</div>
          <div className="meera-project-list">
            {activeProject ? (
              <button
                className="meera-project-item meera-ripple active"
                type="button"
                onClick={openProjectsModal}
                onPointerDown={handleRipple}
              >
                <span className="meera-label">{activeProject.name}</span>
                <span className="meera-project-meta meera-label">Selected</span>
              </button>
            ) : (
              <div className="meera-empty meera-label">No project selected</div>
            )}
          </div>
        </section>

        <section className="meera-section meera-conversations" aria-label="Conversations">
          <div className="meera-conv-header">
            <div className="meera-conv-title">
              <span className="meera-section-title meera-label">Conversations</span>
              <span className="meera-conv-count">{sidebarSessionCount}</span>
            </div>
            <button
              className="meera-conv-search meera-ripple"
              type="button"
              onClick={() => setChatSearchOpen(true)}
              onPointerDown={handleRipple}
              aria-label="Search chats"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                {SIDEBAR_ICON_NAMES.search}
              </span>
              <span className="meera-label">Search</span>
            </button>
          </div>
          <div className="meera-conv-list" role="list">
            {todaySessions.length > 0 && (
              <div className="meera-conv-group">
                <div className="meera-conv-group-title meera-label">Recent</div>
                <div className="meera-conv-group-list">
                  {todaySessions.map((session) => (
                    <div key={session.id} role="listitem">
                      <SessionRow
                        session={session}
                        active={session.id === currentSession?.id}
                        editing={editingSessionId === session.id}
                        draftName={editingSessionName}
                        preview={deriveSessionPreview(session)}
                        meta={`${formatMessageCount(session)} · ${formatRelativeTime(session.updatedAt)}`}
                        variant="sidebar"
                        onRipple={handleRipple}
                        onOpen={() => switchSession(session.id)}
                        onStartEdit={() => {
                          setEditingSessionId(session.id);
                          setEditingSessionName(session.name);
                        }}
                        onDraftChange={setEditingSessionName}
                        onCommitEdit={() => commitSessionRename()}
                        onCancelEdit={() => {
                          setEditingSessionId(null);
                          setEditingSessionName("");
                        }}
                        onDelete={() => {
                          void deleteSession(session.id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {olderSessions.length > 0 && (
              <div className="meera-conv-group">
                <div className="meera-conv-group-title meera-label">Earlier</div>
                <div className="meera-conv-group-list">
                  {olderSessions.map((session) => (
                    <div key={session.id} role="listitem">
                      <SessionRow
                        session={session}
                        active={session.id === currentSession?.id}
                        editing={editingSessionId === session.id}
                        draftName={editingSessionName}
                        preview={deriveSessionPreview(session)}
                        meta={`${formatMessageCount(session)} · ${formatRelativeTime(session.updatedAt)}`}
                        variant="sidebar"
                        onRipple={handleRipple}
                        onOpen={() => switchSession(session.id)}
                        onStartEdit={() => {
                          setEditingSessionId(session.id);
                          setEditingSessionName(session.name);
                        }}
                        onDraftChange={setEditingSessionName}
                        onCommitEdit={() => commitSessionRename()}
                        onCancelEdit={() => {
                          setEditingSessionId(null);
                          setEditingSessionName("");
                        }}
                        onDelete={() => {
                          void deleteSession(session.id);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {sidebarSessionCount === 0 && <div className="meera-conv-empty meera-label">No chats yet</div>}
          </div>
        </section>

        <section className="meera-profile" aria-label="User profile">
          {isAuthenticated && authProfile ? (
            <div className="meera-profile-card">
              <div className="meera-avatar" role="img" aria-label="User avatar">
                {authProfile.photoUrl ? (
                  <img src={authProfile.photoUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
                ) : (
                  (authProfile.displayName || "M").slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="meera-profile-details meera-label">
                <div className="meera-profile-name">{authProfile.displayName}</div>
                <div className="meera-profile-meta">{authUser?.email || "email unavailable"}</div>
                <div className="meera-profile-meta">{authUser?.phoneNumber || "phone unavailable"}</div>
              </div>
            </div>
          ) : (
            <button
              className="meera-profile-card meera-ripple has-tooltip"
              type="button"
              onClick={openAuthPanel}
              onPointerDown={handleRipple}
              data-label={authDisabled ? "Sign-in unavailable" : "Sign in"}
              aria-label="Sign in"
              disabled={authDisabled}
            >
              <div className="meera-avatar" role="img" aria-label="User avatar">
                <img src={DEFAULT_PROFILE_AVATAR_URL} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
              </div>
              <div className="meera-profile-details meera-label">
                <div className="meera-profile-name">{authDisabled ? "Sign-in unavailable" : "Guest"}</div>
                <div className="meera-profile-meta">{authDisabled ? "Connect Firebase to enable sign-in" : "Sign in to sync"}</div>
                <div className="meera-profile-meta">{authDisabled ? "" : "Secure your account"}</div>
              </div>
            </button>
          )}
          <button
            className="meera-profile-btn meera-ripple has-tooltip"
            type="button"
            onClick={openSettingsPanel}
            onPointerDown={handleRipple}
            data-label="Settings"
            aria-label="Profile settings"
          >
            <span className="meera-action-icon" aria-hidden="true">
              <span className="material-symbols-outlined">{SIDEBAR_ICON_NAMES.settings}</span>
            </span>
            <span className="meera-label">Settings</span>
          </button>
        </section>
      </div>
    </motion.aside>
  );

  const renderSidebarBackdrop = () => (
    <motion.button
      type="button"
      className="sidebar-backdrop"
      aria-label="Close sidebar"
      aria-hidden={!sidebarOpen}
      tabIndex={sidebarOpen ? 0 : -1}
      onClick={() => setSidebarOpen(false)}
      initial={false}
      animate={sidebarOpen ? "open" : "closed"}
      variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }}
      transition={{ duration: 0.2, ease: "linear" }}
      style={{ pointerEvents: sidebarOpen ? "auto" : "none" }}
    />
  );

  useEffect(() => {
    if (!feedRef.current || !autoScroll) {
      return;
    }
    const feed = feedRef.current;
    const top = Math.max(0, feed.scrollHeight - feed.clientHeight);
    feed.scrollTo({ top, behavior: "auto" });
  }, [visibleMessages, autoScroll]);

  useEffect(() => {
    const target = view === "home" ? homeScrollRef.current : feedRef.current;
    const root = appRootRef.current;
    if (!target || !root) {
      return;
    }
    let timer: number | null = null;
    const onScroll = () => {
      root.classList.add("is-scrolling");
      if (timer) {
        window.clearTimeout(timer);
      }
      timer = window.setTimeout(() => {
        root.classList.remove("is-scrolling");
        timer = null;
      }, 160);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      target.removeEventListener("scroll", onScroll);
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [view, feedRef]);

  useEffect(() => {
    if (!activeSessionId && orderedSessions[0]) {
      setActiveSessionId(orderedSessions[0].id);
    }
  }, [orderedSessions, activeSessionId]);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_INSTALLER_APPLIED) === "1") {
      return;
    }
    if (!window.meera?.getInstallerConfig) {
      return;
    }
    const stored = localStorage.getItem(STORAGE_MODEL);
    if (stored && MODEL_OPTIONS.some((option) => option.id === stored)) {
      localStorage.setItem(STORAGE_INSTALLER_APPLIED, "1");
      return;
    }
    const applyInstallerConfig = async () => {
      try {
        const result = (await window.meera?.getInstallerConfig?.()) as InstallerConfig | { ok?: boolean };
        if (!result || (typeof result === "object" && "ok" in result && result.ok === false)) {
          return;
        }
        const selectedRaw =
          (result as InstallerConfig).selectedModel || (result as InstallerConfig).selected_model || "";
        const selected = selectedRaw.trim();
        if (selected && MODEL_OPTIONS.some((option) => option.id === selected)) {
          setSelectedModel(selected as ModelOptionId);
          localStorage.setItem(STORAGE_MODEL, selected);
          const autoDownload =
            (result as InstallerConfig).autoDownload ?? (result as InstallerConfig).auto_download ?? true;
          if (autoDownload) {
            setInstallerAutoDownloadTarget(selected as ModelOptionId);
          }
        }
        localStorage.setItem(STORAGE_INSTALLER_APPLIED, "1");
        if (window.meera?.consumeInstallerConfig) {
          void window.meera.consumeInstallerConfig();
        }
      } catch {
        // ignore
      }
    };
    void applyInstallerConfig();
  }, []);

  useEffect(() => {
    if (settingsOpen && !isAuthenticated) {
      setSettingsOpen(false);
    }
  }, [settingsOpen, isAuthenticated]);

  useEffect(() => {
    if (!confirmDialog) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        resolveConfirmDialog(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [confirmDialog]);

  useEffect(() => {
    return () => {
      if (confirmDialogResolveRef.current) {
        confirmDialogResolveRef.current(false);
        confirmDialogResolveRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch(API_HEALTH, { method: "GET" });
        setStatus((current) => {
          if (current === "thinking" || current === "executing") {
            return current;
          }
          return res.ok ? "ready" : "offline";
        });
      } catch {
        setStatus((current) => (current === "thinking" || current === "executing" ? current : "offline"));
      }
    };

    void ping();
    const interval = window.setInterval(ping, 3500);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!canStartBackend) {
      return;
    }
    if (status === "offline" && !enginePromptDismissed) {
      setEnginePromptOpen(true);
    }
  }, [status, canStartBackend, enginePromptDismissed]);

  useEffect(() => {
    const loadCapabilities = async () => {
      try {
        const res = await fetch(API_CAPABILITIES, { method: "GET" });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as CapabilityResponse;
        setCapabilities(data);
      } catch {
        setCapabilities({});
      }
    };

    void loadCapabilities();
    const interval = window.setInterval(loadCapabilities, 30000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadModelStatus = async () => {
      try {
        const res = await fetch(API_MODELS_STATUS, { method: "GET" });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as ModelStatusResponse;
        if (Array.isArray(data.models)) {
          setModelStatus(data.models);
          setHfTokenSet(Boolean(data.hf_token_set));
          const invalidToken = data.models.find(
            (model) => model.download?.status === "error" && model.download?.error === "invalid_token",
          );
          const authRequired = !data.hf_token_set
            ? data.models.find((model) => model.download?.status === "error" && model.download?.error === "auth_required")
            : null;
          if (invalidToken) {
            setDownloadTargetId(invalidToken.id as ModelOptionId);
            setHfTokenSet(false);
            setHfTokenError("Saved token could not be verified. Please enter a valid Hugging Face access token.");
            setHfTokenPromptOpen(true);
          } else if (authRequired) {
            setDownloadTargetId(authRequired.id as ModelOptionId);
            setHfTokenPromptOpen(true);
          }
        }
        setModelStatusError("");
        setBackendStartError("");
      } catch {
        setModelStatusError("Model service unavailable");
      }
    };

    void loadModelStatus();
    const interval = window.setInterval(loadModelStatus, activeDownload ? 1200 : 8000);
    return () => window.clearInterval(interval);
  }, [activeDownload]);

  useEffect(() => {
    void refreshLocalModelScan();
    const interval = window.setInterval(refreshLocalModelScan, 12000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_MODEL, selectedModel);
  }, [selectedModel]);

  useEffect(() => {
    if (!window.meera?.getDesktopApps) {
      return;
    }

    let mounted = true;
    const syncDesktopApps = async () => {
      try {
        const payload = await window.meera?.getDesktopApps?.();
        if (!mounted || !payload) {
          return;
        }
        setDesktopApps(Array.isArray(payload.apps) ? payload.apps : []);
        setDesktopEvents(Array.isArray(payload.events) ? payload.events : []);
        setDesktopRefreshedAt(typeof payload.refreshedAt === "number" ? payload.refreshedAt : Date.now());
      } catch {
        if (!mounted) {
          return;
        }
        setDesktopApps([]);
        setDesktopEvents([]);
      }
    };

    void syncDesktopApps();
    const interval = window.setInterval(syncDesktopApps, 4000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setClockNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!modelLoadOpen) {
      return;
    }
    void refreshModelLoadStatus();
    const interval = window.setInterval(refreshModelLoadStatus, 900);
    return () => window.clearInterval(interval);
  }, [modelLoadOpen]);

  useEffect(() => {
    if (!modelLoadStatus || modelLoadStatus.status !== "loading") {
      return;
    }
    const interval = window.setInterval(refreshModelLoadStatus, 900);
    return () => window.clearInterval(interval);
  }, [modelLoadStatus?.status]);

  useEffect(() => {
    if (!auth) {
      setAuthUser(null);
      setAuthReady(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(snapshotAuthUser(user));
      setAuthReady(true);
      if (!user) {
        return;
      }
      try {
        await user.getIdToken();
      } catch {
        // ignore
      }
      setAuthDismissed(false);
    });
    return () => unsubscribe();
  }, [auth, authDismissed, authMode]);

  useEffect(() => {
    const uid = authUser?.uid ?? null;
    if (uid) {
      const userSessionsKey = storageKeyForUser(STORAGE_SESSIONS, uid);
      if (!localStorage.getItem(userSessionsKey)) {
        const legacySessions = localStorage.getItem(STORAGE_SESSIONS);
        if (legacySessions) {
          localStorage.setItem(userSessionsKey, legacySessions);
          localStorage.removeItem(STORAGE_SESSIONS);
        }
      }

      const userActiveSessionKey = storageKeyForUser(STORAGE_ACTIVE_SESSION, uid);
      if (!localStorage.getItem(userActiveSessionKey)) {
        const legacyActive = localStorage.getItem(STORAGE_ACTIVE_SESSION);
        if (legacyActive) {
          localStorage.setItem(userActiveSessionKey, legacyActive);
          localStorage.removeItem(STORAGE_ACTIVE_SESSION);
        }
      }

      const userProjectsKey = storageKeyForUser(STORAGE_PROJECTS, uid);
      if (!localStorage.getItem(userProjectsKey)) {
        const legacyProjects = localStorage.getItem(STORAGE_PROJECTS);
        if (legacyProjects) {
          localStorage.setItem(userProjectsKey, legacyProjects);
          localStorage.removeItem(STORAGE_PROJECTS);
        }
      }

      const userActiveProjectKey = storageKeyForUser(STORAGE_ACTIVE_PROJECT, uid);
      if (!localStorage.getItem(userActiveProjectKey)) {
        const legacyActiveProject = localStorage.getItem(STORAGE_ACTIVE_PROJECT);
        if (legacyActiveProject) {
          localStorage.setItem(userActiveProjectKey, legacyActiveProject);
          localStorage.removeItem(STORAGE_ACTIVE_PROJECT);
        }
      }
    }
    const sessionState = loadSessionState(uid);
    setSessions(sessionState.sessions);
    setActiveSessionId(sessionState.activeSessionId);
    const projectState = loadProjectState(uid);
    setProjects(projectState.projects);
    setActiveProjectId(projectState.activeProjectId);
    if (!hasSessionHistory(sessionState.sessions)) {
      setView("home");
    }
  }, [authUser?.uid]);

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (authDelayRef.current) {
      window.clearTimeout(authDelayRef.current);
      authDelayRef.current = null;
    }
    if (!authUser) {
      if (!authDismissed) {
        authDelayRef.current = window.setTimeout(() => {
          setAuthOpen(true);
          authDelayRef.current = null;
        }, 450);
      }
      return;
    }
    if (needsTermsGate) {
      setAuthOpen(false);
      if (!termsOpen || termsContext !== "gate") {
        openTerms("gate");
      }
      return;
    }
    if (!isAuthVerified) {
      authDelayRef.current = window.setTimeout(() => {
        setAuthOpen(true);
        authDelayRef.current = null;
      }, 350);
      return;
    }
    setAuthOpen(false);
    return () => {
      if (authDelayRef.current) {
        window.clearTimeout(authDelayRef.current);
        authDelayRef.current = null;
      }
    };
  }, [authReady, authUser, isAuthVerified, authDismissed, needsTermsGate, termsOpen, termsContext]);

  useEffect(() => {
    if (isAuthenticated) {
      setAuthOpen(false);
      setAuthDismissed(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authToast?.message) {
      setAuthToastDismissed("");
      return;
    }
    setAuthToastDismissed((prev) => (prev && prev !== authToast.message ? "" : prev));
  }, [authToast?.message]);

  useEffect(() => {
    if (!appToast?.message) {
      setAppToastDismissed("");
      return;
    }
    setAppToastDismissed((prev) => (prev && prev !== appToast.message ? "" : prev));
  }, [appToast?.message]);

  useEffect(() => {
    if (!modelLoadTargetId) {
      lastModelLoadErrorRef.current = null;
      return;
    }
    const errorMessage = modelLoadError || modelLoadStatus?.error || "";
    if (!errorMessage) {
      lastModelLoadErrorRef.current = null;
      return;
    }
    const errorKey = `${modelLoadTargetId}:${errorMessage}`;
    if (lastModelLoadErrorRef.current === errorKey) {
      return;
    }
    lastModelLoadErrorRef.current = errorKey;
    setModelLoadFailures((prev) => ({
      ...prev,
      [modelLoadTargetId]: (prev[modelLoadTargetId] ?? 0) + 1,
    }));
  }, [modelLoadError, modelLoadStatus?.error, modelLoadTargetId]);

  useEffect(() => {
    if (!appToast?.message || appToastDismissed === appToast.message) {
      if (appToastTimer.current) {
        window.clearTimeout(appToastTimer.current);
        appToastTimer.current = null;
      }
      return;
    }
    if (appToastTimer.current) {
      window.clearTimeout(appToastTimer.current);
    }
    appToastTimer.current = window.setTimeout(() => {
      setAppToastDismissed(appToast.message);
      appToastTimer.current = null;
    }, 3000);
    return () => {
      if (appToastTimer.current) {
        window.clearTimeout(appToastTimer.current);
        appToastTimer.current = null;
      }
    };
  }, [appToast?.message, appToastDismissed]);

  useEffect(() => {
    if (!error) {
      return;
    }
    showAppToast("error", resolveAppErrorMessage(error));
    setError("");
  }, [error]);

  useEffect(() => {
    if (lastStatusRef.current === status) {
      return;
    }
    if (status === "offline") {
      showAppToast("error", getOfflineNotice());
    }
    lastStatusRef.current = status;
  }, [status, canStartBackend]);

  useEffect(() => {
    if (!authOpen || authMethod !== "email" || authMode !== "signup") {
      return;
    }
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey || !emailRecaptchaRef.current) {
      return;
    }
    const renderCaptcha = () => {
      if (!emailRecaptchaRef.current || !window.grecaptcha || emailRecaptchaWidgetRef.current !== null) {
        return;
      }
      emailRecaptchaWidgetRef.current = window.grecaptcha.render(emailRecaptchaRef.current, {
        sitekey: siteKey,
        callback: (token: string) => setEmailCaptchaToken(token),
        "expired-callback": () => setEmailCaptchaToken(""),
        "error-callback": () => setEmailCaptchaToken(""),
      });
    };
    if (window.grecaptcha?.render) {
      renderCaptcha();
      return;
    }
    const scriptId = "meera-recaptcha";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === "true") {
      renderCaptcha();
      return;
    }
    const script = existing ?? document.createElement("script");
    script.id = scriptId;
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      renderCaptcha();
    };
    if (!existing) {
      document.body.appendChild(script);
    }
  }, [authOpen, authMethod, authMode]);

  useEffect(() => {
    if (!authUser) {
      return;
    }
    setAccountName(authUser.displayName ?? "");
    setAccountEmail(authUser.email ?? "");
    setAccountPhone(authUser.phoneNumber ?? "");
  }, [authUser]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    void refreshAuthUser();
    if (resolvedSettingsSection === "account") {
      setAccountName(authUser?.displayName ?? "");
      setAccountEmail(authUser?.email ?? "");
      setAccountPhone(authUser?.phoneNumber ?? "");
    }
  }, [settingsOpen, resolvedSettingsSection, authUser]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    window.requestAnimationFrame(() => {
      settingsContentRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
  }, [settingsOpen, resolvedSettingsSection]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }
    if (!normalizedSettingsQuery) {
      return;
    }
    if (settingsSearchResults.length === 0) {
      return;
    }
    const topMatch = settingsSearchResults[0].section.id;
    if (topMatch !== resolvedSettingsSection) {
      setSettingsSection(topMatch);
    }
    const navList = settingsNavListRef.current;
    const target = navList?.querySelector<HTMLButtonElement>(`[data-settings-id="${topMatch}"]`);
    target?.scrollIntoView({ block: "nearest" });
  }, [settingsOpen, normalizedSettingsQuery, settingsSearchResults, resolvedSettingsSection]);


  useEffect(() => {
    if (settingsSection === resolvedSettingsSection) {
      return;
    }
    setSettingsSection(resolvedSettingsSection);
  }, [settingsSection, resolvedSettingsSection]);

  useEffect(() => {
    if (!authUser) {
      setProfileGateOpen(false);
      profileCompletionRedirectRef.current = false;
      return;
    }
    if (needsProfileGate && !profileGateOpen) {
      profileCompletionRedirectRef.current = false;
      setProfileGateOpen(true);
      setProfileError("");
      setProfileNotice("");
      setProfileName(authUser.displayName ?? "");
      setProfileEmail(authUser.email ?? "");
      setProfilePhone(authUser.phoneNumber ?? "");
      setProfilePassword("");
      setProfilePasswordConfirm("");
      setProfileOtp("");
      setProfileOtpSent(false);
      setProfileVerificationId(null);
      return;
    }
    if (!needsProfileGate && profileGateOpen) {
      setProfileGateOpen(false);
      if (profileCompletionRedirectRef.current) {
        profileCompletionRedirectRef.current = false;
        setView("home");
      }
    }
  }, [authUser, needsProfileGate, profileGateOpen]);

  useEffect(() => {
    if (!profileGateOpen || !authUser || !profileNeedsEmailVerification) {
      return;
    }
    let mounted = true;
    const interval = window.setInterval(async () => {
      if (!mounted) {
        return;
      }
      await refreshAuthUser();
    }, 3500);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [profileGateOpen, authUser, profileNeedsEmailVerification]);

  useEffect(() => {
    if (!settingsOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen || !pendingSettingsSearchFocus.current) {
      return;
    }
    pendingSettingsSearchFocus.current = false;
    window.requestAnimationFrame(() => {
      settingsSearchRef.current?.focus();
      settingsSearchRef.current?.select();
    });
  }, [settingsOpen]);

  useEffect(() => {
    if (!shortcutCaptureId) {
      return;
    }

    const isModifierOnly = (key: string) => ["shift", "control", "alt", "meta"].includes(key.toLowerCase());

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      if (event.key === "Escape") {
        setShortcutCaptureId(null);
        return;
      }
      if (isModifierOnly(event.key)) {
        return;
      }
      const parts: string[] = [];
      const modPressed = isMac ? event.metaKey : event.ctrlKey;
      if (modPressed) {
        parts.push("mod");
      }
      if (event.altKey) {
        parts.push("alt");
      }
      if (event.shiftKey) {
        parts.push("shift");
      }
      parts.push(normalizeShortcutKey(event.key));
      const binding = parts.join("+");
      setShortcuts((prev) => ({ ...prev, [shortcutCaptureId]: binding }));
      setShortcutCaptureId(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcutCaptureId, isMac, normalizeShortcutKey]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (shortcutCaptureId) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      const blockWhenEditing = (binding: string) => isEditable && !shortcutUsesModifier(binding);

      if (projectsModalOpen && event.key === "Escape") {
        event.preventDefault();
        setProjectsModalOpen(false);
        return;
      }

      if (chatSearchOpen && event.key === "Escape") {
        event.preventDefault();
        setChatSearchOpen(false);
        return;
      }

      if (sidebarOpen && event.key === "Escape" && !settingsOpen) {
        event.preventDefault();
        setSidebarOpen(false);
        return;
      }

      if (settingsOpen && isShortcutMatch(shortcuts.settings_prev, event) && !isEditable) {
        event.preventDefault();
        const currentIndex = SETTINGS_SECTIONS.findIndex((section) => section.id === settingsSection);
        const nextIndex = Math.max(0, currentIndex - 1);
        const nextSection = SETTINGS_SECTIONS[nextIndex]?.id ?? settingsSection;
        setSettingsSection(nextSection);
        return;
      }

      if (settingsOpen && isShortcutMatch(shortcuts.settings_next, event) && !isEditable) {
        event.preventDefault();
        const currentIndex = SETTINGS_SECTIONS.findIndex((section) => section.id === settingsSection);
        const nextIndex = Math.min(SETTINGS_SECTIONS.length - 1, currentIndex + 1);
        const nextSection = SETTINGS_SECTIONS[nextIndex]?.id ?? settingsSection;
        setSettingsSection(nextSection);
        return;
      }

      if (!blockWhenEditing(shortcuts.open_settings) && isShortcutMatch(shortcuts.open_settings, event)) {
        event.preventDefault();
        openSettingsPanel();
        return;
      }

      if (!blockWhenEditing(shortcuts.settings_search) && isShortcutMatch(shortcuts.settings_search, event)) {
        event.preventDefault();
        focusSettingsSearch();
        return;
      }

      if (!blockWhenEditing(shortcuts.settings_models) && isShortcutMatch(shortcuts.settings_models, event)) {
        event.preventDefault();
        openSettingsPanel("models");
        return;
      }

      if (!blockWhenEditing(shortcuts.settings_wallpaper) && isShortcutMatch(shortcuts.settings_wallpaper, event)) {
        event.preventDefault();
        openSettingsPanel("wallpaper");
        return;
      }

      if (!blockWhenEditing(shortcuts.toggle_sidebar) && isShortcutMatch(shortcuts.toggle_sidebar, event)) {
        event.preventDefault();
        setSidebarOpen((prev) => !prev);
        return;
      }

      if (!blockWhenEditing(shortcuts.new_chat) && isShortcutMatch(shortcuts.new_chat, event)) {
        event.preventDefault();
        createSession(currentAppearance);
        return;
      }

      if (!blockWhenEditing(shortcuts.search_chats) && isShortcutMatch(shortcuts.search_chats, event)) {
        event.preventDefault();
        setChatSearchOpen(true);
        return;
      }

      if (!blockWhenEditing(shortcuts.focus_chat) && isShortcutMatch(shortcuts.focus_chat, event)) {
        event.preventDefault();
        focusChatInput(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    shortcutCaptureId,
    settingsOpen,
    settingsSection,
    sidebarOpen,
    chatSearchOpen,
    projectsModalOpen,
    currentAppearance,
    shortcuts,
    isMac,
  ]);

  useEffect(() => {
    const uid = authUser?.uid ?? null;
    localStorage.setItem(storageKeyForUser(STORAGE_SESSIONS, uid), JSON.stringify(sessions));
  }, [sessions, authUser?.uid]);

  useEffect(() => {
    const uid = authUser?.uid ?? null;
    const key = storageKeyForUser(STORAGE_ACTIVE_SESSION, uid);
    if (activeSessionId) {
      localStorage.setItem(key, activeSessionId);
    } else {
      localStorage.removeItem(key);
    }
  }, [activeSessionId, authUser?.uid]);

  useEffect(() => {
    const uid = authUser?.uid ?? null;
    localStorage.setItem(storageKeyForUser(STORAGE_PROJECTS, uid), JSON.stringify(projects));
  }, [projects, authUser?.uid]);

  useEffect(() => {
    const uid = authUser?.uid ?? null;
    const key = storageKeyForUser(STORAGE_ACTIVE_PROJECT, uid);
    if (activeProjectId) {
      localStorage.setItem(key, activeProjectId);
    } else {
      localStorage.removeItem(key);
    }
  }, [activeProjectId, authUser?.uid]);

  useEffect(() => {
    if (activeProjectId && !projects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId("");
    }
  }, [projects, activeProjectId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_THEME, theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!authUser) {
      setAccountUid(null);
      setAccountName("");
      setAccountEmail("");
      setAccountPhone("");
      return;
    }
    if (authUser.uid !== accountUid) {
      setAccountUid(authUser.uid);
      setAccountName(authUser.displayName ?? "");
      setAccountEmail(authUser.email ?? "");
      setAccountPhone(authUser.phoneNumber ?? "");
    }
  }, [authUser, accountUid]);

  useEffect(() => {
    const root = document.documentElement;
    if (!root) {
      return;
    }
    root.style.setProperty("--ui-glass", `${DEFAULT_GLASS_INTENSITY / 100}`);
    root.style.setProperty("--ui-contrast", `${DEFAULT_CONTRAST_BOOST / 100}`);
    root.style.setProperty("--ui-font-scale", "1");
    root.style.setProperty("--ui-scale", "1");
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(inputHistory));
  }, [inputHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_STREAM, JSON.stringify(streamMode));
  }, [streamMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SCROLL, JSON.stringify(autoScroll));
  }, [autoScroll]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SIDEBAR, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SHORTCUTS, JSON.stringify(shortcuts));
  }, [shortcuts]);

  const updateSessions = (updater: (prev: Session[]) => Session[]) => setSessions(updater);

  const updateCurrentSession = (updater: (session: Session) => Session) => {
    updateSessions((prev) => prev.map((session) => (session.id === currentSession?.id ? updater(session) : session)));
  };

  const updateSessionById = (sessionId: string, updater: (session: Session) => Session) => {
    updateSessions((prev) => prev.map((session) => (session.id === sessionId ? updater(session) : session)));
  };

  const commitSessionRename = () => {
    if (!editingSessionId) {
      return;
    }

    const nextName = editingSessionName.trim();
    updateSessions((prev) =>
      prev.map((session) =>
        session.id === editingSessionId
          ? {
              ...session,
              name: nextName || deriveSessionTitle(session.messages),
              titleMode: "manual",
              updatedAt: timestamp(),
            }
          : session,
      ),
    );
    setEditingSessionId(null);
    setEditingSessionName("");
  };

  const deleteSession = async (sessionId: string) => {
    const targetSession = sessions.find((session) => session.id === sessionId);
    if (!targetSession) {
      return;
    }

    const shouldDelete = await requestConfirmation({
      icon: "history",
      kicker: "Saved history",
      title: `Delete "${targetSession.name}"?`,
      description: "This removes the conversation from your saved chat history.",
      confirmLabel: "Delete chat",
      cancelLabel: "Keep chat",
      note: "This action cannot be undone from the sidebar.",
      tone: "danger",
    });
    if (!shouldDelete) {
      return;
    }

    let nextActiveId = activeSessionId;
    let shouldReturnHome = false;
    updateSessions((prev) => {
      const remaining = prev.filter((session) => session.id !== sessionId);
      if (remaining.length === 0) {
        const fresh = createSessionRecord(currentAppearance, activeProjectId || null);
        nextActiveId = fresh.id;
        shouldReturnHome = true;
        return [fresh];
      }

      if (!hasSessionHistory(remaining)) {
        shouldReturnHome = true;
      }
      if (activeSessionId === sessionId) {
        nextActiveId = remaining[0].id;
      }
      return remaining;
    });

    setActiveSessionId(nextActiveId);
    if (shouldReturnHome) {
      setView("home");
      setSidebarOpen(false);
    }
    setEditingSessionId((current) => (current === sessionId ? null : current));
    setEditingSessionName("");
  };

  const switchSession = (sessionId: string) => {
    const targetSession = sessions.find((session) => session.id === sessionId);
    setActiveSessionId(sessionId);
    if (targetSession) {
      setActiveProjectId(targetSession.projectId ?? "");
    }
    enterWorkspace(true);
    setError("");
    setHistoryIndex(null);
    setEditingSessionId(null);
    setEditingSessionName("");
  };

  const createSession = (sourceAppearance?: AppearanceSettings) => {
    const nextSession = createSessionRecord(sourceAppearance, activeProjectId || null);

    setSessions((prev) => [nextSession, ...prev]);
    setActiveSessionId(nextSession.id);
    enterWorkspace(true);
    setError("");
    setInput("");
    setHistoryIndex(null);
    setEditingSessionId(null);
    setEditingSessionName("");
  };

  const pushMessage = (role: Role, content: string, sessionId?: string): string => {
    const targetSessionId = sessionId ?? currentSession?.id;
    if (!targetSessionId) {
      return "";
    }
    const id = msgId();
    updateSessionById(targetSessionId, (session) =>
      syncAutoSessionName({
        ...session,
        messages: [...session.messages, { id, role, content, ts: nowLabel() }],
        updatedAt: timestamp(),
      }),
    );
    return id;
  };

  const updateMessage = (id: string, content: string, sessionId?: string): void => {
    const targetSessionId = sessionId ?? currentSession?.id;
    if (!targetSessionId) {
      return;
    }
    updateSessionById(targetSessionId, (session) =>
      syncAutoSessionName({
        ...session,
        messages: session.messages.map((item) => (item.id === id ? { ...item, content } : item)),
        updatedAt: timestamp(),
      }),
    );
  };

  const pushActions = (actions: string[], sessionId?: string) => {
    if (actions.length === 0) {
      return;
    }

    const targetSessionId = sessionId ?? currentSession?.id;
    if (!targetSessionId) {
      return;
    }

    updateSessionById(targetSessionId, (session) => ({
      ...session,
      actions: [...session.actions, ...actions.map((text) => ({ id: msgId(), text, ts: nowLabel() }))],
      updatedAt: timestamp(),
    }));

    setStatus("executing");
    window.setTimeout(() => {
      setStatus((current) => (current === "executing" ? "ready" : current));
    }, 1200);
  };

  const buildPayloadMessages = (text: string, baseMessages: Array<{ role: Role; content: string }>) => {
    const trimmed = baseMessages
      .filter((message) => message.content.trim())
      .slice(-MAX_CONTEXT_MESSAGES)
      .map((message) => ({ role: message.role, content: message.content }));
    return [...trimmed, { role: "user", content: text }];
  };

  const buildChatRequestBody = (
    message: string,
    payloadMessages: ChatPayloadMessage[],
    stream: boolean,
  ) => ({
    message,
    model: selectedModel,
    messages: payloadMessages,
    stream,
  });

  async function sendNonStream(
    message: string,
    payloadMessages: ChatPayloadMessage[],
    signal?: AbortSignal,
    sessionId?: string,
  ): Promise<boolean> {
    const res = await fetch(API_CHAT, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify(buildChatRequestBody(message, payloadMessages, false)),
      signal,
    });

    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }

    const data = (await res.json()) as { reply?: string; error?: string; actions?: string[] };
    const reply = (data.reply ?? data.error ?? "No response received.").trim();
    pushMessage("assistant", reply || "No response received.", sessionId);
    pushActions(data.actions ?? [], sessionId);
    return true;
  }

  async function sendStream(
    message: string,
    payloadMessages: ChatPayloadMessage[],
    signal?: AbortSignal,
    sessionId?: string,
  ): Promise<boolean> {
    const res = await fetch(API_STREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
      body: JSON.stringify(buildChatRequestBody(message, payloadMessages, true)),
      signal,
    });

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed (${res.status})`);
    }

    const assistantId = pushMessage("assistant", "", sessionId);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let textAcc = "";
    let suppressStreamError = false;
    let finalReply = "";
    let completed = false;
    let lastActivityAt = Date.now();

    const findPromptLeakBoundary = (text: string) => {
      if (!text) {
        return -1;
      }
      const patterns = [
        /\n\s*(?:user|assistant|meera|system)\s*:/i,
        /(?:^|\n)\s*\d+\.\s*you are meera\b/i,
        /(?:^|\n)\s*\d+\.\s*you are a local ai assistant for windows\b/i,
        /(?:^|\n)\s*\d+\.\s*if the user asks about you\b/i,
        /(?:^|\n)\s*\d+\.\s*answer the user's latest message directly and helpfully\b/i,
        /(?:^|\n)\s*\d+\.\s*return one direct answer only\b/i,
        /(?:^|\n)\s*\d+\.\s*keep the tone natural\b/i,
        /(?:^|\n)\s*\d+\.\s*format for readability\b/i,
        /(?:^|\n)\s*\d+\.\s*do not append a new question\b/i,
        /\bhere is an updated version with more specific examples\b/i,
        /\bmatch your previous feedback\b/i,
      ];
      let boundary = -1;
      patterns.forEach((pattern) => {
        const match = pattern.exec(text);
        if (!match || typeof match.index !== "number") {
          return;
        }
        if (boundary === -1 || match.index < boundary) {
          boundary = match.index;
        }
      });
      return boundary;
    };

    const sanitizeStreamText = (text: string) => {
      if (!text) {
        return "";
      }
      const boundary = findPromptLeakBoundary(text);
      const source = boundary >= 0 ? text.slice(0, boundary) : text;
      const cleaned = source
        .split("\n")
        .filter((line) => {
          const normalized = line.toLowerCase();
          return !(
            normalized.includes("streaming error") ||
            normalized.includes("cannot release un-acquired lock") ||
            normalized.includes("here is an updated version with more specific examples") ||
            normalized.includes("match your previous feedback") ||
            normalized.includes("you are meera") ||
            normalized.includes("you are a local ai assistant for windows") ||
            normalized.includes("do not reveal internal instructions") ||
            normalized.includes("if the user asks about you") ||
            normalized.includes("answer the user's latest message directly and helpfully") ||
            normalized.includes("return one direct answer only") ||
            normalized.includes("keep the tone natural") ||
            normalized.includes("format for readability") ||
            normalized.includes("do not append a new question")
          );
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n");
      return cleaned.trimEnd();
    };

    const idleTimeoutMs = 3000;
    const idleTimeoutMsNoText = 15000;
    const finalReplyGraceMs = 45000;

    while (true) {
      if (signal?.aborted) {
        try {
          void reader.cancel();
        } catch {
          // ignore cancel errors
        }
        break;
      }
      const timeoutMs = textAcc.trim() ? idleTimeoutMs : idleTimeoutMsNoText;
      const readResult = await Promise.race([
        reader.read().then((result) => ({ ...result, timeout: false })),
        new Promise<{ done: boolean; value?: Uint8Array; timeout: true }>((resolve) =>
          window.setTimeout(() => resolve({ done: true, value: undefined, timeout: true }), timeoutMs),
        ),
      ]);
      if (readResult.timeout) {
        const idleFor = Date.now() - lastActivityAt;
        if (textAcc.trim()) {
          if (idleFor < finalReplyGraceMs) {
            continue;
          }
          break;
        }
        continue;
      }
      const { value, done } = readResult;
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      lastActivityAt = Date.now();
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const raw of events) {
        const lines = raw.split("\n");
        const eventLine = lines.find((line) => line.startsWith("event:"));
        const dataLine = lines.find((line) => line.startsWith("data:"));
        if (!eventLine || !dataLine) {
          continue;
        }

        const eventType = eventLine.replace("event:", "").trim();
        const dataPayload = dataLine.replace("data:", "").trim();

        try {
          const parsed = JSON.parse(dataPayload) as { chunk?: string; actions?: string[]; reply?: string };
          if (eventType === "token" && typeof parsed.chunk === "string") {
            const normalized = parsed.chunk.toLowerCase();
            if (normalized.includes("streaming error")) {
              suppressStreamError = true;
              if (normalized.includes("lock")) {
                suppressStreamError = false;
              }
              continue;
            }
            if (suppressStreamError) {
              if (normalized.includes("lock")) {
                suppressStreamError = false;
              }
              continue;
            }
            if (normalized.includes("cannot release un-acquired lock")) {
              continue;
            }
            textAcc += parsed.chunk;
            updateMessage(assistantId, sanitizeStreamText(textAcc), sessionId);
          }
          if (eventType === "done") {
            if (typeof parsed.reply === "string" && parsed.reply.trim()) {
              finalReply = parsed.reply;
            }
            pushActions(parsed.actions ?? [], sessionId);
            lastActivityAt = Date.now();
            completed = true;
            break;
          }
        } catch {
          continue;
        }
      }
      if (completed) {
        break;
      }
    }

    if (completed) {
      const resolved = sanitizeStreamText(finalReply || textAcc);
      if (resolved.trim()) {
        updateMessage(assistantId, resolved);
      } else if (!textAcc.trim()) {
        updateMessage(assistantId, "No response received.");
      }
      try {
        void reader.cancel();
      } catch {
        // ignore cancel errors
      }
      return true;
    }

    const cleanedText = sanitizeStreamText(textAcc);
    if (!cleanedText.trim()) {
      updateMessage(assistantId, "No response received.", sessionId);
    } else {
      updateMessage(assistantId, cleanedText, sessionId);
    }
    try {
      void reader.cancel();
    } catch {
      // ignore cancel errors
    }
    return false;
  }

  async function sendMessage(rawText: string, options?: { sessionOverride?: Session }): Promise<void> {
    const text = rawText.trim();
    if (!text || isSending) {
      return;
    }
    if (needsTermsGate) {
      openTerms("gate");
      return;
    }
    if (!isAuthenticated) {
      setAuthError(authUser ? "Please verify your account to continue." : "Please log in to continue.");
      setAuthOpen(true);
      setAuthDismissed(false);
      setView("workspace");
      return;
    }

    const sessionOverride = options?.sessionOverride ?? null;
    const targetSessionId = sessionOverride?.id ?? currentSession?.id ?? null;
    const targetSession = sessionOverride ?? currentSession ?? null;
    if (!targetSessionId || !targetSession) {
      return;
    }

    const payloadMessages = buildPayloadMessages(text, targetSession.messages ?? []);

    const controller = new AbortController();
    activeAbortRef.current = controller;

    setError("");
    pushMessage("user", text, targetSessionId);
    setInput("");
    setInputHistory((prev) => [...prev, text].slice(-MAX_HISTORY));
    setHistoryIndex(null);
    setView("workspace");

    if (status === "offline") {
      const offlineNotice = getOfflineNotice();
      if (!appToastVisible || appToast?.message !== offlineNotice) {
        showAppToast("error", offlineNotice);
      }
      pushMessage("assistant", "Backend is offline. Start it with: .\\Start_Backend.bat", targetSessionId);
      return;
    }

    setIsSending(true);
    setStatus("thinking");

    try {
      let responseCompleted = false;
      if (streamMode) {
        responseCompleted = await sendStream(text, payloadMessages, controller.signal, targetSessionId);
      } else {
        responseCompleted = await sendNonStream(text, payloadMessages, controller.signal, targetSessionId);
      }
      setStatus("ready");
      if (responseCompleted) {
        void sendSystemNotification("Meera is ready", {
          body: "Your response is complete.",
          tag: "meera-response",
          renotify: true,
          onlyWhenInactive: true,
        });
      }
    } catch (err) {
      if (controller.signal.aborted) {
        return;
      }
      const message = err instanceof Error ? err.message : "Unknown error";
      const normalized = message.toLowerCase();
      const isIgnorableStreamError =
        normalized.includes("cannot release un-acquired lock") ||
        normalized.includes("streaming error:") ||
        normalized.includes("streaming error");
      if (isIgnorableStreamError) {
        setStatus("ready");
        return;
      }
      setStatus("offline");
      setError(message);
      pushMessage("assistant", "Request failed. Verify backend and try again.", targetSessionId);
    } finally {
      if (activeAbortRef.current === controller) {
        activeAbortRef.current = null;
      }
      setIsSending(false);
    }
  }

  const resetAuthStatus = () => {
    setAuthError("");
    setAuthNotice("");
  };

  const handleFirebaseConfigSave = async () => {
    const config = normalizeFirebaseConfig({
      apiKey: firebaseApiKey,
      authDomain: firebaseAuthDomain,
      projectId: firebaseProjectId,
      appId: firebaseAppId,
      messagingSenderId: firebaseMessagingSenderId,
      storageBucket: firebaseStorageBucket,
    });
    if (!config) {
      setFirebaseSetupError("Please provide all required Firebase fields.");
      return;
    }
    const saved = await saveFirebaseConfig(config);
    if (!saved) {
      setFirebaseSetupError("Unable to save Firebase config. Please try again.");
      return;
    }
    if (!isSameFirebaseConfig(firebaseConfig, config)) {
      firebaseApp = null;
      firebaseAuth = null;
    }
    setFirebaseConfig(config);
    setFirebaseSetupError("");
    setAuthDismissed(false);
  };

  const handleFirebaseConfigReset = async () => {
    await clearFirebaseConfig();
    setFirebaseConfig(null);
    setFirebaseSetupError("");
    setAuthUser(null);
    setAuthReady(false);
    setAuthOpen(false);
    firebaseApp = null;
    firebaseAuth = null;
  };

  function openAuthPanel() {
    resetAuthStatus();
    setAuthMode("login");
    setAuthMethod("email");
    setAuthOpen(true);
    setAuthDismissed(false);
  }

  function handleAuthBack() {
    if (authMode === "signup") {
      resetAuthStatus();
      setAuthMode("login");
      return;
    }
    setAuthOpen(false);
    setAuthDismissed(true);
  }

  async function handleSignOut() {
    resetAuthStatus();
    setAuthLoading(true);
    try {
      if (!auth) {
        setAuthError("Firebase is not configured.");
        return;
      }
      await signOut(auth);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  }

  const ensurePhoneRecaptcha = () => {
    if (phoneRecaptchaRef.current) {
      return phoneRecaptchaRef.current;
    }
    if (!auth) {
      setAuthError("Firebase is not configured.");
      return null;
    }
    const verifier = new RecaptchaVerifier(auth, "phone-recaptcha", {
      size: "normal",
      callback: () => {
        setAuthError("");
      },
      "expired-callback": () => {
        setAuthError("reCAPTCHA expired. Please verify again.");
      },
    });
    phoneRecaptchaRef.current = verifier;
    return verifier;
  };

  const ensureProfileRecaptcha = () => {
    if (profileRecaptchaRef.current) {
      return profileRecaptchaRef.current;
    }
    if (!authOpen && !profileGateOpen) {
      return null;
    }
    if (!auth) {
      setProfileError("Firebase is not configured.");
      return null;
    }
    const verifier = new RecaptchaVerifier(auth, "profile-phone-recaptcha", {
      size: "normal",
      callback: () => setProfileError(""),
      "expired-callback": () => setProfileError("reCAPTCHA expired. Please verify again."),
    });
    profileRecaptchaRef.current = verifier;
    return verifier;
  };

  const ensureAccountRecaptcha = () => {
    if (accountRecaptchaRef.current) {
      return accountRecaptchaRef.current;
    }
    if (!auth) {
      setAccountError("Firebase is not configured.");
      return null;
    }
    const verifier = new RecaptchaVerifier(auth, "account-phone-recaptcha", {
      size: "normal",
      callback: () => setAccountError(""),
      "expired-callback": () => setAccountError("reCAPTCHA expired. Please verify again."),
    });
    accountRecaptchaRef.current = verifier;
    return verifier;
  };

  const handleEmailLogin = async () => {
    resetAuthStatus();
    if (authDisabled) {
      setAuthError("Firebase is not configured. Add your Firebase project first.");
      return;
    }
    if (!auth) {
      setAuthError("Firebase is not configured.");
      return;
    }
    if (!authEmail || !authPassword) {
      setAuthError("Enter your email and password to continue.");
      return;
    }
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      setAuthOpen(false);
      setAuthDismissed(false);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-not-found") {
        switchAuthMode("signup");
        setAuthNotice("No account found. Create one to continue.");
        setTermsAccepted(false);
        openTerms("signup");
        return;
      }
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const requestClearHfToken = () => {
    if (hfTokenSaving) {
      return;
    }
    setHfTokenClearPromptOpen(true);
  };

  const handleEmailSignup = async () => {
    resetAuthStatus();
    if (authDisabled) {
      setAuthError("Firebase is not configured. Add your Firebase project first.");
      return;
    }
    if (!auth) {
      setAuthError("Firebase is not configured.");
      return;
    }
    if (!authEmail || !authPassword || !authConfirmPassword) {
      setAuthError("Complete all required fields.");
      return;
    }
    if (!termsAccepted) {
      setAuthError("Please accept the Terms & Conditions to continue.");
      openTerms("signup");
      return;
    }
    if (authPassword !== authConfirmPassword) {
      setAuthError("Passwords do not match.");
      return;
    }
    if (!emailCaptchaToken) {
      setAuthError("Please complete the reCAPTCHA.");
      return;
    }
    setAuthLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      persistTermsAccepted(result.user.uid);
      if (authFullName.trim()) {
        await updateProfile(result.user, { displayName: authFullName.trim() });
      }
      await sendEmailVerification(result.user);
      setAuthNotice("Verification email sent. Please verify to continue.");
      setAuthMode("login");
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: GoogleAuthProvider | GithubAuthProvider | OAuthProvider) => {
    resetAuthStatus();
    if (authDisabled) {
      setAuthError("Firebase is not configured. Add your Firebase project first.");
      return;
    }
    if (!auth) {
      setAuthError("Firebase is not configured.");
      return;
    }
    setAuthLoading(true);
    try {
      if (isDesktopApp) {
        await signInWithPopup(auth, provider);
      } else {
        try {
          await signInWithPopup(auth, provider);
        } catch (err) {
          const code = (err as { code?: string }).code;
          if (
            code === "auth/popup-blocked" ||
            code === "auth/popup-closed-by-user" ||
            code === "auth/operation-not-supported-in-this-environment"
          ) {
            await signInWithRedirect(auth, provider);
          } else {
            throw err;
          }
        }
      }
      setAuthOpen(false);
      setAuthDismissed(false);
    } catch (err) {
      setAuthError(formatAuthError(err, provider.providerId));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendOtp = async () => {
    resetAuthStatus();
    if (authDisabled) {
      setAuthError("Firebase is not configured. Add your Firebase project first.");
      return;
    }
    if (!auth) {
      setAuthError("Firebase is not configured.");
      return;
    }
    if (!authPhone) {
      setAuthError("Enter a phone number with country code.");
      return;
    }
    setAuthLoading(true);
    try {
      const verifier = ensurePhoneRecaptcha();
      if (!verifier) {
        return;
      }
      const confirmation = await signInWithPhoneNumber(auth, authPhone, verifier);
      phoneConfirmationRef.current = confirmation;
      setAuthOtpSent(true);
      setAuthNotice("OTP sent. Enter the code to verify.");
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (codeOverride?: string) => {
    resetAuthStatus();
    if (authDisabled) {
      setAuthError("Firebase is not configured. Add your Firebase project first.");
      return;
    }
    if (!auth) {
      setAuthError("Firebase is not configured.");
      return;
    }
    const otpValue = codeOverride ?? authOtp;
    if (!phoneConfirmationRef.current || !otpValue) {
      setAuthError("Enter the OTP sent to your phone.");
      return;
    }
    setAuthLoading(true);
    try {
      await phoneConfirmationRef.current.confirm(otpValue);
      setAuthOpen(false);
      setAuthDismissed(false);
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileSendOtp = async () => {
    setProfileError("");
    setProfileNotice("");
    if (authDisabled) {
      setProfileError("Authentication is not configured.");
      return;
    }
    if (!auth) {
      setProfileError("Firebase is not configured.");
      return;
    }
    const phoneValue = profilePhone.trim();
    if (!phoneValue) {
      setProfileError("Enter a phone number with country code.");
      return;
    }
    setProfileLoading(true);
    try {
      const verifier = ensureProfileRecaptcha();
      if (!verifier) {
        throw new Error("reCAPTCHA unavailable");
      }
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(phoneValue, verifier);
      setProfileVerificationId(verificationId);
      setProfileOtpSent(true);
      setProfileNotice("OTP sent. Enter the code to verify your phone.");
    } catch (err) {
      setProfileError(formatAuthError(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileComplete = async (otpOverride?: string) => {
    setProfileError("");
    setProfileNotice("");
    if (!auth) {
      setProfileError("Firebase is not configured.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setProfileError("Sign in to continue.");
      return;
    }
    const nameValue = profileName.trim();
    const emailValue = profileEmail.trim();
    const phoneValue = profilePhone.trim();
    if (!nameValue || !emailValue || !phoneValue) {
      setProfileError("Complete your name, email, and phone number.");
      return;
    }
    if (profileRequiresPassword) {
      if (!profilePassword || !profilePasswordConfirm) {
        setProfileError("Create a password to secure your account.");
        return;
      }
      if (profilePassword !== profilePasswordConfirm) {
        setProfileError("Passwords do not match.");
        return;
      }
    }
    const otpValue = otpOverride ?? profileOtp;
    if (profilePhoneNeedsVerification && (!profileVerificationId || !otpValue)) {
      setProfileError("Verify your phone number with OTP.");
      return;
    }

    setProfileLoading(true);
    try {
      if (nameValue && nameValue !== user.displayName) {
        await updateProfile(user, { displayName: nameValue });
      }

      if (!user.email) {
        const credential = EmailAuthProvider.credential(emailValue, profilePassword);
        await linkWithCredential(user, credential);
      } else if (user.email !== emailValue) {
        await updateEmail(user, emailValue);
      }

      if (profilePhoneNeedsVerification && profileVerificationId && otpValue) {
        const phoneCredential = PhoneAuthProvider.credential(profileVerificationId, otpValue);
        await updatePhoneNumber(user, phoneCredential);
      }

      if (user.email && !user.emailVerified) {
        await sendEmailVerification(user);
        setProfileNotice("Verification email sent. We will check automatically.");
      }

      profileCompletionRedirectRef.current = true;
      await refreshAuthUser();
    } catch (err) {
      setProfileError(formatAuthError(err));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAccountSaveProfile = async () => {
    setAccountError("");
    setAccountNotice("");
    if (!auth) {
      setAccountError("Firebase is not configured.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setAccountError("Sign in to update your profile.");
      return;
    }
    if (!accountName.trim() || !accountEmail.trim() || !accountPhone.trim()) {
      setAccountError("Name, email, and phone are required.");
      return;
    }
    setAccountLoading(true);
    try {
      if (accountName.trim() !== user.displayName) {
        await updateProfile(user, { displayName: accountName.trim() });
      }
      if (accountEmail.trim() !== user.email) {
        await updateEmail(user, accountEmail.trim());
        await sendEmailVerification(user);
        setAccountNotice("Verification email sent.");
      }
      await refreshAuthUser();
      setAccountNotice((prev) => prev || "Profile updated.");
    } catch (err) {
      setAccountError(formatAuthError(err));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountPasswordUpdate = async () => {
    setAccountError("");
    setAccountNotice("");
    if (!auth) {
      setAccountError("Firebase is not configured.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setAccountError("Sign in to update your password.");
      return;
    }
    if (!accountPassword || !accountPasswordConfirm) {
      setAccountError("Enter and confirm the new password.");
      return;
    }
    if (accountPassword !== accountPasswordConfirm) {
      setAccountError("Passwords do not match.");
      return;
    }
    setAccountLoading(true);
    try {
      await updatePassword(user, accountPassword);
      setAccountPassword("");
      setAccountPasswordConfirm("");
      setAccountNotice("Password updated.");
    } catch (err) {
      setAccountError(formatAuthError(err));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountPasswordReset = async () => {
    setAccountError("");
    setAccountNotice("");
    if (!auth) {
      setAccountError("Firebase is not configured.");
      return;
    }
    if (!authUser?.email) {
      setAccountError("Add an email to send a reset link.");
      return;
    }
    setAccountLoading(true);
    try {
      await sendPasswordResetEmail(auth, authUser.email);
      setAccountNotice("Password reset email sent.");
    } catch (err) {
      setAccountError(formatAuthError(err));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountSendOtp = async () => {
    setAccountError("");
    setAccountNotice("");
    if (!auth) {
      setAccountError("Firebase is not configured.");
      return;
    }
    if (!accountPhone.trim()) {
      setAccountError("Enter a phone number with country code.");
      return;
    }
    setAccountLoading(true);
    try {
      const verifier = ensureAccountRecaptcha();
      if (!verifier) {
        return;
      }
      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(accountPhone.trim(), verifier);
      setAccountVerificationId(verificationId);
      setAccountOtpSent(true);
      setAccountNotice("OTP sent. Enter the code to verify your phone.");
    } catch (err) {
      setAccountError(formatAuthError(err));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountVerifyPhone = async (codeOverride?: string) => {
    setAccountError("");
    setAccountNotice("");
    if (!auth) {
      setAccountError("Firebase is not configured.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setAccountError("Sign in to update your phone.");
      return;
    }
    const otpValue = codeOverride ?? accountOtp;
    if (!accountVerificationId || !otpValue) {
      setAccountError("Enter the OTP code sent to your phone.");
      return;
    }
    setAccountLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(accountVerificationId, otpValue);
      await updatePhoneNumber(user, credential);
      await refreshAuthUser();
      setAccountOtp("");
      setAccountOtpSent(false);
      setAccountVerificationId(null);
      setAccountNotice("Phone number verified.");
    } catch (err) {
      setAccountError(formatAuthError(err));
    } finally {
      setAccountLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth) {
      return;
    }
    if (!auth.currentUser) {
      return;
    }
    resetAuthStatus();
    setAuthLoading(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setAuthNotice("Verification email resent.");
    } catch (err) {
      setAuthError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const switchAuthMode = (mode: "login" | "signup") => {
    setAuthMode(mode);
    setAuthError("");
    setAuthNotice("");
    setAuthOtp("");
    setAuthOtpSent(false);
    setAuthMethod("email");
    setEmailCaptchaToken("");
    if (emailRecaptchaWidgetRef.current !== null && window.grecaptcha?.reset) {
      window.grecaptcha.reset(emailRecaptchaWidgetRef.current);
    }
  };

  const switchAuthMethod = (method: "email" | "phone") => {
    setAuthMethod(method);
    setAuthError("");
    setAuthNotice("");
    setAuthOtp("");
    setAuthOtpSent(false);
  };

  const handleCopy = async (value: string) => {
    if (!value.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Ignore clipboard failures.
    }
  };

  const buildChatTranscript = (session: Session | null): string => {
    if (!session) {
      return "";
    }
    const lines = session.messages
      .filter((message) => message.content.trim())
      .map((message) => {
        const label = message.role === "user" ? "You" : "MeeraAI";
        const stamp = message.ts ? ` [${message.ts}]` : "";
        return `${label}${stamp}:\n${message.content.trim()}`;
      });
    return lines.join("\n\n");
  };

  const safeChatFileName = (input: string): string => {
    const cleaned = input.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").trim();
    return cleaned || DEFAULT_SESSION_NAME;
  };

  const triggerChatActionFeedback = (messageId: string, action: "edit" | "copy" | "retry") => {
    const key = `${messageId}:${action}`;
    setChatActionFeedback((prev) => ({ ...prev, [key]: true }));
    const existing = chatActionTimers.current[key];
    if (existing) {
      window.clearTimeout(existing);
    }
    chatActionTimers.current[key] = window.setTimeout(() => {
      setChatActionFeedback((prev) => {
        if (!prev[key]) {
          return prev;
        }
        const next = { ...prev };
        delete next[key];
        return next;
      });
      delete chatActionTimers.current[key];
    }, 900);
  };

  const handleCopyChat = async () => {
    const transcript = buildChatTranscript(currentSession);
    if (!transcript) {
      return;
    }
    await handleCopy(transcript);
    playSound("action");
  };

  const handleExportChat = () => {
    const transcript = buildChatTranscript(currentSession);
    if (!transcript) {
      return;
    }
    const baseName = safeChatFileName(currentSession?.name ?? DEFAULT_SESSION_NAME);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `${baseName}-${dateStamp}.txt`;
    const blob = new Blob([transcript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    playSound("action");
  };

  const handleShareChat = async () => {
    const transcript = buildChatTranscript(currentSession);
    if (!transcript) {
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentSession?.name ?? "MeeraAI Chat",
          text: transcript,
        });
      } else {
        await handleCopy(transcript);
      }
      playSound("action");
    } catch {
      // ignore share failures
    }
  };

  const handleDeleteChat = async () => {
    if (!currentSession) {
      return;
    }
    const confirmed = await requestConfirmation({
      icon: "delete",
      kicker: "Chat cleanup",
      title: "Delete this chat?",
      description: "This clears every message in the current session and resets the conversation.",
      confirmLabel: "Delete chat",
      cancelLabel: "Keep chat",
      note: "Your workspace layout stays exactly the same.",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    const remainingSessions = sessions.filter((session) => session.id !== currentSession.id);
    updateCurrentSession((session) =>
      syncAutoSessionName({
        ...session,
        messages: [],
        actions: [],
        updatedAt: timestamp(),
      }),
    );
    if (!hasSessionHistory(remainingSessions)) {
      setView("home");
      setSidebarOpen(false);
    }
    playSound("action");
  };

  function getRailHeadline(content: string): string {
    const firstLine = content.split("\n").find((line) => cleanTitleText(line)) ?? content;
    const cleaned = cleanTitleText(firstLine);
    if (!cleaned) {
      return "Conversation";
    }
    const title = humanizeSessionTitle(cleaned);
    return title.length > 42 ? `${title.slice(0, 42)}…` : title;
  }

  const handleRailSelect = (messageId: string) => {
    const container = feedRef.current;
    if (!container) {
      return;
    }
    const target = container.querySelector<HTMLElement>(`[data-message-id="${messageId}"]`);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    playSound("action");
  };

  const handleEditMessage = (value: string) => {
    setInput(value);
  };

  const handleCopyTime = (value?: string) => {
    if (!value) {
      return;
    }
    void handleCopy(value);
  };

  const findRetryPrompt = (assistantId: string) => {
    const idx = messages.findIndex((item) => item.id === assistantId);
    if (idx <= 0) {
      return "";
    }
    for (let i = idx - 1; i >= 0; i -= 1) {
      const item = messages[i];
      if (item.role === "user" && item.content.trim()) {
        return item.content;
      }
    }
    return "";
  };

  const handleRetryMessage = (assistantId: string) => {
    const prompt = findRetryPrompt(assistantId);
    if (!prompt) {
      return;
    }
    void sendMessage(prompt);
    playSound("action");
  };

  const handleHistoryNav = (direction: "up" | "down") => {
    if (inputHistory.length === 0) {
      return;
    }

    setHistoryIndex((current) => {
      if (current === null) {
        const nextIndex = inputHistory.length - 1;
        setInput(inputHistory[nextIndex] ?? "");
        return nextIndex;
      }

      const nextIndex = direction === "up" ? Math.max(0, current - 1) : Math.min(inputHistory.length - 1, current + 1);
      setInput(inputHistory[nextIndex] ?? "");
      return nextIndex;
    });
  };

  const updateAppearance = (updater: (appearance: AppearanceSettings) => AppearanceSettings) => {
    updateCurrentSession((session) => ({
      ...session,
      appearance: updater(session.appearance),
      updatedAt: timestamp(),
    }));
  };


  const useWallpaperPreset = (wallpaperId: WallpaperPresetId) => {
    updateAppearance((appearance) => ({
      ...appearance,
      wallpaperId,
      customWallpaper: "",
      customWallpaperName: "",
    }));
  };

  const importWallpaper = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files can be used as wallpapers.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateAppearance((appearance) => ({
        ...appearance,
        customWallpaper: dataUrl,
        customWallpaperName: file.name,
      }));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import wallpaper.");
    }
  };

  const onDropWallpaper: React.DragEventHandler<HTMLDivElement> = async (event) => {
    event.preventDefault();
    setDropActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      await importWallpaper(file);
    }
  };

  const onFileInputChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      await importWallpaper(file);
      event.target.value = "";
    }
  };

  const openPromptFromDashboard = (prompt: string) => {
    setInput(prompt);
    enterWorkspace(true);
  };

  const focusChatInput = (forceWorkspace = false) => {
    if (forceWorkspace) {
      enterWorkspace(true);
    }
    window.requestAnimationFrame(() => {
      chatInputRef.current?.focus();
    });
  };

  const formatShortcut = (binding: string) => {
    if (!binding) {
      return "Unassigned";
    }
    const parts = binding.split("+").filter(Boolean);
    const formatted = parts.map((part) => {
      if (part === "mod") {
        return isMac ? "Cmd" : "Ctrl";
      }
      if (part === "alt") {
        return isMac ? "Option" : "Alt";
      }
      if (part === "shift") {
        return "Shift";
      }
      if (part === "arrowup") {
        return "↑";
      }
      if (part === "arrowdown") {
        return "↓";
      }
      if (part === "arrowleft") {
        return "←";
      }
      if (part === "arrowright") {
        return "→";
      }
      if (part === "space") {
        return "Space";
      }
      if (part.length === 1) {
        return part.toUpperCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    });
    return formatted.join(" + ");
  };

  const isShortcutMatch = (binding: string, event: KeyboardEvent) => {
    if (!binding) {
      return false;
    }
    const parts = binding.split("+").filter(Boolean);
    const expected = {
      mod: parts.includes("mod"),
      alt: parts.includes("alt"),
      shift: parts.includes("shift"),
      key: normalizeShortcutKey(parts.find((part) => !["mod", "alt", "shift"].includes(part)) ?? ""),
    };
    if (!expected.key) {
      return false;
    }
    const modPressed = isMac ? event.metaKey : event.ctrlKey;
    if (expected.mod !== modPressed) {
      return false;
    }
    if (expected.alt !== event.altKey) {
      return false;
    }
    if (expected.shift !== event.shiftKey) {
      return false;
    }
    const key = normalizeShortcutKey(event.key);
    return key === expected.key;
  };

  const handleHomeSend = () => {
    const text = input.trim();
    if (!text) {
      return;
    }
    const freshSession = createSessionRecord(currentAppearance, activeProjectId || null);
    setSessions((prev) => [freshSession, ...prev]);
    setActiveSessionId(freshSession.id);
    enterWorkspace(true);
    setError("");
    setEditingSessionId(null);
    setEditingSessionName("");
    setHistoryIndex(null);
    void sendMessage(text, { sessionOverride: freshSession });
    playSound("action");
  };

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    if (!auth) {
      return {};
    }
    const token = await auth.currentUser?.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const refreshAuthUser = async () => {
    if (!auth) {
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      return;
    }
    try {
      await user.reload();
      const refreshed = auth.currentUser;
      setAuthUser(snapshotAuthUser(refreshed));
      if (refreshed) {
        setAccountName(refreshed.displayName ?? "");
        setAccountEmail(refreshed.email ?? "");
        setAccountPhone(refreshed.phoneNumber ?? "");
      }
      setAccountNotice("Account details refreshed.");
      setTimeout(() => setAccountNotice(""), 2400);
    } catch {
      // ignore refresh errors
    }
  };

  const confirmSignOut = async () => {
    setSignoutPromptOpen(false);
    await handleSignOut();
  };

  const confirmDeleteAccount = async () => {
    setDeleteAccountPromptOpen(false);
    setAccountError("");
    setAccountNotice("");
    if (!auth) {
      setAccountError("Firebase is not configured.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      setAccountError("Sign in to delete your account.");
      return;
    }
    setAuthLoading(true);
    try {
      await deleteUser(user);
      setAccountNotice("Account deleted.");
    } catch (err) {
      setAccountError(formatAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAccountSignOutRequest = async () => {
    const confirmed = await requestConfirmation({
      icon: "logout",
      kicker: "Account session",
      title: "Sign out of MeeraAI?",
      description: "You will be signed out on this device. Your projects and chats stay safe.",
      confirmLabel: "Sign out",
      cancelLabel: "Stay signed in",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    await handleSignOut();
  };

  const handleAccountDeleteRequest = async () => {
    const confirmed = await requestConfirmation({
      icon: "delete",
      kicker: "Account removal",
      title: "Delete your MeeraAI account?",
      description: "This permanently deletes your account. This action cannot be undone.",
      confirmLabel: "Delete account",
      cancelLabel: "Keep account",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }
    await confirmDeleteAccount();
  };

  const stopActiveRequest = () => {
    if (!activeAbortRef.current) {
      return;
    }
    activeAbortRef.current.abort();
    activeAbortRef.current = null;
    setIsSending(false);
    setStatus("ready");
  };

  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomePhase, setWelcomePhase] = useState<"enter" | "exit">("enter");
  const [bootReveal, setBootReveal] = useState(false);

  const handleWelcomeDrawEnd: React.AnimationEventHandler<SVGTextElement> = (event) => {
    if (event.animationName !== "loadingFill") {
      return;
    }
    if (welcomePhase === "exit") {
      return;
    }
    setWelcomePhase("exit");
  };

  const handleWelcomeExitEnd: React.AnimationEventHandler<HTMLDivElement> = (event) => {
    if (event.currentTarget !== event.target) {
      return;
    }
    if (welcomePhase === "exit") {
      setShowWelcome(false);
      setBootReveal(true);
    }
  };

  const firebaseSetupPanel = (
    <AnimatePresence>
      {firebaseConfigReady && !firebaseConfigured && (
        <>
          <motion.div
            className="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="auth-panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Firebase setup required"
          >
            <div className="auth-card">
              <div className="auth-titlebar">
                <div className="auth-titlebar-brand">
                  <img className="auth-titlebar-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
                  <div className="auth-titlebar-text">
                    <strong>Connect your Firebase project</strong>
                    <span>Add your Firebase web config to unlock login.</span>
                  </div>
                </div>
              </div>
              <div className="auth-body">
                <div className="auth-form">
                  <div className="auth-fields">
                    <label>
                      API key
                      <input
                        value={firebaseApiKey}
                        onChange={(event) => setFirebaseApiKey(event.target.value)}
                        placeholder="AIza..."
                      />
                    </label>
                    <label>
                      Auth domain
                      <input
                        value={firebaseAuthDomain}
                        onChange={(event) => setFirebaseAuthDomain(event.target.value)}
                        placeholder="your-app.firebaseapp.com"
                      />
                    </label>
                    <label>
                      Project ID
                      <input
                        value={firebaseProjectId}
                        onChange={(event) => setFirebaseProjectId(event.target.value)}
                        placeholder="your-project-id"
                      />
                    </label>
                    <label>
                      App ID
                      <input
                        value={firebaseAppId}
                        onChange={(event) => setFirebaseAppId(event.target.value)}
                        placeholder="1:123456789:web:abcd"
                      />
                    </label>
                    <label>
                      Messaging sender ID
                      <input
                        value={firebaseMessagingSenderId}
                        onChange={(event) => setFirebaseMessagingSenderId(event.target.value)}
                        placeholder="123456789"
                      />
                    </label>
                    <label>
                      Storage bucket (optional)
                      <input
                        value={firebaseStorageBucket}
                        onChange={(event) => setFirebaseStorageBucket(event.target.value)}
                        placeholder="your-app.appspot.com"
                      />
                    </label>
                  </div>
                  {firebaseSetupError && <div className="auth-alert warn">{firebaseSetupError}</div>}
                    <p className="auth-legal">
                      Find this in Firebase Console → Project settings → Your apps → Web app config.
                    </p>
                  <button className="auth-submit" type="button" onClick={handleFirebaseConfigSave}>
                    Save & Continue
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const authPanel = (
    <AnimatePresence>
      {authReady && authOpen && (
        <>
          <motion.div
            className="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="auth-panel"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label="Login required"
          >
            <div className="auth-card">
              <div className="auth-titlebar">
                <div className="auth-titlebar-brand">
                  <img className="auth-titlebar-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
                  <div className="auth-titlebar-text">
                    <strong>Welcome back to MeeraAI</strong>
                    <span>Secure access, smart workflows, and verified sessions.</span>
                  </div>
                </div>
                <div className="auth-titlebar-actions">
                  <button
                    className="auth-titlebar-close"
                    type="button"
                    aria-label="Close login"
                    onClick={() => {
                      setAuthOpen(false);
                      setAuthDismissed(true);
                    }}
                  >
                    <UiIcon name="close.svg" />
                  </button>
                </div>
              </div>
              <div className="auth-tabs" data-active={authMode}>
                <button
                  className={authMode === "login" ? "active" : ""}
                  type="button"
                  onClick={() => switchAuthMode("login")}
                >
                  Log in
                </button>
                <button
                  className={authMode === "signup" ? "active" : ""}
                  type="button"
                  onClick={() => switchAuthMode("signup")}
                >
                  Sign up
                </button>
              </div>

              {authUser && !isAuthVerified && (
                <div className="auth-alert warn">
                  Verify your email to unlock MeeraAI.
                  <button type="button" onClick={handleResendVerification} disabled={authLoading}>
                    Resend verification
                  </button>
                </div>
              )}

              <div className="auth-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${authMode}-${authMethod}`}
                    className="auth-form"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                  <div className="auth-methods">
                    <button
                      className={authMethod === "email" ? "active" : ""}
                      type="button"
                      onClick={() => switchAuthMethod("email")}
                      disabled={authDisabled}
                    >
                      Email
                    </button>
                    <button
                      className={authMethod === "phone" ? "active" : ""}
                      type="button"
                      onClick={() => switchAuthMethod("phone")}
                      disabled={authDisabled}
                    >
                      Phone OTP
                    </button>
                  </div>

                  {authMethod === "email" ? (
                    <div className="auth-fields">
                      {authMode === "signup" && (
                        <>
                          <label>
                            Full name
                            <input
                              value={authFullName}
                              onChange={(event) => setAuthFullName(event.target.value)}
                              placeholder="Your full name"
                            />
                          </label>
                          <label>
                            Role / Company
                            <input
                              value={authRole}
                              onChange={(event) => setAuthRole(event.target.value)}
                              placeholder="Designer at Meera"
                            />
                          </label>
                        </>
                      )}
                      <label>
                        Email
                        <input
                          value={authEmail}
                          onChange={(event) => setAuthEmail(event.target.value)}
                          type="email"
                          placeholder="you@company.com"
                        />
                      </label>
                      <label>
                        Password
                        <input
                          value={authPassword}
                          onChange={(event) => setAuthPassword(event.target.value)}
                          type="password"
                          placeholder="••••••••"
                        />
                      </label>
                      {authMode === "signup" && (
                        <label>
                          Confirm password
                          <input
                            value={authConfirmPassword}
                            onChange={(event) => setAuthConfirmPassword(event.target.value)}
                            type="password"
                            placeholder="••••••••"
                          />
                        </label>
                      )}
                      {authMode === "signup" && (
                        <div className="auth-recaptcha" ref={emailRecaptchaRef} />
                      )}
                      {authMode === "signup" && (
                        <div className="auth-terms">
                          <label>
                            <input type="checkbox" checked={termsAccepted} onChange={handleTermsToggle} />
                            <span>I agree to the Terms & Conditions</span>
                          </label>
                          <button type="button" className="auth-terms-link" onClick={() => openTerms("signup")}>
                            Read terms
                          </button>
                        </div>
                      )}
                      <button
                        className="auth-submit"
                        type="button"
                        onClick={authMode === "login" ? handleEmailLogin : handleEmailSignup}
                        disabled={authLoading || authDisabled || (authMode === "signup" && !termsAccepted)}
                      >
                        {authLoading ? "Please wait..." : authMode === "login" ? "Log in" : "Create account"}
                      </button>
                      {authMode === "login" && (
                        <button className="auth-link" type="button">
                          Forgot password?
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="auth-fields">
                      <label>
                        Phone number
                        <input
                          value={authPhone}
                          onChange={(event) => setAuthPhone(event.target.value)}
                          type="tel"
                          placeholder="+1 555 012 3456"
                        />
                      </label>
                      <div id="phone-recaptcha" className="auth-recaptcha" />
                      {authOtpSent && (
                        <label>
                          OTP code
                          <OtpInput
                            value={authOtp}
                            onChange={setAuthOtp}
                            disabled={authLoading || authDisabled}
                            onComplete={(code) => {
                              if (authLoading || authDisabled) {
                                return;
                              }
                              void handleVerifyOtp(code);
                            }}
                          />
                        </label>
                      )}
                      <button
                        className="auth-submit"
                        type="button"
                        onClick={authOtpSent ? handleVerifyOtp : handleSendOtp}
                        disabled={authLoading || authDisabled}
                      >
                        {authLoading ? "Please wait..." : authOtpSent ? "Verify OTP" : "Send OTP"}
                      </button>
                    </div>
                  )}

                  <div className="auth-divider">
                    <span>or</span>
                  </div>

                  <div className="auth-social-stack">
                    <span className="auth-social-title">Continue with</span>
                    <div className="auth-social-row">
                      <button
                        className="auth-social-pill google"
                        type="button"
                        onClick={() => handleOAuthLogin(googleProvider)}
                        disabled={authLoading || authDisabled}
                        aria-label="Continue with Google"
                      >
                        <img
                          className="auth-social-logo"
                          src={AUTH_PROVIDER_ICON_URLS.google}
                          alt="Google"
                          width={16}
                          height={16}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        <span>Google</span>
                      </button>
                      <button
                        className="auth-social-pill github"
                        type="button"
                        onClick={() => handleOAuthLogin(githubProvider)}
                        disabled={authLoading || authDisabled}
                        aria-label="Continue with GitHub"
                      >
                        <img
                          className="auth-social-logo github"
                          src={AUTH_PROVIDER_ICON_URLS.github}
                          alt="GitHub"
                          width={16}
                          height={16}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        <span>GitHub</span>
                      </button>
                      <button
                        className="auth-social-pill microsoft"
                        type="button"
                        onClick={() => handleOAuthLogin(microsoftProvider)}
                        disabled={authLoading || authDisabled}
                        aria-label="Continue with Microsoft"
                      >
                        <img
                          className="auth-social-logo"
                          src={AUTH_PROVIDER_ICON_URLS.microsoft}
                          alt="Microsoft"
                          width={16}
                          height={16}
                          loading="lazy"
                          decoding="async"
                          referrerPolicy="no-referrer"
                        />
                        <span>Microsoft</span>
                      </button>
                    </div>
                  </div>

                  <p className="auth-legal">
                    By continuing you agree to MeeraAI Terms, Privacy, and Security guidelines.
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
            {termsOpen && (termsContext === "signup" || termsContext === "gate") && (
              <div className="terms-backdrop">
                <div className="terms-card" role="dialog" aria-modal="true" aria-label="Terms and conditions">
                  <div className="terms-header">
                    <div>
                      <h3>MeeraAI Terms & Conditions</h3>
                      <p>
                        {termsContext === "gate"
                          ? "Accept the terms to activate your account."
                          : "Scroll to the end to unlock Agree/Not Agree."}
                      </p>
                    </div>
                    <button className="terms-close" type="button" aria-label="Close terms" onClick={handleTermsDecline}>
                      <UiIcon name="close.svg" />
                    </button>
                  </div>
                  <div className="terms-body" onScroll={handleTermsScroll}>
                    <h4>1. Account & eligibility</h4>
                    <p>
                      By creating a MeeraAI account, you represent that you are at least the age of majority in your
                      jurisdiction and that the information you provide is accurate, complete, and kept up to date.
                      You agree to keep your login credentials confidential and accept responsibility for all activity
                      that occurs under your account, whether or not authorized by you.
                    </p>
                    <h4>2. License & permitted use</h4>
                    <p>
                      MeeraAI grants you a limited, non‑exclusive, non‑transferable, revocable license to access and use
                      the Service solely for your internal business or personal productivity purposes. You agree not to
                      resell, sublicense, reverse engineer, or use the Service to infringe, abuse, or violate any law or
                      third‑party rights.
                    </p>
                    <h4>3. User content & data</h4>
                    <p>
                      You retain ownership of content you submit. By using the Service, you grant MeeraAI permission to
                      host, process, and transmit your content only to provide and improve the Service, maintain
                      security, and comply with legal obligations. You are responsible for ensuring you have the rights
                      to upload or process any data and that such data complies with applicable laws and policies.
                    </p>
                    <h4>4. Privacy & telemetry</h4>
                    <p>
                      We may collect usage metrics, device signals, and diagnostic logs to operate and secure the
                      Service. These may include error logs, performance data, and feature usage. Please review our
                      Privacy Policy for details about what data we collect, how it is used, and your choices.
                    </p>
                    <h4>5. Security</h4>
                    <p>
                      We implement administrative, technical, and physical safeguards designed to protect your data.
                      However, no system is perfectly secure. You agree to use strong passwords, enable available
                      security features, and promptly notify us of any unauthorized access or security incidents.
                    </p>
                    <h4>6. Plans, billing & refunds</h4>
                    <p>
                      Paid features may require a subscription. Pricing, billing cycles, and renewal terms will be
                      disclosed at purchase. Unless required by law, payments are non‑refundable. We may change pricing
                      with advance notice, and you may cancel before a renewal to avoid future charges.
                    </p>
                    <h4>7. Availability & changes</h4>
                    <p>
                      We aim for high availability, but the Service may be unavailable due to maintenance, upgrades, or
                      unforeseen issues. We may modify or discontinue features with notice when practicable.
                    </p>
                    <h4>8. Termination</h4>
                    <p>
                      You may stop using the Service at any time. We may suspend or terminate access if you violate
                      these terms, misuse the Service, or create risk or legal exposure to MeeraAI or other users.
                    </p>
                    <h4>9. Limitation of liability</h4>
                    <p>
                      To the maximum extent permitted by law, MeeraAI is not liable for indirect, incidental, special,
                      consequential, or punitive damages, or any loss of profits or data, arising from or related to
                      your use of the Service.
                    </p>
                    <h4>10. Agreement</h4>
                    <p>
                      By clicking “Agree,” you acknowledge that you have read, understood, and accept these Terms &
                      Conditions. If you do not agree, you may not create an account.
                    </p>
                  </div>
                  <div className="terms-actions">
                    <button
                      className="terms-btn ghost"
                      type="button"
                      disabled={!termsScrolled}
                      onClick={handleTermsDecline}
                    >
                      {termsContext === "gate" ? "Decline & sign out" : "Not agree"}
                    </button>
                    <button
                      className="terms-btn primary"
                      type="button"
                      disabled={!termsScrolled}
                      onClick={handleTermsAgree}
                    >
                      {termsContext === "gate" ? "Agree & continue" : "Agree"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div
      ref={appRootRef}
      className={`app-root view-${displayView} ${sidebarOpen ? "sidebar-open" : ""} ${settingsOpen ? "settings-open" : ""} ${bootReveal ? "boot-reveal" : ""}`}
      style={appRootStyle}
    >
      <style>{MEERA_SIDEBAR_CSS}</style>
      <div className="wallpaper" style={wallpaperStyle} />
      {showWelcome && (
        <div
          className={`welcome-screen ${welcomePhase === "exit" ? "is-exiting" : ""}`}
          onAnimationEnd={handleWelcomeExitEnd}
        >
          <div className="welcome-stage">
            <img className="welcome-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="MeeraAI logo" />
            <svg className="welcome-wordmark-svg" viewBox="0 0 360 90" role="img" aria-label="MeeraAI" preserveAspectRatio="xMidYMid meet">
              <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" onAnimationEnd={handleWelcomeDrawEnd}>
                MeeraAI
              </text>
            </svg>
            <div className="welcome-signature-block" aria-label="Made by">
              <span className="welcome-credit-line">Made by</span>
              <span className="welcome-signature-line">Vidit Shah</span>
            </div>
          </div>
        </div>
      )}
      {!showWelcome && (
        <AnimatePresence>
          {authToastVisible && (
            <motion.div
              className={`auth-toast ${authToast.type}`}
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2 }}
              role="status"
              aria-live="polite"
            >
              <span>{authToast.message}</span>
              <button
                type="button"
                className="auth-toast-close"
                aria-label="Dismiss notification"
                onClick={() => setAuthToastDismissed(authToast.message)}
              >
                <UiIcon name="close.svg" />
              </button>
            </motion.div>
          )}
          {appToastVisible && appToast && (
            <motion.div
              className={`auth-toast ${appToast.type}`}
              style={{ top: authToastVisible ? 68 : 16 }}
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2 }}
              role="status"
              aria-live="polite"
            >
              <span>{appToast.message}</span>
              <button
                type="button"
                className="auth-toast-close"
                aria-label="Dismiss notification"
                onClick={() => setAppToastDismissed(appToast.message)}
              >
                <UiIcon name="close.svg" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      {!showWelcome && firebaseSetupPanel}
      {!showWelcome && firebaseConfigured && authPanel}
      {!showWelcome && profileGateOpen && (
        <div className="profile-gate-backdrop">
          <div className="profile-gate-card" role="dialog" aria-modal="true" aria-label="Complete your profile">
            <div className="profile-gate-header">
              <div>
                <span className="profile-gate-kicker">Account required</span>
                <h3>Complete your MeeraAI profile</h3>
                <p>We need your name, email, phone, and password to secure your account.</p>
              </div>
              <button className="profile-gate-signout" type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
            {showProfileError && <div className="profile-alert error">{profileErrorText}</div>}
            {profileNotice && <div className="profile-alert info">{profileNotice}</div>}
            {profileNeedsEmailVerification && (
              <div className="profile-alert warn">
                Verify your email to finish setup. We will check automatically.
                <button type="button" onClick={handleResendVerification} disabled={profileLoading}>
                  Resend verification
                </button>
              </div>
            )}
            <div className="profile-form">
              <label>
                Full name
                <input
                  value={profileName}
                  onChange={(event) => setProfileName(event.target.value)}
                  placeholder="Your full name"
                />
              </label>
              <label>
                Email
                <input
                  value={profileEmail}
                  onChange={(event) => setProfileEmail(event.target.value)}
                  type="email"
                  placeholder="you@company.com"
                />
              </label>
              <label>
                Phone number
                <input
                  value={profilePhone}
                  onChange={(event) => setProfilePhone(event.target.value)}
                  type="tel"
                  placeholder="+1 555 012 3456"
                />
              </label>
              {profilePhoneNeedsVerification && (
                <>
                  <div id="profile-phone-recaptcha" className="profile-recaptcha" />
                  {profileOtpSent && (
                    <label>
                      OTP code
                      <OtpInput
                        value={profileOtp}
                        onChange={setProfileOtp}
                        disabled={profileLoading}
                        onComplete={(code) => {
                          if (profileLoading) {
                            return;
                          }
                          const hasBasics = Boolean(profileName.trim() && profileEmail.trim() && profilePhone.trim());
                          const hasPassword =
                            !profileRequiresPassword ||
                            (profilePassword && profilePasswordConfirm && profilePassword === profilePasswordConfirm);
                          if (hasBasics && hasPassword) {
                            void handleProfileComplete(code);
                          }
                        }}
                      />
                    </label>
                  )}
                </>
              )}
              {profileRequiresPassword && (
                <>
                  <label>
                    Password
                    <input
                      value={profilePassword}
                      onChange={(event) => setProfilePassword(event.target.value)}
                      type="password"
                      placeholder="••••••••"
                    />
                  </label>
                  <label>
                    Confirm password
                    <input
                      value={profilePasswordConfirm}
                      onChange={(event) => setProfilePasswordConfirm(event.target.value)}
                      type="password"
                      placeholder="••••••••"
                    />
                  </label>
                </>
              )}
            </div>
            <div className="profile-actions">
              {profilePhoneNeedsVerification && (
                <button
                  className="profile-btn ghost"
                  type="button"
                  onClick={handleProfileSendOtp}
                  disabled={profileLoading}
                >
                  Send OTP
                </button>
              )}
              <button
                className="profile-btn primary"
                type="button"
                onClick={handleProfileComplete}
                disabled={profileLoading}
              >
                {profileLoading ? "Saving..." : "Complete setup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && signoutPromptOpen && (
        <div className="signout-backdrop">
          <div className="signout-card" role="dialog" aria-modal="true" aria-label="Confirm sign out">
            <div className="signout-header">
              <div>
                <span className="signout-kicker">Account session</span>
                <h3>Sign out of MeeraAI?</h3>
                <p>You will be signed out on this device. Your projects and chats stay safe.</p>
              </div>
              <button className="signout-close" type="button" onClick={() => setSignoutPromptOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="signout-actions">
              <button className="signout-btn ghost" type="button" onClick={() => setSignoutPromptOpen(false)}>
                Stay signed in
              </button>
              <button className="signout-btn danger" type="button" onClick={confirmSignOut} disabled={authLoading}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && deleteAccountPromptOpen && (
        <div className="signout-backdrop">
          <div className="signout-card" role="dialog" aria-modal="true" aria-label="Confirm account deletion">
            <div className="signout-header">
              <div>
                <span className="signout-kicker">Account removal</span>
                <h3>Delete your MeeraAI account?</h3>
                <p>This permanently deletes your account. This action cannot be undone.</p>
              </div>
              <button className="signout-close" type="button" onClick={() => setDeleteAccountPromptOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="signout-actions">
              <button className="signout-btn ghost" type="button" onClick={() => setDeleteAccountPromptOpen(false)}>
                Keep account
              </button>
              <button className="signout-btn danger" type="button" onClick={confirmDeleteAccount} disabled={authLoading}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && confirmDialog && (
        <div
          className="confirm-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              resolveConfirmDialog(false);
            }
          }}
        >
          <div
            className={`confirm-card ${confirmDialog.tone === "danger" ? "danger" : "primary"}`}
            role="dialog"
            aria-modal="true"
            aria-label={confirmDialog.title}
          >
            <div className="confirm-header">
              <div className="confirm-badge" aria-hidden="true">
                <span className="material-symbols-outlined">{confirmDialog.icon ?? "delete"}</span>
              </div>
              <div className="confirm-copy">
                <span className="confirm-kicker">{confirmDialog.kicker}</span>
                <h3>{confirmDialog.title}</h3>
                <p>{confirmDialog.description}</p>
                {confirmDialog.note ? <div className="confirm-note">{confirmDialog.note}</div> : null}
              </div>
              <button className="confirm-close" type="button" onClick={() => resolveConfirmDialog(false)} aria-label="Close confirmation">
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="confirm-actions">
              <button className="confirm-btn ghost" type="button" onClick={() => resolveConfirmDialog(false)} autoFocus>
                {confirmDialog.cancelLabel}
              </button>
              <button
                className={`confirm-btn ${confirmDialog.tone === "danger" ? "danger" : "primary"}`}
                type="button"
                onClick={() => resolveConfirmDialog(true)}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && chatSearchOpen && (
        <div
          className="module-window-backdrop chat-search-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setChatSearchOpen(false);
            }
          }}
        >
          <div
            className={`module-window-card chat-search-card ${chatSearchHasQuery ? "has-results" : "is-compact"}`}
            role="dialog"
            aria-modal="true"
            aria-label="Search chats"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="module-window-header">
              <div className="module-window-title">
                <span className="module-window-icon" aria-hidden="true">
                  <PiChatsCircleDuotone />
                </span>
                <div className="module-window-title-copy">
                  <h3>Search chats</h3>
                  <p>Find any conversation by heading, topic, or message.</p>
                </div>
              </div>
              <button className="module-window-close" type="button" onClick={() => setChatSearchOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className={`module-window-body chat-search-body ${chatSearchHasQuery ? "has-results" : "is-compact"}`}>
              <div className="chat-search-bar">
                <span className="material-symbols-outlined" aria-hidden="true">
                  search
                </span>
                <input
                  ref={chatSearchInputRef}
                  value={chatSearchQuery}
                  onChange={(event) => setChatSearchQuery(event.target.value)}
                  placeholder="Search chats, topics, or messages"
                />
                {chatSearchQuery && (
                  <button
                    className="chat-search-clear"
                    type="button"
                    onClick={() => setChatSearchQuery("")}
                    aria-label="Clear search"
                  >
                    <UiIcon name="close.svg" />
                  </button>
                )}
              </div>
              {!chatSearchHasQuery ? (
                <div className="chat-search-idle">
                  <strong>Search your chats</strong>
                  <span>Type to find headings, topics, or message snippets instantly.</span>
                </div>
              ) : (
                <div className="chat-search-results" role="list">
                  {chatSearchResults.length === 0 ? (
                    <div className="chat-search-empty">
                      <strong>No chats found</strong>
                      <span>Try a different keyword or look for a project name.</span>
                    </div>
                  ) : (
                    chatSearchResults.map((result) => (
                      <button
                        key={result.session.id}
                        type="button"
                        role="listitem"
                        className={`chat-search-row ${
                          result.session.id === currentSession?.id ? "is-active" : ""
                        }`}
                        onClick={() => {
                          switchSession(result.session.id);
                          setView("workspace");
                          setChatSearchOpen(false);
                        }}
                      >
                        <div className="chat-search-row-head">
                          <span className="chat-search-kicker">Heading</span>
                          <strong className="chat-search-title">{renderChatSearchHighlight(result.heading)}</strong>
                        </div>
                        <div className="chat-search-row-topic">
                          <span className="chat-search-kicker">Topic</span>
                          <span className="chat-search-snippet">{renderChatSearchHighlight(result.topic)}</span>
                        </div>
                        <div className="chat-search-meta">{result.meta}</div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!showWelcome && projectsModalOpen && (
        <div
          className="model-modal-backdrop project-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              closeProjectsModal();
            }
          }}
        >
          <div
            className="model-modal-card project-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Projects"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="model-modal-header">
              <div>
                <span className="model-modal-kicker">Projects</span>
                <h3>Manage projects</h3>
                <p>Switch projects or create a new one.</p>
              </div>
              <button className="model-modal-close" type="button" onClick={closeProjectsModal}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="model-modal-body project-modal-body">
              <div className="project-modal-create">
                <label className="model-modal-input">
                  <span>Project name</span>
                  <input
                    ref={projectNameInputRef}
                    value={projectNameDraft}
                    onChange={(event) => {
                      setProjectNameDraft(event.target.value);
                      if (projectsError) {
                        setProjectsError("");
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        createProject();
                      }
                    }}
                    placeholder="Project name"
                  />
                </label>
                <button className="model-modal-btn primary" type="button" onClick={createProject}>
                  Create project
                </button>
              </div>
              {projectsError && <div className="model-modal-error">{projectsError}</div>}
              <div className="project-modal-list" role="list">
                {projects.length === 0 ? (
                  <div className="project-modal-empty">No projects yet.</div>
                ) : (
                  projects.map((project) => {
                    const isActive = activeProjectId === project.id;
                    const isEditing = editingProjectId === project.id;
                    return (
                      <div
                        key={project.id}
                        role="listitem"
                        className={`project-modal-item ${isActive ? "active" : ""} ${isEditing ? "is-editing" : ""}`}
                      >
                        {isEditing ? (
                          <input
                            ref={editingProjectInputRef}
                            className="project-modal-input"
                            value={editingProjectName}
                            onChange={(event) => {
                              setEditingProjectName(event.target.value);
                              if (projectsError) {
                                setProjectsError("");
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                event.stopPropagation();
                                commitProjectRename();
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                event.stopPropagation();
                                cancelProjectRename();
                              }
                            }}
                            aria-label="Edit project name"
                          />
                        ) : (
                          <button
                            type="button"
                            className="project-modal-select"
                            onClick={() => toggleProjectSelection(project.id)}
                          >
                            <span className="project-modal-title">{project.name}</span>
                            <span className="project-modal-meta">{isActive ? "Selected" : "Open"}</span>
                          </button>
                        )}
                        <div className="project-modal-actions">
                          {isEditing ? (
                            <>
                              <button
                                className="project-modal-action"
                                type="button"
                                onClick={commitProjectRename}
                                aria-label="Save project name"
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">
                                  check
                                </span>
                              </button>
                              <button
                                className="project-modal-action"
                                type="button"
                                onClick={cancelProjectRename}
                                aria-label="Cancel editing"
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">
                                  close
                                </span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="project-modal-action"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startProjectRename(project);
                                }}
                                aria-label="Edit project"
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">
                                  edit
                                </span>
                              </button>
                              <button
                                className="project-modal-action danger"
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void deleteProject(project.id);
                                }}
                                aria-label="Delete project"
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">
                                  delete
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <div className="model-modal-actions project-modal-actions">
              <button className="model-modal-btn ghost" type="button" onClick={closeProjectsModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && enginePromptOpen && (
        <div className="model-modal-backdrop">
          <div
            className="model-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={engineRunning ? "Stop AI engine" : "Start AI engine"}
          >
            <div className="model-modal-header">
              <div>
                <span className="model-modal-kicker">AI engine</span>
                <h3>{engineRunning ? "Stop the AI engine?" : "Start the AI engine?"}</h3>
                <p>
                  {engineRunning
                    ? "Pause the local AI engine to free resources. You can restart anytime."
                    : "Launch the local AI engine so Meera can respond instantly."}
                </p>
              </div>
              <button className="model-modal-close" type="button" onClick={dismissEnginePrompt}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="model-modal-body">
              <div className="model-modal-grid">
                <div>
                  <span>Models detected</span>
                  <strong>{installedLocalModels.length}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{status === "offline" ? "Offline" : status}</strong>
                </div>
              </div>
              <div className="model-modal-models">
                <span>Model names</span>
                <div className="model-modal-model-list" role="list">
                  {installedLocalModels.length > 0 ? (
                    installedLocalModels.map((model) => (
                      <span className="model-modal-model-chip" role="listitem" key={model.id}>
                        {model.label}
                      </span>
                    ))
                  ) : (
                    <span className="model-modal-model-empty">No models detected yet.</span>
                  )}
                </div>
                <span className="model-modal-model-hint">Updates automatically every few seconds.</span>
              </div>
            </div>
            <div className="model-modal-actions">
              <button className="model-modal-btn ghost" type="button" onClick={dismissEnginePrompt}>
                Not now
              </button>
              {engineRunning ? (
                <button className="model-modal-btn ghost" type="button" onClick={() => void handleEngineStop()}>
                  {backendStarting ? "Stopping..." : "Stop engine"}
                </button>
              ) : (
                <button className="model-modal-btn primary" type="button" onClick={() => void handleEngineStart()}>
                  {backendStarting ? "Starting..." : "Start engine"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!showWelcome && modelLoadOpen && (
        <div className="model-modal-backdrop">
          <div className="model-modal-card" role="dialog" aria-modal="true" aria-label="Load model">
            <div className="model-modal-header">
              <div>
                <span className="model-modal-kicker">Model load</span>
                <h3>{modelLoadTarget ? `Loading ${modelLoadTarget.label}` : "Loading model"}</h3>
                <p>Preparing the AI engine with your selected model.</p>
              </div>
              <button className="model-modal-close" type="button" onClick={() => setModelLoadOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="model-modal-body">
              <div className="model-modal-grid">
                <div>
                  <span>Model</span>
                  <strong>{modelLoadTarget?.label || modelLoadStatus?.model_id || "Unknown"}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{modelLoadStatus?.status || "Waiting"}</strong>
                </div>
                <div>
                  <span>Stage</span>
                  <strong>{modelLoadStatus?.stage || "Preparing"}</strong>
                </div>
                <div>
                  <span>Progress</span>
                  <strong>{(modelLoadStatus?.progress ?? 0).toFixed(1)}%</strong>
                </div>
              </div>
              <div className="model-progress-bar">
                <span style={{ width: `${Math.min(100, Math.max(0, modelLoadStatus?.progress ?? 0))}%` }} />
              </div>
              <div className="model-progress-meta">
                <span>{modelLoadStatus?.status === "ready" ? "Ready" : "Loading"}</span>
                <span>{modelLoadStatus?.error ? "Error" : modelLoadStatus?.active_model || ""}</span>
              </div>
              <div className="model-log-list">
                {(modelLoadStatus?.logs && modelLoadStatus.logs.length > 0
                  ? modelLoadStatus.logs
                  : ["Waiting for engine logs..."]
                ).map((line, index) => (
                  <div className="model-log-item" key={`${line}-${index}`}>
                    {line}
                  </div>
                ))}
              </div>
              {modelLoadError && <div className="model-modal-error">{modelLoadError}</div>}
              {modelLoadStatus?.error && <div className="model-modal-error">{modelLoadStatus.error}</div>}
            </div>
            <div className="model-modal-actions">
              {modelLoadTarget && (modelLoadFailures[modelLoadTarget.id] ?? 0) >= 3 && (
                <button
                  className="model-modal-btn ghost"
                  type="button"
                  onClick={() => openDownloadPrompt(modelLoadTarget.id as ModelOptionId)}
                  disabled={!modelLoadTarget.repo_id}
                >
                  {modelLoadTarget.repo_id ? "Redownload model" : "Redownload unavailable"}
                </button>
              )}
              <button className="model-modal-btn ghost" type="button" onClick={() => setModelLoadOpen(false)}>
                Close
              </button>
              {modelLoadStatus?.status !== "loading" && modelLoadTarget && (
                <button className="model-modal-btn primary" type="button" onClick={() => void startModelLoad(modelLoadTarget.id as ModelOptionId)}>
                  Reload
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!showWelcome && downloadPromptOpen && downloadTarget && (
        <div className="model-modal-backdrop">
          <div className="model-modal-card" role="dialog" aria-modal="true" aria-label="Download model">
            <div className="model-modal-header">
              <div>
                <span className="model-modal-kicker">Model download</span>
                <h3>Download {formatLabelList(bundledDownloadLabels.length > 0 ? bundledDownloadLabels : [downloadTarget.label])}?</h3>
                <p>
                  {downloadTarget.repo_mismatch
                    ? bundledDownloadIds.length > 1
                      ? "This pack still has files from an older build. Downloading now will refresh both models with the current version."
                      : "This folder still has files from an older model build. Downloading now will replace them with the current version."
                    : bundledDownloadIds.length > 1
                      ? `This installs both new models so you can switch instantly between Llama 3.2 3B and Gemma 3 4B. ${bundledDownloadSummary}`
                      : downloadTarget.blurb || "This model is not installed yet. Download it to start using it."}
                </p>
              </div>
              <button className="model-modal-close" type="button" onClick={() => setDownloadPromptOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="model-modal-body">
              <div className="model-modal-grid">
                <div>
                  <span>Parameters</span>
                  <strong>{downloadTarget.params}</strong>
                </div>
                <div>
                  <span>{bundledDownloadIds.length > 1 ? "Includes" : "Size"}</span>
                  <strong>
                    {bundledDownloadIds.length > 1
                      ? formatLabelList(bundledDownloadLabels)
                      : formatModelStorage(downloadTarget)}
                  </strong>
                </div>
                <div>
                  <span>Precision</span>
                  <strong>{downloadTarget.precision || "Full precision"}</strong>
                </div>
                <div>
                  <span>Repository</span>
                  <strong>{downloadTarget.repo_id || "Local install"}</strong>
                </div>
                <div>
                  <span>Folder</span>
                  <strong>{downloadTarget.folder}</strong>
                </div>
              </div>
              {!downloadTarget.repo_id && (
                <div className="model-modal-error">This model is available only as a local install.</div>
              )}
              {downloadPromptError && <div className="model-modal-error">{downloadPromptError}</div>}
            </div>
            <div className="model-modal-actions">
              <button className="model-modal-btn ghost" type="button" onClick={() => setDownloadPromptOpen(false)}>
                Not now
              </button>
              <button
                className="model-modal-btn primary"
                type="button"
                onClick={() => void startModelDownload(downloadTarget.id as ModelOptionId)}
                disabled={!downloadTarget.repo_id}
              >
                {bundledDownloadIds.length > 1 ? "Download models" : "Download model"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && hfTokenPromptOpen && (
        <div className="model-modal-backdrop">
          <div className="model-modal-card" role="dialog" aria-modal="true" aria-label="Hugging Face token">
            <div className="model-modal-header">
              <div>
                <span className="model-modal-kicker">Hugging Face</span>
                <h3>Sign in with your token</h3>
                <p>
                  Enter your Hugging Face access token to continue downloading{" "}
                  {downloadTarget ? downloadTarget.label : "this model"}.
                </p>
              </div>
              <button className="model-modal-close" type="button" onClick={() => setHfTokenPromptOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="model-modal-body">
              <label className="model-modal-input">
                <span className="token-label-row">
                  Token
                  <button
                    type="button"
                    className="token-info-btn"
                    aria-label="Why is the token hidden?"
                    onClick={() => setHfTokenInfoOpen((open) => !open)}
                  >
                    i
                  </button>
                </span>
                <input
                  value={hfTokenValue}
                  onChange={(event) => setHfTokenValue(event.target.value)}
                  type="password"
                  placeholder="hf_..."
                  className="token-secret-input"
                  aria-describedby={hfTokenInfoOpen ? "hf-token-info" : undefined}
                  disabled={hfTokenSaving}
                />
              </label>
              {hfTokenInfoOpen && (
                <div id="hf-token-info" className="token-info-card" role="note">
                  For safety, the token is masked and the caret is hidden while typing. Paste your token (starts with
                  hf_) and click Save.
                </div>
              )}
              {hfTokenError && <div className="model-modal-error">{hfTokenError}</div>}
            </div>
            <div className="model-modal-actions">
              <button className="model-modal-btn ghost" type="button" onClick={() => setHfTokenPromptOpen(false)}>
                Cancel
              </button>
              {hfTokenSet && (
                <button
                  className="model-modal-btn ghost"
                  type="button"
                  onClick={requestClearHfToken}
                  disabled={hfTokenSaving}
                >
                  Clear token
                </button>
              )}
              <button
                className="model-modal-btn primary"
                type="button"
                onClick={() => void saveHfToken()}
                disabled={hfTokenSaving}
              >
                {hfTokenSaving ? "Verifying..." : "Save token"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && hfTokenSuccessOpen && (
        <div className="model-modal-backdrop">
          <div className="model-modal-card hf-success-card" role="dialog" aria-modal="true" aria-label="Hugging Face login successful">
            <div className="model-modal-header">
              <div>
                <span className="model-modal-kicker">Hugging Face</span>
                <h3>Login successful</h3>
                <p>
                  {hfTokenSuccessName
                    ? `Welcome back, ${hfTokenSuccessName}. Your token is verified and ready.`
                    : "Your token is verified and ready for secure downloads."}
                </p>
              </div>
              <button className="model-modal-close" type="button" onClick={() => setHfTokenSuccessOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="hf-success-body">
              <span className="hf-success-icon" aria-hidden="true" />
              <span className="hf-success-copy">You can now download gated models in real time.</span>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && hfTokenClearPromptOpen && (
        <div className="model-modal-backdrop">
          <div className="model-modal-card" role="dialog" aria-modal="true" aria-label="Clear Hugging Face token">
            <div className="model-modal-header">
              <div>
                <span className="model-modal-kicker">Hugging Face</span>
                <h3>Clear access token?</h3>
                <p>
                  If you clear it, you will need to set a new token again. Unsaved tokens cannot be recovered — you will
                  need to regenerate one on Hugging Face.
                </p>
              </div>
              <button className="model-modal-close" type="button" onClick={() => setHfTokenClearPromptOpen(false)}>
                <UiIcon name="close.svg" />
              </button>
            </div>
            <div className="model-modal-actions">
              <button
                className="model-modal-btn ghost"
                type="button"
                onClick={() => setHfTokenClearPromptOpen(false)}
              >
                Cancel
              </button>
              <button
                className="model-modal-btn danger"
                type="button"
                onClick={() => void clearHfToken()}
                disabled={hfTokenSaving}
              >
                Clear token
              </button>
            </div>
          </div>
        </div>
      )}

      {!showWelcome && (
      <div className="shell">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="topbar copilot-topbar">
          <div className="copilot-topbar-inner">
            {displayView === "home" && (
              <span
                key={`home-dock-${sidebarOpen ? 1 : 0}-${settingsOpen ? 1 : 0}`}
                className="home-dock-glass"
                aria-hidden="true"
              />
            )}
            <div className="copilot-topbar-left">
              <div className="copilot-brand">
                <motion.span
                  className="copilot-brand-icon"
                  aria-hidden="true"
                  initial={{ opacity: 0, rotate: -6, scale: 0.9 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
                </motion.span>
                <span className="copilot-brand-copy">
                  <span className="copilot-brand-text">MeeraAI</span>
                </span>
              </div>
              <button
                className="icon-btn copilot-icon-btn sidebar-toggle-btn"
                onClick={() => setSidebarOpen((open) => !open)}
                title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
                aria-label="Toggle sidebar"
                aria-pressed={sidebarOpen}
              >
                <UiIcon name="menu.svg" />
              </button>
              {view === "workspace" && (
                <button className="icon-btn copilot-icon-btn home-toggle" onClick={() => setView("home")} title="Home">
                  <UiIcon name="home.svg" />
                </button>
              )}
              <button className="icon-btn copilot-icon-btn settings-icon-btn" type="button" onClick={openSettingsPanel} aria-label="Open settings">
                <UiIcon name="settings.svg" />
              </button>
              <button
                className={`icon-btn copilot-icon-btn engine-icon-btn ${engineRunning ? "live" : ""}`}
                type="button"
                onClick={() => {
                  setEnginePromptDismissed(false);
                  setEnginePromptOpen(true);
                }}
                aria-label={engineRunning ? "Manage AI engine" : "Start AI engine"}
                title={engineRunning ? "Manage AI engine" : "Start AI engine"}
              >
                <UiIcon name="engine.svg" />
              </button>
            </div>
            <div className="copilot-topbar-right titlebar-controls">
              {activeDownloadInfo && (
                <div className="topbar-download-wrap" ref={topbarDownloadRef}>
                  <button
                    className={`icon-btn copilot-icon-btn model-download-indicator topbar-download-indicator ${activeDownloadInfo.download.status === "downloading" ? "active" : ""}`}
                    type="button"
                    style={{ "--progress": `${Math.min(100, Math.max(0, activeDownloadInfo.download.progress ?? 0))}%` } as React.CSSProperties}
                    aria-label={`Download progress ${activeDownloadInfo.download.progress?.toFixed(1) ?? "0.0"}%`}
                    title={`${activeDownloadInfo.label} download ${activeDownloadInfo.download.progress?.toFixed(1) ?? "0.0"}%`}
                    aria-expanded={topbarDownloadOpen}
                    onClick={() => setTopbarDownloadOpen((open) => !open)}
                  >
                    <svg className="model-download-icon" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M12 4v10m0 0l4-4m-4 4l-4-4M5 20h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {topbarDownloadOpen && (
                    <div className="topbar-download-popover" role="dialog" aria-label="Download progress">
                      <div className="topbar-download-header">
                        <div>
                          <span className="topbar-download-kicker">Model download</span>
                          <strong>{activeDownloadInfo.label}</strong>
                          <span className="topbar-download-status">
                            {activeDownloadInfo.download.status === "verifying"
                              ? "Verifying model"
                              : activeDownloadInfo.download.status === "paused"
                                ? "Paused"
                                : "Downloading"}
                          </span>
                        </div>
                        <button
                          className="topbar-download-close"
                          type="button"
                          onClick={() => setTopbarDownloadOpen(false)}
                          aria-label="Close download details"
                        >
                          <UiIcon name="close.svg" />
                        </button>
                      </div>
                      <div className="model-progress-bar">
                        <span
                          style={{
                            width: `${Math.min(100, Math.max(0, activeDownloadInfo.download.progress ?? 0))}%`,
                          }}
                        />
                      </div>
                      <div className="model-progress-meta">
                        <span>{activeDownloadInfo.download.progress?.toFixed(1) ?? "0.0"}%</span>
                        <span>
                          {formatBytes(activeDownloadInfo.download.downloaded_bytes)} /{" "}
                          {formatBytes(activeDownloadInfo.download.total_bytes)}
                        </span>
                      </div>
                      <div className="model-progress-actions">
                        {activeDownloadInfo.download.status === "downloading" && (
                          <button
                            type="button"
                            onClick={() => void pauseModelDownload(activeDownloadInfo.modelId)}
                          >
                            Pause
                          </button>
                        )}
                        {activeDownloadInfo.download.status === "paused" && (
                          <button
                            type="button"
                            onClick={() => void resumeModelDownload(activeDownloadInfo.modelId)}
                          >
                            Resume
                          </button>
                        )}
                        <button
                          type="button"
                          className="danger"
                          onClick={() => void cancelModelDownload(activeDownloadInfo.modelId)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {(view === "home" || view === "workspace") && (
                <div className="topbar-time" aria-label="Current time">
                  <span className="topbar-time-main">{localTime}</span>
                  <span className="topbar-time-seconds">{localSeconds}</span>
                </div>
              )}
              <button
                className="titlebar-btn minimize"
                type="button"
                aria-label="Minimize window"
                onClick={() => windowControls?.minimize()}
              >
                <UiIcon name="minimize.svg" />
              </button>
              <button
                className="titlebar-btn maximize"
                type="button"
                aria-label="Maximize window"
                onClick={() => windowControls?.maximize()}
              >
                <UiIcon name="maximize.svg" />
              </button>
              <button
                className="titlebar-btn close"
                type="button"
                aria-label="Close window"
                onClick={() => windowControls?.close()}
              >
                <UiIcon name="close.svg" />
              </button>
            </div>
          </div>
        </motion.header>


        <AnimatePresence mode="wait" initial={false} onExitComplete={() => setDisplayView(view)}>
          {view === "home" ? (
            <motion.main
              key="home"
              className="main copilot-home"
              initial={{ opacity: 0, scale: 0.985, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.985, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "opacity, transform, filter" }}
            >
              <div className={`copilot-surface ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}> 
                {renderSidebarBackdrop()}
                {sidebar}
                <section ref={homeScrollRef} className="copilot-home-content">
                  <div className="home-center-stack">
                    <div className="copilot-home-hero">
                      <div className="copilot-home-greeting">{dashboardGreeting}, {userName}</div>
                      <h1>What can I help you with today?</h1>
                    </div>

                    <div className="copilot-home-composer">
                      <div className="copilot-home-input-row">
                        <input
                          value={input}
                          onChange={(event) => setInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleHomeSend();
                            }
                          }}
                          placeholder="Ask anything"
                          className="copilot-home-input"
                        />
                        <div className="copilot-home-input-actions">
                          <button className="icon-btn copilot-icon-btn" type="button" aria-label="Attach">
                            <UiIcon name="plus.svg" />
                          </button>
                          <button className="icon-btn copilot-icon-btn" type="button" aria-label="Voice" onClick={() => setIsRecording((prev) => !prev)}>
                            <UiIcon name="mic.svg" />
                          </button>
                        </div>
                      </div>
                      <div className="copilot-home-row">
                        <button className="btn btn-primary btn-with-icon" type="button" onClick={handleHomeSend}>
                          <UiIcon name="send.svg" />
                          <span>Ask</span>
                        </button>
                      </div>
                    </div>

                    <div className="copilot-home-chips">
                      {HOME_SUGGESTIONS.map((idea) => (
                        <button key={idea} className="copilot-suggestion-chip" type="button" onClick={() => openPromptFromDashboard(idea)}>
                          {idea}
                        </button>
                      ))}
                    </div>
                  </div>

                </section>
              </div>
            </motion.main>
          ) : (
            <motion.main
              key="workspace"
              className="main copilot-workspace"
              initial={{ opacity: 0, scale: 0.985, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.985, filter: "blur(8px)" }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{ willChange: "opacity, transform, filter" }}
            >
              <div className={`copilot-surface ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}> 
                {renderSidebarBackdrop()}
                {sidebar}
                <section className="copilot-workspace-content">
                  <div className="copilot-workspace-body">
                    {visibleMessages.length >= 8 && railSlots.length > 0 && (
                      <div
                        className={`chat-orbit-rail ${chatRailHovered ? "is-hovered" : ""}`}
                        ref={chatRailRef}
                        onMouseEnter={() => setChatRailHovered(true)}
                        onMouseLeave={() => {
                          setChatRailHoverIndex(null);
                          setChatRailHoverPosition(null);
                          setChatRailHovered(false);
                        }}
                        onMouseMove={(event) => {
                          const count = railSlots.length;
                          if (count === 0) {
                            return;
                          }
                          const rect = event.currentTarget.getBoundingClientRect();
                          const ratio = (event.clientY - rect.top) / rect.height;
                          const clamped = Math.min(1, Math.max(0, ratio));
                          const hoverPosition = count === 1 ? 0 : clamped * (count - 1);
                          const nextIndex = Math.min(count - 1, Math.max(0, Math.round(hoverPosition)));
                          setChatRailHoverPosition(hoverPosition);
                          if (nextIndex !== chatRailHoverIndex) {
                            setChatRailHoverIndex(nextIndex);
                          }
                        }}
                        aria-label="Conversation navigator"
                      >
                        {railSlots.map((slot, index) => {
                          const { message, headline, meta, messageId } = slot;
                          const isActive = Boolean(messageId && messageId === railActiveId);
                          const isHovered = index === chatRailHoverIndex;
                          const isDisabled = !messageId;
                          const hoverPosition = chatRailHoverPosition ?? chatRailHoverIndex ?? null;
                          const distance = hoverPosition === null ? null : Math.abs(hoverPosition - index);
                          const hoverBoost = distance === null ? 0 : Math.exp(-distance * distance * 0.55);
                          const baseBoost = isActive ? 0.22 : 0;
                          const dockBoost = isDisabled ? 0 : Math.max(baseBoost, hoverBoost);
                          const dockScale = 1 + dockBoost * 0.38;
                          const dockWidth = 12 + dockBoost * 18;
                          const dockHeight = 2 + dockBoost * 1.25;
                          const dockShift = dockBoost * 6.5;
                          const dockLineShift = dockBoost * 3.2;
                          const dockGlow = 10 + dockBoost * 20;
                          const dockGlowStrong = dockBoost * 24;
                          const dockOpacity = isDisabled ? 0.25 : 0.7 + dockBoost * 0.3;
                          const baseColor = message?.role === "user" ? "rgba(18, 196, 152, 0.98)" : "rgba(38, 126, 230, 0.98)";
                          const activeColor = message?.role === "user" ? "rgba(12, 182, 138, 1)" : "rgba(32, 120, 224, 1)";
                          const hoverColor = message?.role === "user" ? "rgba(26, 216, 170, 1)" : "rgba(70, 160, 255, 1)";
                          const dockStyle = {
                            "--dock-scale": dockScale.toFixed(3),
                            "--dock-width": `${dockWidth.toFixed(1)}px`,
                            "--dock-height": `${dockHeight.toFixed(1)}px`,
                            "--dock-shift": `${dockShift.toFixed(1)}px`,
                            "--dock-line-shift": `${dockLineShift.toFixed(1)}px`,
                            "--dock-glow": `${dockGlow.toFixed(1)}px`,
                            "--dock-glow-strong": `${dockGlowStrong.toFixed(1)}px`,
                            "--dock-opacity": dockOpacity.toFixed(2),
                            "--dock-color": baseColor,
                          } as React.CSSProperties;
                          if (isActive) {
                            (dockStyle as Record<string, string>)["--dock-color"] = activeColor;
                          }
                          if (isHovered) {
                            (dockStyle as Record<string, string>)["--dock-color"] = hoverColor;
                          }
                          if (isDisabled) {
                            (dockStyle as Record<string, string>)["--dock-color"] = "rgba(255, 255, 255, 0.35)";
                          }
                          return (
                            <div key={`rail-${index}`} className="chat-orbit-slot">
                              <button
                                className={`chat-orbit-mark ${isActive ? "is-active" : ""} ${isHovered ? "is-hover" : ""} ${isDisabled ? "is-disabled" : ""}`}
                                type="button"
                                style={dockStyle}
                                onMouseEnter={() => {
                                  setChatRailHoverIndex(index);
                                  setChatRailHoverPosition(index);
                                }}
                                onFocus={() => {
                                  setChatRailHoverIndex(index);
                                  setChatRailHoverPosition(index);
                                }}
                                onClick={() => {
                                  if (messageId) {
                                    handleRailSelect(messageId);
                                  }
                                }}
                                aria-label={messageId ? `Jump to message: ${headline}` : "No message"}
                                disabled={isDisabled}
                              >
                                <span className="chat-orbit-line" aria-hidden="true" />
                              </button>
                              {isHovered && messageId && (
                                <div className="chat-orbit-preview" aria-hidden="true">
                                  <span className="chat-orbit-title">{headline}</span>
                                  <span className="chat-orbit-meta">{meta}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="chat-shell">
                      <div
                        className={`chat-quickpanel ${chatQuickPanelOpen ? "is-open" : ""}`}
                        aria-label="Chat actions"
                        ref={chatQuickPanelRef}
                      >
                        <button
                          className="chat-quickpanel-handle"
                          type="button"
                          aria-label="Toggle chat actions"
                          aria-expanded={chatQuickPanelOpen}
                          aria-controls="chat-quickpanel-panel"
                          onClick={() => setChatQuickPanelOpen((prev) => !prev)}
                        >
                          <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                        </button>
                        <div id="chat-quickpanel-panel" className="chat-quickpanel-panel" role="menu" aria-label="Chat actions menu">
                          <button
                            className="chat-quickpanel-item"
                            type="button"
                            onClick={() => {
                              handleExportChat();
                              setChatQuickPanelOpen(false);
                            }}
                            disabled={!hasAnyMessages}
                            aria-disabled={!hasAnyMessages}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">download</span>
                            <span>Export chat</span>
                          </button>
                          <button
                            className="chat-quickpanel-item"
                            type="button"
                            onClick={() => {
                              void handleCopyChat();
                              setChatQuickPanelOpen(false);
                            }}
                            disabled={!hasAnyMessages}
                            aria-disabled={!hasAnyMessages}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">content_copy</span>
                            <span>Copy entire chat</span>
                          </button>
                          <button
                            className="chat-quickpanel-item"
                            type="button"
                            onClick={() => {
                              void handleShareChat();
                              setChatQuickPanelOpen(false);
                            }}
                            disabled={!hasAnyMessages}
                            aria-disabled={!hasAnyMessages}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">share</span>
                            <span>Share chat</span>
                          </button>
                          <button
                            className="chat-quickpanel-item destructive"
                            type="button"
                            onClick={() => {
                              void handleDeleteChat();
                              setChatQuickPanelOpen(false);
                            }}
                            disabled={!hasAnyMessages}
                            aria-disabled={!hasAnyMessages}
                          >
                            <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                            <span>Delete chat</span>
                          </button>
                        </div>
                      </div>
                      <div ref={feedRef} className="chat-feed">
                        {chatLoading && (
                          <div className="chat-loading">
                            <div className="chat-loading-bar">
                              <span />
                              <span />
                              <span />
                            </div>
                            <span>Loading chat...</span>
                          </div>
                        )}


                        {hasVisibleMessages ? (
                          visibleMessages.map((message, index) => {
                            const messageTime = message.ts?.trim() ?? "";
                            const isUser = message.role === "user";
                            const previousMessage = index > 0 ? visibleMessages[index - 1] : null;
                            const showTurnDivider = message.role === "assistant" && previousMessage?.role === "user";
                            const editFeedbackKey = `${message.id}:edit`;
                            const copyFeedbackKey = `${message.id}:copy`;
                            const retryFeedbackKey = `${message.id}:retry`;
                            const isEditAck = Boolean(chatActionFeedback[editFeedbackKey]);
                            const isCopyAck = Boolean(chatActionFeedback[copyFeedbackKey]);
                            const isRetryAck = Boolean(chatActionFeedback[retryFeedbackKey]);
                            return (
                              <React.Fragment key={message.id}>
                                <div
                                  className={`chat-message ${message.role}`}
                                  data-message-id={message.id}
                                >
                                  <div className="chat-stack">
                                    <div className="chat-bubble">
                                      <div className="chat-body">
                                        <MarkdownContent content={message.content} />
                                      </div>
                                    </div>
                                    <div className="chat-meta-row">
                                      {isUser ? (
                                        <>
                                          <div className="chat-meta-actions">
                                            <button
                                              className={`chat-meta-btn ${isEditAck ? "is-ack" : ""}`}
                                              type="button"
                                              aria-label="Edit message"
                                              title="Edit"
                                              onClick={() => {
                                                handleEditMessage(message.content);
                                                triggerChatActionFeedback(message.id, "edit");
                                              }}
                                            >
                                              {isEditAck ? (
                                                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                                              ) : (
                                                <UiIcon name="edit.svg" />
                                              )}
                                            </button>
                                            <button
                                              className={`chat-meta-btn ${isCopyAck ? "is-ack is-copy-ack" : ""}`}
                                              type="button"
                                              aria-label="Copy message"
                                              title="Copy"
                                              onClick={() => {
                                                void handleCopy(message.content);
                                                triggerChatActionFeedback(message.id, "copy");
                                              }}
                                            >
                                              {isCopyAck ? (
                                                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                                              ) : (
                                                <UiIcon name="copy.svg" />
                                              )}
                                            </button>
                                          </div>
                                          <span className="chat-meta-time">{messageTime}</span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="chat-meta-time">{messageTime}</span>
                                          <div className="chat-meta-actions">
                                            <button
                                              className={`chat-meta-btn ${isCopyAck ? "is-ack is-copy-ack" : ""}`}
                                              type="button"
                                              aria-label="Copy message"
                                              title="Copy"
                                              onClick={() => {
                                                void handleCopy(message.content);
                                                triggerChatActionFeedback(message.id, "copy");
                                              }}
                                            >
                                              {isCopyAck ? (
                                                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                                              ) : (
                                                <UiIcon name="copy.svg" />
                                              )}
                                            </button>
                                            <button
                                              className={`chat-meta-btn ${isRetryAck ? "is-ack" : ""}`}
                                              type="button"
                                              aria-label="Retry message"
                                              title="Retry"
                                              onClick={() => {
                                                handleRetryMessage(message.id);
                                                triggerChatActionFeedback(message.id, "retry");
                                              }}
                                            >
                                              {isRetryAck ? (
                                                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                                              ) : (
                                                <UiIcon name="retry.svg" />
                                              )}
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {showTurnDivider ? (
                                  <div className="chat-turn-divider" aria-hidden="true">
                                    <span />
                                  </div>
                                ) : null}
                              </React.Fragment>
                            );
                          })
                        ) : !hasAnyMessages ? (
                          <div className="chat-empty">
                            <span className="chat-empty-icon" aria-hidden="true">
                              <PiChatsCircleDuotone />
                            </span>
                            <strong className="chat-empty-title">Start a conversation</strong>
                            <span className="chat-empty-copy">Ask a task, a question, or tell Meera to open something on this PC.</span>
                          </div>
                        ) : null}


                        {showThinkingBubble && (
                          <div className="chat-message assistant chat-thinking">
                            <div className="chat-bubble">
                              <div className="chat-thinking-dots">
                                <span />
                                <span />
                                <span />
                              </div>
                              <span className="chat-thinking-label">Thinking...</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="chat-composer chat-composer-bumped">
                        <div className="chat-composer-sheen" aria-hidden="true" />
                        <div className="chat-composer-core">
                          <div className="chat-input-wrap">
                            <textarea
                              ref={chatInputRef}
                              value={input}
                              onChange={(event) => setInput(event.target.value)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  void sendMessage(input);
                                  playSound("action");
                                }
                                if (event.key === "ArrowUp" && event.shiftKey) {
                                  event.preventDefault();
                                  handleHistoryNav("up");
                                }
                                if (event.key === "ArrowDown" && event.shiftKey) {
                                  event.preventDefault();
                                  handleHistoryNav("down");
                                }
                              }}
                              placeholder="Ask Something..."
                              className="chat-input"
                            />
                          </div>
                          <div className="chat-composer-footer">
                            <div className="chat-hint">Press Enter to send. Use Shift+Enter for a new line.</div>
                            <div className="chat-actions">
                              <button className="chat-icon-btn" type="button" aria-label="Attach">
                                <UiIcon name="plus.svg" />
                              </button>
                              <button
                                className={`chat-icon-btn ${isRecording ? "active" : ""}`}
                                type="button"
                                aria-label="Voice"
                                onClick={() => setIsRecording((prev) => !prev)}
                              >
                                {isRecording ? <UiIcon name="mic-off.svg" /> : <UiIcon name="mic.svg" />}
                              </button>
                              {isSending ? (
                                <button className="chat-action-btn stop" type="button" onClick={stopActiveRequest}>
                                  <UiIcon name="stop.svg" />
                                  <span>Stop</span>
                                </button>
                              ) : (
                                <button
                                  className="chat-action-btn send"
                                  type="button"
                                  onClick={() => {
                                    void sendMessage(input);
                                    playSound("action");
                                  }}
                                >
                                  <UiIcon name="send.svg" />
                                  <span>Send</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  </section>
                </div>
              </motion.main>
          )}
          </AnimatePresence>
        <AnimatePresence>
          {settingsOpen && isAuthenticated && (
            <>
              <motion.button
                type="button"
                className="settings-backdrop"
                aria-label="Close settings panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSettingsOpen(false)}
              />
              <motion.div
                className="settings-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <motion.aside
                  className="settings-drawer"
                  initial={{ opacity: 0, scale: 0.9, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 12 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                >
                  <div className="settings-shell">
                    <aside className="settings-nav">
                      <div className="settings-nav-header">
                        <span className="dashboard-kicker">Settings</span>
                        <h2>Control Center</h2>
                        <p>Premium glass controls for MeeraAI.</p>
                        <button
                          className={`settings-account-card ${resolvedSettingsSection === "account" ? "active" : ""}`}
                          type="button"
                          onClick={() => setSettingsSection("account")}
                          aria-label="Open account settings"
                        >
                          <span className="settings-account-avatar" aria-hidden="true">
                            {isAuthenticated && authProfile ? (
                              authProfile.photoUrl ? (
                                <img
                                  src={authProfile.photoUrl}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                (authProfile.displayName || "M").slice(0, 1).toUpperCase()
                              )
                            ) : (
                              <img
                                src={DEFAULT_PROFILE_AVATAR_URL}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </span>
                          <span className="settings-account-details">
                            <span className="settings-account-name">
                              {isAuthenticated && authProfile
                                ? authProfile.displayName
                                : authDisabled
                                  ? "Sign-in unavailable"
                                  : "Guest"}
                            </span>
                            {isAuthenticated && authProfile ? (
                              <>
                                <span className="settings-account-meta">{authUser?.email || "email unavailable"}</span>
                                <span className="settings-account-meta">
                                  {authUser?.phoneNumber || "phone unavailable"}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="settings-account-meta">
                                  {authDisabled ? "Connect Firebase to enable sign-in" : "Sign in to sync"}
                                </span>
                            {!authDisabled && (
                                  <span className="settings-account-meta">Secure your account</span>
                                )}
                              </>
                            )}
                          </span>
                        </button>
                        <div className="settings-search-wrap">
                          <input
                            ref={settingsSearchRef}
                            className="settings-search"
                            type="search"
                            placeholder="Search settings"
                            value={settingsSearchQuery}
                            onChange={(event) => setSettingsSearchQuery(event.target.value)}
                          />
                          {settingsSearchQuery && (
                            <button
                              className="settings-search-clear"
                              type="button"
                              aria-label="Clear search"
                              onClick={() => {
                                setSettingsSearchQuery("");
                                settingsSearchRef.current?.focus();
                              }}
                            >
                              <UiIcon name="close.svg" />
                            </button>
                          )}
                        </div>
                        {settingsSearchCountLabel && (
                          <div className="settings-search-count">{settingsSearchCountLabel}</div>
                        )}
                      </div>
                      <div
                        className="settings-nav-list"
                        ref={settingsNavListRef}
                        style={{ "--active-index": activeSettingsIndex } as React.CSSProperties}
                      >
                        {settingsSearchResults.length > 0 && (
                          <span
                            className="settings-nav-indicator"
                            aria-hidden="true"
                            style={{ opacity: hasActiveSettingsMatch ? 1 : 0 }}
                          />
                        )}
                        {settingsSearchResults.length > 0 ? (
                          settingsSearchResults.map((result) => {
                            const { section, match } = result;
                            return (
                              <button
                                key={section.id}
                                data-settings-id={section.id}
                                className={`settings-nav-item ${resolvedSettingsSection === section.id ? "active" : ""}`}
                                type="button"
                                onClick={() => setSettingsSection(section.id)}
                              >
                                <span className="settings-nav-icon" aria-hidden="true">
                                  <img
                                    src={`${import.meta.env.BASE_URL}ui/settings-nav/${section.icon}`}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </span>
                                <span className="settings-nav-text">
                                  <span className="settings-nav-label">
                                    {renderSettingsHighlight(section.label, match, "label")}
                                  </span>
                                  <span className="settings-nav-meta">
                                    {renderSettingsHighlight(section.meta, match, "meta")}
                                  </span>
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="settings-nav-empty">No matches found</div>
                        )}
                      </div>
                    </aside>

                    <div className="settings-content" ref={settingsContentRef}>
                      <div className="settings-content-header">
                        <div className="settings-title-stack">
                          <span className="dashboard-kicker">Settings</span>
                          <h2>{renderSettingsQueryHighlights(activeSettingsSection.label)}</h2>
                          <p>{renderSettingsQueryHighlights(activeSettingsSection.description)}</p>
                        </div>
                        <button
                          className="icon-btn copilot-icon-btn settings-close"
                          type="button"
                          aria-label="Close settings"
                          onClick={() => setSettingsOpen(false)}
                        >
                          <UiIcon name="close.svg" />
                        </button>
                      </div>

                      <div className="settings-content-body" key={resolvedSettingsSection}>
                        {resolvedSettingsSection === "appearance" && (
                          <>
                            <section className="settings-section">
                              <div className="settings-section-head">
                                <h3>{renderSettingsQueryHighlights("Theme")}</h3>
                                <span>{renderSettingsQueryHighlights("Default system style")}</span>
                              </div>
                              <div className="settings-row">
                                <div className="settings-row-text">
                                  <strong>{renderSettingsQueryHighlights("Meera Light")}</strong>
                                  <span>{renderSettingsQueryHighlights("Premium light glass tuned for clarity.")}</span>
                                </div>
                                <span className="settings-pill-static">Default</span>
                              </div>
                            </section>
                            <section className="settings-section">
                              <div className="settings-section-head">
                                <h3>{renderSettingsQueryHighlights("Interface")}</h3>
                                <span>{renderSettingsQueryHighlights("Layout & clarity")}</span>
                              </div>
                              <div className="settings-toggle-list">
                                <button
                                  className={`settings-toggle ${compactMode ? "active" : ""}`}
                                  type="button"
                                  onClick={() => setCompactMode((value) => !value)}
                                >
                                  <span className="settings-toggle-text">
                                    <strong>{renderSettingsQueryHighlights("Compact layout")}</strong>
                                    <span>{renderSettingsQueryHighlights("Denser sidebar and cards.")}</span>
                                  </span>
                                  <span className="settings-toggle-right">
                                    <span className="settings-toggle-pill">{compactMode ? "On" : "Off"}</span>
                                    <span className="settings-toggle-switch" aria-hidden="true" />
                                  </span>
                                </button>
                                <button
                                  className={`settings-toggle ${showTimestamps ? "active" : ""}`}
                                  type="button"
                                  onClick={() => setShowTimestamps((value) => !value)}
                                >
                                  <span className="settings-toggle-text">
                                    <strong>{renderSettingsQueryHighlights("Show timestamps")}</strong>
                                    <span>{renderSettingsQueryHighlights("Reveal time labels in chats.")}</span>
                                  </span>
                                  <span className="settings-toggle-right">
                                    <span className="settings-toggle-pill">{showTimestamps ? "On" : "Off"}</span>
                                    <span className="settings-toggle-switch" aria-hidden="true" />
                                  </span>
                                </button>
                              </div>
                            </section>
                          </>
                        )}

                        {resolvedSettingsSection === "models" && (
                          <section className={`settings-section settings-models ${status === "offline" ? "is-disabled" : ""}`}>
                            <div className="settings-models-content">
                            <div className="settings-section-head">
                              <h3>{renderSettingsQueryHighlights("Model selection")}</h3>
                              <span>{renderSettingsQueryHighlights("Choose the model that fits your workload")}</span>
                            </div>
                            {showModelStatusError && (
                              <div className="settings-alert error">
                                <span>{modelStatusError}</span>
                                {canStartBackend && (
                                  <button
                                    className="settings-alert-btn"
                                    type="button"
                                    onClick={() => void startBackend()}
                                    disabled={backendStarting}
                                  >
                                    {backendStarting ? "Starting..." : "Start backend"}
                                  </button>
                                )}
                              </div>
                            )}
                            {localModelsRoot && (
                              <div className="settings-info-card">
                                <strong>Local models folder</strong>
                                <span>{localModelsRoot}</span>
                              </div>
                            )}
                            {backendStartError && <div className="settings-alert error">{backendStartError}</div>}
                            <div className="settings-model-list">
                              {resolvedModels.map((model) => {
                                const isActive = selectedModel === model.id;
                                const download = model.download;
                                const hasDownloadActivity = Boolean(
                                  download && ["queued", "downloading", "paused", "verifying"].includes(download.status),
                                );
                                const isDownloading = Boolean(
                                  download && ["downloading", "paused", "verifying"].includes(download.status),
                                );
                                const isQueued = download?.status === "queued";
                                const isPaused = download?.status === "paused";
                                const localBytes = model.local_bytes ?? 0;
                                const canDeleteModel = !hasDownloadActivity && localBytes > 0;
                                const isDeletingModel = modelDeleteBusyId === model.id;
                                const progressValue = Math.min(100, Math.max(0, download?.progress ?? 0));
                                const downloadDetailsOpen = hasDownloadActivity && downloadDetailsId === model.id;
                                const statusLabel =
                                  !hasLocalScan && modelStatus.length === 0 && !modelStatusError
                                    ? "Checking"
                                    : download?.status === "queued"
                                      ? "Queued"
                                    : download?.status === "downloading"
                                      ? "Downloading"
                                      : download?.status === "paused"
                                        ? "Paused"
                                      : download?.status === "verifying"
                                        ? "Verifying"
                                        : model.present
                                          ? "Installed"
                                          : model.repo_mismatch
                                            ? "Update needed"
                                          : localBytes > 0
                                            ? "Stored locally"
                                            : !model.repo_id
                                              ? "Local only"
                                            : download?.status === "error" && download?.error === "auth_required" && !hfTokenSet
                                              ? "Token needed"
                                            : download?.status === "error" && download?.error === "access_required"
                                              ? "Access required"
                                            : download?.status === "error" && download?.error === "invalid_token"
                                                  ? "Token invalid"
                                              : download?.status === "error"
                                                ? "Needs repair"
                                                : "Download";
                                return (
                                  <div
                                    className={`settings-model-row ${isActive ? "active" : ""} ${hasDownloadActivity ? "is-downloading" : ""} ${downloadDetailsOpen ? "download-open" : ""}`}
                                    key={model.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => handleModelSelect(model.id as ModelOptionId)}
                                    onKeyDown={(event) => {
                                      if (event.target !== event.currentTarget) {
                                        return;
                                      }
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        handleModelSelect(model.id as ModelOptionId);
                                      }
                                    }}
                                  >
                                    <span
                                      className={`settings-model-radio ${isActive ? "active" : ""}`}
                                      aria-hidden="true"
                                    />
                                    <span className="settings-model-text">
                                      <strong>{renderSettingsQueryHighlights(model.label)}</strong>
                                      <span>{renderSettingsQueryHighlights(model.blurb || "")}</span>
                                      <span className="settings-model-meta">
                                        {model.params} - {formatModelStorage(model)} - {model.precision || "Full precision"}
                                      </span>
                                    </span>
                                    <span className="settings-model-pill">{model.params}</span>
                                    <span className={`settings-model-status ${model.present ? "installed" : "download"}`}>
                                      {statusLabel}
                                    </span>
                                    {canDeleteModel && (
                                      <div
                                        className="settings-model-actions"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                        }}
                                      >
                                        <button
                                          type="button"
                                          className="settings-model-action danger"
                                          disabled={isDeletingModel}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            void deleteModelFiles(model.id as ModelOptionId);
                                          }}
                                        >
                                          {isDeletingModel ? "Deleting..." : "Delete"}
                                        </button>
                                      </div>
                                    )}
                                    {hasDownloadActivity && download && (
                                      <div
                                        className="settings-model-download"
                                        id={`download-details-${model.id}`}
                                        onClick={(event) => {
                                          event.stopPropagation();
                                        }}
                                      >
                                        <div className="model-progress-bar">
                                          <span style={{ width: `${progressValue}%` }} />
                                        </div>
                                        <div className="model-progress-meta">
                                          <span>
                                            {download.status === "queued"
                                              ? "Queued next"
                                              : download.status === "verifying"
                                                ? "Verifying model"
                                                : isPaused
                                                  ? "Paused"
                                                  : "Downloading"}{" "}
                                            {download.status === "queued" ? "" : `- ${download.progress?.toFixed(1) ?? "0.0"}%`}
                                          </span>
                                          <span>
                                            {isQueued
                                              ? "Waiting for the current model to finish"
                                              : `${formatBytes(download.downloaded_bytes)} / ${formatBytes(download.total_bytes)}`}
                                          </span>
                                        </div>
                                        <div className="model-progress-actions">
                                          {download.status === "downloading" && (
                                            <button
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                void pauseModelDownload(model.id as ModelOptionId);
                                              }}
                                            >
                                              Pause
                                            </button>
                                          )}
                                          {download.status === "paused" && (
                                            <button
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation();
                                                void resumeModelDownload(model.id as ModelOptionId);
                                              }}
                                            >
                                              Resume
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            className="danger"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              void cancelModelDownload(model.id as ModelOptionId);
                                            }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <div className="settings-divider" />
                            <div className="settings-section-head with-info">
                              <div className="settings-section-title">
                                <h3>{renderSettingsQueryHighlights("Hugging Face access")}</h3>
                                <span>{renderSettingsQueryHighlights("Manage access token for gated models")}</span>
                              </div>
                              <div className={`settings-info-trigger ${hfInfoOpen ? "open" : ""}`}>
                                <button
                                  type="button"
                                  className="settings-info-btn"
                                  aria-label="How to get a Hugging Face token"
                                  aria-expanded={hfInfoOpen}
                                  onClick={() => setHfInfoOpen((prev) => !prev)}
                                >
                                  i
                                </button>
                                <div className="settings-info-popover" role="dialog" aria-hidden={!hfInfoOpen}>
                                  <strong>Get your Hugging Face token</strong>
                                  <ol className="settings-info-steps">
                                    <li>Sign in to Hugging Face or create an account.</li>
                                    <li>Open Settings → Access Tokens.</li>
                                    <li>Create a new token with Read permission.</li>
                                    <li>Copy the token (starts with hf_) and paste it here.</li>
                                  </ol>
                                </div>
                              </div>
                            </div>
                            <div className="settings-info-card">
                              <strong>{hfTokenSet ? "Token saved" : "Token not set"}</strong>
                              <span>
                                {hfTokenSet
                                  ? "Your access token is stored locally for secure downloads."
                                  : "Add your token to download gated models like Meera Ultra."}
                              </span>
                            </div>
                            {hfTokenError && <div className="settings-alert error">{hfTokenError}</div>}
                            {hfTokenNotice && <div className="settings-alert info">{hfTokenNotice}</div>}
                            <div className="settings-form-grid">
                              <label>
                                Access token
                                <input
                                  value={hfTokenValue}
                                  onChange={(event) => setHfTokenValue(event.target.value)}
                                  type="password"
                                  placeholder="hf_..."
                                  disabled={hfTokenSaving}
                                />
                              </label>
                            </div>
                            <div className="settings-action-inline">
                              <button
                                className="settings-primary-btn"
                                type="button"
                                onClick={() => void saveHfTokenFromSettings()}
                                disabled={hfTokenSaving}
                              >
                                {hfTokenSaving ? "Verifying..." : "Save token"}
                              </button>
                              <button
                                className="settings-secondary-btn"
                                type="button"
                                onClick={requestClearHfToken}
                                disabled={!hfTokenSet || hfTokenSaving}
                              >
                                Clear token
                              </button>
                            </div>

                            </div>
                            <div className="settings-models-overlay" aria-hidden="true">
                              <strong>Backend offline</strong>
                              <span>Start the backend to manage models.</span>
                              <button
                                className="settings-primary-btn"
                                type="button"
                                onClick={() => void startBackend()}
                                disabled={!canStartBackend || backendStarting}
                              >
                                {backendStarting ? "Starting..." : "Start AI Engine"}
                              </button>
                            </div>
                          </section>
                        )}

                        {resolvedSettingsSection === "wallpaper" && (
                          <section className="settings-section">
                            <div className="settings-section-head">
                              <h3>{renderSettingsQueryHighlights("Wallpaper")}</h3>
                              <span>{renderSettingsQueryHighlights("10 image backgrounds per conversation")}</span>
                            </div>
                            <div className="settings-wallpaper-grid">
                              {WALLPAPER_PRESETS.map((preset) => {
                                const isActive = !hasCustomWallpaper && activeWallpaperId === preset.id;
                                return (
                                  <button
                                    key={preset.id}
                                    className={`settings-wallpaper-item ${isActive ? "active" : ""}`}
                                    type="button"
                                    onClick={() => useWallpaperPreset(preset.id)}
                                  >
                                    <span className="settings-wallpaper-preview" style={{ backgroundImage: `url("${preset.src}")` }} />
                                    <span className="settings-wallpaper-copy">
                                      <strong>{renderSettingsQueryHighlights(preset.label)}</strong>
                                      <span>{renderSettingsQueryHighlights(preset.blurb)}</span>
                                    </span>
                                  </button>
                                );
                              })}
                              {hasCustomWallpaper && (
                                <button className="settings-wallpaper-item active" type="button">
                                  <span className="settings-wallpaper-preview" style={{ backgroundImage: `url("${currentAppearance.customWallpaper}")` }} />
                                  <span className="settings-wallpaper-copy">
                                    <strong>{renderSettingsQueryHighlights(currentAppearance.customWallpaperName || "Custom wallpaper")}</strong>
                                    <span>{renderSettingsQueryHighlights("Imported image")}</span>
                                  </span>
                                </button>
                              )}
                            </div>
                            <div
                              className={`settings-dropzone ${dropActive ? "active" : ""}`}
                              onDragOver={(event) => {
                                event.preventDefault();
                                setDropActive(true);
                              }}
                              onDragLeave={() => setDropActive(false)}
                              onDrop={onDropWallpaper}
                            >
                              <input
                                ref={fileInputRef}
                                className="hidden-input"
                                type="file"
                                accept="image/*"
                                onChange={onFileInputChange}
                              />
                              <div className="settings-drop-copy">
                                <strong>{renderSettingsQueryHighlights("Import custom wallpaper")}</strong>
                                <span>{renderSettingsQueryHighlights("Drop an image here or browse your files.")}</span>
                              </div>
                              <button className="btn btn-pill btn-compact" type="button" onClick={() => fileInputRef.current?.click()}>
                                Browse
                              </button>
                            </div>
                          </section>
                        )}

                        {resolvedSettingsSection === "assistant" && (
                          <section className="settings-section">
                            <div className="settings-section-head">
                              <h3>{renderSettingsQueryHighlights("Assistant")}</h3>
                              <span>{renderSettingsQueryHighlights("Behavior")}</span>
                            </div>
                            <div className="settings-toggle-list">
                              <button
                                className={`settings-toggle ${streamMode ? "active" : ""}`}
                                type="button"
                                onClick={() => setStreamMode((value) => !value)}
                              >
                                <span className="settings-toggle-text">
                                  <strong>{renderSettingsQueryHighlights("Streaming replies")}</strong>
                                  <span>
                                    {renderSettingsQueryHighlights(
                                      streamMode
                                        ? "Backend streams natural token-by-token replies."
                                        : "Backend waits and returns the full reply at once.",
                                    )}
                                  </span>
                                </span>
                                <span className="settings-toggle-right">
                                  <span className="settings-toggle-pill">{streamMode ? "On" : "Off"}</span>
                                  <span className="settings-toggle-switch" aria-hidden="true" />
                                </span>
                              </button>
                              <button
                                className={`settings-toggle ${autoScroll ? "active" : ""}`}
                                type="button"
                                onClick={() => setAutoScroll((value) => !value)}
                              >
                                <span className="settings-toggle-text">
                                  <strong>{renderSettingsQueryHighlights("Auto-scroll chat")}</strong>
                                  <span>{renderSettingsQueryHighlights("Keep the latest message in view.")}</span>
                                </span>
                                <span className="settings-toggle-right">
                                  <span className="settings-toggle-pill">{autoScroll ? "On" : "Off"}</span>
                                  <span className="settings-toggle-switch" aria-hidden="true" />
                                </span>
                              </button>
                            </div>
                          </section>
                        )}

                        {resolvedSettingsSection === "notifications" && (
                          <section className="settings-section">
                            <div className="settings-section-head">
                              <h3>{renderSettingsQueryHighlights("Notifications")}</h3>
                              <span>{renderSettingsQueryHighlights("Alerts & sounds")}</span>
                            </div>
                            <div className="settings-toggle-list">
                              <button
                                className={`settings-toggle ${notificationsEnabled ? "active" : ""}`}
                                type="button"
                                onClick={() => {
                                  if (!notificationsEnabled) {
                                    void ensureNotificationPermission();
                                  }
                                  setNotificationsEnabled((value) => !value);
                                }}
                              >
                                <span className="settings-toggle-text">
                                  <strong>{renderSettingsQueryHighlights("App notifications")}</strong>
                                  <span>{renderSettingsQueryHighlights("Desktop banners and alerts.")}</span>
                                </span>
                                <span className="settings-toggle-right">
                                  <span className="settings-toggle-pill">{notificationsEnabled ? "On" : "Off"}</span>
                                  <span className="settings-toggle-switch" aria-hidden="true" />
                                </span>
                              </button>
                              <button
                                className={`settings-toggle ${soundEffects ? "active" : ""}`}
                                type="button"
                                onClick={() => setSoundEffects((value) => !value)}
                              >
                                <span className="settings-toggle-text">
                                  <strong>{renderSettingsQueryHighlights("Sound effects")}</strong>
                                  <span>{renderSettingsQueryHighlights("Subtle tones for actions.")}</span>
                                </span>
                                <span className="settings-toggle-right">
                                  <span className="settings-toggle-pill">{soundEffects ? "On" : "Off"}</span>
                                  <span className="settings-toggle-switch" aria-hidden="true" />
                                </span>
                              </button>
                            </div>
                          </section>
                        )}

                        {resolvedSettingsSection === "account" && (
                          <section className="settings-section settings-account">
                            <div className="settings-section-head">
                              <h3>{renderSettingsQueryHighlights("Account")}</h3>
                              <span>{renderSettingsQueryHighlights("Identity, security, and sync")}</span>
                            </div>
                            <div className="settings-account-body">
                            <div className="settings-info-card">
                              <strong>{renderSettingsQueryHighlights("Firebase configuration")}</strong>
                              <span>{renderSettingsQueryHighlights("Stored locally on this device.")}</span>
                            </div>
                            <div className="settings-action-inline">
                              <button
                                className="settings-secondary-btn"
                                type="button"
                                onClick={handleFirebaseConfigReset}
                                disabled={!firebaseConfigReady}
                              >
                                Reset Firebase Config
                              </button>
                            </div>
                            <div className="settings-divider" />
                            {!authUser ? (
                              <>
                                <div className="settings-info-card">
                                  <strong>{renderSettingsQueryHighlights("Guest mode")}</strong>
                                  <span>
                                    {renderSettingsQueryHighlights("Sign in to sync across devices and protect sessions.")}
                                  </span>
                                </div>
                                {authDisabled && (
                                  <div className="settings-alert error">
                                    {renderSettingsQueryHighlights("Sign-in unavailable. Connect Firebase first.")}
                                  </div>
                                )}
                                <div className="settings-action-inline">
                                  <button
                                    className="settings-primary-btn"
                                    type="button"
                                    onClick={openAuthPanel}
                                    disabled={authDisabled}
                                  >
                                    {authDisabled ? "Sign-in unavailable" : "Sign in"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="settings-info-card">
                                  <strong>{renderSettingsQueryHighlights(authUser?.displayName || "Guest mode")}</strong>
                                  <span>
                                    {renderSettingsQueryHighlights(
                                      authUser?.email || "Sign in to sync across devices and protect sessions.",
                                    )}
                                  </span>
                                </div>
                                {accountError && <div className="settings-alert error">{cleanAuthMessage(accountError)}</div>}
                                {accountNotice && <div className="settings-alert info">{accountNotice}</div>}
                                <div className="settings-form-grid">
                                  <label>
                                    Full name
                                    <input
                                      value={accountName}
                                      onChange={(event) => setAccountName(event.target.value)}
                                      placeholder="Your full name"
                                    />
                                  </label>
                                  <label>
                                    Email
                                    <input
                                      value={accountEmail}
                                      onChange={(event) => setAccountEmail(event.target.value)}
                                      type="email"
                                      placeholder="you@company.com"
                                    />
                                  </label>
                                  <label>
                                    Phone number
                                    <input
                                      value={accountPhone}
                                      onChange={(event) => setAccountPhone(event.target.value)}
                                      type="tel"
                                      placeholder="+1 555 012 3456"
                                    />
                                  </label>
                                </div>
                                <div className="settings-action-inline">
                                  <button
                                    className="settings-primary-btn"
                                    type="button"
                                    onClick={handleAccountSaveProfile}
                                    disabled={accountLoading || !authUser}
                                  >
                                    {accountLoading ? "Saving..." : "Save profile"}
                                  </button>
                                  <button
                                    className="settings-secondary-btn"
                                    type="button"
                                    onClick={refreshAuthUser}
                                    disabled={accountLoading || !authUser}
                                  >
                                    Refresh
                                  </button>
                                </div>

                                <div className="settings-divider" />
                                <div className="settings-section-head">
                                  <h3>{renderSettingsQueryHighlights("Password")}</h3>
                                  <span>{renderSettingsQueryHighlights("Update your password securely")}</span>
                                </div>
                                <div className="settings-form-grid">
                                  <label>
                                    New password
                                    <input
                                      value={accountPassword}
                                      onChange={(event) => setAccountPassword(event.target.value)}
                                      type="password"
                                      placeholder="••••••••"
                                    />
                                  </label>
                                  <label>
                                    Confirm password
                                    <input
                                      value={accountPasswordConfirm}
                                      onChange={(event) => setAccountPasswordConfirm(event.target.value)}
                                      type="password"
                                      placeholder="••••••••"
                                    />
                                  </label>
                                </div>
                                <div className="settings-action-inline">
                                  <button
                                    className="settings-primary-btn"
                                    type="button"
                                    onClick={handleAccountPasswordUpdate}
                                    disabled={accountLoading || !authUser}
                                  >
                                    Update password
                                  </button>
                                  <button
                                    className="settings-secondary-btn"
                                    type="button"
                                    onClick={handleAccountPasswordReset}
                                    disabled={accountLoading || !authUser}
                                  >
                                    Send reset link
                                  </button>
                                </div>

                                <div className="settings-divider" />
                                <div className="settings-section-head">
                                  <h3>{renderSettingsQueryHighlights("Phone verification")}</h3>
                                  <span>{renderSettingsQueryHighlights("Verify or update your phone number")}</span>
                                </div>
                                <div className="settings-form-grid">
                                  <label>
                                    Phone number
                                    <input
                                      value={accountPhone}
                                      onChange={(event) => setAccountPhone(event.target.value)}
                                      type="tel"
                                      placeholder="+1 555 012 3456"
                                    />
                                  </label>
                                  {accountOtpSent && (
                                    <label>
                                      OTP code
                                      <OtpInput
                                        value={accountOtp}
                                        onChange={setAccountOtp}
                                        disabled={accountLoading || !authUser}
                                        onComplete={(code) => {
                                          if (accountLoading || !authUser) {
                                            return;
                                          }
                                          void handleAccountVerifyPhone(code);
                                        }}
                                      />
                                    </label>
                                  )}
                                </div>
                                <div id="account-phone-recaptcha" className="settings-recaptcha" />
                                <div className="settings-action-inline">
                                  <button
                                    className="settings-secondary-btn"
                                    type="button"
                                    onClick={handleAccountSendOtp}
                                    disabled={accountLoading || !authUser}
                                  >
                                    Send OTP
                                  </button>
                                  <button
                                    className="settings-primary-btn"
                                    type="button"
                                    onClick={handleAccountVerifyPhone}
                                    disabled={accountLoading || !authUser}
                                  >
                                    Verify phone
                                  </button>
                                </div>

                                <div className="settings-toggle-list">
                                  <button
                                    className={`settings-toggle ${syncAcrossDevices ? "active" : ""}`}
                                    type="button"
                                    onClick={() => setSyncAcrossDevices((value) => !value)}
                                  >
                                    <span className="settings-toggle-text">
                                      <strong>{renderSettingsQueryHighlights("Sync across devices")}</strong>
                                      <span>{renderSettingsQueryHighlights("Keep settings and sessions aligned.")}</span>
                                    </span>
                                    <span className="settings-toggle-right">
                                      <span className="settings-toggle-pill">{syncAcrossDevices ? "On" : "Off"}</span>
                                      <span className="settings-toggle-switch" aria-hidden="true" />
                                    </span>
                                  </button>
                                </div>

                                <div className="settings-divider" />
                                <div className="settings-section-head">
                                  <h3>{renderSettingsQueryHighlights("Account actions")}</h3>
                                  <span>{renderSettingsQueryHighlights("Manage your session or permanently remove this account")}</span>
                                </div>
                                <div className="settings-account-actions">
                                  <button
                                    className="settings-action-row danger"
                                    type="button"
                                    onClick={() => {
                                      void handleAccountSignOutRequest();
                                    }}
                                    disabled={!authUser}
                                  >
                                    <span className="settings-toggle-text">
                                      <strong>{renderSettingsQueryHighlights("Sign out")}</strong>
                                      <span>{renderSettingsQueryHighlights("End this session on this device.")}</span>
                                    </span>
                                    <span className="settings-action-pill danger">Sign out</span>
                                  </button>
                                  <button
                                    className="settings-action-row danger"
                                    type="button"
                                    onClick={() => {
                                      void handleAccountDeleteRequest();
                                    }}
                                    disabled={!authUser}
                                  >
                                    <span className="settings-toggle-text">
                                      <strong>{renderSettingsQueryHighlights("Delete account")}</strong>
                                      <span>{renderSettingsQueryHighlights("Permanently delete your account.")}</span>
                                    </span>
                                    <span className="settings-action-pill danger">Delete</span>
                                  </button>
                                </div>
                              </>
                            )}
                            </div>
                          </section>
                        )}

                        {resolvedSettingsSection === "shortcuts" && (
                          <section className="settings-section">
                            <div className="settings-section-head">
                              <h3>{renderSettingsQueryHighlights("Keyboard shortcuts")}</h3>
                              <span>{renderSettingsQueryHighlights("Customize how you navigate MeeraAI.")}</span>
                            </div>
                            <div className="settings-shortcut-list">
                              {SHORTCUT_ACTIONS.map((action) => (
                                <div className="settings-shortcut-row" key={action.id}>
                                  <div className="settings-shortcut-text">
                                    <strong>{renderSettingsQueryHighlights(action.label)}</strong>
                                    <span>{renderSettingsQueryHighlights(action.description)}</span>
                                  </div>
                                  <button
                                    className={`settings-shortcut-key ${shortcutCaptureId === action.id ? "capture" : ""}`}
                                    type="button"
                                    onClick={() =>
                                      setShortcutCaptureId((current) => (current === action.id ? null : action.id))
                                    }
                                  >
                                    {shortcutCaptureId === action.id
                                      ? "Press keys"
                                      : formatShortcut(shortcuts[action.id])}
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="settings-action-inline">
                              <button
                                className="settings-secondary-btn"
                                type="button"
                                onClick={() => {
                                  setShortcuts({ ...DEFAULT_SHORTCUTS });
                                  setShortcutCaptureId(null);
                                }}
                              >
                                Reset shortcuts
                              </button>
                            </div>
                          </section>
                        )}

                        {resolvedSettingsSection === "about" && (
                          <section className="settings-section settings-about">
                            <div className="settings-section-head">
                              <h3>{renderSettingsQueryHighlights("About MeeraAI")}</h3>
                              <span>{renderSettingsQueryHighlights("Crafted for focused, premium work")}</span>
                            </div>
                            <div className="settings-about-body">
                              <p>
                                {renderSettingsQueryHighlights(
                                  "MeeraAI is built to feel like a calm, intelligent workspace rather than a noisy chatbot. Every surface is tuned for clarity, and every control is designed to get out of your way while staying immediately accessible when you need it.",
                                )}
                              </p>
                              <p>
                                {renderSettingsQueryHighlights(
                                  "Your sessions, preferences, and tools are organized to reduce friction so you can move from idea to execution without context switching. The glassmorphism is not just visual - it reinforces the sense of depth and focus that premium desktop tools are known for.",
                                )}
                              </p>
                              <p>
                                {renderSettingsQueryHighlights(
                                  "We prioritize privacy and performance. You stay in control of what syncs, which models you run, and how the assistant behaves. MeeraAI is designed to scale with you - from quick notes to deep projects.",
                                )}
                              </p>
                              <div className="settings-about-grid">
                                <div className="settings-info-card">
                                  <strong>{renderSettingsQueryHighlights("Vision")}</strong>
                                  <span>
                                    {renderSettingsQueryHighlights(
                                      "Build a premium AI workspace that feels native on every device.",
                                    )}
                                  </span>
                                </div>
                                <div className="settings-info-card">
                                  <strong>{renderSettingsQueryHighlights("Privacy")}</strong>
                                  <span>
                                    {renderSettingsQueryHighlights(
                                      "Transparent controls for sync, tokens, and data retention.",
                                    )}
                                  </span>
                                </div>
                                <div className="settings-info-card">
                                  <strong>{renderSettingsQueryHighlights("Performance")}</strong>
                                  <span>
                                    {renderSettingsQueryHighlights(
                                      "Optimized interactions, streaming responses, and zero-lag controls.",
                                    )}
                                  </span>
                                </div>
                                <div className="settings-info-card">
                                  <strong>{renderSettingsQueryHighlights("Created by")}</strong>
                                  <span>
                                    {renderSettingsQueryHighlights(
                                      "Vidit Shah - design direction, desktop experience, and MeeraAI implementation.",
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="settings-shortcuts-mini">
                                <div className="settings-section-head">
                                  <h3>{renderSettingsQueryHighlights("Keyboard shortcuts")}</h3>
                                  <span>{renderSettingsQueryHighlights("Quick access to core actions.")}</span>
                                </div>
                                <div className="settings-shortcut-mini-grid">
                                  {SHORTCUT_ACTIONS.slice(0, 6).map((action) => (
                                    <div className="settings-shortcut-mini-row" key={action.id}>
                                      <span>{renderSettingsQueryHighlights(action.label)}</span>
                                      <span className="settings-shortcut-mini-key">
                                        {formatShortcut(shortcuts[action.id])}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  className="settings-secondary-btn"
                                  type="button"
                                  onClick={() => setSettingsSection("shortcuts")}
                                >
                                  Edit shortcuts
                                </button>
                              </div>
                            </div>
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>
      )}
    </div>
  );
}

export default function RootApp() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
