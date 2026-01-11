// src/db/connectionPool.ts
import type { Connection } from "lbug";
import { createConnection } from "./database";

type Waiter = {
  resolve: (c: Connection) => void;
  reject: (e: Error) => void;
};

export class ConnectionPool {
  private readonly maxSize: number;
  private readonly numThreadsPerConn?: number;

  private all: Connection[] = [];
  private idle: Connection[] = [];
  private waiters: Waiter[] = [];

  private isClosed = false;
  private initPromise: Promise<void> | null = null;

  constructor(opts: { maxSize: number; numThreadsPerConn?: number }) {
    if (!Number.isFinite(opts.maxSize) || opts.maxSize <= 0) {
      throw new Error("ConnectionPool: maxSize must be > 0");
    }
    this.maxSize = opts.maxSize;
    this.numThreadsPerConn = opts.numThreadsPerConn;
  }

  /**
   * Pre-create connections so first requests are fast.
   */
  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      for (let i = 0; i < this.maxSize; i++) {
        const conn = await createConnection(this.numThreadsPerConn);
        this.all.push(conn);
        this.idle.push(conn);
      }
    })();

    return this.initPromise;
  }

  /**
   * Acquire a connection. If none are idle, wait in FIFO order.
   */
  async acquire(): Promise<Connection> {
    if (this.isClosed) {
      throw new Error("ConnectionPool is closed");
    }
    if (this.initPromise) await this.initPromise;

    const conn = this.idle.pop();
    if (conn) return conn;

    return new Promise<Connection>((resolve, reject) => {
      this.waiters.push({ resolve, reject });
    });
  }

  /**
   * Release a connection back to pool and wake a waiter if present.
   */
  release(conn: Connection): void {
    if (this.isClosed) {
      // Pool is closed; just drop it on the floor. Caller shouldn't reuse it.
      return;
    }

    const waiter = this.waiters.shift();
    if (waiter) {
      waiter.resolve(conn);
      return;
    }

    this.idle.push(conn);
  }

  /**
   * Convenience helper: acquire + run + release
   */
  async withConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
    const conn = await this.acquire();
    try {
      return await fn(conn);
    } finally {
      this.release(conn);
    }
  }

  /**
   * Close pool: reject waiters and release resources.
   * NOTE: Ladybug's Connection doesn't currently document a close method
   * in the Node examples, so we just stop handing them out and let the DB close handle cleanup.
   */
  async close(): Promise<void> {
    if (this.isClosed) return;
    this.isClosed = true;

    // Reject any queued waiters
    const err = new Error("ConnectionPool closed");
    for (const w of this.waiters) w.reject(err);
    this.waiters = [];

    // Nothing else to do unless the Connection API exposes explicit close()
    this.idle = [];
  }
}
