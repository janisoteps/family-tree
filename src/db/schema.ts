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
    data STRING,
    position_x FLOAT,
    position_y FLOAT
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

/**
 * Migration DDL statements to update existing schema.
 * These run after the main schema creation to add new properties to existing tables.
 * 
 * Note: In graph databases, properties are typically added dynamically when set on nodes.
 * This migration initializes position_x and position_y on all existing Person nodes.
 */
export const SCHEMA_MIGRATIONS: string[] = [
  // Migration: Initialize position_x and position_y properties on all existing Person nodes
  // Setting properties on nodes will create them dynamically in the graph database
  // This allows the properties to be queried even if they weren't in the original schema
  // `
  // MATCH (p:Person)
  // SET p.position_x = NULL, p.position_y = NULL;
  // `,
];

let schemaInitPromise: Promise<void> | null = null;

/**
 * Initialize schema exactly once per process lifetime.
 */
export async function initSchema(): Promise<void> {
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = pool.withConnection(async (conn) => {
    // First, create tables if they don't exist
    for (const ddl of SCHEMA_DDL) {
      // Ladybug examples use conn.execute(...) in Python docs; in Node you may be using conn.query(...)
      // If your codebase uses conn.query, keep it consistent:
      await conn.query(ddl);
    }
    
    // Then, run migrations to update existing schema
    for (const migration of SCHEMA_MIGRATIONS) {
      try {
        await conn.query(migration);
        console.log('Migration applied successfully');
      } catch (error) {
        // If migration fails, log it but don't crash
        // The properties might need to be added manually or the schema recreated
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn('Migration warning:', errorMsg);
        
        // If this is a binder error about properties not existing, we need a different approach
        if (errorMsg.includes('Cannot find property') || errorMsg.includes('Binder exception')) {
          console.error('⚠️  Schema migration failed: Properties need to be added to the schema definition.');
          console.error('   You may need to manually update the database schema or recreate the Person table.');
          console.error('   The application will continue, but position queries may fail until the schema is updated.');
        }
      }
    }
  });

  return schemaInitPromise;
}
