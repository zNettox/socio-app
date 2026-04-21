import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const CHAT_DEMO = [
  { from: 'user', text: 'Quanto devo cobrar por uma escova progressiva em Manaus?' },
  { from: 'ai', text: 'Com base nos custos do seu salão e no mercado de Manaus, o preço ideal está entre R$180 e R$220. Cobrar menos que R$165 gera prejuízo.' },
  { from: 'user', text: 'Gera uma proposta para minha cliente' },
  { from: 'ai', text: 'Proposta gerada — Salão da Cleusa · Escova Progressiva · R$195 · PDF pronto para enviar.' },
]

// Entrepreneur photo avatar
const EntrepreneurAvatar = () => (
  <div style={{
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    flexShrink: 0,
    border: '1.5px solid rgba(255,255,255,0.1)'
  }}>
    <img
      src="/empreendedora.jpg"
      alt="Empreendedora"
      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
    />
  </div>
)

// Sócio AI logo avatar
const SocioAvatar = () => (
  <svg width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#111"/>
    <text x="10" y="46" fontSize="48" fontWeight="600" fill="#F2F2F2" fontFamily="Inter, sans-serif">S</text>
    <circle cx="44" cy="18" r="5" fill="#D4A373"/>
  </svg>
)

const NevesMark = () => (
  <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text x="10" y="46" fontSize="48" fontWeight="600" fill="#F2F2F2" fontFamily="Inter, sans-serif">S</text>
    <circle cx="44" cy="18" r="3.2" fill="#D4A373"/>
  </svg>
)

const IconPricing = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="2" y="6" width="24" height="16" rx="3" stroke="#BA7517" strokeWidth="1.5"/>
    <circle cx="14" cy="14" r="4" stroke="#BA7517" strokeWidth="1.5"/>
    <path d="M2 11h4M22 11h4M2 17h4M22 17h4" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconProposal = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M7 3h10l6 6v16H7V3z" stroke="#BA7517" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M17 3v6h6" stroke="#BA7517" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M11 13h8M11 17h6M11 21h4" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconAssistant = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="3" y="5" width="22" height="15" rx="2" stroke="#BA7517" strokeWidth="1.5"/>
    <path d="M7 20l3 4M21 20l-3 4" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="10" cy="12.5" r="1.5" fill="#BA7517"/>
    <circle cx="14" cy="12.5" r="1.5" fill="#BA7517"/>
    <circle cx="18" cy="12.5" r="1.5" fill="#BA7517"/>
  </svg>
)
const IconContent = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="3" y="3" width="10" height="10" rx="2" stroke="#BA7517" strokeWidth="1.5"/>
    <rect x="15" y="3" width="10" height="10" rx="2" stroke="#BA7517" strokeWidth="1.5"/>
    <rect x="3" y="15" width="10" height="10" rx="2" stroke="#BA7517" strokeWidth="1.5"/>
    <rect x="15" y="15" width="10" height="10" rx="2" stroke="#BA7517" strokeWidth="1.5"/>
  </svg>
)
const IconCash = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M4 20l5-6 4 4 5-8 6 5" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4v20h20" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)
const IconMessage = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <rect x="3" y="4" width="22" height="16" rx="2" stroke="#BA7517" strokeWidth="1.5"/>
    <path d="M3 20l5 4v-4" stroke="#BA7517" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M9 11h10M9 15h6" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const FEATURES = [
  { Icon: IconPricing, title: 'Precificação inteligente', desc: 'Calcula o preço justo com base nos seus custos e no mercado da sua cidade em tempo real.' },
  { Icon: IconProposal, title: 'Proposta em PDF', desc: 'Gera propostas profissionais em segundos. Com logo, valor e condições — pronta para enviar.' },
  { Icon: IconAssistant, title: 'Assistente do negócio', desc: 'Tira dúvidas, sugere promoções e te ajuda a crescer com base no seu segmento.' },
  { Icon: IconContent, title: 'Conteúdo para redes', desc: 'Cria legendas e promoções prontas para Instagram e WhatsApp — é só copiar e postar.' },
  { Icon: IconCash, title: 'Controle de caixa', desc: 'Entradas, saídas e sobra do mês. Simples como anotar no caderno, mas muito mais inteligente.' },
  { Icon: IconMessage, title: 'Respostas para clientes', desc: 'Modelos prontos de mensagem para WhatsApp — orçamento, cobrança e confirmação.' },
]

// Pricing calculations
// Monthly: R$49,90/mo (first month R$19,90)
// Annual PIX: R$499,90/year = R$41,66/mo → saving R$98,90 vs monthly (16.5% off)
// Annual Credit: R$19,90 + 11×R$49,90 = R$19,90 + R$548,90 = R$568,80/year = R$47,40/mo

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">
    <circle cx="7" cy="7" r="6" stroke="#BA7517" strokeWidth="1"/>
    <path d="M4.5 7l2 2 3-3" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const PRO_ITEMS = [
  'Precificação com dados de mercado real',
  'Propostas ilimitadas em PDF',
  'Assistente personalizado para o seu negócio',
  'Conteúdo pronto para Instagram e WhatsApp',
  'Controle de caixa completo',
  'Respostas prontas para clientes',
]

function PricingSection({ navigate }) {
  const [billing, setBilling] = useState('mensal')

  const fmt = (n) => n.toFixed(2).replace('.', ',')

  // Preços únicos — sem distinção PIX/cartão
  // Mensal: valor cheio (1º mês promocional no cartão recorrente)
  // Trimestral: R$99,90 Pro / R$179,90 Biz — economiza vs mensal
  // Anual: R$349,90 Pro / R$649,90 Biz — melhor custo-benefício

  const prices = {
    pro:  { mensal: 49.90, trimestral: 129.90, anual: 399.90 },
    biz:  { mensal: 89.90, trimestral: 234.90, anual: 719.90 },
  }

  const perMonth = {
    pro:  { mensal: 49.90, trimestral: 43.30, anual: 33.33 },
    biz:  { mensal: 89.90, trimestral: 78.30, anual: 59.99 },
  }

  const savings = {
    pro:  { trimestral: ((49.90*3) - 129.90).toFixed(2), anual: ((49.90*12) - 399.90).toFixed(2) },
    biz:  { trimestral: ((89.90*3) - 234.90).toFixed(2), anual: ((89.90*12) - 719.90).toFixed(2) },
  }

  const discPct = {
    pro:  { trimestral: Math.round((1 - 129.90/(49.90*3))*100), anual: Math.round((1 - 399.90/(49.90*12))*100) },
    biz:  { trimestral: Math.round((1 - 234.90/(89.90*3))*100), anual: Math.round((1 - 719.90/(89.90*12))*100) },
  }

  const periodLabel = { mensal: 'mês', trimestral: 'trimestre', anual: 'ano' }

  const PriceBlock = ({ plan }) => {
    const p = prices[plan]
    const pm = perMonth[plan]
    const s = savings[plan]
    const d = discPct[plan]
    const isHighlight = plan === 'pro'
    const color = isHighlight ? 'text-[#BA7517]' : 'text-white/60'

    if (billing === 'mensal') return (
      <motion.div key="mensal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="flex items-baseline gap-1">
          <span className={`font-syne font-black text-4xl leading-none ${color}`}>R${fmt(p.mensal)}</span>
          <span className="text-white/30 text-sm">/mês</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#BA7517]/20 text-[#FAC775] border border-[#BA7517]/20 font-medium">
            1º mês R${plan === 'pro' ? '19,90' : '49,90'} no cartão
          </span>
        </div>
        <div className="text-xs text-white/30 mt-1">PIX ou cartão • cancele quando quiser</div>
      </motion.div>
    )

    return (
      <motion.div key={billing} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <div className="flex items-baseline gap-1">
          <span className={`font-syne font-black text-4xl leading-none ${color}`}>R${fmt(p[billing])}</span>
          <span className="text-white/30 text-sm">/{periodLabel[billing]}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-medium">
            R${fmt(pm[billing])}/mês
          </span>
          <span className="text-xs text-green-400">{d[billing]}% off — economize R${s[billing].replace('.', ',')}</span>
        </div>
        <div className="text-xs text-white/30 mt-1">PIX ou cartão • cobrado de uma vez</div>
      </motion.div>
    )
  }

  return (
    <section className="max-w-6xl mx-auto px-8 py-24">
      <div className="mb-12">
        <div className="text-xs font-medium text-[#BA7517] tracking-[0.2em] uppercase mb-4">Planos</div>
        <h2 className="font-syne font-black text-[40px] tracking-tight mb-2">Simples e sem surpresa.</h2>
        <p className="text-white/40 text-sm">Cancele quando quiser. Sem multa, sem burocracia.</p>
      </div>

      {/* Billing toggle */}
      <div className="flex flex-wrap items-center gap-4 mb-10">
        <div className="flex items-center bg-white/[0.05] border border-white/[0.08] rounded-xl p-1">
          {[
            { id: 'mensal', label: 'Mensal' },
            { id: 'trimestral', label: 'Trimestral' },
            { id: 'anual', label: 'Anual' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setBilling(id)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                billing === id ? 'bg-[#BA7517] text-white' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <AnimatePresence>
          {billing === 'trimestral' && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-[#BA7517]/15 text-[#FAC775] border border-[#BA7517]/20">
              Até 13% de desconto
            </motion.span>
          )}
          {billing === 'anual' && (
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
              Até 33% de desconto
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-6">

        {/* Free */}
        <div className="p-8 border border-white/[0.08] rounded-xl bg-[#0f0f0f]">
          <div className="font-syne font-black text-xl mb-1 text-white/80">Grátis</div>
          <div className="font-syne font-black text-4xl text-white/60 leading-none">R$0</div>
          <div className="text-sm text-white/30 mt-2 mb-7 pb-7 border-b border-white/[0.07]">
            Para conhecer o Sócio sem compromisso.
          </div>
          <div className="space-y-3 mb-8">
            {['Precificação básica', '3 propostas por mês', 'Assistente limitado'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm text-white/45">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-lg text-sm font-medium border border-white/15 text-white/50 hover:border-white/30 hover:text-white transition-all duration-200 active:scale-95">
            Criar conta grátis
          </button>
        </div>

        {/* Pro */}
        <div className="p-8 border-2 border-[#BA7517]/60 rounded-xl bg-[#BA7517]/[0.05] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#BA7517]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div className="font-syne font-black text-xl text-white">Pro</div>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#BA7517] text-white">Mais popular</span>
          </div>
          <div className="relative z-10 min-h-[80px]">
            <AnimatePresence mode="wait">
              <PriceBlock key={billing + 'pro'} plan="pro" />
            </AnimatePresence>
          </div>
          <div className="border-t border-white/[0.08] my-6" />
          <div className="space-y-3 mb-8 relative z-10">
            {PRO_ITEMS.map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm text-white/65">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-lg text-sm font-medium bg-[#BA7517] text-white hover:bg-[#9a6113] transition-all duration-200 active:scale-95 relative z-10">
            {billing === 'mensal' ? 'Começar por R$19,90' : `Assinar por R$${fmt(prices.pro[billing])}`}
          </button>
        </div>

        {/* Business */}
        <div className="p-8 border border-white/[0.08] rounded-xl bg-[#0f0f0f] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.02] rounded-full blur-xl pointer-events-none" />
          <div className="font-syne font-black text-xl text-white/80 mb-3 relative z-10">Business</div>
          <div className="relative z-10 min-h-[80px]">
            <AnimatePresence mode="wait">
              <PriceBlock key={billing + 'biz'} plan="biz" />
            </AnimatePresence>
          </div>
          <div className="border-t border-white/[0.07] my-6" />
          <div className="space-y-3 mb-8 relative z-10">
            {['Tudo do plano Pro', 'Até 5 usuários na conta', 'Relatórios avançados de caixa', 'Histórico completo de propostas', 'Suporte prioritário por WhatsApp'].map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckIcon />
                <span className="text-sm text-white/50">{item}</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-lg text-sm font-medium border border-white/15 text-white/50 hover:border-white/30 hover:text-white transition-all duration-200 active:scale-95 relative z-10">
            {billing === 'mensal' ? 'Começar por R$49,90' : `Assinar por R$${fmt(prices.biz[billing])}`}
          </button>
        </div>
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center gap-6 mt-10">
        {[
          { icon: '🔒', text: 'Pagamento 100% seguro' },
          { icon: '↩', text: 'Cancele quando quiser' },
          { icon: '📋', text: 'Sem contrato de fidelidade' },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-xs text-white/30">
            <span className="text-base">{icon}</span>
            {text}
          </div>
        ))}
      </div>
    </section>
  )
}


export default function Landing() {
  const navigate = useNavigate()
  const [visibleMessages, setVisibleMessages] = useState(0)

  useEffect(() => {
    if (visibleMessages < CHAT_DEMO.length) {
      const timer = setTimeout(() => setVisibleMessages(v => v + 1), 1400)
      return () => clearTimeout(timer)
    }
  }, [visibleMessages])

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ebe0]" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/[0.07] sticky top-0 bg-[#080808]/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <NevesMark />
          <div>
            <div className="font-syne font-black text-lg leading-none tracking-tight">
              sócio<span className="text-[#BA7517]">.</span>
            </div>
            <div className="text-[10px] text-white/30 tracking-widest uppercase leading-none mt-0.5">by Neves Software</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Produto', id: 'produto' },
            { label: 'Para quem', id: 'para-quem' },
            { label: 'Planos', id: 'planos' },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="text-sm text-white/40 hover:text-white/80 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2">Entrar</button>
          <button onClick={() => navigate('/login')} className="text-sm font-medium bg-[#BA7517] text-white px-5 py-2.5 rounded-lg hover:bg-[#9a6113] transition-colors">
            Começar grátis
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]">
          <svg viewBox="0 0 900 500" fill="none" className="w-full h-full">
            <circle cx="450" cy="250" r="220" stroke="#BA7517" strokeWidth="0.8"/>
            <circle cx="450" cy="250" r="160" stroke="#BA7517" strokeWidth="0.6"/>
            <circle cx="450" cy="250" r="100" stroke="#BA7517" strokeWidth="0.5"/>
            <line x1="0" y1="250" x2="900" y2="250" stroke="#BA7517" strokeWidth="0.4"/>
            <line x1="450" y1="0" x2="450" y2="500" stroke="#BA7517" strokeWidth="0.4"/>
            <circle cx="450" cy="30" r="5" fill="#BA7517"/>
            <circle cx="670" cy="250" r="5" fill="#BA7517"/>
            <circle cx="450" cy="470" r="5" fill="#BA7517"/>
            <circle cx="230" cy="250" r="5" fill="#BA7517"/>
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-24 grid md:grid-cols-2 gap-20 items-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border border-[#BA7517]/30 text-[#BA7517] mb-8 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-[#BA7517]" />
              Lançamento — Neves Software 2025
            </div>
            <h1 className="font-syne font-black text-[52px] leading-[1.0] tracking-[-2px] mb-7">
              O sócio que todo<br />
              pequeno negócio<br />
              <span className="text-[#BA7517]">precisava.</span>
            </h1>
            <p className="text-white/45 text-[17px] leading-[1.8] mb-10 max-w-md font-light">
              Assistente que precifica seus serviços, cria propostas profissionais e gerencia seu negócio — em português, do jeito brasileiro.
            </p>
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/login')} className="font-medium bg-[#BA7517] text-white px-7 py-3.5 rounded-lg hover:bg-[#9a6113] transition-all duration-200 active:scale-95 text-sm">
                Testar grátis agora
              </button>
              <button className="text-sm text-white/40 hover:text-white/70 transition-colors">Ver demonstração →</button>
            </div>
            <div className="flex items-center gap-10 mt-14 pt-10 border-t border-white/[0.07]">
              {[['25M+', 'MEIs no Brasil'], ['R$0', 'Para começar'], ['3 min', 'Primeira proposta']].map(([n, l]) => (
                <div key={l}>
                  <div className="font-syne font-black text-2xl text-[#BA7517]">{n}</div>
                  <div className="text-xs text-white/35 mt-1 tracking-wide">{l}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Chat demo */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="border border-white/[0.08] rounded-2xl bg-[#0f0f0f] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.07]">
              <SocioAvatar />
              <div>
                <div className="text-sm font-medium text-white/80">Sócio Assistente</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-white/30">online agora</span>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-5 min-h-[300px]">
              <AnimatePresence>
                {CHAT_DEMO.slice(0, visibleMessages).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`flex gap-3 items-end ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="flex-shrink-0">
                      {msg.from === 'ai' ? <SocioAvatar /> : <EntrepreneurAvatar />}
                    </div>
                    <div className={`max-w-[72%] flex flex-col gap-1 ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-white/25 px-1">{msg.from === 'ai' ? 'Sócio' : 'Você'}</span>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.from === 'user'
                          ? 'rounded-br-sm bg-[#BA7517]/25 text-[#FAC775] border border-[#BA7517]/20'
                          : 'rounded-bl-sm bg-white/[0.06] text-white/75 border border-white/[0.08]'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleMessages < CHAT_DEMO.length && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 items-end">
                  <SocioAvatar />
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/[0.06] border border-white/[0.08] flex items-center gap-1.5">
                    {[0, 150, 300].map(delay => (
                      <span key={delay} className="w-1.5 h-1.5 rounded-full bg-[#BA7517]/60 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-white/[0.07] flex items-center gap-3">
              <div className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white/25">
                Pergunte algo para o seu Sócio...
              </div>
              <button className="w-8 h-8 rounded-lg bg-[#BA7517] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M7 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="border-t border-white/[0.06]" />

      {/* Features */}
      <section id="produto" className="max-w-6xl mx-auto px-8 py-24">
        <div className="mb-16">
          <div className="text-xs font-medium text-[#BA7517] tracking-[0.2em] uppercase mb-4">Funcionalidades</div>
          <h2 className="font-syne font-black text-[40px] tracking-tight leading-tight">
            Tudo que seu negócio<br />precisa em um lugar só.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-white/[0.06]">
          {FEATURES.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="bg-[#080808] p-8 hover:bg-[#0f0f0f] transition-colors duration-300 group"
            >
              <div className="mb-6 opacity-60 group-hover:opacity-100 transition-opacity duration-300"><Icon /></div>
              <h3 className="font-syne font-bold text-[15px] mb-3 text-white/90">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>


      <div className="border-t border-white/[0.06]" />

      {/* Para quem */}
      <section id="para-quem" className="max-w-6xl mx-auto px-8 py-24">
        <div className="mb-16">
          <div className="text-xs font-medium text-[#BA7517] tracking-[0.2em] uppercase mb-4">Para quem</div>
          <h2 className="font-syne font-black text-[40px] tracking-tight leading-tight max-w-xl">
            Feito para quem trabalha<br />por conta própria.
          </h2>
          <p className="text-white/40 mt-4 text-base max-w-lg leading-relaxed">
            Se você tem um negócio e cobra pelo seu trabalho, o Sócio foi feito pra você.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="10" r="5" stroke="#BA7517" strokeWidth="1.5"/>
                  <path d="M6 28 Q6 20 16 20 Q26 20 26 28" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M20 6 Q24 5 26 8" stroke="#D4A373" strokeWidth="1.2" strokeLinecap="round"/>
                  <circle cx="26" cy="10" r="3" stroke="#D4A373" strokeWidth="1.2"/>
                </svg>
              ),
              title: 'Salões e barbearias',
              subtitle: 'Cleusa, Marcos, Amanda...',
              desc: 'Defina o preço certo para cada serviço, gere propostas para pacotes e saiba exatamente o que entra e sai do caixa no mês.',
              tags: ['Escova', 'Corte', 'Progressiva', 'Coloração'],
              color: 'from-purple-900/20 to-transparent',
              border: 'border-purple-500/20',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="8" width="24" height="18" rx="2" stroke="#BA7517" strokeWidth="1.5"/>
                  <path d="M10 8 V5 Q10 3 12 3 H20 Q22 3 22 5 V8" stroke="#BA7517" strokeWidth="1.5"/>
                  <path d="M10 16h12M10 20h8" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ),
              title: 'Freelancers e criativos',
              subtitle: 'Designers, fotógrafos, redatores...',
              desc: 'Pare de cobrar barato por intuição. Calcule o valor real da sua hora, gere propostas profissionais e feche mais contratos.',
              tags: ['Design', 'Fotografia', 'Conteúdo', 'Video'],
              color: 'from-blue-900/20 to-transparent',
              border: 'border-blue-500/20',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M4 24 Q4 14 10 12 L16 10 L22 12 Q28 14 28 24Z" stroke="#BA7517" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="16" cy="8" r="4" stroke="#BA7517" strokeWidth="1.5"/>
                  <path d="M12 18 Q16 22 20 18" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ),
              title: 'Marmitarias e confeiteiros',
              subtitle: 'Mario, Fernanda, Dona Célia...',
              desc: 'Calcule o custo por unidade, defina preços que geram lucro de verdade e crie cardápios digitais prontos para compartilhar no WhatsApp.',
              tags: ['Marmita', 'Bolo', 'Salgado', 'Delivery'],
              color: 'from-orange-900/20 to-transparent',
              border: 'border-orange-500/20',
            },
            {
              icon: (
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 28 V16 L16 6 L24 16 V28" stroke="#BA7517" strokeWidth="1.5" strokeLinejoin="round"/>
                  <rect x="13" y="20" width="6" height="8" rx="1" stroke="#BA7517" strokeWidth="1.5"/>
                  <path d="M4 16 L16 4 L28 16" stroke="#BA7517" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ),
              title: 'Prestadores de serviço',
              subtitle: 'Eletricistas, marceneiros, pintores...',
              desc: 'Monte orçamentos detalhados em minutos, controle materiais e mão de obra, e envie propostas profissionais direto pelo celular.',
              tags: ['Elétrica', 'Marcenaria', 'Pintura', 'Reforma'],
              color: 'from-green-900/20 to-transparent',
              border: 'border-green-500/20',
            },
          ].map((persona, i) => (
            <motion.div
              key={persona.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative p-8 rounded-2xl border bg-gradient-to-br ${persona.color} ${persona.border} overflow-hidden group`}
            >
              {/* Background glow */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.02] rounded-full blur-2xl pointer-events-none group-hover:bg-white/[0.04] transition-all duration-500" />

              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  {persona.icon}
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/30 italic">{persona.subtitle}</div>
                </div>
              </div>

              <h3 className="font-syne font-black text-xl mb-3 relative z-10">{persona.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6 relative z-10">{persona.desc}</p>

              <div className="flex flex-wrap gap-2 relative z-10">
                {persona.tags.map(tag => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonial-style quote */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-8 border border-[#BA7517]/20 rounded-2xl bg-[#BA7517]/[0.03] flex flex-col md:flex-row items-center gap-8"
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10">
            <img src="/empreendedora.jpg" alt="Empreendedora" className="w-full h-full object-cover object-top" />
          </div>
          <div className="flex-1">
            <p className="text-white/70 text-base leading-relaxed italic mb-3">
              "Eu cobrava R$120 pela progressiva sem saber se tava ganhando ou perdendo. O Sócio mostrou que meu custo real era R$98 — quase prejuízo. Hoje cobro R$195 e minha agenda tá cheia do mesmo jeito."
            </p>
            <div className="text-sm text-[#BA7517] font-medium">Cleusa M. — Salão de Beleza, Manaus</div>
          </div>
        </motion.div>
      </section>
      <div id="planos"><PricingSection navigate={navigate} /></div>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-8 pb-16">
        <div className="border border-[#BA7517]/20 rounded-2xl p-14 text-center bg-[#BA7517]/[0.03] relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <svg viewBox="0 0 800 200" fill="none" className="w-full h-full">
              <path d="M0 100 Q200 20 400 100 Q600 180 800 100" stroke="#BA7517" strokeWidth="1"/>
              <path d="M0 130 Q200 50 400 130 Q600 210 800 130" stroke="#BA7517" strokeWidth="0.5"/>
            </svg>
          </div>
          <h2 className="font-syne font-black text-[36px] tracking-tight mb-4 relative z-10">Comece hoje, sem cartão de crédito.</h2>
          <p className="text-white/40 mb-8 relative z-10">Junte-se a milhares de pequenos empresários que já usam o Sócio.</p>
          <button onClick={() => navigate('/login')} className="bg-[#BA7517] text-white font-medium px-8 py-3.5 rounded-lg hover:bg-[#9a6113] transition-all duration-200 active:scale-95 text-sm relative z-10">
            Criar minha conta grátis
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-8 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <NevesMark />
            <div>
              <div className="font-syne font-black text-base leading-none">sócio<span className="text-[#BA7517]">.</span></div>
              <div className="text-[10px] text-white/25 tracking-widest uppercase mt-0.5">Neves Software</div>
            </div>
          </div>
          <div className="flex items-center gap-8 text-sm text-white/30">
            {['Termos de uso', 'Privacidade', 'Contato'].map(item => (
              <button key={item} className="hover:text-white/60 transition-colors">{item}</button>
            ))}
          </div>
          <div className="text-xs text-white/20">© 2025 Neves Software. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  )
}