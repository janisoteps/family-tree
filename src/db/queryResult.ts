import type { QueryResult } from "lbug";

export function normalizeQueryResult(r: QueryResult | QueryResult[]): QueryResult {
  return Array.isArray(r) ? r[r.length - 1] : r;
}
