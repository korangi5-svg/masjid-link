// One-off import of every masjid in the preload regions into Supabase, so searches there are instant.
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local. Run: pnpm preload:masjids
import { PRELOAD_REGIONS, preloadRegion } from '@/lib/services/osm-preload'

async function main() {
  const only = process.argv.slice(2)
  const regions = only.length ? PRELOAD_REGIONS.filter((r) => only.some((o) => r.id.endsWith(o))) : PRELOAD_REGIONS
  let failed = 0

  for (const region of regions) {
    const started = Date.now()
    process.stdout.write(`${region.label.padEnd(16)} … `)
    try {
      const count = await preloadRegion(region)
      console.log(`${count} masjids in ${Math.round((Date.now() - started) / 1000)}s`)
    } catch (error) {
      failed++
      console.log(`FAILED: ${error instanceof Error ? error.message : error}`)
    }
  }

  if (failed) {
    console.log(`\n${failed} region(s) failed — rerun with their names, e.g. pnpm preload:masjids us-east`)
    process.exit(1)
  }
}

void main()
