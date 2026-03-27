#!/usr/bin/env node

// eliniscan postinstall — copies commands and workflows to ~/.claude/
import { mkdirSync, cpSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const claudeDir = join(homedir(), ".claude");

const dirs = [
  { src: "commands", dest: join(claudeDir, "commands", "eliniscan") },
  { src: "workflows", dest: join(claudeDir, "eliniscan", "workflows") },
  { src: "agents", dest: join(claudeDir, "agents") },
  { src: "scripts", dest: join(claudeDir, "eliniscan", "scripts") },
];

for (const { src, dest } of dirs) {
  const srcPath = join(root, src);
  if (!existsSync(srcPath)) continue;

  mkdirSync(dest, { recursive: true });

  const files = readdirSync(srcPath);
  for (const file of files) {
    if (file === "install.js" || file === "cli.js") continue;
    const srcFile = join(srcPath, file);
    const destFile = join(dest, file);

    // For agents, prefix with eliniscan- to avoid conflicts
    if (src === "agents") {
      const agentDest = join(dest, `eliniscan-${file}`);
      cpSync(srcFile, agentDest, { force: true });
    } else {
      cpSync(srcFile, destFile, { force: true });
    }
  }
}

// Add session start hook for update check
import { readFileSync, writeFileSync } from "fs";

const settingsPath = join(claudeDir, "settings.json");
try {
  let settings = {};
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {}

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];

  const hookCmd = `node ${join(claudeDir, "eliniscan", "scripts", "check-update.js")}`;
  const hasHook = settings.hooks.SessionStart.some(
    (h) => typeof h === "string" ? h.includes("eliniscan") : h.command?.includes("eliniscan")
  );

  if (!hasHook) {
    settings.hooks.SessionStart.push({
      command: hookCmd,
      description: "eliniscan update check"
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log("✓ Update check hook added to settings.json");
  }
} catch (e) {
  // Don't fail install if hook setup fails
  console.log("⚠ Could not add update hook (non-critical)");
}

console.log("✓ eliniscan installed — commands available as /eliniscan:scan, /eliniscan:fix, etc.");
