import { useState } from 'react'
import { PageHeader, Panel } from '../components/ui'
import RoutePlanner from '../components/routing/RoutePlanner'
import RouteTimeline from '../components/routing/RouteTimeline'
import RouteTypeSelector from '../components/routing/RouteTypeSelector'
import RouteCard from '../components/routing/RouteCard'
import RouteMap from '../components/routing/RouteMap'
import RouteDetails from '../components/routing/RouteDetails'
import { calculateSafeRoute, getRoadLocations } from '../services/routingService'
import { floodForecast } from '../services/floodEngine'

function SafeRoutePage() {
  const locations = getRoadLocations()
  const [startId, setStartId] = useState('KURLA')
  const [destinationId, setDestinationId] = useState('SION')
  const [selectedTime, setSelectedTime] = useState('NOW')
  const [routeType, setRouteType] = useState('Commuter')
  const routingResult = calculateSafeRoute(startId, destinationId, selectedTime, routeType)
  const updateStart = (value) => { setStartId(value); if (value === destinationId) setDestinationId(locations.find((location) => location.id !== value)?.id || destinationId) }
  const updateDestination = (value) => { setDestinationId(value); if (value === startId) setStartId(locations.find((location) => location.id !== value)?.id || startId) }
  return <>
    <PageHeader eyebrow="Navigation resilience" title="Flood-Safe Routes" description="Compare routes around predicted water depths for emergency services, public transit and commuters." action={<span className="prototype-label">DEMO MODE · SIMULATED ROUTING</span>} />
    <RoutePlanner locations={locations} startId={startId} destinationId={destinationId} onStartChange={updateStart} onDestinationChange={updateDestination} />
    <Panel className="route-controls-panel"><div className="route-control-row"><div><span className="eyebrow">Forecast-aware routing</span><h2>Travel conditions at {selectedTime}</h2><p className="muted">The route graph recalculates from the coupled flood engine.</p></div><RouteTimeline forecast={floodForecast} selectedTime={selectedTime} onSelectTime={setSelectedTime} /></div><RouteTypeSelector selectedType={routeType} onSelectType={setRouteType} /></Panel>
    <div className="route-workspace"><Panel className="route-map-panel"><div className="panel-heading"><div><span className="eyebrow">Flood-aware navigation map</span><h2>{routingResult.start.name} to {routingResult.destination.name}</h2></div><span className="route-map-status">{routingResult.availableSafeRoutes} passable routes</span></div><RouteMap routingResult={routingResult} /></Panel><div className="route-results"><RouteCard route={routingResult.recommended} tone="recommended" /><RouteCard route={routingResult.alternative} tone="alternative" /><RouteCard route={routingResult.shortestNormal} tone="shortest" /></div></div>
    <RouteDetails routingResult={routingResult} />
  </>
}

export default SafeRoutePage
