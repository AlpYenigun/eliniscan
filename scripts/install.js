#!/usr/bin/env node

// eliniscan installer — copies all components to ~/.claude/
import { mkdirSync, cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const claudeDir = join(homedir(), ".claude");
const eliniscanDir = join(claudeDir, "eliniscan");

// ─── Copy all components ───────────────────────────────────────────

const copyMap = [
  { src: "commands", dest: join(claudeDir, "commands", "eliniscan") },
  { src: "workflows", dest: join(eliniscanDir, "workflows") },
  { src: "agents", dest: join(claudeDir, "agents"), prefix: "eliniscan-" },
  { src: "references", dest: join(eliniscanDir, "references") },
  { src: "bin", dest: join(eliniscanDir, "bin") },
  { src: "scripts", dest: join(eliniscanDir, "scripts"), skip: ["install.js", "cli.js"] },
];

let copied = 0;
for (const { src, dest, prefix, skip } of copyMap) {
  const srcPath = join(root, src);
  if (!existsSync(srcPath)) continue;

  mkdirSync(dest, { recursive: true });

  const files = readdirSync(srcPath);
  for (const file of files) {
    if (skip && skip.includes(file)) continue;
    const srcFile = join(srcPath, file);
    const destFile = join(dest, prefix ? `${prefix}${file}` : file);
    cpSync(srcFile, destFile, { force: true });
    copied++;
  }
}

// ─── Copy package.json for version tracking ────────────────────────

cpSync(join(root, "package.json"), join(eliniscanDir, "package.json"), { force: true });

// ─── Setup session start hook ──────────────────────────────────────

const settingsPath = join(claudeDir, "settings.json");
try {
  let settings = {};
  try {
    settings = JSON.parse(readFileSync(settingsPath, "utf8"));
  } catch {}

  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];

  const hookCmd = `node ${join(eliniscanDir, "scripts", "check-update.js")}`;
  const hasHook = settings.hooks.SessionStart.some(
    (h) => typeof h === "string" ? h.includes("eliniscan") : h.command?.includes("eliniscan")
  );

  if (!hasHook) {
    settings.hooks.SessionStart.push({
      command: hookCmd,
      description: "eliniscan update check"
    });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }
} catch {}

// ─── Done ──────────────────────────────────────────────────────────

console.log(`✓ eliniscan installed (${copied} files)`);
console.log("  Commands: /eliniscan:scan, /eliniscan:fix, /eliniscan:report");
console.log("  More:     /eliniscan:status, /eliniscan:resume, /eliniscan:clean, /eliniscan:settings");
console.log("  Help:     /eliniscan:help");
