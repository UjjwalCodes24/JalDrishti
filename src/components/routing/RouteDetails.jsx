import { Panel } from '../ui'

export default function RouteDetails({ routingResult }) {
  const affected = routingResult.segments.filter((segment) => segment.status !== 'OPEN')
  return <Panel className="route-details"><div className="panel-heading"><div><span className="eyebrow">Flood impact analysis</span><h2>Road conditions at {routingResult.time}</h2></div><span className="prototype-label">SIMULATED ROUTING</span></div>{affected.length === 0 ? <p className="route-clear">All mapped road segments are open at this forecast time.</p> : <div className="road-condition-list">{affected.map((segment) => <div className={`road-condition ${segment.status.toLowerCase()}`} key={segment.id}><div><strong>{segment.name}</strong><span>{segment.status} · {segment.floodDepth} cm predicted water depth</span></div><b>{segment.status === 'BLOCKED' ? '⛔' : '💧'}</b></div>)}</div>}</Panel>
}
