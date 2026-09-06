import { getRainfallForecast } from './rainfallService'

export function getForecast() {
  return getRainfallForecast()
}

export function getPeakForecast(series = getForecast()) {
  return series.reduce((peak, point) => point.intensity > peak.intensity ? point : peak, series[0])
}

export function getForecastDirection(series = getForecast()) {
  const first = series[0]?.intensity ?? 0
  const peak = getPeakForecast(series).intensity
  return peak > first ? 'Increasing' : 'Easing'
}

export function getForecastConfidence(point, dataSource) {
  const horizonPenalty = Math.min(18, (point.offsetMinutes || 0) / 20)
  return Math.round(Math.max(0, (point.confidence * 0.55) + (dataSource.dataQuality * 0.2) + (dataSource.radarCoverage * 0.15) + (dataSource.stationCoverage * 0.1) - horizonPenalty))
}
