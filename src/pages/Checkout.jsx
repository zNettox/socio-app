import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth, db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

const PLANS = {
  pro:      { name: 'Sócio Pro', price: 'R$49,90', amount: 4990 },
  business: { name: 'Sócio Business', price: 'R$89,90', amount: 8990 },
}

// public key buscada via funcao

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planKey = searchParams.get('plan') || 'pro'
  const plan = PLANS[planKey] || PLANS.pro

  const [method, setMethod] = useState('pix') // 'pix' | 'card'
  const [cpf, setCpf] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form') // 'form' | 'pix' | 'success'
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
    // Busca chave publica do PagBank
    fetch("/.netlify/functions/get-pagbank-pubkey").then(r=>r.json()).then(d=>{ if(d.publicKey) window._pagbankKey = d.publicKey })
    // Load PagBank SDK for card encryption
    if (!sdkLoaded.current) {
      const script = document.createElement('script')
      script.src = 'https://assets.pagseguro.com.br/checkout-sdk/js/pagSeguro.min.js'
      script.async = true
      document.body.appendChild(script)
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
  const formatExpiry = v => {
    const n = v.replace(/\D/g, '').slice(0,4)
    return n.length > 2 ? n.slice(0,2) + '/' + n.slice(2) : n
  }
  const formatTime = s => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`

  const canPay = () => {
    const rawCpf = cpf.replace(/\D/g, '')
    if (rawCpf.length !== 11) return false
    if (method === 'card') {
      return cardNumber.replace(/\s/g,'').length === 16 && cardName.length > 2 && cardExpiry.length === 5 && cardCvv.length >= 3
    }
    return true
  }

  const handlePay = async () => {
    if (!userData || !canPay()) return
    setError('')
    setLoading(true)
    try {
      const rawCpf = cpf.replace(/\D/g, '')
      let body = {
        plan: planKey,
        userName: userData.businessName || userData.profileName || 'Cliente',
        userEmail: userData.email,
        userCpf: rawCpf,
        userId: userData.uid,
        paymentMethod: method === 'pix' ? 'PIX' : 'CREDIT_CARD',
      }

      if (method === 'card') {
        // Encrypt card with PagBank SDK
        if (!window.PagSeguro || !window._pagbankKey) throw new Error('SDK de pagamento não carregado')
        const [expM, expY] = cardExpiry.split('/')
        const enc = await window.PagSeguro.encryptCard({
          publicKey: window._pagbankKey,
          holder: cardName,
          number: cardNumber.replace(/\s/g, ''),
          expMonth: expM,
          expYear: '20' + expY,
          securityCode: cardCvv,
        })
        if (enc.hasErrors) throw new Error('Dados do cartão inválidos')
        body.cardEncrypted = enc.encryptedCard
        body.cardHolder = cardName
      }

      const res = await fetch('/.netlify/functions/create-pagbank-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao processar pagamento')

      if (data.type === 'pix') {
        setPixData(data)
        setStep('pix')
      } else {
        setStep('success')
      }
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

  // ─── PIX Screen ────────────────────────────────────────────────────────
  if (step === 'pix' && pixData) return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-8 font-dm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
        <div className="p-5 border-b border-black/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-syne font-bold text-[#1D1D1F] text-base">{plan.name}</p>
              <p className="text-xs text-black/40 mt-0.5">PIX · aprovação imediata</p>
            </div>
            <p className="font-syne font-extrabold text-[#0066CC] text-xl">{plan.price}</p>
          </div>
        </div>
        <div className="p-5">
          <div className="text-center mb-4">
            <p className="text-xs text-black/40 mb-1">Expira em</p>
            <p className={`font-syne font-bold text-2xl ${timeLeft < 300 ? 'text-red-500' : 'text-[#1D1D1F]'}`}>{formatTime(timeLeft)}</p>
          </div>
          {pixData.pixImage && (
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-white border border-black/10 rounded-xl">
                <img src={pixData.pixImage} alt="QR Code PIX" className="w-48 h-48" />
              </div>
            </div>
          )}
          <p className="text-xs text-black/40 mb-2">Código PIX copia e cola:</p>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 px-3 py-2.5 rounded-xl bg-[#F5F5F7] text-xs text-black/40 break-all leading-relaxed">
              {pixData.pixText?.slice(0, 50)}...
            </div>
            <button onClick={handleCopy} className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all whitespace-nowrap flex items-center gap-1.5 ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-[#F5F5F7] border-black/10 text-black/50 hover:bg-[#E8E8ED]'}`}>
              {copied ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="px-4 py-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-600 leading-relaxed mb-4">
            Após o pagamento, seu plano é ativado automaticamente em até 1 minuto.
          </div>
          <button onClick={() => navigate('/dashboard')} className="w-full py-3 rounded-xl text-sm text-black/30 hover:text-black/50 transition-colors">
            Já paguei, ir para o painel
          </button>
        </div>
      </div>
    </div>
  )

  // ─── Success Screen ─────────────────────────────────────────────────────
  if (step === 'success') return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 font-dm">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-black/5 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <p className="font-syne font-bold text-[#1D1D1F] text-xl mb-2">Pagamento aprovado!</p>
        <p className="text-sm text-black/40 mb-6">Seu plano {plan.name} foi ativado com sucesso.</p>
        <button onClick={() => navigate('/dashboard')} className="w-full py-3 rounded-xl bg-[#0066CC] text-white font-medium text-sm hover:bg-[#0055AA] transition-colors">
          Ir para o painel
        </button>
      </div>
    </div>
  )

  // ─── Form Screen ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-8 font-dm">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-syne font-bold text-[#1D1D1F] text-lg">{plan.name}</p>
              <p className="text-xs text-black/40 mt-0.5">Assinatura mensal · cancele quando quiser</p>
            </div>
            <div className="text-right">
              <p className="font-syne font-extrabold text-[#0066CC] text-2xl">{plan.price}</p>
              <p className="text-[10px] text-black/25">/mês</p>
            </div>
          </div>
        </div>

        {/* Method tabs */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 mb-3">
          <p className="text-xs text-black/40 mb-3">Forma de pagamento</p>
          <div className="flex gap-2 mb-5">
            {[
              { id: 'pix', label: 'PIX', sub: 'Aprovação imediata' },
              { id: 'card', label: 'Cartão', sub: 'Crédito' },
            ].map(m => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`flex-1 py-3 px-3 rounded-xl border text-left transition-all ${method === m.id ? 'border-[#0066CC] bg-blue-50' : 'border-black/10 bg-[#F5F5F7] hover:bg-[#EBEBF0]'}`}>
                <p className={`text-sm font-medium ${method === m.id ? 'text-[#0066CC]' : 'text-[#1D1D1F]'}`}>{m.label}</p>
                <p className={`text-xs mt-0.5 ${method === m.id ? 'text-blue-400' : 'text-black/30'}`}>{m.sub}</p>
              </button>
            ))}
          </div>

          {/* CPF sempre visível */}
          <div className="mb-3">
            <label className="text-xs text-black/40 block mb-1.5">CPF do titular</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F7] text-[#1D1D1F] text-sm outline-none focus:border-[#0066CC] focus:bg-white transition-all font-dm"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(formatCpf(e.target.value))}
            />
          </div>

          {/* Card fields */}
          <AnimatePresence>
            {method === 'card' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                <div>
                  <label className="text-xs text-black/40 block mb-1.5">Número do cartão</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F7] text-[#1D1D1F] text-sm outline-none focus:border-[#0066CC] focus:bg-white transition-all font-dm tracking-wider"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    maxLength={19}
                  />
                </div>
                <div>
                  <label className="text-xs text-black/40 block mb-1.5">Nome no cartão</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F7] text-[#1D1D1F] text-sm outline-none focus:border-[#0066CC] focus:bg-white transition-all font-dm uppercase"
                    placeholder="NOME COMO NO CARTÃO"
                    value={cardName}
                    onChange={e => setCardName(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-black/40 block mb-1.5">Validade</label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F7] text-[#1D1D1F] text-sm outline-none focus:border-[#0066CC] focus:bg-white transition-all font-dm"
                      placeholder="MM/AA"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                      maxLength={5}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-black/40 block mb-1.5">CVV</label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border border-black/10 bg-[#F5F5F7] text-[#1D1D1F] text-sm outline-none focus:border-[#0066CC] focus:bg-white transition-all font-dm"
                      placeholder="000"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                      maxLength={4}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-500 mb-3">
            {error}
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={loading || !canPay()}
          className={`w-full py-4 rounded-2xl font-medium text-sm transition-all mb-2 flex items-center justify-center gap-2 ${canPay() && !loading ? 'bg-[#0066CC] hover:bg-[#0055AA] text-white shadow-sm' : 'bg-black/5 text-black/20 cursor-not-allowed'}`}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            `${method === 'pix' ? 'Gerar QR Code PIX' : 'Pagar com Cartão'} · ${plan.price}`
          )}
        </button>

        <button onClick={() => navigate('/dashboard')} className="w-full py-3 text-sm text-black/25 hover:text-black/40 transition-colors">
          Continuar no plano grátis
        </button>

        <p className="text-center text-xs text-black/20 mt-4 flex items-center justify-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Pagamento seguro via PagBank
        </p>
      </div>
    </div>
  )
}