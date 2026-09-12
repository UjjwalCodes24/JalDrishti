import { Panel } from '../ui'

const PRESET_CORRIDORS = [
  { label: 'Kurla ➔ Sion Hospital', origin: 'Kurla Station', destination: 'Sion Hospital' },
  { label: 'Andheri ➔ BKC', origin: 'Andheri East', destination: 'Bandra Kurla Complex' },
  { label: 'Dharavi ➔ Airport', origin: 'Dharavi Junction', destination: 'Mumbai Airport' },
  { label: 'BKC ➔ Bandra West', origin: 'Bandra Kurla Complex', destination: 'Bandra West' },
]

export default function RoutePlanner({
  locations = [],
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onCalculate,
  loading,
  googleMapsAvailable,
}) {
  const handlePreset = (preset) => {
    onOriginChange(preset.origin)
    onDestinationChange(preset.destination)
    if (onCalculate) {
      setTimeout(() => onCalculate(preset.origin, preset.destination), 50)
    }
  }

  return (
    <Panel className="route-planner">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">NAVIGATION INTELLIGENCE</span>
          <h2>Plan Flood-Safe Travel Route</h2>
        </div>
        <div className="planner-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={() => onCalculate()}
            disabled={loading}
          >
            {loading ? 'ANALYZING ROUTES…' : 'FIND FLOOD-SAFE ROUTE'}
          </button>
        </div>
      </div>

      <div className="route-preset-bar">
        <span className="preset-label">CRISIS CORRIDORS:</span>
        <div className="preset-chips">
          {PRESET_CORRIDORS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={`preset-chip ${origin === preset.origin && destination === preset.destination ? 'active' : ''}`}
              onClick={() => handlePreset(preset)}
              disabled={loading}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="route-select-grid">
        <label>
          <span>Start Location (Origin)</span>
          <input
            list="jaldrishti-locations"
            value={origin}
            onChange={(event) => onOriginChange(event.target.value)}
            placeholder="e.g. Kurla Station"
          />
        </label>
        <label>
          <span>Destination</span>
          <input
            list="jaldrishti-locations"
            value={destination}
            onChange={(event) => onDestinationChange(event.target.value)}
            placeholder="e.g. Sion Hospital"
          />
        </label>
      </div>

      <datalist id="jaldrishti-locations">
        {locations.map((location) => (
          <option key={location.id || location.name} value={location.name} />
        ))}
      </datalist>

      <div className="route-planner-footer">
        <span className={`routing-engine-badge ${googleMapsAvailable ? 'google-active' : 'sim-active'}`}>
          <span className="status-dot" />
          {googleMapsAvailable ? 'Google Maps Routing Active' : 'JalDrishti Simulation Active (Fallback)'}
        </span>
        <p className="route-planner-note">
          Google Maps generates road network geometry and turn-by-turn navigation. JalDrishti evaluates predicted water depth, drainage surcharge, and road blockages to recommend the safest viable route.
        </p>
      </div>
    </Panel>
  )
}
