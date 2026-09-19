interface TaxonomyDb {
  prepare: (sql: string) => {
    bind: (...args: unknown[]) => { first: <T>() => Promise<T | null>, run: () => Promise<unknown> }
  }
}

const ALLOWED_TABLES = ['build_types', 'themes', 'categories'] as const
type TaxonomyTable = typeof ALLOWED_TABLES[number]

export async function ensureTaxonomyTerm(db: TaxonomyDb, table: TaxonomyTable, name: string): Promise<string> {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Invalid taxonomy table: ${table}`)
  }
  const trimmed = name.trim()

  const existing = await db
    .prepare(`SELECT name FROM ${table} WHERE name = ? COLLATE NOCASE`)
    .bind(trimmed)
    .first<{ name: string }>()

  if (existing) {
    return existing.name
  }

  await db
    .prepare(`INSERT INTO ${table} (name) VALUES (?)`)
    .bind(trimmed)
    .run()

  return trimmed
}
