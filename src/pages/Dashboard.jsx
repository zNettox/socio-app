import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'

const QUICK_ACTIONS = [
  'Quanto devo cobrar pelo meu serviço?',
  'Cria uma proposta profissional',
  'Me dá uma ideia de promoção',
  'Quanto estou ganhando por hora?',
]

export default function Dashboard() {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    // Load user data
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setUserData(snap.data())
    })

    // Load messages
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

  const sendMessage = async (text = input) => {
    if (!text.trim() || loading) return
    const user = auth.currentUser
    setInput('')
    setLoading(true)

    // Save user message
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

  const businessLabel = userData?.businessName || 'Meu negócio'

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="font-syne font-black text-xl">sócio<span className="text-[#BA7517]">.</span></div>
          <div className="hidden md:block h-4 w-px bg-white/10" />
          <div className="hidden md:block text-sm text-white/40">{businessLabel}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/10">
            Plano Grátis
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 px-6 flex gap-6">
        {[
          { id: 'chat', label: '💬 Assistente' },
          { id: 'pricing', label: '💰 Precificação' },
          { id: 'cashflow', label: '📊 Caixa' },
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

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-6 space-y-4">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-4xl mb-4">👋</div>
                <h3 className="font-syne font-bold text-xl mb-2">Olá, {businessLabel}!</h3>
                <p className="text-white/40 text-sm mb-8">Como posso ajudar seu negócio hoje?</p>
                <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
                  {QUICK_ACTIONS.map(action => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      className="text-sm text-left px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:border-[#BA7517]/40 hover:text-white/80 transition-all duration-200"
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
                      ? 'bg-white/5 border border-white/10 text-white/80'
                      : 'bg-[#BA7517]/20 text-[#FAC775] border border-[#BA7517]/20'
                  }`}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[#BA7517] flex items-center justify-center text-xs font-bold text-white">S</div>
                <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#BA7517] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#BA7517] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#BA7517] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="py-4 border-t border-white/10">
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
                className="btn-primary px-5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="font-syne font-bold text-xl mb-2">Calculadora de preços</h3>
            <p className="text-white/40 text-sm">Em breve — use o assistente por enquanto</p>
          </div>
        </div>
      )}

      {/* Cashflow Tab */}
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
