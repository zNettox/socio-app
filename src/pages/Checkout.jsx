import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { auth } from '../firebase'

const PLAN_INFO = {
  pro_mensal_promo: { label: 'Pro — Primeiro mês', price: 'R$19,90', desc: 'Depois R$49,90/mês' },
  pro_mensal: { label: 'Pro — Mensal', price: 'R$49,90', desc: 'Cancele quando quiser' },
  pro_trimestral_pix: { label: 'Pro — Trimestral PIX', price: 'R$119,76', desc: '20% off — R$39,92/mês' },
  pro_anual_pix: { label: 'Pro — Anual PIX', price: 'R$389,22', desc: '35% off — R$32,44/mês' },
  biz_mensal_promo: { label: 'Business — Primeiro mês', price: 'R$49,90', desc: 'Depois R$89,90/mês' },
  biz_mensal: { label: 'Business — Mensal', price: 'R$89,90', desc: 'Cancele quando quiser' },
  biz_trimestral_pix: { label: 'Business — Trimestral PIX', price: 'R$215,76', desc: '20% off — R$71,92/mês' },
  biz_anual_pix: { label: 'Business — Anual PIX', price: 'R$701,22', desc: '35% off — R$58,44/mês' },
}

export default function Checkout() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const planKey = params.get('plan') || 'pro_mensal_promo'
  const planInfo = PLAN_INFO[planKey] || PLAN_INFO['pro_mensal_promo']

  const [form, setForm] = useState({ name: '', cpf: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [pix, setPix] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const user = auth.currentUser

  const handlePay = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const [plan, ...billingParts] = planKey.split('_')
    const billing = billingParts.join('_')

    try {
      const res = await fetch('/.netlify/functions/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          billing,
          userName: form.name,
          userEmail: user?.email,
          userPhone: form.phone.replace(/\D/g, ''),
          userDocument: form.cpf.replace(/\D/g, ''),
          userId: user?.uid,
        }),
      })

      const data = await res.json()

      if (data?.pix_qr_code || data?.pix_code) {
        setPix({
          qrCode: data.pix_qr_code,
          copyPaste: data.pix_code || data.pix_copy_paste,
          hash: data.hash,
        })
      } else {
        setError('Erro ao gerar PIX. Tente novamente.')
        console.error(data)
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyPix = () => {
    navigator.clipboard.writeText(pix.copyPaste)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ebe0] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <button onClick={() => navigate(-1)} className="text-white/40 hover:text-white/70 text-sm mb-8 flex items-center gap-2 transition-colors">
          ← Voltar
        </button>

        <div className="font-syne font-black text-2xl mb-1">
          sócio<span className="text-[#BA7517]">.</span>
        </div>
        <p className="text-white/40 text-sm mb-8">Finalizar assinatura</p>

        {/* Plan summary */}
        <div className="border border-[#BA7517]/30 rounded-xl p-5 mb-6 bg-[#BA7517]/[0.04]">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-syne font-bold text-base">{planInfo.label}</div>
              <div className="text-xs text-white/40 mt-0.5">{planInfo.desc}</div>
            </div>
            <div className="font-syne font-black text-2xl text-[#BA7517]">{planInfo.price}</div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.07] flex items-center gap-2 text-xs text-green-400">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#4ade80" strokeWidth="1"/>
              <path d="M3.5 6l2 2 3-3" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Pagamento via PIX — aprovação instantânea
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!pix ? (
            <motion.form key="form" onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">Nome completo</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">CPF</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))}
                  className="input-field"
                  required
                  maxLength={14}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1.5 block">WhatsApp</label>
                <input
                  type="text"
                  placeholder="(92) 99999-9999"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
              {error && (
                <div className="text-red-400 text-sm px-4 py-3 rounded-xl bg-red-400/10 border border-red-400/20">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  `Gerar PIX — ${planInfo.price}`
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="pix"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="text-4xl mb-4">✅</div>
              <h2 className="font-syne font-black text-xl mb-2">PIX gerado!</h2>
              <p className="text-white/40 text-sm mb-6">
                Copie o código abaixo e pague no seu banco. Aprovação em segundos.
              </p>

              {pix.qrCode && (
                <div className="flex justify-center mb-5">
                  <img src={pix.qrCode} alt="QR Code PIX" className="w-48 h-48 rounded-xl border border-white/10" />
                </div>
              )}

              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-4 mb-4 text-left">
                <div className="text-xs text-white/30 mb-2">Código PIX copia e cola</div>
                <div className="text-xs text-white/60 break-all leading-relaxed font-mono">
                  {pix.copyPaste}
                </div>
              </div>

              <button
                onClick={copyPix}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  copied
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-[#BA7517] text-white hover:bg-[#9a6113]'
                }`}
              >
                {copied ? '✓ Copiado!' : 'Copiar código PIX'}
              </button>

              <p className="text-xs text-white/30 mt-4">
                Após o pagamento, seu plano é ativado automaticamente em até 1 minuto.
              </p>

              <button
                onClick={() => navigate('/dashboard')}
                className="text-sm text-white/40 hover:text-white/70 mt-4 transition-colors"
              >
                Ir para o dashboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}