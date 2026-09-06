const routeTypes = [
  { id: 'Emergency Vehicle', label: 'Emergency Vehicle', icon: '🚑', detail: 'Safety first, then response time' },
  { id: 'Public Transport', label: 'Public Transport', icon: '🚌', detail: 'Prioritizes accessible major corridors' },
  { id: 'Commuter', label: 'Commuter', icon: '🚗', detail: 'Balances safety and reasonable travel time' },
]

export default function RouteTypeSelector({ selectedType, onSelectType }) {
  return <div className="route-type-selector" role="group" aria-label="Route mode">{routeTypes.map((type) => <button type="button" key={type.id} className={selectedType === type.id ? 'active' : ''} onClick={() => onSelectType(type.id)}><span aria-hidden="true">{type.icon}</span><strong>{type.label}</strong><small>{type.detail}</small></button>)}</div>
}
