// Accounts, events and the contact form depend on Supabase; hide them until it is configured so visitors don't hit dead ends.
// NEXT_PUBLIC_ vars must be referenced literally so Next.js can inline them into the browser bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabaseConfig = url && key ? { url, key } : null

export const backendEnabled = Boolean(supabaseConfig)
export const accountsEnabled = backendEnabled
export const eventsEnabled = backendEnabled
