import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const NoiseBg = () => (
  <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
    <filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter>
    <rect width="100%" height="100%" filter="url(#noise)"/>
  </svg>
)

const Orb = ({ x, y, size, color, delay = 0 }) => (
  <motion.div className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: 'blur(80px)', opacity: 0.12 }}
    animate={{ scale: [1, 1.15, 1], opacity: [0.10, 0.16, 0.10] }}
    transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }} />
)

const SocioMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <text x="8" y="48" fontSize="52" fontWeight="700" fill="#F2F2F2" fontFamily="'Syne', sans-serif">S</text>
    <circle cx="46" cy="16" r="5" fill="#D4A373"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6" stroke="#BA7517" strokeWidth="1"/>
    <path d="M4.5 7l2 2 3-3" stroke="#BA7517" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const CHAT = [
  { from: 'user', text: 'Quanto devo cobrar por uma escova progressiva?' },
  { from: 'ai', text: 'Com base nos custos do seu salão em Manaus, o preço ideal é entre R$180 e R$220. Cobrar menos que R$165 gera prejuízo.' },
  { from: 'user', text: 'Cria uma proposta para minha cliente' },
  { from: 'ai', text: '✓ Proposta gerada — Salão da Cleusa · Escova Progressiva · R$195 · PDF pronto para enviar.' },
]

const FEATURES = [
  { title: 'Precificação inteligente', desc: 'Descobre o preço certo baseado nos seus custos reais e no mercado da sua cidade.' },
  { title: 'Propostas em PDF', desc: 'Gera propostas profissionais em segundos. Com logo, valor e condições.' },
  { title: 'Assistente 24h', desc: 'Responde dúvidas, sugere promoções e te ajuda a crescer com base no seu segmento.' },
  { title: 'Controle de caixa', desc: 'Entradas, saídas e gráficos. Simples como anotar no caderno, poderoso como planilha.' },
  { title: 'Conteúdo para redes', desc: 'Cria legendas e promoções prontas para Instagram e WhatsApp.' },
  { title: 'Histórico completo', desc: 'Todas as conversas, propostas e dados do seu negócio salvos e organizados.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [visibleChat, setVisibleChat] = useState(0)
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

  return (
    <div style={{ minHeight: '100vh', background: '#060606', color: '#fff', overflowX: 'hidden', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .grad-text { background: linear-gradient(135deg, #fff 0%, #D4A373 50%, #BA7517 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .grad-border { position: relative; }
        .grad-border::before { content: ''; position: absolute; inset: -1px; border-radius: inherit; padding: 1px; background: linear-gradient(135deg, rgba(186,117,23,0.5), rgba(212,163,115,0.1), rgba(186,117,23,0.3)); -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; }
        .glow-btn:hover { box-shadow: 0 0 30px 4px rgba(186,117,23,0.35); }
        .card-hover { transition: transform 0.3s, box-shadow 0.3s; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .marquee { display: flex; gap: 3rem; animation: marquee 20s linear infinite; }
        .marquee-wrap { overflow: hidden; mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 60, background: 'rgba(6,6,6,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <SocioMark size={26} />
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', lineHeight: 1 }}>sócio<span style={{ color: '#BA7517' }}>.</span></div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 1 }}>by Neves Software</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/login')} style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 12px' }}>Entrar</button>
          <button onClick={() => navigate('/login')} className="glow-btn" style={{ fontSize: 13, fontWeight: 500, background: '#BA7517', color: '#fff', padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
            Começar grátis
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80, overflow: 'hidden' }}>
        <NoiseBg />
        <Orb x="5%" y="10%" size={400} color="radial-gradient(circle, #BA7517, transparent)" delay={0} />
        <Orb x="65%" y="40%" size={350} color="radial-gradient(circle, #D4A373, transparent)" delay={2} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))', gap: 48, alignItems: 'center' }}>

            {/* Left */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, padding: '6px 14px', borderRadius: 20, background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.25)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#BA7517' }} />
                <span style={{ fontSize: 11, color: '#D4A373', fontWeight: 500, letterSpacing: '0.05em' }}>Lançamento — Neves Software 2025</span>
              </div>
              <h1 className="grad-text" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(42px, 6vw, 72px)', lineHeight: 1.0, letterSpacing: '-2px', marginBottom: 24 }}>
                O sócio que<br />todo negócio<br />precisava.
              </h1>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.8, maxWidth: 440, marginBottom: 36, fontWeight: 300 }}>
                Assistente inteligente que precifica seus serviços, cria propostas e gerencia seu negócio — em português, para MEIs brasileiros.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/login')} className="glow-btn" style={{ fontSize: 15, fontWeight: 500, background: '#BA7517', color: '#fff', padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
                  Testar grátis →
                </button>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Sem cartão de crédito</span>
              </div>
              <div style={{ display: 'flex', gap: 32, marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap' }}>
                {[['25M+', 'MEIs no Brasil'], ['R$0', 'Para começar'], ['3min', 'Primeira proposta']].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: '#BA7517', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — Chat Demo */}
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}>
              <div className="grad-border" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
                  </div>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>SÓCIO — assistente</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80' }} />
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>online</span>
                  </div>
                </div>
                <div style={{ padding: '20px 18px', minHeight: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <AnimatePresence>
                    {CHAT.slice(0, visibleChat).map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexDirection: msg.from === 'user' ? 'row-reverse' : 'row' }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: msg.from === 'ai' ? '#111' : 'rgba(255,255,255,0.07)', border: `1px solid ${msg.from === 'ai' ? 'rgba(186,117,23,0.25)' : 'rgba(255,255,255,0.08)'}` }}>
                          {msg.from === 'ai' ? <SocioMark size={18} /> : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="4.5" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2"/><path d="M1.5 12c0-2.5 2.4-4 5.5-4s5.5 1.5 5.5 4" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round"/></svg>}
                        </div>
                        <div style={{ maxWidth: '78%', padding: '9px 12px', borderRadius: msg.from === 'ai' ? '12px 12px 12px 3px' : '12px 12px 3px 12px', fontSize: 12.5, lineHeight: 1.6, background: msg.from === 'ai' ? 'rgba(255,255,255,0.04)' : 'rgba(186,117,23,0.18)', color: msg.from === 'ai' ? 'rgba(255,255,255,0.75)' : '#FAC775', border: `1px solid ${msg.from === 'ai' ? 'rgba(255,255,255,0.06)' : 'rgba(186,117,23,0.2)'}` }}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {visibleChat < CHAT.length && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: '#111', border: '1px solid rgba(186,117,23,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><SocioMark size={18} /></div>
                      <div style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 3px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 4 }}>
                        {[0,0.15,0.3].map((d,i) => <motion.div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(186,117,23,0.6)' }} animate={{ y: [-3,0,-3] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />)}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>Pergunte algo para o seu Sócio...</div>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: '#BA7517', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5h9M7 3l4 3.5L7 10" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <motion.div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)' }} animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
          <div style={{ width: 20, height: 34, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.12)', display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
            <motion.div style={{ width: 3, height: 7, borderRadius: 2, background: '#BA7517' }} animate={{ opacity: [1,0,1], y: [0,8,0] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <div style={{ padding: '18px 0', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <div className="marquee-wrap">
          <div className="marquee">
            {[...Array(2)].map((_, r) =>
              ['Precificação Inteligente', 'Propostas em PDF', 'Controle de Caixa', 'Conteúdo para Instagram', 'Assistente 24h', 'Histórico de Conversas', 'Serviços Criativos', 'Suporte Prioritário'].map((t, i) => (
                <span key={`${r}-${i}`} style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '3rem' }}>
                  {t} <span style={{ color: '#BA7517' }}>✦</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ fontSize: 11, color: '#BA7517', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 500 }}>Funcionalidades</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 56 }}>
            Tudo em um lugar.<br /><span className="text-white/20">Sem complicação.</span>
          </h2>
        </motion.div>
        
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map((f, i) => (
            <motion.div 
              key={f.title} 
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass-card p-8 group overflow-hidden relative cursor-default"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#BA7517]/0 to-[#BA7517]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="w-8 h-8 rounded-full bg-[#BA7517]/10 flex items-center justify-center mb-6 border border-[#BA7517]/20 group-hover:border-[#BA7517]/50 transition-colors">
                 <div className="w-2 h-2 rounded-full bg-[#BA7517] group-hover:scale-150 transition-transform duration-300" />
              </div>
              <div className="font-syne font-bold text-lg mb-3 text-white/90 group-hover:text-[#FAC775] transition-colors">{f.title}</div>
              <div className="text-sm text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div style={{ fontSize: 11, color: '#BA7517', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14, fontWeight: 500 }}>Planos</div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 'clamp(30px, 4vw, 48px)', lineHeight: 1.1, letterSpacing: '-1.5px', marginBottom: 12 }}>
            Simples e sem surpresa.
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 48 }}>Cancele quando quiser. Sem multa, sem burocracia.</p>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              name: 'Grátis', price: 'R$0', sub: 'Para conhecer o Sócio',
              items: ['Precificação básica', '3 propostas por mês', 'Assistente limitado (10 msgs)'],
              cta: 'Criar conta grátis', highlight: false, free: true,
            },
            {
              name: 'Pro', price: 'R$49,90', sub: '/mês · recorrente',
              items: ['Precificação com mercado real', 'Propostas ilimitadas em PDF', 'Assistente personalizado', 'Controle de caixa completo', 'Conteúdo para redes sociais'],
              cta: 'Assinar Pro', highlight: true, free: false, link: 'https://pag.ae/81LgUyNcP/button',
            },
            {
              name: 'Business', price: 'R$89,90', sub: '/mês · recorrente',
              items: ['Tudo do plano Pro', 'Até 5 usuários na conta', 'Relatórios avançados de caixa', 'Suporte prioritário por WhatsApp'],
              cta: 'Assinar Business', highlight: false, free: false, link: 'https://pag.ae/81LgVm968/button',
            },
          ].map((plan, pi) => (
            <motion.div 
              key={plan.name}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`relative rounded-3xl p-8 flex flex-col transition-all duration-300 ${
                plan.highlight 
                  ? 'bg-gradient-to-b from-[#BA7517]/15 to-[#060606] border border-[#BA7517]/40 shadow-[0_0_40px_rgba(186,117,23,0.15)]' 
                  : 'glass-card border-white/10 hover:border-white/20'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#D4A373] to-[#BA7517] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                  Mais popular
                </div>
              )}

              <div className="font-syne font-bold text-lg text-white mb-2">{plan.name}</div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className={`font-syne font-extrabold text-4xl ${plan.highlight ? 'text-[#BA7517]' : 'text-white/70'}`}>
                  {plan.price}
                </span>
              </div>
              <div className="text-white/30 text-sm mb-6">{plan.sub}</div>

              <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mb-6" />

              <div className="flex-1 flex flex-col gap-4 mb-8">
                {plan.items.map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1"><CheckIcon /></div>
                    <span className="text-white/50 text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => plan.free ? navigate('/login') : window.open(plan.link, '_blank')}
                className={`w-full py-3.5 rounded-xl font-dm font-medium text-sm transition-all duration-300 ${
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

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 40, justifyContent: 'center' }}>
          {[['Pagamento via PagBank', '100% seguro'], ['Cancele quando quiser', 'Sem multa'], ['Sem contrato', 'Sem fidelidade']].map(([t, s]) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckIcon />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{t} — {s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '40px 24px 100px' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          whileInView={{ opacity: 1, scale: 1 }} 
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="grad-border relative max-w-4xl mx-auto rounded-3xl p-12 md:p-16 text-center overflow-hidden bg-[#0a0a0a]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#BA7517]/10 to-transparent pointer-events-none" />
          <motion.div 
            animate={{ 
              background: [
                'radial-gradient(circle at 20% 50%, rgba(186,117,23,0.15) 0%, transparent 60%)',
                'radial-gradient(circle at 80% 50%, rgba(186,117,23,0.15) 0%, transparent 60%)',
                'radial-gradient(circle at 20% 50%, rgba(186,117,23,0.15) 0%, transparent 60%)'
              ] 
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 pointer-events-none"
          />
          <div className="relative z-10">
            <h2 className="font-syne font-bold text-3xl md:text-5xl text-white mb-4">
              Pronto para ter seu <span className="text-[#BA7517]">sócio ideal</span>?
            </h2>
            <p className="text-white/40 text-base md:text-lg mb-8 max-w-lg mx-auto">
              Junte-se a milhares de empreendedores que estão profissionalizando seus negócios hoje mesmo.
            </p>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')} 
              className="glow-btn bg-[#BA7517] text-white font-dm font-medium px-8 py-4 rounded-xl text-base"
            >
              Começar grátis agora →
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SocioMark size={22} />
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14 }}>sócio<span style={{ color: '#BA7517' }}>.</span></div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 1 }}>Neves Software</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>© 2025 Neves Software — Manaus, AM</div>
        </div>
      </footer>
    </div>
  )
}