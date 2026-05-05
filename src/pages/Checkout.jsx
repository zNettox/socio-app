import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../firebase'

const PLANS = {
  pro:      { name: 'Sócio Pro', price: 'R$49,90', amount: 49.90 },
  business: { name: 'Sócio Business', price: 'R$89,90', amount: 89.90 },
}

// Icons
const PixIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L14 6H12v3h3v-2l4 3-4 3v-2h-3v3h2L10 18 6 14h2v-3H5v2L1 10l4-3v2h3V6H6L10 2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
)
const CardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="1" y="4" width="18" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M1 8h18" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="3" y="12" width="5" height="1.5" rx="0.5" fill="currentColor"/>
  </svg>
)
const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M5 10H3a1 1 0 01-1-1V3a1 1 0 011-1h6a1 1 0 011 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="8" stroke="#4ade80" strokeWidth="1.5"/>
    <path d="M6 10l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
const EyeIcon = ({ open }) => open ? (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
) : (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1 1l14 14M6.5 6.6A2 2 0 0010 10M4.5 4.5C2.5 5.8 1 8 1 8s2.5 5 7 5c1.6 0 3-.5 4.2-1.3M12 11C13.7 9.8 15 8 15 8s-2.5-5-7-5c-.8 0-1.6.1-2.3.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
)

export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const planKey = (params.get('plan') || 'pro').replace('_mensal_promo', '').replace('_mensal', '')
  const planData = PLANS[planKey] || PLANS.pro
  const user = auth.currentUser

  const [step, setStep] = useState('method') // method | form | pix | success
  const [method, setMethod] = useState(null)
  const [form, setForm] = useState({ name: '', cpf: '', phone: '', card: '', expiry: '', cvv: '', cardName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pixData, setPixData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showCvv, setShowCvv] = useState(false)

  const fmtCard = v => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
  const fmtExpiry = v => v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2')
  const fmtCpf = v => v.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3').replace(/(\d{3})(\d{1,3})/, '$1.$2')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)

    try {
      const res = await fetch('/.netlify/functions/create-pagbank-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          userName: form.name,
          userEmail: user?.email,
          userDocument: form.cpf,
          userPhone: form.phone,
          userId: user?.uid,
          paymentMethod: method,
        }),
      })

      const data = await res.json()

      if (data.error) { setError(data.error); setLoading(false); return }

      if (method === 'pix') {
        setPixData(data)
        setStep('pix')
      } else {
        setStep('success')
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  const copyPix = () => {
    navigator.clipboard.writeText(pixData.pixCopyPaste)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const S = {
    root: { minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'DM Sans', sans-serif" },
    card: { width: '100%', maxWidth: 460, background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, overflow: 'hidden' },
    header: { padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    body: { padding: '24px' },
    input: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '11px 14px', fontSize: 14, color: '#fff', outline: 'none', fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box', transition: 'border-color 0.2s' },
    label: { fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 7, letterSpacing: '0.05em' },
    btn: (active) => ({ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', border: active ? '2px solid #BA7517' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(186,117,23,0.1)' : 'rgba(255,255,255,0.02)', color: active ? '#FAC775' : 'rgba(255,255,255,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }),
    submitBtn: { width: '100%', padding: '13px', borderRadius: 12, background: '#BA7517', color: '#fff', border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s', marginTop: 8, fontFamily: "'DM Sans', sans-serif" },
  }

  return (
    <div style={S.root}>
      <div style={S.card}>

        {/* Header */}
        <div style={S.header}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
            ← Voltar
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18 }}>{planData.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Assinatura mensal</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#BA7517' }}>{planData.price}</div>

            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* STEP: METHOD */}
          {step === 'method' && (
            <motion.div key="method" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={S.body}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Como deseja pagar?</div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                <button style={S.btn(method === 'pix')} onClick={() => setMethod('pix')}>
                  <PixIcon />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>PIX</span>
                  <span style={{ fontSize: 10, color: method === 'pix' ? 'rgba(186,117,23,0.7)' : 'rgba(255,255,255,0.25)' }}>Aprovação imediata</span>
                </button>
                <button style={S.btn(method === 'card')} onClick={() => setMethod('card')}>
                  <CardIcon />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Cartão</span>
                  <span style={{ fontSize: 10, color: method === 'card' ? 'rgba(186,117,23,0.7)' : 'rgba(255,255,255,0.25)' }}>1º mês com desconto</span>
                </button>
              </div>
              <button onClick={() => method && setStep('form')} disabled={!method}
                style={{ ...S.submitBtn, opacity: method ? 1 : 0.4, cursor: method ? 'pointer' : 'not-allowed' }}>
                Continuar →
              </button>
              <button onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Continuar no plano grátis
              </button>
            </motion.div>
          )}

          {/* STEP: FORM */}
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={S.body}>
              <button onClick={() => setStep('method')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
                ← Trocar método
              </button>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: method === 'pix' ? 'rgba(74,222,128,0.08)' : 'rgba(186,117,23,0.1)', border: `1px solid ${method === 'pix' ? 'rgba(74,222,128,0.2)' : 'rgba(186,117,23,0.2)'}`, marginBottom: 20 }}>
                {method === 'pix' ? <PixIcon /> : <CardIcon />}
                <span style={{ fontSize: 12, color: method === 'pix' ? '#4ade80' : '#FAC775', fontWeight: 500 }}>{method === 'pix' ? 'Pagamento via PIX' : 'Pagamento via Cartão'}</span>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={S.label}>NOME COMPLETO</label>
                  <input style={S.input} placeholder="Seu nome completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                    onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.4)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={S.label}>CPF</label>
                    <input style={S.input} placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: fmtCpf(e.target.value) }))} required
                      onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                  <div>
                    <label style={S.label}>WHATSAPP</label>
                    <input style={S.input} placeholder="(92) 99999-9999" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required
                      onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.4)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  </div>
                </div>

                {method === 'card' && (
                  <>
                    <div>
                      <label style={S.label}>NÚMERO DO CARTÃO</label>
                      <input style={S.input} placeholder="0000 0000 0000 0000" value={form.card} onChange={e => setForm(f => ({ ...f, card: fmtCard(e.target.value) }))} required
                        onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                    </div>
                    <div>
                      <label style={S.label}>NOME NO CARTÃO</label>
                      <input style={S.input} placeholder="Como aparece no cartão" value={form.cardName} onChange={e => setForm(f => ({ ...f, cardName: e.target.value.toUpperCase() }))} required
                        onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.4)'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={S.label}>VALIDADE</label>
                        <input style={S.input} placeholder="MM/AA" value={form.expiry} onChange={e => setForm(f => ({ ...f, expiry: fmtExpiry(e.target.value) }))} required
                          onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.4)'}
                          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                      </div>
                      <div>
                        <label style={S.label}>CVV</label>
                        <div style={{ position: 'relative' }}>
                          <input type={showCvv ? 'text' : 'password'} style={{ ...S.input, paddingRight: 42 }} placeholder="000" value={form.cvv} onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} required
                            onFocus={e => e.target.style.borderColor = 'rgba(186,117,23,0.4)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                          <button type="button" onClick={() => setShowCvv(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2, display: 'flex' }}>
                            <EyeIcon open={showCvv} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ fontSize: 13, color: '#f87171', padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ ...S.submitBtn, opacity: loading ? 0.6 : 1 }}>
                  {loading
                    ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                        Processando...
                      </div>
                    : method === 'pix' ? `Gerar PIX — ${planData.price}` : `Pagar ${planData.price}`
                  }
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="5" width="8" height="6" rx="1" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/><path d="M4 5V3.5a2 2 0 014 0V5" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Pagamento processado com segurança via PagBank</span>
              </div>
            </motion.div>
          )}

          {/* STEP: PIX */}
          {step === 'pix' && pixData && (
            <motion.div key="pix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ ...S.body, textAlign: 'center' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>PIX gerado!</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Pague no seu banco e o plano é ativado em segundos.</div>
              </div>

              {pixData.pixQrCode && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <img src={pixData.pixQrCode} alt="QR Code PIX" style={{ width: 180, height: 180, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }} />
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginBottom: 8, letterSpacing: '0.05em' }}>CÓDIGO PIX COPIA E COLA</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', wordBreak: 'break-all', lineHeight: 1.6, fontFamily: 'monospace' }}>
                  {pixData.pixCopyPaste?.slice(0, 60)}...
                </div>
              </div>

              <button onClick={copyPix} style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: copied ? 'rgba(74,222,128,0.15)' : '#BA7517', color: copied ? '#4ade80' : '#fff', fontFamily: "'DM Sans', sans-serif" }}>
                {copied ? <><CheckIcon /> Copiado!</> : <><CopyIcon /> Copiar código PIX</>}
              </button>

              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 16, lineHeight: 1.6 }}>
                Após o pagamento, seu plano é ativado automaticamente em até 1 minuto.
              </div>

              <button onClick={() => navigate('/dashboard')} style={{ marginTop: 16, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Ir para o dashboard →
              </button>
            </motion.div>
          )}

          {/* STEP: SUCCESS */}
          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ ...S.body, textAlign: 'center', padding: '40px 24px' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <CheckIcon />
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Pagamento realizado!</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>Seu plano {planData.name} está ativo.</div>
              <button onClick={() => navigate('/dashboard')} style={S.submitBtn}>
                Ir para o dashboard →
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}