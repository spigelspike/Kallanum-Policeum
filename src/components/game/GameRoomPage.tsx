import { useParams } from 'react-router-dom'

export default function GameRoomPage() {
  const { code } = useParams<{ code: string }>()

  return (
    <div>
      <h1>Game Room</h1>
      <p>Room code: {code}</p>
    </div>
  )
}
