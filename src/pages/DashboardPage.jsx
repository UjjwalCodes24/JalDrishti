import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import wards from '../data/wards.json'
import terrain from '../data/terrain.json'
import drainageNetwork from '../data/drainageNetwork.json'
import InteractiveRiskMap from '../components/InteractiveRiskMap'
import { floodForecast, getFloodPrediction } from '../services/floodEngine'
import { Panel, PageHeader, RiskBadge } from '../components/ui'

const quickModules = [
  { icon: '🌧', title: 'Flood Risk Map', metric: '3 Hotspots · 4 Wards', label: 'Open Map', to: '/risk-map', tone: 'teal' },
  { icon: '🚑', title: 'Flood-Safe Routes', metric: '2 Passable Corridors', label: 'Plan Route', to: '/safe-routes', tone: 'blue' },
  { icon: '🤖', title: 'AI Nowcast', metric: '+3h Radar Horizon', label: 'View Forecast', to: '/nowcast', tone: 'cyan' },
  { icon: '🔍', title: 'Explainable AI', metric: 'SHAP Root-Cause', label: 'Explain Why', to: '/explainable-ai', tone: 'purple' },
  { icon: '🚨', title: 'Emergency Response', metric: '4 Field Units Ready', label: 'Deploy Units', to: '/emergency-response', tone: 'red' },
  { icon: '📊', title: 'Situation Reports', metric: 'Automated Briefing', label: 'View Report', to: '/dashboard', tone: 'slate' },
]

function DashboardPage() {
  const [selectedTime, setSelectedTime] = useState('NOW')
  const [selectedWard, setSelectedWard] = useState('')
  const [focusedStreet, setFocusedStreet] = useState('')
  const [activeMapLayers, setActiveMapLayers] = useState({ risk: true, depth: true, network: true, capacity: true, terrain: false, runoff: true })
  const prediction = getFloodPrediction(selectedTime)
  const sortedStreets = useMemo(() => [...prediction.streets].sort((a, b) => b.waterDepth - a.waterDepth), [prediction.streets])
  const priorityStreets = sortedStreets.slice(0, 3)
  const focusedStreetObj = prediction.streets.find((street) => street.id === focusedStreet)
  const criticalZones = prediction.streets.filter((street) => street.risk === 'CRITICAL').length
  const affectedRoads = prediction.streets.filter((street) => street.waterDepth >= 15).length
  const status = prediction.highestWaterDepth >= 30 ? 'CRITICAL' : prediction.highestWaterDepth >= 15 ? 'HIGH' : 'MODERATE'
  const setHorizon = (time) => setSelectedTime(time)
  const toggleMapLayer = (layer) => setActiveMapLayers((current) => ({ ...current, [layer]: !current[layer] }))
  const insightFactors = [
    ['Drainage overload', Math.min(99, Math.round(prediction.drainage.utilization * 31)), 'critical'],
    ['Surface runoff', Math.min(99, Math.round(prediction.streets[0].runoffVolume / Math.max(prediction.intensity, 1) * 24)), 'info'],
    ['Low elevation', Math.round((1 - prediction.streets[0].terrain.elevation / 20) * 18), 'info'],
    ['Rainfall intensity', Math.round(prediction.intensity / 80 * 14), 'warning'],
  ]

  return (
    <>
      <PageHeader
        eyebrow="URBAN FLOOD INTELLIGENCE"
        title="Flood Intelligence Dashboard"
        description="Real-time flood risk, rainfall and drainage conditions."
        action={
          <div className="header-status-indicator">
            <span className="status-dot" />
            <span>Live Monitoring</span>
          </div>
        }
      />

      <section className="dashboard-status-banner">
        <div className="status-banner-main">
          <div className="status-banner-header">
            <span className="status-banner-kicker">CURRENT STATUS</span>
            <span className={`status-banner-badge ${status.toLowerCase()}`}>{status} ALERT</span>
          </div>
          <div className="status-banner-telemetry">
            <div className="telemetry-item">
              <span className="telemetry-label">Rainfall</span>
              <strong className="telemetry-value">{prediction.intensity} mm/hr</strong>
            </div>
            <span className="telemetry-divider" aria-hidden="true" />
            <div className="telemetry-item">
              <span className="telemetry-label">Drainage load</span>
              <strong className="telemetry-value">{Math.round(prediction.drainage.utilization * 100)}%</strong>
            </div>
            <span className="telemetry-divider" aria-hidden="true" />
            <div className="telemetry-item">
              <span className="telemetry-label">Affected location</span>
              <strong className="telemetry-value">{priorityStreets[0]?.name || 'Kurla'}</strong>
            </div>
          </div>
        </div>
        <div className="status-banner-action">
          <div className="action-content">
            <span className="action-label">Action required:</span>
            <span className="action-text">Deploy auxiliary dewatering pumps and activate traffic diversions.</span>
          </div>
          <Link to="/emergency-response" className="action-link-btn">
            Operations &rarr;
          </Link>
        </div>
      </section>

      <div className="situation-summary-grid">
        {/* 1. Rainfall */}
        <div className="situation-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">RAINFALL</span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-value">
              <strong>{prediction.intensity}</strong>
              <span className="kpi-card-unit">mm/hr</span>
            </div>
            <div className="kpi-card-status">
              {prediction.intensity >= 35 ? 'Heavy downpour' : prediction.intensity >= 15 ? 'Moderate showers' : 'Light precipitation'}
            </div>
          </div>
          <div className="kpi-card-footer">
            IMD / Doppler Radar
          </div>
        </div>

        {/* 2. Flood Risk */}
        <div className="situation-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">FLOOD RISK</span>
          </div>
          <div className="kpi-card-body">
            <div className={`kpi-card-value risk-${status.toLowerCase()}`}>
              <strong>{status.charAt(0) + status.slice(1).toLowerCase()}</strong>
            </div>
            <div className="kpi-card-status">
              {criticalZones} {criticalZones === 1 ? 'hotspot' : 'hotspots'}
            </div>
          </div>
          <div className="kpi-card-footer">
            Immediate attention
          </div>
        </div>

        {/* 3. Drainage Load */}
        <div className="situation-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">DRAINAGE LOAD</span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-value">
              <strong>{Math.round(prediction.drainage.utilization * 100)}%</strong>
            </div>
            <div className="kpi-card-status">
              {prediction.drainage.overloadedNodes.length} overloaded nodes
            </div>
          </div>
          <div className="kpi-card-footer">
            High backflow risk
          </div>
        </div>

        {/* 4. Roads at Risk */}
        <div className="situation-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">ROADS AT RISK</span>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-card-value">
              <strong>{affectedRoads}</strong>
            </div>
            <div className="kpi-card-status">
              {affectedRoads > 3 ? 'restricted' : 'caution'}
            </div>
          </div>
          <div className="kpi-card-footer">
            2 safe corridors open
          </div>
        </div>
      </div>

      <div className="dashboard-monitor-grid">
        <Panel className="dashboard-map-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">GIS DIGITAL TWIN</span>
              <h2>Live Flood Situation Map</h2>
              <p className="muted">Real-time hotspots, drainage and road inundation.</p>
            </div>
            <span className="map-live-chip"><span className="pulse-dot" /> {selectedTime}</span>
          </div>
          <div className="dashboard-map-hero">
            <InteractiveRiskMap
              wards={wards}
              selectedWard={selectedWard}
              onSelectWard={setSelectedWard}
              prediction={prediction}
              activeLayers={activeMapLayers}
              terrainZones={terrain.zones}
              drainageNetwork={drainageNetwork}
              focusedStreet={focusedStreet}
              onSelectStreet={setFocusedStreet}
              digitalTwin
            />
            
            {/* Top-Left: Live Telemetry / Monitoring Status */}
            <div className="map-glass map-status-overlay">
              <span className="map-status-title"><span className="status-dot" /> Live Monitoring</span>
              <small className="map-status-subtitle">MMR Digital Twin</small>
            </div>

            {/* Top-Right: Intelligence Layers Control */}
            <div className="map-glass map-layer-overlay">
              <span className="map-layer-title">Intelligence Layers</span>
              <div className="map-layer-list">
                {[
                  ['risk', 'Flood Risk'],
                  ['depth', 'Water Depth'],
                  ['runoff', 'Rainfall Runoff'],
                  ['network', 'Drainage Network'],
                  ['capacity', 'Overloaded Nodes'],
                  ['terrain', 'DEM Elevation']
                ].map(([id, label]) => (
                  <label key={id} className="map-layer-item">
                    <input
                      type="checkbox"
                      checked={activeMapLayers[id] !== false}
                      onChange={() => toggleMapLayer(id)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bottom-Left: Compact Flood Depth Legend */}
            <div className="map-glass map-legend-overlay">
              <span className="map-legend-title">Flood Depth</span>
              <div className="map-legend-grid">
                <span><i className="dash-legend safe" /> 0–5 cm (Safe)</span>
                <span><i className="dash-legend low" /> 5–15 cm (Low)</span>
                <span><i className="dash-legend moderate" /> 15–30 cm (Moderate)</span>
                <span><i className="dash-legend high" /> 30–50 cm (High)</span>
                <span><i className="dash-legend critical" /> 50+ cm (Critical)</span>
              </div>
            </div>

            {/* Contextual Operational Inspection Overlay if a location is selected */}
            {focusedStreetObj && (
              <div className="map-glass map-inspector-overlay">
                <div className="map-inspector-head">
                  <div>
                    <span className="map-inspector-kicker">SELECTED LOCATION</span>
                    <strong className="map-inspector-title">{focusedStreetObj.name}</strong>
                  </div>
                  <button
                    type="button"
                    className="map-inspector-close"
                    onClick={() => setFocusedStreet('')}
                    title="Close inspection"
                  >
                    ✕
                  </button>
                </div>
                <div className="map-inspector-grid">
                  <div>
                    <span>Current Depth</span>
                    <strong>{focusedStreetObj.currentWaterDepth} cm</strong>
                  </div>
                  <div>
                    <span>Predicted Peak</span>
                    <strong className={`risk-${focusedStreetObj.risk.toLowerCase()}`}>{focusedStreetObj.waterDepth} cm</strong>
                  </div>
                  <div>
                    <span>Drainage Load</span>
                    <strong>{Math.round(prediction.drainage.utilization * 100)}%</strong>
                  </div>
                  <div>
                    <span>Elevation</span>
                    <strong>{focusedStreetObj.terrain?.elevation} m</strong>
                  </div>
                </div>
                <div className="map-inspector-action">
                  <span className={`risk-badge ${focusedStreetObj.risk.toLowerCase()}`}>{focusedStreetObj.risk}</span>
                  <p>{focusedStreetObj.waterDepth >= 60 ? 'Deploy pumps & divert traffic' : focusedStreetObj.waterDepth >= 30 ? 'Emergency response staged' : 'Monitor traffic flow'}</p>
                </div>
              </div>
            )}
          </div>
          <div className="dashboard-map-footer">
            <span><i className="dash-legend safe" /> Safe (0–5 cm)</span>
            <span><i className="dash-legend low" /> Low (5–15 cm)</span>
            <span><i className="dash-legend moderate" /> Moderate (15–30 cm)</span>
            <span><i className="dash-legend high" /> High (30–50 cm)</span>
            <span><i className="dash-legend critical" /> Critical (50+ cm)</span>
          </div>
        </Panel>

        <Panel className="priority-alerts-card">
          <div className="priority-alerts-header">
            <div>
              <h2>Priority Alerts</h2>
              <span className="priority-alerts-subtitle">Ranked by severity</span>
            </div>
            <span className="alert-count-badge">{priorityStreets.length} active</span>
          </div>
          <div className="dashboard-alert-list">
            {priorityStreets.map((street, index) => {
              const riskLevel = (street.risk || 'MODERATE').toUpperCase()
              const actionText = street.waterDepth >= 60
                ? 'Restrict traffic · Deploy pumps'
                : street.waterDepth >= 30
                ? 'Stage emergency response'
                : 'Monitor traffic flow'

              return (
                <article
                  className={`dashboard-alert severity-${riskLevel.toLowerCase()} ${index === 0 ? 'priority-highest' : ''} ${focusedStreet === street.id ? 'selected' : ''}`}
                  key={street.id}
                  onClick={() => setFocusedStreet(street.id)}
                >
                  <div className="dashboard-alert-top">
                    <span className="priority-rank-tag">P0{index + 1}</span>
                    <RiskBadge level={riskLevel} />
                  </div>
                  <h3 className="alert-location-title">{street.name}</h3>
                  <div className="alert-depth-stat">
                    <span className="alert-depth-number">{street.waterDepth} cm</span>
                    <span className="alert-depth-label">predicted depth</span>
                  </div>
                  <div className="alert-action-recommendation">
                    <span className="alert-action-label">{actionText}</span>
                  </div>
                  <button
                    type="button"
                    className="alert-locate-btn"
                    onClick={(event) => {
                      event.stopPropagation()
                      setFocusedStreet(street.id)
                    }}
                  >
                    Locate on Map <span>→</span>
                  </button>
                </article>
              )
            })}
          </div>
          <div className="priority-alerts-footer">
            <Link className="priority-alerts-action-link" to="/emergency-response">
              Open Emergency Response <span>→</span>
            </Link>
          </div>
        </Panel>
      </div>

      <Panel className="dashboard-forecast-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">FORECAST PROGRESSION</span>
            <h2>Flood Impact Forecast</h2>
            <p className="muted">Temporal impact horizon across next 60 minutes.</p>
          </div>
          <div className="forecast-horizon-controls">
            {floodForecast.map((point) => (
              <button
                type="button"
                className={selectedTime === point.time ? 'active' : ''}
                key={point.time}
                onClick={() => setHorizon(point.time)}
              >
                {point.time}
              </button>
            ))}
          </div>
        </div>
        <div className="dashboard-timeline">
          <div>
            <b>NOW</b>
            <strong className="timeline-metric-val">{prediction.intensity} mm/h</strong>
            <span>Inundation onset</span>
          </div>
          <div>
            <b>+30 MIN</b>
            <strong className="timeline-metric-val">85% load</strong>
            <span>Drainage overload</span>
          </div>
          <div>
            <b>+45 MIN</b>
            <strong className="timeline-metric-val">{prediction.highestWaterDepth} cm</strong>
            <span>Kurla peak flood</span>
          </div>
          <div>
            <b>+60 MIN</b>
            <strong className="timeline-metric-val">Closed</strong>
            <span>Traffic diversion</span>
          </div>
        </div>
      </Panel>

      <Panel className="ai-situation-insight">
        <div>
          <span className="eyebrow">AI ROOT-CAUSE ANALYSIS</span>
          <h2>Key Flood Drivers · {priorityStreets[0]?.name || 'Kurla'}</h2>
          <div className="insight-chip-group">
            <span className="insight-chip red">Culvert Backflow (92%)</span>
            <span className="insight-chip blue">Low Elevation (3.2m DEM)</span>
            <span className="insight-chip teal">Impervious Runoff (68%)</span>
          </div>
          <p className="insight-summary-short">
            Topographic depression + drainage saturation drive <strong>84% of local flood accumulation</strong>.
          </p>
        </div>
        <div className="insight-factor-list">
          {insightFactors.map(([label, value, tone]) => (
            <div key={label}>
              <span>{label}</span>
              <b>{value}%</b>
              <i className={tone}>
                <em style={{ width: `${value * 2.5}%` }} />
              </i>
            </div>
          ))}
        </div>
        <Link className="text-link" to="/explainable-ai">
          Explainable AI <span>→</span>
        </Link>
      </Panel>

      <section className="quick-modules-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">OPERATIONAL MODULES</span>
            <h2>Decision Support Actions</h2>
          </div>
          <span className="muted">Live capabilities</span>
        </div>
        <div className="quick-module-grid">
          {quickModules.map((module) => (
            <Link className={`quick-module ${module.tone}`} to={module.to} key={module.title}>
              <span className="quick-module-icon">{module.icon}</span>
              <div className="quick-module-body">
                <strong>{module.title}</strong>
                <span className="module-metric-pill">{module.metric}</span>
              </div>
              <b>{module.label} <span>→</span></b>
            </Link>
          ))}
        </div>
      </section>

      <Panel className="data-sources-panel">
        <div>
          <span className="eyebrow">TELEMETRY SOURCES</span>
          <h2>Live Sensor & Model Feeds</h2>
        </div>
        <div className="data-source-list">
          <span className="data-feed-badge"><b>🌧 IMD Rainfall</b><span className="feed-status live"><i className="pulse-dot" /> Live Radar</span></span>
          <span className="data-feed-badge"><b>🔵 Drainage Network</b><span className="feed-status ok">12 Nodes Active</span></span>
          <span className="data-feed-badge"><b>🗺 DEM Terrain</b><span className="feed-status ok">3m Resolution</span></span>
          <span className="data-feed-badge"><b>🤖 AI Nowcast</b><span className="feed-status ok">Calibrated</span></span>
          <span className="data-feed-badge"><b>🚑 Safe Routes</b><span className="feed-status ok">10 Links Monitored</span></span>
        </div>
        <div className="system-operational">
          <span className="status-dot" /> SYSTEM OPERATIONAL
        </div>
      </Panel>

      <footer className="dashboard-footer">
        <strong>JalDrishti — Urban Flood Intelligence & Decision Support System</strong>
        <span>Smart India Hackathon 2026 · IMD Radar • Drainage Telemetry • DEM • AI Models</span>
      </footer>
    </>
  )
}

export default DashboardPage

