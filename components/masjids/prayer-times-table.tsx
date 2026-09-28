import type { PrayerTimes } from '@/lib/types'

const rows: { key: keyof PrayerTimes; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
  { key: 'jumuah', label: "Jumu'ah" },
]

export function PrayerTimesTable({ times }: { times: PrayerTimes }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="bg-navy px-6 py-4">
        <h2 className="text-lg font-bold text-white">Iqamah times</h2>
        <p className="text-sm text-white/75">Times may change — please confirm with the masjid.</p>
      </div>
      <table className="w-full text-sm">
        <caption className="sr-only">Congregational prayer times</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Prayer</th>
            <th scope="col">Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.key} className={r.key === 'jumuah' ? 'bg-accent' : undefined}>
              <th scope="row" className="px-6 py-3.5 text-left font-medium text-navy">
                {r.label}
              </th>
              <td className="px-6 py-3.5 text-right font-semibold tabular-nums text-teal-dark">{times[r.key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
