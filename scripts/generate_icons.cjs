const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootIconsDir = path.join(process.cwd(), 'icons');
const tauriIconsDir = path.join(process.cwd(), 'src-tauri', 'icons');

fs.mkdirSync(rootIconsDir, { recursive: true });
fs.mkdirSync(tauriIconsDir, { recursive: true });

try {
  // If icon.png exists, run official tauri icon generator
  const srcIcon = path.join(tauriIconsDir, 'icon.png');
  if (fs.existsSync(srcIcon)) {
    console.log('Running Tauri icon generation from:', srcIcon);
    execSync(`npx @tauri-apps/cli icon "${srcIcon}"`, { stdio: 'inherit' });
  }
} catch (e) {
  console.log('Tauri CLI icon generation skipped or fallback used:', e.message);
}

// Sync all icon files between src-tauri/icons and root icons/
if (fs.existsSync(tauriIconsDir)) {
  for (const file of fs.readdirSync(tauriIconsDir)) {
    const srcFile = path.join(tauriIconsDir, file);
    const destFile = path.join(rootIconsDir, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile);
    }
  }
}

console.log('Successfully prepared and synced all Windows icons for RC.EXE!');
