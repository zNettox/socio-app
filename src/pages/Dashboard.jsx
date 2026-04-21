import React, { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  doc, getDoc, collection, addDoc, query, orderBy,
  onSnapshot, serverTimestamp, updateDoc, getDocs, setDoc
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { signOut, updateProfile } from 'firebase/auth'
import { auth, db } from '../firebase'

// ── Sound effects ──────────────────────────────────────────────────────────
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    if (type === 'send') {
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.1)
    } else if (type === 'receive') {
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.15)
    } else if (type === 'click') {
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08)
    } else if (type === 'success') {
      osc.frequency.setValueAtTime(520, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      osc.frequency.setValueAtTime(780, ctx.currentTime + 0.2)
    }
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.35)
  } catch {}
}

// ── PDF Generation ─────────────────────────────────────────────────────────
const generateProposalPDF = (content, userData) => {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()

  // Header background
  doc.setFillColor(10, 10, 10)
  doc.rect(0, 0, pageW, 45, 'F')

  // Logo text
  doc.setTextColor(242, 242, 242)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Sócio.', 14, 28)

  // Tagline
  doc.setFontSize(9)
  doc.setTextColor(180, 160, 100)
  doc.text('by Neves Software', 14, 37)

  // Business name
  doc.setFontSize(10)
  doc.setTextColor(180, 160, 100)
  doc.text(userData?.businessName || 'Meu Negócio', pageW - 14, 37, { align: 'right' })

  // Date
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text(new Date().toLocaleDateString('pt-BR'), pageW - 14, 28, { align: 'right' })

  // Title
  doc.setTextColor(20, 20, 20)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('Proposta Comercial', 14, 65)

  // Divider
  doc.setDrawColor(186, 117, 23)
  doc.setLineWidth(1)
  doc.line(14, 70, pageW - 14, 70)

  // Content
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(40, 40, 40)
  const lines = doc.splitTextToSize(content, pageW - 28)
  let y = 82
  lines.forEach(line => {
    if (y > 270) { doc.addPage(); y = 20 }
    doc.text(line, 14, y)
    y += 7
  })

  // Footer
  doc.setFillColor(240, 235, 224)
  doc.rect(0, 280, pageW, 17, 'F')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('Gerado por Sócio — usesocio.netlify.app', 14, 290)
  doc.text(new Date().toLocaleString('pt-BR'), pageW - 14, 290, { align: 'right' })

  return doc
}

// ── Constants ───────────────────────────────────────────────────────────────
const PLAN_LIMITS = {
  free: { messages: 10, label: 'Grátis' },
  pro: { messages: Infinity, label: 'Pro' },
  business: { messages: Infinity, label: 'Business' },
}

const QUICK_ACTIONS = [
  'Quanto devo cobrar pelo meu serviço?',
  'Cria uma proposta profissional',
  'Me dá uma ideia de promoção para essa semana',
  'Como posso aumentar meu faturamento?',
]

const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25 },
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [msgCount, setMsgCount] = useState(0)
  const [proposals, setProposals] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const user = auth.currentUser
  const plan = userData?.plan || 'free'
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const isLimited = plan === 'free' && msgCount >= limits.messages
  const displayName = userData?.profileName || userData?.businessName || 'você'

  // ── Load user data ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      if (snap.exists()) {
        const d = snap.data()
        setUserData(d)
        setMsgCount(d.msgCount || 0)
        setProfileName(d.profileName || d.businessName || '')
        setProfilePhoto(d.profilePhotoUrl || null)
      }
    })
    return unsub
  }, [])

  // ── Load conversations ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'conversations'), orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setConversations(convs)
      if (!activeConvId && convs.length > 0) setActiveConvId(convs[0].id)
    })
    return unsub
  }, [])

  // ── Load messages for active conversation ───────────────────────────────
  useEffect(() => {
    if (!user || !activeConvId) return
    const q = query(
      collection(db, 'users', user.uid, 'conversations', activeConvId, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [activeConvId])

  // ── Load proposals ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'proposals'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setProposals(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── New conversation ────────────────────────────────────────────────────
  const newConversation = async () => {
    playSound('click')
    const convRef = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
      title: 'Nova conversa',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    setActiveConvId(convRef.id)
    setMessages([])
    setActiveTab('chat')
    setSidebarOpen(false)
  }

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = async (text = input) => {
    if (!text.trim() || loading || isLimited) return
    playSound('send')

    let convId = activeConvId
    if (!convId) {
      const convRef = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
        title: text.slice(0, 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      convId = convRef.id
      setActiveConvId(convId)
    }

    setInput('')
    setLoading(true)

    await addDoc(collection(db, 'users', user.uid, 'conversations', convId, 'messages'), {
      role: 'user', content: text.trim(), createdAt: serverTimestamp(),
    })

    // Update conversation title from first message
    if (messages.length === 0) {
      await updateDoc(doc(db, 'users', user.uid, 'conversations', convId), {
        title: text.slice(0, 50),
        updatedAt: serverTimestamp(),
      })
    } else {
      await updateDoc(doc(db, 'users', user.uid, 'conversations', convId), {
        updatedAt: serverTimestamp(),
      })
    }

    const newCount = msgCount + 1
    setMsgCount(newCount)
    await updateDoc(doc(db, 'users', user.uid), { msgCount: newCount })

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          userData,
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.reply || 'Desculpe, não consegui processar sua mensagem.'

      playSound('receive')

      await addDoc(collection(db, 'users', user.uid, 'conversations', convId, 'messages'), {
        role: 'assistant', content: reply, createdAt: serverTimestamp(),
      })

      // Detect proposal in reply and save it
      const isProposal = reply.toLowerCase().includes('proposta') && reply.length > 200
      if (isProposal) {
        await addDoc(collection(db, 'users', user.uid, 'proposals'), {
          title: text.slice(0, 50) || 'Proposta',
          content: reply,
          createdAt: serverTimestamp(),
          businessName: userData?.businessName || 'Meu negócio',
        })
        playSound('success')
      }
    } catch {
      await addDoc(collection(db, 'users', user.uid, 'conversations', convId, 'messages'), {
        role: 'assistant', content: 'Erro de conexão. Tente novamente.', createdAt: serverTimestamp(),
      })
    } finally {
      setLoading(false)
    }
  }

  // ── Download PDF ────────────────────────────────────────────────────────
  const downloadPDF = async (proposal) => {
    playSound('success')
    try {
      const pdfdoc = generateProposalPDF(proposal.content, userData)
      pdfdoc.save(`proposta-${proposal.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
    } catch (err) {
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  // ── Save profile ────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setSavingProfile(true)
    playSound('success')
    try {
      await updateDoc(doc(db, 'users', user.uid), { profileName })
      setShowProfile(false)
    } catch {}
    setSavingProfile(false)
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      // Store as base64 in Firestore (no Storage needed)
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const url = ev.target.result
        setProfilePhoto(url)
        await updateDoc(doc(db, 'users', user.uid), { profilePhotoUrl: url })
      }
      reader.readAsDataURL(file)
    } catch {}
  }

  const handleLogout = async () => {
    playSound('click')
    await signOut(auth)
    navigate('/')
  }

  const switchConv = (id) => {
    playSound('click')
    setActiveConvId(id)
    setSidebarOpen(false)
    setActiveTab('chat')
  }

  const switchTab = (id) => {
    playSound('click')
    setActiveTab(id)
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ebe0] flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <header className="border-b border-white/[0.07] px-4 py-3 flex items-center justify-between sticky top-0 bg-[#080808]/95 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle */}
          <button onClick={() => { setSidebarOpen(s => !s); playSound('click') }}
            className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors md:hidden">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 4h14M2 9h14M2 14h14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="font-syne font-black text-xl">sócio<span className="text-[#BA7517]">.</span></div>
        </div>

        <div className="flex items-center gap-2">
          {plan === 'free' && (
            <button onClick={() => navigate('/checkout?plan=pro_mensal_promo')}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#BA7517] text-white hover:bg-[#9a6113] transition-colors hidden md:block">
              Fazer upgrade
            </button>
          )}
          {/* Profile button */}
          <button onClick={() => { setShowProfile(true); playSound('click') }}
            className="w-8 h-8 rounded-full overflow-hidden border border-white/20 hover:border-[#BA7517]/50 transition-colors flex-shrink-0">
            {profilePhoto
              ? <img src={profilePhoto} alt="perfil" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-[#BA7517]/20 flex items-center justify-center text-xs font-bold text-[#BA7517]">
                  {displayName[0]?.toUpperCase()}
                </div>
            }
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed md:relative z-30 md:z-auto top-0 md:top-auto left-0 h-full md:h-auto w-64 bg-[#0a0a0a] md:bg-transparent border-r border-white/[0.07] flex flex-col pt-16 md:pt-0"
            >
              <div className="p-3 border-b border-white/[0.07]">
                <button onClick={newConversation}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#BA7517]/10 border border-[#BA7517]/20 text-[#FAC775] text-sm font-medium hover:bg-[#BA7517]/20 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 3v10M3 8h10" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Nova conversa
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {conversations.length === 0 && (
                  <p className="text-xs text-white/25 text-center py-6">Nenhuma conversa ainda</p>
                )}
                {conversations.map(conv => (
                  <button key={conv.id} onClick={() => switchConv(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors truncate ${
                      activeConvId === conv.id
                        ? 'bg-white/[0.08] text-white'
                        : 'text-white/50 hover:bg-white/[0.04] hover:text-white/80'
                    }`}>
                    {conv.title || 'Nova conversa'}
                  </button>
                ))}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Tabs */}
          <div className="border-b border-white/[0.07] px-4 flex gap-1 overflow-x-auto">
            {[
              { id: 'chat', label: 'Assistente' },
              { id: 'proposals', label: 'Propostas' },
              { id: 'pricing', label: 'Precificação' },
              { id: 'cashflow', label: 'Caixa' },
              { id: 'support', label: 'Suporte' },
            ].map(tab => (
              <button key={tab.id} onClick={() => switchTab(tab.id)}
                className={`py-3 px-3 text-sm whitespace-nowrap transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'border-[#BA7517] text-[#FAC775] font-medium'
                    : 'border-transparent text-white/40 hover:text-white/60'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Limit banner */}
          {isLimited && (
            <div className="bg-[#BA7517]/10 border-b border-[#BA7517]/20 px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm text-[#FAC775]">Créditos gratuitos esgotados.</span>
              <button onClick={() => navigate('/checkout?plan=pro_mensal_promo')}
                className="text-xs font-medium bg-[#BA7517] text-white px-3 py-1.5 rounded-lg">
                Pro por R$19,90
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Chat Tab ────────────────────────────────────────────────── */}
            {activeTab === 'chat' && (
              <motion.div key="chat" {...pageTransition} className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
                  {messages.length === 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                      <div className="w-14 h-14 rounded-2xl bg-[#BA7517]/10 border border-[#BA7517]/20 flex items-center justify-center mx-auto mb-5">
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <text x="4" y="22" fontSize="22" fontWeight="600" fill="#BA7517" fontFamily="Inter">S</text>
                          <circle cx="22" cy="7" r="3" fill="#D4A373"/>
                        </svg>
                      </div>
                      <h3 className="font-syne font-bold text-xl mb-1">Olá, {displayName}!</h3>
                      <p className="text-white/40 text-sm mb-8">Como posso ajudar seu negócio hoje?</p>
                      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                        {QUICK_ACTIONS.map(action => (
                          <button key={action} onClick={() => sendMessage(action)} disabled={isLimited}
                            className="text-sm text-left px-4 py-3 rounded-xl border border-white/[0.08] text-white/60 hover:border-[#BA7517]/40 hover:text-white/80 transition-all duration-200 disabled:opacity-40">
                            {action}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {messages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                        msg.role === 'assistant' ? 'bg-[#BA7517] text-white' : 'bg-white/10 text-white/60'
                      }`}>
                        {msg.role === 'assistant'
                          ? <svg width="18" height="18" viewBox="0 0 28 28"><text x="4" y="22" fontSize="22" fontWeight="600" fill="white" fontFamily="Inter">S</text></svg>
                          : profilePhoto
                            ? <img src={profilePhoto} alt="" className="w-full h-full object-cover rounded-lg" />
                            : displayName[0]?.toUpperCase()
                        }
                      </div>
                      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'assistant'
                          ? 'bg-white/[0.05] border border-white/[0.07] text-white/80'
                          : 'bg-[#BA7517]/20 text-[#FAC775] border border-[#BA7517]/20'
                      }`}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}

                  {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#BA7517] flex items-center justify-center text-xs font-bold text-white">S</div>
                      <div className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center gap-1.5">
                        {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-[#BA7517] animate-bounce" style={{ animationDelay: `${d}ms` }}/>)}
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/[0.07] px-4 py-3 max-w-3xl mx-auto w-full">
                  {plan === 'free' && msgCount < limits.messages && (
                    <div className="text-xs text-white/25 text-center mb-2">
                      {limits.messages - msgCount} mensagens restantes no plano grátis
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input type="text" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder={isLimited ? 'Faça upgrade para continuar...' : `Pergunte algo para o Sócio...`}
                      className="input-field flex-1"
                      disabled={loading || isLimited}
                    />
                    <button onClick={() => sendMessage()} disabled={!input.trim() || loading || isLimited}
                      className="bg-[#BA7517] text-white px-4 rounded-xl hover:bg-[#9a6113] transition-colors disabled:opacity-40 active:scale-95">
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M2 9h14M9 2l7 7-7 7" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Proposals Tab ───────────────────────────────────────────── */}
            {activeTab === 'proposals' && (
              <motion.div key="proposals" {...pageTransition} className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
                <h2 className="font-syne font-bold text-xl mb-1">Minhas Propostas</h2>
                <p className="text-white/40 text-sm mb-6">Propostas geradas pelo assistente — prontas para baixar em PDF.</p>

                {proposals.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">📄</div>
                    <p className="text-white/40 text-sm">Nenhuma proposta gerada ainda.</p>
                    <p className="text-white/25 text-xs mt-1">Peça ao assistente para criar uma proposta.</p>
                    <button onClick={() => switchTab('chat')}
                      className="mt-4 text-sm text-[#BA7517] hover:text-[#FAC775] transition-colors">
                      Ir para o assistente →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.map(p => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="border border-white/[0.08] rounded-xl p-5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#BA7517]/10 flex items-center justify-center flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                              <path d="M4 2h7l4 4v10H4V2z" stroke="#BA7517" strokeWidth="1.2" strokeLinejoin="round"/>
                              <path d="M11 2v4h4" stroke="#BA7517" strokeWidth="1.2" strokeLinejoin="round"/>
                              <path d="M6 9h6M6 12h4" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white/80">{p.title}</div>
                            <div className="text-xs text-white/30 mt-0.5">
                              {p.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || 'Hoje'}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => downloadPDF(p)}
                          className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg bg-[#BA7517]/10 text-[#FAC775] border border-[#BA7517]/20 hover:bg-[#BA7517]/20 transition-colors flex-shrink-0">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2v7M4 6l3 3 3-3M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="#FAC775" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Baixar PDF
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Pricing Tab ─────────────────────────────────────────────── */}
            {activeTab === 'pricing' && (
              <motion.div key="pricing" {...pageTransition} className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="font-syne font-bold text-xl mb-2">Calculadora de preços</h3>
                  <p className="text-white/40 text-sm">Em breve — use o assistente por enquanto</p>
                  <button onClick={() => switchTab('chat')} className="mt-4 text-sm text-[#BA7517] hover:text-[#FAC775] transition-colors">
                    Perguntar ao assistente →
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Cashflow Tab ─────────────────────────────────────────────── */}
            {activeTab === 'cashflow' && (
              <motion.div key="cashflow" {...pageTransition} className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="font-syne font-bold text-xl mb-2">Controle de caixa</h3>
                  <p className="text-white/40 text-sm">Em breve</p>
                </div>
              </motion.div>
            )}

            {/* ── Support Tab ─────────────────────────────────────────────── */}
            {activeTab === 'support' && (
              <motion.div key="support" {...pageTransition} className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
                <h2 className="font-syne font-bold text-xl mb-1">Suporte</h2>
                <p className="text-white/40 text-sm mb-8">Fale diretamente com a equipe da Neves Software.</p>

                <div className="border border-white/[0.08] rounded-2xl p-6 bg-white/[0.02]">
                  <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/[0.07]">
                    <div className="w-14 h-14 rounded-xl bg-[#BA7517]/10 border border-[#BA7517]/20 flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
                        <text x="10" y="46" fontSize="48" fontWeight="600" fill="#F2F2F2" fontFamily="Inter">S</text>
                        <circle cx="44" cy="18" r="5" fill="#D4A373"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-syne font-bold text-base">Neves Software</div>
                      <div className="text-xs text-white/40 mt-0.5">Suporte ao cliente — Sócio App</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="text-xs text-white/30 mb-1.5">CEO — Atendimento direto</div>
                      <a href="https://wa.me/5592981417222"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => playSound('click')}
                        className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/[0.04] hover:bg-green-500/[0.08] transition-colors group">
                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 2C5.58 2 2 5.58 2 10c0 1.5.41 2.9 1.12 4.1L2 18l4.1-1.08A7.96 7.96 0 0010 18c4.42 0 8-3.58 8-8s-3.58-8-8-8z" stroke="#4ade80" strokeWidth="1.3"/>
                            <path d="M7.5 8.5c.2.8.7 1.6 1.4 2.3.7.7 1.5 1.2 2.3 1.4l.8-.8c.1-.1.3-.1.4 0l1.4 1.4c.1.1.1.3 0 .4l-.8.8c-1.8.3-4.2-1.4-5.3-3.5l.8-.8c.1-.1.1-.3 0-.4L7.1 8.1c-.1-.1-.3-.1-.4 0l-.7.4" stroke="#4ade80" strokeWidth="1.3" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">WhatsApp — (92) 98141-7222</div>
                          <div className="text-xs text-white/35 mt-0.5">Clique para abrir o WhatsApp</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/30 group-hover:text-white/60 transition-colors">
                          <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                    </div>

                    <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02]">
                      <div className="text-xs text-white/30 mb-2">Horário de atendimento</div>
                      <div className="text-sm text-white/60">Segunda a sexta — 9h às 18h</div>
                      <div className="text-xs text-white/30 mt-1">Respondemos em até 2 horas</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ── Profile Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showProfile && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/70" onClick={() => setShowProfile(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#111] border border-white/[0.1] rounded-2xl p-6 shadow-2xl">
              <h3 className="font-syne font-bold text-lg mb-5">Meu perfil</h3>

              {/* Photo */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white/10">
                    {profilePhoto
                      ? <img src={profilePhoto} alt="perfil" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-[#BA7517]/20 flex items-center justify-center text-xl font-bold text-[#BA7517]">
                          {displayName[0]?.toUpperCase()}
                        </div>
                    }
                  </div>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#BA7517] flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M6 2v8M2 6h8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <div>
                  <div className="text-sm font-medium">{userData?.businessName}</div>
                  <div className="text-xs text-white/40 mt-0.5">{user?.email}</div>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs text-white/40 mb-1.5 block">Como quer ser chamado?</label>
                <input type="text" value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  placeholder="Ex: Cleusa, Mario, Ana..."
                  className="input-field"
                />
                <p className="text-xs text-white/25 mt-1.5">Aparece na saudação: "Olá, {profileName || '...'}!"</p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowProfile(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/15 text-white/50 text-sm hover:border-white/25 transition-colors">
                  Cancelar
                </button>
                <button onClick={saveProfile} disabled={savingProfile}
                  className="flex-1 py-2.5 rounded-lg bg-[#BA7517] text-white text-sm font-medium hover:bg-[#9a6113] transition-colors disabled:opacity-50">
                  {savingProfile ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              <button onClick={handleLogout}
                className="w-full mt-3 py-2 text-xs text-white/30 hover:text-white/60 transition-colors">
                Sair da conta
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}