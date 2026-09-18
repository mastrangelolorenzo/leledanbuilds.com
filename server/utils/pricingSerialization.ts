export function serializeFeatures(features: string[]): string {
  return JSON.stringify(features)
}

export function parseFeatures(json: string): string[] {
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed) ? parsed.filter((f): f is string => typeof f === 'string') : []
  } catch {
    return []
  }
}
