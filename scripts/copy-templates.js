const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../src/templates/email.html");
const destDir = path.join(__dirname, "../dist/src/templates");
const dest = path.join(destDir, "email.html");

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log("Copied email.html to dist/src/templates");
