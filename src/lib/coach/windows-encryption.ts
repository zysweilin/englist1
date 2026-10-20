import "server-only";
import { spawn } from "node:child_process";
import { join } from "node:path";
import type { CredentialEncryption } from "@siwc/local";

// Credentials travel over private pipes, never in command arguments or logs.
function dpapi(value: Uint8Array, decrypt: boolean): Promise<Buffer> {
  if (process.platform !== "win32") return Promise.reject(new Error("Windows credential protection is required."));
  const method = decrypt ? "Unprotect" : "Protect";
  const script = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $result=[Security.Cryptography.ProtectedData]::${method}($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($result))`;
  return new Promise((resolve, reject) => {
    const child = spawn(join(process.env.SystemRoot || "C:\\Windows", "System32/WindowsPowerShell/v1.0/powershell.exe"),
      ["-NoProfile", "-NonInteractive", "-Command", script], { windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    let size = 0;
    const timer = setTimeout(() => { child.kill(); reject(new Error("Credential protection timed out.")); }, 15_000);
    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 2_000_000) { child.kill(); return; }
      chunks.push(chunk);
    });
    child.stderr.resume();
    child.on("error", () => { clearTimeout(timer); reject(new Error("Credential protection unavailable.")); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 || size > 2_000_000) return reject(new Error("Credential protection failed."));
      resolve(Buffer.from(Buffer.concat(chunks).toString("utf8").trim(), "base64"));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(Buffer.from(value).toString("base64"));
  });
}

export const windowsEncryption: CredentialEncryption = {
  id: "englist-windows-dpapi-current-user-v1",
  isAvailable: () => process.platform === "win32",
  encrypt: (text) => dpapi(Buffer.from(text, "utf8"), false),
  decrypt: async (bytes) => (await dpapi(bytes, true)).toString("utf8"),
};
