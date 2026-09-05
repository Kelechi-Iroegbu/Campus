import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

/**
 * Pooled, transaction-capable Drizzle client.
 *
 * `src/db/index.ts` (neon-http) is fine for one-shot queries, but it can't
 * run multi-statement transactions. Anything that has to be atomic — crediting
 * a wallet + inserting its ledger row, debiting a wallet at checkout — must go
 * through `dbPool.transaction(...)`.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const dbPool = drizzle(pool, { schema });
