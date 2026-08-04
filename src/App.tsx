import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import SignUpPage from './components/lobby/SignUpPage'
import HomeScreen from './components/lobby/HomeScreen'
import GameRoom from './components/game/GameRoom'
import ResultsPage from './components/results/ResultsPage'
import RoomNotFound from './components/common/RoomNotFound'

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignUpPage />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/room/:code" element={<GameRoom />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/not-found" element={<RoomNotFound />} />
        </Routes>
      </BrowserRouter>
      <Analytics />
    </>
  )
}

export default App
