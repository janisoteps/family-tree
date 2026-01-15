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
  position_x?: number | null;
  position_y?: number | null;
};

export type UpdatePersonInput = {
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
  position_x?: number | null;
  position_y?: number | null;
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
  position_x: number | null;
  position_y: number | null;
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
 * Automatically formats ISO date strings (e.g., 2000-03-28T00:00:00.000Z) to YYYY-MM-DD
 */
function cypherDate(value: string | null | undefined): string {
  if (!value) return "NULL";
  const v = value.trim();
  if (!v) return "NULL";
  
  // Extract date part from ISO string if present (e.g., "2000-03-28T00:00:00.000Z" -> "2000-03-28")
  let dateStr = v;
  if (v.includes('T')) {
    dateStr = v.split('T')[0];
  }
  
  // Validate it's a valid date string format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date format: ${v}. Expected YYYY-MM-DD`);
  }
  return `date(${cypherString(dateStr)})`;
}

/**
 * Build a Cypher value assignment that handles null/undefined strings
 */
function cypherValue(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return cypherString(value);
}

/**
 * Build a Cypher float value assignment that handles null/undefined numbers
 */
function cypherFloat(value: number | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return String(value);
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
      p.data = ${cypherValue(input.data)},
      p.position_x = ${cypherFloat(input.position_x)},
      p.position_y = ${cypherFloat(input.position_y)}
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
      p.position_y AS position_y;
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

/**
 * Delete a Person node and all edges (relationships) connected to it.
 *
 * - Deletes all PARENT_OF relationships where this person is parent or child
 * - Deletes all FAMILY_UNION relationships where this person is involved
 * - Deletes the Person node itself
 * - Throws an error if the person does not exist
 */
export async function deletePerson(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("deletePerson: id is required");

  const personId = id.trim();

  await pool.withConnection(async (conn) => {
    // First check if person exists
    const checkQ = `
      RETURN EXISTS { MATCH (:Person {id: ${cypherString(personId)}}) } AS person_exists;
    `;
    const checkRes = await conn.query(checkQ);
    const checkRows = await normalizeQueryResult(checkRes).getAll();
    const flags = (checkRows?.[0] ?? {}) as {
      person_exists?: boolean;
    };

    if (flags.person_exists === false) {
      throw new Error(`Person not found: ${personId}`);
    }

    // Person exists, proceed with deletion
    // DETACH DELETE automatically removes all relationships before deleting the node
    const deleteQ = `
      MATCH (p:Person {id: ${cypherString(personId)}})
      DETACH DELETE p;
    `;
    await conn.query(deleteQ);
  });
}

/**
 * Update a Person node with the provided fields.
 *
 * - Updates only the fields provided in the input (partial update support)
 * - Throws an error if the person does not exist
 * - Returns the updated person node
 */
export async function updatePerson(id: string, input: UpdatePersonInput): Promise<PersonRow> {
  if (!id?.trim()) throw new Error("updatePerson: id is required");

  const personId = id.trim();

  await pool.withConnection(async (conn) => {
    // First check if person exists
    const checkQ = `
      RETURN EXISTS { MATCH (:Person {id: ${cypherString(personId)}}) } AS person_exists;
    `;
    const checkRes = await conn.query(checkQ);
    const checkRows = await normalizeQueryResult(checkRes).getAll();
    const flags = (checkRows?.[0] ?? {}) as {
      person_exists?: boolean;
    };

    if (flags.person_exists === false) {
      throw new Error(`Person not found: ${personId}`);
    }
  });

  // Build SET clause only for provided fields
  const setClauses: string[] = [];
  
  if (input.first_name !== undefined) {
    setClauses.push(`p.first_name = ${cypherValue(input.first_name)}`);
  }
  if (input.last_name !== undefined) {
    setClauses.push(`p.last_name = ${cypherValue(input.last_name)}`);
  }
  if (input.maiden_name !== undefined) {
    setClauses.push(`p.maiden_name = ${cypherValue(input.maiden_name)}`);
  }
  if (input.birth_date !== undefined) {
    setClauses.push(`p.birth_date = ${cypherDate(input.birth_date)}`);
  }
  if (input.death_date !== undefined) {
    setClauses.push(`p.death_date = ${cypherDate(input.death_date)}`);
  }
  if (input.birth_place !== undefined) {
    setClauses.push(`p.birth_place = ${cypherValue(input.birth_place)}`);
  }
  if (input.death_place !== undefined) {
    setClauses.push(`p.death_place = ${cypherValue(input.death_place)}`);
  }
  if (input.gender !== undefined) {
    setClauses.push(`p.gender = ${cypherValue(input.gender)}`);
  }
  if (input.occupation !== undefined) {
    setClauses.push(`p.occupation = ${cypherValue(input.occupation)}`);
  }
  if (input.notes !== undefined) {
    setClauses.push(`p.notes = ${cypherValue(input.notes)}`);
  }
  if (input.photo_url !== undefined) {
    setClauses.push(`p.photo_url = ${cypherValue(input.photo_url)}`);
  }
  if (input.email !== undefined) {
    setClauses.push(`p.email = ${cypherValue(input.email)}`);
  }
  if (input.phone !== undefined) {
    setClauses.push(`p.phone = ${cypherValue(input.phone)}`);
  }
  if (input.current_address !== undefined) {
    setClauses.push(`p.current_address = ${cypherValue(input.current_address)}`);
  }
  if (input.data !== undefined) {
    setClauses.push(`p.data = ${cypherValue(input.data)}`);
  }
  if (input.position_x !== undefined) {
    setClauses.push(`p.position_x = ${cypherFloat(input.position_x)}`);
  }
  if (input.position_y !== undefined) {
    setClauses.push(`p.position_y = ${cypherFloat(input.position_y)}`);
  }

  if (setClauses.length === 0) {
    // No fields to update, just return the existing person
    const getQ = `
      MATCH (p:Person {id: ${cypherString(personId)}})
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
        p.position_y AS position_y;
    `;

    const row = await pool.withConnection(async (conn) => {
      const result = await conn.query(getQ);
      const rows = await normalizeQueryResult(result).getAll();

      if (!rows || rows.length === 0) {
        throw new Error(`Person not found: ${personId}`);
      }
      return rows[0] as PersonRow;
    });

    return row;
  }

  const q = `
    MATCH (p:Person {id: ${cypherString(personId)}})
    SET
      ${setClauses.join(',\n      ')}
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
      p.position_y AS position_y;
  `;

  const row = await pool.withConnection(async (conn) => {
    const result = await conn.query(q);
    const rows = await normalizeQueryResult(result).getAll();

    if (!rows || rows.length === 0) {
      throw new Error(`Person not found: ${personId}`);
    }
    return rows[0] as PersonRow;
  });

  return row;
}

/**
 * Update only the position coordinates for a Person node.
 *
 * - Updates only position_x and position_y fields
 * - Throws an error if the person does not exist
 * - Returns the updated person node
 */
export async function updatePersonPosition(
  personId: string,
  x: number,
  y: number
): Promise<PersonRow> {
  if (!personId?.trim()) throw new Error("updatePersonPosition: personId is required");
  if (typeof x !== 'number' || typeof y !== 'number') {
    throw new Error("updatePersonPosition: x and y must be numbers");
  }

  const id = personId.trim();

  const q = `
    MATCH (p:Person {id: ${cypherString(id)}})
    SET
      p.position_x = ${cypherFloat(x)},
      p.position_y = ${cypherFloat(y)}
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
      p.position_y AS position_y;
  `;

  const row = await pool.withConnection(async (conn) => {
    const result = await conn.query(q);
    const rows = await normalizeQueryResult(result).getAll();

    if (!rows || rows.length === 0) {
      throw new Error(`Person not found: ${id}`);
    }
    return rows[0] as PersonRow;
  });

  return row;
}

/**
 * Clear the position coordinates for a Person node (set to NULL).
 *
 * - Sets position_x and position_y to NULL
 * - Throws an error if the person does not exist
 * - Returns the updated person node
 */
export async function clearPersonPosition(personId: string): Promise<PersonRow> {
  if (!personId?.trim()) throw new Error("clearPersonPosition: personId is required");

  const id = personId.trim();

  const q = `
    MATCH (p:Person {id: ${cypherString(id)}})
    SET
      p.position_x = NULL,
      p.position_y = NULL
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
      p.position_y AS position_y;
  `;

  const row = await pool.withConnection(async (conn) => {
    const result = await conn.query(q);
    const rows = await normalizeQueryResult(result).getAll();

    if (!rows || rows.length === 0) {
      throw new Error(`Person not found: ${id}`);
    }
    return rows[0] as PersonRow;
  });

  return row;
}
