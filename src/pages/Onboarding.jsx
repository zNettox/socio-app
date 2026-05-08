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
    <div className="min-h-screen bg-[#060606] flex flex-col font-dm relative overflow-hidden">
      <motion.div 
        animate={{ 
          background: [
            'radial-gradient(circle at 50% 0%, rgba(186,117,23,0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 50%, rgba(186,117,23,0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 0%, rgba(186,117,23,0.1) 0%, transparent 50%)'
          ] 
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Progress */}
      <div className="px-6 pt-8 pb-4 relative z-10">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className="font-syne font-black text-2xl text-white">sócio<span className="text-[#BA7517]">.</span></div>
        </div>
        <div className="flex gap-2 max-w-md mx-auto">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-700 ease-in-out ${i <= step ? 'bg-gradient-to-r from-[#D4A373] to-[#BA7517]' : 'bg-white/10'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-10 relative z-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {/* Step 0 — Welcome */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-panel p-8 rounded-3xl text-center border border-white/10">
                <motion.div 
                  animate={{ rotate: [0, 14, -8, 14, 0] }} 
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                  className="text-6xl mb-6 inline-block"
                >
                  👋
                </motion.div>
                <h1 className="font-syne font-extrabold text-3xl mb-4 text-white">Bem-vindo ao Sócio</h1>
                <p className="text-white/50 leading-relaxed mb-8">
                  Vou conhecer um pouco do seu negócio para personalizar tudo para você. Leva menos de 2 minutos.
                </p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={next} className="glow-btn w-full bg-gradient-to-r from-[#BA7517] to-[#854F0B] text-white font-dm font-medium py-4 rounded-xl shadow-lg shadow-[#BA7517]/20">Vamos lá →</motion.button>
              </motion.div>
            )}

            {/* Step 1 — Business */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-panel p-8 rounded-3xl border border-white/10">
                <h2 className="font-syne font-extrabold text-2xl text-white mb-2">Qual é o nome do seu negócio?</h2>
                <p className="text-white/40 text-sm mb-6">Ex: Salão da Cleusa, Lanche do Mário</p>
                <input
                  type="text"
                  placeholder="Nome do seu negócio"
                  value={data.businessName}
                  onChange={e => setData(d => ({ ...d, businessName: e.target.value }))}
                  className="input-field mb-8"
                  autoFocus
                />
                <h2 className="font-syne font-extrabold text-xl text-white mb-4">O que você faz?</h2>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3 h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                  {BUSINESS_TYPES.map(bt => (
                    <motion.button
                      key={bt.id}
                      variants={slideUp}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setData(d => ({ ...d, businessType: bt.id }))}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-sm transition-all duration-300 text-left ${
                        data.businessType === bt.id
                          ? 'border-[#BA7517] bg-[#BA7517]/15 text-[#FAC775] shadow-[0_0_15px_rgba(186,117,23,0.2)]'
                          : 'border-white/10 text-white/60 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-xl">{bt.icon}</span>
                      <span className="font-medium leading-tight">{bt.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
                <div className="flex gap-3 mt-8 pt-4 border-t border-white/10">
                  <button onClick={back} className="btn-ghost flex-1 py-3.5">Voltar</button>
                  <button
                    onClick={next}
                    disabled={!data.businessName || !data.businessType}
                    className="glow-btn bg-gradient-to-r from-[#BA7517] to-[#854F0B] text-white font-medium py-3.5 rounded-xl flex-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Continuar →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2 — Location */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-panel p-8 rounded-3xl border border-white/10">
                <h2 className="font-syne font-extrabold text-2xl text-white mb-2">Onde você atua?</h2>
                <p className="text-white/40 text-sm mb-6">Usado para calcular preços de mercado da sua região</p>
                <input
                  type="text"
                  placeholder="Sua cidade — ex: Manaus, AM"
                  value={data.city}
                  onChange={e => setData(d => ({ ...d, city: e.target.value }))}
                  className="input-field mb-4"
                  autoFocus
                />
                <div className="flex gap-3 mt-8">
                  <button onClick={back} className="btn-ghost flex-1 py-3.5">Voltar</button>
                  <button
                    onClick={next}
                    disabled={!data.city}
                    className="glow-btn bg-gradient-to-r from-[#BA7517] to-[#854F0B] text-white font-medium py-3.5 rounded-xl flex-1 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Continuar →
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Team */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40, filter: 'blur(10px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -40, filter: 'blur(10px)' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="glass-panel p-8 rounded-3xl border border-white/10">
                <h2 className="font-syne font-extrabold text-2xl text-white mb-2">Como é sua equipe?</h2>
                <p className="text-white/40 text-sm mb-6">Isso ajuda a personalizar suas análises de custo</p>
                <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
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
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 ${
                        data.teamSize === opt.id
                          ? 'border-[#BA7517] bg-[#BA7517]/15 shadow-[0_0_15px_rgba(186,117,23,0.15)]'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <div className={`text-sm font-bold tracking-wide ${data.teamSize === opt.id ? 'text-[#FAC775]' : 'text-white'}`}>{opt.label}</div>
                        <div className="text-xs text-white/40 mt-1">{opt.sub}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center ${
                        data.teamSize === opt.id ? 'border-[#BA7517] bg-[#BA7517]' : 'border-white/20 bg-transparent'
                      }`}>
                         {data.teamSize === opt.id && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
                <div className="flex gap-3 mt-8">
                  <button onClick={back} className="btn-ghost flex-1 py-3.5">Voltar</button>
                  <button onClick={next} className="glow-btn bg-gradient-to-r from-[#BA7517] to-[#854F0B] text-white font-medium py-3.5 rounded-xl flex-1 transition-all">Continuar →</button>
                </div>
              </motion.div>
            )}

            {/* Step 4 — Ready */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, scale: 0.90, filter: 'blur(10px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="glass-panel p-8 rounded-3xl text-center border border-white/10">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.6, type: 'spring', bounce: 0.5 }}
                  className="text-6xl mb-6 inline-block"
                >
                  🎉
                </motion.div>
                <h2 className="font-syne font-extrabold text-3xl text-white mb-4">Tudo pronto, {data.businessName}!</h2>
                <p className="text-white/50 leading-relaxed mb-6">
                  Seu sócio já conhece seu negócio em {data.city}. Está pronto para precificar, criar propostas e muito mais.
                </p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-sm text-white/60 space-y-3 text-left shadow-inner"
                >
                  <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#BA7517]/20 text-[#BA7517] flex items-center justify-center font-bold text-xs">✓</span> Negócio: <span className="text-white/90">{data.businessName}</span></div>
                  <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#BA7517]/20 text-[#BA7517] flex items-center justify-center font-bold text-xs">✓</span> Cidade: <span className="text-white/90">{data.city}</span></div>
                  <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#BA7517]/20 text-[#BA7517] flex items-center justify-center font-bold text-xs">✓</span> Segmento personalizado para sua equipe</div>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={finish}
                  disabled={loading}
                  className="glow-btn bg-gradient-to-r from-[#BA7517] to-[#854F0B] text-white font-medium py-4 rounded-xl w-full flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-[#BA7517]/30 text-lg"
                >
                  {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Abrir meu Sócio →'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  )
}