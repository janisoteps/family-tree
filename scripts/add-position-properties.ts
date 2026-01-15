/**
 * Manual migration script to add position_x and position_y properties to existing Person nodes.
 * 
 * This script should be run once to initialize the position properties on all existing Person nodes.
 * 
 * Usage:
 *   npm run build
 *   node dist/scripts/add-position-properties.js
 * 
 * Or with ts-node:
 *   npx ts-node scripts/add-position-properties.ts
 */

import { initDatabase } from '../src/db/database';
import { pool } from '../src/db/pool';
import { normalizeQueryResult } from '../src/db/queryResult';

async function addPositionProperties() {
  console.log('Starting migration: Adding position_x and position_y to Person nodes...');
  
  try {
    await initDatabase();
    await pool.init();

    // Try to set the properties on all existing Person nodes
    // This will create the properties dynamically if the database allows it
    const query = `
      MATCH (p:Person)
      SET p.position_x = NULL, p.position_y = NULL
      RETURN count(p) AS updated_count;
    `;

    const result = await pool.withConnection(async (conn) => {
      const queryResult = await conn.query(query);
      const rows = await normalizeQueryResult(queryResult).getAll();
      return rows[0] as { updated_count?: number };
    });

    const count = result?.updated_count || 0;
    console.log(`✅ Successfully initialized position properties on ${count} Person nodes`);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Migration failed:', errorMsg);
    
    if (errorMsg.includes('Cannot find property') || errorMsg.includes('Binder exception')) {
      console.error('\n⚠️  The database schema does not recognize position_x/position_y properties.');
      console.error('   This means the schema definition needs to be updated.');
      console.error('\n   Options:');
      console.error('   1. Export your data, drop the Person table, and let the schema recreate it');
      console.error('   2. Check if your database version supports schema updates');
      console.error('   3. Contact database support for schema migration guidance');
    }
    
    process.exit(1);
  } finally {
    await pool.close();
  }
  
  process.exit(0);
}

addPositionProperties().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

