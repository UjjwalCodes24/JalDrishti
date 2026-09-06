import { floodForecast, getFloodPrediction } from './floodEngine'

export function getNowcastImpact(time = 'NOW') {
  const prediction = getFloodPrediction(time)
  const highRiskRoads = prediction.streets.filter((street) => street.risk === 'HIGH' || street.risk === 'CRITICAL').length
  const criticalRoads = prediction.streets.filter((street) => street.risk === 'CRITICAL').length
  const expectedPeak = floodForecast.reduce((peak, point) => point.highestWaterDepth > peak.highestWaterDepth ? point : peak, floodForecast[0])
  return {
    ...prediction,
    highRiskRoads,
    criticalRoads,
    expectedPeakTime: expectedPeak.time,
    criticalStatus: criticalRoads > 0 ? 'CRITICAL' : highRiskRoads > 0 ? 'WATCH' : 'STABLE',
  }
}

export function getForecastImpact() {
  return floodForecast.map((point) => getNowcastImpact(point.time))
}
