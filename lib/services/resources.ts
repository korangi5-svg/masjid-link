import { mockResources } from '@/lib/data/resources'
import { getSupabase } from '@/lib/supabase'
import type { ResourceCategory } from '@/lib/types'

// Resources are curated links, so the built-in list stays as the fallback until the table has rows.
export async function getResourceCategories(): Promise<ResourceCategory[]> {
  const supabase = getSupabase()
  if (!supabase) return mockResources

  const { data, error } = await supabase.from('resource_categories').select('id, title, description, links').order('sort_order')
  if (error) {
    console.error('[resources] Supabase read failed, using built-in list:', error.message)
    return mockResources
  }
  return data.length ? (data as ResourceCategory[]) : mockResources
}
