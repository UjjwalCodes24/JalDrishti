import { getFloodPrediction } from './floodEngine'
import { calculateSafeRoute, getRoadNetwork } from './routingService'

export function getEmergencySnapshot(time = 'NOW') {
  const prediction = getFloodPrediction(time)
  const affected = prediction.streets.filter((street) => street.waterDepth >= 15)
  const critical = prediction.streets.filter((street) => street.risk === 'CRITICAL')
  const route = calculateSafeRoute('KURLA', 'SION', time, 'Emergency Vehicle')
  return { prediction, affected, critical, route, network: getRoadNetwork(), criticalZones: critical.length, roadsAffected: affected.length, firstImpact: critical.length ? '~45 min' : '~60 min' }
}

export function getRoadDecision(street) {
  if (street.waterDepth >= 60) return { status: 'CLOSE', action: 'Restrict all non-emergency vehicles' }
  if (street.waterDepth >= 30) return { status: 'RESTRICT', action: 'Emergency access only' }
  if (street.waterDepth >= 15) return { status: 'RESTRICT', action: 'Monitor and limit heavy vehicles' }
  return { status: 'OPEN WITH CAUTION', action: 'Monitor continuously' }
}
