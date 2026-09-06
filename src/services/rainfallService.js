import { getRainfallInput } from './dataSourceService'

export function getRainfallObservations() {
  return getRainfallInput().observations
}

export function getRainfallForecast() {
  return getRainfallInput().forecast
}

export function getRainfallSourceStatus() {
  return getRainfallInput().dataSource
}
