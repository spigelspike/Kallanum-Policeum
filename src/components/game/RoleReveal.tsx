import { useState, useEffect, useCallback } from 'react'
import { useGameStore } from '../../stores/gameStore'
import AnimatedRoleCard from './AnimatedRoleCard'

export default function RoleReveal() {
  const myRole = useGameStore((s) => s.myRole)
  const myRolePoints = useGameStore((s) => s.myRolePoints)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [exiting, setExiting] = useState(false)

  // Show overlay when role arrives
  useEffect(() => {
    if (myRole && !dismissed) {
      setVisible(true)
      setExiting(false)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [myRole, dismissed])

  // Reset dismissed state when role changes (new round)
  useEffect(() => {
    setDismissed(false)
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [myRole])

  const handleDismiss = useCallback(() => {
    setExiting(true)
    // Wait for exit animation to complete before removing
    setTimeout(() => {
      setVisible(false)
      setDismissed(true)
      setExiting(false)
    }, 400)
  }, [])

  if (!visible || !myRole) return null

  return (
    <div
      className="transition-all duration-400 ease-out"
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? 'scale(0.9)' : 'scale(1)',
        transition: 'opacity 400ms ease-out, transform 400ms ease-out',
      }}
    >
      <AnimatedRoleCard 
        role={myRole} 
        points={myRolePoints} 
        onDismiss={handleDismiss} 
      />
    </div>
  )
}
