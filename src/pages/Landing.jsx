import React, { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ─── SVG Icons ────────────────────────────────────────────────────────────
const CheckIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="8" fill="#0066CC" fillOpacity="0.1"/><path d="M5.5 9l2.5 2.5 5-5" stroke="#0066CC" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
const SocioMark = ({ size = 32 }) => <svg width={size} height={size} viewBox="0 0 64 64" fill="none"><text x="8" y="48" fontSize="52" fontWeight="800" fill="#1D1D1F" fontFamily="'Syne', sans-serif">S</text><circle cx="46" cy="16" r="6" fill="#0066CC"/></svg>

// ─── Components ────────────────────────────────────────────────────────────
const Orb = ({ x, y, size, color, delay = 0 }) => (
  <motion.div className="absolute rounded-full pointer-events-none mix-blend-multiply"
    style={{ left: x, top: y, width: size, height: size, background: color, filter: 'blur(90px)', opacity: 0.15 }}
    animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -30, 0] }}
    transition={{ duration: 8 + delay, repeat: Infinity, ease: 'easeInOut', delay }} />
)

export default function Landing() {
  const navigate = useNavigate()
  const [visibleChat, setVisibleChat] = useState(0)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const CHAT = [
    { role: 'user', text: 'Sócio, cria uma proposta comercial de R$4.500 para gestão de redes sociais?' },
    { role: 'bot', text: 'Claro! Aqui está uma proposta profissional estruturada com escopo, cronograma e termos. Já gerei o PDF para você enviar ao cliente.' }
  ]

  useEffect(() => {
    if (visibleChat < CHAT.length) {
      const t = setTimeout(() => setVisibleChat(v => v + 1), 1500)
      return () => clearTimeout(t)
    }
  }, [visibleChat])

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] overflow-x-hidden font-dm selection:bg-apple-blue/20">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl"
      >
        <div className="glass-panel rounded-full px-6 py-3 flex items-center justify-between shadow-lg shadow-black/5">
          <div className="flex items-center gap-2">
            <SocioMark size={24} />
            <span className="font-syne font-bold text-lg tracking-tight">sócio<span className="text-apple-blue">.</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/login')} className="text-[14px] font-medium text-black/60 hover:text-black transition-colors hidden md:block">
              Entrar
            </button>
            <button onClick={() => navigate('/login')} className="bg-black text-white text-[13px] font-medium px-5 py-2.5 rounded-full hover:bg-black/80 transition-all active:scale-95">
              Começar grátis
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-[100svh] flex flex-col items-center justify-center pt-32 pb-24 overflow-hidden">
        <Orb x="10%" y="20%" size={400} color="#0066CC" />
        <Orb x="70%" y="40%" size={500} color="#5E5CE6" delay={2} />
        
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center mt-12 md:mt-20">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block py-1.5 px-4 rounded-full bg-apple-blue/10 text-apple-blue text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
              Sua inteligência artificial particular
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 1, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-syne font-extrabold text-5xl md:text-7xl lg:text-8xl leading-[1.05] tracking-tight mb-8"
          >
            O sócio <br className="hidden md:block" />
            <span className="grad-text">inteligente</span> <br className="hidden md:block" />
            do pequeno negócio.
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-black/70 text-lg md:text-2xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed"
          >
            Esqueça o tempo perdido criando propostas. O Sócio App gera documentos, organiza seu caixa e atende você via WhatsApp.
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button onClick={() => navigate('/login')} className="btn-primary text-lg px-8 py-4 w-full sm:w-auto shadow-xl shadow-apple-blue/20">
              Teste grátis agora
            </button>
            <span className="text-sm text-black/40">Não precisa de cartão de crédito</span>
          </motion.div>
        </motion.div>

        {/* Hero Chat Preview */}
        <motion.div 
          initial={{ y: 60, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 w-full max-w-3xl mx-auto mt-16 px-6"
        >
          <div className="glass-card p-6 md:p-8">
            <div className="flex gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex flex-col gap-6">
              <AnimatePresence>
                {CHAT.slice(0, visibleChat).map((msg, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 20, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] md:max-w-[70%] p-5 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-black text-white rounded-tr-sm' 
                        : 'bg-white border border-black/5 text-black/80 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────── */}
      <section className="py-32 px-6 bg-white relative z-20 rounded-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.03)] mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-syne font-bold text-4xl md:text-5xl mb-6 tracking-tight">Menos burocracia.<br/>Mais tempo para <span className="grad-text">vender</span>.</h2>
            <p className="text-black/50 text-xl max-w-2xl mx-auto">Tudo o que você precisa para parecer uma agência gigante, mesmo sendo apenas você.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Propostas em 30s', desc: 'Diga o que você vai fazer e o assistente gera um PDF lindo pronto para enviar ao cliente.', icon: '📄' },
              { title: 'Controle Financeiro', desc: 'Saiba exatamente quanto entra e quanto sai com uma interface simples que até uma criança entende.', icon: '💸' },
              { title: 'IA via WhatsApp', desc: 'Você pode conversar com o seu Sócio sem nem abrir o app. Mandou áudio, ele cria a proposta.', icon: '💬' }
            ].map((f, i) => (
              <motion.div 
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="card-hover bg-[#F5F5F7] border border-black/5 rounded-3xl p-8"
              >
                <div className="text-4xl mb-6 bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm">{f.icon}</div>
                <h3 className="font-syne font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-black/60 leading-relaxed text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          whileInView={{ opacity: 1, scale: 1 }} 
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-5xl mx-auto rounded-[40px] p-12 md:p-20 text-center overflow-hidden bg-black text-white"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-apple-indigo/30 via-transparent to-apple-blue/30 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="font-syne font-bold text-4xl md:text-6xl mb-6 tracking-tight">
              A evolução do seu negócio <br/>começa agora.
            </h2>
            <p className="text-white/60 text-lg md:text-xl mb-10 max-w-xl mx-auto">
              Junte-se aos empreendedores que estão deixando a concorrência para trás usando o Sócio.
            </p>
            <button onClick={() => navigate('/login')} className="bg-white text-black font-semibold px-8 py-4 rounded-full text-lg hover:scale-105 transition-transform active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
              Criar conta gratuita
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 py-8 px-6 max-w-5xl mx-auto mt-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <SocioMark size={24} />
            <div className="font-syne font-bold text-lg">sócio<span className="text-apple-blue">.</span></div>
          </div>
          <div className="text-[13px] text-black/40">© 2026 Neves Software. Todos os direitos reservados.</div>
        </div>
      </footer>
    </div>
  )
}