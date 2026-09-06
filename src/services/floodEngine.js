import rainfall from '../data/rainfall.json'
import floodPredictions from '../data/floodPredictions.json'
import streets from '../data/streets.json'
import terrain from '../data/terrain.json'
import { calculateAccumulationPotential, calculateSurfaceRunoff } from './terrainService'
import { calculateDrainageStatus } from './drainageService'

export const forecastTimes = rainfall.forecast.map((point) => point.time)

export function calculateRunoff(rainfallIntensity, zone) {
  return calculateSurfaceRunoff(rainfallIntensity, zone)
}

export function calculateDrainageLoad(runoffVolume, rainfallIntensity) {
  return Number((runoffVolume * 0.2 + rainfallIntensity * 0.34).toFixed(2))
}

export function calculateSurcharge(drainageStatus) {
  return Number((drainageStatus.surchargeRisk * 100).toFixed(1))
}

export function calculateBackflowRisk(drainageStatus) {
  return Number((drainageStatus.backflowProbability * 100).toFixed(1))
}

export function calculateWaterDepth(runoffVolume, zone, drainageStatus) {
  const terrainPotential = calculateAccumulationPotential(zone)
  const drainagePenalty = 1 + drainageStatus.surchargeRisk * 1.55 + drainageStatus.backflowProbability * 0.65
  return Number(Math.max(0, runoffVolume * terrainPotential * 0.66 * drainagePenalty).toFixed(1))
}

export function calculateFloodRisk(depth) {
  if (depth >= floodPredictions.riskThresholds.critical) return 'CRITICAL'
  if (depth >= floodPredictions.riskThresholds.high) return 'HIGH'
  if (depth >= floodPredictions.riskThresholds.moderate) return 'MODERATE'
  return 'LOW'
}

export function runFloodEngine() {
  return rainfall.forecast.map((rainPoint) => {
    const streetPredictions = streets.streets.map((street) => {
      const zone = terrain.zones.find((item) => item.id === street.terrainZone)
      const runoffVolume = calculateRunoff(rainPoint.intensity, zone)
      const drainage = calculateDrainageStatus(rainPoint.intensity, runoffVolume)
      const depth = calculateWaterDepth(runoffVolume, zone, drainage)
      return { ...street, currentWaterDepth: street.currentWaterDepth ?? (rainPoint.offsetMinutes === 0 ? depth : 0), waterDepth: depth, predictedWaterDepth: depth, runoffVolume, drainageLoad: calculateDrainageLoad(runoffVolume, rainPoint.intensity), surcharge: calculateSurcharge(drainage), backflow: calculateBackflowRisk(drainage), risk: calculateFloodRisk(depth), terrain: zone }
    })
    const drainage = calculateDrainageStatus(rainPoint.intensity, streetPredictions.reduce((sum, item) => sum + item.runoffVolume, 0) / streetPredictions.length)
    return { ...rainPoint, streets: streetPredictions, drainage, highestWaterDepth: Math.max(...streetPredictions.map((item) => item.waterDepth)), criticalStreets: streetPredictions.filter((item) => item.risk === 'CRITICAL').length }
  })
}

export const floodForecast = runFloodEngine()

export function getFloodPrediction(time = 'NOW') {
  return floodForecast.find((point) => point.time === time) || floodForecast[0]
}

export function getFloodEngineSummary(time = 'NOW') {
  const prediction = getFloodPrediction(time)
  return { rainfall: prediction.intensity, peakRainfall: Math.max(...floodForecast.map((point) => point.intensity)), highestWaterDepth: prediction.highestWaterDepth, overloadedNodes: prediction.drainage.overloadedNodes.length, criticalStreets: prediction.criticalStreets, prediction }
}
