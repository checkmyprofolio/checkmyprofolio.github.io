const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const https = require("https");
const realFs = require("original-fs");
const realFsp = realFs.promises;
const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const { spawn } = require("child_process");

const WINDOW_WIDTH = 1080;
const WINDOW_HEIGHT = 680;

const APP_PYTHON = { major: 3, minor: 10 };
const PYTHON_INSTALLER_URLS = [
  process.env.MEERA_PYTHON_INSTALLER_URL,
  "https://www.python.org/ftp/python/3.10.13/python-3.10.13-amd64.exe",
  "https://www.python.org/ftp/python/3.10.12/python-3.10.12-amd64.exe",
  "https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe",
].filter(Boolean);

const INSTALL_PROGRESS_RANGES = {
  copy: { base: 0, span: 55 },
  python: { base: 55, span: 15 },
  venv: { base: 70, span: 5 },
  torch: { base: 75, span: 10 },
  deps: { base: 85, span: 14 },
};

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    transparent: true,
    resizable: false,
    backgroundColor: "#00000000",
    title: "MeeraAI Installer",
    icon: path.join(__dirname, "app", "assets", "logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "app", "index.html"));
};

const getDefaultInstallDir = () => {
  return "C:\\MeeraAI";
};

const resolveInstallRecordPath = () => {
  const programData = process.env.PROGRAMDATA || app.getPath("appData");
  return path.join(programData, "MeeraAI", "install.json");
};

const readInstallRecord = async () => {
  try {
    const recordPath = resolveInstallRecordPath();
    if (!realFs.existsSync(recordPath)) {
      return null;
    }
    const raw = await realFsp.readFile(recordPath, "utf8");
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    return null;
  }
};

const writeInstallRecord = async (installDir) => {
  try {
    const recordPath = resolveInstallRecordPath();
    await ensureDir(path.dirname(recordPath));
    const payload = {
      installDir,
      updatedAt: new Date().toISOString(),
    };
    await realFsp.writeFile(recordPath, JSON.stringify(payload, null, 2), "utf8");
  } catch {
    // ignore best-effort
  }
};

const clearInstallRecord = async () => {
  try {
    const recordPath = resolveInstallRecordPath();
    if (realFs.existsSync(recordPath)) {
      await realFsp.unlink(recordPath);
    }
  } catch {
    // ignore best-effort
  }
};

const payloadHasAsar = (dir) => {
  if (!dir) return false;
  return realFs.existsSync(path.join(dir, "resources", "app.asar"));
};

const resolvePayloadDir = () => {
  const direct = path.join(process.resourcesPath, "payload", "app");
  const alt = path.join(process.resourcesPath, "payload", "win-unpacked");
  const fallback = path.join(process.resourcesPath, "payload");
  const candidates = [direct, alt, fallback];

  for (const candidate of candidates) {
    if (payloadHasAsar(candidate)) {
      return candidate;
    }
  }

  const existing = candidates.find((candidate) => realFs.existsSync(candidate));
  return existing || fallback;
};

const ensureDir = async (dir) => {
  await fsp.mkdir(dir, { recursive: true });
};

const listFiles = async (root) => {
  const entries = [];
  const walk = async (dir) => {
    const items = await realFsp.readdir(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        await walk(full);
      } else if (item.isFile()) {
        const stat = await realFsp.stat(full);
        entries.push({
          src: full,
          rel: path.relative(root, full),
          size: stat.size,
        });
      }
    }
  };
  await walk(root);
  return entries;
};

const copyWithProgress = async (srcRoot, destRoot, onProgress, phase = "copy", message = "Copying files...") => {
  const files = await listFiles(srcRoot);
  const total = files.reduce((sum, f) => sum + f.size, 0);
  let copied = 0;

  onProgress({ phase, copiedBytes: 0, totalBytes: total, percent: 0, currentFile: "Preparing...", message });

  for (const file of files) {
    const target = path.join(destRoot, file.rel);
    await ensureDir(path.dirname(target));
    await realFsp.copyFile(file.src, target);
    copied += file.size;
    const percent = total ? Math.min(100, Math.round((copied / total) * 100)) : 0;
    onProgress({ phase, copiedBytes: copied, totalBytes: total, percent, currentFile: file.rel, message });
  }
};

const writeInstallerConfig = async (installDir, modelId) => {
  const configDir = path.join(installDir, "config");
  await ensureDir(configDir);
  const payload = {
    selectedModel: modelId || "meera-lite-1b",
    autoDownload: true,
  };
  await fsp.writeFile(path.join(configDir, "installer.json"), JSON.stringify(payload, null, 2), "utf8");
};

const createShortcut = (shortcutPath, targetPath, workingDir) => {
  const ps = [
    "$ws = New-Object -ComObject WScript.Shell;",
    `$s = $ws.CreateShortcut(\"${shortcutPath.replace(/\\/g, "\\\\")}\");`,
    `$s.TargetPath = \"${targetPath.replace(/\\/g, "\\\\")}\";`,
    `$s.WorkingDirectory = \"${workingDir.replace(/\\/g, "\\\\")}\";`,
    "$s.IconLocation = $s.TargetPath;",
    "$s.Save();",
  ].join(" ");
  return new Promise((resolve) => {
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("exit", () => resolve());
  });
};

const resolveStartMenuPath = () => {
  try {
    return app.getPath("startMenu");
  } catch (error) {
    try {
      const appData = app.getPath("appData");
      return path.join(appData, "Microsoft", "Windows", "Start Menu", "Programs");
    } catch (_error) {
      return null;
    }
  }
};

const createShortcuts = async (installDir, options = {}) => {
  const { desktop: desktopShortcut = true, startMenu: startMenuShortcut = true } = options;
  const exePath = path.join(installDir, "MeeraAI.exe");
  let desktopPath = null;
  try {
    desktopPath = app.getPath("desktop");
  } catch (_error) {
    desktopPath = null;
  }
  const startMenuPath = resolveStartMenuPath();

  if (desktopShortcut && desktopPath) {
    await createShortcut(path.join(desktopPath, "MeeraAI.lnk"), exePath, installDir);
  }
  if (startMenuShortcut && startMenuPath) {
    await createShortcut(path.join(startMenuPath, "MeeraAI.lnk"), exePath, installDir);
  }
};

const removeShortcuts = async () => {
  let desktopPath = null;
  try {
    desktopPath = app.getPath("desktop");
  } catch (_error) {
    desktopPath = null;
  }
  const startMenuPath = resolveStartMenuPath();
  const candidates = [];
  if (desktopPath) {
    candidates.push(path.join(desktopPath, "MeeraAI.lnk"));
  }
  if (startMenuPath) {
    candidates.push(path.join(startMenuPath, "MeeraAI.lnk"));
  }
  for (const shortcut of candidates) {
    try {
      if (realFs.existsSync(shortcut)) {
        await realFsp.unlink(shortcut);
      }
    } catch {
      // ignore
    }
  }
};

const addInstallDirToPath = (installDir) => {
  const escaped = installDir.replace(/\\/g, "\\\\");
  const ps = [
    `$target = \"${escaped}\";`,
    "$current = [Environment]::GetEnvironmentVariable('Path','User');",
    "if (-not $current) { $current = '' }",
    "$parts = $current.Split(';') | Where-Object { $_ -ne '' }",
    "if ($parts -notcontains $target) {",
    "  $new = ($parts + $target) -join ';';",
    "  [Environment]::SetEnvironmentVariable('Path', $new, 'User');",
    "}",
  ].join(" ");
  return new Promise((resolve) => {
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("exit", () => resolve());
  });
};

const removeInstallDirFromPath = (installDir) => {
  const escaped = installDir.replace(/\\/g, "\\\\");
  const ps = [
    `$target = \"${escaped}\";`,
    "$current = [Environment]::GetEnvironmentVariable('Path','User');",
    "if (-not $current) { $current = '' }",
    "$parts = $current.Split(';') | Where-Object { $_ -ne '' -and $_ -ne $target }",
    "$new = ($parts -join ';');",
    "[Environment]::SetEnvironmentVariable('Path', $new, 'User');",
  ].join(" ");
  return new Promise((resolve) => {
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps], {
      stdio: "ignore",
      windowsHide: true,
    });
    child.on("exit", () => resolve());
  });
};

const runPowerShell = (script) => {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script], {
      windowsHide: true,
    });
    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", () => resolve({ code: 1, stdout: "", stderr: "spawn_failed" }));
    child.on("exit", (code) => resolve({ code: code || 0, stdout, stderr }));
  });
};

const psEscape = (value) => String(value).replace(/'/g, "''");

const broadcastEnvironmentChange = async () => {
  const script = [
    "$signature = '[DllImport(\"user32.dll\", SetLastError=true, CharSet=CharSet.Auto)] public static extern IntPtr SendMessageTimeout(IntPtr hWnd, int Msg, IntPtr wParam, string lParam, int fuFlags, int uTimeout, out IntPtr lpdwResult);'",
    "Add-Type -MemberDefinition $signature -Name 'NativeMethods' -Namespace 'Win32';",
    "$HWND_BROADCAST = [intptr]0xffff;",
    "$WM_SETTINGCHANGE = 0x1A;",
    "$SMTO_ABORTIFHUNG = 2;",
    "[Win32.NativeMethods]::SendMessageTimeout($HWND_BROADCAST, $WM_SETTINGCHANGE, [intptr]0, 'Environment', $SMTO_ABORTIFHUNG, 5000, [ref]([intptr]0)) | Out-Null;",
  ].join(" ");
  await runPowerShell(script);
};

const refreshWindowsShellIcons = async () => {
  if (process.platform !== "win32") {
    return;
  }

  await runProcess("ie4uinit.exe", ["-ClearIconCache"]);
  await runProcess("ie4uinit.exe", ["-show"]);

  const script = [
    "$signature = '[DllImport(\"shell32.dll\")] public static extern void SHChangeNotify(int wEventId, uint uFlags, IntPtr dwItem1, IntPtr dwItem2);'",
    "Add-Type -MemberDefinition $signature -Name 'ShellMethods' -Namespace 'Win32' -ErrorAction SilentlyContinue;",
    "[Win32.ShellMethods]::SHChangeNotify(0x08000000, 0x0000, [IntPtr]::Zero, [IntPtr]::Zero);",
  ].join(" ");
  await runPowerShell(script);
};

const setUserEnvironmentVariable = async (name, value) => {
  const key = psEscape(name);
  const val = psEscape(value);
  const script = `[Environment]::SetEnvironmentVariable('${key}', '${val}', 'User')`;
  await runPowerShell(script);
  await broadcastEnvironmentChange();
};

const runProcess = (command, args, options = {}) =>
  new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(command, args, { windowsHide: true, ...options });
    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });
    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });
    child.on("error", (error) =>
      resolve({
        code: 1,
        stdout,
        stderr: error instanceof Error ? error.message : "spawn_failed",
      }),
    );
    child.on("exit", (code) => resolve({ code: typeof code === "number" ? code : 0, stdout, stderr }));
  });

const runProcessStreaming = (command, args, options = {}, onLine) =>
  new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let stdoutBuf = "";
    let stderrBuf = "";

    const flush = (buffer, isErr) => {
      let idx = buffer.indexOf("\n");
      while (idx >= 0) {
        const line = buffer.slice(0, idx).trim();
        if (line && onLine) {
          onLine(line, isErr);
        }
        buffer = buffer.slice(idx + 1);
        idx = buffer.indexOf("\n");
      }
      return buffer;
    };

    const child = spawn(command, args, { windowsHide: true, ...options });
    child.stdout?.on("data", (data) => {
      const text = data.toString();
      stdout += text;
      stdoutBuf = flush(stdoutBuf + text, false);
    });
    child.stderr?.on("data", (data) => {
      const text = data.toString();
      stderr += text;
      stderrBuf = flush(stderrBuf + text, true);
    });
    child.on("error", (error) =>
      resolve({
        code: 1,
        stdout,
        stderr: error instanceof Error ? error.message : "spawn_failed",
      }),
    );
    child.on("exit", (code) => {
      const leftover = stdoutBuf.trim();
      if (leftover && onLine) {
        onLine(leftover, false);
      }
      const errLeftover = stderrBuf.trim();
      if (errLeftover && onLine) {
        onLine(errLeftover, true);
      }
      resolve({ code: typeof code === "number" ? code : 0, stdout, stderr });
    });
  });

const extractJsonFromOutput = (output) => {
  if (!output) return null;
  const start = output.indexOf("{");
  const end = output.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(output.slice(start, end + 1));
  } catch {
    return null;
  }
};

const getPythonInfo = async (command, argsPrefix = []) => {
  const probe = "import json, sys; print(json.dumps({'executable': sys.executable, 'version': list(sys.version_info[:3])}))";
  const result = await runProcess(command, [...argsPrefix, "-c", probe]);
  if (result.code !== 0) {
    return null;
  }
  const parsed = extractJsonFromOutput(result.stdout);
  if (!parsed || !Array.isArray(parsed.version)) {
    return null;
  }
  return {
    executable: typeof parsed.executable === "string" ? parsed.executable : command,
    version: parsed.version,
  };
};

const matchesAppPython = (version) => {
  if (!Array.isArray(version) || version.length < 2) return false;
  const [major, minor] = version;
  return major === APP_PYTHON.major && minor === APP_PYTHON.minor;
};

const getWindowsPythonCandidates = async () => {
  if (process.platform !== "win32") {
    return [];
  }

  const versionTag = `${APP_PYTHON.major}${APP_PYTHON.minor}`;
  const envCandidates = [
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Python", `Python${versionTag}`, "python.exe"),
    path.join(process.env.ProgramFiles || "", `Python${versionTag}`, "python.exe"),
    path.join(process.env.ProgramW6432 || "", `Python${versionTag}`, "python.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", `Python${versionTag}`, "python.exe"),
    path.join("C:\\", `Python${versionTag}`, "python.exe"),
  ].filter((candidate) => candidate && realFs.existsSync(candidate));

  const registryScript = [
    `$roots = @('HKCU:\\Software\\Python\\PythonCore\\${APP_PYTHON.major}.${APP_PYTHON.minor}\\InstallPath',`,
    `'HKLM:\\Software\\Python\\PythonCore\\${APP_PYTHON.major}.${APP_PYTHON.minor}\\InstallPath',`,
    `'HKLM:\\Software\\WOW6432Node\\Python\\PythonCore\\${APP_PYTHON.major}.${APP_PYTHON.minor}\\InstallPath');`,
    "$paths = @();",
    "foreach ($root in $roots) {",
    "  try {",
    "    $item = Get-Item -Path $root -ErrorAction Stop;",
    "    $value = $item.GetValue('');",
    "    if ($value) {",
    "      $exe = Join-Path $value 'python.exe';",
    "      if (Test-Path $exe) { $paths += $exe }",
    "    }",
    "  } catch { }",
    "}",
    "$paths | Select-Object -Unique | ConvertTo-Json -Compress",
  ].join(" ");

  const registryResult = await runPowerShell(registryScript);
  let registryCandidates = [];
  try {
    const parsed = JSON.parse((registryResult.stdout || "").trim() || "[]");
    registryCandidates = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    registryCandidates = [];
  }

  return [...new Set([...registryCandidates, ...envCandidates].filter((candidate) => typeof candidate === "string" && candidate && realFs.existsSync(candidate)))];
};

const detectPython = async () => {
  let firstDetected = null;
  const override = process.env.MEERA_PYTHON;
  if (override && realFs.existsSync(override)) {
    const info = await getPythonInfo(override);
    if (info && matchesAppPython(info.version)) {
      return { cmd: override, argsPrefix: [], ...info };
    }
    if (info && !firstDetected) {
      firstDetected = { cmd: override, argsPrefix: [], ...info };
    }
  }

  const windowsPathCandidates = process.platform === "win32" ? await getWindowsPythonCandidates() : [];
  const candidates =
    process.platform === "win32"
      ? [
          { cmd: "py", argsPrefix: [`-${APP_PYTHON.major}.${APP_PYTHON.minor}`] },
          { cmd: "py", argsPrefix: ["-3"] },
          { cmd: "python", argsPrefix: [] },
          { cmd: "python3", argsPrefix: [] },
          ...windowsPathCandidates.map((candidate) => ({ cmd: candidate, argsPrefix: [] })),
        ]
      : [
          { cmd: "python3", argsPrefix: [] },
          { cmd: "python", argsPrefix: [] },
        ];

  const seen = new Set();

  for (const candidate of candidates) {
    const key = `${candidate.cmd}::${candidate.argsPrefix.join(" ")}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    const info = await getPythonInfo(candidate.cmd, candidate.argsPrefix);
    if (info) {
      const detected = { ...candidate, ...info };
      if (matchesAppPython(info.version)) {
        return detected;
      }
      if (!firstDetected) {
        firstDetected = detected;
      }
    }
  }
  return firstDetected;
};

const resolveRequirementsPath = () => {
  const resourcePath = path.join(process.resourcesPath || "", "requirements.txt");
  if (resourcePath && realFs.existsSync(resourcePath)) {
    return resourcePath;
  }
  const devPath = path.resolve(__dirname, "..", "requirements.txt");
  if (realFs.existsSync(devPath)) {
    return devPath;
  }
  return "";
};

const parseJsonArray = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const detectNvidiaGpu = async () => {
  const forced = (process.env.MEERA_TORCH_DEVICE || "").trim().toLowerCase();
  if (forced === "cpu") return false;
  if (forced === "gpu") return true;

  const smi = await runProcess("nvidia-smi", ["-L"]);
  if (smi.code === 0 && /GPU\s+\d+/i.test(smi.stdout || "")) {
    return true;
  }

  const ps = "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name | ConvertTo-Json -Compress";
  const wmi = await runPowerShell(ps);
  const names = parseJsonArray((wmi.stdout || "").trim());
  return names.some((name) => typeof name === "string" && /nvidia/i.test(name));
};

const splitRequirements = (content) => {
  const lines = (content || "").split(/\r?\n/);
  let torchSpec = null;
  const dependencySpecs = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const spec = trimmed.split(/\s+#/)[0].trim();
    if (!spec) {
      continue;
    }
    if (/^torch(\s|[<>=!~])/i.test(spec)) {
      torchSpec = spec;
      continue;
    }
    dependencySpecs.push(spec);
  }

  return { torchSpec, dependencySpecs };
};

const getRequirementDisplayName = (requirementSpec) => {
  const match = String(requirementSpec || "")
    .trim()
    .match(/^[A-Za-z0-9_.-]+/);
  return match ? match[0] : String(requirementSpec || "").trim();
};

const probeRequirementState = async (pythonExe, requirementSpec) => {
  const probe = [
    "import json, sys",
    "try:",
    "    from importlib import metadata as md",
    "except ImportError:",
    "    import importlib_metadata as md",
    "from pip._vendor.packaging.requirements import Requirement",
    "from pip._vendor.packaging.utils import canonicalize_name",
    "req = Requirement(sys.argv[1])",
    "target = canonicalize_name(req.name)",
    "version = None",
    "try:",
    "    version = md.version(req.name)",
    "except Exception:",
    "    for dist in md.distributions():",
    "        name = (dist.metadata.get('Name') or '').strip()",
    "        if name and canonicalize_name(name) == target:",
    "            version = dist.version",
    "            break",
    "satisfied = False",
    "if version is not None:",
    "    try:",
    "        satisfied = req.specifier.contains(version, prereleases=True) if req.specifier else True",
    "    except Exception:",
    "        satisfied = False",
    "print(json.dumps({'name': req.name, 'installed': version is not None, 'version': version, 'satisfied': satisfied}))",
  ].join("\n");

  const result = await runProcess(pythonExe, ["-c", probe, requirementSpec]);
  if (result.code !== 0) {
    return null;
  }
  const parsed = extractJsonFromOutput(result.stdout);
  if (!parsed || typeof parsed !== "object") {
    return null;
  }
  return {
    name: typeof parsed.name === "string" ? parsed.name : getRequirementDisplayName(requirementSpec),
    installed: Boolean(parsed.installed),
    version: typeof parsed.version === "string" ? parsed.version : "",
    satisfied: Boolean(parsed.satisfied),
  };
};

const resolveTorchIndexUrls = (hasNvidia) => {
  const override = (process.env.MEERA_TORCH_INDEX_URL || "").trim();
  if (override) {
    return [override];
  }
  const listOverride = (process.env.MEERA_TORCH_INDEX_URLS || "").trim();
  if (listOverride) {
    return listOverride.split(/[;,]+/).map((url) => url.trim()).filter(Boolean);
  }
  if (hasNvidia) {
    return [
      "https://download.pytorch.org/whl/cu121",
      "https://download.pytorch.org/whl/cu118",
      "https://download.pytorch.org/whl/cpu",
    ];
  }
  return ["https://download.pytorch.org/whl/cpu"];
};

const installTorch = async (venvPython, torchSpec, env, report, onLine) => {
  if (!torchSpec) {
    return;
  }
  report({ phase: "torch", percent: 0, message: "Detecting GPU for PyTorch..." });
  const hasNvidia = await detectNvidiaGpu();
  const urls = resolveTorchIndexUrls(hasNvidia);

  for (const url of urls) {
    const isCpu = /\/cpu\b/i.test(url);
    const targetLabel = isCpu ? "CPU" : hasNvidia ? "GPU" : "CPU";
    report({
      phase: "torch",
      percent: 15,
      message: `Installing PyTorch (${targetLabel})...`,
      currentFile: url,
    });
    const args = [
      "-m",
      "pip",
      "install",
      "--no-input",
      "--prefer-binary",
      "--index-url",
      url,
      "--extra-index-url",
      "https://pypi.org/simple",
      torchSpec,
    ];
    const result = await runProcessStreaming(
      venvPython,
      args,
      { env },
      (line) => (onLine ? onLine(line) : undefined),
    );
    if (result.code === 0) {
      report({ phase: "torch", percent: 100, message: `PyTorch installed (${targetLabel})` });
      return;
    }
  }

  throw new Error("PyTorch installation failed for both GPU and CPU variants.");
};

const resolveVenvPaths = (installDir) => {
  const venvDir = path.join(installDir, "venv");
  const pythonExe =
    process.platform === "win32"
      ? path.join(venvDir, "Scripts", "python.exe")
      : path.join(venvDir, "bin", "python3");
  return { venvDir, pythonExe };
};

const downloadFile = async (url, dest, onProgress, redirects = 0) =>
  new Promise((resolve, reject) => {
    if (redirects > 4) {
      reject(new Error("Too many redirects while downloading Python installer."));
      return;
    }

    const request = https.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, url).toString();
        res.resume();
        downloadFile(next, dest, onProgress, redirects + 1).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Download failed with status ${res.statusCode}.`));
        return;
      }

      const total = Number(res.headers["content-length"] || 0);
      let received = 0;
      const fileStream = fs.createWriteStream(dest);
      res.on("data", (chunk) => {
        received += chunk.length;
        if (onProgress) {
          const percent = total ? Math.round((received / total) * 100) : 0;
          onProgress({ received, total, percent });
        }
      });
      res.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close(() => resolve({ bytes: received }));
      });
      fileStream.on("error", (err) => {
        fileStream.close(() => reject(err));
      });
    });

    request.on("error", reject);
  });

const ensurePython = async (installDir, report) => {
  report({ phase: "python", percent: 0, message: `Checking Python ${APP_PYTHON.major}.${APP_PYTHON.minor}...` });
  const localPythonDir = path.join(installDir, "python");
  const localPythonExe =
    process.platform === "win32" ? path.join(localPythonDir, "python.exe") : path.join(localPythonDir, "bin", "python3");
  if (realFs.existsSync(localPythonExe)) {
    const localInfo = await getPythonInfo(localPythonExe);
    if (localInfo && matchesAppPython(localInfo.version)) {
      report({
        phase: "python",
        percent: 100,
        message: `Python ${localInfo.version.join(".")} ready`,
      });
      return localPythonExe;
    }
  }

  const detected = await detectPython();
  if (detected && matchesAppPython(detected.version)) {
    report({
      phase: "python",
      percent: 100,
      message: `Python ${detected.version.join(".")} already installed`,
    });
    return detected.executable;
  }

  if (!PYTHON_INSTALLER_URLS.length) {
    throw new Error("Python installer URL not configured.");
  }

  await ensureDir(localPythonDir);
  const tempDir = app.getPath("temp");
  const installerPath = path.join(tempDir, "meera-python-installer.exe");

  let lastError = null;
  for (const url of PYTHON_INSTALLER_URLS) {
    try {
      report({ phase: "python", percent: 5, message: "Downloading Python installer..." });
      await downloadFile(url, installerPath, (progress) => {
        report({
          phase: "python",
          percent: Math.max(5, Math.min(60, progress.percent || 0)),
          currentFile: progress.total
            ? `${Math.round(progress.received / 1024 / 1024)}MB / ${Math.round(progress.total / 1024 / 1024)}MB`
            : `${Math.round(progress.received / 1024 / 1024)}MB`,
          message: "Downloading Python installer...",
        });
      });
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    const message = lastError instanceof Error ? lastError.message : "Failed to download Python.";
    throw new Error(message);
  }

  report({ phase: "python", percent: 70, message: `Installing Python ${APP_PYTHON.major}.${APP_PYTHON.minor}...` });
  const installArgs = [
    "/quiet",
    "InstallAllUsers=0",
    "Include_test=0",
    "Include_launcher=0",
    "Include_pip=1",
    `TargetDir=${localPythonDir}`,
  ];
  const installResult = await runProcess(installerPath, installArgs, { windowsHide: true });
  if (installResult.code !== 0) {
    throw new Error(installResult.stderr || "Python installer failed.");
  }

  const installedInfo = await getPythonInfo(localPythonExe);
  if (!installedInfo) {
    throw new Error("Python installed but executable not found.");
  }
  if (!matchesAppPython(installedInfo.version)) {
    throw new Error(
      `Installed Python ${installedInfo.version.join(".")} does not match required ${APP_PYTHON.major}.${APP_PYTHON.minor}.`,
    );
  }

  try {
    await realFsp.unlink(installerPath);
  } catch {
    // ignore cleanup failures
  }

  report({
    phase: "python",
    percent: 100,
    message: `Python ${installedInfo.version.join(".")} installed`,
  });
  return localPythonExe;
};

const ensureVenv = async (pythonExe, installDir, report) => {
  const { venvDir, pythonExe: venvPython } = resolveVenvPaths(installDir);
  if (realFs.existsSync(venvPython)) {
    const existingInfo = await getPythonInfo(venvPython);
    if (existingInfo && matchesAppPython(existingInfo.version)) {
      return { venvDir, venvPython };
    }
    await realFsp.rm(venvDir, { recursive: true, force: true });
  }
  report({ phase: "venv", percent: 0, message: "Creating Python environment..." });
  const result = await runProcess(pythonExe, ["-m", "venv", venvDir]);
  if (result.code !== 0) {
    throw new Error(result.stderr || "Failed to create Python environment.");
  }
  report({ phase: "venv", percent: 100, message: "Python environment ready" });
  return { venvDir, venvPython };
};

const ensurePip = async (pythonExe) => {
  const check = await runProcess(pythonExe, ["-m", "pip", "--version"]);
  if (check.code === 0) {
    return true;
  }
  const bootstrap = await runProcess(pythonExe, ["-m", "ensurepip", "--upgrade"]);
  return bootstrap.code === 0;
};

const createRequirementProgressReporter = (report, total, phase, defaultMessage) => {
  return (index, stepPercent, message, currentFile = "") => {
    if (!total) {
      report({ phase, percent: 100, message: message || defaultMessage, currentFile });
      return;
    }
    const safeIndex = Math.max(0, Math.min(index, total - 1));
    const base = (safeIndex / total) * 100;
    const span = 100 / total;
    const percent = Math.round(Math.min(100, base + (span * Math.max(0, Math.min(stepPercent, 100))) / 100));
    report({
      phase,
      percent,
      message: message || defaultMessage,
      currentFile,
    });
  };
};

const installRequirement = async (venvPython, requirementSpec, env, report, progress, index, total) => {
  const displayName = getRequirementDisplayName(requirementSpec);
  progress(index, 0, `Checking ${displayName}...`, requirementSpec);

  const state = await probeRequirementState(venvPython, requirementSpec);
  if (state?.satisfied) {
    const versionNote = state.version ? ` (${state.version})` : "";
    progress(index, 100, `${displayName} already available${versionNote}`, requirementSpec);
    return;
  }

  const action = state?.installed ? "Updating" : "Installing";
  const throttle = (() => {
    let last = 0;
    return (line) => {
      const now = Date.now();
      if (now - last < 750) return;
      last = now;
      progress(index, 55, `${action} ${displayName}...`, line);
    };
  })();

  progress(index, 15, `${action} ${displayName}...`, requirementSpec);
  const installResult = await runProcessStreaming(
    venvPython,
    ["-m", "pip", "install", "--no-input", "--prefer-binary", requirementSpec],
    { env },
    (line) => throttle(line),
  );
  if (installResult.code !== 0) {
    const detail = installResult.stderr || installResult.stdout || `Failed to install ${displayName}.`;
    throw new Error(detail);
  }

  const finalState = await probeRequirementState(venvPython, requirementSpec);
  if (!finalState?.satisfied) {
    throw new Error(`${displayName} did not meet the required version after installation.`);
  }

  const versionNote = finalState.version ? ` (${finalState.version})` : "";
  progress(index, 100, `${displayName} ready${versionNote}`, requirementSpec);
};

const installDependencies = async (venvPython, requirementsPath, report) => {
  if (!requirementsPath || !realFs.existsSync(requirementsPath)) {
    throw new Error("requirements.txt not found for dependency install.");
  }

  report({ phase: "deps", percent: 0, message: "Checking Python dependencies..." });
  const requirementsRaw = await realFsp.readFile(requirementsPath, "utf8");
  const { torchSpec, dependencySpecs } = splitRequirements(requirementsRaw);
  const hasPip = await ensurePip(venvPython);
  if (!hasPip) {
    throw new Error("pip is not available in the Python environment.");
  }

  const env = {
    ...process.env,
    PIP_DISABLE_PIP_VERSION_CHECK: "1",
    PIP_NO_INPUT: "1",
    PIP_PROGRESS_BAR: "off",
  };

  const torchThrottle = (() => {
    let last = 0;
    return (line) => {
      const now = Date.now();
      if (now - last < 750) return;
      last = now;
      report({ phase: "torch", percent: 50, currentFile: line, message: "Installing PyTorch..." });
    };
  })();

  if (torchSpec) {
    const torchState = await probeRequirementState(venvPython, torchSpec);
    if (torchState?.satisfied) {
      const versionNote = torchState.version ? ` (${torchState.version})` : "";
      report({ phase: "torch", percent: 100, message: `PyTorch already available${versionNote}` });
    } else {
      await installTorch(venvPython, torchSpec, env, report, torchThrottle);
    }
  }

  const progress = createRequirementProgressReporter(
    report,
    dependencySpecs.length,
    "deps",
    "Checking Python dependencies...",
  );

  for (let index = 0; index < dependencySpecs.length; index += 1) {
    await installRequirement(venvPython, dependencySpecs[index], env, report, progress, index, dependencySpecs.length);
  }

  report({
    phase: "deps",
    percent: 100,
    message: dependencySpecs.length ? "Dependencies checked and installed" : "No additional dependencies required",
  });
};

const ensurePythonAndDependencies = async (installDir, report) => {
  const pythonExe = await ensurePython(installDir, report);
  const { venvPython } = await ensureVenv(pythonExe, installDir, report);
  const requirementsPath = resolveRequirementsPath();
  await installDependencies(venvPython, requirementsPath, report);
  await setUserEnvironmentVariable("MEERA_PYTHON", venvPython);
  process.env.MEERA_PYTHON = venvPython;
  return venvPython;
};

const mapInstallProgress = (data) => {
  const range = INSTALL_PROGRESS_RANGES[data.phase];
  if (!range || typeof data.percent !== "number") {
    return data;
  }
  const percent = range.base + Math.round((range.span * data.percent) / 100);
  return { ...data, percent: Math.min(99, Math.max(range.base, percent)) };
};

const getShortcutTarget = async (shortcutPath) => {
  if (!shortcutPath || !realFs.existsSync(shortcutPath)) {
    return "";
  }
  const escaped = shortcutPath.replace(/\\/g, "\\\\");
  const script = [
    `$s=(New-Object -ComObject WScript.Shell).CreateShortcut(\"${escaped}\");`,
    "$s.TargetPath",
  ].join(" ");
  const result = await runPowerShell(script);
  if (result.code !== 0) {
    return "";
  }
  return (result.stdout || "").trim();
};

const parseInstallDirFromTarget = (targetPath) => {
  if (!targetPath || typeof targetPath !== "string") {
    return "";
  }
  const normalized = targetPath.trim().replace(/\"/g, "");
  if (!normalized) {
    return "";
  }
  if (normalized.toLowerCase().endsWith("meeraai.exe")) {
    return path.dirname(normalized);
  }
  if (realFs.existsSync(path.join(normalized, "MeeraAI.exe"))) {
    return normalized;
  }
  return path.dirname(normalized);
};

const getShortcutInstallDirs = async () => {
  let desktopPath = null;
  try {
    desktopPath = app.getPath("desktop");
  } catch (_error) {
    desktopPath = null;
  }
  const startMenuPath = resolveStartMenuPath();
  const candidates = [];
  if (desktopPath) {
    candidates.push(path.join(desktopPath, "MeeraAI.lnk"));
  }
  if (startMenuPath) {
    candidates.push(path.join(startMenuPath, "MeeraAI.lnk"));
  }
  const dirs = [];
  for (const shortcut of candidates) {
    const target = await getShortcutTarget(shortcut);
    const dir = parseInstallDirFromTarget(target);
    if (dir) {
      dirs.push(dir);
    }
  }
  return dirs;
};

const getRegistryInstallDirs = async () => {
  const script = [
    "$paths = @(",
    "  'HKCU:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\*',",
    "  'HKLM:\\\\Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\*',",
    "  'HKLM:\\\\Software\\\\WOW6432Node\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Uninstall\\\\*'",
    ");",
    "$items = foreach ($p in $paths) {",
    "  Get-ItemProperty -Path $p -ErrorAction SilentlyContinue |",
    "    Where-Object { $_.DisplayName -like 'MeeraAI*' } |",
    "    ForEach-Object { $_.InstallLocation; $_.UninstallString }",
    "}",
    "$items | Where-Object { $_ } | ConvertTo-Json -Compress",
  ].join(" ");
  const result = await runPowerShell(script);
  if (result.code !== 0) {
    return [];
  }
  const raw = (result.stdout || "").trim();
  if (!raw) {
    return [];
  }
  let entries = [];
  try {
    const parsed = JSON.parse(raw);
    entries = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    entries = [raw];
  }
  const dirs = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "string") {
      continue;
    }
    const dir = parseInstallDirFromTarget(entry);
    if (dir) {
      dirs.push(dir);
    }
  }
  return dirs;
};

const launchApp = async (installDir) => {
  const exePath = path.join(installDir, "MeeraAI.exe");
  if (fs.existsSync(exePath)) {
    const { pythonExe: venvPython } = resolveVenvPaths(installDir);
    const env = { ...process.env };
    if (venvPython && realFs.existsSync(venvPython)) {
      env.MEERA_PYTHON = venvPython;
    }
    try {
      const child = spawn(exePath, [], {
        cwd: installDir,
        env,
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      child.unref();
    } catch {
      await shell.openPath(exePath);
    }
    return true;
  }
  return false;
};

const isValidInstallDir = (dir) => {
  if (!dir) return false;
  if (!realFs.existsSync(path.join(dir, "MeeraAI.exe"))) {
    return false;
  }
  return payloadHasAsar(dir);
};

const detectInstalledApp = async () => {
  const record = await readInstallRecord();
  if (record?.installDir && isValidInstallDir(record.installDir)) {
    return { installed: true, installDir: record.installDir };
  }
  const shortcutDirs = await getShortcutInstallDirs();
  for (const dir of shortcutDirs) {
    if (isValidInstallDir(dir)) {
      return { installed: true, installDir: dir };
    }
  }
  const registryDirs = await getRegistryInstallDirs();
  for (const dir of registryDirs) {
    if (isValidInstallDir(dir)) {
      return { installed: true, installDir: dir };
    }
  }
  const defaultDir = getDefaultInstallDir();
  if (isValidInstallDir(defaultDir)) {
    return { installed: true, installDir: defaultDir };
  }
  return { installed: false, installDir: "" };
};

const repairInstall = async (installDir, onProgress) => {
  const payloadDir = resolvePayloadDir();
  if (!realFs.existsSync(payloadDir) || !payloadHasAsar(payloadDir)) {
    throw new Error("Installer payload is missing required app files. Please re-download the installer.");
  }
  await ensureDir(installDir);
  onProgress({ phase: "repair", percent: 0, message: "Repairing files..." });
  await copyWithProgress(payloadDir, installDir, onProgress, "repair", "Repairing files...");
  await writeInstallRecord(installDir);
  await refreshWindowsShellIcons();
};

const backupInstall = async (installDir, backupRoot, onProgress) => {
  if (!backupRoot) {
    throw new Error("Backup folder is required.");
  }
  if (!isValidInstallDir(installDir)) {
    throw new Error("Install location is missing or invalid.");
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = path.join(backupRoot, `MeeraAI-backup-${stamp}`);
  await ensureDir(target);
  onProgress({ phase: "backup", percent: 0, message: "Backing up files..." });
  await copyWithProgress(installDir, target, onProgress, "backup", "Backing up files...");
  return target;
};

const uninstallInstall = async (installDir, onProgress) => {
  if (!installDir) {
    throw new Error("Install folder is required.");
  }
  onProgress({ phase: "uninstall", percent: 0, message: "Removing files..." });
  try {
    await removeShortcuts();
    await removeInstallDirFromPath(installDir);
  } catch {
    // ignore cleanup failures
  }
  try {
    await realFsp.rm(installDir, { recursive: true, force: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove install directory.";
    throw new Error(message);
  }
  await clearInstallRecord();
  onProgress({ phase: "uninstall", percent: 100, message: "Uninstall complete" });
};

ipcMain.handle("installer:getDefaultPath", async () => ({ path: getDefaultInstallDir() }));
ipcMain.handle("installer:detect", async () => detectInstalledApp());

ipcMain.handle("installer:selectPath", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }
  return { canceled: false, path: result.filePaths[0] };
});

ipcMain.handle("installer:start", async (_event, payload) => {
  const installDir = payload?.installDir || getDefaultInstallDir();
  const modelId = payload?.modelId || "meera-lite-1b";
  const desktopShortcut = payload?.desktopShortcut !== false;
  const addToPath = payload?.addToPath === true;

  try {
    const payloadDir = resolvePayloadDir();
    if (!realFs.existsSync(payloadDir) || !payloadHasAsar(payloadDir)) {
      throw new Error("Installer payload is missing required app files. Please re-download the installer.");
    }
    await ensureDir(installDir);

    const send = (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("installer:progress", data);
      }
    };
    const sendInstallProgress = (data) => send(mapInstallProgress(data));

    sendInstallProgress({ phase: "prepare", message: "Preparing files..." });
    await copyWithProgress(payloadDir, installDir, sendInstallProgress, "copy", "Copying files...");

    await ensurePythonAndDependencies(installDir, sendInstallProgress);

    await ensureDir(path.join(installDir, "models"));
    await ensureDir(path.join(installDir, "config"));
    await writeInstallerConfig(installDir, modelId);
    await createShortcuts(installDir, { desktop: desktopShortcut, startMenu: desktopShortcut });
    if (addToPath) {
      await addInstallDirToPath(installDir);
    }

    await writeInstallRecord(installDir);
    await refreshWindowsShellIcons();
    sendInstallProgress({ phase: "done", percent: 100 });
    return { ok: true, installDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Install failed.";
    return { ok: false, error: message };
  }
});

ipcMain.handle("installer:repair", async (_event, payload) => {
  const installDir = payload?.installDir || getDefaultInstallDir();
  try {
    await repairInstall(installDir, (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("installer:progress", data);
      }
    });
    return { ok: true, installDir };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repair failed.";
    return { ok: false, error: message };
  }
});

ipcMain.handle("installer:backup", async (_event, payload) => {
  const installDir = payload?.installDir || getDefaultInstallDir();
  const backupDir = payload?.backupDir || "";
  try {
    const target = await backupInstall(installDir, backupDir, (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("installer:progress", data);
      }
    });
    return { ok: true, backupDir: target };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backup failed.";
    return { ok: false, error: message };
  }
});

ipcMain.handle("installer:uninstall", async (_event, payload) => {
  const installDir = payload?.installDir || getDefaultInstallDir();
  try {
    await uninstallInstall(installDir, (data) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("installer:progress", data);
      }
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Uninstall failed.";
    return { ok: false, error: message };
  }
});

ipcMain.handle("installer:launch", async (_event, installDir) => {
  return launchApp(installDir || getDefaultInstallDir());
});

ipcMain.on("installer:window:minimize", () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on("installer:window:close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  app.quit();
});
