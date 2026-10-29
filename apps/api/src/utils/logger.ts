const REDACTED_KEYS = new Set([
  "password",
  "passwordHash",
  "confirmPassword",
  "token",
  "cookie",
  "proofDescription",
  "authorization",
]);

export function logInfo(message: string, meta?: Record<string, unknown>): void {
  console.log(JSON.stringify({ level: "info", message, ...sanitize(meta) }));
}

export function logError(message: string, error?: unknown): void {
  const detail = error instanceof Error ? error.message : undefined;
  console.error(JSON.stringify({ level: "error", message, detail }));
}

function sanitize(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (REDACTED_KEYS.has(key)) continue;
    safe[key] = value;
  }
  return safe;
}
