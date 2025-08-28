import { spawn } from "child_process";

console.log("Starting Python FastAPI server...");

const pythonProcess = spawn(".pythonlibs/bin/python", ["start_server.py"], {
  stdio: "inherit",
  cwd: process.cwd()
});

pythonProcess.on("error", (err) => {
  console.error("Failed to start Python server:", err);
  process.exit(1);
});

pythonProcess.on("close", (code) => {
  console.log(`Python server exited with code ${code}`);
  process.exit(code || 0);
});

// Keep the process alive
process.on("SIGINT", () => {
  pythonProcess.kill("SIGINT");
});

process.on("SIGTERM", () => {
  pythonProcess.kill("SIGTERM");
});