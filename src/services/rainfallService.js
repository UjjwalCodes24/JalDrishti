import { getRainfallInput } from './dataSourceService'

export function getRainfallObservations(regionId) {
  return getRainfallInput(regionId).observations
}

export function getRainfallForecast(regionId) {
  return getRainfallInput(regionId).forecast
}

export function getRainfallSourceStatus(regionId) {
  return getRainfallInput(regionId).dataSource
}
