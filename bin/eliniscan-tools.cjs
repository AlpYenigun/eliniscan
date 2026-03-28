#!/usr/bin/env node

/**
 * eliniscan-tools — CLI utility for eliniscan operations
 *
 * Centralizes: state management, config, progress tracking, file discovery,
 * findings parsing, model resolution, and report generation.
 *
 * Usage: node eliniscan-tools.cjs <command> [args]
 *
 * Commands:
 *   init <project-dir>                  Initialize state and config
 *   state get                           Get current state JSON
 *   state set <field> <value>           Update state field
 *   state reset                         Reset state to initial
 *   config get [field]                  Get config or specific field
 *   config set <field> <value>          Set config field
 *   discover <project-dir>              Discover source files
 *   progress                            Get scan/fix progress
 *   findings count                      Count findings by severity
 *   findings extract <file>             Extract findings for a file
 *   findings files [--severity S]       List files with findings
 *   report summary                      Generate summary report JSON
 *   version                             Show installed version
 *   check-update                        Check for newer version
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ─── Paths ─────────────────────────────────────────────────────────

const HOME = require("os").homedir();
const ELINISCAN_DIR = path.join(HOME, ".claude", "eliniscan");
const STATE_FILE = path.join(ELINISCAN_DIR, "state.json");
const CONFIG_FILE = path.join(ELINISCAN_DIR, "config.json");
const PKG_FILE = path.join(ELINISCAN_DIR, "package.json");

// ─── Default State ─────────────────────────────────────────────────

const DEFAULT_STATE = {
  status: "idle", // idle | scanning | fixing | verifying | complete
  phase: null, // scan | fix | verify | build
  projectDir: null,
  totalFiles: 0,
  scannedFiles: 0,
  fixedFiles: 0,
  skippedFiles: 0,
  totalFindings: 0,
  fixedFindings: 0,
  scanStartedAt: null,
  scanCompletedAt: null,
  fixStartedAt: null,
  fixCompletedAt: null,
  model: "sonnet",
  depth: "full",
  severity: "all",
  fileTypes: ["ts", "tsx", "js", "jsx", "css"],
  excludeDirs: ["node_modules", ".next", "dist", "build", ".git"],
  lastError: null,
};

const DEFAULT_CONFIG = {
  defaultModel: "sonnet",
  defaultDepth: "full",
  defaultSeverity: "all",
  defaultFileTypes: ["ts", "tsx", "js", "jsx", "css"],
  defaultExcludeDirs: ["node_modules", ".next", "dist", "build", ".git"],
  scanSleepMs: 2000,
  fixSleepMs: 2000,
  maxRetries: 2,
  validateFixOutput: true,
  autoVerify: true,
  autoBuild: true,
  runtime: "claude", // claude | gemini | codex | opencode
};

// ─── Helpers ───────────────────────────────────────────────────────

function ensureDir() {
  fs.mkdirSync(ELINISCAN_DIR, { recursive: true });
}

function readJSON(filepath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(filepath, data) {
  ensureDir();
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function getState() {
  return { ...DEFAULT_STATE, ...readJSON(STATE_FILE, {}) };
}

function setState(updates) {
  const state = getState();
  Object.assign(state, updates);
  writeJSON(STATE_FILE, state);
  return state;
}

function getConfig() {
  return { ...DEFAULT_CONFIG, ...readJSON(CONFIG_FILE, {}) };
}

function setConfig(field, value) {
  const config = getConfig();
  // Handle nested fields
  if (field.includes(".")) {
    const parts = field.split(".");
    let obj = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
  } else {
    config[field] = value;
  }
  writeJSON(CONFIG_FILE, config);
  return config;
}

// ─── File Discovery ────────────────────────────────────────────────

function discoverFiles(projectDir, fileTypes, excludeDirs) {
  const exts = (fileTypes || DEFAULT_CONFIG.defaultFileTypes).map((e) => e.replace(/^\./, ""));
  const excludes = (excludeDirs || DEFAULT_CONFIG.defaultExcludeDirs);

  const nameArgs = exts.map((e) => `-name "*.${e}"`).join(" -o ");
  const excludeArgs = excludes.map((d) => `! -path "*/${d}/*"`).join(" ");

  const cmd = `find "${projectDir}" -type f \\( ${nameArgs} \\) ${excludeArgs} | sort`;

  try {
    const result = execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
    return result.trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

// ─── Findings Parser ───────────────────────────────────────────────

function parseFindingsFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, "utf8");
    const blocks = content.split(/^### /m).slice(1);

    const findings = [];
    for (const block of blocks) {
      const lines = block.trim().split("\n");
      const file = lines[0].trim();
      const body = lines.slice(1).join("\n").trim();

      if (!body || body === "CLEAN") continue;

      // Count severities in this block
      const severities = {
        CRITICAL: (body.match(/\[CRITICAL\]/g) || []).length,
        HIGH: (body.match(/\[HIGH\]/g) || []).length,
        MEDIUM: (body.match(/\[MEDIUM\]/g) || []).length,
        LOW: (body.match(/\[LOW\]/g) || []).length,
        INFO: (body.match(/\[INFO\]/g) || []).length,
      };
      const total = Object.values(severities).reduce((a, b) => a + b, 0);

      findings.push({ file, body, severities, total });
    }

    return findings;
  } catch {
    return [];
  }
}

function extractForFile(findingsPath, targetFile) {
  const findings = parseFindingsFile(findingsPath);
  const match = findings.find((f) => f.file === targetFile);
  return match ? match.body : "";
}

function countFindings(findingsPath) {
  const findings = parseFindingsFile(findingsPath);
  const totals = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFO: 0, files: findings.length };

  for (const f of findings) {
    for (const [sev, count] of Object.entries(f.severities)) {
      totals[sev] += count;
    }
  }
  totals.total = totals.CRITICAL + totals.HIGH + totals.MEDIUM + totals.LOW + totals.INFO;
  return totals;
}

function filesWithFindings(findingsPath, severityFilter) {
  const findings = parseFindingsFile(findingsPath);

  if (!severityFilter || severityFilter === "all") {
    return findings.map((f) => f.file);
  }

  const sevMap = {
    critical: ["CRITICAL"],
    high: ["CRITICAL", "HIGH"],
    medium: ["CRITICAL", "HIGH", "MEDIUM"],
  };
  const allowedSevs = sevMap[severityFilter] || Object.keys(findings[0]?.severities || {});

  return findings
    .filter((f) => allowedSevs.some((s) => f.severities[s] > 0))
    .map((f) => f.file);
}

// ─── Progress ──────────────────────────────────────────────────────

function getProgress() {
  const state = getState();
  const scanProgress = fs.existsSync("/tmp/eliniscan_progress.txt")
    ? fs.readFileSync("/tmp/eliniscan_progress.txt", "utf8").trim()
    : null;
  const fixProgress = fs.existsSync("/tmp/eliniscan_fix_progress.txt")
    ? fs.readFileSync("/tmp/eliniscan_fix_progress.txt", "utf8").trim()
    : null;

  return {
    ...state,
    scanProgress,
    fixProgress,
    isDone: scanProgress === "DONE" || fixProgress === "DONE",
  };
}

// ─── Report ────────────────────────────────────────────────────────

function generateReport(projectDir) {
  const findingsPath = path.join(projectDir, "ELINISCAN-FINDINGS.md");
  const counts = countFindings(findingsPath);
  const findings = parseFindingsFile(findingsPath);
  const state = getState();

  // Top offenders
  const topOffenders = findings
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((f) => ({ file: f.file, issues: f.total }));

  return {
    projectDir,
    state,
    counts,
    topOffenders,
    totalFiles: state.totalFiles,
    cleanFiles: state.totalFiles - findings.length,
  };
}

// ─── Version ───────────────────────────────────────────────────────

function getVersion() {
  try {
    const pkg = readJSON(PKG_FILE, { version: "unknown" });
    return pkg.version;
  } catch {
    return "unknown";
  }
}

function checkUpdate() {
  try {
    const local = getVersion();
    const remote = execSync(
      'curl -s https://raw.githubusercontent.com/AlpYenigun/eliniscan/main/package.json',
      { encoding: "utf8", timeout: 5000 }
    );
    const remotePkg = JSON.parse(remote);
    return {
      installed: local,
      latest: remotePkg.version,
      updateAvailable: local !== remotePkg.version,
    };
  } catch {
    return { installed: getVersion(), latest: "unknown", updateAvailable: false };
  }
}

// ─── CLI Router ────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

function output(data) {
  if (typeof data === "string") {
    console.log(data);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

switch (cmd) {
  case "init": {
    const projectDir = args[0] || process.cwd();
    const config = getConfig();
    const files = discoverFiles(projectDir, config.defaultFileTypes, config.defaultExcludeDirs);
    const state = setState({
      status: "idle",
      projectDir,
      totalFiles: files.length,
      scannedFiles: 0,
      fixedFiles: 0,
      totalFindings: 0,
    });
    output({ state, fileCount: files.length, config });
    break;
  }

  case "state": {
    const sub = args[0];
    if (sub === "get") {
      output(getState());
    } else if (sub === "set") {
      let value = args[2];
      // Parse numbers and booleans
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (!isNaN(value) && value !== "") value = Number(value);
      output(setState({ [args[1]]: value }));
    } else if (sub === "reset") {
      writeJSON(STATE_FILE, DEFAULT_STATE);
      output(DEFAULT_STATE);
    } else {
      output(getState());
    }
    break;
  }

  case "config": {
    const sub = args[0];
    if (sub === "get") {
      const config = getConfig();
      if (args[1]) {
        output(config[args[1]]);
      } else {
        output(config);
      }
    } else if (sub === "set") {
      output(setConfig(args[1], args[2]));
    } else {
      output(getConfig());
    }
    break;
  }

  case "discover": {
    const projectDir = args[0] || process.cwd();
    const config = getConfig();
    const files = discoverFiles(projectDir, config.defaultFileTypes, config.defaultExcludeDirs);
    output({ files, count: files.length });
    break;
  }

  case "progress": {
    output(getProgress());
    break;
  }

  case "findings": {
    const sub = args[0];
    const findingsPath = args[1] || path.join(process.cwd(), "ELINISCAN-FINDINGS.md");

    if (sub === "count") {
      output(countFindings(findingsPath));
    } else if (sub === "extract") {
      const file = args[1];
      const fPath = args[2] || path.join(process.cwd(), "ELINISCAN-FINDINGS.md");
      output(extractForFile(fPath, file));
    } else if (sub === "files") {
      const severity = args.find((a) => a.startsWith("--severity"))
        ? args[args.indexOf("--severity") + 1]
        : "all";
      output(filesWithFindings(findingsPath, severity));
    } else {
      output(countFindings(findingsPath));
    }
    break;
  }

  case "report": {
    const projectDir = args[1] || process.cwd();
    output(generateReport(projectDir));
    break;
  }

  case "version": {
    output(getVersion());
    break;
  }

  case "check-update": {
    output(checkUpdate());
    break;
  }

  default: {
    console.error(`Unknown command: ${cmd}`);
    console.error("Usage: node eliniscan-tools.cjs <command> [args]");
    console.error("Commands: init, state, config, discover, progress, findings, report, version, check-update");
    process.exit(1);
  }
}
