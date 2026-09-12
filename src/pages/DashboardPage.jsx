import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useRegion } from '../context/useRegion'
import wardsData from '../data/wards.json'
import terrainData from '../data/terrain.json'
import drainageNetworkData from '../data/drainageNetwork.json'
import InteractiveRiskMap from '../components/InteractiveRiskMap'
import { getFloodForecast, getFloodPrediction } from '../services/floodEngine'
import { getExplainabilityData } from '../services/explainabilityService'
import { PageHeader, Panel, RiskBadge } from '../components/ui'

const quickModules = [
  { icon: '🌧', title: 'Flood Risk Map', metric: 'Hotspots & wards', label: 'Open Map', to: '/risk-map', tone: 'teal' },
  { icon: '🚑', title: 'Flood-Safe Routes', metric: 'Passable corridors', label: 'Plan Route', to: '/safe-routes', tone: 'blue' },
  { icon: '⏱', title: 'AI Nowcast', metric: '3-hour forecast', label: 'View Forecast', to: '/nowcast', tone: 'cyan' },
  { icon: '🔍', title: 'Explainable AI', metric: 'Flood cause analysis', label: 'Explain Why', to: '/explainable-ai', tone: 'purple' },
  { icon: '🚨', title: 'Emergency Response', metric: 'Response units', label: 'Deploy Units', to: '/emergency-response', tone: 'red' },
  { icon: '📊', title: 'Situation Reports', metric: 'Current situation', label: 'View Report', to: '/dashboard', tone: 'slate' },
]

function DashboardPage() {
  const { selectedRegion, currentRegion } = useRegion()
  const [selectedTime, setSelectedTime] = useState('NOW')
  const [selectedWard, setSelectedWard] = useState('')
  const [focusedStreet, setFocusedStreet] = useState('')
  const [activeMapLayers, setActiveMapLayers] = useState({ risk: true, depth: true, network: true, capacity: true, terrain: false, runoff: true })

  const regionWards = currentRegion?.wards || wardsData
  const regionTerrain = currentRegion?.terrain || terrainData.zones
  const regionDrainage = currentRegion?.drainageNetwork || drainageNetworkData
  const dataSources = currentRegion?.dataSources || []

  const forecast = useMemo(() => getFloodForecast(selectedRegion), [selectedRegion])
  const prediction = useMemo(() => getFloodPrediction(selectedTime, selectedRegion), [selectedTime, selectedRegion])
  const sortedStreets = useMemo(() => [...prediction.streets].sort((a, b) => b.waterDepth - a.waterDepth), [prediction.streets])
  const priorityStreets = sortedStreets.slice(0, 3)
  
  // Purely derived state: handles region switching gracefully without cascading renders
  const focusedStreetObj = prediction.streets.find((street) => street.id === focusedStreet)
  const activeStreet = focusedStreetObj || priorityStreets[0] || prediction.streets[0]
  const activeWard = regionWards.some((w) => w.id === selectedWard) ? selectedWard : ''
  const activeStreetId = activeStreet?.id || currentRegion?.primaryFocusStreet
  
  const criticalZones = prediction.streets.filter((street) => street.risk === 'CRITICAL').length
  const affectedRoads = prediction.streets.filter((street) => street.waterDepth >= 15).length
  const status = prediction.highestWaterDepth >= 30 ? 'CRITICAL' : prediction.highestWaterDepth >= 15 ? 'HIGH' : 'MODERATE'
  const setHorizon = (time) => setSelectedTime(time)
  const toggleMapLayer = (layer) => setActiveMapLayers((current) => ({ ...current, [layer]: !current[layer] }))
  
  const explainability = getExplainabilityData(activeStreetId, selectedTime, selectedRegion)



  const topDrivers = explainability.factors.slice(0, 4)
  const primaryDriver = explainability.factors[0]

  const topPriorityAction = currentRegion?.priorityActions?.[priorityStreets[0]?.id]?.action ||
    (priorityStreets[0]?.waterDepth >= 30
      ? 'Deploy auxiliary dewatering pumps and activate traffic diversions.'
      : 'Maintain normal monitoring and review upcoming forecast horizon.')

  return (
    <>
      <PageHeader
        eyebrow={currentRegion?.kicker || "URBAN FLOOD MONITORING"}
        title="Flood Intelligence Dashboard"
        description={currentRegion?.subtitle || "Monitor rainfall, drainage conditions and flood risk across the city."}
        action={
          <div className="header-status-indicator">
            <span className="status-dot" />
            <span>Demonstration scenario</span>
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
              <strong className="telemetry-value">{priorityStreets[0]?.name || 'Primary Hotspot'}</strong>
            </div>
          </div>
        </div>
        <div className="status-banner-action">
          <div className="action-content">
            <span className="action-label">ACTION REQUIRED:</span>
            <span className="action-text">{topPriorityAction}</span>
          </div>
          <Link to="/emergency-response" className="action-link-btn">
            Emergency Response &rarr;
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
              {prediction.intensity >= 35 ? 'Heavy rainfall' : prediction.intensity >= 15 ? 'Moderate showers' : 'Light precipitation'}
            </div>
          </div>
          <div className="kpi-card-footer">
            IMD / Radar (Simulated)
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
              {criticalZones} {criticalZones === 1 ? 'location requires attention' : 'locations require attention'}
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
              {prediction.drainage.overloadedNodes.length} nodes overloaded
            </div>
          </div>
          <div className="kpi-card-footer">
            {prediction.drainage.backflowProbability >= 0.6 ? 'High backflow risk' : 'Moderate network flow'}
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
              {affectedRoads} {affectedRoads === 1 ? 'road restricted' : 'roads restricted'}
            </div>
          </div>
          <div className="kpi-card-footer">
            Monitored corridors open
          </div>
        </div>
      </div>

      <div className="dashboard-monitor-grid">
        <Panel className="dashboard-map-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">FLOOD RISK MAP</span>
              <h2>Live Flood Situation Map</h2>
              <p className="muted">Current flood risk, water depth and affected roads.</p>
            </div>
            <span className="map-live-chip"><span className="pulse-dot" /> {selectedTime}</span>
          </div>
          <div className="dashboard-map-hero">
            <InteractiveRiskMap
              wards={regionWards}
              selectedWard={activeWard}
              onSelectWard={setSelectedWard}
              prediction={prediction}

              activeLayers={activeMapLayers}
              terrainZones={regionTerrain}
              drainageNetwork={regionDrainage}
              focusedStreet={focusedStreet}
              onSelectStreet={setFocusedStreet}
              digitalTwin
              center={currentRegion?.center || [19.076, 72.8777]}
              zoom={currentRegion?.zoom || 11}
              wardCoordinates={currentRegion?.wardCoordinates}
            />
            
            {/* Top-Left: Live Telemetry / Monitoring Status */}
            <div className="map-glass map-status-overlay">
              <span className="map-status-title"><span className="status-dot" /> Demonstration mode</span>
              <small className="map-status-subtitle">{currentRegion?.name || 'Metropolitan Area'}</small>
            </div>

            {/* Top-Right: Intelligence Layers Control */}
            <div className="map-glass map-layer-overlay">
              <span className="map-layer-title">MAP LAYERS</span>
              <div className="map-layer-list">
                {[
                  ['risk', 'Flood risk'],
                  ['depth', 'Water depth'],
                  ['runoff', 'Rainfall'],
                  ['network', 'Drainage network'],
                  ['capacity', 'Overloaded nodes'],
                  ['terrain', 'Elevation']
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
                  <p>{focusedStreetObj.waterDepth >= 60 ? 'Restrict traffic · Deploy pumps' : focusedStreetObj.waterDepth >= 30 ? 'Prepare emergency response' : 'Monitor traffic flow'}</p>
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
              const regionalAction = currentRegion?.priorityActions?.[street.id]?.action
              const actionText = regionalAction || (street.waterDepth >= 60
                ? 'Restrict traffic · Deploy pumps'
                : street.waterDepth >= 30
                ? 'Prepare emergency response'
                : 'Monitor traffic flow')

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
        <div className="panel-heading forecast-panel-heading">
          <div>
            <span className="eyebrow">0–3 HOUR STREET-LEVEL NOWCAST</span>
            <h2>Flood Impact Forecast</h2>
            <p className="muted">Street-level flood progression over the next 3 hours.</p>
          </div>
          <div className="forecast-horizon-controls" role="tablist" aria-label="Forecast horizon selector">
            {forecast.map((point) => (
              <button
                type="button"
                role="tab"
                aria-selected={selectedTime === point.time}
                className={`forecast-horizon-btn ${selectedTime === point.time ? 'active' : ''}`}
                key={point.time}
                onClick={() => setHorizon(point.time)}
              >
                {point.time}
              </button>
            ))}
          </div>
        </div>

        {/* 6-Horizon Step Progression Grid */}
        <div className="forecast-timeline-grid">
          {forecast.map((point, index) => {
            const isSelected = selectedTime === point.time
            const pointRisk = point.highestWaterDepth >= 30 ? 'CRITICAL' : point.highestWaterDepth >= 15 ? 'HIGH' : point.highestWaterDepth >= 5 ? 'MODERATE' : 'SAFE'
            const roadsCount = point.streets.filter((s) => s.waterDepth >= 15).length
            const stageName = index === 0
              ? 'Baseline'
              : index === 1
              ? 'Early accumulation'
              : index === 2
              ? 'Drainage stress'
              : index === 3
              ? 'Peak inundation'
              : index === 4
              ? 'Flood impact'
              : 'Recovery'

            return (
              <button
                type="button"
                key={point.time}
                className={`forecast-timeline-step severity-${pointRisk.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                onClick={() => setHorizon(point.time)}
              >
                <div className="timeline-step-header">
                  <span className="timeline-step-time">{point.time}</span>
                  <span className={`forecast-risk-tag ${pointRisk.toLowerCase()}`}>{pointRisk}</span>
                </div>
                <div className="timeline-step-stage">{stageName}</div>
                <div className="timeline-step-metrics">
                  <div className="timeline-metric-row">
                    <span className="timeline-metric-label">Depth</span>
                    <strong className="timeline-metric-val">{point.highestWaterDepth} cm</strong>
                  </div>
                  <div className="timeline-metric-row">
                    <span className="timeline-metric-label">Drainage</span>
                    <span className="timeline-metric-sub">{Math.round(point.drainage.utilization * 100)}%</span>
                  </div>
                  <div className="timeline-metric-row">
                    <span className="timeline-metric-label">Rain</span>
                    <span className="timeline-metric-sub">{point.intensity} mm/hr</span>
                  </div>
                  <div className="timeline-metric-row">
                    <span className="timeline-metric-label">Roads</span>
                    <span className="timeline-metric-sub">{roadsCount} at risk</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Selected Horizon Detail Summary */}
        <div className="forecast-selected-summary">
          <div className="selected-summary-kicker">
            <div className="summary-horizon-badge">
              <span>SELECTED HORIZON</span>
              <strong>{selectedTime}</strong>
            </div>
            <div className="summary-risk-badge">
              <span>ESTIMATED RISK</span>
              <RiskBadge level={status} />
            </div>
          </div>
          <div className="selected-summary-stats">
            <div className="summary-stat-box">
              <span className="stat-box-label">Rainfall</span>
              <strong className="stat-box-value">{prediction.intensity} mm/hr</strong>
              <small className="stat-box-sub">{prediction.intensity >= 35 ? 'Heavy rainfall' : 'Moderate showers'}</small>
            </div>
            <div className="summary-stat-box">
              <span className="stat-box-label">Peak Water Depth</span>
              <strong className={`stat-box-value risk-${status.toLowerCase()}`}>{prediction.highestWaterDepth} cm</strong>
              <small className="stat-box-sub">Max at {prediction.streets.reduce((max, s) => s.waterDepth > max.waterDepth ? s : max, prediction.streets[0])?.name || 'Monitored point'}</small>
            </div>
            <div className="summary-stat-box">
              <span className="stat-box-label">Drainage Load</span>
              <strong className="stat-box-value">{Math.round(prediction.drainage.utilization * 100)}%</strong>
              <small className="stat-box-sub">{prediction.drainage.overloadedNodes.length} nodes overloaded</small>
            </div>
            <div className="summary-stat-box">
              <span className="stat-box-label">Affected Roads</span>
              <strong className="stat-box-value">{affectedRoads} sectors</strong>
              <small className="stat-box-sub">Passable corridors active</small>
            </div>
          </div>
        </div>
      </Panel>

      <Panel className="ai-situation-insight">
        <div className="insight-header-row">
          <div>
            <span className="eyebrow">WHY THIS LOCATION IS AT RISK</span>
            <h2>Why will this location flood?</h2>
            <div className="insight-target-location">
              <span className="location-pin-icon" aria-hidden="true">📍</span>
              <strong>{activeStreet.name}</strong>
              <span className={`risk-badge ${activeStreet.risk.toLowerCase()}`}>{activeStreet.risk}</span>
              <span className="location-depth-kicker">{activeStreet.waterDepth} cm predicted depth</span>
            </div>
          </div>
          <Link className="insight-deepdive-link" to="/explainable-ai">
            Root-Cause Analysis <span>→</span>
          </Link>
        </div>

        <div className="insight-bento-grid">
          {/* 1. Primary Driver & Causal Conclusion */}
          <div className="insight-summary-card">
            <div className="insight-primary-driver">
              <span className="primary-driver-label">PRIMARY DRIVER</span>
              <strong className="primary-driver-title">{primaryDriver?.label || 'Drainage utilization'}</strong>
              <span className="primary-driver-weight">{primaryDriver?.contribution || 32}% model impact</span>
            </div>
            <p className="insight-causal-summary">
              {explainability.explanation}
            </p>
            <div className="insight-operational-action">
              <span className="action-tag">RECOMMENDED ACTION</span>
              <p>{explainability.operationalExplanation}</p>
            </div>
          </div>

          {/* 2. Contributing Factors (Horizontal Ranked Bars) */}
          <div className="insight-factors-card">
            <div className="factors-card-header">
              <span className="factors-card-title">CONTRIBUTING FACTORS</span>
              <span className="factors-card-meta">Ranked contribution</span>
            </div>
            <div className="insight-factor-list">
              {topDrivers.map((factor, index) => (
                <div className="insight-factor-item" key={factor.id}>
                  <div className="factor-item-info">
                    <span className="factor-item-rank">0{index + 1}</span>
                    <span className="factor-item-label">{factor.label}</span>
                    <strong className="factor-item-pct">{factor.contribution}%</strong>
                  </div>
                  <div className="factor-progress-track">
                    <div
                      className={`factor-progress-fill ${index === 0 ? 'top-factor' : ''}`}
                      style={{ width: `${Math.min(100, factor.contribution * 2.2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Concrete Evidence Points */}
          <div className="insight-evidence-card">
            <div className="evidence-card-header">
              <span className="evidence-card-title">EVIDENCE FROM THE MODEL</span>
              <span className="evidence-card-meta">Sensor & terrain data</span>
            </div>
            <ul className="insight-evidence-list">
              <li>
                <span className="evidence-bullet" aria-hidden="true">•</span>
                <div className="evidence-text">
                  <strong>Culvert surcharge & backflow</strong>
                  <span>{Math.round(prediction.drainage.backflowProbability * 100)}% backflow probability</span>
                </div>
              </li>
              <li>
                <span className="evidence-bullet" aria-hidden="true">•</span>
                <div className="evidence-text">
                  <strong>Topographic elevation</strong>
                  <span>{activeStreet.terrain?.elevation} m DEM ({activeStreet.terrain?.terrainType || 'low-lying basin'})</span>
                </div>
              </li>
              <li>
                <span className="evidence-bullet" aria-hidden="true">•</span>
                <div className="evidence-text">
                  <strong>Surface runoff response</strong>
                  <span>{activeStreet.runoffVolume} m³ ({Math.min(99, Math.round(activeStreet.runoffVolume / Math.max(prediction.intensity, 1) * 100))}% response)</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </Panel>

      <section className="quick-modules-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">DECISION SUPPORT</span>
            <h2>Decision Support Actions</h2>
          </div>
          <span className="muted">What you can do next</span>
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
        <div className="data-sources-header">
          <div>
            <span className="eyebrow">MONITORING & DATA SOURCES</span>
            <h2>Data Sources</h2>
            <p className="muted">Technical inputs and spatial datasets driving the current flood assessment for {currentRegion?.name || 'the selected region'}.</p>
          </div>
          <div className="system-operational">
            <span className="status-dot" /> SYSTEM OPERATIONAL · DEMO MODE
          </div>
        </div>
        <div className="data-sources-grid">
          {dataSources.map((source) => (
            <div className="data-source-card" key={source.name}>
              <div className="source-card-header">
                <strong className="source-card-title">{source.name}</strong>
                <span className={`source-status-badge ${source.statusType}`}>
                  <span className="status-dot" /> {source.status}
                </span>
              </div>
              <span className="source-card-detail">{source.detail}</span>
            </div>
          ))}
        </div>
      </Panel>

      <footer className="dashboard-footer">
        <strong>JalDrishti · Urban Flood Monitoring & Decision Support</strong>
        <span>Demonstration Scenario • Municipal Drainage Network • Digital Elevation Model • Coupled Hydrological Engine</span>
      </footer>
    </>
  )
}

export default DashboardPage


