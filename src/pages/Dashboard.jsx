import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'

const PLAN_LIMITS = {
  free: { messages: 10, label: 'Grátis', proposals: 3 },
  pro: { messages: Infinity, label: 'Pro', proposals: Infinity },
  business: { messages: Infinity, label: 'Business', proposals: Infinity },
}

const QUICK_ACTIONS = [
  'Quanto devo cobrar pelo meu serviço?',
  'Cria uma proposta profissional',
  'Me dá uma ideia de promoção para essa semana',
  'Como posso aumentar meu faturamento?',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [msgCount, setMsgCount] = useState(0)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        setUserData(snap.data())
        setMsgCount(snap.data().msgCount || 0)
      }
    })

    const q = query(
      collection(db, 'users', user.uid, 'messages'),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
      setMessages(msgs)
    })

    return unsub
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const plan = userData?.plan || 'free'
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free
  const isLimited = plan === 'free' && msgCount >= limits.messages

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading || isLimited) return
    const user = auth.currentUser
    setInput('')
    setLoading(true)

    await addDoc(collection(db, 'users', user.uid, 'messages'), {
      role: 'user',
      content: text.trim(),
      createdAt: serverTimestamp(),
    })

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

      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        role: 'assistant',
        content: data.reply || 'Desculpe, não consegui processar sua mensagem.',
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      await addDoc(collection(db, 'users', user.uid, 'messages'), {
        role: 'assistant',
        content: 'Erro de conexão. Tente novamente em instantes.',
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

  const businessName = userData?.businessName || 'Meu negócio'

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ebe0] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/[0.07] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#080808]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="font-syne font-black text-xl">sócio<span className="text-[#BA7517]">.</span></div>
          <div className="hidden md:block h-4 w-px bg-white/10" />
          <div className="hidden md:block text-sm text-white/40">{businessName}</div>
        </div>
        <div className="flex items-center gap-3">
          <span
            onClick={() => plan === 'free' && navigate('/checkout?plan=pro_mensal_promo')}
            className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors ${
              plan === 'free'
                ? 'bg-[#BA7517]/10 text-[#FAC775] border-[#BA7517]/30 hover:bg-[#BA7517]/20'
                : 'bg-white/5 text-white/30 border-white/10'
            }`}
          >
            {plan === 'free' ? '⚡ Fazer upgrade' : `Plano ${limits.label}`}
          </span>
          <button onClick={handleLogout} className="text-sm text-white/40 hover:text-white/70 transition-colors">
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/[0.07] px-6 flex gap-6">
        {[
          { id: 'chat', label: 'Assistente' },
          { id: 'pricing', label: 'Precificação' },
          { id: 'cashflow', label: 'Caixa' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 text-sm transition-all duration-200 border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-[#BA7517] text-[#FAC775] font-medium'
                : 'border-transparent text-white/40 hover:text-white/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Plan limit banner */}
      {isLimited && (
        <div className="bg-[#BA7517]/10 border-b border-[#BA7517]/20 px-6 py-3 flex items-center justify-between">
          <span className="text-sm text-[#FAC775]">
            Você usou seus {limits.messages} créditos gratuitos.
          </span>
          <button
            onClick={() => navigate('/checkout?plan=pro_mensal_promo')}
            className="text-xs font-medium bg-[#BA7517] text-white px-4 py-1.5 rounded-lg hover:bg-[#9a6113] transition-colors"
          >
            Assinar Pro por R$19,90
          </button>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
          <div className="flex-1 overflow-y-auto py-6 space-y-4">
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
                <div className="text-3xl mb-4">👋</div>
                <h3 className="font-syne font-bold text-xl mb-2">Olá, {businessName}!</h3>
                <p className="text-white/40 text-sm mb-8">Como posso ajudar seu negócio hoje?</p>
                <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      disabled={isLimited}
                      className="text-sm text-left px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:border-[#BA7517]/40 hover:text-white/80 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.role === 'assistant' ? 'bg-[#BA7517] text-white' : 'bg-white/10 text-white/60'
                  }`}>
                    {msg.role === 'assistant' ? 'S' : 'Eu'}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'assistant'
                      ? 'bg-white/[0.05] border border-white/[0.08] text-white/80'
                      : 'bg-[#BA7517]/20 text-[#FAC775] border border-[#BA7517]/20'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#BA7517] flex items-center justify-center text-xs font-bold text-white">S</div>
                <div className="px-4 py-3 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center gap-2">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[#BA7517] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="py-4 border-t border-white/[0.07]">
            {plan === 'free' && (
              <div className="text-xs text-white/30 text-center mb-2">
                {limits.messages - msgCount > 0 ? `${limits.messages - msgCount} mensagens restantes no plano grátis` : ''}
              </div>
            )}
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder={isLimited ? 'Faça upgrade para continuar...' : 'Pergunte algo para o seu Sócio...'}
                className="input-field flex-1"
                disabled={loading || isLimited}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading || isLimited}
                className="bg-[#BA7517] text-white px-5 rounded-xl hover:bg-[#9a6113] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="font-syne font-bold text-xl mb-2">Calculadora de preços</h3>
            <p className="text-white/40 text-sm">Em breve — use o assistente por enquanto</p>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="font-syne font-bold text-xl mb-2">Controle de caixa</h3>
            <p className="text-white/40 text-sm">Em breve — use o assistente por enquanto</p>
          </div>
        </div>
      )}
    </div>
  )
}