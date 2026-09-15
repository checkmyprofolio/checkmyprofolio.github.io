const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const releaseDir = path.join(projectRoot, "release");
const winUnpacked = path.join(releaseDir, "win-unpacked");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const removeDir = async (dir) => {
  if (!fs.existsSync(dir)) return true;

  const attempts = 6;
  for (let i = 0; i < attempts; i += 1) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return true;
    } catch (error) {
      const code = error && error.code;
      if (code === "EPERM" || code === "EBUSY" || code === "EACCES") {
        await sleep(400);
        continue;
      }
      throw error;
    }
  }

  console.error(`[clean] Unable to remove ${dir}. It may be in use.`);
  console.error("[clean] Close any running MeeraAI Installer or Electron processes and try again.");
  return false;
};

const run = async () => {
  if (!fs.existsSync(releaseDir)) return;
  const ok = await removeDir(winUnpacked);
  if (!ok) {
    process.exitCode = 1;
  }
};

run();
