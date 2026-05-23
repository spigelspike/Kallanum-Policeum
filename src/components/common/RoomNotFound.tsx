import { useNavigate } from 'react-router-dom'
import { playClick } from '../../utils/sounds'
import roomNotFoundBgDesktop from '../../assets/room_not_found_desktop.webp'
import roomNotFoundBgMobile from '../../assets/room_not_found.webp'

export default function RoomNotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0a0a] text-white flex flex-col items-center justify-center select-none font-serif">
      
      {/* Background Overlay */}
      <div className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60" style={{ backgroundImage: `url(${roomNotFoundBgDesktop})` }} />
      <div className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60" style={{ backgroundImage: `url(${roomNotFoundBgMobile})` }} />
      
      {/* Vignette Layer */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.9) 100%)' }} />
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl px-4 mt-24">
        
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-[0_4px_10px_rgba(0,0,0,1)]" style={{
          background: 'linear-gradient(180deg, #fff8e1 0%, #ffe58f 30%, #d4af37 70%, #8a6b20 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Room Not Found
        </h1>
        
        {/* Subtitle */}
        <p className="text-slate-300/80 text-center text-sm md:text-base font-medium mb-10 max-w-md">
          Looks like this room doesn't exist<br/>or has already ended.
        </p>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full max-w-md">
          <button 
            onClick={() => { playClick(); navigate('/home') }}
            className="flex-1 py-3.5 rounded-full font-bold transition-all hover:scale-105 shadow-[0_5px_20px_rgba(0,0,0,0.6)] flex items-center justify-center gap-3 border border-[#ffe58f]" style={{
            background: 'linear-gradient(180deg, #d4af37 0%, #b8860b 40%, #8a6b20 100%)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.3), 0 5px 20px rgba(0,0,0,0.8)'
          }}>
            <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9z" />
            </svg>
            <span className="text-black text-sm md:text-base font-black tracking-wide drop-shadow-sm">Back to Lobby</span>
          </button>

          <button 
            onClick={() => { playClick(); navigate('/home?mode=create') }}
            className="flex-1 py-3.5 rounded-full font-bold transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_20px_rgba(59,130,246,0.15)] flex items-center justify-center gap-3 bg-[#0d121c] border border-[#2a3a5a] hover:border-[#3b5284]"
          >
            <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z"/>
            </svg>
            <span className="text-slate-300 text-sm md:text-base font-bold tracking-wide">Create New Room</span>
          </button>
        </div>

        {/* Hint Box */}
        <div className="w-full max-w-lg bg-[#0a0f18]/80 backdrop-blur-md rounded-2xl border border-[#1e2a42] p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#d4af37]/10 flex-shrink-0">
             <svg className="w-5 h-5 text-[#d4af37]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
            </svg>
          </div>
          <div className="flex flex-col pt-1">
             <h4 className="text-slate-200 font-bold text-sm md:text-base mb-1">Make sure you entered the right room code.</h4>
             <p className="text-slate-400 text-xs md:text-sm">Check the code and try again.</p>
          </div>
        </div>

      </div>
    </div>
  )
}
