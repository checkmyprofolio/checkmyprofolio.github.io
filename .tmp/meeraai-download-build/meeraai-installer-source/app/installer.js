const steps = {
  welcome: document.getElementById("step-welcome"),
  manage: document.getElementById("step-manage"),
  setup: document.getElementById("step-setup"),
  progress: document.getElementById("step-progress"),
  finish: document.getElementById("step-finish"),
  error: document.getElementById("step-error"),
};

const installPathInput = document.getElementById("install-path");
const progressBar = document.getElementById("progress-bar");
const progressPercent = document.getElementById("progress-percent");
const progressFile = document.getElementById("progress-file");
const progressMessage = document.getElementById("progress-message");
const errorMessage = document.getElementById("error-message");
const finishTitle = document.getElementById("finish-title");
const finishLead = document.getElementById("finish-lead");
const finishLaunchRow = document.getElementById("finish-launch-row");
const finishActions = document.getElementById("finish-actions");
const finishLaunchBtn = document.getElementById("btn-finish-launch");
const desktopShortcutToggle = document.getElementById("opt-desktop");
const addToPathToggle = document.getElementById("opt-path");
const installedPathLabel = document.getElementById("installed-path");
const modelDownloadNote = document.getElementById("model-download-note");
const confirmBackdrop = document.getElementById("confirm-backdrop");
const confirmCard = document.getElementById("confirm-card");
const confirmSymbol = document.getElementById("confirm-symbol");
const confirmKicker = document.getElementById("confirm-kicker");
const confirmTitle = document.getElementById("confirm-title");
const confirmDescription = document.getElementById("confirm-description");
const confirmNote = document.getElementById("confirm-note");
const confirmCloseBtn = document.getElementById("confirm-close");
const confirmCancelBtn = document.getElementById("confirm-cancel");
const confirmAcceptBtn = document.getElementById("confirm-accept");

let installDir = "";
let selectedModel = "meera-lite-1b";
let lastInstallDir = "";
let detectedInstallDir = "";
let activeStep = "welcome";
let finishAllowsLaunch = true;
let activeOperation = null;
let confirmResolve = null;

const MODEL_LABELS = {
  "meera-lite-1b": "Meera Lite",
  "meera-core-3b": "Meera Core",
  "meera-pro-4b": "Meera Pro",
  "meera-max-6b": "Meera Max",
  "meera-ultra-8b": "Meera Ultra",
};

const getSelectedModelLabel = () => MODEL_LABELS[selectedModel] || "your selected model";
const OPERATION_LABELS = {
  install: "installation",
  repair: "repair",
  backup: "backup",
  uninstall: "uninstall",
};

const updateModelDownloadNote = () => {
  if (!modelDownloadNote) {
    return;
  }
  modelDownloadNote.textContent =
    `The installer saves ${getSelectedModelLabel()} as your default model. ` +
    "After Python and libraries finish installing, MeeraAI will automatically start downloading that model when you launch the app.";
};

const continueFromWelcome = () => {
  showStep(detectedInstallDir ? "manage" : "setup");
};

const showStep = (key) => {
  if (!steps[key] || key === activeStep) {
    return;
  }

  const next = steps[key];
  const current = steps[activeStep];

  next.classList.add("active");
  next.classList.remove("exiting");
  next.setAttribute("aria-hidden", "false");

  if (current) {
    current.classList.add("exiting");
    current.setAttribute("aria-hidden", "true");
    const onEnd = () => {
      current.classList.remove("active", "exiting");
      current.removeEventListener("transitionend", onEnd);
    };
    const duration = parseFloat(getComputedStyle(current).transitionDuration) || 0;
    if (duration === 0) {
      onEnd();
    } else {
      current.addEventListener("transitionend", onEnd);
      setTimeout(onEnd, duration * 1000 + 80);
    }
  }

  activeStep = key;
  document.body.dataset.step = key;
};

const setProgress = (percent, file, message) => {
  progressBar.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;
  if (file) progressFile.textContent = file;
  if (message) progressMessage.textContent = message;
};

const setFinish = ({ title, lead, allowLaunch }) => {
  finishAllowsLaunch = allowLaunch !== false;
  if (finishTitle) {
    finishTitle.textContent = title || "Done";
  }
  if (finishLead) {
    finishLead.textContent = lead || "";
  }
  if (finishLaunchRow) {
    finishLaunchRow.style.display = finishAllowsLaunch ? "" : "none";
  }
  if (finishLaunchBtn) {
    finishLaunchBtn.style.display = finishAllowsLaunch ? "" : "none";
  }
  if (finishActions) {
    finishActions.style.display = "flex";
  }
};

const resolveConfirmDialog = (confirmed) => {
  if (!confirmBackdrop || !confirmResolve) {
    return;
  }
  const resolve = confirmResolve;
  confirmResolve = null;
  confirmBackdrop.hidden = true;
  document.body.classList.remove("confirm-open");
  resolve(Boolean(confirmed));
};

const requestConfirmation = (dialog) =>
  new Promise((resolve) => {
    if (!confirmBackdrop || !confirmCard || !confirmKicker || !confirmTitle || !confirmDescription || !confirmCancelBtn || !confirmAcceptBtn) {
      resolve(window.confirm(dialog?.description || dialog?.title || "Continue?"));
      return;
    }

    if (confirmResolve) {
      resolveConfirmDialog(false);
    }

    confirmResolve = resolve;
    confirmCard.classList.remove("danger", "primary");
    confirmCard.classList.add(dialog?.tone === "danger" ? "danger" : "primary");
    confirmSymbol.textContent = dialog?.symbol || (dialog?.tone === "danger" ? "!" : "?");
    confirmKicker.textContent = dialog?.kicker || "Confirm action";
    confirmTitle.textContent = dialog?.title || "Continue?";
    confirmDescription.textContent = dialog?.description || "";
    confirmCancelBtn.textContent = dialog?.cancelLabel || "Cancel";
    confirmAcceptBtn.textContent = dialog?.confirmLabel || "Continue";
    confirmAcceptBtn.classList.remove("danger", "primary");
    confirmAcceptBtn.classList.add(dialog?.tone === "danger" ? "danger" : "primary");

    if (confirmNote) {
      if (dialog?.note) {
        confirmNote.hidden = false;
        confirmNote.textContent = dialog.note;
      } else {
        confirmNote.hidden = true;
        confirmNote.textContent = "";
      }
    }

    confirmBackdrop.hidden = false;
    document.body.classList.add("confirm-open");
    window.setTimeout(() => confirmCancelBtn.focus(), 0);
  });

const requestCloseConfirmation = async () => {
  if (activeStep !== "progress" || !activeOperation) {
    window.installer.close();
    return;
  }

  const label = OPERATION_LABELS[activeOperation] || "process";
  const confirmed = await requestConfirmation({
    tone: "danger",
    symbol: "!",
    kicker: `${label} in progress`,
    title: `Close installer during ${label}?`,
    description: `MeeraAI is still running the ${label}. Closing now may interrupt the process.`,
    note: "If you exit now, you may need to run the installer again to complete setup cleanly.",
    cancelLabel: `Keep ${label} running`,
    confirmLabel: "Close anyway",
  });

  if (confirmed) {
    window.installer.close();
  }
};

const init = async () => {
  if (window.installer?.getDefaultPath) {
    const result = await window.installer.getDefaultPath();
    installDir = result?.path || "C:\\MeeraAI";
  } else {
    installDir = "C:\\MeeraAI";
  }
  installPathInput.value = installDir;

  if (window.installer?.detectInstall) {
    const detected = await window.installer.detectInstall();
    if (detected?.installed) {
      detectedInstallDir = detected.installDir || installDir;
      if (installedPathLabel) {
        installedPathLabel.textContent = detectedInstallDir;
      }
    }
  }

  Object.entries(steps).forEach(([key, step]) => {
    if (!step) return;
    step.setAttribute("aria-hidden", key === activeStep ? "false" : "true");
  });
  document.body.dataset.step = activeStep;
};

window.installer?.onProgress((data) => {
  if (data.phase === "prepare") {
    setProgress(0, "", data.message || "Preparing files...");
  }
  if (data.phase === "copy") {
    setProgress(data.percent || 0, data.currentFile || "", "Copying files...");
  }
  if (data.phase === "python") {
    setProgress(data.percent || 0, data.currentFile || "", data.message || "Installing Python...");
  }
  if (data.phase === "venv") {
    setProgress(data.percent || 0, data.currentFile || "", data.message || "Preparing Python environment...");
  }
  if (data.phase === "torch") {
    setProgress(data.percent || 0, data.currentFile || "", data.message || "Installing PyTorch...");
  }
  if (data.phase === "deps") {
    setProgress(data.percent || 0, data.currentFile || "", data.message || "Installing Python dependencies...");
  }
  if (data.phase === "repair") {
    setProgress(data.percent || 0, data.currentFile || "", data.message || "Repairing files...");
  }
  if (data.phase === "backup") {
    setProgress(data.percent || 0, data.currentFile || "", data.message || "Backing up files...");
  }
  if (data.phase === "uninstall") {
    setProgress(data.percent || 0, data.currentFile || "", data.message || "Removing files...");
  }
  if (data.phase === "done") {
    setProgress(100, "", `${getSelectedModelLabel()} will download automatically after MeeraAI launches.`);
  }
});

const startInstall = async () => {
  activeOperation = "install";
  showStep("progress");
  setProgress(0, "", "Preparing files...");
  const desktopShortcut = desktopShortcutToggle ? desktopShortcutToggle.checked : true;
  const addToPath = addToPathToggle ? addToPathToggle.checked : false;
  try {
    const result = await window.installer.startInstall({
      installDir,
      modelId: selectedModel,
      desktopShortcut,
      addToPath,
    });
    activeOperation = null;
    if (!result?.ok) {
      errorMessage.textContent = result?.error || "Install failed.";
      showStep("error");
      return;
    }
    lastInstallDir = result.installDir || installDir;
    setFinish({
      title: "Setup complete",
      lead:
        `MeeraAI and its Python libraries are installed. ` +
        `${getSelectedModelLabel()} will start downloading automatically after you launch the app.`,
      allowLaunch: true,
    });
    showStep("finish");
  } catch (error) {
    activeOperation = null;
    errorMessage.textContent = error?.message || "Install failed.";
    showStep("error");
  }
};

const startRepair = async () => {
  const targetDir = detectedInstallDir || installDir;
  if (!targetDir) {
    errorMessage.textContent = "Install folder not found.";
    showStep("error");
    return;
  }
  activeOperation = "repair";
  showStep("progress");
  setProgress(0, "", "Repairing files...");
  try {
    const result = await window.installer.repairInstall({ installDir: targetDir });
    activeOperation = null;
    if (!result?.ok) {
      errorMessage.textContent = result?.error || "Repair failed.";
      showStep("error");
      return;
    }
    lastInstallDir = result.installDir || targetDir;
    setFinish({
      title: "Repair complete",
      lead: "Your MeeraAI installation has been repaired.",
      allowLaunch: true,
    });
    showStep("finish");
  } catch (error) {
    activeOperation = null;
    errorMessage.textContent = error?.message || "Repair failed.";
    showStep("error");
  }
};

const startBackup = async () => {
  const targetDir = detectedInstallDir || installDir;
  const destination = await window.installer.selectPath();
  if (destination?.canceled || !destination?.path) {
    return;
  }
  activeOperation = "backup";
  showStep("progress");
  setProgress(0, "", "Backing up files...");
  try {
    const result = await window.installer.backupInstall({
      installDir: targetDir,
      backupDir: destination.path,
    });
    activeOperation = null;
    if (!result?.ok) {
      errorMessage.textContent = result?.error || "Backup failed.";
      showStep("error");
      return;
    }
    setFinish({
      title: "Backup complete",
      lead: `Backup created at ${result.backupDir || destination.path}.`,
      allowLaunch: true,
    });
    showStep("finish");
  } catch (error) {
    activeOperation = null;
    errorMessage.textContent = error?.message || "Backup failed.";
    showStep("error");
  }
};

const startUninstall = async () => {
  const targetDir = detectedInstallDir || installDir;
  const confirmed = await requestConfirmation({
    tone: "danger",
    symbol: "!",
    kicker: "Uninstall MeeraAI",
    title: "Remove MeeraAI from this device?",
    description: "This will remove the installed app, shortcuts, and local MeeraAI files from this device.",
    note: "Use Backup first if you want to keep a copy of the current installation before removal.",
    cancelLabel: "Keep MeeraAI",
    confirmLabel: "Uninstall",
  });
  if (!confirmed) {
    return;
  }
  activeOperation = "uninstall";
  showStep("progress");
  setProgress(0, "", "Removing files...");
  try {
    const result = await window.installer.uninstallInstall({ installDir: targetDir });
    activeOperation = null;
    if (!result?.ok) {
      errorMessage.textContent = result?.error || "Uninstall failed.";
      showStep("error");
      return;
    }
    setFinish({
      title: "Uninstall complete",
      lead: "MeeraAI has been removed from this device.",
      allowLaunch: false,
    });
    showStep("finish");
  } catch (error) {
    activeOperation = null;
    errorMessage.textContent = error?.message || "Uninstall failed.";
    showStep("error");
  }
};

// Buttons

const startBtn = document.getElementById("btn-start");
if (startBtn) {
  startBtn.addEventListener("click", () => showStep("setup"));
}

const manageRepairBtn = document.getElementById("btn-manage-repair");
if (manageRepairBtn) {
  manageRepairBtn.addEventListener("click", startRepair);
}

const manageBackupBtn = document.getElementById("btn-manage-backup");
if (manageBackupBtn) {
  manageBackupBtn.addEventListener("click", startBackup);
}

const manageUninstallBtn = document.getElementById("btn-manage-uninstall");
if (manageUninstallBtn) {
  manageUninstallBtn.addEventListener("click", startUninstall);
}

const manageInstallBtn = document.getElementById("btn-manage-install");
if (manageInstallBtn) {
  manageInstallBtn.addEventListener("click", () => showStep("setup"));
}

const exitBtn = document.getElementById("btn-exit");
if (exitBtn) {
  exitBtn.addEventListener("click", () => requestCloseConfirmation());
}

const welcomeCta = document.getElementById("welcome-continue");
const welcomeWordmark = document.querySelector(".welcome-wordmark-svg text");

if (welcomeCta) {
  welcomeCta.addEventListener("click", continueFromWelcome);
}

if (welcomeWordmark && welcomeCta) {
  welcomeWordmark.addEventListener("animationend", (event) => {
    if (event.animationName === "loadingFill") {
      welcomeCta.classList.add("is-visible");
    }
  });
}

document.getElementById("btn-back").addEventListener("click", () => showStep("welcome"));
document.getElementById("btn-browse").addEventListener("click", async () => {
  const result = await window.installer.selectPath();
  if (!result?.canceled && result?.path) {
    installDir = result.path;
    installPathInput.value = installDir;
  }
});

document.getElementById("btn-install").addEventListener("click", startInstall);

document.getElementById("btn-error-back").addEventListener("click", () => showStep("setup"));
document.getElementById("btn-error-exit").addEventListener("click", () => window.installer.close());

document.getElementById("btn-finish-close").addEventListener("click", () => {
  const shouldLaunch = finishAllowsLaunch && document.getElementById("launch-after").checked;
  if (shouldLaunch) {
    window.installer.launchApp(lastInstallDir || installDir);
  }
  window.installer.close();
});

document.getElementById("btn-finish-launch").addEventListener("click", () => {
  if (finishAllowsLaunch) {
    window.installer.launchApp(lastInstallDir || installDir);
    window.installer.close();
  }
});

// Window controls

for (const btn of document.querySelectorAll(".window-controls button")) {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    if (action === "minimize") {
      window.installer.minimize();
    } else if (action === "close") {
      void requestCloseConfirmation();
    }
  });
}

if (confirmBackdrop) {
  confirmBackdrop.addEventListener("mousedown", (event) => {
    if (event.target === confirmBackdrop) {
      resolveConfirmDialog(false);
    }
  });
}

if (confirmCloseBtn) {
  confirmCloseBtn.addEventListener("click", () => resolveConfirmDialog(false));
}

if (confirmCancelBtn) {
  confirmCancelBtn.addEventListener("click", () => resolveConfirmDialog(false));
}

if (confirmAcceptBtn) {
  confirmAcceptBtn.addEventListener("click", () => resolveConfirmDialog(true));
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && confirmResolve) {
    resolveConfirmDialog(false);
  }
});

// Model selection

document.querySelectorAll("input[name=\"model\"]").forEach((input) => {
  input.addEventListener("change", () => {
    selectedModel = input.value;
    updateModelDownloadNote();
  });
});

init();
updateModelDownloadNote();
