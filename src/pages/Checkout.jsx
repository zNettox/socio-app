import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const PLANS = {
  pro:      { name: 'Sócio Pro', price: 'R$49,90', amount: 4990 },
  business: { name: 'Sócio Business', price: 'R$89,90', amount: 8990 },
}

const S = {
  page:    { minHeight: '100vh', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'DM Sans', sans-serif" },
  wrap:    { width: '100%', maxWidth: 400 },
  card:    { background: '#fff', borderRadius: 20, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 10 },
  header:  { padding: '18px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' },
  body:    { padding: '20px' },
  label:   { fontSize: 12, color: 'rgba(0,0,0,0.4)', display: 'block', marginBottom: 6 },
  input:   { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: '#F5F5F7', color: '#1D1D1F', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' },
  tabActive:   { flex: 1, padding: '12px 10px', borderRadius: 12, border: '1.5px solid #0066CC', background: 'rgba(0,102,204,0.06)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  tabInactive: { flex: 1, padding: '12px 10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)', background: '#F5F5F7', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' },
  btnPrimary: { width: '100%', padding: '14px', borderRadius: 14, background: '#0066CC', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s' },
  btnDisabled: { width: '100%', padding: '14px', borderRadius: 14, background: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.2)', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif" },
  btnGhost: { width: '100%', padding: '11px', background: 'none', border: 'none', fontSize: 13, color: 'rgba(0,0,0,0.25)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
}

const PixIcon = () => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
    <path d="M11 2l4 4h-2.5v3.5H16V7l4 4-4 4v-2.5h-3.5V16h2.5l-4 4-4-4h2.5v-3.5H6V17L2 11l4-4v2.5h3.5V6H7l4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
)

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planKey = searchParams.get('plan') || 'pro'
  const plan = PLANS[planKey] || PLANS.pro

  const [method, setMethod] = useState('pix')
  const [cpf, setCpf] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form')
  const [pixData, setPixData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(3600)
  const [userData, setUserData] = useState(null)
  const sdkLoaded = useRef(false)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) { navigate('/login'); return }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setUserData({ ...snap.data(), uid: user.uid, email: user.email })
    })
    fetch('/.netlify/functions/get_pagbank_pubkey').then(r => r.json()).then(d => { if (d.publicKey) window._pagbankKey = d.publicKey })
    if (!sdkLoaded.current) {
      const s = document.createElement('script')
      s.src = 'https://assets.pagseguro.com.br/checkout-sdk/js/pagSeguro.min.js'
      s.async = true
      document.body.appendChild(s)
      sdkLoaded.current = true
    }
  }, [])

  useEffect(() => {
    if (step !== 'pix') return
    const t = setInterval(() => setTimeLeft(p => p <= 1 ? 0 : p - 1), 1000)
    return () => clearInterval(t)
  }, [step])

  const formatCpf = v => {
    const n = v.replace(/\D/g, '').slice(0, 11)
    if (n.length <= 3) return n
    if (n.length <= 6) return n.slice(0,3) + '.' + n.slice(3)
    if (n.length <= 9) return n.slice(0,3) + '.' + n.slice(3,6) + '.' + n.slice(6)
    return n.slice(0,3) + '.' + n.slice(3,6) + '.' + n.slice(6,9) + '-' + n.slice(9)
  }
  const formatCard = v => v.replace(/\D/g, '').slice(0,16).replace(/(.{4})/g, '$1 ').trim()
  const formatExpiry = v => { const n = v.replace(/\D/g,'').slice(0,4); return n.length > 2 ? n.slice(0,2)+'/'+n.slice(2) : n }
  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const canPay = () => {
    if (cpf.replace(/\D/g,'').length !== 11) return false
    if (method === 'card') return cardNumber.replace(/\s/g,'').length === 16 && cardName.length > 2 && cardExpiry.length === 5 && cardCvv.length >= 3
    return true
  }

  const handlePay = async () => {
    if (!userData || !canPay()) return
    setError(''); setLoading(true)
    try {
      const rawCpf = cpf.replace(/\D/g,'')
      let body = {
        plan: planKey,
        userName: userData.businessName || userData.profileName || 'Cliente',
        userEmail: userData.email,
        userCpf: rawCpf,
        userId: userData.uid,
        paymentMethod: method === 'pix' ? 'PIX' : 'CREDIT_CARD',
      }
      if (method === 'card') {
        if (!window.PagSeguro || !window._pagbankKey) throw new Error('SDK de pagamento não carregado. Aguarde e tente novamente.')
        const [expM, expY] = cardExpiry.split('/')
        const enc = await window.PagSeguro.encryptCard({ publicKey: window._pagbankKey, holder: cardName, number: cardNumber.replace(/\s/g,''), expMonth: expM, expYear: '20'+expY, securityCode: cardCvv })
        if (enc.hasErrors) throw new Error('Dados do cartão inválidos')
        body.cardEncrypted = enc.encryptedCard
        body.cardHolder = cardName
      }
      const res = await fetch('/.netlify/functions/create-pagbank-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao processar pagamento')
      if (data.type === 'pix') { setPixData(data); setStep('pix') } else { setStep('success') }
    } catch (err) { setError(err.message) } finally { setLoading(false) }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.pixText)
    setCopied(true); setTimeout(() => setCopied(false), 2500)
  }

  // ─── PIX Screen ───────────────────────────────────────────────
  if (step === 'pix' && pixData) return (
    <div style={S.page}>
      <div style={{ ...S.wrap }}>
        <div style={S.card}>
          <div style={S.header}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, color: '#1D1D1F', margin: 0 }}>{plan.name}</p>
                <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', margin: '2px 0 0' }}>PIX · aprovação imediata</p>
              </div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 20, color: '#0066CC', margin: 0 }}>{plan.price}</p>
            </div>
          </div>
          <div style={S.body}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', margin: '0 0 4px' }}>Expira em</p>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 24, color: timeLeft < 300 ? '#e74c3c' : '#1D1D1F', margin: 0 }}>{formatTime(timeLeft)}</p>
            </div>
            {pixData.pixImage && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <div style={{ padding: 10, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 14 }}>
                  <img src={pixData.pixImage} alt="QR Code PIX" style={{ width: 190, height: 190, display: 'block' }} />
                </div>
              </div>
            )}
            <p style={{ ...S.label }}>Código PIX copia e cola:</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: '#F5F5F7', fontSize: 11, color: 'rgba(0,0,0,0.4)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                {pixData.pixText?.slice(0, 50)}...
              </div>
              <button onClick={handleCopy} style={{ padding: '10px 14px', borderRadius: 10, background: copied ? 'rgba(39,174,96,0.08)' : '#F5F5F7', border: `1px solid ${copied ? 'rgba(39,174,96,0.3)' : 'rgba(0,0,0,0.1)'}`, cursor: 'pointer', color: copied ? '#27ae60' : 'rgba(0,0,0,0.5)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                {copied ? '✓ Copiado' : 'Copiar'}
              </button>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(0,102,204,0.05)', border: '1px solid rgba(0,102,204,0.12)', fontSize: 12, color: '#0066CC', lineHeight: 1.6, marginBottom: 14 }}>
              Após o pagamento, seu plano é ativado automaticamente em até 1 minuto.
            </div>
            <button onClick={() => navigate('/dashboard')} style={S.btnGhost}>
              Já paguei, ir para o painel
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ─── Success Screen ──────────────────────────────────────────
  if (step === 'success') return (
    <div style={S.page}>
      <div style={{ ...S.card, maxWidth: 400, padding: 36, textAlign: 'center' }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(39,174,96,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>✓</div>
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 20, color: '#1D1D1F', margin: '0 0 8px' }}>Pagamento aprovado!</p>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.4)', margin: '0 0 24px' }}>Seu plano {plan.name} foi ativado com sucesso.</p>
        <button onClick={() => navigate('/dashboard')} style={S.btnPrimary}>Ir para o painel</button>
      </div>
    </div>
  )

  // ─── Form Screen ─────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.wrap}>

        {/* Plan header */}
        <div style={S.card}>
          <div style={{ ...S.header, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: '#1D1D1F', margin: 0 }}>{plan.name}</p>
              <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', margin: '3px 0 0' }}>Assinatura mensal · cancele quando quiser</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22, color: '#0066CC', margin: 0 }}>{plan.price}</p>
              <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.25)', margin: '2px 0 0' }}>/mês</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div style={S.card}>
          <div style={S.body}>
            <p style={{ ...S.label, marginBottom: 10 }}>Forma de pagamento</p>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[{ id: 'pix', label: 'PIX', sub: 'Aprovação imediata' }, { id: 'card', label: 'Cartão', sub: 'Crédito' }].map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} style={method === m.id ? S.tabActive : S.tabInactive}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: method === m.id ? '#0066CC' : '#1D1D1F', margin: 0 }}>{m.label}</p>
                  <p style={{ fontSize: 11, color: method === m.id ? 'rgba(0,102,204,0.6)' : 'rgba(0,0,0,0.3)', margin: '2px 0 0' }}>{m.sub}</p>
                </button>
              ))}
            </div>

            {/* CPF */}
            <div style={{ marginBottom: 14 }}>
              <label style={S.label}>CPF do titular</label>
              <input style={S.input} placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} />
            </div>

            {/* Card fields */}
            <AnimatePresence>
              {method === 'card' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Número do cartão</label>
                    <input style={{ ...S.input, letterSpacing: '0.05em' }} placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(formatCard(e.target.value))} maxLength={19} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={S.label}>Nome no cartão</label>
                    <input style={{ ...S.input, textTransform: 'uppercase' }} placeholder="NOME COMO NO CARTÃO" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Validade</label>
                      <input style={S.input} placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(formatExpiry(e.target.value))} maxLength={5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>CVV</label>
                      <input style={S.input} placeholder="000" value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))} maxLength={4} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            {error && (
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', fontSize: 12, color: '#e74c3c', marginBottom: 14, marginTop: 8 }}>
                {error}
              </div>
            )}

            {/* Pay button */}
            <button onClick={handlePay} disabled={loading || !canPay()} style={canPay() && !loading ? S.btnPrimary : S.btnDisabled}>
              {loading
                ? <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : <>{method === 'pix' ? <PixIcon /> : null}{method === 'pix' ? `Gerar QR Code · ${plan.price}` : `Pagar com Cartão · ${plan.price}`}</>
              }
            </button>

            <button onClick={() => navigate('/dashboard')} style={{ ...S.btnGhost, marginTop: 8 }}>
              Continuar no plano grátis
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(0,0,0,0.2)', marginTop: 16 }}>
              🔒 Pagamento seguro via PagBank
            </p>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}