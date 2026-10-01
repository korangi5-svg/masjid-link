'use client'

import { useEffect, useRef } from 'react'
import type { LayerGroup, Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { directionsUrl } from '@/lib/geo'
import { cn } from '@/lib/utils'
import type { Masjid } from '@/lib/types'

type LatLng = { lat: number; lng: number }

const masjidPin = `
<svg viewBox="0 0 32 40" width="32" height="40" aria-hidden="true">
  <path d="M16 0C7.2 0 0 7 0 15.7 0 27 16 40 16 40s16-13 16-24.3C32 7 24.8 0 16 0z" fill="#063b70"/>
  <circle cx="16" cy="15" r="9" fill="#fff"/>
  <path d="M16 8.5c-1.4 1.6-4.5 3.2-4.5 6.3V20h9v-5.2c0-3.1-3.1-4.7-4.5-6.3z" fill="#079b70"/>
</svg>`

const originDot = '<span class="masjid-map-origin" aria-hidden="true"></span>'

export function MasjidMap({
  masjids,
  origin,
  showLinks = true,
  className,
}: {
  masjids: Masjid[]
  origin?: LatLng | null
  showLinks?: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const layerRef = useRef<LayerGroup | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      const L = leafletRef.current ?? (await import('leaflet'))
      if (cancelled || !containerRef.current) return
      leafletRef.current = L

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { scrollWheelZoom: false })
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapRef.current)
        layerRef.current = L.layerGroup().addTo(mapRef.current)
      }

      const map = mapRef.current
      const layer = layerRef.current!
      layer.clearLayers()

      const points: [number, number][] = []
      const icon = L.divIcon({ html: masjidPin, className: 'masjid-map-pin', iconSize: [32, 40], iconAnchor: [16, 40], popupAnchor: [0, -36] })

      for (const m of masjids) {
        points.push([m.latitude, m.longitude])
        L.marker([m.latitude, m.longitude], { icon, title: m.name, alt: m.name })
          .bindPopup(() => popupContent(m, showLinks))
          .addTo(layer)
      }

      if (origin) {
        points.push([origin.lat, origin.lng])
        L.marker([origin.lat, origin.lng], {
          icon: L.divIcon({ html: originDot, className: '', iconSize: [18, 18] }),
          title: 'Search location',
          keyboard: false,
          zIndexOffset: 1000,
        }).addTo(layer)
      }

      if (points.length > 1) {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 })
      } else if (points.length === 1) {
        map.setView(points[0], 15)
      } else {
        map.setView([20, 0], 2)
      }
    }

    void render()
    return () => {
      cancelled = true
    }
  }, [masjids, origin, showLinks])

  useEffect(() => {
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Map of masjids"
      className={cn('relative z-0 overflow-hidden rounded-2xl border border-border bg-surface', className)}
    />
  )
}

// Built with DOM APIs (not HTML strings) because names and addresses come from OpenStreetMap.
function popupContent(m: Masjid, showLinks: boolean) {
  const root = document.createElement('div')
  root.className = 'masjid-map-popup'

  const title = document.createElement('strong')
  title.textContent = m.name
  root.append(title)

  const address = [m.address, m.city].filter(Boolean).join(', ')
  if (address) {
    const p = document.createElement('span')
    p.textContent = address
    root.append(p)
  }

  if (showLinks) {
    const meta = document.createElement('span')
    meta.textContent = `${m.distanceKm} km away`
    root.append(meta)

    const link = document.createElement('a')
    link.href = `/masjids/${encodeURIComponent(m.id)}`
    link.textContent = 'View details →'
    root.append(link)
  }

  const directions = document.createElement('a')
  directions.href = directionsUrl(m.latitude, m.longitude)
  directions.target = '_blank'
  directions.rel = 'noopener noreferrer'
  directions.textContent = 'Directions'
  root.append(directions)

  return root
}
