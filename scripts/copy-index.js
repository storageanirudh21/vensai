import fs from "node:fs";
import path from "node:path";

const clientDir = path.resolve("dist/client");
const shellFile = path.join(clientDir, "_shell.html");
const indexFile = path.join(clientDir, "index.html");

if (fs.existsSync(shellFile)) {
  fs.copyFileSync(shellFile, indexFile);
  console.log("Successfully synchronized index.html from _shell.html for static hosting!");
} else {
  console.error("Error: _shell.html not found in dist/client");
}
