import fs from "node:fs";
import path from "node:path";

const clientDir = path.resolve("dist/client");
const shellFile = path.join(clientDir, "_shell.html");
const indexFile = path.join(clientDir, "index.html");

if (fs.existsSync(shellFile)) {
  let html = fs.readFileSync(shellFile, "utf-8");

  // Replace pre-rendered static DOM body (which contains public SiteFooter & SiteHeader)
  // with a clean SPA root container to completely eliminate footer flash on page refresh.
  html = html.replace(
    /<body>[\s\S]*?<script class="\$tsr"/i,
    `<body><div id="root" style="min-height: 100vh; background-color: #FAF9F5;"></div><script class="$tsr"`
  );

  fs.writeFileSync(indexFile, html, "utf-8");
  fs.writeFileSync(shellFile, html, "utf-8");
  console.log("Successfully generated clean SPA index.html & _shell.html without static footer flash!");
} else {
  console.error("Error: _shell.html not found in dist/client");
}
