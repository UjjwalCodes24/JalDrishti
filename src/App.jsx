import './styles/global.css'
import './styles/interactions.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import DashboardPage from './pages/DashboardPage'
import FloodRiskMapPage from './pages/FloodRiskMapPage'
import AINowcastPage from './pages/AINowcastPage'
import ExplainableAIPage from './pages/ExplainableAIPage'
import EmergencyResponsePage from './pages/EmergencyResponsePage'
import SafeRoutePage from './pages/SafeRoutePage'

function App() {
  return <BrowserRouter><Routes><Route element={<AppShell />}><Route path="/" element={<DashboardPage />} /><Route path="/dashboard" element={<DashboardPage />} /><Route path="/risk-map" element={<FloodRiskMapPage />} /><Route path="/safe-routes" element={<SafeRoutePage />} /><Route path="/nowcast" element={<AINowcastPage />} /><Route path="/explainable-ai" element={<ExplainableAIPage />} /><Route path="/emergency-response" element={<EmergencyResponsePage />} /></Route></Routes></BrowserRouter>
}

export default App