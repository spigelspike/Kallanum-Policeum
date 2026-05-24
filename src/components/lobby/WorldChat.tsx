import { useEffect, useRef, useState } from 'react'
import { getAblyClient } from '../../lib/ably'
import { supabase } from '../../lib/supabase'
import { useGameStore } from '../../stores/gameStore'
import { useProfileStore } from '../../stores/profileStore'
import { useLanguageStore } from '../../stores/languageStore'


export default function WorldChat() {
  const {
    worldChatMessages,
    worldChatOnlineCount,
    setWorldChatMessages,
    addWorldChatMessage,
    setWorldChatOnlineCount,
    myPlayerId,
  } = useGameStore()
  const { name } = useProfileStore()
  const { t } = useLanguageStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [reportingId, setReportingId] = useState<string | null>(null)

  const channelRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lastSentAt = useRef<number>(0)
  const isAutoScrollEnabled = useRef(true)

  // Determine username color based on hash for consistency
  const getUsernameColor = (id: string) => {
    let hash = 0
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash % 360)
    return `hsl(${hue}, 70%, 65%)`
  }

  // Load initial history
  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('world_chat')
        .select('id, player_id, username, message, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        const history = data.reverse().map(d => ({
          id: d.id,
          playerId: d.player_id,
          username: d.username,
          message: d.message,
          timestamp: new Date(d.created_at).getTime()
        }))
        setWorldChatMessages(history)
      }
      setLoading(false)
    }
    
    // Only load if empty to prevent jumping
    if (useGameStore.getState().worldChatMessages.length === 0) {
      loadHistory()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [setWorldChatMessages])

  // Ably Pub/Sub & Presence
  useEffect(() => {
    if (!myPlayerId || !name) return

    const client = getAblyClient()
    const channel = client.channels.get('world-chat')
    channelRef.current = channel

    // Message subscription
    const onMessage = (msg: any) => {
      console.log('[Ably] Received message:', msg)
      if (msg.name === 'message' || msg.data?.message) {
        addWorldChatMessage(msg.data)
      }
    }
    // Subscribe to ALL events on the channel
    channel.subscribe(onMessage)

    // Presence update helper
    const updateCount = async () => {
      const members = await channel.presence.get()
      setWorldChatOnlineCount(members.length)
    }

    // Presence subscription
    channel.presence.subscribe('enter', updateCount)
    channel.presence.subscribe('leave', updateCount)
    
    // Enter presence
    channel.presence.enter({ username: name, playerId: myPlayerId }).then(updateCount)

    return () => {
      channel.presence.leave()
      channel.presence.unsubscribe('enter', updateCount)
      channel.presence.unsubscribe('leave', updateCount)
      channel.unsubscribe(onMessage)
      // Do not close client as it is a singleton
    }
  }, [myPlayerId, name, addWorldChatMessage, setWorldChatOnlineCount])

  // Auto-scroll logic
  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    // If we are within 50px of the bottom, enable auto-scroll
    isAutoScrollEnabled.current = scrollHeight - scrollTop - clientHeight < 50
  }

  useEffect(() => {
    if (isAutoScrollEnabled.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [worldChatMessages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || !myPlayerId) return

    const now = Date.now()
    if (now - lastSentAt.current < 1500) {
      setErrorMsg('Slow down...')
      setTimeout(() => setErrorMsg(''), 1500)
      return
    }

    setSending(true)
    setInput('') // Optimistic clear
    lastSentAt.current = now

    // Optimistic Update: Instantly show message in UI
    addWorldChatMessage({
      id: `temp-${now}`,
      playerId: myPlayerId,
      username: name,
      message: trimmed,
      timestamp: now
    })

    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await supabase.functions.invoke('send-world-chat', {
        body: { message: trimmed },
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.error) {
        throw new Error(res.error.message || 'Failed to send')
      }
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.message || 'Error sending message')
      setInput(trimmed) // Restore input on failure
      
      // Rollback optimistic update
      const { worldChatMessages, setWorldChatMessages } = useGameStore.getState()
      setWorldChatMessages(worldChatMessages.filter(m => m.id !== `temp-${now}`))

      setTimeout(() => setErrorMsg(''), 3000)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleReport = async (messageId: string) => {
    if (reportingId) return
    setReportingId(messageId)
    try {
      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token
      if (!token) return

      await supabase.functions.invoke('report-world-chat', {
        body: { messageId },
        headers: { Authorization: `Bearer ${token}` }
      })
      alert(t.chat.reportSuccess)
    } catch (err) {
      console.error(err)
    } finally {
      setReportingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#110d0a] border border-[#5a3e15]/40 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1a120e] border-b border-[#5a3e15]/40">
        <h2 className="text-sm font-black tracking-widest text-[#d4af37] uppercase font-serif flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
          {t.chat.worldChat}
        </h2>
        <div className="flex items-center gap-2 text-xs text-[#c89f59]/80 font-medium bg-[#0d0704] px-2 py-1 rounded border border-[#5a3e15]/30">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></span>
          {worldChatOnlineCount} {t.chat.online}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[#5a3e15]/40 scrollbar-track-transparent"
        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(90,55,20,0.05) 0%, transparent 100%)' }}
      >
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse opacity-50">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex gap-2 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                <div className="w-8 h-8 rounded-full bg-[#5a3e15]/40"></div>
                <div className="w-32 h-10 rounded-lg bg-[#5a3e15]/20"></div>
              </div>
            ))}
          </div>
        ) : worldChatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <svg className="w-12 h-12 text-[#c89f59] mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-[#c89f59] font-medium text-sm">{t.chat.noMessages}<br/>{t.chat.beFirst}</p>
          </div>
        ) : (
          worldChatMessages.map((msg, idx) => {
            const isMe = msg.playerId === myPlayerId || msg.username === name
            const showHeader = idx === 0 || worldChatMessages[idx - 1].playerId !== msg.playerId || msg.timestamp - worldChatMessages[idx - 1].timestamp > 60000

            // Format relative time (e.g. "2m ago", "just now")
            // eslint-disable-next-line react-hooks/purity
            const diffMs = Date.now() - msg.timestamp
            let timeStr = t.chat.justNow
            if (diffMs > 3600000) timeStr = `${Math.floor(diffMs / 3600000)}${t.chat.hours} ${t.chat.ago}`
            else if (diffMs > 60000) timeStr = `${Math.floor(diffMs / 60000)}${t.chat.minutes} ${t.chat.ago}`

            return (
              <div key={msg.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                {showHeader && (
                  <div className="flex items-baseline gap-2 mb-1 px-1">
                    {!isMe && <span className="text-[11px] font-bold" style={{ color: getUsernameColor(msg.playerId) }}>{msg.username}</span>}
                    {isMe && <span className="text-[11px] font-bold text-[#c89f59]">{t.chat.you}</span>}
                    <span className="text-[9px] text-white/30 font-medium">{timeStr}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                  {/* Left Report Button (for others' messages) */}
                  {!isMe && (
                    <button 
                      onClick={() => handleReport(msg.id)}
                      disabled={reportingId === msg.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/20 hover:text-red-400 focus:outline-none"
                      title={t.chat.reportMessage}
                    >
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                      </svg>
                    </button>
                  )}

                  {/* Message Bubble */}
                  <div 
                    className={`max-w-[220px] sm:max-w-[260px] px-3 py-2 rounded-xl text-sm break-words whitespace-pre-wrap leading-relaxed shadow-sm
                      ${isMe 
                        ? 'bg-gradient-to-br from-[#d4af37]/20 to-[#8a6b20]/10 text-white/90 rounded-br-sm border border-[#d4af37]/20' 
                        : 'bg-[#1a120e] text-white/80 rounded-bl-sm border border-[#5a3e15]/40'
                      }`}
                  >
                    {msg.message}
                  </div>

                  {/* Right Report Button (shouldn't report own messages but space filler for alignment if needed, not necessary) */}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#1a120e] border-t border-[#5a3e15]/40">
        <form onSubmit={handleSend} className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 200))}
              onKeyDown={handleKeyDown}
              placeholder={t.chat.saySomething}
              disabled={sending}
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 3) : 1}
              className="w-full bg-[#0a0604] border border-[#5a3e15]/50 rounded-lg px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/30 transition-all resize-none overflow-hidden"
              style={{ minHeight: '42px' }}
            />
            {input.length > 0 && (
              <div className={`absolute right-2 bottom-2 text-[10px] ${input.length >= 200 ? 'text-red-400 font-bold' : 'text-white/30'}`}>
                {input.length}/200
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="flex-shrink-0 h-[42px] w-[42px] rounded-lg bg-gradient-to-b from-[#d4af37] to-[#aa8c2c] text-[#0a0604] flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all active:scale-95 shadow-lg"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-[#0a0604]/20 border-t-[#0a0604] rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        </form>
        {errorMsg && (
          <p className="absolute bottom-14 left-4 text-xs text-red-400 bg-red-950/80 px-2 py-1 rounded animate-fade-in border border-red-900/50 backdrop-blur-sm">
            {errorMsg}
          </p>
        )}
      </div>
    </div>
  )
}
