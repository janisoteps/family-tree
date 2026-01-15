// src/db/schema.ts
import { pool } from "./pool";

export const SCHEMA_DDL: string[] = [
  `
  CREATE NODE TABLE IF NOT EXISTS Person(
    id STRING PRIMARY KEY,
    first_name STRING,
    last_name STRING,
    maiden_name STRING,
    birth_date DATE,
    death_date DATE,
    birth_place STRING,
    death_place STRING,
    gender STRING,
    occupation STRING,
    notes STRING,
    photo_url STRING,
    email STRING,
    phone STRING,
    current_address STRING,
    data STRING
  );
  `,
  `
  CREATE REL TABLE IF NOT EXISTS PARENT_OF(
    FROM Person TO Person,
    parent_type STRING
  );
  `,
  `
  CREATE REL TABLE IF NOT EXISTS FAMILY_UNION(
    FROM Person TO Person,
    unionId STRING,
    type STRING,
    startDate DATE,
    endDate DATE,
    place STRING,
    status STRING,
    notes STRING
  );
  `,
];

let schemaInitPromise: Promise<void> | null = null;

/**
 * Initialize schema exactly once per process lifetime.
 */
export async function initSchema(): Promise<void> {
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = pool.withConnection(async (conn) => {
    for (const ddl of SCHEMA_DDL) {
      // Ladybug examples use conn.execute(...) in Python docs; in Node you may be using conn.query(...)
      // If your codebase uses conn.query, keep it consistent:
      await conn.query(ddl);
    }
  });

  return schemaInitPromise;
}
