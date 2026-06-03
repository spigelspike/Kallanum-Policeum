import { useState } from 'react'
import { playClick } from '../../utils/sounds'

interface BuyMeChaiModalProps {
  isOpen: boolean
  onClose: () => void
}

// ⚠️ REPLACE THIS WITH YOUR ACTUAL UPI ID
const MY_UPI_ID = "your_upi_id@bank"
const MY_NAME = "Developer"

const OPTIONS = [
  { 
    id: 'chai', 
    name: 'Chai', 
    icon: (
      <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
        <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
        <line x1="6" y1="2" x2="6" y2="4" />
        <line x1="10" y1="2" x2="10" y2="4" />
        <line x1="14" y1="2" x2="14" y2="4" />
      </svg>
    ), 
    amount: 20 
  },
  { 
    id: 'snacks', 
    name: 'Chai + Snacks', 
    icon: (
      <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
        <path d="M8.5 8.5v.01" />
        <path d="M16 12.5v.01" />
        <path d="M12 16v.01" />
        <path d="M11 12.5v.01" />
        <path d="M8 14v.01" />
      </svg>
    ), 
    amount: 40 
  },
  { 
    id: 'shawarma', 
    name: 'Shawarma', 
    icon: (
      <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v6Z" />
        <path d="M17 5v14" />
      </svg>
    ), 
    amount: 120 
  },
  { 
    id: 'mandhi', 
    name: 'Mandhi', 
    icon: (
      <svg className="w-6 h-6 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-1-4-1-4a3 3 0 0 1 6 0c0 2 0 4-1 6-.5 1-1 1.62-1 3a2.5 2.5 0 0 0 2.5 2.5 2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1-5 0 2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 0-2.5-2.5z" />
      </svg>
    ), 
    amount: 250 
  },
]

export default function BuyMeChaiModal({ isOpen, onClose }: BuyMeChaiModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('chai')
  const [customAmount, setCustomAmount] = useState<string>('')

  if (!isOpen) return null

  const currentAmount = selectedOption === 'custom' 
    ? (parseFloat(customAmount) || 0) 
    : (OPTIONS.find(o => o.id === selectedOption)?.amount || 0)

  // Generate UPI Payment URL
  const baseUpiUrl = `upi://pay?pa=${MY_UPI_ID}&pn=${encodeURIComponent(MY_NAME)}&cu=INR`
  const upiUrl = currentAmount > 0 ? `${baseUpiUrl}&am=${currentAmount}` : baseUpiUrl
  
  // Generate QR Code Image URL using a free public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}&color=0d0704&bgcolor=ffe58f`

  const handleClose = () => {
    playClick()
    onClose()
  }

  const handleOptionClick = (id: string) => {
    playClick()
    setSelectedOption(id)
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
                
                {/* Options Grid */}
                <div className="w-full grid grid-cols-2 gap-2 mb-4 z-10">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionClick(opt.id)}
                      className={`relative overflow-hidden p-2 rounded-lg border text-sm font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                        selectedOption === opt.id 
                          ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#ffe58f] shadow-[0_0_15px_rgba(212,175,55,0.3)]' 
                          : 'bg-black/40 border-[#5a3e15]/60 text-[#c89f59] hover:bg-black/60 hover:border-[#c89f59]/50'
                      }`}
                    >
                      <span className="flex items-center justify-center">{opt.icon}</span>
                      <span className="text-[11px] uppercase tracking-wider">{opt.name}</span>
                      <span className={`text-[10px] ${selectedOption === opt.id ? 'text-[#ffe58f]' : 'text-[#c89f59]/70'}`}>₹{opt.amount}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="w-full mb-6 z-10">
                  <div 
                    onClick={() => handleOptionClick('custom')}
                    className={`flex items-center w-full rounded-lg border transition-all ${
                      selectedOption === 'custom'
                        ? 'bg-[#d4af37]/20 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'bg-black/40 border-[#5a3e15]/60 hover:bg-black/60 hover:border-[#c89f59]/50'
                    }`}
                  >
                    <div className="pl-3 py-2 text-[#c89f59] font-bold flex items-center">
                      <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      Custom: ₹
                    </div>
                    <input 
                      type="number" 
                      min="1"
                      placeholder="Amount"
                      value={customAmount}
                      onChange={(e) => {
                        setCustomAmount(e.target.value)
                        setSelectedOption('custom')
                      }}
                      className="flex-1 bg-transparent border-none outline-none text-[#ffe58f] font-bold py-2 pr-3"
                    />
                  </div>
                </div>

                {/* QR Code Container (Desktop focused) */}
                <div className="bg-[#ffe58f] p-3 rounded-xl shadow-[0_0_30px_rgba(212,175,55,0.2)] mb-2 z-10 hidden md:block">
                  <div className="bg-white p-1 rounded-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="UPI QR Code" 
                      className="w-32 h-32 object-contain"
                    />
                  </div>
                  <p className="text-[#593d19] text-center text-[10px] mt-2 font-bold font-sans uppercase">
                    Scan to Pay {currentAmount > 0 ? `₹${currentAmount}` : ''}
                  </p>
                </div>

                {/* Mobile Pay Button */}
                <a 
                  href={upiUrl}
                  className="w-full mt-2 py-3.5 rounded-lg flex items-center justify-center gap-2 font-bold text-[#38230f] transition-all hover:brightness-110 active:scale-95 z-10"
                  style={{ background: 'linear-gradient(180deg, #ffe58f 0%, #d4af37 100%)', boxShadow: '0 4px 15px rgba(212,175,55,0.3)' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                  </svg>
                  Proceed {currentAmount > 0 ? `(₹${currentAmount})` : ''}
                </a>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
