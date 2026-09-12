import { useEffect, useState, useRef } from 'react'
import { PageHeader, Panel } from '../components/ui'
import RoutePlanner from '../components/routing/RoutePlanner'
import RouteTimeline from '../components/routing/RouteTimeline'
import RouteTypeSelector from '../components/routing/RouteTypeSelector'
import RouteCard from '../components/routing/RouteCard'
import RouteMap from '../components/routing/RouteMap'
import RouteDetails from '../components/routing/RouteDetails'
import { floodForecast } from '../services/floodEngine'
import { calculateGoogleAwareSafeRoute } from '../services/googleMapsRoutingService'
import { calculateSafeRoute, getRoadLocations, resolveRoadLocationIds } from '../services/routingService'

const LOADING_STEPS = [
  'Requesting route alternatives from Google Routes API…',
  'Evaluating predicted water depth & terrain runoff…',
  'Checking drainage network surcharge & backflow…',
  'Ranking safest viable flood navigation corridors…',
]

function SafeRoutePage() {
  const locations = getRoadLocations()
  const [origin, setOrigin] = useState('Kurla Station')
  const [destination, setDestination] = useState('Sion Hospital')
  const [selectedTime, setSelectedTime] = useState('NOW')
  const [routeType, setRouteType] = useState('Emergency Vehicle')
  const [loading, setLoading] = useState(false)
  const [loadingStepIdx, setLoadingStepIdx] = useState(0)
  const [routingResult, setRoutingResult] = useState(() =>
    calculateSafeRoute('KURLA', 'SION', 'NOW', 'Emergency Vehicle'),
  )

  const loadingIntervalRef = useRef(null)

  const handleCalculate = async (
    customOrigin = origin,
    customDestination = destination,
    nextTime = selectedTime,
    nextMode = routeType,
  ) => {
    const { startId, destinationId } = resolveRoadLocationIds(customOrigin, customDestination)
    setLoading(true)
    setLoadingStepIdx(0)

    // Cycle through loading steps for professional command-center feedback
    loadingIntervalRef.current = window.setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length)
    }, 280)

    try {
      const result = await calculateGoogleAwareSafeRoute({
        origin: customOrigin,
        destination: customDestination,
        time: nextTime,
        mode: nextMode,
        fallbackStartId: startId,
        fallbackDestinationId: destinationId,
      })

      setRoutingResult(result)
    } catch {
      // Automatic fallback on any unexpected error
      const fallback = calculateSafeRoute(startId, destinationId, nextTime, nextMode)
      setRoutingResult({
        ...fallback,
        notice: 'Live Google routing unavailable — JalDrishti simulation active.',
      })
    } finally {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
      }
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    const { startId, destinationId } = resolveRoadLocationIds(origin, destination)

    calculateGoogleAwareSafeRoute({
      origin,
      destination,
      time: selectedTime,
      mode: routeType,
      fallbackStartId: startId,
      fallbackDestinationId: destinationId,
    })
      .then((res) => {
        if (active) setRoutingResult(res)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [origin, destination, selectedTime, routeType])

  const updateRouteTime = async (time) => {
    setSelectedTime(time)
    await handleCalculate(origin, destination, time, routeType)
  }

  const updateRouteType = async (mode) => {
    setRouteType(mode)
    await handleCalculate(origin, destination, selectedTime, mode)
  }

  const passableCount = routingResult.availableSafeRoutes ?? (routingResult.recommended?.viable ? 1 : 0)

  return (
    <>
      <PageHeader
        eyebrow="Navigation Resilience & Emergency Access"
        title="Flood-Safe Routes"
        description="Real-world Google Maps corridors evaluated against JalDrishti predicted flood depth, terrain runoff, and drainage overload to recommend the safest viable route."
        action={
          <span className={`prototype-label ${routingResult.googleMapsAvailable ? 'google-active' : ''}`}>
            {routingResult.googleMapsAvailable ? 'GOOGLE MAPS ROUTING ACTIVE' : 'JalDrishti Simulation Active (Fallback)'}
          </span>
        }
      />

      <RoutePlanner
        locations={locations}
        origin={origin}
        destination={destination}
        onOriginChange={setOrigin}
        onDestinationChange={setDestination}
        onCalculate={(o, d) => handleCalculate(o || origin, d || destination)}
        loading={loading}
        googleMapsAvailable={routingResult.googleMapsAvailable}
      />

      <Panel className="route-controls-panel">
        <div className="route-control-row">
          <div>
            <span className="eyebrow">FORECAST-AWARE TIMELINE</span>
            <h2>Travel conditions at forecast horizon: {selectedTime}</h2>
            <p className="muted">Safety scores dynamically update based on predicted precipitation & water accumulation.</p>
          </div>
          <RouteTimeline forecast={floodForecast} selectedTime={selectedTime} onSelectTime={updateRouteTime} />
        </div>
        <RouteTypeSelector selectedType={routeType} onSelectType={updateRouteType} />
      </Panel>

      {loading && (
        <div className="route-loading-banner" role="status" aria-live="polite">
          <div className="loading-spinner" />
          <div className="loading-text">
            <strong>Analyzing Route Safety…</strong>
            <span>{LOADING_STEPS[loadingStepIdx]}</span>
          </div>
        </div>
      )}

      <div className="route-workspace">
        <Panel className="route-map-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">FLOOD INTELLIGENCE MAP</span>
              <h2>{origin} ➔ {destination}</h2>
            </div>
            <span className="route-map-status">
              {passableCount > 0 ? `${passableCount} Passable Corridor(s)` : 'No Safe Route Available'}
            </span>
          </div>
          <RouteMap routingResult={routingResult} />
        </Panel>

        <div className="route-results">
          <RouteCard route={routingResult.recommended} tone="recommended" />
          <RouteCard route={routingResult.alternative} tone="alternative" />
          <RouteCard route={routingResult.shortestNormal} tone="shortest" />
        </div>
      </div>

      <RouteDetails routingResult={routingResult} />
    </>
  )
}

export default SafeRoutePage
