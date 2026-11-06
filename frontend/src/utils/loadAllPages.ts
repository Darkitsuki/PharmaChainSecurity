import { apiClient } from '../services/apiClient';
import type { PageResult } from '../types';

// Used only by screens with client-side filters so totals cover the complete authorized list.
export async function loadAllPages<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const separator = path.includes('?') ? '&' : '?';
    const result = await apiClient<PageResult<T>>(`${path}${separator}page=${page}&pageSize=100`);
    items.push(...result.items);
    totalPages = result.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}
