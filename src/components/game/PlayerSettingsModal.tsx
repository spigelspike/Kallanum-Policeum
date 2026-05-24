import { useVoiceStore } from '../../stores/voiceStore'
import { useLanguageStore } from '../../stores/languageStore'
import { playClick } from '../../utils/sounds'
import type { Player } from '../../types/game'
import { avatarKeyToUrl } from '../../utils/avatarMap'

interface PlayerSettingsModalProps {
  player: Player
  onClose: () => void
}

export default function PlayerSettingsModal({ player, onClose }: PlayerSettingsModalProps) {
  const { localVolumeMap, localMutedMap, setLocalVolume, toggleLocalMute } = useVoiceStore()
  const { t } = useLanguageStore()

  const volume = localVolumeMap[player.id] ?? 100
  const isMuted = localMutedMap[player.id] ?? false
  const resolvedAvatar = avatarKeyToUrl(player.avatarKey)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={() => { playClick(); onClose() }}
      />
      
      <div className="relative w-full max-w-sm rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" style={{
        background: 'linear-gradient(180deg, rgba(26,15,8,0.95), rgba(13,7,4,0.95))',
        border: '1px solid rgba(212,175,55,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.8)'
      }}>
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between" style={{
          background: 'linear-gradient(90deg, rgba(212,175,55,0.1), transparent)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-[#c89f59] bg-[#0d0704] overflow-hidden flex-shrink-0">
              {resolvedAvatar ? (
                <img src={resolvedAvatar} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-full h-full text-[#c89f59] opacity-50 p-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              )}
            </div>
            <span className="font-serif font-black text-lg tracking-wider text-[#ffe58f]">
              {player.username}
            </span>
          </div>
          
          <button onClick={() => { playClick(); onClose() }} className="text-white/40 hover:text-white/80 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-6">
          
          {/* Mute Toggle */}
          <div className="flex items-center justify-between">
            <span className="font-serif text-[#c89f59] tracking-wider">
              {t.game.muteMicrophone || 'Mute Player'}
            </span>
            <button
              onClick={() => { playClick(); toggleLocalMute(player.id) }}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${
                isMuted ? 'bg-red-500/80' : 'bg-white/10'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute ${
                isMuted ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-[#c89f59] tracking-wider">
                {'Volume'}
              </span>
              <span className="font-mono text-xs text-white/50">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setLocalVolume(player.id, Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(90deg, #d4af37 ${volume}%, rgba(255,255,255,0.1) ${volume}%)`,
              }}
            />
          </div>

        </div>
      </div>
    </div>
  )
}
