import drainageNetwork from '../data/drainageNetwork.json'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function getDrainageNetwork() {
  return drainageNetwork
}

export function calculateNetworkUtilization(node) {
  return Number((node.currentLoad / node.capacity).toFixed(2))
}

export function calculateDrainageStatus(rainfallIntensity, runoffDemand = 0) {
  const nodeDemand = rainfallIntensity * 0.34 + runoffDemand * 0.2
  const nodes = drainageNetwork.nodes.map((node) => {
    const load = Number((node.currentLoad + nodeDemand).toFixed(2))
    const utilization = load / node.capacity
    return { ...node, currentLoad: load, utilization: Number(utilization.toFixed(2)), status: utilization >= 1 ? 'overloaded' : utilization >= 0.8 ? 'watch' : 'normal' }
  })
  const edges = drainageNetwork.edges.map((edge) => {
    const effectiveCapacity = edge.blocked ? edge.hydraulicCapacity * 0.42 : edge.hydraulicCapacity
    const flow = Number((edge.currentFlow + rainfallIntensity * 0.32 + runoffDemand * 0.12).toFixed(2))
    return { ...edge, effectiveCapacity: Number(effectiveCapacity.toFixed(2)), currentFlow: flow, utilization: Number((flow / effectiveCapacity).toFixed(2)), status: flow >= effectiveCapacity ? 'overloaded' : flow / effectiveCapacity >= 0.8 ? 'watch' : 'normal' }
  })
  const overloadedNodes = nodes.filter((node) => node.status === 'overloaded')
  const overloadedEdges = edges.filter((edge) => edge.status === 'overloaded')
  const blockageImpact = edges.filter((edge) => edge.blocked).reduce((sum, edge) => sum + (edge.hydraulicCapacity - edge.effectiveCapacity), 0)
  const utilization = nodes.reduce((sum, node) => sum + node.utilization, 0) / nodes.length
  const surchargeRisk = clamp((utilization - 0.72) * 1.8 + overloadedEdges.length * 0.12 + blockageImpact / 180)
  const backflowProbability = clamp(surchargeRisk * 0.72 + (overloadedNodes.length ? 0.16 : 0))
  return { nodes, edges, utilization: Number(utilization.toFixed(2)), overloadedNodes, overloadedEdges, blockageImpact: Number(blockageImpact.toFixed(2)), surchargeRisk: Number(surchargeRisk.toFixed(2)), backflowProbability: Number(backflowProbability.toFixed(2)) }
}
