import { useEffect, useRef, useState } from 'react'
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import roadNetwork from '../../data/roadNetwork.json'
import { loadGoogleMapsApi } from '../../services/googleMapsRoutingService'

const routeColors = {
  recommended: '#10b981', // Emerald Safe Green
  alternative: '#f59e0b', // Amber Alternative
  shortest: '#ef4444',    // Red Risk / Shortest
}

function getNodeLookup() {
  return Object.fromEntries(roadNetwork.nodes.map((node) => [node.id, node]))
}

function buildFallbackRoutePath(route) {
  if (!route) return []
  if (route.routePolyline?.length) {
    return route.routePolyline.map((p) => [p.lat, p.lng])
  }
  if (!route.segments) return []

  const nodeLookup = getNodeLookup()
  const path = []

  route.segments.forEach((segment) => {
    const source = nodeLookup[segment.from || segment.source]
    const target = nodeLookup[segment.to || segment.target]

    if (source && target) {
      path.push([source.latitude, source.longitude], [target.latitude, target.longitude])
    }
  })

  return path
}

function RouteMap({ routingResult }) {
  const [mapMode, setMapMode] = useState('loading')
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const overlaysRef = useRef([])

  useEffect(() => {
    let cancelled = false

    const renderGoogleMap = async () => {
      try {
        const maps = await loadGoogleMapsApi()

        if (cancelled) return

        if (!maps || !maps.Map) {
          setMapMode('fallback')
          return
        }

        setMapMode('google')

        if (!mapRef.current) return

        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new maps.Map(mapRef.current, {
            center: { lat: 19.073, lng: 72.872 },
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#cbe6f7' }],
              },
              {
                featureType: 'landscape',
                elementType: 'geometry',
                stylers: [{ color: '#f8fafc' }],
              },
            ],
          })
        }

        const map = mapInstanceRef.current
        const bounds = new maps.LatLngBounds()

        // Clear existing overlays
        overlaysRef.current.forEach((overlay) => overlay.setMap(null))
        overlaysRef.current = []

        const addOverlay = (overlay) => {
          overlay.setMap(map)
          overlaysRef.current.push(overlay)
        }

        const routeEntries = [
          ['shortest', routingResult.shortestNormal],
          ['alternative', routingResult.alternative],
          ['recommended', routingResult.recommended],
        ].filter(([, route]) => route)

        routeEntries.forEach(([type, route]) => {
          const rawPath = route.routePolyline?.length ? route.routePolyline : buildFallbackRoutePath(route)

          if (rawPath.length) {
            const coordinates = Array.isArray(rawPath[0])
              ? rawPath.map((p) => ({ lat: p[0], lng: p[1] }))
              : rawPath

            const polyline = new maps.Polyline({
              path: coordinates,
              geodesic: true,
              strokeColor: routeColors[type] || '#2563eb',
              strokeOpacity: type === 'recommended' ? 0.95 : type === 'alternative' ? 0.85 : 0.7,
              strokeWeight: type === 'recommended' ? 6 : type === 'alternative' ? 5 : 4,
              zIndex: type === 'recommended' ? 10 : type === 'alternative' ? 5 : 2,
            })

            addOverlay(polyline)
            coordinates.forEach((point) => bounds.extend(point))
          }
        })

        // Origin & Destination Markers
        if (routingResult.start && routingResult.destination) {
          const startMarker = new maps.Marker({
            position: {
              lat: routingResult.start.latitude || routingResult.start.lat || 19.0728,
              lng: routingResult.start.longitude || routingResult.start.lng || 72.8826,
            },
            map,
            title: `Origin: ${routingResult.start.name || 'Start'}`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          })

          const destinationMarker = new maps.Marker({
            position: {
              lat: routingResult.destination.latitude || routingResult.destination.lat || 19.0466,
              lng: routingResult.destination.longitude || routingResult.destination.lng || 72.8631,
            },
            map,
            title: `Destination: ${routingResult.destination.name || 'Destination'}`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2563eb',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
            },
          })

          overlaysRef.current.push(startMarker, destinationMarker)
          bounds.extend(startMarker.getPosition())
          bounds.extend(destinationMarker.getPosition())
        }

        // Flood Hotspots
        if (routingResult.floodHotspots?.length) {
          routingResult.floodHotspots.forEach((street) => {
            const circle = new maps.Circle({
              center: { lat: street.latitude, lng: street.longitude },
              radius: Math.max(140, Math.min(300, street.waterDepth * 8)),
              strokeColor: street.waterDepth >= 30 ? '#ef4444' : '#f59e0b',
              strokeOpacity: 0.7,
              strokeWeight: 1.5,
              fillColor: street.waterDepth >= 30 ? '#ef4444' : '#f59e0b',
              fillOpacity: 0.22,
            })

            addOverlay(circle)
            bounds.extend({ lat: street.latitude, lng: street.longitude })
          })
        }

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 })
        }
      } catch (err) {
        if (!cancelled) {
          setMapMode('fallback')
        }
      }
    }

    renderGoogleMap()

    return () => {
      cancelled = true
      overlaysRef.current.forEach((overlay) => overlay.setMap(null))
      overlaysRef.current = []
    }
  }, [routingResult])

  if (mapMode === 'fallback') {
    return <FallbackRouteMap routingResult={routingResult} />
  }

  if (mapMode === 'loading') {
    return (
      <div className="route-map-wrap">
        <div className="route-map-loading-placeholder">
          <div className="pulse-ring" />
          <span>Initializing routing map…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="route-map-wrap">
      <div ref={mapRef} className="route-map" />
      <div className="route-map-legend">
        <span><i style={{ background: routeColors.recommended }} />Recommended Safe Route</span>
        <span><i style={{ background: routeColors.alternative }} />Alternative Route</span>
        <span><i style={{ background: routeColors.shortest }} />Passable / Unsafe Route</span>
        <span><i className="blocked-dot" />Predicted Flood Hotspot</span>
      </div>
    </div>
  )
}

function MapViewport({ start, destination }) {
  const map = useMap()
  const points = [start, destination]
    .filter(Boolean)
    .map((point) => [point.latitude || point.lat, point.longitude || point.lng])

  if (points.length === 2) {
    map.fitBounds(points, { padding: [40, 40] })
  }

  return null
}

function FallbackRouteMap({ routingResult }) {
  const nodeLookup = Object.fromEntries(roadNetwork.nodes.map((node) => [node.id, node]))
  const routeLines = [
    ['shortest', routingResult.shortestNormal],
    ['alternative', routingResult.alternative],
    ['recommended', routingResult.recommended],
  ].filter(([, route]) => route)

  const fallbackPolylines = routeLines.flatMap(([type, route]) => {
    if (route.routePolyline?.length) {
      const positions = route.routePolyline.map((p) => [p.lat, p.lng])
      return (
        <Polyline
          key={`poly-${type}-${route.id}`}
          positions={positions}
          pathOptions={{
            color: routeColors[type] || '#2563eb',
            weight: type === 'recommended' ? 6 : type === 'alternative' ? 5 : 4,
            opacity: type === 'recommended' ? 0.95 : type === 'alternative' ? 0.85 : 0.72,
            dashArray: type === 'shortest' ? '8 6' : undefined,
          }}
        >
          <Popup>
            <strong>{route.name}</strong><br />
            Safety Score: {route.safetyScore}/100 · {route.distance} km · {route.travelTime} min<br />
            Max Flood Depth: {route.maximumWaterDepth} cm
          </Popup>
        </Polyline>
      )
    }

    return (route.segments || []).map((segment, index) => {
      const source = nodeLookup[segment.from || segment.source]
      const target = nodeLookup[segment.to || segment.target]

      if (!source || !target) return null

      return (
        <Polyline
          key={`${type}-${segment.id || index}-${index}`}
          positions={[[source.latitude, source.longitude], [target.latitude, target.longitude]]}
          pathOptions={{
            color: routeColors[type] || '#2563eb',
            weight: type === 'recommended' ? 6 : type === 'alternative' ? 5 : 4,
            opacity: type === 'recommended' ? 0.95 : type === 'alternative' ? 0.85 : 0.72,
            dashArray: type === 'shortest' ? '8 6' : undefined,
          }}
        >
          <Popup>
            <strong>{segment.name}</strong><br />
            {segment.floodDepth} cm predicted depth · {segment.status}
          </Popup>
        </Polyline>
      )
    })
  })

  return (
    <div className="route-map-wrap">
      <MapContainer center={[19.073, 72.872]} zoom={12} scrollWheelZoom className="route-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport start={routingResult.start} destination={routingResult.destination} />
        {fallbackPolylines}
        {roadNetwork.nodes.map((node) => {
          const isStart = node.id === routingResult.start?.id || node.name === routingResult.start?.name
          const isDest = node.id === routingResult.destination?.id || node.name === routingResult.destination?.name
          return (
            <CircleMarker
              key={node.id}
              center={[node.latitude, node.longitude]}
              radius={isStart || isDest ? 8 : 5}
              pathOptions={{
                color: isStart ? '#10b981' : isDest ? '#2563eb' : '#64748b',
                fillColor: isStart ? '#10b981' : isDest ? '#2563eb' : '#ffffff',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>
                <strong>{node.name}</strong>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <div className="route-map-legend">
        <span><i style={{ background: routeColors.recommended }} />Recommended Safe Route</span>
        <span><i style={{ background: routeColors.alternative }} />Alternative Route</span>
        <span><i style={{ background: routeColors.shortest }} />Passable / Unsafe Route</span>
        <span><i className="blocked-dot" />Flood Hotspot</span>
      </div>
    </div>
  )
}

export default RouteMap
