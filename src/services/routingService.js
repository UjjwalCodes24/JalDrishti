import roadNetwork from '../data/roadNetwork.json'
import { getFloodPrediction } from './floodEngine'

const statusPenalty = { OPEN: 1, CAUTION: 1.35, FLOODED: 4.5, BLOCKED: Number.POSITIVE_INFINITY }
const modeWeights = {
  'Emergency Vehicle': { safety: 2.2, time: 1.2, access: 1.5 },
  'Public Transport': { safety: 1.6, time: 0.9, access: 2.4 },
  Commuter: { safety: 1.8, time: 1.1, access: 1 },
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

export function getRoadLocations() {
  return roadNetwork.nodes
}

export function getRoadNetwork() {
  return roadNetwork
}

export function getSegmentStatus(waterDepth) {
  if (waterDepth > 30) return 'BLOCKED'
  if (waterDepth >= 15) return 'FLOODED'
  if (waterDepth >= 5) return 'CAUTION'
  return 'OPEN'
}

export function getFloodAwareSegments(prediction) {
  return roadNetwork.segments.map((segment) => {
    const street = prediction.streets.find((item) => item.id === segment.floodStreetId)
    const waterDepth = Number((street.waterDepth * segment.floodFactor).toFixed(1))
    return { ...segment, floodDepth: waterDepth, risk: street.risk, status: getSegmentStatus(waterDepth) }
  })
}

function buildAdjacency(segments) {
  return segments.reduce((graph, segment) => {
    const forward = { ...segment, from: segment.source, to: segment.target }
    const reverse = { ...segment, from: segment.target, to: segment.source }
    graph[segment.source] = [...(graph[segment.source] || []), forward]
    graph[segment.target] = [...(graph[segment.target] || []), reverse]
    return graph
  }, {})
}

function enumeratePaths(start, destination, segments) {
  const adjacency = buildAdjacency(segments)
  const paths = []
  function visit(node, path, visited) {
    if (node === destination) {
      paths.push(path)
      return
    }
    if (path.length >= 8) return
    for (const segment of adjacency[node] || []) {
      if (!visited.has(segment.to)) visit(segment.to, [...path, segment], new Set([...visited, segment.to]))
    }
  }
  visit(start, [], new Set([start]))
  return paths
}

function summarizePath(path, mode, includeBlocked = false) {
  const weights = modeWeights[mode] || modeWeights.Commuter
  const distance = path.reduce((sum, segment) => sum + segment.distance, 0)
  const travelTime = path.reduce((sum, segment) => sum + segment.travelTime * (Number.isFinite(statusPenalty[segment.status]) ? statusPenalty[segment.status] : 3), 0)
  const maximumWaterDepth = Math.max(...path.map((segment) => segment.floodDepth), 0)
  const exposure = path.reduce((sum, segment) => sum + segment.floodDepth * segment.distance, 0) / Math.max(distance, 1)
  const blockedSegments = path.filter((segment) => segment.status === 'BLOCKED')
  const floodedSegments = path.filter((segment) => segment.status === 'FLOODED')
  const cautionSegments = path.filter((segment) => segment.status === 'CAUTION')
  const safetyScore = Math.round(clamp(100 - exposure * 2.1 - blockedSegments.length * 28 - floodedSegments.length * 12 - cautionSegments.length * 3, 0, 100))
  const routeCost = distance * 1.1 + travelTime * weights.time + exposure * weights.safety + floodedSegments.length * weights.access * 12 + blockedSegments.length * 1000
  return { segments: path, distance: Number(distance.toFixed(1)), travelTime: Math.round(travelTime), maximumWaterDepth, exposureScore: Number(exposure.toFixed(1)), safetyScore, blockedSegments, floodedSegments, cautionSegments, roadsAvoided: blockedSegments.length + floodedSegments.length, routeCost, includeBlocked }
}

function routeReason(route) {
  const blockingRoad = route.blockedSegments[0] || route.floodedSegments[0]
  if (!blockingRoad) return 'No flooded roads on this route at the selected forecast time.'
  const reason = blockingRoad.status === 'BLOCKED' ? 'blocked' : 'unsafe for normal travel'
  return `Route ${reason} because ${blockingRoad.name} is predicted to reach ${blockingRoad.floodDepth} cm water depth at the selected forecast time.`
}

export function calculateSafeRoute(startId, destinationId, time = 'NOW', mode = 'Commuter') {
  const prediction = typeof time === 'string' ? getFloodPrediction(time) : time
  const segments = getFloodAwareSegments(prediction)
  const allPaths = enumeratePaths(startId, destinationId, segments)
  const safePaths = allPaths.filter((path) => !path.some((segment) => segment.status === 'BLOCKED'))
  const summarizedSafe = safePaths.map((path) => summarizePath(path, mode)).sort((a, b) => a.routeCost - b.routeCost)
  const normalRoute = allPaths.map((path) => summarizePath(path, mode, true)).sort((a, b) => a.distance - b.distance)[0]
  const recommended = summarizedSafe[0] || null
  const alternative = summarizedSafe.find((route) => route !== recommended) || null
  return {
    start: roadNetwork.nodes.find((node) => node.id === startId),
    destination: roadNetwork.nodes.find((node) => node.id === destinationId),
    time: prediction.time,
    mode,
    segments,
    recommended: recommended ? { ...recommended, name: 'RECOMMENDED SAFE ROUTE', safetyRating: recommended.safetyScore >= 80 ? 'SAFE' : 'CAUTION', reason: routeReason(recommended) } : null,
    alternative: alternative ? { ...alternative, name: 'ALTERNATIVE ROUTE', safetyRating: alternative.safetyScore >= 65 ? 'PASSABLE' : 'CAUTION', reason: routeReason(alternative) } : null,
    shortestNormal: normalRoute ? { ...normalRoute, name: 'SHORTEST NORMAL ROUTE', safetyRating: normalRoute.blockedSegments.length || normalRoute.floodedSegments.length ? 'UNSAFE' : normalRoute.cautionSegments.length ? 'CAUTION' : 'SAFE', reason: routeReason(normalRoute) } : null,
    availableSafeRoutes: summarizedSafe.length,
    blockedRoads: segments.filter((segment) => segment.status === 'BLOCKED'),
  }
}
