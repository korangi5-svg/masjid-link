'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { PageHeader } from '@/components/site/page-header'
import { loadSavedArea } from '@/lib/saved-area'
import { inputClass, primaryButton, secondaryButton } from '@/lib/site'

const serviceGroups = [
  {
    title: 'Travel services',
    services: [
      { name: 'Travel agents', query: 'travel agencies', description: 'Find local travel agents and check their listed phone numbers for help booking flights.' },
      { name: 'Car rentals', query: 'car rental agencies', description: 'Find rental offices near your destination or airport and open their websites to check booking options.' },
    ],
  },
  {
    title: 'Services for residents and newcomers',
    services: [
      { name: 'Lawyers', query: 'law firms', description: 'Find local lawyers and ask about their practice areas and languages.' },
      { name: 'Immigration lawyers', query: 'immigration lawyers', description: 'Find lawyers who handle immigration matters in the area.' },
      { name: 'Real estate agents', query: 'real estate agents for home buyers', description: 'Find agents who can help you look for a home in the area.' },
    ],
  },
  {
    title: 'Everyday essentials',
    services: [
      { name: 'Halal food', query: 'halal restaurants', description: 'Find nearby restaurants and ask about their halal options.' },
      { name: 'Halal groceries', query: 'halal grocery stores', description: 'Find local shops for groceries and halal meat.' },
      { name: 'Pharmacies', query: 'pharmacies', description: 'Find nearby pharmacies and check their opening hours.' },
    ],
  },
]

function mapsSearch(service: string, area: string) {
  const parameters = new URLSearchParams({
    api: '1',
    query: area ? `${service} near ${area}` : `${service} near me`,
  })
  return `https://www.google.com/maps/search/?${parameters}`
}

export default function LocalServicesPage() {
  const [location, setLocation] = useState('')
  const [area, setArea] = useState('')

  useEffect(() => {
    const saved = loadSavedArea()
    if (saved) {
      setLocation(saved.label)
      setArea(saved.label)
    }
  }, [])

  function selectArea(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setArea(location.trim())
  }

  function searchNearby() {
    setLocation('')
    setArea('')
  }

  return (
    <>
      <PageHeader
        eyebrow="Travel and everyday needs"
        title="Local Services"
        description="Find travel agents, car rentals, lawyers, real estate agents, and everyday services near you or at your destination."
      />
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-3 rounded-2xl bg-surface p-5 sm:p-6">
          <form onSubmit={selectArea} className="flex flex-wrap items-end gap-3">
            <div className="min-w-0 grow">
              <label htmlFor="service-location" className="mb-2 block font-semibold text-navy">
                City, address, postal code, or airport
              </label>
              <input
                id="service-location"
                className={inputClass}
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="For example, Toronto Pearson Airport, Canada"
                maxLength={150}
              />
            </div>
            <button type="submit" className={primaryButton} disabled={!location.trim()}>Set location</button>
            <button type="button" className={secondaryButton} onClick={searchNearby}>Search near me</button>
          </form>
          <p role="status" className="text-sm text-muted-foreground">
            {area ? `Searching near ${area}.` : 'Google Maps will look for services near your current location when available.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Open a category in Google Maps to check listed phone numbers and provider websites.
          </p>
        </div>

        {serviceGroups.map((group) => (
          <section key={group.title}>
            <h2 className="mb-4 text-2xl font-bold text-navy">{group.title}</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.services.map((service) => (
                <li key={service.name} className="flex flex-col items-start gap-3 rounded-2xl border border-border p-5">
                  <h3 className="text-lg font-semibold text-navy">{service.name}</h3>
                  <p className="grow text-sm text-muted-foreground">{service.description}</p>
                  <a href={mapsSearch(service.query, area)} className={secondaryButton}>
                    Find {service.name.toLowerCase()} on Google Maps
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  )
}
