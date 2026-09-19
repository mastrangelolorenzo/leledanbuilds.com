import { describe, expect, it, vi } from 'vitest'
import { ensureTaxonomyTerm } from './taxonomy'

function fakeDb(existingRows: { name: string }[]) {
  const first = vi.fn().mockResolvedValue(existingRows[0] ?? null)
  const bind = vi.fn().mockReturnValue({ first })
  const run = vi.fn().mockResolvedValue({})
  const bindForInsert = vi.fn().mockReturnValue({ run })
  const prepare = vi.fn((sql: string) => {
    if (sql.startsWith('SELECT')) return { bind }
    return { bind: bindForInsert }
  })
  return { prepare, bind, bindForInsert, first, run }
}

describe('ensureTaxonomyTerm', () => {
  it('returns the existing canonical name when a case-insensitive match exists', async () => {
    const db = fakeDb([{ name: 'Modern' }])
    const result = await ensureTaxonomyTerm(db as never, 'themes', 'modern')
    expect(result).toBe('Modern')
  })

  it('inserts and returns the trimmed name when no match exists', async () => {
    const db = fakeDb([])
    const result = await ensureTaxonomyTerm(db as never, 'themes', '  Cyberpunk  ')
    expect(result).toBe('Cyberpunk')
    expect(db.bindForInsert).toHaveBeenCalledWith('Cyberpunk')
  })
})
