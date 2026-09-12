import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import wards from '../data/wards.json'
import terrain from '../data/terrain.json'
import drainageNetwork from '../data/drainageNetwork.json'
import InteractiveRiskMap from '../components/InteractiveRiskMap'
import { floodForecast, getFloodPrediction } from '../services/floodEngine'
import { getRainfallSourceStatus } from '../services/rainfallService'
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
  const source = getRainfallSourceStatus()
  const sortedStreets = useMemo(() => [...prediction.streets].sort((a, b) => b.waterDepth - a.waterDepth), [prediction.streets])
  const priorityStreets = sortedStreets.slice(0, 3)
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
        eyebrow="URBAN FLOOD INTELLIGENCE SYSTEM"
        title="Mumbai Flood Command Center"
        description="Real-time AI flood prediction, telemetry & emergency decision support."
        action={<span className="prototype-label">LIVE DATA MONITORING</span>}
      />

      <section className="dashboard-status-banner">
        <div>
          <div className="status-banner-head">
            <span className="eyebrow">🔴 CURRENT STATUS</span>
            <span className="status-live-tag">LIVE ASSESSMENT</span>
          </div>
          <h2>{status} ALERT</h2>
          <div className="status-signal-chips">
            <span className="signal-chip red">🌧 {prediction.intensity} mm/h Downpour</span>
            <span className="signal-chip orange">≋ {Math.round(prediction.drainage.utilization * 100)}% Drainage Load</span>
            <span className="signal-chip red">🚨 {priorityStreets[0]?.name || 'Kurla'} Inundated</span>
          </div>
          <div className="status-action-row">
            <Link to="/emergency-response" className="status-action-pill">
              ⚡ Action: Deploy response pumps & activate traffic diversions →
            </Link>
          </div>
        </div>
        <div className="status-banner-metrics">
          <div>
            <strong>{prediction.highestWaterDepth} cm</strong>
            <span>Peak Depth</span>
          </div>
          <div>
            <strong>{criticalZones}</strong>
            <span>Critical Zones</span>
          </div>
          <div>
            <strong>~45 min</strong>
            <span>Time to Impact</span>
          </div>
        </div>
      </section>

      <div className="situation-summary-grid">
        <div className="situation-card rainfall">
          <span>🌧</span>
          <small>RAINFALL</small>
          <strong>{prediction.intensity} <em>mm/hr</em></strong>
          <span className="kpi-tag blue">⛈ Heavy Downpour</span>
          <b>📡 {source.isLive ? 'IMD Live Feed' : 'IMD / Fallback Feed'}</b>
        </div>
        <div className="situation-card flood-risk">
          <span>◉</span>
          <small>FLOOD RISK</small>
          <strong>{status}</strong>
          <span className="kpi-tag red">🚨 {criticalZones} Active Hotspots</span>
          <b>⚡ Immediate Action Req.</b>
        </div>
        <div className="situation-card emergency">
          <span>!</span>
          <small>EMERGENCY STATUS</small>
          <strong>{criticalZones} <em>active hotspots</em></strong>
          <span className="kpi-tag red">🚨 Response teams ready</span>
          <b>📡 Priority queue active</b>
        </div>
        <div className="situation-card drainage">
          <span>≋</span>
          <small>DRAINAGE NETWORK</small>
          <strong>{Math.round(prediction.drainage.utilization * 100)}%</strong>
          <span className="kpi-tag orange">⚠️ {prediction.drainage.overloadedNodes.length} Overloaded Nodes</span>
          <b>🔄 High Backflow Risk</b>
        </div>
        <div className="situation-card roads">
          <span>▣</span>
          <small>ROAD NETWORK</small>
          <strong>{affectedRoads}</strong>
          <span className="kpi-tag teal">🚧 Inundated Roads</span>
          <b>🚑 2 Safe Corridors Open</b>
        </div>
        <div className="situation-card road-status">
          <span>▰</span>
          <small>ROAD STATUS</small>
          <strong>{affectedRoads > 3 ? 'RESTRICTED' : 'CAUTION'}</strong>
          <span className="kpi-tag orange">🚧 {affectedRoads} roads monitored</span>
          <b>↗ Diversions being assessed</b>
        </div>
      </div>

      <div className="dashboard-monitor-grid">
        <Panel className="dashboard-map-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">LIVE MONITORING · DIGITAL TWIN</span>
              <h2>Live Flood Situation Map</h2>
              <p className="muted">Real-time hotspots, drainage & road inundation.</p>
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
            <div className="map-glass map-status-overlay">
              <span><i className="pulse-dot" /> LIVE FLOOD MONITORING</span>
              <small>Mumbai Metropolitan Region · 3D view</small>
            </div>
            <div className="map-glass map-layer-overlay">
              <b>INTELLIGENCE LAYERS</b>
              {[['risk', 'Flood Risk'], ['runoff', 'Rainfall'], ['depth', 'Water Depth'], ['network', 'Drainage'], ['depth', 'Roads']].map(([id, label], index) => (
                <label key={`${id}-${index}`}>
                  <input
                    type="checkbox"
                    checked={activeMapLayers[id] !== false}
                    onChange={() => toggleMapLayer(id)}
                  />
                  {label}
                </label>
              ))}
            </div>
            <div className="map-glass map-insight-overlay">
              <span>🌧 Rainfall <strong>{prediction.intensity} mm/hr</strong></span>
              <span>🌊 Maximum Depth <strong>{prediction.highestWaterDepth} cm</strong></span>
              <span>🚧 Roads Affected <strong>{affectedRoads}</strong></span>
            </div>
            <div className="map-glass map-legend-overlay">
              <span><i className="dash-legend critical" />Critical</span>
              <span><i className="dash-legend high" />High Risk</span>
              <span><i className="dash-legend moderate" />Moderate</span>
              <span><i className="dash-legend safe" />Safe</span>
            </div>
            <div className="digital-twin-badge">
              SMART CITY DIGITAL TWIN <span>SIMULATED TERRAIN</span>
            </div>
          </div>
          <div className="dashboard-map-footer">
            <span><i className="dash-legend critical" />Critical zone</span>
            <span><i className="dash-legend high" />High-risk zone</span>
            <span><i className="dash-legend moderate" />Moderate risk</span>
            <span><i className="dash-legend safe" />Safe / operational</span>
          </div>
        </Panel>

        <Panel className="priority-alerts-card">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">RANKED BY SEVERITY</span>
              <h2>Priority Alerts</h2>
            </div>
            <span className="alert-count">{priorityStreets.length} active</span>
          </div>
          <div className="dashboard-alert-list">
            {priorityStreets.map((street, index) => (
              <article
                className={`dashboard-alert ${focusedStreet === street.id ? 'selected' : ''}`}
                key={street.id}
                onClick={() => setFocusedStreet(street.id)}
              >
                <div className="dashboard-alert-top">
                  <span className="priority-rank-badge">P0{index + 1}</span>
                  <RiskBadge level={street.risk} />
                  <span className="depth-badge">{street.waterDepth} cm</span>
                </div>
                <h3>{street.name}</h3>
                <div className="alert-action-pill">
                  🚨 {street.waterDepth >= 60 ? 'Restrict traffic · Deploy pumps' : street.waterDepth >= 30 ? 'Prepare emergency response' : 'Monitor heavy vehicles'}
                </div>
                <button
                  type="button"
                  className="alert-inspect-btn"
                  onClick={(event) => {
                    event.stopPropagation()
                    setFocusedStreet(street.id)
                  }}
                >
                  Locate on Map <span>→</span>
                </button>
              </article>
            ))}
          </div>
          <Link className="text-link" to="/emergency-response">
            Open Emergency Response <span>→</span>
          </Link>
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

