import { normalizeQueryResult } from "../db/queryResult";
import { pool } from '../db/pool';

export type CreatePersonInput = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  maiden_name?: string | null;
  birth_date?: string | null; // ISO date string (YYYY-MM-DD)
  death_date?: string | null; // ISO date string (YYYY-MM-DD)
  birth_place?: string | null;
  death_place?: string | null;
  gender?: string | null;
  occupation?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  current_address?: string | null;
  data?: string | null; // Stringified JSON
};

export type PersonRow = {
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
};

/**
 * Escape a JS string into a Cypher single-quoted string literal.
 * - Escapes backslashes
 * - Escapes single quotes
 */
function cypherString(value: string): string {
  const v = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `'${v}'`;
}

/**
 * Build a Cypher date literal: date('YYYY-MM-DD') or NULL
 */
function cypherDate(value: string | null | undefined): string {
  if (!value) return "NULL";
  const v = value.trim();
  if (!v) return "NULL";
  // Validate it's a valid date string format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    throw new Error(`Invalid date format: ${v}. Expected YYYY-MM-DD`);
  }
  return `date(${cypherString(v)})`;
}

/**
 * Build a Cypher value assignment that handles null/undefined strings
 */
function cypherValue(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return cypherString(value);
}

/**
 * Insert or update a Person node.
 *
 * - Uses MERGE on primary key `id` so repeated inserts do not fail.
 * - Overwrites all mutable fields.
 */
export async function createPerson(input: CreatePersonInput): Promise<PersonRow> {
  // Basic defensive checks (service-level; controller should validate too)
  if (!input.id?.trim()) throw new Error("createPerson: id is required");

  const id = input.id.trim();

  const q = `
    MERGE (p:Person {id: ${cypherString(id)}})
    SET
      p.first_name = ${cypherValue(input.first_name)},
      p.last_name = ${cypherValue(input.last_name)},
      p.maiden_name = ${cypherValue(input.maiden_name)},
      p.birth_date = ${cypherDate(input.birth_date)},
      p.death_date = ${cypherDate(input.death_date)},
      p.birth_place = ${cypherValue(input.birth_place)},
      p.death_place = ${cypherValue(input.death_place)},
      p.gender = ${cypherValue(input.gender)},
      p.occupation = ${cypherValue(input.occupation)},
      p.notes = ${cypherValue(input.notes)},
      p.photo_url = ${cypherValue(input.photo_url)},
      p.email = ${cypherValue(input.email)},
      p.phone = ${cypherValue(input.phone)},
      p.current_address = ${cypherValue(input.current_address)},
      p.data = ${cypherValue(input.data)}
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
      p.data AS data;
  `;

  const row = await pool.withConnection(async (conn) => {
    const result = await conn.query(q);
    const rows = await normalizeQueryResult(result).getAll();

    if (!rows || rows.length === 0) {
      throw new Error("createPerson: no row returned from database");
    }
    return rows[0] as PersonRow;
  });

  return row;
}
