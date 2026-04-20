import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'

const SocioAvatar = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ borderRadius: 10, flexShrink: 0 }}>
    <rect width="64" height="64" rx="14" fill="#111"/>
    <text x="10" y="46" fontSize="48" fontWeight="600" fill="#F2F2F2" fontFamily="Inter, sans-serif">S</text>
    <circle cx="44" cy="18" r="5" fill="#D4A373"/>
  </svg>
)

const UserAvatar = ({ name, size = 32 }) => {
  const initials = name ? name.slice(0, 2).toUpperCase() : 'EU'
  return (
    <div style={{ width: size, height: size, borderRadius: 10, background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#BA7517', fontFamily: 'DM Sans, sans-serif' }}>{initials}</span>
    </div>
  )
}

const IconChat = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 13l3 3v-3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconPricing = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="4" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
    <circle cx="9" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M1 7.5h3M14 7.5h3M1 11.5h3M14 11.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconCash = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M2 13l4-5 3 3 4-6 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 2v14h14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconProfile = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8h12M8 2l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const QUICK_ACTIONS = [
  'Quanto devo cobrar pelo meu serviço?',
  'Cria uma proposta profissional',
  'Me dá uma ideia de promoção para esta semana',
  'Quanto estou ganhando por hora de trabalho?',
]

// Subscription popup
function SubscribePopup({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-sm bg-[#0f0f0f] border border-white/[0.08] rounded-2xl p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/70 transition-colors"
        >
          <IconClose />
        </button>

        <div className="mb-6">
          <div className="text-xs font-medium text-[#BA7517] tracking-widest uppercase mb-3">Oferta de lançamento</div>
          <h2 className="font-syne font-black text-2xl text-white mb-2 leading-tight">
            Desbloqueie o Sócio completo
          </h2>
          <p className="text-white/45 text-sm leading-relaxed">
            Precificação com dados reais, propostas ilimitadas e assistente personalizado para o seu negócio.
          </p>
        </div>

        <div className="bg-[#BA7517]/[0.08] border border-[#BA7517]/20 rounded-xl p-4 mb-6">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-syne font-black text-3xl text-[#BA7517]">R$19,90</span>
            <span className="text-white/30 text-sm">no primeiro mês</span>
          </div>
          <div className="text-xs text-white/40">depois R$49,90/mês — cancele quando quiser</div>
        </div>

        <div className="space-y-2 mb-6">
          {['Precificação com mercado real', 'Propostas ilimitadas em PDF', 'Assistente personalizado', 'Controle de caixa completo'].map(item => (
            <div key={item} className="flex items-center gap-2.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#BA7517" strokeWidth="1"/>
                <path d="M4.5 7l2 2 3-3" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm text-white/60">{item}</span>
            </div>
          ))}
        </div>

        <button className="w-full py-3.5 rounded-xl bg-[#BA7517] text-white font-medium text-sm hover:bg-[#9a6113] transition-all active:scale-95">
          Assinar por R$19,90
        </button>
        <button onClick={onClose} className="w-full mt-2 py-2 text-xs text-white/30 hover:text-white/50 transition-colors">
          Continuar no plano grátis
        </button>
      </motion.div>
    </motion.div>
  )
}

// Profile menu dropdown
function ProfileMenu({ userData, onClose, onLogout }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-64 bg-[#111] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-50"
    >
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <UserAvatar name={userData?.businessName} size={36} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white/90 truncate">{userData?.businessName || 'Meu negócio'}</div>
            <div className="text-xs text-white/40 truncate">{auth.currentUser?.email}</div>
          </div>
        </div>
        <div className="mt-3 px-2 py-1 rounded-lg bg-[#BA7517]/10 border border-[#BA7517]/20 flex items-center justify-between">
          <span className="text-xs text-[#BA7517]">Plano Grátis</span>
          <span className="text-xs text-[#BA7517] font-medium cursor-pointer hover:underline">Fazer upgrade</span>
        </div>
      </div>
      <div className="p-2">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left">
          <span className="text-white/40"><IconProfile /></span>
          <span className="text-sm text-white/70">Meu perfil</span>
        </button>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.05] transition-colors text-left">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.22 3.22l1.41 1.41M13.37 13.37l1.41 1.41M3.22 14.78l1.41-1.41M13.37 4.63l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-white/40"/>
            <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.2" className="text-white/40"/>
          </svg>
          <span className="text-sm text-white/70">Configurações</span>
        </button>
        <div className="my-1 border-t border-white/[0.06]" />
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-left"
        >
          <span className="text-red-400/70"><IconLogout /></span>
          <span className="text-sm text-red-400/70">Sair da conta</span>
        </button>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [showPopup, setShowPopup] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const messagesEndRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setUserData(snap.data())
    })

    const q = query(collection(db, 'users', user.uid, 'messages'), orderBy('createdAt', 'asc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
    })

    // Show popup after 30 seconds
    const timer = setTimeout(() => setShowPopup(true), 30000)

    return () => { unsub(); clearTimeout(timer) }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close profile menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return
    const user = auth.currentUser
    setInput('')
    setLoading(true)

    await addDoc(collection(db, 'users', user.uid, 'messages'), {
      role: 'user',
      content: text.trim(),
      createdAt: serverTimestamp(),
    })

    try {
      const response = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          userData,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await response.json()

      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        role: 'assistant',
        content: data.reply,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        role: 'assistant',
        content: 'Desculpe, algo deu errado. Tente novamente.',
        createdAt: serverTimestamp(),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut(auth)
    navigate('/')
  }

  const TABS = [
    { id: 'chat', label: 'Assistente', Icon: IconChat },
    { id: 'pricing', label: 'Precificação', Icon: IconPricing },
    { id: 'cashflow', label: 'Caixa', Icon: IconCash },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ebe0] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header className="border-b border-white/[0.07] px-6 py-3.5 flex items-center justify-between sticky top-0 bg-[#080808]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <SocioAvatar size={32} />
          <div>
            <div className="font-syne font-black text-base leading-none">
              sócio<span className="text-[#BA7517]">.</span>
            </div>
            <div className="text-[9px] text-white/25 tracking-widest uppercase">by Neves Software</div>
          </div>
        </div>

        {/* Tabs — desktop */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                activeTab === id
                  ? 'bg-[#BA7517] text-white font-medium'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPopup(true)}
            className="hidden md:flex text-xs font-medium px-3 py-1.5 rounded-lg bg-[#BA7517] text-white hover:bg-[#9a6113] transition-colors"
          >
            Assinar Pro
          </button>
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfile(v => !v)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <UserAvatar name={userData?.businessName} size={32} />
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/30">
                <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <AnimatePresence>
              {showProfile && (
                <ProfileMenu userData={userData} onClose={() => setShowProfile(false)} onLogout={handleLogout} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-white/[0.07]">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs transition-all border-b-2 -mb-px ${
              activeTab === id
                ? 'border-[#BA7517] text-[#FAC775] font-medium'
                : 'border-transparent text-white/35'
            }`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
          <div className="flex-1 overflow-y-auto py-6 space-y-5">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <SocioAvatar size={48} />
                <h3 className="font-syne font-bold text-xl mb-2 mt-4">
                  Olá{userData?.businessName ? `, ${userData.businessName}` : ''}!
                </h3>
                <p className="text-white/40 text-sm mb-8">Como posso ajudar seu negócio hoje?</p>
                <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="text-sm text-left px-4 py-3 rounded-xl border border-white/[0.08] text-white/55 hover:border-[#BA7517]/40 hover:text-white/80 transition-all duration-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className="flex-shrink-0">
                    {msg.role === 'assistant'
                      ? <SocioAvatar size={32} />
                      : <UserAvatar name={userData?.businessName} size={32} />
                    }
                  </div>
                  <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[10px] text-white/25 px-1">
                      {msg.role === 'assistant' ? 'Sócio' : 'Você'}
                    </span>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'assistant'
                        ? 'rounded-bl-sm bg-white/[0.05] border border-white/[0.08] text-white/80'
                        : 'rounded-br-sm bg-[#BA7517]/20 text-[#FAC775] border border-[#BA7517]/20'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-end">
                <SocioAvatar size={32} />
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/[0.05] border border-white/[0.08] flex items-center gap-2">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[#BA7517] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="py-4 border-t border-white/[0.07]">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Pergunte algo para o seu Sócio..."
                className="input-field flex-1"
                disabled={loading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl bg-[#BA7517] flex items-center justify-center flex-shrink-0 hover:bg-[#9a6113] transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                <IconSend />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 flex justify-center opacity-40"><IconPricing /></div>
            <h3 className="font-syne font-bold text-xl mb-2">Calculadora de preços</h3>
            <p className="text-white/40 text-sm">Em breve — use o assistente por enquanto</p>
          </div>
        </div>
      )}

      {/* Cashflow Tab */}
      {activeTab === 'cashflow' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4 flex justify-center opacity-40"><IconCash /></div>
            <h3 className="font-syne font-bold text-xl mb-2">Controle de caixa</h3>
            <p className="text-white/40 text-sm">Em breve — use o assistente por enquanto</p>
          </div>
        </div>
      )}

      {/* Subscribe popup */}
      <AnimatePresence>
        {showPopup && <SubscribePopup onClose={() => setShowPopup(false)} />}
      </AnimatePresence>
    </div>
  )
}