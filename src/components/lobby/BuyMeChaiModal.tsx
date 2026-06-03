import { useState } from 'react'
import { playClick } from '../../utils/sounds'

interface BuyMeChaiModalProps {
  isOpen: boolean
  onClose: () => void
}

// ⚠️ REPLACE THIS WITH YOUR ACTUAL UPI ID
const MY_UPI_ID = "your_upi_id@bank"
const MY_NAME = "Developer"

export default function BuyMeChaiModal({ isOpen, onClose }: BuyMeChaiModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  // Generate UPI Payment URL
  const upiUrl = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(MY_NAME)}&cu=INR`
  
  // Generate QR Code Image URL using a free public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}&color=0d0704&bgcolor=ffe58f`

  const handleCopy = () => {
    playClick()
    navigator.clipboard.writeText(MY_UPI_ID)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    playClick()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[400px] z-10 animate-in zoom-in-95 duration-300">
        
        {/* Layer 1: Outermost dark frame */}
        <div className="rounded-[22px] p-[3px]" style={{ background: 'linear-gradient(145deg, #2a1a0a, #0d0805, #2a1a0a)' }}>
          {/* Layer 2: Golden metallic rim */}
          <div className="rounded-[19px] p-[3px]" style={{ background: 'linear-gradient(160deg, #d4af37 0%, #a67c00 20%, #593d19 40%, #a67c00 60%, #d4af37 80%, #8a6b20 100%)' }}>
            {/* Layer 3: Inner dark edge */}
            <div className="rounded-[16px] p-[2px]" style={{ background: 'linear-gradient(145deg, #1a1008, #0a0604)' }}>
              {/* Layer 4: Main body */}
              <div className="rounded-[14px] relative overflow-hidden flex flex-col items-center pt-8 pb-6 px-6 sm:px-8" style={{ background: 'linear-gradient(180deg, #2c1a0e 0%, #1a0f08 40%, #0d0704 100%)' }}>
                
                {/* Texture overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }} />

                {/* Close Button */}
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 p-1.5 rounded-full text-[#c89f59] hover:text-[#ffe58f] hover:bg-white/5 transition-colors z-20"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Icon & Title */}
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border-2 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.3)] z-10" style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                }}>
                  <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                    <line x1="6" y1="2" x2="6" y2="4" />
                    <line x1="10" y1="2" x2="10" y2="4" />
                    <line x1="14" y1="2" x2="14" y2="4" />
                  </svg>
                </div>
                
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-center mb-2 z-10" style={{
                  background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                }}>
                  Buy Me a Chai
                </h2>
                
                <p className="text-[#c89f59] text-center text-sm sm:text-base mb-6 z-10">
                  If you enjoy catching the Kallan, consider fueling the developer!
                </p>

                {/* QR Code Container */}
                <div className="bg-[#ffe58f] p-3 rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.2)] mb-6 z-10">
                  <div className="bg-white p-1 rounded-lg">
                    <a href={upiUrl} target="_blank" rel="noopener noreferrer">
                      <img 
                        src={qrCodeUrl} 
                        alt="UPI QR Code" 
                        className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
                      />
                    </a>
                  </div>
                  <p className="text-[#593d19] text-center text-xs mt-2 font-bold font-sans">
                    Scan with any UPI app
                  </p>
                </div>

                {/* UPI ID Copy Box */}
                <div className="w-full flex items-center justify-between bg-black/40 border border-[#c89f59]/30 rounded-lg p-3 z-10">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-[#c89f59]/70 uppercase font-bold tracking-wider mb-0.5">UPI ID</span>
                    <span className="text-[#ffe58f] font-mono text-sm sm:text-base truncate">{MY_UPI_ID}</span>
                  </div>
                  <button 
                    onClick={handleCopy}
                    className="ml-3 p-2 rounded bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-[#c89f59]"
                    title="Copy UPI ID"
                  >
                    {copied ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Mobile Pay Button */}
                <a 
                  href={upiUrl}
                  className="w-full mt-4 py-3 rounded-lg flex items-center justify-center gap-2 font-bold text-[#38230f] transition-all hover:brightness-110 active:scale-95 z-10 md:hidden"
                  style={{ background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 100%)' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Pay with UPI App
                </a>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
