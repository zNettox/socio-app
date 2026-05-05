import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="6.5" cy="6.5" r="5.5" stroke="#BA7517" strokeWidth="1"/>
    <path d="M4 6.5l2 2 3-3" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
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
    items: ['Tudo do plano Pro', 'Até 5 usuários', 'Relatórios avançados', 'Suporte prioritário via WhatsApp'],
    cta: 'Assinar Business',
  },
]

export default function PlanSelect() {
  const navigate = useNavigate()

  const handleSelect = (plan) => {
    if (plan.key === 'free') {
      navigate('/onboarding')
    } else {
      navigate(`/checkout?plan=${plan.key}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060606', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap'); * { box-sizing: border-box; }`}</style>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 8 }}>
          sócio<span style={{ color: '#BA7517' }}>.</span>
        </div>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 26, color: '#fff', marginBottom: 8 }}>
          Escolha seu plano
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          Cancele quando quiser. Sem contrato.
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, width: '100%', maxWidth: 860 }}>
        {PLANS.map((plan, i) => (
          <motion.div key={plan.key}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            style={{ borderRadius: 18, background: plan.highlight ? 'rgba(186,117,23,0.07)' : 'rgba(255,255,255,0.02)', border: plan.highlight ? '1.5px solid rgba(186,117,23,0.35)' : '1px solid rgba(255,255,255,0.07)', padding: 24, position: 'relative' }}>

            {plan.highlight && (
              <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#BA7517', color: '#fff' }}>
                Recomendado
              </div>
            )}

            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 6 }}>{plan.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 32, color: plan.highlight ? '#BA7517' : 'rgba(255,255,255,0.5)', lineHeight: 1 }}>{plan.price}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{plan.sub}</span>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {plan.items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <CheckIcon />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item}</span>
                </div>
              ))}
            </div>

            <button onClick={() => handleSelect(plan)}
              style={{ width: '100%', padding: '12px', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: 'none', background: plan.highlight ? '#BA7517' : 'rgba(255,255,255,0.06)', color: plan.highlight ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = plan.highlight ? '#9a6113' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = plan.highlight ? '#BA7517' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = plan.highlight ? '#fff' : 'rgba(255,255,255,0.5)' }}>
              {plan.cta}
            </button>
          </motion.div>
        ))}
      </div>

      <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        Pagamento seguro via PagBank · Cancele quando quiser
      </div>
    </div>
  )
}