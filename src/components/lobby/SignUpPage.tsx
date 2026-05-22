import { useNavigate } from 'react-router-dom'
import signupBg from '../../assets/signup_bg.webp'
import signupBgDesktop from '../../assets/signup_bg_desktop.webp'
import typoLogo from '../../assets/typo_logo.webp'

export default function SignUpPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* ── Backgrounds ── */}
      <div
        className="hidden md:block absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${signupBgDesktop})` }}
      />
      <div
        className="md:hidden absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${signupBg})` }}
      />

      {/* ── MOBILE LAYOUT (< md) ── */}
      <div className="md:hidden relative z-10 min-h-screen flex flex-col items-center justify-between py-8 px-4">
        {/* Logo at top */}
        <div className="w-full max-w-xs mt-2">
          <img
            src={typoLogo}
            alt="Kallanum Policeum"
            className="w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)]"
          />
        </div>

        <div className="flex-grow" />

        {/* Buttons at bottom */}
        <div className="w-full max-w-[340px] flex flex-col gap-3 mb-4">
          <GuestButton onClick={() => navigate('/home')} size="mobile" />
          <GoogleButton onClick={() => console.log('Google Sign Up')} size="mobile" />
          <TermsText />
        </div>
      </div>

      {/* ── DESKTOP LAYOUT (≥ md) ── */}
      <div className="hidden md:flex relative z-10 min-h-screen flex-col items-center justify-between py-10 px-6">
        {/* Logo at top */}
        <div className="w-full max-w-md mt-4">
          <img
            src={typoLogo}
            alt="Kallanum Policeum"
            className="w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)]"
          />
        </div>

        <div className="flex-grow" />

        {/* Buttons at bottom */}
        <div className="w-full max-w-[480px] flex flex-col gap-4 mb-2">
          <GuestButton onClick={() => navigate('/home')} size="desktop" />
          <GoogleButton onClick={() => console.log('Google Sign Up')} size="desktop" />
          <TermsText />
        </div>
      </div>

    </div>
  )
}

/* ─── Shared Sub-components ─── */

function GuestButton({ onClick, size }: { onClick: () => void; size: 'mobile' | 'desktop' }) {
  const isDesktop = size === 'desktop'
  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-2xl p-[3px] bg-gradient-to-b from-[#e3b84f] to-[#8d5e16] shadow-[0_8px_30px_rgba(0,0,0,0.7)] active:scale-[0.98] transition-all duration-150"
    >
      <div
        className={`flex items-center ${isDesktop ? 'px-5 py-4' : 'px-3 py-3'} bg-gradient-to-b from-[#d29b28] to-[#ab7416] rounded-[13px] border border-amber-300/30 group-hover:brightness-110 transition-all`}
      >
        <div className="flex-shrink-0 text-[#543b12]">
          <svg className={isDesktop ? 'w-12 h-12' : 'w-9 h-9'} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.686 2 6 4.686 6 8v1.5H4a1 1 0 0 0 0 2h16a1 1 0 0 0 0-2h-2V8c0-3.314-2.686-6-6-6zm0 2c2.21 0 4 1.79 4 4v1.5H8V8c0-2.21 1.79-4 4-4zm-5 9a1 1 0 0 0-1 1v2a4 4 0 0 0 8 0v-2a1 1 0 0 0-1-1H7zm1.5 2a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z" />
          </svg>
        </div>
        <div className="flex flex-col items-center flex-grow">
          <span className={`text-white font-black tracking-tight drop-shadow-md leading-tight ${isDesktop ? 'text-2xl' : 'text-[17px]'}`}>
            CONTINUE AS GUEST
          </span>
          <span className={`text-amber-100 font-bold tracking-widest uppercase leading-tight mt-0.5 ${isDesktop ? 'text-[13px]' : 'text-[10px]'}`}>
            JUMP INTO THE ACTION
          </span>
        </div>
        <div className={`flex-shrink-0 opacity-0 ${isDesktop ? 'w-12' : 'w-9'}`} />
      </div>
    </button>
  )
}

function GoogleButton({ onClick, size }: { onClick: () => void; size: 'mobile' | 'desktop' }) {
  const isDesktop = size === 'desktop'
  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-2xl p-[3px] bg-gradient-to-b from-white to-gray-300 shadow-[0_8px_30px_rgba(0,0,0,0.7)] active:scale-[0.98] transition-all duration-150"
    >
      <div
        className={`flex items-center ${isDesktop ? 'px-5 py-4' : 'px-3 py-3'} bg-gradient-to-b from-[#fdfdfd] to-[#e0e0e0] rounded-[13px] border border-white group-hover:brightness-105 transition-all`}
      >
        <div className="flex-shrink-0 bg-white rounded-full p-1.5 shadow-sm">
          <svg viewBox="0 0 24 24" className={isDesktop ? 'w-9 h-9' : 'w-6 h-6'}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        </div>
        <div className="flex flex-col items-center flex-grow">
          <span className={`text-[#2d2d2d] font-black tracking-tight leading-tight ${isDesktop ? 'text-2xl' : 'text-[17px]'}`}>
            SIGN UP WITH GOOGLE
          </span>
          <span className={`text-gray-500 font-bold tracking-widest uppercase leading-tight mt-0.5 ${isDesktop ? 'text-[13px]' : 'text-[10px]'}`}>
            QUICK, SAFE &amp; SECURE
          </span>
        </div>
        <div className={`flex-shrink-0 opacity-0 ${isDesktop ? 'w-12' : 'w-[30px]'}`} />
      </div>
    </button>
  )
}

function TermsText() {
  return (
    <div className="text-center text-[#d0c8b8] text-[12px] md:text-[13px] mt-2 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
      By continuing, you agree to our{' '}
      <a href="#" className="text-[#c1923e] hover:text-[#dca94b] transition-colors">Terms of Service</a>
      {' '}and{' '}
      <a href="#" className="text-[#c1923e] hover:text-[#dca94b] transition-colors">Privacy Policy</a>
    </div>
  )
}
