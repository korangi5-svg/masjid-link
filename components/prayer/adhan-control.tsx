'use client'

import { useEffect, useRef, useState } from 'react'
import { DAILY_PRAYERS } from '@/lib/prayer'
import type { PrayerTimes } from '@/lib/types'

export function AdhanControl({ times, coords }: { times: PrayerTimes; coords?: { lat: number; lng: number } }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [schedule, setSchedule] = useState(times)
  const played = useRef(new Set<string>())
  const armedAt = useRef(Infinity)

  useEffect(() => { setSchedule(times) }, [times])

  useEffect(() => {
    if (!coords) return
    const controller = new AbortController()
    const refresh = async () => {
      try {
        const response = await fetch(`/api/prayer-times?lat=${coords.lat}&lng=${coords.lng}`, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) return
        const body = await response.json()
        if (body.prayerTimes) setSchedule(body.prayerTimes)
      } catch { /* Date validation below prevents stale playback on network failure. */ }
    }
    void refresh()
    const timer = setInterval(refresh, 60_000)
    return () => { controller.abort(); clearInterval(timer) }
  }, [coords?.lat, coords?.lng])

  useEffect(() => {
    if (!enabled) return
    const tick = () => {
      if (!schedule.timezone || !schedule.date) {
        setMessage('Waiting for current prayer times. Search your location again if needed.')
        return
      }
      const now = new Date()
      const date = new Intl.DateTimeFormat('en-CA', { timeZone: schedule.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
      if (date !== schedule.date) {
        setMessage('Updating today’s prayer times… Refresh the page if this continues.')
        return
      }
      const clock = new Intl.DateTimeFormat('en-US', { timeZone: schedule.timezone, hour: 'numeric', minute: '2-digit', hour12: true }).format(now)
      const prayer = DAILY_PRAYERS.find(({ key }) => schedule[key] === clock)
      if (!prayer || now.getTime() - armedAt.current < 1000) return
      const id = `${date}:${prayer.key}`
      if (played.current.has(id)) return
      // Shared between tabs; failure falls back to per-tab duplicate protection.
      try {
        if (localStorage.getItem('masjid-adhan-played') === id) return
        localStorage.setItem('masjid-adhan-played', id)
      } catch {}
      played.current.add(id)
      const player = audio.current
      if (!player) return
      player.currentTime = 0
      void player.play().then(() => setMessage(`${prayer.label} Adhan is playing.`)).catch(() => {
        setEnabled(false)
        setMessage('Your browser blocked sound. Tap Enable Adhan again.')
      })
    }
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [enabled, schedule])

  async function enable() {
    const player = audio.current
    if (!player) return
    try {
      await player.play()
      player.pause()
      player.currentTime = 0
      // Do not play a prayer that already began before the visitor enabled sound.
      armedAt.current = Math.ceil(Date.now() / 60_000) * 60_000
      setEnabled(true)
      setMessage('Adhan enabled for the five daily prayers in this location’s timezone.')
    } catch { setMessage('Unable to play audio. Check your browser sound settings and try again.') }
  }

  return (
    <div className="w-full space-y-2 text-sm">
      <audio ref={audio} src="/audio/adhan.mp3" preload="auto" onEnded={() => setMessage('Adhan finished. Waiting for the next prayer.')} />
      <div className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={enabled} className="rounded-lg border px-3 py-2 font-semibold" onClick={() => {
          if (enabled) { setEnabled(false); audio.current?.pause(); setMessage('Adhan disabled.') }
          else void enable()
        }}>{enabled ? 'Disable Adhan' : 'Enable Adhan'}</button>
        <button type="button" className="rounded-lg border px-3 py-2" onClick={() => {
          if (!audio.current) return
          audio.current.currentTime = 0
          void audio.current.play().then(() => setMessage('Playing Adhan preview.')).catch(() => setMessage('Audio could not play. Check your sound settings.'))
        }}>Test sound</button>
        <button type="button" className="rounded-lg border px-3 py-2" onClick={() => { audio.current?.pause(); setMessage('Playback stopped.') }}>Stop sound</button>
      </div>
      <p role="status" aria-live="polite">{message}</p>
      <p className="text-xs opacity-80">Keep this page open and your device awake. Enable sound after opening the page. Times follow the displayed location; local masjid schedules may differ. Sunrise has no Adhan.</p>
    </div>
  )
}
