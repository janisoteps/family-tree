import { pool } from "../db/pool";
import { normalizeQueryResult } from "../db/queryResult";

export type CreateParentOfInput = {
  parent_id: string;
  child_id: string;
  parent_type?: string | null; // e.g., biological, adoptive, step, foster
};

export type ParentOfRow = {
  parent_id: string;
  child_id: string;
  parent_type: string | null;
};

function cypherString(value: string): string {
  const v = value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `'${v}'`;
}

/**
 * Build a Cypher value assignment that handles null/undefined strings
 */
function cypherValue(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return cypherString(value);
}

/**
 * Create or update PARENT_OF:
 * (Person {id: parent_id}) -[PARENT_OF {parent_type}]-> (Person {id: child_id})
 */
export async function createParentOf(input: CreateParentOfInput): Promise<ParentOfRow> {
  const parentId = input.parent_id?.trim();
  const childId = input.child_id?.trim();

  if (!parentId) throw new Error("createParentOf: parent_id is required");
  if (!childId) throw new Error("createParentOf: child_id is required");
  if (parentId === childId) {
    throw new Error("createParentOf: parent_id and child_id must be different");
  }

  const q = `
    MATCH (parent:Person {id: ${cypherString(parentId)}})
    MATCH (child:Person {id: ${cypherString(childId)}})
    MERGE (parent)-[r:PARENT_OF]->(child)
    SET
      r.parent_type = ${cypherValue(input.parent_type)}
    RETURN
      parent.id AS parent_id,
      child.id AS child_id,
      r.parent_type AS parent_type;
  `;

  const row = await pool.withConnection(async (conn) => {
    const r = await conn.query(q);
    const rows = await normalizeQueryResult(r).getAll();

    if (!rows || rows.length === 0) {
      // Identify which node is missing (helpful error)
      const checkQ = `
        RETURN
          EXISTS { MATCH (:Person {id: ${cypherString(parentId)}}) } AS parent_exists,
          EXISTS { MATCH (:Person {id: ${cypherString(childId)}}) } AS child_exists;
      `;
      const checkRes = await conn.query(checkQ);
      const checkRows = await normalizeQueryResult(checkRes).getAll();
      const flags = (checkRows?.[0] ?? {}) as {
        parent_exists?: boolean;
        child_exists?: boolean;
      };

      if (flags.parent_exists === false) throw new Error(`Person not found: ${parentId}`);
      if (flags.child_exists === false) throw new Error(`Person not found: ${childId}`);

      throw new Error("createParentOf: relationship not created (unknown reason)");
    }

    return rows[0] as ParentOfRow;
  });

  return row;
}

