// Accounts and events depend on Firebase; hide them until it is configured so visitors don't hit dead ends.
export const firebaseEnabled = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
)

export const accountsEnabled = firebaseEnabled
export const eventsEnabled = firebaseEnabled
