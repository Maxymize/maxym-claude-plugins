/**
 * PostgreSQL Direct Client - Connessione diretta al database
 *
 * Questo client implementa il pattern Code Execution connettendosi
 * direttamente al database PostgreSQL invece di passare per un server MCP.
 *
 * REQUISITI:
 * - npm install pg @types/pg
 * - Variabile d'ambiente: POSTGRES_URL_NON_POOLING
 *
 * @see https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import { Pool, QueryResultRow } from 'pg';

// Pool di connessioni condiviso
let pool: Pool | null = null;

/**
 * Inizializza il pool di connessioni
 */
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL_NON_POOLING ||
        'postgresql://postgres:postgres@localhost:54322/postgres',
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected pool error:', err);
    });
  }

  return pool;
}

/**
 * Esegue una query SQL
 */
export async function query<T extends QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const p = getPool();
  const result = await p.query<T>(sql, params);
  return { rows: result.rows, rowCount: result.rowCount };
}

/**
 * Lista tutti gli schemi del database
 */
export async function getSchemas(): Promise<{ schema_name: string; size: string; table_count: number }[]> {
  const result = await query<{ schema_name: string; size: string; table_count: number }>(`
    SELECT
      n.nspname as schema_name,
      pg_size_pretty(sum(pg_total_relation_size(c.oid))) as size,
      count(c.oid)::int as table_count
    FROM pg_namespace n
    LEFT JOIN pg_class c ON c.relnamespace = n.oid AND c.relkind IN ('r', 'p')
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      AND n.nspname NOT LIKE 'pg_temp%'
    GROUP BY n.nspname
    ORDER BY table_count DESC;
  `);
  return result.rows;
}

/**
 * Lista tutte le tabelle in uno schema
 */
export async function getTables(schemaName: string): Promise<{
  table_name: string;
  table_type: string;
  row_count: number;
  size: string;
}[]> {
  const result = await query<{
    table_name: string;
    table_type: string;
    row_count: number;
    size: string;
  }>(`
    SELECT
      t.tablename as table_name,
      'table' as table_type,
      COALESCE(s.n_live_tup, 0)::int as row_count,
      pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as size
    FROM pg_tables t
    LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname AND t.schemaname = s.schemaname
    WHERE t.schemaname = $1
    ORDER BY t.tablename;
  `, [schemaName]);
  return result.rows;
}

/**
 * Ottieni la struttura di una tabella
 */
export async function getTableSchema(schemaName: string, tableName: string): Promise<{
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  column_default: string | null;
}[]> {
  const result = await query<{
    column_name: string;
    data_type: string;
    is_nullable: boolean;
    column_default: string | null;
  }>(`
    SELECT
      column_name,
      data_type,
      is_nullable = 'YES' as is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `, [schemaName, tableName]);
  return result.rows;
}

/**
 * Esegue una query PostgreSQL (solo SELECT/READ per default)
 */
export async function executePostgresql(sql: string, allowWrite = false): Promise<{ rows: unknown[]; rowCount: number }> {
  if (!allowWrite) {
    const upperSql = sql.trim().toUpperCase();
    const isReadOnly = upperSql.startsWith('SELECT') ||
                       upperSql.startsWith('EXPLAIN') ||
                       upperSql.startsWith('SHOW') ||
                       upperSql.startsWith('WITH');

    if (!isReadOnly) {
      throw new Error('Query di scrittura non permessa. Usa allowWrite=true per abilitare.');
    }
  }

  const result = await query(sql);
  return {
    rows: result.rows,
    rowCount: result.rowCount ?? 0,
  };
}

/**
 * Chiude il pool di connessioni
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Cleanup automatico
process.on('exit', () => { if (pool) pool.end(); });
process.on('SIGINT', async () => { await closePool(); process.exit(0); });
process.on('SIGTERM', async () => { await closePool(); process.exit(0); });
