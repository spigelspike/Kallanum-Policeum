import { useVoiceStore } from '../../stores/voiceStore'
import { useLanguageStore } from '../../stores/languageStore'
import { useProfileStore } from '../../stores/profileStore'
import { playClick } from '../../utils/sounds'

export default function VoiceControls() {
  const { isMuted, isDeafened, toggleMute, toggleDeafen } = useVoiceStore()
  const { t } = useLanguageStore()
  const myAvatar = useProfileStore((s) => s.avatar)

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
      
      {/* Profile Picture */}
      {myAvatar && (
        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border-2 border-orange-500/50 bg-black/50 p-0.5 sm:p-1 flex-shrink-0 ml-1">
          <img src={myAvatar} alt="Profile" className="w-full h-full object-contain" />
        </div>
      )}

      {/* Microphone Toggle */}
      <button
        onClick={() => { playClick(); toggleMute() }}
        className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
          isMuted 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30'
        }`}
        title={isMuted ? t.game.unmuteMicrophone : t.game.muteMicrophone}
      >
        {isMuted ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        )}
      </button>

      {/* Headphones Toggle */}
      <button
        onClick={() => { playClick(); toggleDeafen() }}
        className={`w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
          isDeafened 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
            : 'bg-white/10 text-white/80 border border-white/20 hover:bg-white/20'
        }`}
        title={isDeafened ? t.game.undeafen : t.game.deafen}
      >
        {isDeafened ? (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M18.54 18.54A8 8 0 0 1 3 12V9a2 2 0 0 1 2-2h1M21 12V9a2 2 0 0 0-2-2h-1M3 14v4a2 2 0 0 0 2 2h2v-6H3zM21 14v4a2 2 0 0 1-2 2h-2v-6h4z"></path>
          </svg>
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
          </svg>
        )}
      </button>

    </div>
  )
}
