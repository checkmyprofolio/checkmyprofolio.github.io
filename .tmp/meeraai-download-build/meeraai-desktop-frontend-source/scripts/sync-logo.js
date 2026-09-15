const fs = require("fs");
const path = require("path");
const sourceLogo = path.resolve(__dirname, "..", "..", "logo.png");
const publicLogo = path.resolve(__dirname, "..", "public", "logo.png");
const buildLogo = path.resolve(__dirname, "..", "build", "logo.png");

try {
  if (!fs.existsSync(sourceLogo)) {
    console.warn(`[sync-logo] Source not found: ${sourceLogo}`);
    process.exit(0);
  }

  fs.mkdirSync(path.dirname(publicLogo), { recursive: true });
  fs.copyFileSync(sourceLogo, publicLogo);
  console.log(`[sync-logo] Updated ${publicLogo}`);
  fs.mkdirSync(path.dirname(buildLogo), { recursive: true });
  fs.copyFileSync(sourceLogo, buildLogo);
  console.log(`[sync-logo] Updated ${buildLogo}`);
} catch (err) {
  console.error("[sync-logo] Failed to sync logo:", err);
  process.exit(1);
}
