// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Practice from './pages/Practice'
import Verbs from './pages/Verbs'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="practice" element={<Practice />} />
        <Route path="verbs" element={<Verbs />} />
      </Route>
    </Routes>
  )
}

export default App
