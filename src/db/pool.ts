// src/db/pool.ts
import { ConnectionPool } from "./connectionPool";

export const pool = new ConnectionPool({
  maxSize: Number(process.env.DB_POOL_SIZE ?? 4), // start with 4; tune later
  // numThreadsPerConn: 2, // optional: only set if you want to control per-conn threads
});
