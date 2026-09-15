const path = require("path");
const fs = require("fs");
const { spawnSync } = require("child_process");

const outputDir = "release\\MeeraAI (APP)";
const stagingDir = "release\\MeeraAI (APP)\\.staging";
const args = [...process.argv.slice(2), `-c.directories.output=${stagingDir}`];

const bin = path.join(__dirname, "..", "node_modules", ".bin", "electron-builder.cmd");

console.log(`[package] Output: ${outputDir}`);
console.log(`[package] Staging: ${stagingDir}`);

const killProcess = (imageName) => {
  const result = spawnSync("taskkill", ["/F", "/IM", imageName, "/T"], { stdio: "ignore" });
  return result.status === 0;
};

const killProcessesByPath = (pathFragment) => {
  const ps = `
$pathFragment = "${pathFragment.replace(/\\/g, "\\\\")}";
$procs = Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath -like "*${pathFragment.replace(/\\/g, "\\\\")}*" };
foreach ($p in $procs) {
  try { Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue } catch {}
}
`;
  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps],
    { stdio: "ignore" }
  );
  return result.status === 0;
};

const removeDir = (dir) => {
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 2, retryDelay: 150 });
      return true;
    } catch (err) {
      return false;
    }
  }
  return true;
};

const normalizeArtifactName = (name) => {
  if (/^MeeraAI Setup .*\.exe\.blockmap$/i.test(name)) {
    return "MeeraAI Installer.exe.blockmap";
  }
  if (/^MeeraAI Setup .*\.exe$/i.test(name)) {
    return "MeeraAI Installer.exe";
  }
  if (/^MeeraAI .*\.exe$/i.test(name)) {
    return "MeeraAI.exe";
  }
  return name;
};

const cleanReleaseArtifacts = () => {
  if (!fs.existsSync(outputDir)) {
    return;
  }
  const entries = fs.readdirSync(outputDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }
    if (/^MeeraAI(?: Setup)?(?: Installer)?(?: [\d.]+)?\.exe(?:\.blockmap)?$/i.test(entry.name)) {
      fs.rmSync(path.join(outputDir, entry.name), { force: true });
    }
  }
};

const copyArtifacts = () => {
  if (!fs.existsSync(stagingDir)) {
    return;
  }
  fs.mkdirSync(outputDir, { recursive: true });
  cleanReleaseArtifacts();
  const entries = fs.readdirSync(stagingDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      continue;
    }
    const src = path.join(stagingDir, entry.name);
    const dest = path.join(outputDir, normalizeArtifactName(entry.name));
    fs.copyFileSync(src, dest);
  }
};

// Try to remove any old win-unpacked output to avoid confusion.
removeDir(path.join(outputDir, "win-unpacked"));

// Ensure staging dir is clear; try to unlock if needed.
if (!removeDir(stagingDir)) {
  const lockPath = path.join(process.cwd(), stagingDir, "win-unpacked");
  const killedByPath = killProcessesByPath(lockPath);
  const killedByName =
    killProcess("MeeraAI.exe") ||
    killProcess("Meera Copilot.exe") ||
    killProcess("MeeraAI Desktop.exe");

  if (killedByPath || killedByName) {
    removeDir(stagingDir);
  }
}

const result = spawnSync("cmd.exe", ["/c", bin, ...args], {
  stdio: "inherit",
  env: {
    ...process.env,
    CSC_IDENTITY_AUTO_DISCOVERY: "false",
  },
});

if (result.error) {
  console.error("[package] Failed to launch electron-builder:", result.error.message);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

copyArtifacts();
removeDir(stagingDir);
