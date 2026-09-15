const fs = require("fs");
const path = require("path");

const releaseDir = path.join(__dirname, "..", "release");
const targetName = "MeeraAI Installer.exe";

if (!fs.existsSync(releaseDir)) {
  process.exit(0);
}

const entries = fs.readdirSync(releaseDir, { withFileTypes: true });
const matches = entries.filter((entry) => entry.isFile() && /^MeeraAI Installer(?: [\d.]+)?\.exe$/i.test(entry.name));

for (const entry of matches) {
  const source = path.join(releaseDir, entry.name);
  const destination = path.join(releaseDir, targetName);
  if (source === destination) {
    continue;
  }
  if (fs.existsSync(destination)) {
    fs.rmSync(destination, { force: true });
  }
  fs.renameSync(source, destination);
}
