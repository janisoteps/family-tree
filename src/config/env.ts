import path from "node:path";
import fs from "node:fs";
import dotenv from "dotenv";

// Load .env from project root (works when running from root)
dotenv.config();

function readEnv(name: string, fallback?: string): string {
  const v = process.env[name];
  if (v && v.trim().length > 0) return v.trim();
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

/**
 * Resolve DB_PATH safely:
 * - Allow relative paths (relative to project root)
 * - Ensure it ends with .lbug
 * - Ensure the parent directory exists (create it if missing)
 */
function resolveDbPath(rawPath: string): string {
  const trimmed = rawPath.trim();

  const withExt = trimmed.endsWith(".lbug") ? trimmed : `${trimmed}.lbug`;

  // If user provided an absolute path, keep it; otherwise resolve from process.cwd()
  const abs = path.isAbsolute(withExt) ? withExt : path.resolve(process.cwd(), withExt);

  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return abs;
}

export const env = {
  nodeEnv: readEnv("NODE_ENV", "development"),
  port: Number(readEnv("PORT", "3001")),
  dbPath: resolveDbPath(readEnv("DB_PATH", "data/janis_family_tree.lbug")),
} as const;
