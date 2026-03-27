#!/usr/bin/env node

// eliniscan CLI — minimal entry point
// Actual work is done by Claude Code skills, this just helps with install/info

const args = process.argv.slice(2);
const cmd = args[0];

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  console.log(`
  eliniscan — AI Full Codebase Scanner

  This is a Claude Code plugin. Use it inside Claude Code:

    /eliniscan:scan     Full codebase scan
    /eliniscan:fix      Auto-fix all issues
    /eliniscan:report   View summary report
    /eliniscan:update   Check for updates
    /eliniscan:help     Command reference

  Install:  npm install -g eliniscan
  GitHub:   https://github.com/alpyenigun/eliniscan
  `);
} else if (cmd === "version" || cmd === "--version" || cmd === "-v") {
  const pkg = await import("../package.json", { with: { type: "json" } });
  console.log(pkg.default.version);
} else {
  console.log(`Unknown command: ${cmd}`);
  console.log("Use /eliniscan:help inside Claude Code for available commands.");
}
