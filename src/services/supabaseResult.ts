type Result<T> = { data: T | null; error: unknown }

export function unwrap<T>({ data, error }: Result<T>): T {
  if (error) throw error
  if (data === null) throw Object.assign(new Error('Not found'), { code: 'PGRST116' })
  return data
}

export function unwrapList<T>({ data, error }: Result<T[]>): T[] {
  if (error) throw error
  return data ?? []
}

export function unwrapVoid({ error }: { error: unknown }): void {
  if (error) throw error
}

export function unwrapCount({ count, error }: { count: number | null; error: unknown }): number {
  if (error) throw error
  return count ?? 0
}
