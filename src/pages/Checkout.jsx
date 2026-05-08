import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const PLANS = {
  pro:      { name: 'Sócio Pro', price: 'R$49,90', amount: 4990 },
  business: { name: 'Sócio Business', price: 'R$89,90', amount: 8990 },
}

const PixIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <path d="M11 2l4 4h-2.5v3.5H16V7l4 4-4 4v-2.5h-3.5V16h2.5l-4 4-4-4h2.5v-3.5H6V17L2 11l4-4v2.5h3.5V6H7l4-4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
  </svg>
)

const LockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planKey = searchParams.get('plan') || 'pro'
  const plan = PLANS[planKey] || PLANS.pro

  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form') // 'form' | 'pix'
  const [pixData, setPixData] = useState(null)
  const [copied, setCopied] = useState(false)
  const [userData, setUserData] = useState(null)
  const [timeLeft, setTimeLeft] = useState(3600)

  useEffect(() => {
    const user = auth.currentUser
    if (!user) { navigate('/login'); return }
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) setUserData({ ...snap.data(), uid: user.uid, email: user.email })
    })
  }, [])

  useEffect(() => {
    if (step !== 'pix') return
    const t = setInterval(() => setTimeLeft(p => {
      if (p <= 1) { clearInterval(t); return 0 }
      return p - 1
    }), 1000)
    return () => clearInterval(t)
  }, [step])

  const formatCpf = (v) => {
    const n = v.replace(/\D/g, '').slice(0, 11)
    return n.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4')
           .replace(/(\d{3})(\d{3})(\d{1,3})$/, '$1.$2.$3')
           .replace(/(\d{3})(\d{1,3})$/, '$1.$2')
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const handlePay = async () => {
    if (!userData) return
    const rawCpf = cpf.replace(/\D/g, '')
    if (rawCpf.length !== 11) { setError('CPF inválido'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/create-pagbank-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planKey,
          userName: userData.businessName || userData.profileName || 'Cliente',
          userEmail: userData.email,
          userCpf: rawCpf,
          userId: userData.uid,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar PIX')
      setPixData(data)
      setStep('pix')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(pixData.pixText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const S = {
    page: { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'DM Sans', sans-serif" },
    card: { width: '100%', maxWidth: 400, background: '#111', borderRadius: 24, border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' },
    header: { padding: '20px 24px', background: 'rgba(186,117,23,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    body: { padding: '24px' },
    input: { width: '100%', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" },
    btn: (active) => ({ width: '100%', padding: '14px', borderRadius: 12, background: active ? '#BA7517' : 'rgba(186,117,23,0.15)', color: active ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', fontSize: 15, fontWeight: 600, cursor: active ? 'pointer' : 'not-allowed', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: "'DM Sans', sans-serif" }),
  }

  if (step === 'pix' && pixData) {
    return (
      <div style={S.page}>
        <div style={S.card}>
          <div style={S.header}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>Pagar com PIX</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{plan.name} · {plan.price}/mês</div>
          </div>
          <div style={S.body}>
            {/* Timer */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>QR Code expira em</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 700, color: timeLeft < 300 ? '#e74c3c' : '#BA7517' }}>{formatTime(timeLeft)}</div>
            </div>

            {/* QR Code */}
            {pixData.pixImage ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <div style={{ padding: 12, background: '#fff', borderRadius: 16 }}>
                  <img src={pixData.pixImage} alt="QR Code PIX" style={{ width: 200, height: 200, display: 'block' }} />
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>Escaneie o QR code no seu banco</div>
            )}

            {/* Copia e cola */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Ou copie o código PIX:</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                <div style={{ flex: 1, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 11, color: 'rgba(255,255,255,0.4)', wordBreak: 'break-all', lineHeight: 1.5 }}>
                  {pixData.pixText?.slice(0, 60)}...
                </div>
                <button onClick={handleCopy} style={{ padding: '10px 14px', borderRadius: 10, background: copied ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${copied ? 'rgba(39,174,96,0.3)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', color: copied ? '#27ae60' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {copied ? <><CheckIcon /> Copiado</> : <><CopyIcon /> Copiar</>}
                </button>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(186,117,23,0.06)', border: '1px solid rgba(186,117,23,0.15)', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 20 }}>
              Após o pagamento, seu plano é ativado automaticamente em até 1 minuto.
            </div>

            <button onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, color: 'rgba(255,255,255,0.3)', fontSize: 13, cursor: 'pointer' }}>
              Já paguei, ir para o painel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={S.page}>
      <div style={S.card}>
        {/* Header */}
        <div style={S.header}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#fff' }}>{plan.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>Assinatura mensal · cancele quando quiser</div>
            </div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#BA7517' }}>{plan.price}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>/mês</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>PIX aprovação imediata</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(186,117,23,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#BA7517' }}>
              <PixIcon />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>Pix</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>QR Code gerado na hora</div>
            </div>
          </div>

          {/* CPF */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }}>CPF do pagador</label>
            <input
              style={S.input}
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(formatCpf(e.target.value))}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#e74c3c', marginBottom: 14, padding: '10px 12px', borderRadius: 8, background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)' }}>
              {error}
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading || cpf.replace(/\D/g, '').length !== 11}
            style={S.btn(!loading && cpf.replace(/\D/g, '').length === 11)}
          >
            {loading ? (
              <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <><PixIcon /> Gerar QR Code · {plan.price}</>
            )}
          </button>

          <button onClick={() => navigate('/dashboard')} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
            Continuar no plano grátis
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
            <LockIcon />
            <span>Pagamento seguro via PagBank</span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}