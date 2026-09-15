const path = require("path");
const fs = require("fs");
const { execFileSync } = require("child_process");
const { path7za } = require("7zip-bin");

const projectRoot = path.resolve(__dirname, "..");
const payloadRoot = path.join(projectRoot, "payload");
const payloadApp = path.join(payloadRoot, "app");
const agentRoot = path.resolve(projectRoot, "..");
const meeraBackendScript = path.join(agentRoot, "Meera.py");

const desktopRoot = path.resolve(projectRoot, "..", "desktop_frontend");
const releaseDir = path.join(desktopRoot, "release", "MeeraAI (APP)");
const stagingDir = path.join(releaseDir, ".staging", "win-unpacked");
const winUnpacked = path.join(releaseDir, "win-unpacked");
const setupExtracted = path.join(desktopRoot, "release", "_setup_extracted");
const setupExtractedAlt = path.join(releaseDir, "_setup_extracted");
const setupExeCandidates = [
  path.join(releaseDir, "MeeraAI.exe"),
  path.join(releaseDir, "MeeraAI Installer.exe"),
  path.join(releaseDir, "MeeraAI Setup 0.1.0.exe"),
];

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const clearDir = (dir) => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const copyDir = (src, dest) => {
  fs.cpSync(src, dest, { recursive: true });
};

const hasAsar = (dir) => {
  if (!dir || !fs.existsSync(dir)) return false;
  return fs.existsSync(path.join(dir, "resources", "app.asar"));
};

const pickSource = () => {
  // Always prefer the specific release folder the user asked for.
  if (hasAsar(releaseDir)) return releaseDir;

  const dirCandidates = [stagingDir, winUnpacked, setupExtracted, setupExtractedAlt];
  const withAsar = dirCandidates.find((candidate) => hasAsar(candidate));
  if (withAsar) return withAsar;

  const setupExe = setupExeCandidates.find((candidate) => fs.existsSync(candidate));
  if (setupExe) return setupExe;

  const existing = dirCandidates.find((candidate) => fs.existsSync(candidate));
  if (existing) return existing;

  return null;
};

const preparePayload = () => {
  const source = pickSource();
  if (!source) {
    throw new Error("No app payload found. Build MeeraAI first or provide a setup EXE.");
  }

  clearDir(payloadApp);
  ensureDir(payloadRoot);

  if (source.endsWith(".exe")) {
    const extractDir = path.join(payloadRoot, "_extracted");
    clearDir(extractDir);
    ensureDir(extractDir);
    execFileSync(path7za, ["x", "-y", `-o${extractDir}`, source], { stdio: "inherit" });
    copyDir(extractDir, payloadApp);
    clearDir(extractDir);
  } else {
    copyDir(source, payloadApp);
  }

  if (!fs.existsSync(meeraBackendScript)) {
    throw new Error(`Backend script not found: ${meeraBackendScript}`);
  }
  fs.copyFileSync(meeraBackendScript, path.join(payloadApp, "Meera.py"));

  if (!hasAsar(payloadApp)) {
    throw new Error("Payload missing resources/app.asar. Rebuild the MeeraAI app and re-run the installer packager.");
  }

  console.log(`[payload] Prepared from ${source}`);
  console.log(`[payload] Bundled backend script from ${meeraBackendScript}`);
};

preparePayload();
