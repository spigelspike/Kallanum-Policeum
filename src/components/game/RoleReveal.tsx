import { useState, useEffect } from 'react'
import { useGameStore } from '../../stores/gameStore'
import AnimatedRoleCard from './AnimatedRoleCard'

export default function RoleReveal() {
  const myRole = useGameStore((s) => s.myRole)
  const myRolePoints = useGameStore((s) => s.myRolePoints)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Show overlay when role arrives
  useEffect(() => {
    if (myRole && !dismissed) {
      setVisible(true)
    }
  }, [myRole, dismissed])

  // Reset dismissed state when role changes (new round)
  useEffect(() => {
    setDismissed(false)
  }, [myRole])

  if (!visible || !myRole) return null

  return (
    <AnimatedRoleCard 
      role={myRole} 
      points={myRolePoints} 
      onDismiss={() => {
        setVisible(false)
        setDismissed(true)
      }} 
    />
  )
}
