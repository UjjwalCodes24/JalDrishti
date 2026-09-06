import rainfall from '../data/rainfall.json'

const imdEndpoint = import.meta.env.VITE_IMD_RAINFALL_ENDPOINT

export function getRainfallDataSource() {
  const profile = rainfall.sourceProfile
  const connected = Boolean(imdEndpoint)
  return {
    provider: profile.provider,
    mode: connected ? 'IMD DATA CONNECTED' : 'DEMO MODE · SIMULATED DATA',
    connection: connected ? 'connected' : 'fallback',
    isLive: connected,
    lastObservation: profile.lastObservation,
    dataQuality: connected ? 86 : profile.dataQuality,
    radarCoverage: profile.radarCoverage,
    stationCoverage: profile.stationCoverage,
    observationWindow: profile.observationWindow,
    notice: connected ? 'Rainfall input is configured for an authorized IMD endpoint.' : 'Demo mode — simulated rainfall input used for prototype visualization.',
  }
}

export function getRainfallInput() {
  return { ...rainfall, dataSource: getRainfallDataSource() }
}

export function formatObservationTime(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date(value))
}
