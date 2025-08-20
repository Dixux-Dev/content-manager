// TypeScript helper functions to avoid 'any' type errors in callbacks

/**
 * Typed filter function for arrays to avoid implicit 'any' parameter errors
 */
export function safeFilter<T>(
  array: T[], 
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  return array.filter(predicate)
}

/**
 * Typed forEach function for arrays to avoid implicit 'any' parameter errors
 */
export function safeForEach<T>(
  array: T[], 
  callback: (item: T, index: number, array: T[]) => void
): void {
  array.forEach(callback)
}

/**
 * Typed map function for arrays to avoid implicit 'any' parameter errors
 */
export function safeMap<T, U>(
  array: T[], 
  callback: (item: T, index: number, array: T[]) => U
): U[] {
  return array.map(callback)
}

/**
 * Typed some function for arrays to avoid implicit 'any' parameter errors
 */
export function safeSome<T>(
  array: T[], 
  predicate: (item: T, index: number, array: T[]) => boolean
): boolean {
  return array.some(predicate)
}

/**
 * Helper for filtering out null/undefined values with proper typing
 */
export function filterNonNull<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item: T | null | undefined): item is T => item != null)
}

/**
 * Type-safe JSON parsing for Prisma JsonValue
 */
export function parseJsonValue(value: unknown): any {
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

/**
 * Check if value is string array (for categories)
 */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
}