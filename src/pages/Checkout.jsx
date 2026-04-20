import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const BUSINESS_TYPES = [
  { id: 'salao', label: 'Salão de beleza', icon: '💇' },
  { id: 'barbearia', label: 'Barbearia', icon: '✂️' },
  { id: 'lanchonete', label: 'Lanchonete / Marmitaria', icon: '🍱' },
  { id: 'manicure', label: 'Manicure / Estética', icon: '💅' },
  { id: 'fotografo', label: 'Fotógrafo', icon: '📸' },
  { id: 'designer', label: 'Designer / Criativo', icon: '🎨' },
  { id: 'marceneiro', label: 'Marceneiro / Artesão', icon: '🔨' },
  { id: 'eletricista', label: 'Eletricista / Técnico', icon: '⚡' },
  { id: 'confeiteiro', label: 'Confeiteiro / Doceiro', icon: '🎂' },
  { id: 'outro', label: 'Outro negócio', icon: '💼' },
]

const STEPS = ['Olá', 'Seu negócio', 'Localização', 'Equipe', 'Pronto']

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState({ businessName: '', businessType: '', city: '', teamSize: 'solo' })
  const [loading, setLoading] = useState(false)

  const next = () => setStep(s => s + 1)
  const back = () => setStep(s => s - 1)

  const finish = async () => {
    setLoading(true)
    try {
      const user = auth.currentUser
      await setDoc(doc(db, 'users', user.uid), {
        ...data,
        email: user.email,
        onboardingComplete: true,
        createdAt: new Date(),
        plan: 'free',
      })
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Progress */}
      <div className="px-6 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="font-syne font-black text-xl">sócio<span className="text-[#BA7517]">.</span></div>
        </div>
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-[#BA7517]' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 0 — Welcome */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <div className="text-5xl mb-6">👋</div>
                <h1 className="font-syne font-black text-3xl mb-3">Seja bem-vindo ao Sócio</h1>
                <p className="text-white/50 leading-relaxed mb-8">
                  Vou conhecer um pouco do seu negócio para personalizar tudo para você. Leva menos de 2 minutos.
                </p>
                <button onClick={next} className="btn-primary w-full">Vamos lá →</button>
              </motion.div>
            )}

            {/* Step 1 — Business */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-syne font-black text-2xl mb-1">Qual é o nome do seu negócio?</h2>
                <p className="text-white/40 text-sm mb-6">Ex: Salão da Cleusa, Lanche do Mário</p>
                <input
                  type="text"
                  placeholder="Nome do seu negócio"
                  value={data.businessName}
                  onChange={e => setData(d => ({ ...d, businessName: e.target.value }))}
                  className="input-field mb-6"
                  autoFocus
                />
                <h2 className="font-syne font-black text-xl mb-4">O que você faz?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {BUSINESS_TYPES.map(bt => (
                    <button
                      key={bt.id}
                      onClick={() => setData(d => ({ ...d, businessType: bt.id }))}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-sm transition-all duration-200 text-left ${
                        data.businessType === bt.id
                          ? 'border-[#BA7517] bg-[#BA7517]/10 text-[#FAC775]'
                          : 'border-white/10 text-white/60 hover:border-white/20'
                      }`}
                    >
                      <span>{bt.icon}</span>
                      <span>{bt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={back} className="btn-ghost flex-1">Voltar</button>
                  <button
                    onClick={next}
                    disabled={!data.businessName || !data.businessType}
                    className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuar →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Location */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-syne font-black text-2xl mb-1">Onde você atua?</h2>
                <p className="text-white/40 text-sm mb-6">Usado para calcular preços de mercado da sua região</p>
                <input
                  type="text"
                  placeholder="Sua cidade — ex: Manaus, AM"
                  value={data.city}
                  onChange={e => setData(d => ({ ...d, city: e.target.value }))}
                  className="input-field"
                  autoFocus
                />
                <div className="flex gap-3 mt-6">
                  <button onClick={back} className="btn-ghost flex-1">Voltar</button>
                  <button
                    onClick={next}
                    disabled={!data.city}
                    className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continuar →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Team */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                <h2 className="font-syne font-black text-2xl mb-1">Como é sua equipe?</h2>
                <p className="text-white/40 text-sm mb-6">Isso ajuda a personalizar suas análises de custo</p>
                <div className="space-y-3">
                  {[
                    { id: 'solo', label: 'Trabalho sozinho', sub: 'Autônomo / MEI solo' },
                    { id: 'small', label: 'Tenho até 5 pessoas', sub: 'Pequena equipe' },
                    { id: 'medium', label: 'Tenho 6 a 15 pessoas', sub: 'Negócio em crescimento' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setData(d => ({ ...d, teamSize: opt.id }))}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-200 ${
                        data.teamSize === opt.id
                          ? 'border-[#BA7517] bg-[#BA7517]/10'
                          : 'border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-medium ${data.teamSize === opt.id ? 'text-[#FAC775]' : 'text-white'}`}>{opt.label}</div>
                        <div className="text-xs text-white/40 mt-0.5">{opt.sub}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                        data.teamSize === opt.id ? 'border-[#BA7517] bg-[#BA7517]' : 'border-white/20'
                      }`} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={back} className="btn-ghost flex-1">Voltar</button>
                  <button onClick={next} className="btn-primary flex-1">Continuar →</button>
                </div>
              </motion.div>
            )}

            {/* Step 4 — Ready */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="text-5xl mb-6">🎉</div>
                <h2 className="font-syne font-black text-3xl mb-3">Tudo pronto, {data.businessName}!</h2>
                <p className="text-white/50 leading-relaxed mb-4">
                  Seu sócio já conhece seu negócio em {data.city}. Está pronto para precificar, criar propostas e muito mais.
                </p>
                <div className="glass-card p-4 mb-8 text-sm text-white/60 space-y-2">
                  <div className="flex gap-2"><span className="text-[#BA7517]">✓</span> Negócio: {data.businessName}</div>
                  <div className="flex gap-2"><span className="text-[#BA7517]">✓</span> Cidade: {data.city}</div>
                  <div className="flex gap-2"><span className="text-[#BA7517]">✓</span> Segmento personalizado</div>
                </div>
                <button
                  onClick={finish}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Abrir meu Sócio →'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}