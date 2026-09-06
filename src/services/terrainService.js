import terrain from '../data/terrain.json'

export function getTerrainZones() {
  return terrain.zones
}

export function calculateAccumulationPotential(zone) {
  const elevationFactor = Math.max(0.2, 1 - zone.elevation / 25)
  const slopeFactor = Math.max(0.25, 1 - zone.slope / 12)
  return Math.min(1, Math.max(0, (zone.accumulationPotential * 0.55) + (elevationFactor * 0.3) + (slopeFactor * 0.15)))
}

export function calculateSurfaceRunoff(rainfallIntensity, zone, imperviousFactor = 0.78) {
  const terrainPotential = calculateAccumulationPotential(zone)
  const runoffCoefficient = Math.min(0.98, imperviousFactor + (terrainPotential * 0.12))
  return Number((rainfallIntensity * runoffCoefficient * (1 + terrainPotential * 0.45)).toFixed(2))
}
