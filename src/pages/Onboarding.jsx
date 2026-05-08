import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import { slideUp, staggerContainer } from '../utils/motion'

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
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col font-dm relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-apple-blue/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-apple-indigo/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Progress */}
      <div className="px-6 pt-10 pb-4 relative z-10 w-full max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="font-syne font-bold text-3xl text-black">sócio<span className="text-apple-blue">.</span></div>
        </div>
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all duration-700 ease-in-out ${i <= step ? 'bg-apple-blue' : 'bg-black/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-12 relative z-10">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            {/* Step 0 — Welcome */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-card p-8 md:p-12 text-center !rounded-[40px]">
                <motion.div 
                  animate={{ rotate: [0, 14, -8, 14, 0] }} 
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                  className="text-6xl mb-6 inline-block"
                >
                  👋
                </motion.div>
                <h1 className="font-syne font-bold text-3xl mb-4 text-black tracking-tight">Bem-vindo ao Sócio</h1>
                <p className="text-black/50 leading-relaxed mb-8 font-medium">
                  Vou conhecer um pouco do seu negócio para personalizar tudo para você. Leva menos de 2 minutos.
                </p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={next} className="btn-primary w-full py-4 text-lg">Vamos lá →</motion.button>
              </motion.div>
            )}

            {/* Step 1 — Business */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-card p-8 md:p-10 !rounded-[40px]">
                <h2 className="font-syne font-bold text-2xl text-black mb-2 tracking-tight">Qual é o nome do seu negócio?</h2>
                <p className="text-black/40 text-sm mb-6 font-medium">Ex: Salão da Cleusa, Lanche do Mário</p>
                <input
                  type="text"
                  placeholder="Nome do seu negócio"
                  value={data.businessName}
                  onChange={e => setData(d => ({ ...d, businessName: e.target.value }))}
                  className="input-field mb-8 shadow-sm"
                  autoFocus
                />
                <h2 className="font-syne font-bold text-xl text-black mb-4 tracking-tight">O que você faz?</h2>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                  {BUSINESS_TYPES.map(bt => (
                    <motion.button
                      key={bt.id}
                      variants={slideUp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setData(d => ({ ...d, businessType: bt.id }))}
                      className={`flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all duration-300 text-left ${
                        data.businessType === bt.id
                          ? 'border-apple-blue bg-blue-50 text-apple-blue shadow-sm'
                          : 'border-black/5 bg-white text-black/60 hover:border-black/20 hover:text-black hover:shadow-sm'
                      }`}
                    >
                      <span className="text-2xl">{bt.icon}</span>
                      <span className="font-semibold text-sm leading-tight">{bt.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
                <div className="flex gap-3 mt-8 pt-6 border-t border-black/5">
                  <button onClick={back} className="btn-ghost flex-1 py-4">Voltar</button>
                  <button
                    onClick={next}
                    disabled={!data.businessName || !data.businessType}
                    className={`btn-primary flex-1 py-4 ${(!data.businessName || !data.businessType) ? 'opacity-50 shadow-none' : ''}`}
                  >
                    Continuar →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Location */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-card p-8 md:p-10 !rounded-[40px]">
                <h2 className="font-syne font-bold text-2xl text-black mb-2 tracking-tight">Onde você atua?</h2>
                <p className="text-black/40 text-sm mb-6 font-medium">Usado para calcular preços de mercado da sua região</p>
                <input
                  type="text"
                  placeholder="Sua cidade — ex: Manaus, AM"
                  value={data.city}
                  onChange={e => setData(d => ({ ...d, city: e.target.value }))}
                  className="input-field mb-4 shadow-sm"
                  autoFocus
                />
                <div className="flex gap-3 mt-8">
                  <button onClick={back} className="btn-ghost flex-1 py-4">Voltar</button>
                  <button
                    onClick={next}
                    disabled={!data.city}
                    className={`btn-primary flex-1 py-4 ${!data.city ? 'opacity-50 shadow-none' : ''}`}
                  >
                    Continuar →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Team */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-card p-8 md:p-10 !rounded-[40px]">
                <h2 className="font-syne font-bold text-2xl text-black mb-2 tracking-tight">Como é sua equipe?</h2>
                <p className="text-black/40 text-sm mb-8 font-medium">Isso ajuda a personalizar suas análises de custo</p>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
                  {[
                    { id: 'solo', label: 'Trabalho sozinho', sub: 'Autônomo / MEI solo' },
                    { id: 'small', label: 'Tenho até 5 pessoas', sub: 'Pequena equipe' },
                    { id: 'medium', label: 'Tenho 6 a 15 pessoas', sub: 'Negócio em crescimento' },
                  ].map(opt => (
                    <motion.button
                      key={opt.id}
                      variants={slideUp}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setData(d => ({ ...d, teamSize: opt.id }))}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all duration-300 ${
                        data.teamSize === opt.id
                          ? 'border-apple-blue bg-blue-50 shadow-sm'
                          : 'border-black/5 bg-white hover:border-black/20 hover:shadow-sm'
                      }`}
                    >
                      <div>
                        <div className={`text-[15px] font-bold tracking-wide ${data.teamSize === opt.id ? 'text-apple-blue' : 'text-black'}`}>{opt.label}</div>
                        <div className="text-xs text-black/40 mt-1 font-medium">{opt.sub}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                        data.teamSize === opt.id ? 'border-apple-blue bg-apple-blue' : 'border-black/20 bg-transparent'
                      }`}>
                         {data.teamSize === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
                <div className="flex gap-3 mt-10">
                  <button onClick={back} className="btn-ghost flex-1 py-4">Voltar</button>
                  <button onClick={next} className="btn-primary flex-1 py-4">Continuar →</button>
                </div>
              </motion.div>
            )}

            {/* Step 4 — Ready */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.90, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass-card p-8 md:p-12 text-center !rounded-[40px]">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
                  className="text-6xl mb-6 inline-block"
                >
                  🎉
                </motion.div>
                <h2 className="font-syne font-bold text-3xl text-black mb-4 tracking-tight">Tudo pronto, {data.businessName}!</h2>
                <p className="text-black/50 leading-relaxed mb-8 font-medium">
                  Seu sócio já conhece seu negócio em {data.city}. Está pronto para precificar, criar propostas e muito mais.
                </p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border border-black/5 shadow-sm rounded-3xl p-6 mb-8 text-sm text-black/60 space-y-4 text-left"
                >
                  <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-blue-50 text-apple-blue flex items-center justify-center font-bold text-xs">✓</span> Negócio: <span className="text-black font-semibold">{data.businessName}</span></div>
                  <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-blue-50 text-apple-blue flex items-center justify-center font-bold text-xs">✓</span> Cidade: <span className="text-black font-semibold">{data.city}</span></div>
                  <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-blue-50 text-apple-blue flex items-center justify-center font-bold text-xs">✓</span> Segmento personalizado para sua equipe</div>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={finish}
                  disabled={loading}
                  className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg shadow-xl shadow-apple-blue/20"
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Abrir meu Sócio →'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.2); }
      `}</style>
    </div>
  )
}