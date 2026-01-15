import { pool } from "../db/pool";
import { normalizeQueryResult } from "../db/queryResult";

export type CreateUnionInput = {
  person1_id: string;
  person2_id: string;
  unionId?: string | null;
  type?: string | null; // e.g., marriage, partnership, etc.
  startDate?: string | null; // ISO date string (YYYY-MM-DD)
  endDate?: string | null; // ISO date string (YYYY-MM-DD)
  place?: string | null;
  status?: string | null; // divorced, annulled, ongoing, unknown
  notes?: string | null;
};

export type UnionRow = {
  person1_id: string;
  person2_id: string;
  unionId: string | null;
  type: string | null;
  startDate: string | null;
  endDate: string | null;
  place: string | null;
  status: string | null;
  notes: string | null;
};

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
 * Create or update FAMILY_UNION:
 * (Person {id: person1_id}) -[FAMILY_UNION {unionId, type, startDate, endDate, place, status, notes}]-> (Person {id: person2_id})
 */
export async function createUnion(input: CreateUnionInput): Promise<UnionRow> {
  const person1Id = input.person1_id?.trim();
  const person2Id = input.person2_id?.trim();

  if (!person1Id) throw new Error("createUnion: person1_id is required");
  if (!person2Id) throw new Error("createUnion: person2_id is required");
  if (person1Id === person2Id) {
    throw new Error("createUnion: person1_id and person2_id must be different");
  }

  // Validate date logic
  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (start > end) {
      throw new Error("startDate must be <= endDate");
    }
  }

  const q = `
    MATCH (p1:Person {id: ${cypherString(person1Id)}})
    MATCH (p2:Person {id: ${cypherString(person2Id)}})
    MERGE (p1)-[r:FAMILY_UNION]->(p2)
    SET
      r.unionId = ${cypherValue(input.unionId)},
      r.type = ${cypherValue(input.type)},
      r.startDate = ${cypherDate(input.startDate)},
      r.endDate = ${cypherDate(input.endDate)},
      r.place = ${cypherValue(input.place)},
      r.status = ${cypherValue(input.status)},
      r.notes = ${cypherValue(input.notes)}
    RETURN
      p1.id AS person1_id,
      p2.id AS person2_id,
      r.unionId AS unionId,
      r.type AS type,
      r.startDate AS startDate,
      r.endDate AS endDate,
      r.place AS place,
      r.status AS status,
      r.notes AS notes;
  `;

  const row = await pool.withConnection(async (conn) => {
    const r = await conn.query(q);
    const rows = await normalizeQueryResult(r).getAll();

    if (!rows || rows.length === 0) {
      // Identify which node is missing (helpful error)
      const checkQ = `
        RETURN
          EXISTS { MATCH (:Person {id: ${cypherString(person1Id)}}) } AS person1_exists,
          EXISTS { MATCH (:Person {id: ${cypherString(person2Id)}}) } AS person2_exists;
      `;
      const checkRes = await conn.query(checkQ);
      const checkRows = await normalizeQueryResult(checkRes).getAll();
      const flags = (checkRows?.[0] ?? {}) as {
        person1_exists?: boolean;
        person2_exists?: boolean;
      };

      if (flags.person1_exists === false) throw new Error(`Person not found: ${person1Id}`);
      if (flags.person2_exists === false) throw new Error(`Person not found: ${person2Id}`);

      throw new Error("createUnion: relationship not created (unknown reason)");
    }

    return rows[0] as UnionRow;
  });

  return row;
}
