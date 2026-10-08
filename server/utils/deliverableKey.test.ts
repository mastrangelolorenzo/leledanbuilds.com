import { describe, it, expect } from 'vitest'
import { buildDeliverableKey, isValidDeliverableKey, PART_SIZE_BYTES, MAX_PARTS } from './deliverableKey'

describe('buildDeliverableKey', () => {
  it('produces a key its own validator accepts', () => {
    for (const ext of ['zip', 'rar', '7z', 'schem', 'schematic', 'litematic', 'mcworld', 'pdf']) {
      expect(isValidDeliverableKey(buildDeliverableKey(ext)), ext).toBe(true)
    }
  })

  it('produces a distinct key each time', () => {
    expect(buildDeliverableKey('zip')).not.toBe(buildDeliverableKey('zip'))
  })
})

describe('isValidDeliverableKey', () => {
  it('rejects a key outside the deliverables prefix', () => {
    // This is the one that matters: writing outside deliverables/ could land
    // the paid file where the public /uploads/ route would serve it.
    expect(isValidDeliverableKey('images/3f2504e0-4f89-41d3-9a0c-0305e82c3301.zip')).toBe(false)
    expect(isValidDeliverableKey('3f2504e0-4f89-41d3-9a0c-0305e82c3301.zip')).toBe(false)
  })

  it('rejects path traversal', () => {
    expect(isValidDeliverableKey('deliverables/../images/x.zip')).toBe(false)
    expect(isValidDeliverableKey('../deliverables/3f2504e0-4f89-41d3-9a0c-0305e82c3301.zip')).toBe(false)
    expect(isValidDeliverableKey('deliverables/sub/3f2504e0-4f89-41d3-9a0c-0305e82c3301.zip')).toBe(false)
  })

  it('rejects a disallowed extension', () => {
    expect(isValidDeliverableKey('deliverables/3f2504e0-4f89-41d3-9a0c-0305e82c3301.exe')).toBe(false)
    expect(isValidDeliverableKey('deliverables/3f2504e0-4f89-41d3-9a0c-0305e82c3301.html')).toBe(false)
  })

  it('rejects a non-UUID body', () => {
    expect(isValidDeliverableKey('deliverables/anything.zip')).toBe(false)
    expect(isValidDeliverableKey('deliverables/.zip')).toBe(false)
  })

  it('rejects anything appended after the extension', () => {
    expect(isValidDeliverableKey('deliverables/3f2504e0-4f89-41d3-9a0c-0305e82c3301.zip.exe')).toBe(false)
    expect(isValidDeliverableKey('deliverables/3f2504e0-4f89-41d3-9a0c-0305e82c3301.zip?x=1')).toBe(false)
    expect(isValidDeliverableKey('deliverables/3f2504e0-4f89-41d3-9a0c-0305e82c3301.zip\n')).toBe(false)
  })

  it('rejects uppercase hex, which buildDeliverableKey never emits', () => {
    expect(isValidDeliverableKey('deliverables/3F2504E0-4F89-41D3-9A0C-0305E82C3301.zip')).toBe(false)
  })

  it('rejects non-strings', () => {
    expect(isValidDeliverableKey(undefined)).toBe(false)
    expect(isValidDeliverableKey(null)).toBe(false)
    expect(isValidDeliverableKey(42)).toBe(false)
    expect(isValidDeliverableKey({})).toBe(false)
  })
})

describe('part sizing', () => {
  it('meets R2 minimum part size of 5 MiB', () => {
    expect(PART_SIZE_BYTES).toBeGreaterThanOrEqual(5 * 1024 * 1024)
  })

  it('stays well under the 128 MiB isolate limit when a part is buffered', () => {
    expect(PART_SIZE_BYTES).toBeLessThan(32 * 1024 * 1024)
  })

  it('allows a file far larger than the old 25 MB single-shot cap', () => {
    expect(PART_SIZE_BYTES * MAX_PARTS).toBeGreaterThan(50 * 1024 * 1024 * 1024)
  })
})
