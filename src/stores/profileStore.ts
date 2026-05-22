import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileState {
  hasProfile: boolean
  name: string
  gender: 'male' | 'female' | null
  avatar: string | null
  avatarKey: string | null
  setProfile: (name: string, gender: 'male' | 'female', avatar: string, avatarKey: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      hasProfile: false,
      name: '',
      gender: null,
      avatar: null,
      avatarKey: null,
      setProfile: (name, gender, avatar, avatarKey) =>
        set({ hasProfile: true, name, gender, avatar, avatarKey }),
    }),
    {
      name: 'kallanum-profile-storage',
    }
  )
)

