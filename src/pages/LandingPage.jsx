import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/landing.css'

const rain = Array.from({ length: 34 }, (_, index) => ({ left: `${(index * 29) % 100}%`, delay: `${(index % 9) * -0.42}s`, duration: `${1.4 + (index % 5) * 0.22}s` }))
const features = [
  ['⌖', 'Flood Risk Intelligence', 'Identify high-risk areas and predicted water accumulation before streets become impassable.', 'cyan'],
  ['◒', 'AI Nowcasting', 'Analyse short-term rainfall intensity and translate it into local flood impact forecasts.', 'blue'],
  ['◎', 'Explainable AI', 'See why a ward is at risk, from terrain and runoff to drainage overload.', 'violet'],
  ['⇢', 'Flood-Safe Routes', 'Direct emergency teams and commuters through safer, operational corridors.', 'green'],
  ['!', 'Emergency Response', 'Convert intelligence into priority alerts, resource deployment and field action.', 'red'],
  ['▦', 'Smart City Digital Twin', 'Explore a GIS-based model of urban systems, flood layers and street conditions.', 'orange'],
]
const pipeline = [
  ['01', 'Rainfall Intelligence', 'Observations + nowcasting inputs', '🌧'],
  ['02', 'Urban Surface Analysis', 'Terrain, elevation + runoff', '▦'],
  ['03', 'Drainage Intelligence', 'Capacity + overload signals', '≋'],
  ['04', 'AI Flood Risk Engine', 'Multi-factor hotspot detection', '◒'],
  ['05', 'Decision Support', 'Alerts, routes + recommendations', '⚠'],
]

function LandingPage() {
  const [activeStage, setActiveStage] = useState(3)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('is-visible')), { threshold: 0.12 })
    document.querySelectorAll('.landing .reveal').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <div className="landing">
      <header className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
        <Link to="/" className="landing-brand"><span className="brand-symbol">◒</span><span><strong>JalDrishti</strong><small>Urban Flood Intelligence System</small></span></Link>
        <nav className="landing-links" aria-label="Landing page navigation"><a href="#about">About</a><a href="#how-it-works">How It Works</a><a href="#features">Features</a><a href="#technology">Technology</a></nav>
        <Link to="/dashboard" className="landing-nav-cta">Launch Command Center <span>→</span></Link>
      </header>

      <main>
        <section className="landing-hero" id="about">
          <div className="hero-grid" />
          <div className="hero-copy reveal"><div className="hero-kicker"><span className="live-dot" /> LIVE URBAN FLOOD INTELLIGENCE <i /> MUMBAI METROPOLITAN REGION</div><h1>See the flood<br /><em>before it happens.</em></h1><p>JalDrishti transforms rainfall, terrain and drainage intelligence into actionable flood predictions for the cities that cannot afford to wait.</p><div className="hero-actions"><Link to="/dashboard" className="hero-primary">Launch Command Center <span>→</span></Link><a href="#how-it-works" className="hero-secondary"><span className="play-icon">▶</span> Explore how it works</a></div><div className="hero-proof"><span><b>01</b> PREDICT</span><span><b>02</b> PREPARE</span><span><b>03</b> PROTECT</span></div></div>
          <div className="twin-wrap reveal"><div className="twin-label"><span className="live-dot" /> DIGITAL TWIN / LIVE SIMULATION <b>2026.09.04</b></div><div className="city-twin" aria-label="Animated digital twin flood visualization"><div className="rain-layer">{rain.map((drop, index) => <i key={index} style={{ '--left': drop.left, '--delay': drop.delay, '--duration': drop.duration }} />)}</div><div className="contours" /><div className="water-flow flow-a" /><div className="water-flow flow-b" /><div className="city-blocks">{Array.from({ length: 20 }, (_, index) => <i key={index} style={{ '--x': `${(index * 31) % 92}%`, '--y': `${12 + ((index * 17) % 65)}%`, '--h': `${18 + (index % 4) * 12}px` }} />)}</div><div className="road road-one" /><div className="road road-two" /><div className="road road-three" /><span className="hotspot hotspot-critical">P0<span>CRITICAL</span></span><span className="hotspot hotspot-warning">P1<span>HIGH RISK</span></span><span className="hotspot hotspot-water">P2<span>ACCUMULATION</span></span><div className="twin-scale"><span>LOW</span><i /><span>CRITICAL</span></div></div><div className="twin-meta"><span><i className="map-dot red" /> Critical zone</span><span><i className="map-dot orange" /> High risk</span><span><i className="map-dot blue" /> Water accumulation</span><strong>3D TERRAIN / 14 LAYERS</strong></div></div>
          <div className="system-card reveal"><div className="system-card-head"><span className="live-dot" /> SYSTEM ONLINE</div><strong>Mumbai Metropolitan<br />Region</strong><div className="system-lines"><span>🌧 <b>Rainfall Monitoring</b><i>CONNECTED</i></span><span>⌖ <b>Flood Risk Analysis</b><i>LIVE</i></span><span>! <b>Emergency Intelligence</b><i>READY</i></span></div><small>LIVE DATA PIPELINE <span>↗</span></small></div>
        </section>

        <section className="problem-section reveal"><div className="section-intro"><span className="section-kicker">THE URBAN FLOOD PROBLEM</span><h2>Flooding is not<br /><em>just about rain.</em></h2><p>Traditional weather forecasts can tell authorities how much rain may fall. They cannot always tell them exactly where that rainfall will accumulate, which streets may flood, or what action should be taken.</p></div><div className="causal-chain">{[['🌧', 'Rainfall'], ['⌁', 'Urban Surface Runoff'], ['⌖', 'Terrain & Elevation'], ['≋', 'Drainage Capacity'], ['🌊', 'Street-Level Flooding']].map(([icon, label], index) => <div key={label} className="causal-node"><span>{icon}</span><strong>{label}</strong>{index < 4 && <i>↓</i>}</div>)}</div><div className="problem-callout"><span>JD</span><strong>JalDrishti connects weather intelligence<br />with urban infrastructure intelligence.</strong><b>→</b></div></section>

        <section className="process-section" id="how-it-works"><div className="section-heading reveal"><div><span className="section-kicker">FROM SIGNAL TO DECISION</span><h2>How JalDrishti works.</h2></div><p>One connected intelligence layer for the entire urban flood response.</p></div><div className="pipeline reveal">{pipeline.map((item, index) => <button type="button" className={`pipeline-step ${activeStage === index ? 'active' : ''}`} key={item[0]} onClick={() => setActiveStage(index)}><span className="pipeline-number">{item[0]}</span><span className="pipeline-icon">{item[3]}</span><strong>{item[1]}</strong><small>{item[2]}</small>{index < pipeline.length - 1 && <i>→</i>}</button>)}</div><div className="pipeline-detail reveal"><div><span className="detail-kicker">ACTIVE INTELLIGENCE LAYER / {pipeline[activeStage][0]}</span><h3>{pipeline[activeStage][1]}</h3><p>{pipeline[activeStage][2]}. The engine continuously updates this signal as new observations arrive, keeping the command center one step ahead of the street.</p></div><div className="detail-readout"><span>MODEL CONFIDENCE</span><strong>{[94, 89, 86, 91, 97][activeStage]}%</strong><div><i style={{ width: `${[94, 89, 86, 91, 97][activeStage]}%` }} /></div><small>UPDATED 14:20 IST · STREAMING</small></div></div></section>

        <section className="features-section" id="features"><div className="section-heading reveal"><div><span className="section-kicker">A COMPLETE DECISION SYSTEM</span><h2>From flood risk to<br /><em>field action.</em></h2></div><p>Built for municipal command rooms, emergency teams and the people they protect.</p></div><div className="feature-grid reveal">{features.map(([icon, title, text, tone], index) => <article className={`feature-card ${tone}`} key={title}><span className="feature-icon">{icon}</span><span className="feature-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p><a href="#technology">Explore capability <span>↗</span></a></article>)}</div></section>

        <section className="compare-section reveal"><div className="compare-intro"><span className="section-kicker">A CHANGE IN OPERATING MODEL</span><h2>Reactive cities<br /><em>wait. Intelligent cities act.</em></h2><p>JalDrishti shifts the operating model from response after impact to preparation before it.</p></div><div className="compare-columns"><div className="compare-column reactive"><span className="compare-tag">✕ TRADITIONAL / REACTIVE</span>{['🌧 Rainfall', '🌊 Flood occurs', '🚗 Traffic disruption', '🚨 Emergency response'].map((item, index) => <div key={item}><strong>{item}</strong>{index < 3 && <i>↓</i>}</div>)}<b>Action happens after the crisis.</b></div><div className="compare-column proactive"><span className="compare-tag">✓ JALDRISHTI / PROACTIVE</span>{['🌧 Rainfall Intelligence', '◒ Risk Prediction', '⚠ Early Warning', '🚑 Resource Preparation', '🚧 Preventive Action'].map((item, index) => <div key={item}><strong>{item}</strong>{index < 4 && <i>↓</i>}</div>)}<b>Action begins before the situation becomes critical.</b></div></div></section>

        <section className="command-preview" id="technology"><div className="preview-copy reveal"><span className="section-kicker">THE COMMAND CENTER</span><h2>One view of the<br /><em>whole situation.</em></h2><p>See the city as a living system. Monitor flood status, critical zones, rainfall indicators, priority alerts and impact forecasts from one operational interface.</p><div className="preview-points"><span>◉ Live flood status</span><span>◉ Critical zone ranking</span><span>◉ Street-level impact forecast</span></div><Link to="/dashboard" className="dark-button">Enter the Command Center <span>→</span></Link></div><div className="dashboard-preview reveal"><div className="preview-top"><span><i className="live-dot" /> JALDRISHTI / COMMAND CENTER</span><b>LIVE · MUMBAI</b></div><div className="preview-alert"><span>🔴 CURRENT STATUS</span><strong>CRITICAL ALERT</strong><small>Rainfall intensity rising across Mithi Basin</small></div><div className="preview-metrics"><span><b>61</b> mm/h rainfall</span><span><b>87</b> risk score</span><span><b>45</b> min to impact</span></div><div className="preview-map"><div className="preview-radar" /><i /><i /><i /><span>LIVE FLOOD SITUATION MAP</span></div><div className="preview-footer"><span>▰ 3 Critical zones</span><span>≋ 78% Drainage load</span><span>→ 2 Safe corridors</span></div></div></section>

        <section className="architecture-section reveal"><div className="section-heading"><div><span className="section-kicker">UNDER THE SURFACE</span><h2>Built for urban<br /><em>flood intelligence.</em></h2></div><p>A connected architecture that turns fragmented city data into decisions people can act on.</p></div><div className="architecture"><div className="arch-inputs"><span>Rainfall & Weather Data</span><b>+</b><span>Terrain / DEM Data</span><b>+</b><span>Drainage Network Data</span></div><div className="arch-arrow">↓</div><div className="arch-core"><span>INTELLIGENCE LAYER</span><strong>AI & Flood Intelligence Engine</strong><small>COUPLED HYDROLOGICAL · TERRAIN · NETWORK MODEL</small></div><div className="arch-arrow">↓</div><div className="arch-output"><span>Flood Risk Prediction</span><b>↓</b><span>JalDrishti Command Center</span><b>↓</b><strong>Alerts · Safe Routes · Emergency Response</strong></div></div></section>

        <section className="final-cta"><div className="cta-orbit" /><span className="section-kicker">THE NEXT RAINFALL EVENT IS ALREADY A DATASET</span><h2>Don’t wait for the<br /><em>flood to happen.</em></h2><p>Predict. Prepare. Protect.</p><Link to="/dashboard" className="hero-primary">Launch JalDrishti Command Center <span>→</span></Link><small>URBAN FLOOD INTELLIGENCE SYSTEM · MUMBAI METROPOLITAN REGION</small></section>
      </main>
      <footer className="landing-footer"><span><b>JalDrishti</b> / Urban Flood Intelligence System</span><span>Built for resilient Indian cities <i>•</i> 2026</span></footer>
    </div>
  )
}

export default LandingPage