#!/usr/bin/env node

// eliniscan update checker — runs on session start via hook
// Compares installed version with npm latest, shows warning if outdated

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { homedir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cacheFile = join(homedir(), ".claude", "eliniscan", "cache", "update-check.json");

try {
  // Check at most once per 6 hours
  try {
    const cache = JSON.parse(readFileSync(cacheFile, "utf8"));
    if (Date.now() - cache.checkedAt < 6 * 60 * 60 * 1000) {
      if (cache.updateAvailable) {
        console.log(`\n⚡ eliniscan update available: ${cache.installed} → ${cache.latest}`);
        console.log(`   Run /eliniscan:update to install\n`);
      }
      process.exit(0);
    }
  } catch {}

  // Get installed version
  const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8"));
  const installed = pkg.version;

  // Get latest from npm
  const latest = execSync("npm view eliniscan version 2>/dev/null", { encoding: "utf8" }).trim();

  const updateAvailable = latest && latest !== installed;

  // Cache result
  const { mkdirSync, writeFileSync } = await import("fs");
  mkdirSync(join(homedir(), ".claude", "eliniscan", "cache"), { recursive: true });
  writeFileSync(cacheFile, JSON.stringify({ installed, latest, updateAvailable, checkedAt: Date.now() }));

  if (updateAvailable) {
    console.log(`\n⚡ eliniscan update available: ${installed} → ${latest}`);
    console.log(`   Run /eliniscan:update to install\n`);
  }
} catch {
  // Silent fail — don't block session start
}
