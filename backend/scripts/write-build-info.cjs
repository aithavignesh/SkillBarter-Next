const { execFileSync } = require("node:child_process");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");

function gitValue(args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null;
  } catch {
    return null;
  }
}

const commit = gitValue(["rev-parse", "HEAD"]) || process.env.RENDER_GIT_COMMIT || null;
const branch = gitValue(["branch", "--show-current"]) || process.env.RENDER_GIT_BRANCH || null;
const outputDirectory = path.join(__dirname, "..", "dist");

mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  path.join(outputDirectory, "build-info.json"),
  JSON.stringify({ commit, branch }, null, 2) + "\n",
  "utf8",
);

console.log("[build-info] commit=" + (commit || "unknown") + " branch=" + (branch || "unknown"));
