import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { slideUp, staggerContainer, glowPulse } from '../utils/motion'

const CheckIcon = () => (
  <motion.svg initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }} width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6" stroke="#BA7517" strokeWidth="1"/>
    <path d="M4.5 7l2 2 3-3" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </motion.svg>
)

const PLANS = [
  {
    key: 'free',
    name: 'Grátis',
    price: 'R$0',
    sub: 'Para sempre',
    highlight: false,
    items: ['Precificação básica', '3 propostas por mês', '10 mensagens no assistente'],
    cta: 'Continuar grátis',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 'R$49,90',
    sub: '/mês',
    highlight: true,
    items: ['Propostas ilimitadas em PDF', 'Assistente sem limites', 'Controle de caixa completo', 'Conteúdo para redes sociais'],
    cta: 'Assinar Pro',
  },
  {
    key: 'business',
    name: 'Business',
    price: 'R$89,90',
    sub: '/mês',
    highlight: false,
    items: ['Tudo do plano Pro', 'Até 5 usuários na conta', 'Relatórios avançados', 'Suporte prioritário via WhatsApp'],
    cta: 'Assinar Business',
  },
]

export default function PlanSelect() {
  const navigate = useNavigate()

  const handleSelect = (plan) => {
    if (plan.key === 'free') {
      navigate('/onboarding')
    } else {
      // Garantir que a URL esteja correta e evitar bugs de roteamento
      navigate(`/checkout?plan=${plan.key}`)
    }
  }

  return (
    <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background animado com degrade */}
      <motion.div 
        animate={{ 
          background: [
            'radial-gradient(circle at 20% 30%, rgba(186,117,23,0.15) 0%, transparent 40%)',
            'radial-gradient(circle at 80% 70%, rgba(186,117,23,0.15) 0%, transparent 40%)',
            'radial-gradient(circle at 20% 30%, rgba(186,117,23,0.15) 0%, transparent 40%)'
          ] 
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      <div className="relative z-10 w-full max-w-5xl">
        <motion.div 
          variants={slideUp} 
          initial="hidden" 
          animate="visible" 
          className="text-center mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="font-syne font-extrabold text-2xl text-white mb-2 cursor-default inline-block"
          >
            sócio<span className="text-[#BA7517]">.</span>
          </motion.div>
          <h1 className="font-syne font-bold text-4xl md:text-5xl text-white mb-4 grad-text">
            Escolha seu plano
          </h1>
          <p className="text-white/40 text-base">
            Cancele quando quiser. Sem contrato. Sem pegadinhas.
          </p>
        </motion.div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {PLANS.map((plan) => (
            <motion.div 
              key={plan.key}
              variants={slideUp}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                plan.highlight 
                  ? 'bg-gradient-to-b from-[#BA7517]/10 to-transparent border border-[#BA7517]/40 shadow-[0_0_40px_rgba(186,117,23,0.15)]' 
                  : 'bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10'
              }`}
            >
              {plan.highlight && (
                <motion.div 
                  variants={glowPulse}
                  initial="hidden"
                  animate="visible"
                  className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4A373] to-[#BA7517] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg"
                >
                  Mais Recomendado
                </motion.div>
              )}

              <div className="font-syne font-bold text-xl text-white mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className={`font-syne font-extrabold text-4xl ${plan.highlight ? 'text-[#BA7517]' : 'text-white/70'}`}>
                  {plan.price}
                </span>
                <span className="text-white/30 text-sm">{plan.sub}</span>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-6" />

              <div className="flex-1 flex flex-col gap-4 mb-8">
                {plan.items.map((item, idx) => (
                  <motion.div 
                    key={item} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + (idx * 0.1) }}
                    className="flex items-start gap-3"
                  >
                    <div className="mt-1"><CheckIcon /></div>
                    <span className="text-white/60 text-sm leading-relaxed">{item}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelect(plan)}
                className={`w-full py-4 rounded-xl font-dm font-medium text-sm transition-all duration-300 ${
                  plan.highlight 
                    ? 'bg-gradient-to-r from-[#BA7517] to-[#854F0B] text-white shadow-lg shadow-[#BA7517]/20 hover:shadow-[#BA7517]/40' 
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
              >
                {plan.cta}
              </motion.button>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-center text-white/20 text-xs flex items-center justify-center gap-4"
        >
          <span>🔒 Pagamento 100% seguro via PagBank</span>
          <span>•</span>
          <span>Cancele online a qualquer momento</span>
        </motion.div>
      </div>
    </div>
  )
}