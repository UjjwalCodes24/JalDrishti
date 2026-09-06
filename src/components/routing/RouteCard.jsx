import { Panel, RiskBadge } from '../ui'

function RouteCard({ route, tone }) {
  if (!route) return <Panel className="route-card route-unavailable"><span className="route-card-kicker">NO SAFE ROUTE FOUND</span><h3>All passable paths are affected</h3><p>Try another departure time or choose a different destination.</p></Panel>
  const badgeLevel = route.safetyRating === 'SAFE' ? 'Low' : route.safetyRating === 'PASSABLE' || route.safetyRating === 'CAUTION' ? 'Moderate' : 'High'
  return <Panel className={`route-card route-${tone}`}><div className="route-card-heading"><div><span className="route-card-kicker">{route.name}</span><h3>{route.safetyRating}</h3></div><RiskBadge level={badgeLevel} /></div><div className="route-stat-grid"><div><strong>{route.safetyScore}</strong><span>Safety score</span></div><div><strong>{route.distance} km</strong><span>Distance</span></div><div><strong>{route.travelTime} min</strong><span>Travel time</span></div><div><strong>{route.maximumWaterDepth} cm</strong><span>Max water depth</span></div></div><div className="route-card-footer"><span>{route.roadsAvoided} flooded roads avoided</span><span>{route.segments.length} road segments</span></div>{route.reason && <p className="route-reason">{route.reason}</p>}</Panel>
}

export default RouteCard
