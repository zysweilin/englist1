// Transpile in-memory so tests use the actual TypeScript sources without build artifacts.
const ts = require("typescript");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
require.extensions[".ts"] = (module, filename) => module._compile(ts.transpileModule(
  fs.readFileSync(filename, "utf8"),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } },
).outputText, filename);
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  // Tests transpile application imports to CommonJS; the official SDK publishes
  // an import-only export. Node 24 can load its ESM implementation directly.
  if (request === "@siwc/local") return path.resolve(__dirname, "../vendor/siwc-local/dist/index.js");
  if (request.startsWith("@/")) request = path.resolve(__dirname, "../src", request.slice(2));
  // The sentinel is a bundler boundary, not application behavior.
  if (request === "server-only") return __filename;
  return resolve.call(this, request, ...args);
};
