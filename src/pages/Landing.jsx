import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ── Noise texture SVG ──────────────────────────────────────────────────────
const NoiseBg = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#noise)"/>
  </svg>
)

// ── Animated gradient orbs ─────────────────────────────────────────────────
const Orb = ({ x, y, size, color, delay = 0 }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: 'blur(80px)', opacity: 0.12 }}
    animate={{ scale: [1, 1.15, 1], opacity: [0.10, 0.16, 0.10] }}
    transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
)

// ── Chat demo ──────────────────────────────────────────────────────────────
const CHAT = [
  { from: 'user', text: 'Quanto devo cobrar por uma escova progressiva?' },
  { from: 'ai', text: 'Com base nos custos do seu salão e no mercado de Manaus, o preço ideal é entre R$180 e R$220. Cobrar menos que R$165 gera prejuízo.' },
  { from: 'user', text: 'Gera uma proposta para minha cliente' },
  { from: 'ai', text: '✓ Proposta gerada — Salão da Cleusa · Escova Progressiva · R$195 · PDF pronto.' },
]

const SocioMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <text x="8" y="48" fontSize="52" fontWeight="700" fill="#F2F2F2" fontFamily="'Syne', sans-serif">S</text>
    <circle cx="46" cy="16" r="5" fill="#D4A373"/>
  </svg>
)

const FEATURES = [
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="1" y="5" width="20" height="13" rx="2.5" stroke="#BA7517" strokeWidth="1.4"/><circle cx="11" cy="11.5" r="3.5" stroke="#BA7517" strokeWidth="1.4"/><path d="M1 9h3M18 9h3M1 14h3M18 14h3" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    title: 'Precificação inteligente',
    desc: 'Descobre o preço certo baseado nos seus custos reais e no mercado da sua cidade.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 2h9l5 5v13H5V2z" stroke="#BA7517" strokeWidth="1.4" strokeLinejoin="round"/><path d="M14 2v5h5" stroke="#BA7517" strokeWidth="1.4" strokeLinejoin="round"/><path d="M8 11h6M8 14h4" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    title: 'Propostas em PDF',
    desc: 'Gera propostas profissionais em segundos. Com logo, valor e condições.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="4" width="18" height="13" rx="2" stroke="#BA7517" strokeWidth="1.4"/><path d="M2 17l4 3v-3" stroke="#BA7517" strokeWidth="1.4" strokeLinejoin="round"/><circle cx="8.5" cy="10.5" r="1.2" fill="#BA7517"/><circle cx="11" cy="10.5" r="1.2" fill="#BA7517"/><circle cx="13.5" cy="10.5" r="1.2" fill="#BA7517"/></svg>,
    title: 'Assistente 24h',
    desc: 'Responde dúvidas, sugere promoções e te ajuda a crescer com base no seu segmento.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 16l4.5-5 3.5 3.5 4-6 4 4" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 3v16h16" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    title: 'Controle de caixa',
    desc: 'Entradas, saídas e gráficos. Simples como anotar no caderno, poderoso como planilha.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="2" y="2" width="8" height="8" rx="1.5" stroke="#BA7517" strokeWidth="1.4"/><rect x="12" y="2" width="8" height="8" rx="1.5" stroke="#BA7517" strokeWidth="1.4"/><rect x="2" y="12" width="8" height="8" rx="1.5" stroke="#BA7517" strokeWidth="1.4"/><rect x="12" y="12" width="8" height="8" rx="1.5" stroke="#BA7517" strokeWidth="1.4"/></svg>,
    title: 'Conteúdo para redes',
    desc: 'Cria legendas e promoções prontas para Instagram e WhatsApp.',
  },
  {
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="#BA7517" strokeWidth="1.4"/><path d="M11 7v4l3 2" stroke="#BA7517" strokeWidth="1.4" strokeLinecap="round"/></svg>,
    title: 'Histórico completo',
    desc: 'Todas as conversas, propostas e dados do seu negócio salvos e organizados.',
  },
]

const PRICING = {
  pro:  { mensal: 49.90, trimestral: 129.90, anual: 399.90 },
  biz:  { mensal: 89.90, trimestral: 234.90, anual: 719.90 },
}

const fmt = n => n.toFixed(2).replace('.', ',')

export default function Landing() {
  const navigate = useNavigate()
  const [visibleChat, setVisibleChat] = useState(0)
  const [billing, setBilling] = useState('mensal')
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  useEffect(() => {
    if (visibleChat < CHAT.length) {
      const t = setTimeout(() => setVisibleChat(v => v + 1), 1300)
      return () => clearTimeout(t)
    }
  }, [visibleChat])

  const periodLabel = { mensal: 'mês', trimestral: 'trimestre', anual: 'ano' }
  const proPerMonth = { mensal: 49.90, trimestral: 43.30, anual: 33.33 }
  const bizPerMonth = { mensal: 89.90, trimestral: 78.30, anual: 59.99 }

  return (
    <div className="min-h-screen bg-[#060606] text-white overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── GLOBAL STYLES ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .grad-text { background: linear-gradient(135deg, #fff 0%, #D4A373 50%, #BA7517 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .grad-border { position: relative; }
        .grad-border::before { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, rgba(186,117,23,0.5), rgba(212,163,115,0.1), rgba(186,117,23,0.3)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        .glow-btn { box-shadow: 0 0 0 0 rgba(186,117,23,0); transition: box-shadow 0.3s; }
        .glow-btn:hover { box-shadow: 0 0 30px 4px rgba(186,117,23,0.35); }
        .card-hover { transition: transform 0.3s, box-shadow 0.3s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .marquee { display: flex; gap: 3rem; animation: marquee 20s linear infinite; }
        .marquee-wrap { overflow: hidden; mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 md:py-4"
        style={{ background: 'rgba(6,6,6,0.7)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2.5">
          <SocioMark size={28} />
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 17, letterSpacing: '-0.5px', lineHeight: 1 }}>
              sócio<span style={{ color: '#BA7517' }}>.</span>
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 1, marginTop: 2 }}>by Neves Software</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Produto', 'Para quem', 'Planos'].map(item => (
            <button key={item} style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.9)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
              onClick={() => document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' })}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/login')} style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', padding: '8px 16px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.target.style.color = '#fff'}
            onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}>
            Entrar
          </button>
          <button onClick={() => navigate('/login')} className="glow-btn"
            style={{ fontSize: 13, fontWeight: 500, background: '#BA7517', color: '#fff', padding: '9px 22px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.target.style.background = '#9a6113'}
            onMouseLeave={e => e.target.style.background = '#BA7517'}>
            Começar grátis
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <NoiseBg />
        <Orb x="10%" y="10%" size={500} color="radial-gradient(circle, #BA7517, transparent)" delay={0} />
        <Orb x="60%" y="50%" size={400} color="radial-gradient(circle, #D4A373, transparent)" delay={2} />
        <Orb x="80%" y="5%" size={300} color="radial-gradient(circle, #BA7517, transparent)" delay={4} />

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* Left */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.25)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#BA7517' }} />
                  <span style={{ fontSize: 12, color: '#D4A373', fontWeight: 500, letterSpacing: '0.05em' }}>Lançamento — Neves Software 2025</span>
                </div>

                <h1 className="grad-text" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(48px, 6vw, 76px)', lineHeight: 1.0, letterSpacing: '-3px', marginBottom: 28 }}>
                  O sócio que<br />todo negócio<br />precisava.
                </h1>

                <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: 460, marginBottom: 40, fontWeight: 300 }}>
                  Assistente inteligente que precifica seus serviços, cria propostas e gerencia seu negócio — em português, para autônomos e MEIs brasileiros.
                </p>

                <div className="flex items-center gap-4 flex-wrap">
                  <button onClick={() => navigate('/login')} className="glow-btn"
                    style={{ fontSize: 15, fontWeight: 500, background: '#BA7517', color: '#fff', padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#9a6113'}
                    onMouseLeave={e => e.currentTarget.style.background = '#BA7517'}>
                    Testar grátis agora →
                  </button>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Sem cartão de crédito</span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-10 mt-14 pt-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {[['25M+', 'MEIs no Brasil'], ['R$0', 'Para começar'], ['3min', 'Primeira proposta']].map(([n, l]) => (
                    <div key={l}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, color: '#BA7517', lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4, letterSpacing: '0.03em' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right — Chat UI */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="grad-border" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>

                {/* Window chrome */}
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>SÓCIO — assistente do negócio</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>online</span>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ padding: '24px 20px', minHeight: 280, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <AnimatePresence>
                    {CHAT.slice(0, visibleChat).map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 items-end ${msg.from === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: msg.from === 'ai' ? '#111' : 'rgba(255,255,255,0.08)', border: msg.from === 'ai' ? '1px solid rgba(186,117,23,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                          {msg.from === 'ai'
                            ? <SocioMark size={20} />
                            : <img src="/empreendedora.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                          }
                        </div>
                        <div style={{ maxWidth: '75%' }}>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 4, paddingLeft: 4 }}>{msg.from === 'ai' ? 'Sócio' : 'Você'}</div>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: msg.from === 'ai' ? '14px 14px 14px 4px' : '14px 14px 4px 14px',
                            fontSize: 13,
                            lineHeight: 1.6,
                            background: msg.from === 'ai' ? 'rgba(255,255,255,0.05)' : 'rgba(186,117,23,0.2)',
                            color: msg.from === 'ai' ? 'rgba(255,255,255,0.75)' : '#FAC775',
                            border: `1px solid ${msg.from === 'ai' ? 'rgba(255,255,255,0.06)' : 'rgba(186,117,23,0.2)'}`,
                          }}>{msg.text}</div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {visibleChat < CHAT.length && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#111', border: '1px solid rgba(186,117,23,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SocioMark size={20} />
                      </div>
                      <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[0, 150, 300].map(d => <motion.div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(186,117,23,0.6)' }} animate={{ y: [-3, 0, -3] }} transition={{ duration: 0.8, repeat: Infinity, delay: d / 1000 }} />)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                    Pergunte algo para o seu Sócio...
                  </div>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M7 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-10 left-1/2 -translate-x-1/2" animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <div style={{ width: 22, height: 36, borderRadius: 11, border: '1.5px solid rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <motion.div style={{ width: 3, height: 8, borderRadius: 2, background: '#BA7517' }} animate={{ opacity: [1, 0, 1], y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* ── MARQUEE ─────────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="marquee-wrap">
          <div className="marquee">
            {[...Array(2)].map((_, rep) =>
              ['Precificação Inteligente', 'Propostas em PDF', 'Controle de Caixa', 'Conteúdo para Instagram', 'Assistente 24h', 'Histórico de Conversas', 'Serviços Criativos', 'Suporte Prioritário'].map((t, i) => (
                <span key={`${rep}-${i}`} style={{ fontSize: 13, color: 'rgba(255,255,255,0.2)', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3rem' }}>
                  {t} <span style={{ color: '#BA7517', fontSize: 16 }}>✦</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="produto" style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 20px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <div style={{ fontSize: 11, color: '#BA7517', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>Funcionalidades</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 80 }}>
            Tudo em um lugar só.<br />
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>Sem complicação.</span>
          </h2>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2, background: 'rgba(255,255,255,0.04)' }}>
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} className="card-hover"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.07 }}
              style={{ background: '#060606', padding: '36px 32px', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = '#0d0d0d'}
              onMouseLeave={e => e.currentTarget.style.background = '#060606'}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(186,117,23,0.08)', border: '1px solid rgba(186,117,23,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                {f.icon}
              </div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{f.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOR WHO ─────────────────────────────────────────────────────── */}
      <section id="para-quem" style={{ background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '80px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div style={{ fontSize: 11, color: '#BA7517', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>Para quem</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 16 }}>
              Feito para quem<br />trabalha por conta própria.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', marginBottom: 64, maxWidth: 500 }}>
              Se você tem um negócio e cobra pelo seu trabalho, o Sócio foi feito pra você.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { emoji: '💇', title: 'Salões & Barbearias', names: 'Cleusa, Marcos, Amanda...', desc: 'Precifique cada serviço, gere propostas e controle o caixa do mês.' },
              { emoji: '📸', title: 'Freelancers & Criativos', names: 'Designers, fotógrafos...', desc: 'Calcule o valor real da sua hora e feche mais contratos.' },
              { emoji: '🍱', title: 'Marmitarias & Docerias', names: 'Mario, Fernanda, Dona Célia...', desc: 'Defina preços que geram lucro de verdade.' },
              { emoji: '⚡', title: 'Prestadores de serviço', names: 'Eletricistas, marceneiros...', desc: 'Monte orçamentos em minutos e envie profissionalmente.' },
            ].map((p, i) => (
              <motion.div key={p.title} className="grad-border card-hover"
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{ borderRadius: 16, background: 'rgba(255,255,255,0.02)', padding: '28px 24px' }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>{p.emoji}</div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 12 }}>{p.names}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{p.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="grad-border" style={{ borderRadius: 20, background: 'rgba(186,117,23,0.04)', padding: '36px 40px', marginTop: 24, display: 'flex', gap: 32, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(186,117,23,0.3)', flexShrink: 0 }}>
              <img src="/empreendedora.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
            <div>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontStyle: 'italic', marginBottom: 12 }}>
                "Eu cobrava R$120 pela progressiva sem saber se tava ganhando ou perdendo. O Sócio mostrou que meu custo real era R$98 — quase prejuízo. Hoje cobro R$195 e a agenda tá cheia."
              </p>
              <div style={{ fontSize: 13, color: '#BA7517', fontWeight: 500 }}>Cleusa M. — Salão de Beleza, Manaus</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────── */}
      <section id="planos" style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 20px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ fontSize: 11, color: '#BA7517', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 500 }}>Planos</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(36px, 4vw, 52px)', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: 48 }}>
            Simples e sem surpresa.
          </h2>
        </motion.div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4 }}>
            {[['mensal', 'Mensal'], ['trimestral', 'Trimestral'], ['anual', 'Anual']].map(([id, label]) => (
              <button key={id} onClick={() => setBilling(id)} style={{
                padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: billing === id ? '#BA7517' : 'transparent',
                color: billing === id ? '#fff' : 'rgba(255,255,255,0.4)',
              }}>{label}</button>
            ))}
          </div>
          <AnimatePresence>
            {billing !== 'mensal' && (
              <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{ fontSize: 12, padding: '6px 12px', borderRadius: 20, background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', fontWeight: 500 }}>
                Economize até {billing === 'trimestral' ? '13%' : '33%'}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {/* Free */}
          {[
            { name: 'Grátis', price: 'R$0', priceNote: null, perMonth: null, items: ['Precificação básica', '3 propostas por mês', 'Assistente limitado'], cta: 'Criar conta grátis', highlight: false },
            { name: 'Pro', priceNote: billing === 'mensal' ? '1º mês R$19,90' : null, items: ['Precificação com mercado real', 'Propostas ilimitadas em PDF', 'Assistente personalizado', 'Controle de caixa completo', 'Conteúdo para redes sociais'], cta: billing === 'mensal' ? 'Começar por R$19,90' : `Assinar por R$${fmt(PRICING.pro[billing])}`, highlight: true },
            { name: 'Business', priceNote: billing === 'mensal' ? '1º mês R$49,90' : null, items: ['Tudo do Pro', 'Até 5 usuários', 'Relatórios avançados', 'Suporte prioritário por WhatsApp'], cta: billing === 'mensal' ? 'Começar por R$49,90' : `Assinar por R$${fmt(PRICING.biz[billing])}`, highlight: false },
          ].map((plan, pi) => (
            <motion.div key={plan.name} className={plan.highlight ? 'grad-border' : ''}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: pi * 0.1 }}
              style={{ borderRadius: 20, background: plan.highlight ? 'rgba(186,117,23,0.06)' : 'rgba(255,255,255,0.02)', border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.06)', padding: 32, position: 'relative', overflow: 'hidden' }}>

              {plan.highlight && (
                <div style={{ position: 'absolute', top: 20, right: 20, fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, background: '#BA7517', color: '#fff', letterSpacing: '0.03em' }}>Mais popular</div>
              )}

              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{plan.name}</div>

              {pi === 0 ? (
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 40, color: 'rgba(255,255,255,0.5)', lineHeight: 1, marginBottom: 4 }}>R$0</div>
              ) : (
                <>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 36, color: plan.highlight ? '#BA7517' : 'rgba(255,255,255,0.6)', lineHeight: 1, marginBottom: 4 }}>
                    R${fmt(pi === 1 ? PRICING.pro[billing] : PRICING.biz[billing])}
                    <span style={{ fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>/{periodLabel[billing]}</span>
                  </div>
                  {billing !== 'mensal' && (
                    <div style={{ fontSize: 12, color: '#4ade80', marginBottom: 4 }}>
                      R${fmt(pi === 1 ? proPerMonth[billing] : bizPerMonth[billing])}/mês — economize vs mensal
                    </div>
                  )}
                  {plan.priceNote && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(186,117,23,0.15)', color: '#FAC775', border: '1px solid rgba(186,117,23,0.2)', fontWeight: 500, marginBottom: 4 }}>
                      {plan.priceNote}
                    </div>
                  )}
                </>
              )}

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {plan.items.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                      <circle cx="7" cy="7" r="6" stroke="#BA7517" strokeWidth="1"/>
                      <path d="M4.5 7l2 2 3-3" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item}</span>
                  </div>
                ))}
              </div>

              <button onClick={() => navigate('/login')} style={{
                width: '100%', padding: '12px 0', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s', border: 'none',
                background: plan.highlight ? '#BA7517' : 'rgba(255,255,255,0.06)',
                color: plan.highlight ? '#fff' : 'rgba(255,255,255,0.5)',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = plan.highlight ? '#9a6113' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = plan.highlight ? '#BA7517' : 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = plan.highlight ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Trust */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 32 }}>
          {[['🔒', 'Pagamento seguro'], ['↩', 'Cancele quando quiser'], ['📋', 'Sem contrato']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
              <span style={{ fontSize: 14 }}>{icon}</span>{text}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 20px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="grad-border" style={{ maxWidth: 1100, margin: '0 auto', borderRadius: 24, background: 'rgba(186,117,23,0.04)', padding: '80px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(186,117,23,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-2px', marginBottom: 16 }}>
              Comece hoje.<br /><span style={{ color: '#BA7517' }}>Zero risco.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 36, maxWidth: 400, margin: '0 auto 36px' }}>
              Crie sua conta grátis em menos de 1 minuto. Sem cartão de crédito.
            </p>
            <button onClick={() => navigate('/login')} className="glow-btn"
              style={{ fontSize: 15, fontWeight: 500, background: '#BA7517', color: '#fff', padding: '16px 40px', borderRadius: 14, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#9a6113'}
              onMouseLeave={e => e.currentTarget.style.background = '#BA7517'}>
              Criar minha conta grátis →
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SocioMark size={24} />
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, lineHeight: 1 }}>sócio<span style={{ color: '#BA7517' }}>.</span></div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2 }}>Neves Software</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Termos de uso', 'Privacidade', 'Contato'].map(t => (
              <button key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.25)'}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>© 2025 Neves Software</div>
        </div>
      </footer>
    </div>
  )
}