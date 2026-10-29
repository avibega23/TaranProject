import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./database/connect.js";
import { getEnv } from "./config/env.js";
import { logError, logInfo } from "./utils/logger.js";

async function main() {
  const env = getEnv();
  await connectDatabase(env.MONGODB_URI);
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logInfo(`FindIt API listening on http://localhost:${env.PORT}`);
  });

  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logInfo(`Received ${signal}. Closing API.`);
    server.close(() => {
      void disconnectDatabase().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

void main().catch((error) => {
  logError("Startup aborted", error);
  process.exit(1);
});
