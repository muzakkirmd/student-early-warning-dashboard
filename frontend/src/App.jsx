import { Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import StudentDetail from './pages/StudentDetail'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/student/:id" element={<StudentDetail />} />
        </Routes>
      </main>
    </div>
  )
}
