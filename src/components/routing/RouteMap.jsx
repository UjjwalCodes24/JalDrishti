import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import roadNetwork from '../../data/roadNetwork.json'

const routeColors = { recommended: '#198754', alternative: '#d97706', shortest: '#c2413b' }

function MapViewport({ start, destination }) {
  const map = useMap()
  const points = [start, destination].filter(Boolean).map((point) => [point.latitude, point.longitude])
  if (points.length === 2) map.fitBounds(points, { padding: [35, 35] })
  return null
}

function RouteMap({ routingResult }) {
  const nodeLookup = Object.fromEntries(roadNetwork.nodes.map((node) => [node.id, node]))
  const routeLines = [
    ['recommended', routingResult.recommended],
    ['alternative', routingResult.alternative],
    ['shortest', routingResult.shortestNormal],
  ].filter(([, route]) => route)
  return <div className="route-map-wrap"><MapContainer center={[19.073, 72.872]} zoom={12} scrollWheelZoom className="route-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapViewport start={routingResult.start} destination={routingResult.destination} />{routeLines.map(([type, route]) => route.segments.map((segment, index) => { const source = nodeLookup[segment.from]; const target = nodeLookup[segment.to]; return <Polyline key={`${type}-${segment.id}-${index}`} positions={[[source.latitude, source.longitude], [target.latitude, target.longitude]]} pathOptions={{ color: routeColors[type], weight: type === 'shortest' ? 4 : 6, opacity: type === 'shortest' ? .72 : .9, dashArray: type === 'shortest' ? '8 7' : undefined }}><Popup><strong>{segment.name}</strong><br />{segment.floodDepth} cm predicted depth · {segment.status}</Popup></Polyline> }))}{roadNetwork.nodes.map((node) => <CircleMarker key={node.id} center={[node.latitude, node.longitude]} radius={node.id === routingResult.start.id || node.id === routingResult.destination.id ? 8 : 5} pathOptions={{ color: node.id === routingResult.start.id ? '#198754' : node.id === routingResult.destination.id ? '#2563eb' : '#53636a', fillColor: '#fff', fillOpacity: 1, weight: 2 }}><Popup><strong>{node.name}</strong></Popup></CircleMarker>)}</MapContainer><div className="route-map-legend"><span><i style={{ background: routeColors.recommended }} />Recommended safe</span><span><i style={{ background: routeColors.alternative }} />Alternative</span><span><i style={{ background: routeColors.shortest }} />Shortest normal</span><span><i className="blocked-dot" />Blocked segment</span></div></div>
}

export default RouteMap
