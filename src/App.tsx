import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUpPage from './components/lobby/SignUpPage'
import HomeScreen from './components/lobby/HomeScreen'
import GameRoom from './components/game/GameRoom'
import ResultsPage from './components/results/ResultsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUpPage />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/room/:code" element={<GameRoom />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
