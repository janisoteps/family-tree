// src/db/database.ts
import { Database, Connection } from "lbug";
import { env } from "../config/env";


let db: Database | null = null;
let dbInitPromise: Promise<Database> | null = null;

/**
 * Initialize the Ladybug database exactly once.
 *
 * Important: Ladybug Database initialization is lazy by default, so we call `db.init()`
 * here to force open/initialize at startup. :contentReference[oaicite:1]{index=1}
 */
export async function initDatabase(): Promise<Database> {
  if (db) return db;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    const instance = new Database(env.dbPath); // on-disk mode: pass a path :contentReference[oaicite:2]{index=2}
    await instance.init(); // force initialization now (not lazily on first query) :contentReference[oaicite:3]{index=3}
    db = instance;
    return instance;
  })();

  return dbInitPromise;
}

/**
 * Get the initialized Database instance.
 * Throws if you forgot to call initDatabase() during startup.
 */
export function getDatabase(): Database {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() at startup.");
  }
  return db;
}

/**
 * Create a new Connection from the singleton Database.
 * Optionally set `numThreads` to control query execution threads. :contentReference[oaicite:4]{index=4}
 */
export async function createConnection(numThreads?: number): Promise<Connection> {
  const database = await initDatabase();

  // Connection constructor signature: new Connection(database, numThreads?) :contentReference[oaicite:5]{index=5}
  const conn = typeof numThreads === "number"
    ? new Connection(database, numThreads)
    : new Connection(database);

  // Connection initialization is also lazy; init() forces it now. :contentReference[oaicite:6]{index=6}
  await conn.init();
  return conn;
}

/**
 * Gracefully close the Database.
 */
export async function closeDatabase(): Promise<void> {
  if (!db) return;
  await db.close(); // async close :contentReference[oaicite:7]{index=7}
  db = null;
  dbInitPromise = null;
}
