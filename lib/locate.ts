export class LocateError extends Error {}

/** Browser geolocation as a promise, with a specific message for each way it can fail. */
export function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      reject(new LocateError('Location only works over a secure (https) connection. Search by city, address or postal code instead.'))
      return
    }
    if (!navigator.geolocation) {
      reject(new LocateError('This browser cannot share your location. Search by city, address or postal code instead.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const messages: Record<number, string> = {
          [err.PERMISSION_DENIED]:
            'Location access is blocked. Allow location for this site in your browser settings, or search by city, address or postal code.',
          [err.POSITION_UNAVAILABLE]:
            'Your device could not determine its location. Check that location services are on, or search by address instead.',
          [err.TIMEOUT]: 'Finding your location took too long. Try again, or search by address instead.',
        }
        reject(new LocateError(messages[err.code] ?? 'We could not get your location. Search by address instead.'))
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
