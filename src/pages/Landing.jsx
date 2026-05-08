import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ─── Logo ─────────────────────────────────────────────────────────────────
const SocioMark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <text x="8" y="48" fontSize="52" fontWeight="800" fill="#1D1D1F" fontFamily="'Syne', sans-serif">S</text>
    <circle cx="46" cy="16" r="6" fill="#0066CC"/>
  </svg>
)

// ─── Ambient orb (decorative, pointer-events-none) ─────────────────────────
const Orb = ({ x, y, size, color, delay = 0 }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: 'blur(100px)', opacity: 0.12 }}
    animate={{ scale: [1, 1.15, 1], x: [0, 20, 0], y: [0, -20, 0] }}
    transition={{ duration: 10 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
)

const CHAT = [
  { role: 'user', text: 'Sócio, cria uma proposta comercial de R$4.500 para gestão de redes sociais?' },
  { role: 'bot', text: 'Claro! Aqui está uma proposta profissional estruturada com escopo, cronograma e termos. Já gerei o PDF para você enviar ao cliente.' }
]

export default function Landing() {
  const navigate = useNavigate()
  const [visibleChat, setVisibleChat] = useState(0)

  useEffect(() => {
    if (visibleChat < CHAT.length) {
      const t = setTimeout(() => setVisibleChat(v => v + 1), 1500)
      return () => clearTimeout(t)
    }
  }, [visibleChat])

  return (
    <div className="bg-[#F5F5F7] text-[#1D1D1F] font-dm" style={{ overflowX: 'hidden' }}>

      {/* ── HEADER (floating pill, fully visible) ─────────────────────────── */}
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4"
      >
        <div className="w-full max-w-5xl bg-white/90 backdrop-blur-xl border border-black/8 rounded-full px-5 py-3 flex items-center justify-between shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-2">
            <SocioMark size={22} />
            <span className="font-syne font-bold text-[17px] tracking-tight">sócio<span className="text-[#0066CC]">.</span></span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold text-black/60 hover:text-black transition-colors hidden sm:block"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/login')}
              className="bg-black text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-black/80 transition-all active:scale-95"
            >
              Começar grátis
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      {/* pt-28 on mobile (header ~60px + 16px gap + buffer), pt-36 on desktop */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-28 sm:pt-32 pb-16 px-5 overflow-hidden">
        {/* Ambient orbs — positioned so they don't overflow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Orb x="5%" y="10%" size={350} color="#0066CC" />
          <Orb x="60%" y="30%" size={400} color="#5E5CE6" delay={3} />
        </div>

        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-[#0066CC]/10 text-[#0066CC] text-xs font-bold uppercase tracking-widest mb-6 border border-[#0066CC]/15">
              ✦ Sua inteligência artificial particular
            </span>
          </motion.div>

          {/* Main heading — clamped so it never overflows on mobile */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-syne font-extrabold tracking-tight text-[#1D1D1F] mb-6 leading-[1.05]"
            style={{ fontSize: 'clamp(2.2rem, 7vw, 5.5rem)' }}
          >
            O sócio{' '}
            <span className="bg-gradient-to-r from-[#0066CC] to-[#5E5CE6] bg-clip-text text-transparent">
              inteligente
            </span>{' '}
            do pequeno negócio.
          </motion.h1>

          {/* Sub-heading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[#444] font-medium leading-relaxed mb-10 max-w-2xl mx-auto"
            style={{ fontSize: 'clamp(1rem, 2.5vw, 1.25rem)' }}
          >
            Esqueça o tempo perdido criando propostas. O Sócio App gera documentos,
            organiza seu caixa e atende você via WhatsApp.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-[#0066CC] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#0052a3] hover:shadow-xl hover:shadow-[#0066CC]/25 transition-all active:scale-95"
            >
              Teste grátis agora →
            </button>
            <span className="text-sm font-medium text-black/50">Sem cartão de crédito</span>
          </motion.div>
        </div>

        {/* Chat preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative z-10 w-full max-w-2xl mx-auto mt-14 px-4"
        >
          <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.07)]">
            {/* Window dots */}
            <div className="flex gap-1.5 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex flex-col gap-4">
              <AnimatePresence>
                {CHAT.slice(0, visibleChat).map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 260 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-sm leading-relaxed font-medium ${
                      msg.role === 'user'
                        ? 'bg-[#1D1D1F] text-white rounded-tr-sm'
                        : 'bg-[#F5F5F7] text-[#1D1D1F] border border-black/5 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {visibleChat < CHAT.length && (
                <div className="flex gap-1.5 px-5 py-3">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <motion.div key={i} className="w-2 h-2 rounded-full bg-[#0066CC]/40"
                      animate={{ y: [-3, 0, -3] }} transition={{ duration: 0.8, repeat: Infinity, delay: d }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-5 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-syne font-bold tracking-tight text-[#1D1D1F] mb-4"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 3.5rem)' }}>
              Menos burocracia.<br />Mais tempo para{' '}
              <span className="bg-gradient-to-r from-[#0066CC] to-[#5E5CE6] bg-clip-text text-transparent">vender</span>.
            </h2>
            <p className="text-[#444] font-medium max-w-xl mx-auto" style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)' }}>
              Tudo que você precisa para parecer uma agência gigante, mesmo sendo só você.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: 'Propostas em 30s', desc: 'Diga o que vai fazer e o assistente gera um PDF lindo pronto para o cliente.', icon: '📄' },
              { title: 'Controle Financeiro', desc: 'Veja exatamente quanto entra e sai com uma interface simples e clara.', icon: '💸' },
              { title: 'Precificação inteligente', desc: 'Saiba exatamente quanto cobrar pelo seu serviço com base no mercado da sua cidade.', icon: '🎯' }
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[#F5F5F7] border border-black/5 rounded-3xl p-7 hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-sm">{f.icon}</div>
                <h3 className="font-syne font-bold text-lg text-[#1D1D1F] mb-2">{f.title}</h3>
                <p className="text-[#555] text-sm leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative max-w-4xl mx-auto rounded-[32px] p-12 md:p-16 text-center overflow-hidden bg-[#1D1D1F] text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#0066CC]/40 via-transparent to-[#5E5CE6]/30 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="font-syne font-bold text-white tracking-tight mb-4"
              style={{ fontSize: 'clamp(1.7rem, 4.5vw, 3.5rem)' }}>
              A evolução do seu negócio<br />começa agora.
            </h2>
            <p className="text-white/65 font-medium mb-8 max-w-lg mx-auto" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.1rem)' }}>
              Junte-se aos empreendedores deixando a concorrência para trás.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-white text-[#1D1D1F] font-bold px-8 py-4 rounded-full text-base hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Criar conta gratuita
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SocioMark size={20} />
            <span className="font-syne font-bold text-base">sócio<span className="text-[#0066CC]">.</span></span>
          </div>
          <p className="text-xs text-black/40 font-medium">© 2026 Neves Software. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}