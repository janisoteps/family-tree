import { pool } from "../db/pool";
import { normalizeQueryResult } from "../db/queryResult";

export type NodeListResult = {
  persons: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    maiden_name: string | null;
    birth_date: string | null;
    death_date: string | null;
    birth_place: string | null;
    death_place: string | null;
    gender: string | null;
    occupation: string | null;
    notes: string | null;
    photo_url: string | null;
    email: string | null;
    phone: string | null;
    current_address: string | null;
    data: string | null;
    position_x: number | null;
    position_y: number | null;
  }>;
};

async function run<T = any>(cypher: string): Promise<T[]> {
  return pool.withConnection(async (conn) => {
    const r = await conn.query(cypher);
    return (await normalizeQueryResult(r).getAll()) as T[];
  });
}

/**
 * Lists all Person nodes.
 * Returns empty array when table is empty.
 */
export async function listAllNodes(): Promise<NodeListResult> {
  const persons = await run(`
    MATCH (p:Person)
    RETURN
      p.id AS id,
      p.first_name AS first_name,
      p.last_name AS last_name,
      p.maiden_name AS maiden_name,
      p.birth_date AS birth_date,
      p.death_date AS death_date,
      p.birth_place AS birth_place,
      p.death_place AS death_place,
      p.gender AS gender,
      p.occupation AS occupation,
      p.notes AS notes,
      p.photo_url AS photo_url,
      p.email AS email,
      p.phone AS phone,
      p.current_address AS current_address,
      p.data AS data,
      p.position_x AS position_x,
      p.position_y AS position_y
    ORDER BY p.last_name, p.first_name, id;
  `);

  return { persons };
}
