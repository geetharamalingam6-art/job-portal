import { BrowserRouter, Route, Routes } from 'react-router-dom'
import JobDetail from './JobDetail'
import JobList from './JobList'
import Login from './Login'
import Register from './Register'
import ResumeUpload from './ResumeUpload'
import UserDashboard from './UserDashboard'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JobList />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/resume" element={<ResumeUpload />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
