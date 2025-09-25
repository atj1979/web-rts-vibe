const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

let commit = "unknown";
try {
  commit = execSync("git rev-parse --short HEAD").toString().trim();
} catch (e) {
  // if git not available, leave as unknown
}

const content = `// This file is auto-generated at build time
export const COMMIT = '${commit}';
`;

const outPath = path.resolve(__dirname, "..", "src", "commit.ts");
fs.writeFileSync(outPath, content, "utf8");
console.log("Wrote commit to", outPath, commit);
