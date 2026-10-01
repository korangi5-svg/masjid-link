export interface SavedArea {
  label: string
  lat: number
  lng: number
}

const KEY = 'masjidlink:area'

// Stored only on this device so returning visitors land on their own area.
export function loadSavedArea(): SavedArea | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const area = JSON.parse(raw) as SavedArea
    return Number.isFinite(area.lat) && Number.isFinite(area.lng) && area.label ? area : null
  } catch {
    return null
  }
}

export function saveArea(area: SavedArea) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...area, lat: round(area.lat), lng: round(area.lng) }))
  } catch {
    // Storage blocked (private mode etc.) — remembering is a convenience only.
  }
}

export function clearSavedArea() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}

function round(value: number) {
  return Math.round(value * 1e4) / 1e4
}
