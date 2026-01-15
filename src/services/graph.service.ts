import { pool } from "../db/pool";
import { normalizeQueryResult } from "../db/queryResult";

export type PersonNode = {
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

export type ParentOfEdge = {
  parent_id: string;
  child_id: string;
  parent_type: string | null;
};

export type UnionEdge = {
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

export type FamilyTreeGraph = {
  nodes: PersonNode[];
  parentOf: ParentOfEdge[];
  unions: UnionEdge[];
};

async function run<T = unknown>(cypher: string): Promise<T[]> {
  return pool.withConnection(async (conn) => {
    const r = await conn.query(cypher);
    return (await normalizeQueryResult(r).getAll()) as T[];
  });
}

/**
 * Fetches the complete family tree graph including:
 * - All Person nodes
 * - All PARENT_OF relationships
 * - All FAMILY_UNION relationships
 */
export async function getFamilyTreeGraph(): Promise<FamilyTreeGraph> {
  // Fetch all persons
  const nodes = await run<PersonNode>(`
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
    ORDER BY p.last_name, p.first_name, p.id;
  `);

  // Fetch all parent-child relationships
  const parentOf = await run<ParentOfEdge>(`
    MATCH (parent:Person)-[r:PARENT_OF]->(child:Person)
    RETURN
      parent.id AS parent_id,
      child.id AS child_id,
      r.parent_type AS parent_type;
  `);

  // Fetch all union relationships
  const unions = await run<UnionEdge>(`
    MATCH (p1:Person)-[r:FAMILY_UNION]->(p2:Person)
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
  `);

  return { nodes, parentOf, unions };
}

