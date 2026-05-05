import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'

const PLANS = {
  pro:      { name: 'Sócio Pro', price: 'R$49,90', link: 'https://pag.ae/81LgUyNcP/button' },
  business: { name: 'Sócio Business', price: 'R$89,90', link: 'https://pag.ae/81LgVm968/button' },
}

const PixIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2l4 4h-2.5v3.5H16V7l4 4-4 4v-2.5h-3.5V16h2.5l-4 4-4-4h2.5v-3.5H6V17L2 11l4-4v2.5h3.5V6H7l4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
)
const CardIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1.5" y="5" width="19" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1.5 9h19" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="4" y="13" width="5" height="2" rx="0.5" fill="currentColor"/>
  </svg>
)
const ExternalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M6 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 1h4v4M13 1L7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="2" y="5.5" width="8" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
  </svg>
)

export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const raw = params.get('plan') || 'pro'
  const planKey = raw.includes('biz') || raw.includes('business') ? 'business' : 'pro'
  const plan = PLANS[planKey]
  const [method, setMethod] = useState(null)

  const handlePay = () => {
    if (!method) return
    window.location.href = plan.link
  }

  const S = {
    root: { minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'DM Sans', sans-serif" },
    card: { width: '100%', maxWidth: 420, background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' },
    methodBtn: (active) => ({ flex: 1, padding: '18px 12px', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', border: active ? '2px solid #BA7517' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(186,117,23,0.08)' : 'rgba(255,255,255,0.02)', color: active ? '#FAC775' : 'rgba(255,255,255,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }),
  }

  return (
    <div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>
      <div style={S.card}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>{plan.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Assinatura mensal · cancele quando quiser</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#BA7517', textAlign: 'right' }}>{plan.price}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>/mês</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Escolha como pagar:</div>

          {/* Method buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <button style={S.methodBtn(method === 'pix')} onClick={() => setMethod('pix')}>
              <PixIcon />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>PIX</div>
                <div style={{ fontSize: 11, color: method === 'pix' ? 'rgba(186,117,23,0.6)' : 'rgba(255,255,255,0.2)', marginTop: 2 }}>Aprovação imediata</div>
              </div>
            </button>
            <button style={S.methodBtn(method === 'card')} onClick={() => setMethod('card')}>
              <CardIcon />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>Cartão</div>
                <div style={{ fontSize: 11, color: method === 'card' ? 'rgba(186,117,23,0.6)' : 'rgba(255,255,255,0.2)', marginTop: 2 }}>Crédito recorrente</div>
              </div>
            </button>
          </div>

          {/* Info box */}
          <AnimatePresence>
            {method && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
                {method === 'pix'
                  ? 'Você será redirecionado ao PagBank para concluir o pagamento. Após a confirmação, seu plano é ativado automaticamente.'
                  : 'Você será redirecionado ao PagBank para inserir os dados do cartão com segurança. A cobrança é mensal e automática.'
                }
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pay button */}
          <button onClick={handlePay} disabled={!method}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: method ? '#BA7517' : 'rgba(186,117,23,0.2)', color: method ? '#fff' : 'rgba(255,255,255,0.2)', border: 'none', fontSize: 14, fontWeight: 500, cursor: method ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif" }}>
            {method ? (
              <>Pagar {plan.price} via PagBank <ExternalIcon /></>
            ) : (
              'Selecione um método'
            )}
          </button>

          <button onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Continuar no plano grátis
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, color: 'rgba(255,255,255,0.15)' }}>
            <LockIcon />
            <span style={{ fontSize: 11 }}>Pagamento 100% seguro via PagBank</span>
          </div>
        </div>
      </div>
    </div>
  )
}