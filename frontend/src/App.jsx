import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StudentDetail from './pages/StudentDetail'
import IntegrationHub from './pages/IntegrationHub'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/student/:id" element={<StudentDetail />} />
          <Route path="/integrate" element={<IntegrationHub />} />
        </Routes>
      </main>
    </div>
  )
}
