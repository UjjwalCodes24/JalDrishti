import { useEffect } from 'react'
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const riskColors = { CRITICAL: '#c84b43', HIGH: '#d9982f', MODERATE: '#d9982f', LOW: '#2f7f9d' }

function focusTarget(map, focusedStreet, streets) {
  const street = streets.find((item) => item.id === focusedStreet)
  if (street) map.flyTo([street.latitude, street.longitude], 14, { duration: .7 })
}

function MapFocus({ focusedStreet, streets }) {
  const map = useMap()
  useEffect(() => { focusTarget(map, focusedStreet, streets) }, [focusedStreet, map, streets])
  return null
}

function responseIcon(label, color) {
  return L.divIcon({ className: 'response-marker-wrapper', html: `<span class="response-marker" style="--marker-color:${color}">${label}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] })
}

function EmergencyResponseMap({ streets, safeRoute, teamLocations, focusedStreet, onFocusStreet }) {
  return <div className="response-map-wrap"><MapContainer center={[19.076, 72.8777]} zoom={11} scrollWheelZoom className="response-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapFocus focusedStreet={focusedStreet} streets={streets} />{streets.map((street) => <Circle key={`zone-${street.id}`} center={[street.latitude, street.longitude]} radius={Math.max(260, Math.min(900, street.waterDepth * 7))} pathOptions={{ color: riskColors[street.risk], fillColor: riskColors[street.risk], fillOpacity: focusedStreet === street.id ? .36 : .2, weight: focusedStreet === street.id ? 3 : 1.5 }} />)}{streets.map((street) => <CircleMarker key={street.id} center={[street.latitude, street.longitude]} radius={Math.max(8, Math.min(22, street.waterDepth / 4))} pathOptions={{ color: riskColors[street.risk], fillColor: riskColors[street.risk], fillOpacity: .9, weight: focusedStreet === street.id ? 4 : 2 }} eventHandlers={{ click: () => onFocusStreet(street.id) }}><Popup><div className="map-popup response-popup"><span className="eyebrow">Priority location</span><strong>{street.name}</strong><div><b>{street.risk}</b> · {street.waterDepth} cm predicted</div><small>Expected onset · {street.id === 'ST-KUR-01' ? '~45 min' : 'before +60 min'}<br />Click the plan card to focus this location.</small></div></Popup></CircleMarker>)}{safeRoute?.segments.map((segment, index) => { const source = safeRoute.nodes?.[segment.source]; const target = safeRoute.nodes?.[segment.target]; return source && target ? <Polyline key={`${segment.id}-${index}`} positions={[[source.latitude, source.longitude], [target.latitude, target.longitude]]} pathOptions={{ color: '#198754', weight: 5, opacity: .9 }} /> : null })}{teamLocations.map((team) => <Marker key={team.id} position={[team.latitude, team.longitude]} icon={responseIcon('👷', '#147d7e')}><Popup><div className="map-popup"><strong>{team.name}</strong><small>{team.status} · {team.assignment}</small></div></Popup></Marker>)}</MapContainer><div className="response-map-legend"><span><i className="critical-dot" />Critical flood zone</span><span><i className="high-dot" />High-risk zone</span><span><i className="closed-line" />Closed/restricted road</span><span><i className="safe-line" />Emergency-safe route</span><span>👷 Response team</span></div></div>
}

export default EmergencyResponseMap
